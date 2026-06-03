import { BaseComponent } from '../core/BaseComponent.js';
import { api } from '../core/ApiClient.js';
import { state } from '../core/StateManager.js';
import { NotificationPanel } from './NotificationPanel.js';

interface UserProfile { name: string; role: string; title?: string; avatar_path?: string; }

const ICON_CLOCK  = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const ICON_LOGOUT = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;

export class TopBar extends BaseComponent {
  private profile: UserProfile | null;
  private notifPanel: NotificationPanel | null = null;

  constructor(profile: UserProfile | null) {
    super({});
    this.profile = profile;
  }

  template(): string {
    const name      = this.profile?.name ?? '';
    const role      = this.profile?.role ?? '';
    const roleLabel = role === 'admin' ? 'Yönetici' : role === 'mudur' ? 'Müdür' : role === 'takim_lideri' ? 'Takım Lideri' : 'Personel';
    const initial   = name?.[0]?.toUpperCase() || 'U';
    const avatar    = this.profile?.avatar_path;

    return `
      <header class="topbar">
        <div class="topbar-inner">

          <!-- Sol: Logo -->
          <div class="topbar-brand">
            <div class="topbar-logo">${ICON_CLOCK}</div>
            <div class="topbar-titles">
              <span class="topbar-name">PDKS</span>
              <span class="topbar-sub">Personel Takip</span>
            </div>
          </div>

          <!-- Sağ: Bildirim + Kullanıcı + Logout -->
          <div class="topbar-right">

            <!-- Bildirim çanı -->
            <div id="notif-bell-container"></div>

            <div class="topbar-user">
              <div class="topbar-user-info">
                <span class="topbar-user-name">${name}</span>
                <span class="topbar-user-role">${roleLabel}</span>
              </div>
              <button class="topbar-avatar" id="topbar-profile" title="Profil">
                ${avatar
                  ? `<img src="${avatar}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
                  : initial}
              </button>
            </div>
            <button class="topbar-logout-btn" id="topbar-logout" title="Çıkış Yap">
              ${ICON_LOGOUT}
            </button>
          </div>

        </div>
      </header>
    `;
  }

  afterMount() {
    this.$('#topbar-profile')?.addEventListener('click', () => {
      (window as unknown as { router?: { navigate: (p: string) => void } }).router?.navigate('/profile');
    });

    this.$('#topbar-logout')?.addEventListener('click', async () => {
      try { await api.post('/api/v1/auth/logout'); } catch { /* ignore */ }
      this.notifPanel?.destroy();
      state.set('user', null);
      state.set('profile', null);
      (window as unknown as { router?: { navigate: (p: string) => void } }).router?.navigate('/login');
    });

    // Bildirim paneli
    const bellContainer = this.$('#notif-bell-container') as HTMLElement | null;
    if (bellContainer) {
      this.notifPanel = new NotificationPanel();
      this.notifPanel.mount(bellContainer);
    }
  }
}
