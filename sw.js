/**
 * Service Worker - Yisrael Date PWA
 * 
 * Versão com invalidação forçada de cache para garantir que o utilizador
 * receba sempre o design mais atualizado sem ficar preso a versões antigas.
 */

const SW_VERSION = 'yisrael-date-v2.0.2';
const APP_SHELL_CACHE = `app-shell-${SW_VERSION}`;

self.addEventListener('install', (event) => {
    // Força ativação imediata sem esperar pelo encerramento de abas antigas
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Purga e limpa todas as caches antigas imediatamente
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
            // Notifica todas as abas abertas para recarregarem com a nova versão
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

    // Não intercepta chamadas externas (Umami, APIs, FontAwesome, etc.)
    if (url.origin !== self.location.origin) {
        return;
    }

    // Para ficheiros do próprio site (HTML, CSS, JS):
    // Garante que a rede seja sempre consultada primeiro (Network-First com no-cache)
    // para que qualquer alteração visual seja carregada imediatamente no PWA
    if (event.request.mode === 'navigate' || 
        event.request.destination === 'style' || 
        event.request.destination === 'script' ||
        event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request, { cache: 'no-cache' }).catch(() => {
                return caches.match(event.request);
            })
        );
    }
});