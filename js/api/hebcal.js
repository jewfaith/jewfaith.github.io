const HEBCAL_MEM_CACHE = new Map();
const IN_FLIGHT_REQUESTS = new Map();

function getHebcalTTL(url) {
    if (url.includes('/hebcal?')) return 24 * 60 * 60 * 1000; // 24h para o calendário anual
    if (url.includes('/zmanim?')) return 12 * 60 * 60 * 1000; // 12h para os zmanim do dia
    if (url.includes('/converter?')) return 12 * 60 * 60 * 1000; // 12h para o conversor hebraico
    return 6 * 60 * 60 * 1000;
}

/**
 * Fetch wrapper resiliente para a API Hebcal com deduplicação de requisições e cache em memória / sessionStorage
 */
export async function hebcalFetch(url, timeoutMs = 5000) {
    const ttl = getHebcalTTL(url);
    const now = Date.now();

    // 1. Verifica cache em memória
    const memItem = HEBCAL_MEM_CACHE.get(url);
    if (memItem && (now - memItem.timestamp < ttl)) {
        return memItem.data;
    }

    // 2. Verifica cache em sessionStorage
    try {
        const stored = sessionStorage.getItem('hebcal_' + url);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && (now - parsed.timestamp < ttl)) {
                HEBCAL_MEM_CACHE.set(url, parsed);
                return parsed.data;
            }
        }
    } catch (e) { /* ignore storage errors */ }

    // 3. Deduplicação em voo: se a mesma URL já está a ser procurada, devolve a Promise existente
    if (IN_FLIGHT_REQUESTS.has(url)) {
        return IN_FLIGHT_REQUESTS.get(url);
    }

    // 4. Executa requisição com proteção de timeout
    const fetchPromise = (async () => {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(tid);

            if (!res.ok) {
                throw new Error(`Hebcal API HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();

            // Salva em cache
            const cacheItem = { data, timestamp: Date.now() };
            HEBCAL_MEM_CACHE.set(url, cacheItem);
            try {
                sessionStorage.setItem('hebcal_' + url, JSON.stringify(cacheItem));
            } catch (e) { }

            return data;
        } catch (error) {
            clearTimeout(tid);

            // Resiliência: se a rede falhar mas existir cache expirada, usa-a como contingência
            if (memItem && memItem.data) {
                console.warn('[Hebcal] Rede indisponível, a utilizar dados em cache (memória).');
                return memItem.data;
            }
            try {
                const storedFallback = sessionStorage.getItem('hebcal_' + url);
                if (storedFallback) {
                    const parsed = JSON.parse(storedFallback);
                    if (parsed?.data) {
                        console.warn('[Hebcal] Rede indisponível, a utilizar dados em cache (armazenamento).');
                        return parsed.data;
                    }
                }
            } catch (e) { }

            if (error.name === 'AbortError') {
                throw new Error('Hebcal API request timeout');
            }
            throw error;
        } finally {
            IN_FLIGHT_REQUESTS.delete(url);
        }
    })();

    IN_FLIGHT_REQUESTS.set(url, fetchPromise);
    return fetchPromise;
}

// Re-exporta geocodificação reversa de nominatim.js para compatibilidade retroativa
export { fetchNominatimReverse } from './nominatim.js';