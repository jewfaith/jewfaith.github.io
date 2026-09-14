/**
 * NOMINATIM.JS - CLIENTE DE GEOCODIFICAÇÃO OPENSTREETMAP (NOMINATIM)
 * 
 * Centraliza geocodificação reversa e pesquisa de localidades com cache resiliente,
 * limites de requisições e cabeçalhos compatíveis com os termos de uso do OSM.
 */

const NOMINATIM_CACHE_KEY = 'yisrael_nominatim_store';
const NOMINATIM_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 horas de cache
const NOMINATIM_USER_AGENT = 'https://github.com/jewfaith/jewfaith.github.io';
const NOMINATIM_EMAIL = 'contato@yisraeldate.app';

function getCachedNominatim(coordKey) {
    try {
        const raw = localStorage.getItem(NOMINATIM_CACHE_KEY);
        if (!raw) return null;

        const store = JSON.parse(raw);
        const item = store[coordKey];

        if (item && item.timestamp && (Date.now() - item.timestamp < NOMINATIM_CACHE_TTL)) {
            return item.data;
        }
    } catch (e) { /* Ignora erros de quota de armazenamento */ }
    return null;
}

function setCachedNominatim(coordKey, data) {
    try {
        const raw = localStorage.getItem(NOMINATIM_CACHE_KEY);
        const store = raw ? JSON.parse(raw) : {};
        const now = Date.now();

        // Limpeza de entradas expiradas para preservação de espaço
        Object.keys(store).forEach((k) => {
            if (now - store[k].timestamp > NOMINATIM_CACHE_TTL) {
                delete store[k];
            }
        });

        store[coordKey] = { data, timestamp: now };
        localStorage.setItem(NOMINATIM_CACHE_KEY, JSON.stringify(store));
    } catch (e) { /* Trata limitações de armazenamento do navegador */ }
}

/**
 * Geocodificação reversa a partir de coordenadas geográficas (lat, lon).
 */
export async function fetchNominatimReverse(lat, lon) {
    const normLat = parseFloat(lat).toFixed(3);
    const normLon = parseFloat(lon).toFixed(3);
    const coordKey = `${normLat},${normLon}`;

    const cachedData = getCachedNominatim(coordKey);
    if (cachedData) return cachedData;

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 5000);

    const params = new URLSearchParams({
        format: 'json',
        lat: String(lat),
        lon: String(lon),
        'accept-language': 'pt',
        email: NOMINATIM_EMAIL,
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

/**
 * Pesquisa de texto livre para localidades / cidades.
 */
export async function searchNominatim(query, limit = 15) {
    if (!query || query.trim().length < 2) return [];

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 6000);

    const params = new URLSearchParams({
        q: query.trim(),
        format: 'json',
        addressdetails: '1',
        limit: String(limit),
        'accept-language': 'pt',
        email: NOMINATIM_EMAIL
    });

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
            signal: ctrl.signal
        });
        clearTimeout(tid);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        clearTimeout(tid);
        return null;
    }
}

/**
 * Pesquisa localidades próximas dentro de um bounding box (viewbox).
 */
export async function searchNearbyCities(left, top, right, bottom, limit = 30) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 6000);

    const queryUrl = `https://nominatim.openstreetmap.org/search?q=cidade&viewbox=${left},${top},${right},${bottom}&bounded=1&format=json&addressdetails=1&limit=${limit}&accept-language=pt&email=${NOMINATIM_EMAIL}`;

    try {
        const res = await fetch(queryUrl, { signal: ctrl.signal });
        clearTimeout(tid);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        clearTimeout(tid);
        return null;
    }
}
