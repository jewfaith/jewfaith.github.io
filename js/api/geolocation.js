export async function getGeolocation() {
    const endpoints = [
        { url: 'https://freeipapi.com/api/json', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timeZone }) },
        { url: 'https://ipwho.is/', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone?.id }) },
        { url: 'https://ipapi.co/json/', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone }) },
        { url: 'https://ipwhois.app/json/', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone }) },
        { url: 'https://json.geoiplookup.io/', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone_name }) },
        { url: 'https://ip-api.com/json/', parse: (data) => ({ lat: data.lat, lon: data.lon, tz: data.timezone }) },
        { url: 'https://api.ip.sb/geoip', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone }) },
        { url: 'https://reallyfreegeoip.org/json/', parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.time_zone }) },
        { url: 'https://ipinfo.io/json', parse: (data) => { if (!data.loc) return null; const [lat, lon] = data.loc.split(',').map(parseFloat); return { lat, lon, tz: data.timezone }; } },
        { url: 'https://geoplugin.net/json.gp', parse: (data) => ({ lat: data.geoplugin_latitude, lon: data.geoplugin_longitude, tz: data.geoplugin_timezone }) }
    ];

    const fetchPromises = endpoints.map(async (ep) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2000);
        try {
            const res = await fetch(ep.url, { signal: controller.signal });
            if (!res.ok) throw new Error("HTTP Error");
            const data = await res.json();
            const parsed = ep.parse(data);
            if (!parsed) throw new Error("Parse Error");
            const lat = parseFloat(parsed.lat);
            const lon = parseFloat(parsed.lon);
            
            if (!isNaN(lat) && !isNaN(lon)) {
                return { lat, lon, tz: parsed.tz };
            }
            throw new Error("Invalid Coords");
        } finally {
            clearTimeout(id);
        }
    });

    try {
        const fastestResult = await Promise.any(fetchPromises);
        return { lat: fastestResult.lat, lon: fastestResult.lon };
    } catch (e) {
        return null;
    }
}
