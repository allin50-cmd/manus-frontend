/**
 * VaultLine Service Worker
 * Provides offline support, caching, and PWA functionality
 */

const CACHE_VERSION = 'vaultline-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE    = `${CACHE_VERSION}-api`;
const KB_CACHE     = `${CACHE_VERSION}-kb`;

const STATIC_PRECACHE = [
  '/',
  '/manifest.json',
];

const CACHE_STRATEGIES = {
  /** Static assets: serve from cache, update in background */
  staleWhileRevalidate: [
    /\.(js|css|woff2?|png|svg|ico)$/,
    /^\/assets\//,
  ],
  /** API calls: network first, cache as fallback (3s timeout) */
  networkFirst: [
    /^\/api\//,
  ],
  /** Knowledge base: cache first (24h TTL) */
  cacheFirst: [
    /^\/api\/knowledge\//,
  ],
};

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_PRECACHE))
  );
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('vaultline-') && k !== STATIC_CACHE && k !== API_CACHE && k !== KB_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin and GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Knowledge base: cache first
  if (CACHE_STRATEGIES.cacheFirst.some((p) => p.test(url.pathname))) {
    event.respondWith(cacheFirst(request, KB_CACHE));
    return;
  }

  // API: network first with timeout fallback
  if (CACHE_STRATEGIES.networkFirst.some((p) => p.test(url.pathname))) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Static assets: stale-while-revalidate
  if (CACHE_STRATEGIES.staleWhileRevalidate.some((p) => p.test(url.pathname))) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // App shell: serve index.html for all navigation requests (SPA fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }
});

// ─── Cache Strategies ─────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName, timeoutMs = 3000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    clearTimeout(timeout);
    const cached = await caches.match(request);
    return cached ?? new Response(JSON.stringify({ error: 'Offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached ?? fetchPromise;
}

// ─── Background Sync (audit flush) ───────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'flush-audit-queue') {
    event.waitUntil(flushAuditQueue());
  }
});

async function flushAuditQueue() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => client.postMessage({ type: 'FLUSH_AUDIT' }));
  } catch {}
}

// ─── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'VaultLine Alert', {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag ?? 'vaultline-notification',
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data?.url) {
    event.waitUntil(self.clients.openWindow(event.notification.data.url));
  }
});
