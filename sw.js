const CACHE_NAME = 'axcore-v5.89-calc-amigable';
const urlsToCache = [
  './',
  './index.html?v=20260824d',
  './index.css?v=20260824d',
  './premium.css?v=20260824d',
  './profile-persist.js?v=20260824d',
  './app.js?v=20260824d',
  './knowledge.js?v=20260824d',
  './logo.png',
  './logo_coach.png',
  './manifest.json',
  './manifest_vip.json',
  './assets/icons/coach-192.png',
  './assets/icons/coach-512.png',
  './assets/icons/app-192.png',
  './assets/icons/app-512.png',
  './manifest_admin.json',
  './assets/icons/admin-192.png',
  './assets/icons/admin-512.png',
  './coach.html',
  './guia.html?v=20260824d',
  './aviso_privacidad.html',
  './terminos.html'
];

// No críticos (scripts de badges + 39 imágenes de insignias): precache NO atómico.
// Si algo aquí fallara (imagen faltante, etc.) NO rompe la instalación del Service Worker.
const optionalCache = [
  './premium-badges.js?v=20260824d',
  './premium-extras.js?v=20260824d',
  './axcore-back.js?v=20260824d',
  './assets/insignias/racha_bronce.webp?v=3','./assets/insignias/racha_plata.webp?v=3','./assets/insignias/racha_oro.webp?v=3','./assets/insignias/racha_platino.webp?v=3','./assets/insignias/racha_leyenda.webp?v=3',
  './assets/insignias/peso_bronce.webp?v=3','./assets/insignias/peso_plata.webp?v=3','./assets/insignias/peso_oro.webp?v=3','./assets/insignias/peso_platino.webp?v=3','./assets/insignias/peso_leyenda.webp?v=3',
  './assets/insignias/medidas_bronce.webp?v=3','./assets/insignias/medidas_plata.webp?v=3','./assets/insignias/medidas_oro.webp?v=3','./assets/insignias/medidas_platino.webp?v=3',
  './assets/insignias/ejercicio_bronce.webp?v=3','./assets/insignias/ejercicio_plata.webp?v=3','./assets/insignias/ejercicio_oro.webp?v=3','./assets/insignias/ejercicio_platino.webp?v=3','./assets/insignias/ejercicio_leyenda.webp?v=3',
  './assets/insignias/comida_bronce.webp?v=3','./assets/insignias/comida_plata.webp?v=3','./assets/insignias/comida_oro.webp?v=3','./assets/insignias/comida_platino.webp?v=3','./assets/insignias/comida_leyenda.webp?v=3',
  './assets/insignias/deficit_bronce.webp?v=3','./assets/insignias/deficit_plata.webp?v=3','./assets/insignias/deficit_oro.webp?v=3','./assets/insignias/deficit_platino.webp?v=3','./assets/insignias/deficit_leyenda.webp?v=3',
  './assets/insignias/constancia_bronce.webp?v=3','./assets/insignias/constancia_plata.webp?v=3','./assets/insignias/constancia_oro.webp?v=3','./assets/insignias/constancia_platino.webp?v=3','./assets/insignias/constancia_leyenda.webp?v=3',
  './assets/insignias/comunidad_bronce.webp?v=3','./assets/insignias/comunidad_plata.webp?v=3','./assets/insignias/comunidad_oro.webp?v=3','./assets/insignias/comunidad_platino.webp?v=3','./assets/insignias/comunidad_leyenda.webp?v=3',
  './assets/insignias/especial_legend.webp?v=3','./assets/insignias/inicio.webp?v=3',
  './assets/qr-axcore.png?v=1'
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
