import { state } from './StateManager.js';
import type { BasePage } from './BasePage.js';

type PageConstructor = new (container: HTMLElement) => BasePage;
type PageLoader      = () => Promise<PageConstructor>;
type Routes          = Record<string, PageLoader>;

export class Router {
  private routes: Routes;
  private container: HTMLElement;
  private current: BasePage | null = null;

  constructor(routes: Routes, appContainer: HTMLElement) {
    this.routes    = routes;
    this.container = appContainer;

    window.addEventListener('popstate', () => this._render(location.pathname));
  }

  async navigate(path: string) {
    history.pushState(null, '', path);
    await this._render(path);
  }

  prefetch(path: string) {
    const loader = this.routes[path];
    if (loader) loader().catch(() => {});
  }

  async _render(path: string) {
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    if (!state.get('user') && path !== '/login') {
      return this.navigate('/login');
    }
    if (state.get('user') && path === '/login') {
      return this.navigate('/home');
    }

    const loader = this.routes[path] ?? this.routes['/home'];

    if (!loader) {
      this.container.innerHTML = `
        <div style="padding:40px;text-align:center;color:var(--color-muted)">
          <p>Sayfa bulunamadı</p>
        </div>`;
      return;
    }

    this.current?.destroy();
    this.container.innerHTML = '';
    this.container.classList.add('page-enter');
    setTimeout(() => this.container.classList.remove('page-enter'), 200);

    // Lazy load — sadece bu sayfanın chunk'ı indirilir
    let PageClass;
    try {
      PageClass = await loader();
    } catch {
      // Chunk yüklenemedi (CORS, ağ hatası vb.) — sayfayı yeniden yükle
      this.container.innerHTML = `
        <div style="padding:40px;text-align:center">
          <p style="color:var(--color-muted);margin-bottom:16px">Sayfa yüklenemedi.</p>
          <button class="btn btn-primary" onclick="location.reload()">Yenile</button>
        </div>`;
      return;
    }
    this.current = new PageClass(this.container);
    await this.current.render();
  }
}
