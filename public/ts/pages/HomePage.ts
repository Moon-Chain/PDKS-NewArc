import Alpine from 'alpinejs';
import { BasePage } from '../core/BasePage.js';
import { api } from '../core/ApiClient.js';
import { state } from '../core/StateManager.js';
import { bus } from '../core/EventBus.js';
import { Toast } from '../components/Toast.js';
// QRScanner lazy import — sadece butona basıldığında yüklenir (+~80kb chunk ayrılır)
import type { AttendanceRow, AttendanceStatus } from '../../../shared/types/attendance.js';

interface TodayResponse { success: boolean; logs: AttendanceRow[]; status: AttendanceStatus; }
interface DayStats {
  present: number; presentList: Array<{id:string;name:string;detail:string}>;
  onLeave: number; onLeaveList:  Array<{id:string;name:string;detail:string}>;
  late:    number; lateList:     Array<{id:string;name:string;detail:string}>;
  absent:  number; absentList:   Array<{id:string;name:string;detail:string}>;
  totalStaff: number;
}

const COOLDOWN_MS = 60_000;

// IndexedDB — offline queue (HomePage.ts'deki orijinal implementasyon korunuyor)
function _openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('pdks-offline', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('attendance-queue', { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}
async function _enqueue(entry: { id: string; type: 'in'|'out'; qrValue: string; timestamp: string }) {
  const db = await _openDB();
  const tx = db.transaction('attendance-queue', 'readwrite');
  tx.objectStore('attendance-queue').put(entry);
  return new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(); });
}
async function _dequeueAll() {
  const db  = await _openDB();
  const req = db.transaction('attendance-queue', 'readonly').objectStore('attendance-queue').getAll();
  return new Promise<Array<{id:string;type:'in'|'out';qrValue:string;timestamp:string}>>((res, rej) => {
    req.onsuccess = () => res(req.result as never);
    req.onerror   = () => rej();
  });
}
async function _remove(id: string) {
  const db = await _openDB();
  db.transaction('attendance-queue', 'readwrite').objectStore('attendance-queue').delete(id);
}

// Module-level cleanup handles — destroy() tarafından çağrılır
let _cleanups: Array<() => void> = [];
let _cooldownTimer: ReturnType<typeof setInterval> | null = null;

Alpine.data('homePage', () => ({
  // Durum
  status:     { isInside: false, lastEntry: null } as AttendanceStatus,
  logs:       [] as AttendanceRow[],
  stats:      null as DayStats | null,
  role:       '' as string,
  loading:    true,
  isOnline:   navigator.onLine,
  currentIp:  '' as string,
  buttonsEnabled: true,

  // Cooldown
  cooldownSec: 0,
  cooldownPct: 0,
  get hasCooldown(): boolean { return this.cooldownSec > 0; },

  // Status computed
  get statusTime(): string | null {
    const e = this.status.lastEntry;
    if (!e) return null;
    return new Date(e.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  },

  async init() {
    const user = state.get('user') as { role: string } | null;
    this.role = user?.role ?? '';
    await this.loadData();
    this._watchOnline();
    this._bindSse();
    // Gerçek IP — PDKS-main gibi ipify.org'dan çek
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then((d: { ip: string }) => { this.currentIp = d.ip; })
      .catch(() => { this.currentIp = navigator.onLine ? 'Bağlı' : 'Çevrimdışı'; });
  },

  async loadData() {
    this.loading = true;
    try {
      const data = await api.get<TodayResponse>('/api/v1/attendance/today');
      this.logs   = data.logs;
      this.status = data.status;
    } catch { this.logs = []; }
    if (this.role === 'admin' || this.role === 'mudur') {
      try { this.stats = await api.get<DayStats>('/api/v1/attendance/stats'); }
      catch { this.stats = null; }
    }
    this.loading = false;
    this._startCooldown();
  },

  logTime(ts: string): string {
    return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  },

  async checkIn(type: 'in' | 'out') {
    const { QRScanner } = await import('../components/QRScanner.js');
    const qrValue = await QRScanner.open(document.getElementById('app')!, type);
    if (!qrValue) return;
    this.buttonsEnabled = false;

    // PDKS-main gibi GPS koordinatlarını al (izin verildiyse)
    let latitude: number | undefined;
    let longitude: number | undefined;
    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        latitude  = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch { /* GPS izni verilmedi veya timeout — devam et */ }
    }

    try {
      if (navigator.onLine) {
        await api.post('/api/v1/attendance', { type, qrValue, latitude, longitude });
        Toast.show(type === 'in' ? 'Giriş kaydedildi' : 'Çıkış kaydedildi', 'success');
        await this.loadData();
      } else {
        await _enqueue({ id: crypto.randomUUID(), type, qrValue, timestamp: new Date().toISOString() });
        this.status = { isInside: type === 'in', lastEntry: { type, timestamp: new Date().toISOString() } as AttendanceRow, cooldownMs: COOLDOWN_MS };
        this._startCooldown();
        Toast.show('Çevrimdışı kaydedildi', 'warning');
      }
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Kayıt başarısız', 'error');
      this.buttonsEnabled = true;
    }
  },

  _startCooldown() {
    if (_cooldownTimer) { clearInterval(_cooldownTimer); _cooldownTimer = null; }

    const tick = () => {
      if (!this.status.lastEntry) { this.cooldownSec = 0; this.buttonsEnabled = true; return; }
      const elapsed   = Date.now() - new Date(this.status.lastEntry.timestamp).getTime();
      const remaining = Math.max(0, COOLDOWN_MS - elapsed);
      this.cooldownSec = Math.ceil(remaining / 1000);
      this.cooldownPct = Math.round((remaining / COOLDOWN_MS) * 100);
      this.buttonsEnabled = remaining <= 0;
      if (remaining <= 0 && _cooldownTimer) { clearInterval(_cooldownTimer); _cooldownTimer = null; }
    };

    tick();
    if (this.cooldownSec > 0) _cooldownTimer = setInterval(tick, 500);
  },

  _watchOnline() {
    const onOnline = async () => {
      this.isOnline = true;
      const queue = await _dequeueAll();
      if (!queue.length) return;
      let synced = 0;
      for (const entry of queue) {
        try { await api.post('/api/v1/attendance', { type: entry.type, qrValue: entry.qrValue, isOffline: true }); await _remove(entry.id); synced++; }
        catch {}
      }
      if (synced > 0) { Toast.show(`${synced} kayıt senkronize edildi`, 'success'); await this.loadData(); }
    };
    const onOffline = () => { this.isOnline = false; };
    if (!navigator.onLine) onOffline();
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    _cleanups.push(() => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); });
  },

  _bindSse() {
    const unsub = bus.on('sse:attendance', async (data: unknown) => {
      const profile = state.get('profile') as { id: string } | null;
      if ((data as { userId: string }).userId === profile?.id) await this.loadData();
    });
    _cleanups.push(unsub as () => void);
  },

  openStatsModal(label: string, people: Array<{name:string;detail:string}>, colorKey: string) {
    const palette: Record<string, { avatarBg: string; avatarText: string; headerBg: string }> = {
      emerald: { avatarBg: 'rgba(34,197,94,0.2)',   avatarText: '#4ade80', headerBg: 'rgba(34,197,94,0.12)' },
      orange:  { avatarBg: 'rgba(249,115,22,0.2)',  avatarText: '#f97316', headerBg: 'rgba(249,115,22,0.12)' },
      red:     { avatarBg: 'rgba(239,68,68,0.2)',   avatarText: '#f87171', headerBg: 'rgba(239,68,68,0.12)' },
      zinc:    { avatarBg: 'rgba(113,113,122,0.3)', avatarText: '#d4d4d8', headerBg: 'rgba(63,63,70,0.4)' },
    };
    const p = palette[colorKey] ?? palette.emerald;
    const I_X = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

    const overlay = document.createElement('div');
    overlay.className = 'pw-overlay';
    overlay.innerHTML = `
      <div class="dash-modal">
        <div class="dash-modal-header" style="background:${p.headerBg}">
          <h3 style="font-size:18px;font-weight:800">${label}</h3>
          <p style="font-size:11px;color:var(--color-muted)">${people.length} kişi · Bugün</p>
          <button class="pw-close" id="sm-close">${I_X}</button>
        </div>
        <div class="dash-modal-list">
          ${people.length === 0
            ? `<p style="text-align:center;color:var(--color-muted);padding:32px 0;font-size:14px;font-style:italic">Kimse yok.</p>`
            : people.map(person => `
              <div class="dash-modal-item">
                <div class="dash-modal-avatar" style="background:${p.avatarBg};color:${p.avatarText}">
                  ${person.name[0]?.toUpperCase() ?? 'U'}
                </div>
                <div class="dash-modal-info">
                  <p class="dash-modal-name">${person.name}</p>
                  <p class="dash-modal-detail">${person.detail}</p>
                </div>
              </div>`).join('')}
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#sm-close')?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  },
}));

const ICON_LOGIN   = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`;
const ICON_LOGOUT  = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
const ICON_WIFI_OFF= `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`;
const ICON_CALENDAR= `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

export class HomePage extends BasePage {
  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="home-page" x-data="homePage()">

        <!-- Çevrimdışı banner -->
        <div class="offline-alert" x-show="!isOnline" style="display:none">
          <span class="offline-icon">${ICON_WIFI_OFF}</span>
          <div>
            <p class="offline-title">Çevrimdışı Mod</p>
            <p class="offline-desc">Hareketler cihaza kaydedilecek, bağlantı gelince gönderilecek.</p>
          </div>
        </div>

        <!-- Durum kartı -->
        <div class="status-card" :class="status.isInside ? 'status-card--inside' : 'status-card--outside'">
          <div class="status-card-inner">
            <div class="status-dot-wrap">
              <span class="status-dot" :class="status.isInside ? 'status-dot--inside' : 'status-dot--outside'"></span>
            </div>
            <div class="status-info">
              <p class="status-label" x-text="status.isInside ? 'İÇERİDESİN' : 'DIŞARIDASIN'"></p>
              <p class="status-time"
                 x-text="status.isInside
                   ? (statusTime ? 'Giriş: ' + statusTime : '')
                   : (statusTime ? 'Son çıkış: ' + statusTime : 'Henüz giriş yapılmadı')"></p>
            </div>
          </div>
        </div>

        <!-- Cooldown -->
        <div class="cooldown-bar" x-show="hasCooldown" style="display:none">
          <div class="cooldown-header">
            <span x-text="'Lütfen ' + cooldownSec + ' saniye bekleyin'"></span>
          </div>
          <div class="cooldown-track">
            <div class="cooldown-fill" :style="'width:' + cooldownPct + '%'"></div>
          </div>
        </div>

        <!-- Giriş / Çıkış butonları -->
        <div class="action-grid">
          <button class="action-btn action-btn-in" :disabled="!buttonsEnabled" @click="checkIn('in')" type="button">
            <div class="action-btn-glow"></div>
            ${ICON_LOGIN}
            <span>Giriş Yap</span>
          </button>
          <button class="action-btn action-btn-out" :disabled="!buttonsEnabled" @click="checkIn('out')" type="button">
            <div class="action-btn-glow"></div>
            ${ICON_LOGOUT}
            <span>Çıkış Yap</span>
          </button>
        </div>

        <!-- Admin istatistik kartları -->
        <template x-if="stats">
          <div class="dash-stats-grid">
            <button class="dash-stat-card dash-stat-card--emerald"
                    @click="openStatsModal('Şu An Ofiste', stats.presentList, 'emerald')">
              <div class="dash-stat-num dash-stat-num--emerald" x-text="stats.present"></div>
              <div class="dash-stat-label dash-stat-label--emerald">Şu An Ofiste</div>
              <div class="dash-stat-hint dash-stat-hint--emerald">Detay için tıkla</div>
            </button>
            <button class="dash-stat-card dash-stat-card--orange"
                    @click="openStatsModal('İzinli', stats.onLeaveList, 'orange')">
              <div class="dash-stat-num dash-stat-num--orange" x-text="stats.onLeave"></div>
              <div class="dash-stat-label dash-stat-label--orange">İzinli</div>
              <div class="dash-stat-hint dash-stat-hint--orange">Detay için tıkla</div>
            </button>
            <button class="dash-stat-card dash-stat-card--red"
                    @click="openStatsModal('Geç Kalan', stats.lateList, 'red')">
              <div class="dash-stat-num dash-stat-num--red" x-text="stats.late"></div>
              <div class="dash-stat-label dash-stat-label--red">Geç Kalan</div>
              <div class="dash-stat-hint dash-stat-hint--red">Detay için tıkla</div>
            </button>
            <button class="dash-stat-card dash-stat-card--zinc"
                    @click="openStatsModal('Gelmeyen', stats.absentList, 'zinc')">
              <div class="dash-stat-num dash-stat-num--zinc" x-text="stats.absent"></div>
              <div class="dash-stat-label dash-stat-label--zinc">Gelmeyen</div>
              <div class="dash-stat-hint dash-stat-hint--zinc">Detay için tıkla</div>
            </button>
          </div>
        </template>

        <!-- Bilgi kartları -->
        <div class="home-info-grid">
          <div class="home-info-card">
            <div class="home-info-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>
              <span>Ağ Durumu</span>
            </div>
            <p class="home-info-val" x-text="isOnline ? (currentIp || 'Tespit ediliyor...') : 'Çevrimdışı'"></p>
            <p class="home-info-sub">Mevcut IP Adresiniz</p>
          </div>
          <div class="home-info-card">
            <div class="home-info-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>Konum</span>
            </div>
            <p class="home-info-val">Aktif</p>
            <p class="home-info-sub">GPS Doğrulaması</p>
          </div>
          <div class="home-info-card">
            <div class="home-info-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Güvenlik</span>
            </div>
            <p class="home-info-val">QR + IP Korumalı</p>
            <p class="home-info-sub">Sistem Durumu</p>
          </div>
        </div>

        <!-- Bugünkü hareketler -->
        <div class="logs-section">
          <div class="logs-card">
            <div class="logs-header">
              ${ICON_CALENDAR}
              <h2 class="logs-title">Bugünkü Hareketler</h2>
            </div>
            <div class="logs-scroll">
              <!-- Skeleton -->
              <template x-if="loading">
                <ul class="log-list">
                  <li class="log-skeleton"></li>
                  <li class="log-skeleton"></li>
                </ul>
              </template>
              <!-- Boş -->
              <template x-if="!loading && logs.length === 0">
                <ul class="log-list">
                  <li class="log-empty"><span>Bugün hareket yok</span></li>
                </ul>
              </template>
              <!-- Liste -->
              <template x-if="!loading && logs.length > 0">
                <ul class="log-list">
                  <template x-for="log in logs" :key="log.id">
                    <li class="log-item" :class="'log-item--' + log.type">
                      <div class="log-dot" :class="'log-dot--' + log.type"></div>
                      <span class="log-label" x-text="log.type === 'in' ? 'Giriş' : 'Çıkış'"></span>
                      <span class="log-time" x-text="logTime(log.timestamp)"></span>
                      <span class="log-badge-offline" x-show="log.offline_queued">Çevrimdışı</span>
                    </li>
                  </template>
                </ul>
              </template>
            </div>
          </div>
        </div>

      </div>`;
  }

  destroy() {
    if (_cooldownTimer) { clearInterval(_cooldownTimer); _cooldownTimer = null; }
    _cleanups.forEach(fn => fn());
    _cleanups = [];
    super.destroy();
  }
}
