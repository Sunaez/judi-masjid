/* Offline fallback is scoped to the public display. APIs and admin pages are never cached. */
const CACHE = 'judi-display-v1';
const IMAGE_CACHE = 'judi-display-images-v1';
const MAX_ASSETS = 100;
let writes = Promise.resolve();

function remember(request, response) {
  if (!response.ok || response.type === 'opaque') return Promise.resolve();
  const copy = response.clone();
  writes = writes.catch(() => {}).then(async () => {
    const path = new URL(typeof request === 'string' ? request : request.url, self.location.origin).pathname;
    const cache = await caches.open(path === '/display' || path.startsWith('/_next/static/') ? CACHE : IMAGE_CACHE);
    await cache.put(request, copy);
    const keys = (await cache.keys()).filter(key => new URL(key.url).pathname !== '/display');
    for (const key of keys.slice(0, Math.max(0, keys.length - MAX_ASSETS))) await cache.delete(key);
  });
  return writes;
}

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const navigation = request.mode === 'navigate' && url.pathname === '/display';
  const asset = url.pathname.startsWith('/_next/static/') ||
    (/\.(png|jpg|jpeg|webp|avif|gif|svg|woff2?)$/i.test(url.pathname) &&
      !url.pathname.startsWith('/api/'));
  if (!navigation && !asset) return;
  event.respondWith((async () => {
    const cache = await caches.open(navigation || url.pathname.startsWith('/_next/static/') ? CACHE : IMAGE_CACHE);
    const key = navigation ? '/display' : request;
    const cached = await cache.match(key);
    if (cached && url.pathname.startsWith('/_next/static/')) return cached;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(request, { signal: controller.signal });
      if (!response.ok && cached) return cached;
      event.waitUntil(remember(key, response));
      return response;
    } catch (error) {
      if (cached) return cached;
      throw error;
    } finally { clearTimeout(timeout); }
  })());
});

// Cache the initial document too; the first navigation predates registration.
self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_DISPLAY') return;
  event.waitUntil((async () => {
    const response = await fetch('/display', { credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(15_000) });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return;
    const html = await response.clone().text();
    const required = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"\s]+)"/g)].map(match => match[1]);
    const assets = [...new Set([...required, ...(Array.isArray(event.data.assets) ? event.data.assets : [])])].slice(0, MAX_ASSETS);
    // Store required assets before replacing the offline document.
    await Promise.all(assets.map(async path => {
      const url = new URL(path, self.location.origin);
      if (url.origin !== self.location.origin || !url.pathname.startsWith('/_next/static/')) return;
      const asset = await fetch(url.href, { signal: AbortSignal.timeout(15_000) });
      await remember(url.href, asset);
    }));
    await remember('/display', response);
  })().catch(() => {}));
});
