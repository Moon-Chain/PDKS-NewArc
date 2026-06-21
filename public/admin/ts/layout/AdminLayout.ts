import { Sidebar } from './Sidebar.js';
import { AdminTopBar } from './AdminTopBar.js';
import { findAdminModule } from '../moduleRegistry.js';

const RAIL_STORAGE_KEY = 'pdks-admin-sidebar';

export class AdminLayout {
  readonly contentEl: HTMLElement;

  private shellEl: HTMLElement;
  private sidebar: Sidebar;
  private topbar: AdminTopBar;
  private sidebarEl: HTMLElement | null = null;
  private overlayEl: HTMLElement | null = null;
  private railCollapsed: boolean;

  constructor(container: HTMLElement, initialPath: string) {
    this.railCollapsed = localStorage.getItem(RAIL_STORAGE_KEY) === 'collapsed';

    const mod = findAdminModule(initialPath);

    this.shellEl = document.createElement('div');
    this.shellEl.className = 'admin-shell';
    this.shellEl.setAttribute('data-sidebar', this.railCollapsed ? 'collapsed' : 'expanded');

    this.overlayEl = document.createElement('div');
    this.overlayEl.className = 'sidebar-overlay';
    this.shellEl.appendChild(this.overlayEl);

    this.sidebar = new Sidebar(initialPath);
    this.sidebar.mount(this.shellEl);
    this.sidebarEl = this.shellEl.querySelector('#admin-sidebar');

    const main = document.createElement('div');
    this.shellEl.appendChild(main);

    this.topbar = new AdminTopBar({
      title:         mod?.title ?? '',
      subtitle:      mod?.subtitle ?? '',
      railCollapsed: this.railCollapsed,
      onMenuToggle:  () => this.toggleMobileSidebar(),
      onRailToggle:  () => this.toggleRail(),
    });
    this.topbar.mount(main);

    this.contentEl = document.createElement('main');
    this.contentEl.className = 'content page-enter';
    main.appendChild(this.contentEl);

    this.overlayEl.addEventListener('click', () => this.closeMobileSidebar());

    container.innerHTML = '';
    container.appendChild(this.shellEl);
  }

  setActivePage(path: string) {
    this.sidebar.setActive(path);
    const mod = findAdminModule(path);
    this.topbar.setTitle(mod?.title ?? '', mod?.subtitle ?? '');
    this.closeMobileSidebar();
  }

  private toggleRail() {
    this.railCollapsed = !this.railCollapsed;
    this.shellEl.setAttribute('data-sidebar', this.railCollapsed ? 'collapsed' : 'expanded');
    localStorage.setItem(RAIL_STORAGE_KEY, this.railCollapsed ? 'collapsed' : 'expanded');
    this.topbar.setRailCollapsed(this.railCollapsed);
  }

  private toggleMobileSidebar() {
    this.sidebarEl?.classList.toggle('open');
    this.overlayEl?.classList.toggle('open');
  }

  private closeMobileSidebar() {
    this.sidebarEl?.classList.remove('open');
    this.overlayEl?.classList.remove('open');
  }
}
