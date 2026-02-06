const CACHE_NAME = 'padelia-v2';
const urlsToCache = [
//   '/padelia-web/chat/',
//   '/padelia-web/assets/palette.css',
//   '/padelia-web/assets/styles.css',
//   '/padelia-web/chat/chat.css',
  '/padelia-web/assets/logo.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});