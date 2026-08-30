/* ─────────────────────────────────────────────────────────────────
   Oracional CMF · Service Worker
   
   ⚠️  Cada vegada que publiquis una nova versió de l'app,
   canvia el número de versió aquí (v1 → v2, etc.)
   perquè els dispositius descarreguin la versió nova.
   ───────────────────────────────────────────────────────────────── */
const VERSION = 'oracional-cmf-v1';

const TO_CACHE = [
  './CMF_oracional_5idiomes.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
];

/* ── Instal·lació: guarda en caché ── */
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(TO_CACHE))
  );
});

/* ── Activació: esborra caché antiga ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: xarxa primer per l'HTML principal, caché per la resta ── */
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Per a l'HTML principal: intenta xarxa i actualitza la caché,
  // si no hi ha connexió serveix la versió guardada.
  if (url.includes('CMF_oracional_5idiomes')) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const copy = response.clone();
          caches.open(VERSION).then(c => c.put(e.request, copy));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Per a la resta (icones, manifest, fonts): caché primer.
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then(c => c.put(e.request, copy));
          }
          return response;
        })
      )
  );
});
