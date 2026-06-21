import { Router } from '../../ts/core/Router.js';
import { state } from '../../ts/core/StateManager.js';
import { api } from '../../ts/core/ApiClient.js';
import { AdminLayout } from './layout/AdminLayout.js';
import { ADMIN_MODULES, ADMIN_EXTRA_ROUTES, type AdminPageConstructor } from './moduleRegistry.js';
import { applyAppearance } from './tweaks/appearance.js';
import { eventStream } from '../../ts/core/EventStream.js';

applyAppearance();

interface UserProfile {
  id: string; role: string; company_id: string; name: string; title?: string;
}

// ── Lazy routes — moduleRegistry'den üretilir ────────────────
const routes: Record<string, () => Promise<AdminPageConstructor>> = {};
for (const mod of [...ADMIN_MODULES, ...ADMIN_EXTRA_ROUTES]) {
  routes[mod.path] = mod.loader;
}

async function init() {
  const app = document.getElementById('admin-app');
  if (!app) throw new Error('#admin-app bulunamadı');

  const profile = await api.get<UserProfile>('/api/v1/auth/me').catch(() => null);

  if (!profile || !('id' in profile)) {
    window.location.href = '/login';
    return;
  }
  if (profile.role !== 'admin') {
    window.location.href = '/';
    return;
  }

  state.set('user',    { id: profile.id, role: profile.role, company_id: profile.company_id });
  state.set('profile', profile);

  eventStream.connect();

  const layout = new AdminLayout(app, location.pathname);
  const router = new Router(routes, layout.contentEl);
  (window as unknown as { router: Router }).router = router;

  const origNavigate = router.navigate.bind(router);
  router.navigate = async (path: string) => {
    await origNavigate(path);
    layout.setActivePage(path);
  };

  await router._render(location.pathname);
  layout.setActivePage(location.pathname);
}

// ── Global hata yakalama ─────────────────────────────────────
window.onerror = (msg, src, line, col, err) => {
  console.error('[PDKS Admin] Global hata:', { msg, src, line, col, err });
};
window.addEventListener('unhandledrejection', (ev) => {
  console.error('[PDKS Admin] İşlenmemiş Promise hatası:', ev.reason);
});

init().catch((err) => {
  console.error('Admin paneli başlatılamadı:', err);
  const app = document.getElementById('admin-app');
  if (app) {
    app.innerHTML = `<div style="padding:40px;text-align:center;color:#ef4444;">
      Admin paneli başlatılamadı. Sayfayı yenileyin.
    </div>`;
  }
});
