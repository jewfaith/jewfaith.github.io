/**
 * Service Worker - Yisrael Date PWA
 * 
 * Mantém o suporte à instalação da aplicação (PWA) no ecrã principal (mobile/desktop)
 * sem armazenamento offline agressivo em cache, garantindo que o Umami Analytics
 * e as atualizações em tempo real recebam e enviem todos os dados sem interferências.
 */

self.addEventListener('install', (event) => {
    // Ativação imediata da nova versão sem reter a versão anterior
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Purga e limpa todas as caches residuais antigas que possam reter versões desatualizadas
    // ou impedir o envio de métricas pelo Umami Analytics
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('[Service Worker] Purgando cache antigo:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Pass-through direto para a rede:
    // Não intercepta nem bloqueia requisições.
    // Todas as chamadas analíticas (cloud.umami.is, gateway.umami.is), APIs externas e páginas
    // são enviadas e recebidas com 100% de integridade diretamente pela rede.
    return;
});