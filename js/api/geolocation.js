/**
 * GEOLOCATION.JS - SISTEMA DE LOCALIZAÇÃO APROXIMADA E RESOLUÇÃO HIERÁRQUICA
 * 
 * Ordem estrita de prioridade:
 * 1. Localização existente / cache (armazenamento persistente)
 * 2. Localização aproximada do dispositivo / browser (baixa precisão, não-bloqueante)
 * 3. Localização aproximada por IP quando disponível
 * 4. Fuso horário do browser / Heurística regional
 * 5. Jerusalém como fallback canónico absoluto
 * 
 * A inicialização nunca bloqueia o carregamento inicial da aplicação.
 */

import { fetchNominatimReverse } from './nominatim.js';

export const JERUSALEM_DEFAULT = {
    lat: 31.7683,
    lon: 35.2137,
    tz: 'Asia/Jerusalem',
    name: 'Jerusalém, Israel',
    primaryText: 'Jerusalém',
    secondaryText: 'Israel',
    isIsrael: true,
    source: 'canonical-default'
};

// Mapa canónico de fusos horários para coordenadas aproximadas (fallback instantâneo 0ms offline, sem permissões)
const TIMEZONE_COORDS_MAP = {
    'Asia/Jerusalem': { lat: 31.7683, lon: 35.2137, name: 'Jerusalém, Israel', primaryText: 'Jerusalém', secondaryText: 'Israel', isIsrael: true, tz: 'Asia/Jerusalem' },
    'Europe/Lisbon': { lat: 38.7223, lon: -9.1393, name: 'Lisboa, Portugal', primaryText: 'Lisboa', secondaryText: 'Portugal', isIsrael: false, tz: 'Europe/Lisbon' },
    'Atlantic/Madeira': { lat: 32.6500, lon: -16.9086, name: 'Funchal, Portugal', primaryText: 'Funchal', secondaryText: 'Portugal', isIsrael: false, tz: 'Atlantic/Madeira' },
    'Atlantic/Azores': { lat: 37.7412, lon: -25.6756, name: 'Ponta Delgada, Portugal', primaryText: 'Ponta Delgada', secondaryText: 'Portugal', isIsrael: false, tz: 'Atlantic/Azores' },
    'Europe/Madrid': { lat: 40.4168, lon: -3.7038, name: 'Madrid, Espanha', primaryText: 'Madrid', secondaryText: 'Espanha', isIsrael: false, tz: 'Europe/Madrid' },
    'Europe/London': { lat: 51.5074, lon: -0.1278, name: 'Londres, Reino Unido', primaryText: 'Londres', secondaryText: 'Reino Unido', isIsrael: false, tz: 'Europe/London' },
    'Europe/Paris': { lat: 48.8566, lon: 2.3522, name: 'Paris, França', primaryText: 'Paris', secondaryText: 'França', isIsrael: false, tz: 'Europe/Paris' },
    'Europe/Rome': { lat: 41.9028, lon: 12.4964, name: 'Roma, Itália', primaryText: 'Roma', secondaryText: 'Itália', isIsrael: false, tz: 'Europe/Rome' },
    'Europe/Berlin': { lat: 52.5200, lon: 13.4050, name: 'Berlim, Alemanha', primaryText: 'Berlim', secondaryText: 'Alemanha', isIsrael: false, tz: 'Europe/Berlin' },
    'Europe/Amsterdam': { lat: 52.3676, lon: 4.9041, name: 'Amesterdão, Países Baixos', primaryText: 'Amesterdão', secondaryText: 'Países Baixos', isIsrael: false, tz: 'Europe/Amsterdam' },
    'Europe/Brussels': { lat: 50.8503, lon: 4.3517, name: 'Bruxelas, Bélgica', primaryText: 'Bruxelas', secondaryText: 'Bélgica', isIsrael: false, tz: 'Europe/Brussels' },
    'Europe/Vienna': { lat: 48.2082, lon: 16.3738, name: 'Viena, Áustria', primaryText: 'Viena', secondaryText: 'Áustria', isIsrael: false, tz: 'Europe/Vienna' },
    'Europe/Zurich': { lat: 47.3769, lon: 8.5417, name: 'Zurique, Suíça', primaryText: 'Zurique', secondaryText: 'Suíça', isIsrael: false, tz: 'Europe/Zurich' },
    'Europe/Warsaw': { lat: 52.2297, lon: 21.0122, name: 'Varsóvia, Polónia', primaryText: 'Varsóvia', secondaryText: 'Polónia', isIsrael: false, tz: 'Europe/Warsaw' },
    'Europe/Dublin': { lat: 53.3498, lon: -6.2603, name: 'Dublin, Irlanda', primaryText: 'Dublin', secondaryText: 'Irlanda', isIsrael: false, tz: 'Europe/Dublin' },
    'Europe/Athens': { lat: 37.9838, lon: 23.7275, name: 'Atenas, Grécia', primaryText: 'Atenas', secondaryText: 'Grécia', isIsrael: false, tz: 'Europe/Athens' },
    'America/Sao_Paulo': { lat: -23.5505, lon: -46.6333, name: 'São Paulo, Brasil', primaryText: 'São Paulo', secondaryText: 'Brasil', isIsrael: false, tz: 'America/Sao_Paulo' },
    'America/Bahia': { lat: -12.9777, lon: -38.5016, name: 'Salvador, Brasil', primaryText: 'Salvador', secondaryText: 'Brasil', isIsrael: false, tz: 'America/Bahia' },
    'America/Recife': { lat: -8.0476, lon: -34.8770, name: 'Recife, Brasil', primaryText: 'Recife', secondaryText: 'Brasil', isIsrael: false, tz: 'America/Recife' },
    'America/Fortaleza': { lat: -3.7319, lon: -38.5267, name: 'Fortaleza, Brasil', primaryText: 'Fortaleza', secondaryText: 'Brasil', isIsrael: false, tz: 'America/Fortaleza' },
    'America/Belem': { lat: -1.4558, lon: -48.4902, name: 'Belém, Brasil', primaryText: 'Belém', secondaryText: 'Brasil', isIsrael: false, tz: 'America/Belem' },
    'America/Manaus': { lat: -3.1190, lon: -60.0217, name: 'Manaus, Brasil', primaryText: 'Manaus', secondaryText: 'Brasil', isIsrael: false, tz: 'America/Manaus' },
    'America/Cuiaba': { lat: -15.6010, lon: -56.0974, name: 'Cuiabá, Brasil', primaryText: 'Cuiabá', secondaryText: 'Brasil', isIsrael: false, tz: 'America/Cuiaba' },
    'America/Campo_Grande': { lat: -20.4697, lon: -54.6201, name: 'Campo Grande, Brasil', primaryText: 'Campo Grande', secondaryText: 'Brasil', isIsrael: false, tz: 'America/Campo_Grande' },
    'America/Porto_Velho': { lat: -8.7619, lon: -63.9039, name: 'Porto Velho, Brasil', primaryText: 'Porto Velho', secondaryText: 'Brasil', isIsrael: false, tz: 'America/Porto_Velho' },
    'America/Rio_Branco': { lat: -9.9753, lon: -67.8249, name: 'Rio Branco, Brasil', primaryText: 'Rio Branco', secondaryText: 'Brasil', isIsrael: false, tz: 'America/Rio_Branco' },
    'Africa/Luanda': { lat: -8.8390, lon: 13.2894, name: 'Luanda, Angola', primaryText: 'Luanda', secondaryText: 'Angola', isIsrael: false, tz: 'Africa/Luanda' },
    'Africa/Maputo': { lat: -25.9692, lon: 32.5732, name: 'Maputo, Moçambique', primaryText: 'Maputo', secondaryText: 'Moçambique', isIsrael: false, tz: 'Africa/Maputo' },
    'Atlantic/Cape_Verde': { lat: 14.9330, lon: -23.5133, name: 'Praia, Cabo Verde', primaryText: 'Praia', secondaryText: 'Cabo Verde', isIsrael: false, tz: 'Atlantic/Cape_Verde' },
    'America/New_York': { lat: 40.7128, lon: -74.0060, name: 'Nova Iorque, EUA', primaryText: 'Nova Iorque', secondaryText: 'Estados Unidos', isIsrael: false, tz: 'America/New_York' },
    'America/Chicago': { lat: 41.8781, lon: -87.6298, name: 'Chicago, EUA', primaryText: 'Chicago', secondaryText: 'Estados Unidos', isIsrael: false, tz: 'America/Chicago' },
    'America/Denver': { lat: 39.7392, lon: -104.9903, name: 'Denver, EUA', primaryText: 'Denver', secondaryText: 'Estados Unidos', isIsrael: false, tz: 'America/Denver' },
    'America/Los_Angeles': { lat: 34.0522, lon: -118.2437, name: 'Los Angeles, EUA', primaryText: 'Los Angeles', secondaryText: 'Estados Unidos', isIsrael: false, tz: 'America/Los_Angeles' },
    'America/Toronto': { lat: 43.6532, lon: -79.3832, name: 'Toronto, Canadá', primaryText: 'Toronto', secondaryText: 'Canadá', isIsrael: false, tz: 'America/Toronto' },
    'America/Buenos_Aires': { lat: -34.6037, lon: -58.3816, name: 'Buenos Aires, Argentina', primaryText: 'Buenos Aires', secondaryText: 'Argentina', isIsrael: false, tz: 'America/Buenos_Aires' },
    'America/Santiago': { lat: -33.4489, lon: -70.6693, name: 'Santiago, Chile', primaryText: 'Santiago', secondaryText: 'Chile', isIsrael: false, tz: 'America/Santiago' },
    'America/Bogota': { lat: 4.7110, lon: -74.0721, name: 'Bogotá, Colômbia', primaryText: 'Bogotá', secondaryText: 'Colômbia', isIsrael: false, tz: 'America/Bogota' },
    'America/Lima': { lat: -12.0464, lon: -77.0428, name: 'Lima, Peru', primaryText: 'Lima', secondaryText: 'Peru', isIsrael: false, tz: 'America/Lima' },
    'America/Mexico_City': { lat: 19.4326, lon: -99.1332, name: 'Cidade do México, México', primaryText: 'Cidade do México', secondaryText: 'México', isIsrael: false, tz: 'America/Mexico_City' }
};

/**
 * Obtém localização aproximada pelo fuso horário do browser (0ms, 100% offline, sem permissões).
 */
export function getTimezoneApproximateLocation() {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz && TIMEZONE_COORDS_MAP[tz]) {
            return { ...TIMEZONE_COORDS_MAP[tz], source: 'browser-timezone' };
        }
    } catch (e) { }
    return null;
}

/**
 * Obtém localização precisa do dispositivo através da Geolocation API do browser.
 * EXCLUSIVAMENTE executada quando o utilizador clica ou pede explicitamente a sua localização.
 * Nunca é chamada automaticamente no arranque para não exibir prompts indesejados de permissão.
 */
export async function getDevicePreciseLocation(timeoutMs = 6000) {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return null;
    }

    return new Promise((resolve) => {
        let isDone = false;
        const timer = setTimeout(() => {
            if (!isDone) {
                isDone = true;
                resolve(null);
            }
        }, timeoutMs);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                if (isDone) return;
                isDone = true;
                clearTimeout(timer);

                try {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

                    let locName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
                    let primary = 'Localização Atual';
                    let secondary = '';
                    let isIsrael = false;

                    const dLatIl = Math.abs(lat - JERUSALEM_DEFAULT.lat);
                    const dLonIl = Math.abs(lon - JERUSALEM_DEFAULT.lon);
                    if (dLatIl < 2.5 && dLonIl < 2.5) {
                        isIsrael = true;
                    }

                    try {
                        const geo = await fetchNominatimReverse(lat, lon);
                        if (geo && geo.address) {
                            primary = geo.address.city || geo.address.town || geo.address.municipality || geo.address.village || geo.address.county || primary;
                            secondary = geo.address.country || secondary;
                            locName = `${primary}, ${secondary}`.trim().replace(/^,\s*|,\s*$/g, '');
                            if (geo.address.country_code === 'il' || geo.address.country === 'Israel') {
                                isIsrael = true;
                            }
                        }
                    } catch (e) { }

                    resolve({
                        lat,
                        lon,
                        name: locName,
                        primaryText: primary,
                        secondaryText: secondary,
                        isIsrael,
                        tz: isIsrael ? 'Asia/Jerusalem' : browserTz,
                        source: 'device-gps'
                    });
                } catch (err) {
                    resolve(null);
                }
            },
            () => {
                if (isDone) return;
                isDone = true;
                clearTimeout(timer);
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: timeoutMs,
                maximumAge: 60000
            }
        );
    });
}

/**
 * Obtém localização aproximada por IP (não-bloqueante, sem permissões de browser, timeout rápido).
 * Usa FreeIPAPI com fallback automático para ipwho.is.
 */
export async function getIPApproximateLocation(timeoutMs = 2500) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return null;
    }

    const deviceTz = (typeof Intl !== 'undefined' && Intl.DateTimeFormat)
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'UTC';

    // 1. Provedor Primário: freeipapi.com
    const ctrl1 = new AbortController();
    const tid1 = setTimeout(() => ctrl1.abort(), timeoutMs);

    try {
        const res = await fetch('https://freeipapi.com/api/json', {
            signal: ctrl1.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(tid1);

        if (res.ok) {
            const data = await res.json();
            if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
                const lat = data.latitude;
                const lon = data.longitude;
                const primary = data.cityName || 'Localidade';
                const secondary = data.countryName || '';
                const isIsrael = data.countryCode === 'IL' || (data.countryName && data.countryName.toLowerCase() === 'israel');

                // Garante que para Portugal continental utiliza Europe/Lisbon e não Atlantic/Azores
                let tz = deviceTz;
                if (data.timeZones && Array.isArray(data.timeZones)) {
                    if (data.timeZones.includes(deviceTz)) {
                        tz = deviceTz;
                    } else if (isIsrael) {
                        tz = 'Asia/Jerusalem';
                    } else if (data.timeZones.length > 0) {
                        tz = data.timeZones[0];
                    }
                } else if (data.timeZone && typeof data.timeZone === 'string') {
                    tz = data.timeZone;
                } else if (isIsrael) {
                    tz = 'Asia/Jerusalem';
                }

                return {
                    lat,
                    lon,
                    name: `${primary}, ${secondary}`.trim().replace(/^,\s*|,\s*$/g, ''),
                    primaryText: primary,
                    secondaryText: secondary,
                    isIsrael: !!isIsrael,
                    tz: tz || 'UTC',
                    source: 'ip-approx'
                };
            }
        }
    } catch (e) {
        clearTimeout(tid1);
    }

    // 2. Provedor Secundário de Redundância: ipwho.is
    const ctrl2 = new AbortController();
    const tid2 = setTimeout(() => ctrl2.abort(), timeoutMs);

    try {
        const res2 = await fetch('https://ipwho.is/', {
            signal: ctrl2.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(tid2);

        if (res2.ok) {
            const data2 = await res2.json();
            if (data2.success !== false && typeof data2.latitude === 'number' && typeof data2.longitude === 'number') {
                const lat = data2.latitude;
                const lon = data2.longitude;
                const primary = data2.city || 'Localidade';
                const secondary = data2.country || '';
                const isIsrael = data2.country_code === 'IL' || (data2.country && data2.country.toLowerCase() === 'israel');
                const tz = isIsrael ? 'Asia/Jerusalem' : (data2.timezone?.id || deviceTz || 'UTC');

                return {
                    lat,
                    lon,
                    name: `${primary}, ${secondary}`.trim().replace(/^,\s*|,\s*$/g, ''),
                    primaryText: primary,
                    secondaryText: secondary,
                    isIsrael: !!isIsrael,
                    tz,
                    source: 'ip-approx'
                };
            }
        }
    } catch (e) {
        clearTimeout(tid2);
    }

    return null;
}

/**
 * Resolve a cadeia prioritária automática de localização SEM PEDIR AUTORIZAÇÃO:
 * 1. Localização existente / cache (armazenamento persistente)
 * 2. Localização aproximada por IP (não-bloqueante, sem diálogos de permissão)
 * 3. Localização aproximada pelo fuso horário do browser (0ms, 100% offline, sem permissões)
 * 4. Jerusalém como fallback canónico absoluto
 * 
 * NUNCA invoca navigator.geolocation aqui, garantindo que o utilizador nunca vê
 * popups indesejados de permissão no browser ao aceder ao site.
 * 
 * @param {Function} getExistingLocFn - Função para ler localização salva existente
 * @returns {Promise<object>} Objeto canónico de localização com lat, lon, name, primaryText, tz, isIsrael
 */
export async function resolveLocationHierarchy(getExistingLocFn = null) {
    // 1. Localização existente / cache ativa
    if (typeof getExistingLocFn === 'function') {
        const existing = getExistingLocFn();
        if (existing && typeof existing.lat === 'number' && typeof existing.lon === 'number') {
            return { ...existing, source: 'cache' };
        }
    }

    // 2. Localização aproximada por IP (sem pedir permissão ao utilizador)
    try {
        const ipLoc = await getIPApproximateLocation(2500);
        if (ipLoc) return ipLoc;
    } catch (e) { }

    // 3. Localização aproximada pelo fuso horário do browser (0ms instantâneo offline, sem permissões)
    const tzLoc = getTimezoneApproximateLocation();
    if (tzLoc) return tzLoc;

    // 4. Jerusalém como fallback canónico absoluto
    return { ...JERUSALEM_DEFAULT };
}

// Aliases de compatibilidade e métodos sob demanda explícita do utilizador
export const getDeviceApproximateLocation = getDevicePreciseLocation;
export const getGPSLocation = getDevicePreciseLocation;
export const getGeolocation = getDevicePreciseLocation;