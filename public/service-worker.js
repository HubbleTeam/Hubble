// Définition des fichiers à mettre en cache
const urlsToCache = [
  'index.html',
  'app.webmanifest',
  'db.json',
  'service-worker.js',
  '/html/about.html',
  '/html/report.html',
  '/html/settings.html',
  '/html/sidepanel.html',
  '/html/splash-screen.html',
  '/html/welcome.html',
  '/html/whatsnew.html',
  '/styles/style.css',
  '/styles/style.css.map',
  '/js/sw-registerer.js',
  // '/js/pulltorefresh.min.js',
  'https://unpkg.com/pulltorefreshjs@0.1.22/dist/index.umd.min.js',
  '/js/script.js',
  '/js/front.js',
  '/img/charrier.webp',
  '/img/crow-dynamic-color.webp',
  '/img/logo.png',
  '/img/noise.png',
  '/img/pp.png',
  '/img/rocket-dynamic-color.png',
  '/img/charrier.png',
  '/img/crow-dynamic-color.png',
  '/img/favicon.png',
  '/img/maskable_icon.png',
  '/img/noise.webp',
  '/img/pp.webp',
  '/img/rocket-dynamic-color.webp',
];

// Installation du service worker et mise en cache des fichiers
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open("HubbleCache")
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
            return caches.open("HubbleCache")
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
      caches.open("HubbleCache")
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