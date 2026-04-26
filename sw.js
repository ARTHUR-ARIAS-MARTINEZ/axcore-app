const CACHE_NAME = 'axcore-v2.2';
const urlsToCache = [
  './',
  './index.html',
  './index.css',
  './app.js',
  './knowledge.js',
  './logo.png',
  './logo_coach.png',
  './manifest_vip.json',
  './coach.html',
  './aviso_privacidad.html',
  './terminos.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                  .map(cacheName => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Network-First — siempre intenta red, cae a caché si offline
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ============================================================
// PUSH NOTIFICATIONS
// El backend (con web-push y VAPID keys) envía payloads como:
//   { title, body, icon, url }
// ============================================================
self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch { payload = { title: 'AX-CORE', body: event.data ? event.data.text() : '' }; }

  const title = payload.title || 'AX-CORE';
  const options = {
    body: payload.body || '',
    icon: payload.icon || './logo.png',
    badge: './logo.png',
    vibrate: [120, 60, 120],
    data: { url: payload.url || './' },
    requireInteraction: false
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

// ============================================================
// REMINDER LOCAL (sin backend) — el cliente programa esto
// ============================================================
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
