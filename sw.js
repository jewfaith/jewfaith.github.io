const CACHE_NAME = 'yisrael-date-v3';
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
    './js/ui/dashboard.js',
    './js/ui/icons.js',
    './js/ui/modals.js',
    './js/ui/theme.js',
    './js/ui/timers.js',
    './js/utils/math.js'
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

    // Network First, fallback to cache
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Não faz cache de respostas inválidas ou de erro (exceto opacas que são 0)
                if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
                    return networkResponse;
                }
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    // Tenta salvar no cache, ignorando erros se a requisição não suportar (ex: extensões)
                    if (event.request.url.startsWith('http')) {
                        cache.put(event.request, responseClone).catch(() => {});
                    }
                });
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
