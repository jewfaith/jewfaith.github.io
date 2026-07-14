export async function hebcalFetch(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function fetchNominatimReverse(lat, lon) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 5000);
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=pt&email=contato@yisraeldate.app`, { signal: ctrl.signal, headers: { 'Accept-Language': 'pt' } });
        clearTimeout(tid);
        if (!res.ok) return null;
        const data = await res.json();
        return data;
    } catch (e) { 
        clearTimeout(tid); 
        return null; 
    }
}
