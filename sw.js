/* ============================================================
   SERVICE WORKER – Kentälliset PWA v40.1
   Fast, lightweight, offline-first caching for mobile & desktop
   ============================================================ */

const CACHE_NAME = 'kentalliset-v40.1';
const APP_SHELL = [
    './',
    './index.html',
    './app.js',
    './styles.css',
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

// ── Activate: Clean all old caches and claim clients ──
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

// ── Fetch: Network-First for HTML/JS/CSS, Cache-First for static fonts/icons ──
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Pass through Firebase, Google APIs, analytics and external CORS proxies
    if (url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('allorigins') ||
        url.hostname.includes('corsproxy') ||
        (url.hostname.includes('gstatic.com') && !url.pathname.includes('fonts'))) {
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

    // Network-First with Cache fallback for all app shell assets (HTML, JS, CSS)
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
                return caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
                        return caches.match('./index.html') || caches.match('/index.html');
                    }
                    return new Response('Offline', { status: 503, statusText: 'Offline' });
                });
            })
    );
});

// ── Message handler for instant updates ──
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
