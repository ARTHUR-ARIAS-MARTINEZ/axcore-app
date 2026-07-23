const CACHE_NAME = 'axcore-v5.56-insignias-autoupdate';
const urlsToCache = [
  './',
  './index.html?v=20260722b',
  './index.css?v=20260722b',
  './premium.css?v=20260722b',
  './profile-persist.js?v=20260722b',
  './app.js?v=20260722b',
  './knowledge.js?v=20260722b',
  './logo.png',
  './logo_coach.png',
  './manifest_vip.json',
  './coach.html',
  './aviso_privacidad.html',
  './terminos.html'
];

// No críticos (scripts de badges + 39 imágenes de insignias): precache NO atómico.
// Si algo aquí fallara (imagen faltante, etc.) NO rompe la instalación del Service Worker.
const optionalCache = [
  './premium-badges.js?v=20260722b',
  './premium-extras.js?v=20260722b',
  './assets/insignias/racha_bronce.webp','./assets/insignias/racha_plata.webp','./assets/insignias/racha_oro.webp','./assets/insignias/racha_platino.webp','./assets/insignias/racha_leyenda.webp',
  './assets/insignias/peso_bronce.webp','./assets/insignias/peso_plata.webp','./assets/insignias/peso_oro.webp','./assets/insignias/peso_platino.webp','./assets/insignias/peso_leyenda.webp',
  './assets/insignias/medidas_bronce.webp','./assets/insignias/medidas_plata.webp','./assets/insignias/medidas_oro.webp','./assets/insignias/medidas_platino.webp',
  './assets/insignias/ejercicio_bronce.webp','./assets/insignias/ejercicio_plata.webp','./assets/insignias/ejercicio_oro.webp','./assets/insignias/ejercicio_platino.webp','./assets/insignias/ejercicio_leyenda.webp',
  './assets/insignias/comida_bronce.webp','./assets/insignias/comida_plata.webp','./assets/insignias/comida_oro.webp','./assets/insignias/comida_platino.webp','./assets/insignias/comida_leyenda.webp',
  './assets/insignias/deficit_bronce.webp','./assets/insignias/deficit_plata.webp','./assets/insignias/deficit_oro.webp','./assets/insignias/deficit_platino.webp','./assets/insignias/deficit_leyenda.webp',
  './assets/insignias/constancia_bronce.webp','./assets/insignias/constancia_plata.webp','./assets/insignias/constancia_oro.webp','./assets/insignias/constancia_platino.webp','./assets/insignias/constancia_leyenda.webp',
  './assets/insignias/comunidad_bronce.webp','./assets/insignias/comunidad_plata.webp','./assets/insignias/comunidad_oro.webp','./assets/insignias/comunidad_platino.webp','./assets/insignias/comunidad_leyenda.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(urlsToCache).then(() =>
        Promise.allSettled(optionalCache.map(u => cache.add(u)))
      )
    )
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
