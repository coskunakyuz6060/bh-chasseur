// Cache minimal : l'appli s'ouvre même sans réseau (dernières données vues).
const C = 'bh-chasseur-v3';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(C).then((c) => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'analyse.mjs']))); });
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const copie = r.clone(); caches.open(C).then((c) => c.put(e.request.url.split('?')[0], copie)); return r; }).catch(() => caches.match(e.request.url.split('?')[0])));
});
