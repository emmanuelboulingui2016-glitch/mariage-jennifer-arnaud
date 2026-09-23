const CACHE_NAME = 'rsvp-dashboard-v2';
const ASSETS = ['./dashboard.html', './manifest.json', './icon-192.png', './icon-512.png'];
const ASSET_PATHS = ASSETS.map(a => new URL(a, self.location).pathname);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Réseau d'abord pour les fichiers de l'appli : les mises à jour arrivent tout de suite,
// et la copie en cache ne sert que hors connexion. Le reste (données Apps Script, site
// des invités, musique...) n'est pas géré ici et passe directement par le réseau.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !ASSET_PATHS.includes(url.pathname)) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(url.pathname, copy));
        }
        return res;
      })
      .catch(() => caches.match(url.pathname))
  );
});
