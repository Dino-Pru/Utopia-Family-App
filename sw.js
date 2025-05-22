self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open('family-app-v4').then((cache) => {
      console.log('Service Worker: Caching files...');
      return cache.addAll([
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
        '/image/user(1).png',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/webfonts/fa-solid-900.woff2',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/webfonts/fa-solid-900.ttf'
      ]).then(() => {
        console.log('Service Worker: All files cached successfully');
        return self.skipWaiting();
      }).catch((err) => {
        console.error('Service Worker: Caching failed:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== 'family-app-v4')
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
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache:', requestUrl.pathname);
          return cachedResponse;
        }
        console.log('Service Worker: Fetching from network:', requestUrl.pathname);
        return fetch(event.request).catch(() => {
          console.log('Service Worker: Network failed, falling back:', requestUrl.pathname);
          const path = requestUrl.pathname;
          return caches.match(path).then((pathResponse) => {
            return pathResponse || caches.match('/index.html');
          });
        });
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('Service Worker: Serving asset from cache:', requestUrl.pathname);
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (event.request.method === 'GET') {
            caches.open('family-app-v4').then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          console.log('Service Worker: Asset fetch failed:', requestUrl.pathname);
          return new Response('', { status: 404 });
        });
      })
    );
  }
});
