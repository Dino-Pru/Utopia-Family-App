// Ensure this script is only executed in a browser environment (service worker context)
if (typeof self !== 'undefined') {
  self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing (version family-app-v6)...');
    event.waitUntil(
      caches.open('family-app-v6').then((cache) => {
        console.log('Service Worker: Caching files...');
        const filesToCache = [
          '/',
          '/index.html',
          '/events.html',
          '/electricity.html',
          '/water.html',
          '/petrol.html',
          '/maintenance.html',
          '/budgets.html',
          '/settings.html',
          '/chat.html',
          '/manifest.json',
          '/icons/icon-192x192.png',
          '/image/user(1).png'
        ];

        const cachePromises = filesToCache.map((url) => {
          return cache.add(url).catch((err) => {
            console.error(`Service Worker: Failed to cache ${url}:`, err);
          });
        });

        return Promise.allSettled(cachePromises).then((results) => {
          console.log('Service Worker: Caching complete. Results:', results);
          return self.skipWaiting();
        });
      }).catch((err) => {
        console.error('Service Worker: Cache open failed:', err);
      })
    );
  });

  self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.filter((cacheName) => cacheName !== 'family-app-v6')
            .map((cacheName) => {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        ).then(() => {
          console.log('Service Worker: Activated and taking control');
          return self.clients.claim();
        });
      })
    );
  });

  self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    console.log('Service Worker: Fetching:', requestUrl.pathname);

    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request).then((networkResponse) => {
          console.log('Service Worker: Network fetch successful:', requestUrl.pathname);
          return caches.open('family-app-v6').then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }).catch((err) => {
          console.log('Service Worker: Network fetch failed:', err);
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('Service Worker: Serving from cache:', requestUrl.pathname);
              return cachedResponse;
            }
            console.log('Service Worker: No cache found, falling back to /index.html');
            return caches.match('/index.html');
          });
        })
      );
    } else {
      event.respondWith(
        fetch(event.request).then((networkResponse) => {
          if (event.request.method === 'GET') {
            caches.open('family-app-v6').then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('Service Worker: Serving asset from cache:', requestUrl.pathname);
              return cachedResponse;
            }
            console.log('Service Worker: Asset not found in cache:', requestUrl.pathname);
            return new Response('', { status: 404 });
          });
        })
      );
    }
  });
} else {
  console.error('Service Worker: self is not defined. This script should only run in a browser service worker context.');
}
