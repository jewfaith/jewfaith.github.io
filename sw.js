const CACHE_NAME = 'yisrael-date-v4';

// Recursos locais essenciais para o funcionamento offline
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './icon.png',
    './js/state.js',
    './js/main.js',
    './js/api/geolocation.js',
    './js/api/hebcal.js',
    './js/domain/constants.js',
    './js/domain/halacha.js',
    './js/domain/parashot.js',
    './js/ui/appNavigation.js',
    './js/ui/dashboard.js',
    './js/ui/festivalsView.js',
    './js/ui/icons.js',
    './js/ui/modals.js',
    './js/ui/pcDisplayManager.js',
    './js/ui/premiumView.js',
    './js/ui/solarArc.js',
    './js/ui/theme.js',
    './js/ui/themeSwitcher.js',
    './js/ui/timers.js',
    './js/ui/zmanimTable.js',
    './js/utils/math.js',
    './js/utils/persistence.js',
    './js/utils/smartUpdater.js'
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

    const isFontOrIcon = url.hostname.includes('cdnjs.cloudflare.com') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com');

    if (!isLocal && !isApi && !isFontOrIcon) return;

    // 1. Estratégia para Fontes & Ícones (Font Awesome & Google Fonts): Cache-First / Stale-While-Revalidate
    if (isFontOrIcon) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return networkResponse;
                }).catch(() => null);
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

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

    // 2. Estratégia para Ativos Locais (CSS, JS, HTML, Ícones): Network-First com Fallback para Cache
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return networkResponse;
            })
            .catch(() => caches.match(event.request))
    );
});