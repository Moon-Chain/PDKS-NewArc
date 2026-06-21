import { api } from '../../../ts/core/ApiClient.js';
import { bus } from '../../../ts/core/EventBus.js';
import { icon } from '../icons.js';

interface NotifRow {
  id:         string;
  title:      string;
  message:    string;
  type:       'info' | 'success' | 'warning' | 'error';
  is_read:    boolean;
  link:       string | null;
  created_at: string;
}

const TYPE_ICON:  Record<string, string> = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
const TYPE_CLASS: Record<string, string> = {
  success: 'ap-notif-item--success', error: 'ap-notif-item--error',
  warning: 'ap-notif-item--warning', info: 'ap-notif-item--info',
};

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)  return 'Az önce';
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa önce`;
  return `${Math.floor(h / 24)}g önce`;
}

export class AdminNotifPanel {
  private bellEl:  HTMLElement | null = null;
  private dotEl:   HTMLElement | null = null;
  private panelEl: HTMLElement | null = null;
  private rows:    NotifRow[] = [];
  private unread   = 0;
  private open     = false;

  mount(bellEl: HTMLElement, dotEl: HTMLElement | null) {
    this.bellEl = bellEl;
    this.dotEl  = dotEl;

    bellEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.open ? this.closePanel() : this.openPanel();
    });

    this.load();

    bus.on('sse:notification', (data) => {
      this.rows.unshift(data as NotifRow);
      this.unread++;
      this.updateDot();
      if (this.open) this.renderList();
    });
  }

  private async load() {
    try {
      const res = await api.get<{ rows: NotifRow[]; unread: number }>('/api/v1/notifications');
      this.rows   = res.rows;
      this.unread = res.unread;
      this.updateDot();
    } catch { /* ignore */ }
  }

  private openPanel() {
    this.open = true;
    if (!this.panelEl) {
      this.panelEl = document.createElement('div');
      this.panelEl.className = 'ap-notif-panel';
      document.body.appendChild(this.panelEl);
    }
    this.renderList();
    setTimeout(() => {
      document.addEventListener('click', this.onOutsideClick, { once: true, capture: true });
    }, 0);
  }

  private closePanel() {
    this.open = false;
    this.panelEl?.remove();
    this.panelEl = null;
    document.removeEventListener('click', this.onOutsideClick, true);
  }

  private onOutsideClick = (e: MouseEvent) => {
    if (!this.panelEl) return;
    if (!this.panelEl.contains(e.target as Node) && !this.bellEl?.contains(e.target as Node)) {
      this.closePanel();
    } else {
      document.addEventListener('click', this.onOutsideClick, { once: true, capture: true });
    }
  };

  private renderList() {
    if (!this.panelEl) return;

    const bellRect = this.bellEl?.getBoundingClientRect();
    const top = (bellRect?.bottom ?? 60) + 8;

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

    this.panelEl.innerHTML = `
      <div class="ap-notif-panel-header">
        <span class="ap-notif-panel-title">${icon('bell', 'icon icon-sm')} Bildirimler</span>
        <div class="ap-notif-panel-actions">
          ${this.unread > 0 ? `<button class="ap-notif-read-all-btn" id="ap-notif-read-all" type="button">${icon('check', 'icon icon-sm')} Tümünü Oku</button>` : ''}
          <button class="ap-notif-close-btn" id="ap-notif-close" type="button">${icon('x', 'icon icon-sm')}</button>
        </div>
      </div>
      <div class="ap-notif-list">
        ${this.rows.length === 0
          ? `<div class="ap-notif-empty">
               <div class="ap-notif-empty-icon">${icon('bell', 'icon icon-lg')}</div>
               <p>Bildirim yok</p>
             </div>`
          : this.rows.map(n => `
              <div class="ap-notif-item ${TYPE_CLASS[n.type] ?? ''} ${n.is_read ? '' : 'ap-notif-item--unread'}"
                   data-id="${n.id}" data-link="${n.link ?? ''}">
                <div class="ap-notif-item-dot">${TYPE_ICON[n.type] ?? 'ℹ'}</div>
                <div class="ap-notif-item-body">
                  <p class="ap-notif-item-title">${n.title}</p>
                  <p class="ap-notif-item-msg">${n.message}</p>
                  <p class="ap-notif-item-time">${timeAgo(n.created_at)}</p>
                </div>
                <button class="ap-notif-del-btn" data-del="${n.id}" type="button" title="Sil">${icon('x', 'icon icon-sm')}</button>
              </div>
            `).join('')}
      </div>
      <div class="ap-notif-panel-footer">
        <button class="ap-notif-view-all-btn" id="ap-notif-view-all" type="button">Tümünü Gör</button>
      </div>
    `;

    const readAllBtn = this.panelEl.querySelector<HTMLButtonElement>('#ap-notif-read-all');
    if (readAllBtn) {
      readAllBtn.onclick = async (e) => {
        e.stopPropagation();
        await api.post('/api/v1/notifications/read-all', {}).catch(() => {});
        this.rows.forEach(r => r.is_read = true);
        this.unread = 0;
        this.updateDot();
        this.renderList();
      };
    }

    const closeBtn = this.panelEl.querySelector<HTMLButtonElement>('#ap-notif-close');
    if (closeBtn) closeBtn.onclick = () => this.closePanel();

    this.panelEl.querySelectorAll<HTMLElement>('.ap-notif-item').forEach(item => {
      item.onclick = async (e) => {
        if ((e.target as HTMLElement).closest('.ap-notif-del-btn')) return;
        const id   = item.dataset.id!;
        const link = item.dataset.link;

        if (item.classList.contains('ap-notif-item--unread')) {
          await api.patch(`/api/v1/notifications/${id}/read`, {}).catch(() => {});
          const row = this.rows.find(r => r.id === id);
          if (row && !row.is_read) { row.is_read = true; this.unread = Math.max(0, this.unread - 1); }
          this.updateDot();
          item.classList.remove('ap-notif-item--unread');
        }

        if (link) {
          this.closePanel();
          (window as unknown as { router?: { navigate: (p: string) => void } }).router?.navigate(link);
        }
      };
    });

    this.panelEl.querySelectorAll<HTMLButtonElement>('.ap-notif-del-btn').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const id = btn.dataset.del!;
        await api.delete(`/api/v1/notifications/${id}`).catch(() => {});
        const idx = this.rows.findIndex(r => r.id === id);
        if (idx !== -1) {
          if (!this.rows[idx].is_read) this.unread = Math.max(0, this.unread - 1);
          this.rows.splice(idx, 1);
        }
        this.updateDot();
        this.renderList();
      };
    });

    const viewAllBtn = this.panelEl.querySelector<HTMLButtonElement>('#ap-notif-view-all');
    if (viewAllBtn) {
      viewAllBtn.onclick = () => {
        this.closePanel();
        (window as unknown as { router?: { navigate: (p: string) => void } }).router?.navigate('/admin/notifications');
      };
    }
  }

  private updateDot() {
    if (!this.dotEl) return;
    this.dotEl.style.display = this.unread > 0 ? '' : 'none';
  }

  destroy() {
    this.closePanel();
  }
}
