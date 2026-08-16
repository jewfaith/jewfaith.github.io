const CACHE_NAME = 'yisrael-date-v31';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './js/state.js',
    './js/main.js',
    './js/api/geolocation.js',
    './js/api/hebcal.js',
    './js/domain/constants.js',
    './js/domain/halacha.js',
    './js/domain/parashot.js',
    './js/ui/dashboard.js',
    './js/ui/icons.js',
    './js/ui/modals.js',
    './js/ui/theme.js',
    './js/ui/timers.js',
    './js/utils/math.js',
    './icon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = event.request.url;
    const isLocalOrFont = url.startsWith(self.location.origin) ||
        url.includes('fonts.googleapis.com') ||
        url.includes('fonts.gstatic.com') ||
        url.includes('cdnjs.cloudflare.com');

    const isApi = url.includes('hebcal.com') ||
        url.includes('nominatim.openstreetmap.org') ||
        url.includes('bolls.life') ||
        url.includes('bible-api.com') ||
        url.includes('geojs.io') ||
        url.includes('ipwho.is') ||
        url.includes('ip.sb') ||
        url.includes('ipinfo.io') ||
        url.includes('freeipapi.com') ||
        url.includes('ipapi.co');

    if (!isLocalOrFont && !isApi) return;

    if (isLocalOrFont) {
        // Stale-While-Revalidate: Instant response from cache, background refresh
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            if (url.startsWith('http')) cache.put(event.request, clone).catch(() => {});
                        });
                    }
                    return networkResponse;
                }).catch(() => null);

                return cachedResponse || fetchPromise;
            })
        );
    } else {
        // Network First with fallback to cache for dynamic APIs
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            if (url.startsWith('http')) cache.put(event.request, clone).catch(() => {});
                        });
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(event.request))
        );
    }
});
