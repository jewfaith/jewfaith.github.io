const GEO_CACHE_KEY = 'yisrael_cached_geolocation';
const GEO_CACHE_TTL = 8 * 60 * 60 * 1000; // 8h

// Auxiliar para validação de coordenadas reais
const isValidCoord = (lat, lon) =>
    !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

// Obtém o fuso horário local como fallback definitivo
const getSystemTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Tenta obter a posição precisa via GPS/Wi-Fi nativo do navegador
 */
function getGPSLocation(timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Geolocation não suportada'));

        const timer = setTimeout(() => reject(new Error('Timeout no GPS')), timeoutMs);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                clearTimeout(timer);
                const { latitude: lat, longitude: lon } = pos.coords;
                if (isValidCoord(lat, lon)) {
                    resolve({ lat, lon, tz: getSystemTimezone(), source: 'gps' });
                } else {
                    reject(new Error('Coordenadas de GPS inválidas'));
                }
            },
            (err) => {
                clearTimeout(timer);
                reject(err);
            },
            { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 3600000 }
        );
    });
}

/**
 * Executa uma requisição individual para a API IP informada
 */
async function fetchIPEndpoint(ep, timeoutMs = 3000) {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(ep.url, { signal: controller.signal, mode: 'cors' });
        clearTimeout(tid);
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

        const data = await res.json();
        const parsed = ep.parse(data);
        if (!parsed) throw new Error('Falha no parse do payload');

        const lat = parseFloat(parsed.lat);
        const lon = parseFloat(parsed.lon);

        if (!isValidCoord(lat, lon)) throw new Error('Coordenadas IP fora dos limites');

        return {
            lat,
            lon,
            tz: parsed.tz || getSystemTimezone(),
            source: 'ip'
        };
    } catch (err) {
        clearTimeout(tid);
        throw err;
    }
}

/**
 * Função principal exportada
 */
export async function getGeolocation() {
    // 1. Tenta Cache no LocalStorage
    try {
        const cachedRaw = localStorage.getItem(GEO_CACHE_KEY);
        if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (cached?.timestamp && (Date.now() - cached.timestamp < GEO_CACHE_TTL)) {
                if (isValidCoord(cached.lat, cached.lon)) {
                    return { lat: cached.lat, lon: cached.lon, tz: cached.tz || getSystemTimezone() };
                }
            }
        }
    } catch (e) { /* Ignora restrições do localStorage */ }

    // 2. Tenta Geolocalização Nativa (GPS / Wi-Fi)
    try {
        const gpsResult = await getGPSLocation();
        saveCache(gpsResult);
        return gpsResult;
    } catch (e) {
        // Fallback para IP silencioso
    }

    // 3. Fallback: Provedores IP executados em paralelo (Corrida de baixa latência)
    const endpoints = [
        {
            url: 'https://get.geojs.io/v1/ip/geo.json',
            parse: (d) => ({ lat: d.latitude, lon: d.longitude, tz: d.timezone })
        },
        {
            url: 'https://api.ip.sb/geoip',
            parse: (d) => ({ lat: d.latitude, lon: d.longitude, tz: d.timezone })
        },
        {
            url: 'https://ipwho.is/',
            parse: (d) => d.success !== false ? { lat: d.latitude, lon: d.longitude, tz: d.timezone?.id } : null
        },
        {
            url: 'https://ipinfo.io/json',
            parse: (d) => d.loc ? { lat: d.loc.split(',')[0], lon: d.loc.split(',')[1], tz: d.timezone } : null
        }
    ];

    try {
        // Dispara todos os endpoints ao mesmo tempo; retorna a primeira resposta válida
        const winner = await Promise.any(endpoints.map((ep) => fetchIPEndpoint(ep)));
        saveCache(winner);
        return winner;
    } catch (aggregateError) {
        // Se todas as APIs de IP falharem
        return null;
    }
}

function saveCache(data) {
    try {
        localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({
            lat: data.lat,
            lon: data.lon,
            tz: data.tz,
            timestamp: Date.now()
        }));
    } catch (e) { }
}