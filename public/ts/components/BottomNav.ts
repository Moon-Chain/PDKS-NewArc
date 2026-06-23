import { BaseComponent } from '../core/BaseComponent.js';

/* Mini SVG iconlar — lucide stili, 22×22 */
const ICONS = {
  clock: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  fileText: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  checkCircle: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  users: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  user: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  calendar: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  qrCode: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3"/><path d="M17 17h4v4"/><path d="M14 21h3"/><path d="M21 14v3"/></svg>`,
  settings: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
};

interface NavItem {
  path:  string;
  label: string;
  icon:  string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/home',      label: 'Ana Sayfa',  icon: ICONS.clock,       roles: ['admin','mudur','takim_lideri','personel'] },
  { path: '/leaves',    label: 'İzinler',    icon: ICONS.fileText,    roles: ['admin','mudur','takim_lideri','personel'] },
  { path: '/approvals', label: 'Onaylar',    icon: ICONS.checkCircle, roles: ['admin','mudur'] },
  { path: '/users',     label: 'Personel',   icon: ICONS.users,       roles: ['admin','mudur'] },
  { path: '/movements', label: 'Hareketler', icon: ICONS.calendar,    roles: ['admin','mudur'] },
  { path: '/settings',  label: 'Ayarlar',    icon: ICONS.qrCode,      roles: ['admin','mudur'] },
  { path: '/profile',   label: 'Profil',     icon: ICONS.user,        roles: ['admin','mudur','takim_lideri','personel'] },
];

export class BottomNav extends BaseComponent {
  private role: string;

  constructor(role: string) {
    super({});
    this.role = role;
  }

  template(): string {
    const items = NAV_ITEMS.filter((i) => i.roles.includes(this.role));
    return `
      <nav class="bottom-nav">
        <div class="bottom-nav-inner">
          ${items.map((item) => `
            <button class="bottom-nav-item" data-path="${item.path}" type="button">
              <span class="bottom-nav-icon">${item.icon}</span>
              <span class="bottom-nav-label">${item.label}</span>
            </button>
          `).join('')}
        </div>
      </nav>
    `;
  }

  afterMount() {
    this.setActive(location.pathname);

    this.el?.querySelectorAll('.bottom-nav-item').forEach((btn) => {
      const path = (btn as HTMLElement).dataset.path!;
      const win = window as unknown as { router?: { navigate: (p: string) => void; prefetch?: (p: string) => void } };

      btn.addEventListener('mouseenter', () => win.router?.prefetch?.(path), { passive: true } as AddEventListenerOptions);
      btn.addEventListener('touchstart', () => win.router?.prefetch?.(path), { passive: true, once: true } as AddEventListenerOptions);

      btn.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(50);
        win.router?.navigate(path);
      });
    });
  }

  setActive(path: string) {
    this.el?.querySelectorAll('.bottom-nav-item').forEach((btn) => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.path === path);
    });
  }
}
