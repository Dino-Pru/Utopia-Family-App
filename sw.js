const CACHE_NAME = 'family-app-pwa-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon/family.png',
  '/icon/family.png',
  '/image/user(1).png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/webfonts/fa-solid-900.ttf'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets');
      return Promise.all(
        urlsToCache.map((url) => {
          return fetch(url, { mode: 'no-cors' }).then((response) => {
            if (!response.ok) {
              console.log(`Failed to fetch ${url}: Status ${response.status}`);
              return Promise.resolve();
            }
            return cache.put(url, response);
          }).catch((err) => {
            console.log(`Failed to cache ${url}:`, err);
            return Promise.resolve();
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        return caches.match('/index.html');
      });
    })
  );
});