import Alpine from 'alpinejs';
import { BasePage } from '../core/BasePage.js';
import { api } from '../core/ApiClient.js';
import { Toast } from '../components/Toast.js';
import { state } from '../core/StateManager.js';
import { Modal } from '../components/Modal.js';
import QRCode from 'qrcode';

interface Settings {
  company_id: string;
  office_ip: string | null;
  qr_secret: string;
  company_name: string | null;
  work_days_per_week: number;
  rounding_threshold_minutes: number;
  shift_start: string;
  shift_end: string;
  qr_rotate_interval_hours: number;
}

interface QRResponse {
  success: boolean;
  value: string;
  expiresIn: number;
}

interface HolidayRow { id: number; date: string; name: string; is_half_day: boolean; company_id: string | null; }

const ICON_QR       = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3"/><path d="M17 17h4v4"/><path d="M14 21h3"/><path d="M21 14v3"/></svg>`;
const ICON_SETTINGS = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
const ICON_PRINTER  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`;
const ICON_KEY      = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`;
const ICON_INFO     = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
const ICON_CALENDAR = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const ICON_TRASH    = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
const ICON_PLUS     = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

Alpine.data('settingsPage', () => ({
  settings: null as Settings | null,
  holidays: [] as HolidayRow[],
  loadingSettings: true,
  loadingHolidays: true,
  qrBarWidth: '100%',
  qrTimerText: '30s',
  isAdmin: false,
  newHolidayDate: '',
  newHolidayName: '',
  newHolidayHalf: false,

  // Tatil modalı
  showHolidayModal: false,
  holidayModalYear: null as number | null,
  modalHolidays:    [] as HolidayRow[],
  modalLoading:     false,

  // Timers
  _qrTimer:     null as ReturnType<typeof setInterval> | null,
  _qrCountdown: null as ReturnType<typeof setInterval> | null,

  // QR gizli yönlendirme sayacı
  _qrTapCount: 0,
  _qrTapTimer: null as ReturnType<typeof setTimeout> | null,

  _onQRTap() {
    this._qrTapCount++;
    if (this._qrTapTimer) clearTimeout(this._qrTapTimer);
    if (this._qrTapCount >= 10) {
      this._qrTapCount = 0;
      window.location.href = '/qr';
      return;
    }
    this._qrTapTimer = setTimeout(() => { this._qrTapCount = 0; }, 2000);
  },

  get year(): number { return new Date().getFullYear(); },

  // Yıl listesi — mevcut yılın etrafında 3 yıl
  get yearList(): number[] {
    const cy = new Date().getFullYear();
    return [cy - 1, cy, cy + 1, cy + 2];
  },

  // Her yıl için yüklü holiday sayısı (holidays state'inden)
  yearCount(y: number): number {
    return (this.holidays as HolidayRow[]).filter(h => h.date.startsWith(String(y))).length;
  },

  fmtHolidayDate(d: string): string {
    const dt = new Date(d);
    const local = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    return local.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' });
  },

  async openHolidayYear(y: number) {
    this.holidayModalYear = y;
    this.modalLoading     = true;
    try {
      const res = await api.get<{ rows: HolidayRow[] }>(`/api/v1/holidays?year=${y}`);
      this.modalHolidays = res.rows ?? [];
      // Ana state'i de güncelle
      this.holidays = this.modalHolidays;
    } catch { this.modalHolidays = []; }
    finally  { this.modalLoading = false; }
  },

  backToYears() {
    this.holidayModalYear = null;
    this.modalHolidays    = [];
  },

  async addHolidayModal(e: Event) {
    e.preventDefault();
    if (!this.newHolidayDate || !this.newHolidayName) return;
    try {
      const res = await api.post<{ holiday: HolidayRow }>('/api/v1/holidays', {
        date: this.newHolidayDate, name: this.newHolidayName, is_half_day: this.newHolidayHalf,
      });
      this.modalHolidays = [...this.modalHolidays, res.holiday].sort((a, b) => a.date.localeCompare(b.date));
      this.newHolidayDate = ''; this.newHolidayName = ''; this.newHolidayHalf = false;
      Toast.show('Tatil günü eklendi', 'success');
    } catch (err: unknown) { Toast.show(err instanceof Error ? err.message : 'Hata', 'error'); }
  },

  async deleteHolidayModal(id: number) {
    const ok = await Modal.confirm({ title: 'Tatil Günü Sil', content: 'Bu tatil günü silinecek. Devam edilsin mi?', confirmText: 'Evet, Sil', cancelText: 'Vazgeç', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/holidays/${id}`);
      this.modalHolidays = this.modalHolidays.filter(h => h.id !== id);
      Toast.show('Tatil günü silindi', 'success');
    } catch (err: unknown) { Toast.show(err instanceof Error ? err.message : 'Silinemedi', 'error'); }
  },

  async init() {
    const user = state.get('user') as { role?: string } | null;
    this.isAdmin = user?.role === 'admin' || user?.role === 'mudur';
    await this._loadAll();
  },

  destroy() {
    if (this._qrTimer)    clearInterval(this._qrTimer);
    if (this._qrCountdown) clearInterval(this._qrCountdown);
  },

  async _loadAll() {
    this.loadingSettings = true;
    this.loadingHolidays = true;
    try {
      const year = new Date().getFullYear();
      const [settingsRes, qrRes, holidaysRes] = await Promise.all([
        api.get<{ success: boolean; settings: Settings }>('/api/v1/settings'),
        api.get<QRResponse>('/api/v1/attendance/qr').catch(() => null),
        api.get<{ rows: HolidayRow[] }>(`/api/v1/holidays?year=${year}`).catch(() => ({ rows: [] })),
      ]);
      this.settings = settingsRes.settings;
      this.holidays = holidaysRes.rows;
      this.loadingSettings = false;
      this.loadingHolidays = false;

      if (qrRes) {
        await this._drawQR(qrRes.value);
        this._startCountdown(qrRes.expiresIn);
        this._startQRRefresh();
      }
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Yüklenemedi', 'error');
      this.loadingSettings = false;
      this.loadingHolidays = false;
    }
  },

  async _drawQR(value: string) {
    await this.$nextTick();
    // $refs fallback: x-if içinde bazen $refs dolmayabilir
    const canvas = (
      (this.$refs as Record<string, HTMLElement | undefined>)['qrCanvas']
      ?? (this.$el as HTMLElement | undefined)?.querySelector?.('canvas')
    ) as HTMLCanvasElement | null;
    if (!canvas) return;
    await QRCode.toCanvas(canvas, value, {
      width: 220, margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
  },

  _startCountdown(initial: number) {
    if (this._qrCountdown) clearInterval(this._qrCountdown);
    let remaining = initial;
    const tick = () => {
      if (remaining <= 0) remaining = 30;
      this.qrBarWidth  = `${(remaining / 30) * 100}%`;
      this.qrTimerText = `${remaining}s`;
      remaining--;
    };
    tick();
    this._qrCountdown = setInterval(tick, 1000);
  },

  _startQRRefresh() {
    if (this._qrTimer) clearInterval(this._qrTimer);
    this._qrTimer = setInterval(async () => {
      try {
        const res = await api.get<QRResponse>('/api/v1/attendance/qr');
        await this._drawQR(res.value);
        if (this._qrCountdown) clearInterval(this._qrCountdown);
        this._startCountdown(res.expiresIn);
      } catch { /* ignore */ }
    }, 28_000);
  },

  printQR() {
    const canvas = (
      (this.$refs as Record<string, HTMLElement | undefined>)['qrCanvas']
      ?? (this.$el as HTMLElement | undefined)?.querySelector?.('canvas')
    ) as HTMLCanvasElement | null;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>PDKS QR Kodu</title></head>
      <body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#fff">
        <img src="${dataUrl}" style="max-width:400px;width:100%" />
        <p style="font-size:18px;font-weight:bold;margin-top:24px">PDKS — İş Yeri Giriş QR Kodu</p>
        <p style="font-size:13px;color:#666">Bu kodu tarayarak giriş/çıkış yapabilirsiniz</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  },

  async regenSecret() {
    const ok = await Modal.confirm({
      title: 'QR Kodu Sıfırla',
      content: 'Mevcut QR kodu geçersiz hale gelir. Yeni kodu tarayıcıya asana kadar personel giriş yapamaz. Devam edilsin mi?',
      confirmText: 'Evet, Sıfırla',
      cancelText: 'Vazgeç',
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await api.post<{ success: boolean; secret: string }>('/api/v1/settings/rotate-qr', {});
      if (this.settings) this.settings = { ...this.settings, qr_secret: res.secret };
      const qrRes = await api.get<QRResponse>('/api/v1/attendance/qr');
      await this._drawQR(qrRes.value);
      this._startCountdown(qrRes.expiresIn);
      this._startQRRefresh(); // timer'ı sıfırla — yeni secret ile başlasın
      Toast.show('QR kodu sıfırlandı', 'success');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Sıfırlanamadı', 'error');
    }
  },

  async saveSettings(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd   = new FormData(form);
    const data: Record<string, unknown> = {};
    fd.forEach((v, k) => { data[k] = v || null; });
    if (data.work_days_per_week)         data.work_days_per_week         = Number(data.work_days_per_week);
    if (data.rounding_threshold_minutes) data.rounding_threshold_minutes = Number(data.rounding_threshold_minutes);
    if (data.qr_rotate_interval_hours !== undefined) data.qr_rotate_interval_hours = Number(data.qr_rotate_interval_hours);
    try {
      await api.patch('/api/v1/settings', data);
      Toast.show('Ayarlar kaydedildi', 'success');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Kaydedilemedi', 'error');
    }
  },

  async addHoliday(e: Event) {
    e.preventDefault();
    const date = this.newHolidayDate;
    const name = this.newHolidayName.trim();
    const half = this.newHolidayHalf;
    if (!date || !name) return;
    try {
      const res = await api.post<{ holiday: HolidayRow }>('/api/v1/holidays', { date, name, is_half_day: half });
      this.holidays = [...this.holidays, res.holiday].sort((a, b) => a.date.localeCompare(b.date));
      this.newHolidayDate = '';
      this.newHolidayName = '';
      this.newHolidayHalf = false;
      Toast.show('Tatil günü eklendi', 'success');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Eklenemedi', 'error');
    }
  },

  async deleteHoliday(id: number) {
    const ok = await Modal.confirm({
      title: 'Tatil Günü Sil',
      content: 'Bu tatil günü silinecek. Devam edilsin mi?',
      confirmText: 'Evet, Sil', cancelText: 'Vazgeç', danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/holidays/${id}`);
      this.holidays = this.holidays.filter(h => h.id !== id);
      Toast.show('Tatil günü silindi', 'success');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Silinemedi', 'error');
    }
  },

  async seedHolidays(year?: number) {
    const targetYear = year ?? (this.holidayModalYear ?? new Date().getFullYear());
    try {
      const res = await api.post<{ inserted: number }>('/api/v1/holidays/seed', { year: targetYear });
      Toast.show(`${res.inserted} tatil günü yüklendi (${targetYear})`, 'success');
      const fresh = await api.get<{ rows: HolidayRow[] }>(`/api/v1/holidays?year=${targetYear}`);
      this.modalHolidays = fresh.rows;
      this.holidays      = fresh.rows;
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Yüklenemedi', 'error');
    }
  },
}));

export class SettingsPage extends BasePage {
  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="settings-page" x-data="settingsPage()">

        <div class="settings-toprow">
          <h2 class="settings-page-title">${ICON_QR} QR Kod Oluşturucu</h2>
        </div>

        <!-- Skeleton: yüklenirken -->
        <template x-if="loadingSettings">
          <div class="settings-grid">
            <div class="skeleton-col">
              <div class="skeleton" style="height:320px;border-radius:24px"></div>
            </div>
            <div class="skeleton-col">
              <div class="skeleton" style="height:60px;border-radius:16px"></div>
              <div class="skeleton" style="height:200px;border-radius:16px;margin-top:12px"></div>
              <div class="skeleton" style="height:160px;border-radius:16px;margin-top:12px"></div>
            </div>
          </div>
        </template>

        <!-- İçerik: yüklendikten sonra -->
        <template x-if="!loadingSettings">
          <div class="settings-grid">

            <!-- Sol: QR Panel -->
            <div class="qr-panel">
              <div class="qr-panel-canvas-wrap" @click="_onQRTap()">
                <canvas x-ref="qrCanvas"></canvas>
              </div>
              <div class="qr-panel-info">
                <p class="qr-panel-title">İş Yeri Giriş QR Kodu</p>
                <p class="qr-panel-sub">Bu kodu yazdırıp iş yerine asabilirsiniz.</p>
              </div>
              <div class="qr-panel-timer">
                <div class="qr-timer-bar-wrap">
                  <div class="qr-timer-bar" :style="'width:' + qrBarWidth"></div>
                </div>
                <span class="qr-timer-text" x-text="qrTimerText">30s</span>
              </div>
              <div class="qr-panel-actions">
                <button class="qr-action-btn qr-action-btn--primary" @click="printQR()">
                  ${ICON_PRINTER} Yazdır
                </button>
                <button class="qr-action-btn qr-action-btn--secondary" @click="regenSecret()">
                  ${ICON_KEY} Kodu Yenile
                </button>
              </div>
            </div>

            <!-- Sağ: Ayarlar Formu -->
            <div class="settings-form-col">
              <div class="settings-form-card">
                <h3 class="settings-form-title">${ICON_SETTINGS} Ayarları Güncelle</h3>
                <form class="settings-inner-form" @submit="saveSettings($event)">

                  <!-- Şirket Genel Bilgileri -->
                  <div class="settings-subsection">
                    <h4 class="settings-subsection-title">Şirket Genel Bilgileri</h4>
                    <div class="settings-fields-grid settings-fields-grid--3">
                      <div class="field-group">
                        <label class="field-label">Şirket Adı</label>
                        <input class="field-input" name="company_name"
                               :value="settings?.company_name ?? ''"
                               placeholder="Örn: ABC Yazılım Ltd. Şti." />
                      </div>
                      <div class="field-group">
                        <label class="field-label">Haftalık Çalışma Günü</label>
                        <select class="field-input" name="work_days_per_week">
                          <option value="5" :selected="settings?.work_days_per_week === 5">5 Gün</option>
                          <option value="6" :selected="settings?.work_days_per_week === 6">6 Gün</option>
                          <option value="7" :selected="settings?.work_days_per_week === 7">7 Gün</option>
                        </select>
                      </div>
                      <div class="field-group">
                        <label class="field-label">
                          Hesaplama Toleransı (Dk) ${ICON_INFO}
                        </label>
                        <input class="field-input" name="rounding_threshold_minutes" type="number"
                               :value="settings?.rounding_threshold_minutes ?? 30" />
                      </div>
                    </div>
                  </div>

                  <!-- Vardiya & Çalışma Saatleri -->
                  <div class="settings-subsection">
                    <h4 class="settings-subsection-title">Vardiya &amp; Çalışma Saatleri</h4>
                    <div class="settings-fields-grid">
                      <div class="field-group">
                        <label class="field-label">Mesai Başlangıcı</label>
                        <input class="field-input" name="shift_start" type="time"
                               :value="settings?.shift_start?.slice(0,5) ?? '09:00'" />
                      </div>
                      <div class="field-group">
                        <label class="field-label">Mesai Bitişi</label>
                        <input class="field-input" name="shift_end" type="time"
                               :value="settings?.shift_end?.slice(0,5) ?? '18:00'" />
                      </div>
                    </div>
                  </div>

                  <!-- Güvenlik & Erişim -->
                  <div class="settings-subsection">
                    <h4 class="settings-subsection-title">Güvenlik &amp; Erişim</h4>
                    <div class="settings-fields-grid">
                      <div class="field-group">
                        <label class="field-label">İş Yeri IP Adresi</label>
                        <input class="field-input" name="office_ip"
                               :value="settings?.office_ip ?? ''"
                               placeholder="Örn: 176.234.12.34" />
                      </div>
                      <div class="field-group">
                        <label class="field-label">QR Gizli Anahtar</label>
                        <input class="field-input" name="qr_secret"
                               :value="settings?.qr_secret ?? ''"
                               placeholder="QR gizli anahtarı" />
                      </div>
                      <div class="field-group">
                        <label class="field-label">QR Otomatik Yenileme</label>
                        <select class="field-input" name="qr_rotate_interval_hours">
                          <option value="0"  :selected="(settings?.qr_rotate_interval_hours ?? 0) === 0">Manuel (Otomatik Yok)</option>
                          <option value="6"  :selected="settings?.qr_rotate_interval_hours === 6">Her 6 Saatte Bir</option>
                          <option value="12" :selected="settings?.qr_rotate_interval_hours === 12">Her 12 Saatte Bir</option>
                          <option value="24" :selected="settings?.qr_rotate_interval_hours === 24">Her 24 Saatte Bir</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button type="submit" class="submit-btn">Ayarları Kaydet</button>
                </form>
              </div>
            </div>

          </div>
        </template>

        <!-- Tatil Günleri Butonu -->
        <div style="margin-top:24px">
          <button class="settings-nav-btn" @click="showHolidayModal = true">
            <span class="settings-nav-btn-left">
              ${ICON_CALENDAR}
              <span>Tatil Günleri</span>
            </span>
            <span class="settings-nav-btn-arrow">${ICON_INFO}</span>
          </button>
        </div>

        <!-- ── Tatil Günleri Modalı (ROOT div içinde — x-data scope) ── -->
      <div class="hw-overlay" x-show="showHolidayModal" @click.self="showHolidayModal=false; backToYears()" style="display:none">
        <div class="hw-modal">

          <!-- Başlık -->
          <div class="hw-modal-header">
            <div style="display:flex;align-items:center;gap:10px">
              <button x-show="holidayModalYear" class="hw-back-btn" @click="backToYears()">
                ${ICON_KEY}
              </button>
              <h3 class="hw-modal-title">
                <span x-text="holidayModalYear ? holidayModalYear + ' Tatil Günleri' : 'Tatil Günleri'"></span>
              </h3>
            </div>
            <button class="hw-close-btn" @click="showHolidayModal=false; backToYears()">✕</button>
          </div>

          <!-- Yıl listesi -->
          <template x-if="!holidayModalYear">
            <div class="hw-year-list">
              <template x-for="y in yearList" :key="y">
                <button class="hw-year-btn" @click="openHolidayYear(y)">
                  <span class="hw-year-label" x-text="y"></span>
                  <span class="hw-year-count" x-text="yearCount(y) + ' tatil günü'"></span>
                  <span class="hw-year-arrow">›</span>
                </button>
              </template>
            </div>
          </template>

          <!-- Seçili yılın tatilleri -->
          <template x-if="holidayModalYear">
            <div>
              <!-- Admin: yükle butonu -->
              <template x-if="isAdmin">
                <div style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.06)">
                  <button class="btn btn-ghost" style="font-size:12px;width:100%"
                    @click="seedHolidays(holidayModalYear)">
                    <span x-text="holidayModalYear + ' Varsayılan Tatillerini Yükle'"></span>
                  </button>
                </div>
              </template>

              <!-- Admin: ekle formu -->
              <template x-if="isAdmin">
                <form class="holiday-add-form" @submit="addHolidayModal($event)">
                  <div class="holiday-add-fields">
                    <input class="field-input" type="date" required x-model="newHolidayDate"
                           placeholder="Tarih" style="color-scheme:dark;max-width:160px" />
                    <input class="field-input" type="text" required x-model="newHolidayName"
                           placeholder="Tatil adı" style="flex:1" />
                    <label class="holiday-half-label">
                      <input type="checkbox" x-model="newHolidayHalf" /> ½ Gün
                    </label>
                    <button type="submit" class="btn-primary btn-icon-label">${ICON_PLUS} Ekle</button>
                  </div>
                </form>
              </template>

              <!-- Yükleniyor -->
              <template x-if="modalLoading">
                <div style="padding:32px;text-align:center;color:var(--color-muted)">Yükleniyor...</div>
              </template>

              <!-- Liste -->
              <template x-if="!modalLoading">
                <div class="holiday-list" style="max-height:50vh;overflow-y:auto">
                  <template x-if="modalHolidays.length === 0">
                    <div class="holiday-empty">Bu yıl için tatil günü yok.</div>
                  </template>
                  <template x-for="h in modalHolidays" :key="h.id">
                    <div class="holiday-item">
                      <div class="holiday-item-left">
                        <span class="holiday-dot" :class="h.is_half_day ? 'holiday-dot--half' : ''"></span>
                        <div>
                          <p class="holiday-item-name">
                            <span x-text="h.name"></span>
                            <template x-if="h.is_half_day">
                              <span class="holiday-half-badge">½ Gün</span>
                            </template>
                          </p>
                          <p class="holiday-item-date" x-text="fmtHolidayDate(h.date)"></p>
                        </div>
                      </div>
                      <template x-if="isAdmin && h.company_id !== null">
                        <button class="holiday-del-btn" type="button" @click="deleteHolidayModal(h.id)">
                          ${ICON_TRASH}
                        </button>
                      </template>
                    </div>
                  </template>
                </div>
              </template>
            </div>
          </template>

        </div><!-- /.hw-modal -->
      </div><!-- /.hw-overlay -->

      </div><!-- /.settings-page x-data ROOT -->

    `;
  }
}
