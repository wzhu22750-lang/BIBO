const CACHE_NAME = 'bibo-shell-20260908-v1'
const SHELL_PATHS = new Set(['/', '/index.html', '/favicon.svg'])
function cacheable(request, url) {
  if (request.method !== 'GET' || url.origin !== self.location.origin) return false
  return (
    SHELL_PATHS.has(url.pathname) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/demo/')
  )
}
function navigation(request) {
  return request.mode === 'navigate' || request.destination === 'document'
}
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key.startsWith('bibo-shell-'))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (!cacheable(event.request, url)) return
  if (navigation(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            void caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy))
          }
          return response
        })
        .catch(() =>
          caches.match('/index.html').then(
            (response) =>
              response ||
              new Response('BIBU 离线页面尚未缓存，请先联网打开一次。', {
                status: 503,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
              }),
          ),
        ),
    )
    return
  }
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          }
          return response
        }),
    ),
  )
})
