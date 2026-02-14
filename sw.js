const CACHE_NAME = 'padelia-20260214b';

const urlsToCache = [
  '/padelia-web/chat/',
  '/padelia-web/assets/palette.css',
  '/padelia-web/assets/styles.css',
  '/padelia-web/assets/logo.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();  // ← Fuerza actualización inmediata
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  // Borra caches viejos
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});