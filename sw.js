/**
 * Service Worker - Yisrael Date PWA
 * 
 * Arquitetura Offline-First com pré-cache do App Shell e estratégia Stale-While-Revalidate.
 * Garante funcionamento integral mesmo sem ligação à internet.
 */

const SW_VERSION = 'yisrael-date-v2.3.1';
const APP_SHELL_CACHE = `app-shell-${SW_VERSION}`;

const PRECACHE_ASSETS = [
    './',
    './style.css',
    './manifest.json',
    './icon.png',
    './robots.txt',
    './sitemap.xml',
    './js/main.js',
    './js/state.js',
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
    './js/utils/smartUpdater.js',
    './js/utils/umamiMonitor.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(APP_SHELL_CACHE).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== APP_SHELL_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()).then(() => {
            return self.clients.matchAll({ type: 'window' }).then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({ type: 'SW_VERSION_UPDATED', version: SW_VERSION });
                });
            });
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Não intercepta chamadas externas (APIs externas, CDNs de telemetria)
    if (url.origin !== self.location.origin) {
        return;
    }

    // Navegações e documento principal (HTML)
    if (event.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname === '/') {
        event.respondWith(
            fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const resClone = networkResponse.clone();
                    caches.open(APP_SHELL_CACHE).then((cache) => cache.put(event.request, resClone));
                }
                return networkResponse;
            }).catch(() => {
                return caches.match('./').then((matched) => {
                    return matched || caches.match('./index.html') || caches.match(event.request);
                });
            })
        );
        return;
    }

    // Recursos estáticos locais (CSS, JS, Imagens, Manifest)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const resClone = networkResponse.clone();
                    caches.open(APP_SHELL_CACHE).then((cache) => cache.put(event.request, resClone));
                }
                return networkResponse;
            }).catch(() => null);

            return cachedResponse || fetchPromise;
        })
    );
});
