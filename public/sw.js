// PDKS Service Worker — PWA + Offline Desteği
const CACHE_NAME    = 'pdks-build-4ae8a3ed';  // holiday modal fix + modal z-index → v8
const JS_CACHE      = 'pdks-js-4ae8a3ed';

// Sadece JS chunk'ları ve ikonlar pre-cache'lenir
// CSS: her zaman ağdan çekilir (geliştirme sürecinde değişiyor)
const PRECACHE_ASSETS = [
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(JS_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// ── Activate: eski cache'leri temizle ────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== JS_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  event.waitUntil(clients.claim());
});

// ── Fetch ────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API — Network-First, offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: 'Çevrimdışı', offline: true }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // CSS — her zaman ağdan çek, cache'leme (sunucu no-store header gönderiyor)
  if (request.method === 'GET' && url.pathname.startsWith('/css/')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // JS chunk'ları — Cache-First (hash'li dosyalar, değişmez)
  if (request.method === 'GET' && url.pathname.startsWith('/js/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(JS_CACHE).then((c) => c.put(request, clone));
        }
        return res;
      }))
    );
    return;
  }

  // İkonlar + manifest — Cache-First
  if (
    request.method === 'GET' &&
    (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.json')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      }))
    );
    return;
  }

  // HTML navigasyonu — Network-First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then((cached) =>
          cached ||
          new Response('<h1>Çevrimdışı</h1><p>İnternet bağlantısı gerekli.</p>', {
            headers: { 'Content-Type': 'text/html' },
          })
        )
      )
    );
    return;
  }
});

// ── Push Bildirimleri ────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'PDKS Bildirimi', body: '' };
  try {
    if (event.data) data = JSON.parse(event.data.text());
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body || '',
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-72.png',
      vibrate: [100, 50, 100],
      data:    { url: data.url || '/home' },
      actions: [
        { action: 'open',    title: 'Aç' },
        { action: 'dismiss', title: 'Kapat' },
      ],
    })
  );
});

// ── Bildirim Tıklaması ───────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/home';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Background Sync ──────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'pdks-offline-sync') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((wcs) => {
        wcs.forEach((c) => c.postMessage({ type: 'SYNC_OFFLINE_QUEUE' }));
      })
    );
  }
});
