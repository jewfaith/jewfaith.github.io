export async function getGeolocation() {
    const endpoints = [
        { url: 'https://get.geojs.io/v1/ip/geo.json', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone }) },
        { url: 'https://ipwho.is/', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone?.id }) },
        { url: 'https://api.ip.sb/geoip', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone }) },
        { url: 'https://ipapi.co/json/', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone }) },
        { url: 'https://ipinfo.io/json', parse: (data) => { if (!data.loc) return null; const [lat, lon] = data.loc.split(',').map(parseFloat); return { lat, lon, tz: data.timezone }; } }
    ];

    const fetchEndpoint = async (ep) => {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 2500);
        try {
            const res = await fetch(ep.url, { signal: controller.signal, mode: 'cors' });
            clearTimeout(tid);
            if (!res.ok) throw new Error('Bad response');
            const data = await res.json();
            const parsed = ep.parse(data);
            if (!parsed) throw new Error('Parse error');
            const lat = parseFloat(parsed.lat);
            const lon = parseFloat(parsed.lon);
            if (isNaN(lat) || isNaN(lon)) throw new Error('Invalid coords');
            return { lat, lon, tz: parsed.tz };
        } catch (err) {
            clearTimeout(tid);
            throw err;
        }
    };

    try {
        return await Promise.any(endpoints.map(fetchEndpoint));
    } catch {
        return null;
    }
}

