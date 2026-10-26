// Offline support for the FinSmart USSD PWA.
// Pages are network-first (so a new deploy shows up on the next launch); everything else is
// served from cache and refreshed in the background. Vite's hashed file names never change
// content, so cached assets are always safe to use.
const CACHE_PREFIX = 'finsmart-ussd-';
const CACHE = `${CACHE_PREFIX}v2`;
const CORE = [
  './',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png',
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(CORE);
      // The built page lists its own JS and CSS, so cache those too for the first offline launch.
      const page = await cache.match('./');
      const html = page ? await page.text() : '';
      const assets = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map((match) => match[1]);
      await cache.addAll(assets);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (request.mode === 'navigate' && sameOrigin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const response = await fetch(request);
          if (response.ok) cache.put('./', response.clone());
          return response;
        } catch {
          return (await cache.match('./')) ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Only the app's own files and its font are cached, so the cache can't grow without limit.
  const appFile = sameOrigin && /\/(?:assets|icons)\/|\/manifest\.webmanifest$/.test(url.pathname);
  if (!appFile && !FONT_HOSTS.includes(url.hostname)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached ?? Response.error());
      return cached ?? network;
    })(),
  );
});
