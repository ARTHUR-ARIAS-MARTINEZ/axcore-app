const CACHE_NAME = 'axcore-v2.1';
const urlsToCache = [
  './',
  './index.html',
  './index.css',
  './app.js',
  './knowledge.js',
  './logo.png',
  './logo_coach.png',
  './manifest_vip.json',
  './coach.html'
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
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia Network-First para siempre tener la última versión si hay internet
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
