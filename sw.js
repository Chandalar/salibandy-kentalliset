/* ============================================================
   SERVICE WORKER – Kentälliset PWA v39.3
   Offline-first caching for installable floorball lineup app
   ============================================================ */

const CACHE_NAME = 'kentalliset-v39.3';
const APP_SHELL = [
    '/',
    '/index.html',
    '/app.js',
    '/styles.css',
    '/firebase-config.js',
    '/ball.png',
    '/floorball-ball.svg',
    '/manifest.json',
    '/icons/icon-192.svg',
    '/icons/icon-512.svg',
    '/icons/icon-maskable-512.svg'
];

const FONT_CACHE = 'kentalliset-fonts-v1';
const RUNTIME_CACHE = 'kentalliset-runtime-v1';

// ── Install: Precache app shell ──
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

// ── Activate: Clean old caches ──
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME && key !== FONT_CACHE && key !== RUNTIME_CACHE)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// ── Fetch: Stale-while-revalidate for app shell, cache-first for fonts ──
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip Firestore, Auth and analytics requests (let them pass through)
    if (url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('gstatic.com') && !url.pathname.includes('fonts')) {
        return;
    }

    // Google Fonts: Cache-first (rarely change)
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
        event.respondWith(
            caches.open(FONT_CACHE).then(cache =>
                cache.match(event.request).then(cached => {
                    if (cached) return cached;
                    return fetch(event.request).then(response => {
                        if (response.ok) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    });
                })
            ).catch(() => caches.match(event.request))
        );
        return;
    }

    // CDN resources (Tesseract.js etc): Cache-first
    if (url.hostname.includes('cdn.jsdelivr.net')) {
        event.respondWith(
            caches.open(RUNTIME_CACHE).then(cache =>
                cache.match(event.request).then(cached => {
                    if (cached) return cached;
                    return fetch(event.request).then(response => {
                        if (response.ok) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    });
                })
            ).catch(() => caches.match(event.request))
        );
        return;
    }

    // App shell files: Stale-while-revalidate
    event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            cache.match(event.request).then(cached => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // Network failed, return cached or fallback to index
                    if (cached) return cached;
                    if (event.request.mode === 'navigate') {
                        return cache.match('/index.html');
                    }
                    return new Response('Offline', { status: 503 });
                });

                // Return cached immediately, update in background
                return cached || fetchPromise;
            })
        )
    );
});

// ── Message handler for cache updates ──
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
