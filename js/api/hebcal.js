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

/**
 * Obtém o calendário litúrgico a partir da camada de dados estática local pré-calculada.
 * Se o ficheiro estático local falhar, recorre de forma transparente à API remota.
 */
export async function fetchLiturgicalCalendar(isIsrael = false) {
    const fileName = isIsrael ? 'calendar-israel.json' : 'calendar-diaspora.json';
    const localUrl = `./data/${fileName}`;

    try {
        const res = await fetch(localUrl);
        if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.items) && data.items.length > 0) {
                return data;
            }
        }
    } catch (err) {
        console.warn(`[Calendar] Recurso local ${fileName} indisponível, a recorrer a fallback dinâmico.`);
    }

    // Fallback dinâmico para Hebcal caso o JSON local falhe
    const currentYear = new Date().getFullYear();
    const fallbackUrl = `https://www.hebcal.com/hebcal?v=1&cfg=json&geo=none&start=${currentYear}-01-01&end=${currentYear + 1}-12-31&maj=on&min=on&mod=on&nx=on&mf=on&ss=on&s=on&i=${isIsrael ? 'on' : 'off'}&c=off&o=on`;
    return hebcalFetch(fallbackUrl);
}

// Re-exporta geocodificação reversa de nominatim.js para compatibilidade retroativa
export { fetchNominatimReverse } from './nominatim.js';