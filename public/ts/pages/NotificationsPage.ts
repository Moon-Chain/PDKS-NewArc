import Alpine from 'alpinejs';
import { BasePage } from '../core/BasePage.js';
import { api } from '../core/ApiClient.js';
import { bus } from '../core/EventBus.js';
import { Toast } from '../components/Toast.js';

interface NotifRow {
  id: string; title: string; message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean; link: string | null; created_at: string;
}

interface DayGroup { dayKey: string; label: string; rows: NotifRow[]; }

const TYPE_ICON:  Record<string, string> = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
const TYPE_CLASS: Record<string, string> = {
  success: 'notif-item--success', error: 'notif-item--error',
  warning: 'notif-item--warning', info: 'notif-item--info',
};

// Cleanup handle — BasePage.destroy() tarafından çağrılır
let _unsubs: Array<() => void> = [];

Alpine.data('notificationsPage', () => ({
  rows:    [] as NotifRow[],
  unread:  0,
  loading: true,

  get groupedRows(): DayGroup[] {
    const map = new Map<string, NotifRow[]>();
    for (const r of this.rows) {
      const key = _dayKey(new Date(r.created_at));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dayKey, rows]) => ({ dayKey, label: _dayLabel(dayKey), rows }));
  },

  timeAgo(created_at: string): string {
    const mins = Math.floor((Date.now() - new Date(created_at).getTime()) / 60000);
    if (mins < 1)       return 'Az önce';
    if (mins < 60)      return `${mins}dk`;
    const h = Math.floor(mins / 60);
    return h < 24 ? `${h}sa` : `${Math.floor(h / 24)}g`;
  },

  typeIcon(type: string):  string { return TYPE_ICON[type]  ?? 'ℹ'; },
  typeClass(type: string): string { return TYPE_CLASS[type] ?? ''; },

  expiryLabel(created_at: string): string {
    const dLeft = Math.ceil((7 * 86400000 - (Date.now() - new Date(created_at).getTime())) / 86400000);
    return dLeft <= 1 ? 'Bugün sona eriyor' : `${dLeft} gün içinde sona eriyor`;
  },

  async init() {
    await this.load();

    _unsubs.push(bus.on('sse:notification', (data) => {
      this.rows.unshift(data as NotifRow);
      this.unread++;
    }));
    _unsubs.push(bus.on('notif:deleted', (id) => {
      const idx = this.rows.findIndex(r => r.id === id as string);
      if (idx === -1) return;
      if (!this.rows[idx].is_read) this.unread = Math.max(0, this.unread - 1);
      this.rows.splice(idx, 1);
    }));
    _unsubs.push(bus.on('notif:read', (id) => {
      const row = this.rows.find(r => r.id === id as string);
      if (!row || row.is_read) return;
      row.is_read = true;
      this.unread = Math.max(0, this.unread - 1);
    }));
    _unsubs.push(bus.on('notif:read-all', () => {
      this.rows.forEach(r => r.is_read = true);
      this.unread = 0;
    }));
  },

  async load() {
    this.loading = true;
    try {
      const res = await api.get<{ rows: NotifRow[]; unread: number }>('/api/v1/notifications?limit=100');
      this.rows   = res.rows;
      this.unread = res.unread;
    } catch {
      Toast.show('Bildirimler yüklenemedi', 'error');
    } finally {
      this.loading = false;
    }
  },

  async markAllRead() {
    await api.post('/api/v1/notifications/read-all', {}).catch(() => {});
    this.rows.forEach(r => r.is_read = true);
    this.unread = 0;
    bus.emit('notif:read-all');
    Toast.show('Tüm bildirimler okundu olarak işaretlendi', 'success');
  },

  async markRead(id: string, link: string | null) {
    const row = this.rows.find(r => r.id === id);
    if (row && !row.is_read) {
      await api.patch(`/api/v1/notifications/${id}/read`, {}).catch(() => {});
      row.is_read = true;
      this.unread = Math.max(0, this.unread - 1);
      bus.emit('notif:read', id);
    }
    if (link) {
      (window as unknown as { router?: { navigate: (p: string) => void } }).router?.navigate(link);
    }
  },

  async deleteNotif(id: string, e: Event) {
    e.stopPropagation();
    await api.delete(`/api/v1/notifications/${id}`).catch(() => {});
    const idx = this.rows.findIndex(r => r.id === id);
    if (idx !== -1) {
      if (!this.rows[idx].is_read) this.unread = Math.max(0, this.unread - 1);
      this.rows.splice(idx, 1);
    }
    bus.emit('notif:deleted', id);
    Toast.show('Bildirim silindi', 'success');
  },
}));

function _dayKey(dt: Date): string {
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

function _dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const todayKey = _dayKey(new Date());
  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  if (key === todayKey)       return `Bugün · ${dt.toLocaleDateString('tr-TR', { day:'numeric', month:'long' })}`;
  if (key === _dayKey(yest))  return `Dün · ${dt.toLocaleDateString('tr-TR', { day:'numeric', month:'long' })}`;
  const diff = Math.floor((Date.now() - dt.getTime()) / 86400000);
  if (diff < 7) return `${dt.toLocaleDateString('tr-TR', { weekday:'long' })} · ${dt.toLocaleDateString('tr-TR', { day:'numeric', month:'long' })}`;
  return dt.toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' });
}

const I_BELL  = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
const I_CHECK = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const I_X     = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

export class NotificationsPage extends BasePage {
  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="np-page" x-data="notificationsPage()">

        <div class="np-header">
          <h2 class="np-title">${I_BELL} Bildirimler</h2>
          <button class="np-read-all-btn" x-show="unread > 0" @click="markAllRead()" type="button">
            ${I_CHECK} Tümünü Okundu İşaretle
          </button>
        </div>

        <!-- Skeleton -->
        <template x-if="loading">
          <div class="np-group">
            <div class="skeleton" style="height:16px;width:120px;margin-bottom:10px"></div>
            <div class="np-group-card">
              ${[0,1,2].map(() => `
                <div style="display:flex;align-items:flex-start;gap:14px;padding:16px;border-bottom:1px solid rgba(255,255,255,0.05)">
                  <div class="skeleton" style="width:36px;height:36px;border-radius:50%;flex-shrink:0"></div>
                  <div style="flex:1;display:flex;flex-direction:column;gap:8px">
                    <div class="skeleton" style="height:13px;width:50%"></div>
                    <div class="skeleton" style="height:12px;width:80%"></div>
                  </div>
                </div>`).join('')}
            </div>
          </div>
        </template>

        <!-- Boş durum -->
        <template x-if="!loading && rows.length === 0">
          <div class="np-empty">
            <div class="np-empty-icon">${I_BELL}</div>
            <p class="np-empty-title">Bildirim yok</p>
            <p class="np-empty-sub">Son 7 gün içinde gelen bildirimler burada görünür.</p>
          </div>
        </template>

        <!-- Gruplu liste -->
        <template x-if="!loading && rows.length > 0">
          <div>
            <template x-for="group in groupedRows" :key="group.dayKey">
              <div class="np-group">
                <div class="np-day-label" x-text="group.label"></div>
                <div class="np-group-card">
                  <template x-for="n in group.rows" :key="n.id">
                    <div class="notif-item np-full-item"
                         :class="[typeClass(n.type), n.is_read ? '' : 'notif-item--unread']"
                         @click="markRead(n.id, n.link)">
                      <div class="notif-item-dot" x-text="typeIcon(n.type)"></div>
                      <div class="notif-item-body">
                        <div class="np-item-row">
                          <p class="notif-item-title" x-text="n.title"></p>
                          <span class="notif-item-time" x-text="timeAgo(n.created_at)"></span>
                        </div>
                        <p class="notif-item-msg" x-text="n.message"></p>
                        <p class="np-expiry" x-text="expiryLabel(n.created_at)"></p>
                      </div>
                      <button class="notif-del-btn np-del-btn" @click="deleteNotif(n.id, $event)" type="button" title="Sil">
                        ${I_X}
                      </button>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </template>

      </div>`;
  }

  destroy() {
    _unsubs.forEach(fn => fn());
    _unsubs = [];
    super.destroy();
  }
}
