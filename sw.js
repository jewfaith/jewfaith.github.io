const CACHE_NAME = 'yisrael-date-v47';
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

    // Apenas intercepta recursos locais do app e APIs de dados
    const isLocal = url.startsWith(self.location.origin);
    const isApi = url.includes('hebcal.com') ||
        url.includes('nominatim.openstreetmap.org') ||
        url.includes('bolls.life') ||
        url.includes('bible-api.com');

    if (!isLocal && !isApi) return;

    // Network-First para todos os arquivos e APIs (garante que alterações entrem em vigor instantaneamente)
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        if (url.startsWith('http')) cache.put(event.request, clone).catch(() => {});
                    });
                }
                return networkResponse;
            })
            .catch(async () => {
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                throw new Error('Offline and not cached');
            })
    );
});

