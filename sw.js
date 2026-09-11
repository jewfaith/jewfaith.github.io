/**
 * Service Worker - Yisrael Date PWA
 * 
 * Arquitetura Offline-First com pré-cache do App Shell e estratégia Stale-While-Revalidate.
 * Garante funcionamento integral mesmo sem ligação à internet.
 */

const SW_VERSION = 'yisrael-date-v2.9.80';
const APP_SHELL_CACHE = `app-shell-${SW_VERSION}`;

const PRECACHE_ASSETS = [
    './',
    './style.css',
    './manifest.json',
    './icon.png',
    './robots.txt',
    './sitemap.xml',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    './js/main.js',
    './js/state.js',
    './js/api/bibleApi.js',
    './js/api/geolocation.js',
    './js/api/hebcal.js',
    './js/api/nominatim.js',
    './js/domain/aboutContent.js',
    './js/domain/biblicalCalendar.js',
    './js/domain/constants.js',
    './js/domain/eventMapper.js',
    './js/domain/formatters.js',
    './js/domain/halacha.js',
    './js/domain/parashot.js',
    './js/domain/scriptureRef.js',
    './js/services/bibleService.js',
    './js/services/locationService.js',
    './js/services/sefariaService.js',
    './js/ui/appNavigation.js',
    './js/ui/components/shareModal.js',
    './js/ui/components/skeleton.js',
    './js/ui/components/supportCard.js',
    './js/ui/dashboard.js',
    './js/ui/festivalsView.js',
    './js/ui/icons.js',
    './js/ui/modals.js',
    './js/ui/modals/infoModal.js',
    './js/ui/modals/locationModal.js',
    './js/ui/modals/modalManager.js',
    './js/ui/modals/readingModal.js',
    './js/ui/modals/sefariaModal.js',
    './js/ui/modals/welcomeModal.js',
    './js/ui/pcDisplayManager.js',
    './js/ui/premiumView.js',
    './js/ui/solarArc.js',
    './js/ui/theme.js',
    './js/ui/themeSwitcher.js',
    './js/ui/timers.js',
    './js/ui/views/dashboardView.js',
    './js/ui/zmanimTable.js',
    './js/utils/math.js',
    './js/utils/persistence.js',
    './js/utils/simulator.js',
    './js/utils/smartUpdater.js',
    './js/utils/umamiMonitor.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(APP_SHELL_CACHE).then(async (cache) => {
            try {
                await cache.addAll(PRECACHE_ASSETS);
            } catch (err) {
                // Em caso de instalação offline ou indisponibilidade de rede temporária,
                // migra os recursos da cache anterior para manter funcionamento contínuo
                try {
                    const keys = await caches.keys();
                    for (const key of keys) {
                        if (key !== APP_SHELL_CACHE) {
                            const oldCache = await caches.open(key);
                            const oldKeys = await oldCache.keys();
                            for (const req of oldKeys) {
                                const matched = await oldCache.match(req);
                                if (matched) {
                                    await cache.put(req, matched);
                                }
                            }
                        }
                    }
                } catch (e) { }
            }
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

    // Intercepta e guarda em cache recursos de CDN essenciais (Font Awesome CSS e ficheiros .woff2)
    if (url.origin === 'https://cdnjs.cloudflare.com' && (url.pathname.includes('font-awesome') || url.pathname.includes('webfonts'))) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const resClone = networkResponse.clone();
                        caches.open(APP_SHELL_CACHE).then((cache) => cache.put(event.request, resClone));
                    }
                    return networkResponse;
                }).catch(() => {
                    return caches.match('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css')
                        || new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } });
                });
            })
        );
        return;
    }

    // Intercepta telemetria da Umami para prevenir erros de ligação na consola quando offline
    if (url.origin === 'https://cloud.umami.is' || url.origin === 'https://gateway.umami.is') {
        event.respondWith(
            fetch(event.request).catch(() => {
                if (url.pathname.endsWith('.js')) {
                    return new Response('/* umami offline */', {
                        status: 200,
                        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
                    });
                }
                return new Response(JSON.stringify({ ok: true, offline: true }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // Não intercepta outras chamadas externas (APIs de geolocalização e efemérides possuem cache própria)
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
        caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
            if (cachedResponse) {
                // Revalidação em segundo plano sem travar o carregamento imediato
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const resClone = networkResponse.clone();
                        caches.open(APP_SHELL_CACHE).then((cache) => cache.put(event.request, resClone));
                    }
                }).catch(() => {});
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const resClone = networkResponse.clone();
                    caches.open(APP_SHELL_CACHE).then((cache) => cache.put(event.request, resClone));
                }
                return networkResponse;
            }).catch(() => {
                return new Response('', { status: 503, statusText: 'Offline Unavailable' });
            });
        })
    );
});
