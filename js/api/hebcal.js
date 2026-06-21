export async function hebcalFetch(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function fetchNominatimReverse(lat, lon) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 5000);
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=pt`, { signal: ctrl.signal, headers: { 'Accept-Language': 'pt' } });
        const data = await res.json();
        clearTimeout(tid);
        return data;
    } catch (e) { 
        clearTimeout(tid); 
        return null; 
    }
}
