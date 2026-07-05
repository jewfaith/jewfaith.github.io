export async function getGeolocation() {
    const endpoints = [
        { url: 'https://get.geojs.io/v1/ip/geo.json', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone }) },
        { url: 'https://ipwho.is/', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone?.id }) },
        { url: 'https://api.ip.sb/geoip', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone }) },
        { url: 'https://ipinfo.io/json', parse: (data) => { if (!data.loc) return null; const [lat, lon] = data.loc.split(',').map(parseFloat); return { lat, lon, tz: data.timezone }; } },
        { url: 'https://freeipapi.com/api/json', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timeZone }) },
        { url: 'https://ipapi.co/json/', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone }) }
    ];

    for (const ep of endpoints) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3000);
        try {
            const res = await fetch(ep.url, { signal: controller.signal });
            clearTimeout(id);
            
            if (!res.ok) continue;
            
            const data = await res.json();
            const parsed = ep.parse(data);
            if (!parsed) continue;
            
            const lat = parseFloat(parsed.lat);
            const lon = parseFloat(parsed.lon);
            
            if (!isNaN(lat) && !isNaN(lon)) {
                return { lat, lon, tz: parsed.tz };
            }
        } catch (e) {
            clearTimeout(id);
            // Ignore error (e.g. adblocker, network error) and try next endpoint
        }
    }

    return null;
}
