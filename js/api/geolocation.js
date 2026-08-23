const GEO_CACHE_KEY = 'yisrael_cached_geolocation';
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

export async function getGeolocation() {
    // 1. Tenta obter do cache local para resposta instantânea e evitar rate-limit (429)
    try {
        const cachedRaw = localStorage.getItem(GEO_CACHE_KEY);
        if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (cached && cached.timestamp && (Date.now() - cached.timestamp < GEO_CACHE_TTL)) {
                const lat = parseFloat(cached.lat);
                const lon = parseFloat(cached.lon);
                if (!isNaN(lat) && !isNaN(lon)) {
                    return { lat, lon, tz: cached.tz };
                }
            }
        }
    } catch (e) {}

    // 2. Endpoints ordenados por confiabilidade/limites
    const endpoints = [
        { url: 'https://get.geojs.io/v1/ip/geo.json', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone }) },
        { url: 'https://api.ip.sb/geoip', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone }) },
        { url: 'https://ipapi.co/json/', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone }) },
        { url: 'https://ipinfo.io/json', parse: (data) => { if (!data.loc) return null; const [lat, lon] = data.loc.split(',').map(parseFloat); return { lat, lon, tz: data.timezone }; } },
        { url: 'https://ipwho.is/', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone?.id }) }
    ];

    for (const ep of endpoints) {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 2500);
        try {
            const res = await fetch(ep.url, { signal: controller.signal, mode: 'cors' });
            clearTimeout(tid);
            if (!res.ok) continue;
            const data = await res.json();
            const parsed = ep.parse(data);
            if (!parsed) continue;
            const lat = parseFloat(parsed.lat);
            const lon = parseFloat(parsed.lon);
            if (isNaN(lat) || isNaN(lon)) continue;

            const result = { lat, lon, tz: parsed.tz };
            try {
                localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ ...result, timestamp: Date.now() }));
            } catch (e) {}
            return result;
        } catch (err) {
            clearTimeout(tid);
            // Continua para o próximo endpoint em caso de erro/timeout/rate limit
        }
    }

    return null;
}


