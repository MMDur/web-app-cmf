// Service Worker · Oracional CMF
// Estrategia: "red primero". Si hay conexión, SIEMPRE se sirve la versión
// real del servidor (y de paso se actualiza la copia de reserva). Solo si
// no hay conexión se usa la última copia guardada. Así se evita el problema
// de ver contenido antiguo cuando en realidad hay una versión nueva.

const VERSION = 'v1'; // Súbelo (v2, v3...) si alguna vez quieres forzar
                       // que se borren las copias de reserva antiguas.
const CACHE_NAME = 'oracional-cmf-' + VERSION;
const ASSETS = [
  './CMF_oracional_6idiomes.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
