const NOMINATIM_CACHE_KEY = 'yisrael_nominatim_store';
const NOMINATIM_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 horas de cache

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
                console.warn('[Hebcal] Rede indisponível, a usar cache em memória:', url);
                return memItem.data;
            }
            try {
                const storedFallback = sessionStorage.getItem('hebcal_' + url);
                if (storedFallback) {
                    const parsed = JSON.parse(storedFallback);
                    if (parsed?.data) {
                        console.warn('[Hebcal] Rede indisponível, a usar cache armazenada:', url);
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
 * Utilitários para cache do Nominatim
 */
function getCachedNominatim(coordKey) {
    try {
        const raw = localStorage.getItem(NOMINATIM_CACHE_KEY);
        if (!raw) return null;

        const store = JSON.parse(raw);
        const item = store[coordKey];

        if (item && item.timestamp && (Date.now() - item.timestamp < NOMINATIM_CACHE_TTL)) {
            return item.data;
        }
    } catch (e) { /* Ignora erros de localStorage */ }
    return null;
}

function setCachedNominatim(coordKey, data) {
    try {
        const raw = localStorage.getItem(NOMINATIM_CACHE_KEY);
        const store = raw ? JSON.parse(raw) : {};
        const now = Date.now();

        // Limpa entradas velhas do cache para poupar espaço
        Object.keys(store).forEach((k) => {
            if (now - store[k].timestamp > NOMINATIM_CACHE_TTL) {
                delete store[k];
            }
        });

        store[coordKey] = { data, timestamp: now };
        localStorage.setItem(NOMINATIM_CACHE_KEY, JSON.stringify(store));
    } catch (e) { /* Trata limitações do navegador */ }
}

/**
 * Geocodificação reversa via Nominatim (OpenStreetMap)
 */
export async function fetchNominatimReverse(lat, lon) {
    const normLat = parseFloat(lat).toFixed(3);
    const normLon = parseFloat(lon).toFixed(3);
    const coordKey = `${normLat},${normLon}`;

    // 1. Tenta recuperar do cache
    const cachedData = getCachedNominatim(coordKey);
    if (cachedData) return cachedData;

    // 2. Faz a chamada à API caso não esteja em cache
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 5000);

    const params = new URLSearchParams({
        format: 'json',
        lat: String(lat),
        lon: String(lon),
        'accept-language': 'pt',
        email: 'https://github.com/jewfaith/jewfaith.github.io', // Repositório como identificador de contato
        zoom: '10'
    });

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
            signal: ctrl.signal,
            headers: { 'Accept-Language': 'pt' }
        });

        clearTimeout(tid);
        if (!res.ok) return null;

        const data = await res.json();
        if (data && !data.error) {
            setCachedNominatim(coordKey, data);
            return data;
        }

        return null;
    } catch (e) {
        clearTimeout(tid);
        return null;
    }
}