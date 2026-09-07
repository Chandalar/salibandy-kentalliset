/* ============================================================
   SERVICE WORKER – Kentälliset PWA v45.0
   Fast, ultra-lightweight, 100% offline-ready & local-first
   ============================================================ */

const CACHE_NAME = 'kentalliset-v51.0';
const APP_SHELL = [
    './',
    './index.html',
    './app.js',
    './styles.css',
    './simple.html',
    './simple.js',
    './simple.css',
    './firebase-config.js',
    './manifest.json',
    './floorball-ball.svg',
    './icons/icon-192.svg',
    './icons/icon-512.svg',
    './icons/icon-maskable-512.svg'
];

const FONT_CACHE = 'kentalliset-fonts-v1';
const RUNTIME_CACHE = 'kentalliset-runtime-v1';

// ── Install: Precache app shell with graceful fallback ──
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            for (const url of APP_SHELL) {
                try {
                    await cache.add(url);
                } catch (err) {
                    console.warn('[SW] Could not precache:', url, err);
                }
            }
        })
    );
});

// ── Activate: Clean all old caches and claim clients immediately ──
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME && key !== FONT_CACHE && key !== RUNTIME_CACHE)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// ── Fetch ──
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Pass through Firebase Firestore / Auth / Proxies
    if (url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('allorigins') ||
        url.hostname.includes('corsproxy') ||
        url.hostname.includes('jina.ai')) {
        return;
    }

    // Google Fonts: Cache-First
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
        event.respondWith(
            caches.open(FONT_CACHE).then((cache) =>
                cache.match(event.request).then((cached) => {
                    if (cached) return cached;
                    return fetch(event.request).then((response) => {
                        if (response.ok) cache.put(event.request, response.clone());
                        return response;
                    }).catch(() => cached);
                })
            )
        );
        return;
    }

    // CDN Libraries (Tesseract.js etc): Cache-First
    if (url.hostname.includes('cdn.jsdelivr.net')) {
        event.respondWith(
            caches.open(RUNTIME_CACHE).then((cache) =>
                cache.match(event.request).then((cached) => {
                    if (cached) return cached;
                    return fetch(event.request).then((response) => {
                        if (response.ok) cache.put(event.request, response.clone());
                        return response;
                    }).catch(() => cached);
                })
            )
        );
        return;
    }

    // ── HTML Navigation: NETWORK-FIRST with Cache Fallback ──
    // Ensures online users ALWAYS get the latest deployed version,
    // but app remains 100% offline-ready if connection drops!
    if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.ok) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(event.request)
                        .then((cached) => cached || caches.match('./simple.html') || caches.match('./index.html'));
                })
        );
        return;
    }

    // App Shell Assets (JS, CSS, SVG): Stale-While-Revalidate
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.ok) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return networkResponse;
                })
                .catch((err) => {
                    return cachedResponse;
                });

            return cachedResponse || fetchPromise;
        })
    );
});

// ── Message handler for instant updates ──
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
