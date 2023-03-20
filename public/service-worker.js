// Définition des fichiers à mettre en cache
const CACHE_NAME = 'HubbleCacheV1';
const urlsToCache = [
  '/index.html',
  '/styles/style.css',
  '/styles/style.css.map',
  '/service-worker.js',
  '/js/sw-registerer.js',
  '/js/pulltorefresh.min.js',
  '/js/script.js',
  '/settings.json',
  '/assets/lineawesome/css/line-awesome.min.css',
  '/assets/lineawesome/fonts/la-brands-400.eot',
  '/assets/lineawesome/fonts/la-brands-400.svg',
  '/assets/lineawesome/fonts/la-brands-400.ttf',
  '/assets/lineawesome/fonts/la-brands-400.woff',
  '/assets/lineawesome/fonts/la-brands-400.woff2',
  '/assets/lineawesome/fonts/la-regular-400.eot',
  '/assets/lineawesome/fonts/la-regular-400.svg',
  '/assets/lineawesome/fonts/la-regular-400.ttf',
  '/assets/lineawesome/fonts/la-regular-400.woff',
  '/assets/lineawesome/fonts/la-regular-400.woff2',
  '/assets/lineawesome/fonts/la-solid-900.eot',
  '/assets/lineawesome/fonts/la-solid-900.svg',
  '/assets/lineawesome/fonts/la-solid-900.ttf',
  '/assets/lineawesome/fonts/la-solid-900.woff',
  '/assets/lineawesome/fonts/la-solid-900.woff2',
  '/app.webmanifest'
];

// Installation du service worker et mise en cache des fichiers
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});



// Récupération des données en mode offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            // Mise en cache de la réponse
            return caches.open(CACHE_NAME)
              .then(cache => {
                const isCachable = (event.request.url.startsWith("http://") ||
                  event.request.url.startsWith("https://")) &&
                  (response.url.startsWith("http://") ||
                  response.url.startsWith("https://"));
                if (isCachable)
                {
                  cache.put(event.request, response.clone());
                }
                return response;
              });
          });
      })
      .catch(() => {
        // Si la requête échoue et qu'il n'y a pas de cache, on affiche une page d'erreur
        return caches.match('/offline.html');
      })
  );
});

// Écouteur de l'événement "fetch" pour mettre à jour le cache en arrière-plan
self.addEventListener('fetch', event => {
  if (event.request.cache === 'reload') {
    event.respondWith(
      caches.open(CACHE_NAME)
        .then(cache => {
          return fetch(event.request)
            .then(response => {
              cache.put(event.request, response.clone());
              return response;
            });
        })
    );
  }
});