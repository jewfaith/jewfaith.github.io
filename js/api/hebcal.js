const NOMINATIM_CACHE_KEY = 'yisrael_nominatim_store';
const NOMINATIM_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 horas de cache

/**
 * Fetch wrapper resiliente para a API Hebcal
 */
export async function hebcalFetch(url, timeoutMs = 5000) {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(tid);

        if (!res.ok) {
            throw new Error(`Hebcal API HTTP ${res.status}: ${res.statusText}`);
        }
        return await res.json();
    } catch (error) {
        clearTimeout(tid);
        if (error.name === 'AbortError') {
            throw new Error('Hebcal API request timeout');
        }
        throw error;
    }
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