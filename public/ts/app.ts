import Alpine from 'alpinejs';
import { Router } from './core/Router.js';
import { state } from './core/StateManager.js';
import { api } from './core/ApiClient.js';
import { eventStream } from './core/EventStream.js';
import { initOfflineBanner, listenSWSync, syncQueue } from './offline.js';
import { BottomNav } from './components/BottomNav.js';
import { TopBar } from './components/TopBar.js';

// Alpine global — her yerden erişilebilir
(window as unknown as { Alpine: typeof Alpine }).Alpine = Alpine;

// ── Lazy routes: her sayfa kendi chunk'ında ──────────────────
const routes = {
  '/login':         () => import('./pages/LoginPage.js').then(m => m.LoginPage),
  '/home':          () => import('./pages/HomePage.js').then(m => m.HomePage),
  '/leaves':        () => import('./pages/LeavesPage.js').then(m => m.LeavesPage),
  '/approvals':     () => import('./pages/ApprovalsPage.js').then(m => m.ApprovalsPage),
  '/users':         () => import('./pages/UsersPage.js').then(m => m.UsersPage),
  '/profile':       () => import('./pages/ProfilePage.js').then(m => m.ProfilePage),
  '/movements':     () => import('./pages/MovementsPage.js').then(m => m.MovementsPage),
  '/qr':            () => import('./pages/QRDisplayPage.js').then(m => m.QRDisplayPage),
  '/settings':      () => import('./pages/SettingsPage.js').then(m => m.SettingsPage),
  '/notifications': () => import('./pages/NotificationsPage.js').then(m => m.NotificationsPage),
};

interface UserProfile {
  id: string; role: string; company_id: string; name: string; title?: string;
}

let currentNav: BottomNav | null = null;

function renderTopBar() {
  const headerEl = document.getElementById('header-container')!;
  headerEl.innerHTML = '';
  const user    = state.get('user') as UserProfile | null;
  const profile = state.get('profile') as UserProfile | null;
  if (user) new TopBar(profile).mount(headerEl);
}

function renderNav() {
  const user      = state.get('user') as UserProfile | null;
  const container = document.getElementById('nav-container')!;
  container.innerHTML = '';
  currentNav = null;
  if (user) {
    currentNav = new BottomNav(user.role);
    currentNav.mount(container);
  }
}

async function init() {
  const app = document.getElementById('app');
  if (!app) throw new Error('#app bulunamadı');

  const profile = await api.get<UserProfile>('/api/v1/auth/me').catch(() => null);
  if (profile && 'id' in profile) {
    state.set('user',    { id: profile.id, role: profile.role, company_id: profile.company_id });
    state.set('profile', profile);
  }

  const router = new Router(routes, app);
  (window as unknown as { router: Router }).router = router;

  state.watch('user', (user) => {
    renderTopBar();
    renderNav();
    if (user && currentNav) currentNav.setActive(location.pathname);
    if (user) eventStream.connect();
    else      eventStream.disconnect();
  });

  state.watch('profile', () => renderTopBar());

  renderTopBar();
  renderNav();
  if (state.get('user')) eventStream.connect();

  const origNavigate = router.navigate.bind(router);
  const setRouteAttr = (path: string) => {
    document.body.dataset.route = path.split('?')[0];
  };

  router.navigate = async (path: string) => {
    await origNavigate(path);
    setRouteAttr(path);
    if (currentNav) currentNav.setActive(path);
  };

  await router._render(location.pathname);
  setRouteAttr(location.pathname);
  if (currentNav) currentNav.setActive(location.pathname);
}

// ── Service Worker ───────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ── Offline ──────────────────────────────────────────────────
initOfflineBanner();

async function sendOfflineItem(item: { type: 'in' | 'out'; qrValue: string; timestamp: string }) {
  await api.post('/api/v1/attendance', {
    type: item.type, qrValue: item.qrValue, timestamp: item.timestamp, isOffline: true,
  });
}
listenSWSync(sendOfflineItem);
window.addEventListener('online', () => syncQueue(sendOfflineItem).catch(() => {}));

// ── Global hata yakalama ─────────────────────────────────────
window.onerror = (msg, src, line, col, err) => {
  console.error('[PDKS] Global hata:', { msg, src, line, col, err });
};
window.addEventListener('unhandledrejection', (ev) => {
  console.error('[PDKS] İşlenmemiş Promise hatası:', ev.reason);
});

// ── Alpine.js başlat ─────────────────────────────────────────
// MutationObserver ile yeni x-data elementlerini otomatik yakalar
Alpine.start();

// ── Uygulamayı başlat ────────────────────────────────────────
init().catch((err) => {
  console.error('Uygulama başlatılamadı:', err);
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `<div style="padding:40px;text-align:center;color:#ef4444;">
      Uygulama başlatılamadı. Sayfayı yenileyin.
    </div>`;
  }
});
