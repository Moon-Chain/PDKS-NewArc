import { BaseComponent } from '../../../ts/core/BaseComponent.js';
import { api } from '../../../ts/core/ApiClient.js';
import { state } from '../../../ts/core/StateManager.js';
import { icon } from '../icons.js';
import { AdminNotifPanel } from './AdminNotifPanel.js';

interface AdminTopBarProps {
  title: string;
  subtitle: string;
  railCollapsed: boolean;
  onMenuToggle: () => void;
  onRailToggle: () => void;
}

export class AdminTopBar extends BaseComponent {
  private notifPanel: AdminNotifPanel | null = null;

  constructor(private opts: AdminTopBarProps) {
    super({});
  }

  template(): string {
    const railIcon = this.opts.railCollapsed ? 'panel-left-open' : 'panel-left-close';
    return `
      <header class="topbar">
        <div class="topbar-left">
          <button class="btn btn-ghost icon-btn sidebar-toggle" aria-label="Menüyü aç/kapat" id="admin-menu-toggle">
            ${icon('menu')}
          </button>
          <button class="topbar-icon rail-toggle" aria-label="Kenar çubuğunu daralt/genişlet" title="Kenar çubuğunu daralt/genişlet" id="admin-rail-toggle">
            ${icon(railIcon)}
          </button>
          <div>
            <h1 id="admin-page-title">${this.opts.title}</h1>
            <div class="topbar-sub" id="admin-page-sub">${this.opts.subtitle}</div>
          </div>
        </div>

        <div class="topbar-search">
          <span class="search-ico">${icon('search', 'icon icon-sm')}</span>
          <input type="text" placeholder="Personel, kayıt veya sayfa ara…" aria-label="Ara" />
          <span class="search-kbd">⌘K</span>
        </div>

        <div class="topbar-actions">
          <button class="topbar-icon" id="admin-notif-bell" aria-label="Bildirimler" title="Bildirimler">
            ${icon('bell')}
            <span class="dot" id="admin-notif-dot" style="display:none"></span>
          </button>
          <button class="topbar-icon" id="admin-logout" aria-label="Çıkış Yap" title="Çıkış Yap">
            ${icon('log-out')}
          </button>
        </div>
      </header>
    `;
  }

  afterMount() {
    this.$('#admin-menu-toggle')?.addEventListener('click', () => this.opts.onMenuToggle());
    this.$('#admin-rail-toggle')?.addEventListener('click', () => this.opts.onRailToggle());

    this.$('#admin-logout')?.addEventListener('click', async () => {
      try { await api.post('/api/v1/auth/logout'); } catch { /* ignore */ }
      state.set('user', null);
      state.set('profile', null);
      location.href = '/login';
    });

    const bellEl = this.$('#admin-notif-bell') as HTMLElement | null;
    if (bellEl) {
      this.notifPanel = new AdminNotifPanel();
      this.notifPanel.mount(bellEl, this.$('#admin-notif-dot') as HTMLElement | null);
    }
  }

  setRailCollapsed(collapsed: boolean) {
    const btn = this.$('#admin-rail-toggle');
    if (!btn) return;
    btn.innerHTML = icon(collapsed ? 'panel-left-open' : 'panel-left-close');
  }

  setTitle(title: string, subtitle: string) {
    const titleEl = this.$('#admin-page-title');
    const subEl   = this.$('#admin-page-sub');
    if (titleEl) titleEl.textContent = title;
    if (subEl)   subEl.textContent   = subtitle;
  }
}
