import { BaseComponent } from '../../../ts/core/BaseComponent.js';
import { state } from '../../../ts/core/StateManager.js';
import { ADMIN_MODULES, ADMIN_GROUP_LABELS, type AdminModuleGroup } from '../moduleRegistry.js';
import { icon } from '../icons.js';

interface UserProfile { name: string; role: string; }

const GROUP_ORDER: AdminModuleGroup[] = ['operasyon', 'insan-kaynaklari', 'ayarlar', 'sistem'];

export class Sidebar extends BaseComponent {
  private activePath: string;

  constructor(activePath: string) {
    super({});
    this.activePath = activePath;
  }

  template(): string {
    const profile = state.get<UserProfile>('profile');
    const name    = profile?.name ?? '';
    const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'A';
    const roleLabel = profile?.role === 'admin' ? 'Tam Yetkili Admin' : (profile?.role ?? '');

    const groups = GROUP_ORDER.map(group => {
      const items = ADMIN_MODULES.filter(m => m.group === group);
      if (!items.length) return '';
      return `
        <div class="nav-group">
          <div class="nav-group-label">${ADMIN_GROUP_LABELS[group]}</div>
          ${items.map(item => `
            <div class="nav-item ${item.path === this.activePath ? 'active' : ''} ${item.locked ? 'locked' : ''}"
                 data-path="${item.locked ? '' : item.path}"
                 data-label="${item.label}"
                 title="${item.locked ? 'Henüz aktif değil — ' + item.locked.note : ''}">
              <span class="nav-icon">${icon(item.icon)}</span>
              <span>${item.label}</span>
              ${item.locked ? `<span class="nav-badge">${item.locked.note}</span>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }).join('');

    return `
      <aside class="sidebar" id="admin-sidebar">
        <div class="sidebar-logo">
          <div class="logo-mark">P</div>
          <div class="logo-text">
            <strong>PDKS Admin</strong>
            <span>Yönetim Paneli</span>
          </div>
        </div>

        <nav class="sidebar-nav">${groups}</nav>

        <div class="sidebar-footer">
          <div class="user-card">
            <div class="avatar">${initials}</div>
            <div class="user-info">
              <strong>${name}</strong>
              <span>${roleLabel}</span>
            </div>
            <span class="user-caret">${icon('chevrons-up-down', 'icon icon-sm')}</span>
          </div>
        </div>
      </aside>
    `;
  }

  afterMount() {
    this.$$('.nav-item[data-path]').forEach(el => {
      const path = el.getAttribute('data-path');
      if (!path) return; // kilitli modül — navigasyon yok
      el.addEventListener('click', () => {
        (window as unknown as { router?: { navigate: (p: string) => void } }).router?.navigate(path);
      });
    });
  }

  private $$(selector: string): NodeListOf<Element> {
    return (this.el as HTMLElement)?.querySelectorAll(selector) ?? document.querySelectorAll('.never-match');
  }

  setActive(path: string) {
    this.activePath = path;
    this.$$('.nav-item').forEach(el => el.classList.remove('active'));
    const target = this.$$('.nav-item[data-path]') as NodeListOf<HTMLElement>;
    target.forEach(el => {
      if (el.getAttribute('data-path') === path) el.classList.add('active');
    });
  }
}
