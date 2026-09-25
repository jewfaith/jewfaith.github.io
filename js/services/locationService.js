/**
 * LOCATIONSERVICE.JS - SERVIÇO DE LOCALIZAÇÃO E GEODADOS
 * 
 * Centraliza a obtenção de coordenadas ativas, consulta de localidades próximas
 * e lista canónica de cidades populares com 1-toque.
 */

import { state } from '../state.js';
import { searchNearbyCities } from '../api/nominatim.js';
import {
    LOCATION_EXPIRATION_MS,
    RECENT_LOCATIONS_MAX,
    RECENT_LOCATIONS_EXPIRATION_MS,
    LOCATION_STORAGE_KEYS
} from '../domain/constants.js';
import {
    savePersistentSetting,
    getPersistentSettingWithExpiry,
    removePersistentSetting
} from '../utils/persistence.js';

export const JERUSALEM_COORDS = {
    lat: 31.7683,
    lon: 35.2137,
    name: 'Jerusalém, Israel',
    isIsrael: true,
    tz: 'Asia/Jerusalem'
};

/**
 * Verifica se um objeto de localização corresponde a Jerusalém
 * (por coordenadas próximas ou texto descritivo).
 */
export function isJerusalemLocation(loc) {
    if (!loc) return false;
    if (typeof loc.lat === 'number' && typeof loc.lon === 'number') {
        const dLat = Math.abs(loc.lat - JERUSALEM_COORDS.lat);
        const dLon = Math.abs(loc.lon - JERUSALEM_COORDS.lon);
        if (dLat < 0.08 && dLon < 0.08) {
            return true;
        }
    }
    const nameStr = (loc.name || loc.primaryText || loc.fullName || '').toLowerCase();
    if (nameStr.includes('jerusal')) {
        return true;
    }
    return false;
}

/**
 * Compara se dois objetos de localização representam a mesma localidade.
 */
export function isSameLocation(a, b) {
    if (!a || !b) return false;
    if (typeof a.lat === 'number' && typeof a.lon === 'number' &&
        typeof b.lat === 'number' && typeof b.lon === 'number') {
        const dLat = Math.abs(a.lat - b.lat);
        const dLon = Math.abs(a.lon - b.lon);
        if (dLat < 0.01 && dLon < 0.01) {
            return true;
        }
    }
    const nameA = (a.primaryText || a.name || a.fullName || '').toLowerCase().trim();
    const nameB = (b.primaryText || b.name || b.fullName || '').toLowerCase().trim();
    if (nameA && nameB) {
        if (nameA === nameB) return true;
        const firstNameA = nameA.split(',')[0].trim();
        const firstNameB = nameB.split(',')[0].trim();
        if (firstNameA && firstNameA === firstNameB) return true;
    }
    return false;
}

export const POPULAR_1TOUCH_CITIES = [
    { primaryText: 'São Paulo', secondaryText: 'Brasil', fullName: 'São Paulo, Brasil', lat: -23.5505, lon: -46.6333, tz: 'America/Sao_Paulo', isIsrael: false },
    { primaryText: 'Luanda', secondaryText: 'Angola', fullName: 'Luanda, Angola', lat: -8.8390, lon: 13.2894, tz: 'Africa/Luanda', isIsrael: false },
    { primaryText: 'Rio de Janeiro', secondaryText: 'Brasil', fullName: 'Rio de Janeiro, Brasil', lat: -22.9068, lon: -43.1729, tz: 'America/Sao_Paulo', isIsrael: false },
    { primaryText: 'Brasília', secondaryText: 'Brasil', fullName: 'Brasília, Brasil', lat: -15.7975, lon: -47.8919, tz: 'America/Sao_Paulo', isIsrael: false },
    { primaryText: 'Salvador', secondaryText: 'Brasil', fullName: 'Salvador, Brasil', lat: -12.9777, lon: -38.5016, tz: 'America/Bahia', isIsrael: false },
    { primaryText: 'Fortaleza', secondaryText: 'Brasil', fullName: 'Fortaleza, Brasil', lat: -3.7319, lon: -38.5267, tz: 'America/Fortaleza', isIsrael: false },
    { primaryText: 'Belo Horizonte', secondaryText: 'Brasil', fullName: 'Belo Horizonte, Brasil', lat: -19.9167, lon: -43.9345, tz: 'America/Sao_Paulo', isIsrael: false },
    { primaryText: 'Lisboa', secondaryText: 'Portugal', fullName: 'Lisboa, Portugal', lat: 38.7223, lon: -9.1393, tz: 'Europe/Lisbon', isIsrael: false },
    { primaryText: 'Manaus', secondaryText: 'Brasil', fullName: 'Manaus, Brasil', lat: -3.1190, lon: -60.0217, tz: 'America/Manaus', isIsrael: false },
    { primaryText: 'Curitiba', secondaryText: 'Brasil', fullName: 'Curitiba, Brasil', lat: -25.4284, lon: -49.2733, tz: 'America/Sao_Paulo', isIsrael: false },
    { primaryText: 'Recife', secondaryText: 'Brasil', fullName: 'Recife, Brasil', lat: -8.0476, lon: -34.8770, tz: 'America/Recife', isIsrael: false },
    { primaryText: 'Porto', secondaryText: 'Portugal', fullName: 'Porto, Portugal', lat: 41.1579, lon: -8.6291, tz: 'Europe/Lisbon', isIsrael: false },
    { primaryText: 'Belém', secondaryText: 'Brasil', fullName: 'Belém, Brasil', lat: -1.4558, lon: -48.4902, tz: 'America/Belem', isIsrael: false },
    { primaryText: 'Goiânia', secondaryText: 'Brasil', fullName: 'Goiânia, Brasil', lat: -16.6869, lon: -49.2648, tz: 'America/Sao_Paulo', isIsrael: false },
    { primaryText: 'Porto Alegre', secondaryText: 'Brasil', fullName: 'Porto Alegre, Brasil', lat: -30.0346, lon: -51.2177, tz: 'America/Sao_Paulo', isIsrael: false },
    { primaryText: 'Campinas', secondaryText: 'Brasil', fullName: 'Campinas, Brasil', lat: -22.9056, lon: -47.0608, tz: 'America/Sao_Paulo', isIsrael: false },
    { primaryText: 'Maputo', secondaryText: 'Moçambique', fullName: 'Maputo, Moçambique', lat: -25.9692, lon: 32.5732, tz: 'Africa/Maputo', isIsrael: false },
    { primaryText: 'Praia', secondaryText: 'Cabo Verde', fullName: 'Praia, Cabo Verde', lat: 14.9330, lon: -23.5133, tz: 'Atlantic/Cape_Verde', isIsrael: false },
    { primaryText: 'Nova Iorque', secondaryText: 'Estados Unidos', fullName: 'Nova Iorque, EUA', lat: 40.7128, lon: -74.0060, tz: 'America/New_York', isIsrael: false },
    { primaryText: 'Buenos Aires', secondaryText: 'Argentina', fullName: 'Buenos Aires, Argentina', lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires', isIsrael: false }
];

let nearbyLocationsCache = [];
let isFetchingNearby = false;

/**
 * Obtém a localização selecionada ativa pelo utilizador com validação de TTL de 90 dias.
 * Se expirada (> 90 dias), remove os dados de armazenamento e retorna null.
 */
export function getSelectedLocation() {
    const raw = getPersistentSettingWithExpiry(
        LOCATION_STORAGE_KEYS.ACTIVE_LOCATION,
        LOCATION_EXPIRATION_MS,
        null
    );
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
            return parsed;
        }
    } catch (e) {
        removePersistentSetting(LOCATION_STORAGE_KEYS.ACTIVE_LOCATION);
    }
    return null;
}

/**
 * Obtém as últimas até 3 localizações selecionadas para seleção rápida (com TTL de 10 dias).
 * Itens com mais de 10 dias são expurgados do armazenamento.
 */
export function getRecentLocations() {
    if (typeof localStorage === 'undefined') return [];
    try {
        const raw = localStorage.getItem(LOCATION_STORAGE_KEYS.RECENT_LOCATIONS);
        if (!raw) return [];
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) {
            localStorage.removeItem(LOCATION_STORAGE_KEYS.RECENT_LOCATIONS);
            return [];
        }

        const now = Date.now();
        const validList = list.filter(item => {
            if (!item || !item.timestamp) return false;
            const age = now - item.timestamp;
            return age >= 0 && age <= RECENT_LOCATIONS_EXPIRATION_MS;
        });

        if (validList.length !== list.length) {
            if (validList.length === 0) {
                localStorage.removeItem(LOCATION_STORAGE_KEYS.RECENT_LOCATIONS);
            } else {
                localStorage.setItem(LOCATION_STORAGE_KEYS.RECENT_LOCATIONS, JSON.stringify(validList));
            }
        }

        return validList.slice(0, RECENT_LOCATIONS_MAX);
    } catch (e) {
        try { localStorage.removeItem(LOCATION_STORAGE_KEYS.RECENT_LOCATIONS); } catch (e2) {}
        return [];
    }
}

/**
 * Salva a localização selecionada:
 * 1. Guarda apenas a localização ativa atual em 'exactLocation' com TTL de 90 dias.
 * 2. Atualiza o histórico de seleção rápida (até 3 últimas cidades) com TTL de 10 dias cada.
 */
export function saveSelectedLocation(locationObj) {
    if (!locationObj || typeof locationObj.lat !== 'number' || typeof locationObj.lon !== 'number') {
        return;
    }

    // 1. Guarda apenas a localização selecionada ativa durante 90 dias
    const locPayload = {
        lat: locationObj.lat,
        lon: locationObj.lon,
        name: locationObj.name || `${locationObj.lat.toFixed(4)}, ${locationObj.lon.toFixed(4)}`,
        isIsrael: !!locationObj.isIsrael,
        tz: locationObj.tz || (locationObj.isIsrael ? 'Asia/Jerusalem' : 'UTC')
    };
    savePersistentSetting(LOCATION_STORAGE_KEYS.ACTIVE_LOCATION, JSON.stringify(locPayload));

    // 2. Histórico das últimas 3 para a seleção rápida (durante 10 dias)
    if (typeof localStorage !== 'undefined') {
        try {
            const currentRecent = getRecentLocations();
            const now = Date.now();

            const primary = locationObj.primaryText || (locationObj.name ? locationObj.name.split(',')[0].trim() : 'Localidade');
            const secondary = locationObj.secondaryText || (locationObj.name && locationObj.name.includes(',') ? locationObj.name.split(',').slice(1).join(',').trim() : '');

            const historyItem = {
                lat: locPayload.lat,
                lon: locPayload.lon,
                name: locPayload.name,
                primaryText: primary,
                secondaryText: secondary,
                isIsrael: locPayload.isIsrael,
                tz: locPayload.tz,
                timestamp: now
            };

            const deduplicated = currentRecent.filter(item => {
                return !isSameLocation(item, historyItem);
            });

            const updatedRecent = [historyItem, ...deduplicated].slice(0, RECENT_LOCATIONS_MAX);
            localStorage.setItem(LOCATION_STORAGE_KEYS.RECENT_LOCATIONS, JSON.stringify(updatedRecent));
        } catch (e) {}
    }
}

/**
 * Varredura preventiva para apagar dados expirados (ativa > 90d, recentes > 10d).
 */
export function clearExpiredLocations() {
    getSelectedLocation();
    getRecentLocations();
}

/**
 * Obtém as coordenadas geográficas ativas do utilizador com fallback para Jerusalém.
 */
export function getActiveCoords() {
    const selected = getSelectedLocation();
    if (selected) {
        return selected;
    }
    if (state.userLocation) {
        return state.userLocation;
    }
    return JERUSALEM_COORDS;
}

/**
 * Consulta cidades e localidades vizinhas a partir das coordenadas ativas.
 */
export async function fetchNearbyLocations(onSuccessCallback) {
    if (nearbyLocationsCache.length > 0) {
        if (onSuccessCallback) onSuccessCallback(nearbyLocationsCache);
        return nearbyLocationsCache;
    }

    if (isFetchingNearby) return [];
    isFetchingNearby = true;

    try {
        const coords = getActiveCoords();
        const lat = coords.lat;
        const lon = coords.lon;

        const latDelta = 0.4;
        const cosLat = Math.cos(lat * Math.PI / 180);
        const lonDelta = latDelta / (cosLat > 0.01 ? cosLat : 1);

        const left = lon - lonDelta;
        const right = lon + lonDelta;
        const top = lat + latDelta;
        const bottom = lat - latDelta;

        const data = await searchNearbyCities(left, top, right, bottom, 30);
        if (Array.isArray(data)) {
            const seen = new Set();
            const uniqueItems = [];

            for (const item of data) {
                if (item.class !== 'place' && item.class !== 'boundary') continue;
                if (['country', 'state', 'region'].includes(item.type) || ['country', 'state'].includes(item.addresstype)) continue;

                const parts = item.display_name.split(',').map(s => s.trim());
                if (parts.length <= 1) continue;

                let locality = parts[0];
                if (item.address) {
                    locality = item.address.village || item.address.town || item.address.city || item.address.municipality || item.address.county || item.address.suburb || item.address.hamlet || parts[0];
                }

                const country = item.address && item.address.country ? item.address.country : parts[parts.length - 1];
                const displayText = `${locality}, ${country}`;

                if (seen.has(displayText)) continue;
                seen.add(displayText);

                const itemLat = parseFloat(item.lat);
                const itemLon = parseFloat(item.lon);
                const dx = (itemLon - lon) * cosLat;
                const dy = itemLat - lat;
                const distSq = dx * dx + dy * dy;

                uniqueItems.push({ item, displayText, distSq });
            }

            uniqueItems.forEach(u => { u.distanceKm = Math.sqrt(u.distSq) * 111; });
            uniqueItems.sort((a, b) => a.distanceKm - b.distanceKm);

            const binnedItems = [];
            const usedBins = new Set();

            for (const item of uniqueItems) {
                const bin = Math.floor(item.distanceKm / 5);
                if (!usedBins.has(bin)) {
                    usedBins.add(bin);
                    binnedItems.push(item);
                }
            }

            if (binnedItems.length < 15) {
                const selectedIds = new Set(binnedItems.map(b => b.item.place_id));
                for (const item of uniqueItems) {
                    if (binnedItems.length >= 15) break;
                    if (!selectedIds.has(item.item.place_id)) {
                        binnedItems.push(item);
                    }
                }
            }

            binnedItems.sort((a, b) => a.distanceKm - b.distanceKm);
            nearbyLocationsCache = binnedItems;
        }
    } catch (err) {
        console.warn('[Location] Falha ao carregar localidades próximas.');
    } finally {
        isFetchingNearby = false;
        if (onSuccessCallback) onSuccessCallback(nearbyLocationsCache);
    }

    return nearbyLocationsCache;
}

export function clearNearbyLocationsCache() {
    nearbyLocationsCache = [];
}

export function getCachedNearbyLocations() {
    return nearbyLocationsCache;
}

