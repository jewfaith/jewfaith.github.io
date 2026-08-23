const CACHE_NAME = 'yisrael-date-v48';

// Recursos locais essenciais para o funcionamento offline
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
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
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

    const url = new URL(event.request.url);
    const isLocal = url.origin === self.location.origin;
    const isApi = url.hostname.includes('hebcal.com') ||
        url.hostname.includes('nominatim.openstreetmap.org') ||
        url.hostname.includes('bolls.life') ||
        url.hostname.includes('bible-api.com');

    if (!isLocal && !isApi) return;

    // 1. Estratégia para APIs Externas: Network-First com Fallback para Cache
    if (isApi) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // 2. Estratégia para Ativos Locais (CSS, JS, HTML, Ícones): Stale-While-Revalidate
    // Serve instantaneamente da cache e atualiza a cache em segundo plano
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return networkResponse;
            }).catch(() => {/* Redesconectada ou offline */ });

            return cachedResponse || fetchPromise;
        })
    );
});