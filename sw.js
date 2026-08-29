/* ============================================================
   SERVICE WORKER – Kentälliset PWA v39.6
   Offline-first caching for installable floorball lineup app
   ============================================================ */

const CACHE_NAME = 'kentalliset-v39.6';
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
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
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

// ── Fetch: Network-first for HTML/Navigation, Stale-while-revalidate for assets ──
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

    // HTML / Navigation requests: Network-First with Cache fallback
    if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    if (networkResponse.ok) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(event.request).then(cached => cached || caches.match('/index.html'));
                })
        );
        return;
    }

    // App shell static files (JS, CSS, images): Network with Cache fallback
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                if (networkResponse.ok) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return networkResponse;
            })
            .catch(() => caches.match(event.request))
    );
});

// ── Message handler for cache updates ──
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
