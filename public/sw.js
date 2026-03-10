const CACHE_NAME = 'fieldpro-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
]

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and non-same-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return
  }

  // API routes: network only
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Navigation: network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/'))
      )
    )
    return
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone())
          return response
        })
        return cached || networkFetch
      })
    )
  )
})
