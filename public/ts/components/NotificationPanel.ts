import { api } from '../core/ApiClient.js';
import { bus } from '../core/EventBus.js';

interface NotifRow {
  id:         string;
  title:      string;
  message:    string;
  type:       'info' | 'success' | 'warning' | 'error';
  is_read:    boolean;
  link:       string | null;
  created_at: string;
}

const ICON_BELL = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
const ICON_X    = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const ICON_CHECK= `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

export class NotificationPanel {
  private panelEl:   HTMLElement | null = null;
  private bellEl:    HTMLElement | null = null;
  private badgeEl:   HTMLElement | null = null;
  private rows:      NotifRow[] = [];
  private unread     = 0;
  private open       = false;
  private loading    = false;

  mount(bellContainer: HTMLElement) {
    this.bellEl = bellContainer;
    this._render();
    this._load();

    // SSE: yeni bildirim geldi
    bus.on('sse:notification', (data) => {
      const notif = data as NotifRow;
      this.rows.unshift(notif);
      if (!notif.is_read) this.unread = Math.max(0, this.unread + 1);
      this._updateBadge();
      if (this.open && this.panelEl) this._renderList();
    });

    // Bildirimler sayfasından gelen senkronizasyon olayları
    bus.on('notif:deleted', (id) => {
      const idx = this.rows.findIndex(r => r.id === id as string);
      if (idx === -1) return;
      if (!this.rows[idx].is_read) this.unread = Math.max(0, this.unread - 1);
      this.rows.splice(idx, 1);
      this._updateBadge();
      if (this.open && this.panelEl) this._renderList();
    });

    bus.on('notif:read', (id) => {
      const row = this.rows.find(r => r.id === id as string);
      if (!row || row.is_read) return;
      row.is_read = true;
      this.unread = Math.max(0, this.unread - 1);
      this._updateBadge();
      if (this.open && this.panelEl) this._renderList();
    });

    bus.on('notif:read-all', () => {
      this.rows.forEach(r => r.is_read = true);
      this.unread = 0;
      this._updateBadge();
      if (this.open && this.panelEl) this._renderList();
    });
  }

  private _render() {
    if (!this.bellEl) return;
    this.bellEl.innerHTML = `
      <button class="notif-bell-btn" id="notif-bell" title="Bildirimler" type="button">
        ${ICON_BELL}
        <span class="notif-badge" id="notif-badge" style="display:none">0</span>
      </button>
    `;
    this.badgeEl = this.bellEl.querySelector('#notif-badge');
    const btn = this.bellEl.querySelector<HTMLButtonElement>('#notif-bell')!;
    btn.onclick = () => this._toggle();
  }

  private async _load() {
    try {
      const res = await api.get<{ rows: NotifRow[]; unread: number }>('/api/v1/notifications');
      this.rows   = res.rows;
      this.unread = res.unread;
      this._updateBadge();
    } catch {}
  }

  private _toggle() {
    this.open ? this._close() : this._openPanel();
  }

  private _openPanel() {
    this.open = true;
    if (!this.panelEl) {
      this.panelEl = document.createElement('div');
      this.panelEl.className = 'notif-panel';
      document.body.appendChild(this.panelEl);
    }
    this._renderList();

    // Panel dışına tıklayınca kapat — tek sefer
    setTimeout(() => {
      document.addEventListener('click', this._onOutsideClick, { once: true, capture: true });
    }, 0);
  }

  private _onOutsideClick = (e: MouseEvent) => {
    if (!this.panelEl) return;
    if (!this.panelEl.contains(e.target as Node) && !this.bellEl?.contains(e.target as Node)) {
      this._close();
    } else {
      document.addEventListener('click', this._onOutsideClick, { once: true, capture: true });
    }
  };

  private _close() {
    this.open = false;
    this.panelEl?.remove();
    this.panelEl = null;
    document.removeEventListener('click', this._onOutsideClick, true);
  }

  private _renderList() {
    if (!this.panelEl) return;

    const bellRect = this.bellEl?.querySelector('#notif-bell')?.getBoundingClientRect();
    const top = (bellRect?.bottom ?? 60) + 8;

    // Mobilde (< 480px) tam genişlik + ortalı, masaüstünde sağa hizalı
    if (window.innerWidth < 480) {
      this.panelEl.style.top   = `${top}px`;
      this.panelEl.style.left  = '8px';
      this.panelEl.style.right = '8px';
      this.panelEl.style.width = 'auto';
    } else {
      const right = window.innerWidth - (bellRect?.right ?? 60);
      this.panelEl.style.top   = `${top}px`;
      this.panelEl.style.left  = '';
      this.panelEl.style.right = `${Math.max(4, right - 8)}px`;
      this.panelEl.style.width = '360px';
    }

    const timeAgo = (iso: string) => {
      const diff = Date.now() - new Date(iso).getTime();
      const m = Math.floor(diff / 60000);
      if (m < 1)  return 'Az önce';
      if (m < 60) return `${m}dk önce`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}sa önce`;
      return `${Math.floor(h / 24)}g önce`;
    };

    const typeIcon: Record<string, string> = {
      success: '✓',
      error:   '✗',
      warning: '⚠',
      info:    'ℹ',
    };

    const typeClass: Record<string, string> = {
      success: 'notif-item--success',
      error:   'notif-item--error',
      warning: 'notif-item--warning',
      info:    'notif-item--info',
    };

    this.panelEl.innerHTML = `
      <div class="notif-panel-header">
        <span class="notif-panel-title">${ICON_BELL} Bildirimler</span>
        <div class="notif-panel-actions">
          ${this.unread > 0 ? `<button class="notif-read-all-btn" id="notif-read-all" type="button">${ICON_CHECK} Tümünü Oku</button>` : ''}
          <button class="notif-close-btn" id="notif-close" type="button">${ICON_X}</button>
        </div>
      </div>
      <div class="notif-list" id="notif-list">
        ${this.rows.length === 0
          ? `<div class="notif-empty">
               <div class="notif-empty-icon">${ICON_BELL}</div>
               <p>Bildirim yok</p>
             </div>`
          : this.rows.map(n => `
              <div class="notif-item ${typeClass[n.type] ?? ''} ${n.is_read ? '' : 'notif-item--unread'}"
                   data-id="${n.id}" data-link="${n.link ?? ''}">
                <div class="notif-item-dot">${typeIcon[n.type] ?? 'ℹ'}</div>
                <div class="notif-item-body">
                  <p class="notif-item-title">${n.title}</p>
                  <p class="notif-item-msg">${n.message}</p>
                  <p class="notif-item-time">${timeAgo(n.created_at)}</p>
                </div>
                <button class="notif-del-btn" data-del="${n.id}" type="button" title="Sil">${ICON_X}</button>
              </div>
            `).join('')}
      </div>
      <div class="notif-panel-footer">
        <button class="notif-view-all-btn" id="notif-view-all" type="button">Tümünü Gör</button>
      </div>
    `;

    // Tümünü oku
    const readAllBtn = this.panelEl.querySelector<HTMLButtonElement>('#notif-read-all');
    if (readAllBtn) {
      readAllBtn.onclick = async (e) => {
        e.stopPropagation();
        await api.post('/api/v1/notifications/read-all', {}).catch(() => {});
        this.rows.forEach(r => r.is_read = true);
        this.unread = 0;
        this._updateBadge();
        this._renderList();
        bus.emit('notif:read-all');
      };
    }

    // Kapat
    const closeBtn = this.panelEl.querySelector<HTMLButtonElement>('#notif-close');
    if (closeBtn) closeBtn.onclick = () => this._close();

    // Item tıklama — okundu + navigate
    this.panelEl.querySelectorAll<HTMLElement>('.notif-item').forEach(item => {
      item.onclick = async (e) => {
        if ((e.target as HTMLElement).closest('.notif-del-btn')) return;
        const id   = item.dataset.id!;
        const link = item.dataset.link;

        if (item.classList.contains('notif-item--unread')) {
          await api.patch(`/api/v1/notifications/${id}/read`, {}).catch(() => {});
          const row = this.rows.find(r => r.id === id);
          if (row && !row.is_read) { row.is_read = true; this.unread = Math.max(0, this.unread - 1); }
          this._updateBadge();
          item.classList.remove('notif-item--unread');
          bus.emit('notif:read', id);
        }

        if (link) {
          this._close();
          (window as unknown as { router?: { navigate: (p: string) => void } }).router?.navigate(link);
        }
      };
    });

    // Sil butonları
    this.panelEl.querySelectorAll<HTMLButtonElement>('.notif-del-btn').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const id = btn.dataset.del!;
        await api.delete(`/api/v1/notifications/${id}`).catch(() => {});
        const idx = this.rows.findIndex(r => r.id === id);
        if (idx !== -1) {
          if (!this.rows[idx].is_read) this.unread = Math.max(0, this.unread - 1);
          this.rows.splice(idx, 1);
        }
        this._updateBadge();
        this._renderList();
        bus.emit('notif:deleted', id);
      };
    });

    // Tümünü Gör — bildirimler sayfasına git
    const viewAllBtn = this.panelEl.querySelector<HTMLButtonElement>('#notif-view-all');
    if (viewAllBtn) {
      viewAllBtn.onclick = () => {
        this._close();
        (window as unknown as { router?: { navigate: (p: string) => void } }).router?.navigate('/notifications');
      };
    }
  }

  private _updateBadge() {
    if (!this.badgeEl) return;
    if (this.unread > 0) {
      this.badgeEl.textContent = this.unread > 99 ? '99+' : String(this.unread);
      this.badgeEl.style.display = '';
    } else {
      this.badgeEl.style.display = 'none';
    }
  }

  // Dışarıdan çağrılabilir — badge güncelle
  setUnread(count: number) {
    this.unread = count;
    this._updateBadge();
  }

  destroy() {
    this._close();
    document.removeEventListener('click', this._onOutsideClick, true);
  }
}
