import { startTimers, stopTimers } from './timers.js';
import { state } from '../state.js';
import { applyEstimatedTheme } from './theme.js';
import { savePersistentSetting, setCookie, isUserPremium, setUserPremium } from '../utils/persistence.js';
import { ICONS } from './icons.js';
import { trackMicroAction } from '../utils/umamiMonitor.js';

// Sanitiza strings para prevencao de XSS
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

let updateDashboardCallbackGlobal = null;
let nearbyLocationsCache = [];
let isFetchingNearby = false;

// Purga dados obsoletos de versões bíblicas em cache
(function purgeLegacyBibleCache() {
    if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') return;
    try {
        const ptTranslations = ['NVT', 'OL', 'AA'];
        const pref = localStorage.getItem('preferred_bible_version');
        if (pref && !ptTranslations.includes(pref)) {
            localStorage.removeItem('preferred_bible_version');
        }
        [localStorage, sessionStorage].forEach(storage => {
            if (!storage) return;
            for (let i = storage.length - 1; i >= 0; i--) {
                const key = storage.key(i);
                if (key && key.startsWith('bible_cache_')) {
                    try {
                        const item = JSON.parse(storage.getItem(key));
                        if (!item || !item.translation || !ptTranslations.includes(item.translation)) {
                            storage.removeItem(key);
                        }
                    } catch (e) {
                        storage.removeItem(key);
                    }
                }
            }
        });
    } catch (e) { }
})();

function getActiveCoords() {
    const exactLocRaw = localStorage.getItem('exactLocation');
    if (exactLocRaw) {
        try {
            return JSON.parse(exactLocRaw);
        } catch (e) { }
    }
    if (state.userLocation) {
        return state.userLocation;
    }
    return { lat: 31.7683, lon: 35.2137 }; // Jerusalem fallback
}

async function fetchNearbyLocations() {
    if (nearbyLocationsCache.length > 0 || isFetchingNearby) {
        const searchInput = document.getElementById('location-search-input');
        if (searchInput && searchInput.value.trim().length < 3) {
            renderSuggestions([]);
        }
        return;
    }
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

        const queryTypes = ['cidade', 'vila', 'aldeia', 'freguesia'];
        const seen = new Set();
        const uniqueItems = [];

        for (const q of queryTypes) {
            if (uniqueItems.length >= 12) break;

            try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 7000);
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&viewbox=${left},${top},${right},${bottom}&bounded=1&format=json&addressdetails=1&limit=25&accept-language=pt&email=contato@yisraeldate.app`, { signal: ctrl.signal });
                clearTimeout(tid);
                if (!res.ok) continue;
                const data = await res.json();
                if (!Array.isArray(data)) continue;

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
            } catch (e) {
                // Log failure when querying a specific locality type from Nominatim
                console.error(`Error querying nearby locations for type ${q}:`, e);
            }

            if (uniqueItems.length < 12) {
                await new Promise(resolve => setTimeout(resolve, 250));
            }
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
    } catch (err) {
        // Log unexpected error when fetching nearby localities
        console.error('Error fetching nearby locations:', err);
    } finally {
        isFetchingNearby = false;
        const searchInput = document.getElementById('location-search-input');
        if (searchInput && searchInput.value.trim().length < 3) {
            renderSuggestions([]);
        }
    }
}

const POPULAR_1TOUCH_CITIES = [
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
    { primaryText: 'Maputo', secondaryText: 'Moçambique', fullName: 'Maputo, Moçambique', lat: -25.9692, lon: 32.5732, tz: 'Africa/Maputo', isIsrael: false }
];

function renderSuggestions(results) {
    const suggestionsList = document.getElementById('location-suggestions');
    if (!suggestionsList) return;

    suggestionsList.innerHTML = '';
    const finalItems = [];

    const searchInput = document.getElementById('location-search-input');
    const isSearching = searchInput && searchInput.value.trim().length >= 3;

    if (!isSearching) {
        // 1. Ação Rápida de Jerusalém (Predefinida)
        finalItems.push({
            isJerusalemAction: true,
            primaryText: 'Jerusalém',
            secondaryText: 'Israel',
            iconClass: ICONS.star
        });

        // 2. Cidades Populares com 1 Toque
        finalItems.push(...POPULAR_1TOUCH_CITIES);
    } else {
        const maxSearchResults = 10;
        const searchItems = results.slice(0, maxSearchResults);
        finalItems.push(...searchItems);
    }

    finalItems.forEach(resItem => {
        const li = document.createElement('li');
        li.className = 'legend-card';

        let primaryText = resItem.primaryText;
        let secondaryText = resItem.secondaryText;
        let iconClass = resItem.iconClass || ICONS.location;

        if (!primaryText && resItem.item) {
            const parts = (resItem.item.display_name || '').split(',').map(s => s.trim());
            let locality = parts[0] || '';
            if (resItem.item.address) {
                locality = resItem.item.address.village || resItem.item.address.town || resItem.item.address.city || resItem.item.address.municipality || resItem.item.address.county || resItem.item.address.suburb || resItem.item.address.hamlet || parts[0];
            }
            const country = resItem.item.address && resItem.item.address.country ? resItem.item.address.country : (parts.length > 1 ? parts[parts.length - 1] : '');
            primaryText = locality;
            secondaryText = country;
        } else if (!primaryText && resItem.displayText) {
            const parts = resItem.displayText.split(',').map(s => s.trim());
            primaryText = parts[0];
            secondaryText = parts.length > 1 ? parts[parts.length - 1] : '';
        }

        li.style.cssText = "display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 15px; border-radius: 14px; background: var(--hover-gradient); border: 0.5px solid var(--card-border-color); margin-bottom: 6px; box-sizing: border-box; cursor: pointer; transition: background 0.15s ease, border-color 0.15s ease;";
        li.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
                <div class="icon-circle" style="width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i class="${iconClass}"></i>
                </div>
                <div style="display: flex; flex-direction: column; text-align: left; min-width: 0; flex: 1; gap: 2px;">
                    <span style="font-size: var(--font-size-base); font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(primaryText)}</span>
                    <span style="font-size: var(--font-size-xs); color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(secondaryText) || 'Localidade'}</span>
                </div>
            </div>
            <i class="${ICONS.chevronRight}" data-icon="chevronRight" style="font-size: 11px; color: var(--text-muted); opacity: 0.6; flex-shrink: 0;"></i>
        `;

        li.addEventListener('click', () => {
            if (resItem.isJerusalemAction) {
                console.log('[ACTION] Location selected: Jerusalem Universal Reference');
                const locObj = {
                    lat: 31.7683,
                    lon: 35.2137,
                    name: 'Jerusalém, Israel',
                    isIsrael: true,
                    tz: 'Asia/Jerusalem'
                };
                savePersistentSetting('exactLocation', JSON.stringify(locObj));
                applyEstimatedTheme(31.7683, 35.2137);
            } else if (resItem.lat && resItem.lon) {
                // Cidades Populares com 1 Toque
                const selectedName = resItem.fullName || `${primaryText}, ${secondaryText}`;
                console.log(`[ACTION] 1-Touch city selected: ${selectedName}`);
                const locObj = {
                    lat: resItem.lat,
                    lon: resItem.lon,
                    name: selectedName,
                    isIsrael: !!resItem.isIsrael,
                    tz: resItem.tz || 'UTC'
                };
                savePersistentSetting('exactLocation', JSON.stringify(locObj));
                applyEstimatedTheme(resItem.lat, resItem.lon);
            } else if (resItem.item) {
                // Pesquisa Livre Nominatim
                const lat = parseFloat(resItem.item.lat);
                const lon = parseFloat(resItem.item.lon);
                const isIl = resItem.item.address && (resItem.item.address.country_code === 'il' || resItem.item.address.country === 'Israel');
                const tz = isIl ? 'Asia/Jerusalem' : Intl.DateTimeFormat().resolvedOptions().timeZone;
                const selectedName = `${primaryText}, ${secondaryText}`;
                console.log(`[ACTION] Search city selected: ${selectedName}`);
                const locObj = { lat, lon, name: selectedName, isIsrael: isIl, tz: tz };
                savePersistentSetting('exactLocation', JSON.stringify(locObj));
                applyEstimatedTheme(lat, lon);
            }

            nearbyLocationsCache = [];
            const modal = document.getElementById('location-modal');
            if (modal) closeModalSafely(modal);

            const searchInput = document.getElementById('location-search-input');
            if (searchInput) searchInput.value = '';

            const allLocEls = document.querySelectorAll('#card-local, #desktop-card-local, .loc-name-display');
            allLocEls.forEach(el => { el.textContent = 'Calculando...'; });

            renderSuggestions([]);
            if (updateDashboardCallbackGlobal) updateDashboardCallbackGlobal();
        });

        suggestionsList.appendChild(li);
    });
}

function checkModalsActive() {
    const overlays = document.querySelectorAll('.modal-overlay');
    let anyActive = false;
    overlays.forEach(overlay => {
        if (overlay.style.display && overlay.style.display !== 'none') {
            anyActive = true;
        }
    });

    const wrapper = document.querySelector('.app-layout') || document.querySelector('.dashboard-wrapper');
    const isDesktop = window.innerWidth >= 768;
    const pcMode = document.documentElement.getAttribute('data-pc-mode') || 'drawer';

    if (anyActive) {
        document.body.classList.add('modal-open');
        if (wrapper) {
            if (isDesktop) {
                wrapper.removeAttribute('inert');
            } else {
                wrapper.setAttribute('inert', '');
            }
        }
        stopTimers();
    } else {
        document.body.classList.remove('modal-open');
        if (wrapper) wrapper.removeAttribute('inert');
        startTimers();
    }
}

const SHARED_DOM_PARSER = typeof DOMParser !== 'undefined' ? new DOMParser() : null;

function initModalObserver() {
    // Executa verificação inicial imediata para limpar qualquer inert residual
    checkModalsActive();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                checkModalsActive();
            }
        });
    });

    // Monitora estritamente os overlays estáticos existentes, sem observar recursivamente todo o document.body
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => observer.observe(overlay, { attributes: true, attributeFilter: ['style'] }));
    checkModalsActive();
}

function cleanText(text) {
    if (!text) return '';
    if (SHARED_DOM_PARSER) {
        const doc = SHARED_DOM_PARSER.parseFromString(text, 'text/html');
        return (doc.body.textContent || '').trim();
    }
    return String(text).replace(/<[^>]*>/g, '').trim();
}

const BOLLS_BOOK_IDS = {
    'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
    'Joshua': 6, 'Judges': 7, 'Ruth': 8,
    'I Samuel': 9, 'II Samuel': 10, '1 Samuel': 9, '2 Samuel': 10, 'Samuel': 9,
    'I Kings': 11, 'II Kings': 12, '1 Kings': 11, '2 Kings': 12, 'Kings': 11,
    'I Chronicles': 13, 'II Chronicles': 14, '1 Chronicles': 13, '2 Chronicles': 14, 'Chronicles': 13,
    'Ezra': 15, 'Nehemiah': 16, 'Esther': 17,
    'Job': 18, 'Psalms': 19, 'Proverbs': 20,
    'Ecclesiastes': 21, 'Song of Solomon': 22, 'Song of Songs': 22,
    'Isaiah': 23, 'Jeremiah': 24, 'Lamentations': 25,
    'Ezekiel': 26, 'Daniel': 27,
    'Hosea': 28, 'Joel': 29, 'Amos': 30,
    'Obadiah': 31, 'Jonah': 32, 'Micah': 33,
    'Nahum': 34, 'Habakkuk': 35, 'Zephaniah': 36,
    'Haggai': 37, 'Zechariah': 38, 'Malachi': 39,

    'Bereshit': 1, 'Shemot': 2, 'Vayikra': 3, 'Bamidbar': 4, 'Devarim': 5,
    'Yehoshua': 6, 'Shoftim': 7,
    'I Shmuel': 9, 'II Shmuel': 10, '1 Shmuel': 9, '2 Shmuel': 10, 'Shmuel': 9,
    'I Melachim': 11, 'II Melachim': 12, '1 Melachim': 11, '2 Melachim': 12, 'Melachim': 11,
    'Yeshayahu': 23, 'Yirmiyahu': 24, 'Yechezkel': 26,
    'Hoshea': 28, 'Yoel': 29, 'Amos': 30, 'Ovadia': 31, 'Yona': 32, 'Micha': 33,
    'Nachum': 34, 'Chavakuk': 35, 'Tzefania': 36, 'Chagai': 37, 'Zecharia': 38, 'Malachi': 39,
    'Tehilim': 19, 'Mishlei': 20, 'Iyov': 18, 'Shir HaShirim': 22,
    'Eichah': 25, 'Kohelet': 21, 'Nechemia': 16,
    'I Divrei Hayamim': 13, 'II Divrei Hayamim': 14, '1 Divrei Hayamim': 13, '2 Divrei Hayamim': 14,
    'Divrei Hayamim': 13, 'Divrei HaYamim': 13,

    'Gênesis': 1, 'Êxodo': 2, 'Levítico': 3, 'Números': 4, 'Deuteronômio': 5,
    'Josué': 6, 'Juízes': 7, 'Rute': 8,
    '1 Crônicas': 13, '2 Crônicas': 14, 'I Crônicas': 13, 'II Crônicas': 14, 'Crônicas': 13,
    '1 Reis': 11, '2 Reis': 12, 'I Reis': 11, 'II Reis': 12, 'Reis': 11,
    'Esdras': 15, 'Neemias': 16, 'Ester': 17,
    'Jó': 18, 'Salmos': 19, 'Provérbios': 20, 'Eclesiastes': 21, 'Cânticos': 22, 'Cantares': 22,
    'Isaías': 23, 'Jeremias': 24, 'Lamentações': 25,
    'Ezequiel': 26, 'Oséias': 28, 'Oseias': 28, 'Miqueias': 33, 'Naum': 34, 'Habacuque': 35, 'Sofonias': 36, 'Ageu': 37, 'Zacarias': 38, 'Malaquias': 39
};

function toHebrewBookName(text) {
    if (!text) return '';
    let result = text;

    const dhRegex = /^(?:(?:I{1,2}|[12])\s+)?(?:Divrei\s+Ha?yamim|Chronicles|Crônicas)\s+(\d+)(.*)$/i;
    const dhMatch = result.match(dhRegex);
    if (dhMatch) {
        const rawCh = parseInt(dhMatch[1], 10);
        const rest = dhMatch[2] || '';
        const isExplicitSecond = /^II\s+|^2\s+/i.test(result);
        if (rawCh > 29) {
            return `II Divrei Hayamim ${rawCh - 29}${rest}`;
        } else if (isExplicitSecond) {
            return `II Divrei Hayamim ${rawCh}${rest}`;
        } else {
            return `I Divrei Hayamim ${rawCh}${rest}`;
        }
    }

    const mapping = {
        'Genesis': 'Bereshit', 'Exodus': 'Shemot', 'Leviticus': 'Vayikra', 'Numbers': 'Bamidbar', 'Deuteronomy': 'Devarim',
        'Joshua': 'Yehoshua', 'Judges': 'Shoftim', 'II Samuel': 'II Shmuel', 'I Samuel': 'I Shmuel', '2 Samuel': 'II Shmuel',
        '1 Samuel': 'I Shmuel', 'Samuel': 'Shmuel', 'II Kings': 'II Melachim', 'I Kings': 'I Melachim', '2 Kings': 'II Melachim',
        '1 Kings': 'I Melachim', 'Kings': 'Melachim', 'Isaiah': 'Yeshayahu', 'Jeremiah': 'Yirmiyahu', 'Ezekiel': 'Yechezkel',
        'Hosea': 'Hoshea', 'Joel': 'Yoel', 'Amos': 'Amos', 'Obadiah': 'Ovadia', 'Jonah': 'Yona', 'Micah': 'Micha', 'Nahum': 'Nachum',
        'Habakkuk': 'Chavakuk', 'Zephaniah': 'Tzefania', 'Haggai': 'Chagai', 'Zechariah': 'Zecharia', 'Malachi': 'Malachi',
        'Psalms': 'Tehilim', 'Proverbs': 'Mishlei', 'Job': 'Iyov', 'Song of Solomon': 'Shir HaShirim', 'Song of Songs': 'Shir HaShirim',
        'Ruth': 'Ruth', 'Lamentations': 'Eichah', 'Ecclesiastes': 'Kohelet', 'Esther': 'Esther', 'Daniel': 'Daniel', 'Ezra': 'Ezra',
        'Nehemiah': 'Nechemia', 'II Chronicles': 'II Divrei Hayamim', 'I Chronicles': 'I Divrei Hayamim', '2 Chronicles': 'II Divrei Hayamim',
        '1 Chronicles': 'I Divrei Hayamim', 'Chronicles': 'Divrei Hayamim', 'Crônicas': 'Divrei Hayamim'
    };
    for (const [eng, heb] of Object.entries(mapping)) {
        result = result.replace(new RegExp(`\\b${eng}\\b`, 'g'), heb);
    }
    return result;
}

function parseRef(ref) {
    if (!ref) return null;
    let clean = ref.trim();

    const dhRegex = /^(?:(?:I{1,2}|[12])\s+)?(?:Divrei\s+Ha?yamim|Chronicles|Crônicas)\s+(\d+)(.*)$/i;
    const dhMatch = clean.match(dhRegex);
    if (dhMatch) {
        const rawCh = parseInt(dhMatch[1], 10);
        const rest = dhMatch[2] || '';
        const isExplicitSecond = /^II\s+|^2\s+/i.test(clean);
        if (rawCh > 29) {
            clean = `II Chronicles ${rawCh - 29}${rest}`;
        } else if (isExplicitSecond) {
            clean = `II Chronicles ${rawCh}${rest}`;
        } else {
            clean = `I Chronicles ${rawCh}${rest}`;
        }
    }

    const shmuelRegex = /^(?:(?:I{1,2}|[12])\s+)?(?:Shmuel|Samuel)\s+(\d+)(.*)$/i;
    const shMatch = clean.match(shmuelRegex);
    if (shMatch) {
        const rawCh = parseInt(shMatch[1], 10);
        const rest = shMatch[2] || '';
        const isExplicitSecond = /^II\s+|^2\s+/i.test(clean);
        if (rawCh > 31) {
            clean = `II Samuel ${rawCh - 31}${rest}`;
        } else if (isExplicitSecond) {
            clean = `II Samuel ${rawCh}${rest}`;
        } else {
            clean = `I Samuel ${rawCh}${rest}`;
        }
    }

    const melachimRegex = /^(?:(?:I{1,2}|[12])\s+)?(?:Melachim|Kings|Reis)\s+(\d+)(.*)$/i;
    const melMatch = clean.match(melachimRegex);
    if (melMatch) {
        const rawCh = parseInt(melMatch[1], 10);
        const rest = melMatch[2] || '';
        const isExplicitSecond = /^II\s+|^2\s+/i.test(clean);
        if (rawCh > 22) {
            clean = `II Kings ${rawCh - 22}${rest}`;
        } else if (isExplicitSecond) {
            clean = `II Kings ${rawCh}${rest}`;
        } else {
            clean = `I Kings ${rawCh}${rest}`;
        }
    }

    const match = clean.match(/^((?:I{1,2}\s+|[12]\s+)?[A-Za-zÀ-ÿ\s]+?)\s+(\d.*)$/);
    if (!match) return null;

    const bookName = match[1].trim();
    const rest = match[2].trim();
    const bookId = BOLLS_BOOK_IDS[bookName];
    if (!bookId) return null;

    const parts = rest.split(',');
    const ranges = [];
    let currentChapter = null;

    for (const part of parts) {
        const trimmedPart = part.trim();
        if (!trimmedPart) continue;

        const rangeParts = trimmedPart.split('-');
        if (rangeParts.length === 1) {
            const subparts = rangeParts[0].split(':');
            if (subparts.length > 1) {
                currentChapter = parseInt(subparts[0], 10);
                const verse = parseInt(subparts[1], 10);
                ranges.push({ startChapter: currentChapter, startVerse: verse, endChapter: currentChapter, endVerse: verse });
            } else {
                const val = parseInt(subparts[0], 10);
                if (currentChapter !== null) {
                    ranges.push({ startChapter: currentChapter, startVerse: val, endChapter: currentChapter, endVerse: val });
                } else {
                    currentChapter = val;
                    ranges.push({ startChapter: currentChapter, startVerse: null, endChapter: currentChapter, endVerse: null });
                }
            }
        } else {
            const startRaw = rangeParts[0].trim();
            const endRaw = rangeParts[1].trim();

            const startParts = startRaw.split(':');
            let startChapter, startVerse;
            if (startParts.length > 1) {
                currentChapter = parseInt(startParts[0], 10);
                startChapter = currentChapter;
                startVerse = parseInt(startParts[1], 10);
            } else {
                startChapter = currentChapter;
                startVerse = parseInt(startParts[0], 10);
            }

            const endParts = endRaw.split(':');
            let endChapter, endVerse;
            if (endParts.length > 1) {
                endChapter = parseInt(endParts[0], 10);
                endVerse = parseInt(endParts[1], 10);
                currentChapter = endChapter;
            } else {
                endChapter = startChapter;
                endVerse = parseInt(endRaw, 10);
            }

            ranges.push({ startChapter, startVerse, endChapter, endVerse });
        }
    }

    return { bookId, bookName, ranges };
}

async function fetchBibleVerses(parsed, refKey) {
    const cacheKey = 'bible_cache_' + (refKey || '').replace(/\s+/g, '_');
    const cached = localStorage.getItem(cacheKey) || sessionStorage.getItem(cacheKey);
    const preferredVersion = localStorage.getItem('preferred_bible_version');
    if (cached) {
        try {
            const parsedCache = JSON.parse(cached);
            const ptTranslations = ['NVT', 'OL', 'AA'];
            if (parsedCache && parsedCache.verses && parsedCache.verses.length > 0) {
                if (preferredVersion) {
                    if (parsedCache.translation === preferredVersion) return { ...parsedCache, isCache: true };
                } else if (ptTranslations.includes(parsedCache.translation)) {
                    return { ...parsedCache, isCache: true };
                }
            }
            localStorage.removeItem(cacheKey);
            sessionStorage.removeItem(cacheKey);
        } catch (e) { }
    }

    const { bookId, ranges } = parsed;
    const allVerses = [];
    const chapterCache = {};
    const diagnosticLog = [];

    async function getChapterData(ch) {
        if (chapterCache[ch]) return chapterCache[ch];

        let actualBookId = bookId;
        let actualCh = ch;

        if (actualBookId === 13 && actualCh > 29) { actualBookId = 14; actualCh = actualCh - 29; }
        else if (actualBookId === 9 && actualCh > 31) { actualBookId = 10; actualCh = actualCh - 31; }
        else if (actualBookId === 11 && actualCh > 22) { actualBookId = 12; actualCh = actualCh - 22; }
        else if (actualBookId === 15 && actualCh > 10) { actualBookId = 16; actualCh = actualCh - 10; }

        let translations = ['NVT', 'OL', 'AA'];
        if (preferredVersion && translations.includes(preferredVersion)) {
            translations = [preferredVersion];
        }
        const fetchPromise = (trans) => new Promise(async (resolve, reject) => {
            const url = `https://bolls.life/get-chapter/${trans}/${actualBookId}/${actualCh}/`;
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 8000);
            const startTime = performance.now();
            try {
                const res = await fetch(url, { signal: ctrl.signal });
                const duration = Math.round(performance.now() - startTime);
                clearTimeout(tid);

                diagnosticLog.push({
                    endpoint: 'Bolls.life', translation: trans, url: url,
                    status: res.status, statusText: res.statusText,
                    durationMs: duration, success: res.ok, error: res.ok ? null : `HTTP Status ${res.status}`
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        resolve({ data, trans });
                        return;
                    }
                    reject(new Error(`Dados vazios para ${trans}`));
                    return;
                }
                reject(new Error(`HTTP ${res.status} para ${trans}`));
            } catch (e) {
                const duration = Math.round(performance.now() - startTime);
                clearTimeout(tid);
                diagnosticLog.push({
                    endpoint: 'Bolls.life', translation: trans, url: url,
                    status: 0, statusText: 'Network Exception/Timeout',
                    durationMs: duration, success: false, error: e.name === 'AbortError' ? 'Timeout (8000ms)' : e.message
                });
                reject(e);
            }
        });

        try {
            const result = await Promise.any(translations.map(t => fetchPromise(t)));
            chapterCache[ch] = result;
            window.lastReadingDiagnostic = diagnosticLog;
            return result;
        } catch (err) {
            window.lastReadingDiagnostic = diagnosticLog;
            throw new Error('Não foi possível carregar o capítulo de nenhum dos servidores.');
        }
    }

    let chosenTranslation = '';
    for (const range of ranges) {
        const { startChapter, startVerse, endChapter, endVerse } = range;
        for (let ch = startChapter; ch <= endChapter; ch++) {
            const { data, trans } = await getChapterData(ch);
            chosenTranslation = trans;
            for (const v of data) {
                const vNum = v.verse;
                if (ch === startChapter && startVerse !== null && vNum < startVerse) continue;
                if (ch === endChapter && endVerse !== null && vNum > endVerse) continue;

                allVerses.push({ chapter: ch, verse: vNum, text: cleanText(v.text) });
            }
        }
    }

    const payload = { verses: allVerses, translation: chosenTranslation, isCache: false };
    if (allVerses.length > 0) {
        try {
            localStorage.setItem(cacheKey, JSON.stringify(payload));
        } catch (e) {
            try { sessionStorage.setItem(cacheKey, JSON.stringify(payload)); } catch (e2) { }
        }
    }

    return payload;
}

let infoModalStack = [];

export function openInfoModal(titleText, htmlContent) {
    const modal = document.getElementById('info-modal');
    const titleEl = document.getElementById('info-modal-title');
    const bodyEl = document.getElementById('info-modal-body');
    const backBtn = document.getElementById('back-info-btn');

    if (!modal || !titleEl || !bodyEl) return;

    infoModalStack = [{ title: titleText, html: htmlContent }];
    if (backBtn) backBtn.style.display = 'none';

    titleEl.textContent = titleText;
    bodyEl.innerHTML = htmlContent;
    bodyEl.scrollTop = 0;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    if (!history.state || !history.state.modalOpen) history.pushState({ modalOpen: true }, '');
    sessionStorage.setItem('openInfoModalTitle', titleText);
}

export function pushInfoModalView(titleText, htmlContent) {
    const modal = document.getElementById('info-modal');
    const titleEl = document.getElementById('info-modal-title');
    const bodyEl = document.getElementById('info-modal-body');
    const backBtn = document.getElementById('back-info-btn');

    if (!modal || !titleEl || !bodyEl) return;

    infoModalStack.push({ title: titleText, html: htmlContent });
    if (backBtn) backBtn.style.display = 'flex';

    titleEl.textContent = titleText;
    bodyEl.innerHTML = htmlContent;
    bodyEl.scrollTop = 0;

    sessionStorage.setItem('openInfoModalTitle', titleText);
}

export function popInfoModalView() {
    if (infoModalStack.length <= 1) {
        closeModalSafely(document.getElementById('info-modal'));
        return;
    }

    infoModalStack.pop();
    const prev = infoModalStack[infoModalStack.length - 1];
    const titleEl = document.getElementById('info-modal-title');
    const bodyEl = document.getElementById('info-modal-body');
    const backBtn = document.getElementById('back-info-btn');

    if (titleEl && bodyEl && prev) {
        titleEl.textContent = prev.title;
        bodyEl.innerHTML = prev.html;
        bodyEl.scrollTop = 0;
        sessionStorage.setItem('openInfoModalTitle', prev.title);
    }

    if (backBtn) {
        backBtn.style.display = infoModalStack.length > 1 ? 'flex' : 'none';
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
        if (infoModalStack.length > 1) {
            popInfoModalView();
            return;
        }
        const modals = document.querySelectorAll('.modal-overlay');
        let anyClosed = false;
        modals.forEach(m => {
            if (m && m.style.display !== 'none' && m.style.display !== '') {
                m.style.display = 'none';
                m.classList.remove('is-closing');
                anyClosed = true;
            }
        });
        if (anyClosed) {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open', 'story-open');
            sessionStorage.removeItem('openReadingModalRef');
            sessionStorage.removeItem('openReadingModalTitle');
            sessionStorage.removeItem('openLocationModal');
            sessionStorage.removeItem('openInfoModalTitle');
            infoModalStack = [];
            const backBtn = document.getElementById('back-info-btn');
            if (backBtn) backBtn.style.display = 'none';
        }
    });
}

export function closeModalSafely(modal, skipHistory = false) {
    if (!modal) return;
    if (modal.style.display === 'none' || modal.style.display === '') return;
    if (modal.classList.contains('is-closing')) return;

    trackMicroAction('modal_close', { modalId: modal.id });

    const content = modal.querySelector('.modal-content, .reading-modal-content');

    modal.classList.add('is-closing');
    if (content) {
        content.classList.add('is-closing');
    }

    sessionStorage.removeItem('openReadingModalRef');
    sessionStorage.removeItem('openReadingModalTitle');
    sessionStorage.removeItem('openLocationModal');
    sessionStorage.removeItem('openInfoModalTitle');
    infoModalStack = [];
    const backBtn = document.getElementById('back-info-btn');
    if (backBtn) backBtn.style.display = 'none';

    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('is-closing');
        modal.style.backgroundColor = '';
        if (content) {
            content.classList.remove('is-closing');
            content.style.transform = '';
            content.style.transition = '';
        }
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
        if (!skipHistory && history.state && (
            history.state.modalOpen ||
            history.state.zmanimOpen ||
            history.state.berachotOpen ||
            history.state.tehilimOpen ||
            history.state.calendarOpen ||
            history.state.converterOpen ||
            history.state.pirkeiOpen ||
            history.state.talmudOpen ||
            history.state.mishnaOpen ||
            history.state.settingsOpen ||
            history.state.shabbatOpen
        )) {
            try {
                history.back();
            } catch (e) {}
        }
    }, 200);
}

export function closeModalDirectly(modal) {
    if (!modal) return;
    modal.style.display = 'none';
    modal.classList.remove('is-closing');
    modal.style.backgroundColor = '';
    const content = modal.querySelector('.modal-content, .reading-modal-content');
    if (content) {
        content.classList.remove('is-closing');
        content.style.transform = '';
        content.style.transition = '';
    }
    sessionStorage.removeItem('openReadingModalRef');
    sessionStorage.removeItem('openReadingModalTitle');
    sessionStorage.removeItem('openLocationModal');
    sessionStorage.removeItem('openInfoModalTitle');
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
}

export function closeOtherModalsOnDesktop(exceptModalId = null) {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        document.querySelectorAll('.modal-overlay').forEach(m => {
            if (m.id !== exceptModalId && m.style.display && m.style.display !== 'none') {
                closeModalDirectly(m);
            }
        });
    }
}

export function initModalGestures() {
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
        const content = overlay.querySelector('.modal-content, .reading-modal-content');
        if (!content || overlay.dataset.gestureBound) return;
        overlay.dataset.gestureBound = 'true';

        let startY = 0;
        let startX = 0;
        let startTime = 0;
        let isDraggingDown = false;
        let canDragFromHere = false;
        let scrollableBody = null;

        const onTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            const touch = e.touches[0];
            startY = touch.clientY;
            startX = touch.clientX;
            startTime = Date.now();
            isDraggingDown = false;

            scrollableBody = content.querySelector('.reading-body') || content.querySelector('.modal-body');
            const atScrollTop = !scrollableBody || scrollableBody.scrollTop <= 0;
            const isHeaderZone = !!e.target.closest('.ios-sheet-grabber, .reading-header, .search-container, .modal-close-btn');

            canDragFromHere = isHeaderZone || atScrollTop;
        };

        let rafId = null;
        let pendingDy = 0;

        const onTouchMove = (e) => {
            if (e.touches.length !== 1 || !canDragFromHere) return;
            const touch = e.touches[0];
            const dy = touch.clientY - startY;
            const dx = touch.clientX - startX;

            if (!isDraggingDown) {
                const atScrollTop = !scrollableBody || scrollableBody.scrollTop <= 0;
                if (dy > 6 && dy > Math.abs(dx) * 1.1 && atScrollTop) {
                    isDraggingDown = true;
                    content.style.animation = 'none';
                    content.style.transition = 'none';
                }
            }

            if (isDraggingDown && dy > 0) {
                if (e.cancelable) {
                    e.preventDefault();
                }
                pendingDy = dy;
                if (!rafId) {
                    rafId = requestAnimationFrame(() => {
                        content.style.transform = `translate3d(0, ${pendingDy}px, 0)`;
                        overlay.style.backgroundColor = `rgba(0, 0, 0, ${Math.max(0.15, 0.65 - (pendingDy / 400) * 0.5)})`;
                        rafId = null;
                    });
                }
            }
        };

        const onTouchEnd = (e) => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            if (!isDraggingDown) {
                canDragFromHere = false;
                return;
            }
            const touch = e.changedTouches[0];
            const dy = touch.clientY - startY;
            const elapsed = Date.now() - startTime;
            const velocity = dy / (elapsed || 1);

            if (dy > 60 || velocity > 0.3) {
                closeModalSafely(overlay);
            } else {
                content.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
                content.style.transform = 'translate3d(0, 0, 0)';
                overlay.style.backgroundColor = '';
            }
            isDraggingDown = false;
            canDragFromHere = false;
        };

        const onTouchCancel = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            if (isDraggingDown) {
                content.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
                content.style.transform = 'translate3d(0, 0, 0)';
                overlay.style.backgroundColor = '';
                isDraggingDown = false;
            }
            canDragFromHere = false;
        };

        content.addEventListener('touchstart', onTouchStart, { passive: true });
        content.addEventListener('touchmove', onTouchMove, { passive: false });
        content.addEventListener('touchend', onTouchEnd, { passive: true });
        content.addEventListener('touchcancel', onTouchCancel, { passive: true });
    });
}

if (typeof window !== 'undefined') {
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModalSafely(e.target);
        }
    });
}

function getSkeletonHTML() {
    return `
        <div class="reading-loading-skeleton" style="display: flex; flex-direction: column; gap: 16px; margin-top: 10px;">
            <div class="skeleton-card" style="padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);">
                <div class="skeleton-line" style="width: 100%; height: 12px; border-radius: 4px; margin-bottom: 8px;"></div>
                <div class="skeleton-line" style="width: 75%; height: 12px; border-radius: 4px; margin-bottom: 8px;"></div>
                <div class="skeleton-line" style="width: 60%; height: 12px; border-radius: 4px;"></div>
            </div>
            <div class="skeleton-card" style="padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);">
                <div class="skeleton-line" style="width: 95%; height: 12px; border-radius: 4px; margin-bottom: 8px;"></div>
                <div class="skeleton-line" style="width: 85%; height: 12px; border-radius: 4px; margin-bottom: 8px;"></div>
                <div class="skeleton-line" style="width: 40%; height: 12px; border-radius: 4px;"></div>
            </div>
        </div>
    `;
}

export async function openReadingModal(ref, cardTitle) {
    const modal = document.getElementById('reading-modal');
    const titleEl = document.getElementById('reading-modal-title');
    const bodyEl = document.getElementById('reading-modal-body');
    if (!modal || !titleEl || !bodyEl) return;

    trackMicroAction('modal_open', { modal: 'reading', ref, title: cardTitle });

    closeOtherModalsOnDesktop('reading-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (!history.state || !history.state.modalOpen) history.pushState({ modalOpen: true }, '');
    sessionStorage.setItem('openReadingModalRef', ref);
    sessionStorage.setItem('openReadingModalTitle', cardTitle);

    titleEl.textContent = toHebrewBookName(cardTitle);
    bodyEl.innerHTML = getSkeletonHTML();

    await new Promise(resolve => setTimeout(resolve, 250));

    try {
        const parsed = parseRef(ref);
        if (!parsed) throw new Error('Referência não reconhecida.');
        const { verses, translation, isCache } = await fetchBibleVerses(parsed, ref);
        if (verses.length === 0) throw new Error('Nenhum texto encontrado para esta referência.');

        titleEl.textContent = toHebrewBookName(cardTitle);

        if (isCache) {
            // Log successful scripture retrieval from local browser cache
            console.log(`[CACHE] Reading served from local cache: ${translation} - ${ref}`);
        } else {
            // Log successful scripture retrieval from remote Bible API
            console.log(`[API] Reading served from remote API: ${translation} - ${ref}`);
        }

        let html = '<div class="verses-container">';
        for (const v of verses) {
            const displayNum = `${v.chapter}:${v.verse}`;
            html += `
                <div class="legend-card" style="align-items: flex-start; margin: 0;">
                    <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px;">
                        <div class="verse-text" style="padding-right: 0; text-align: left; font-size: var(--font-size-sm); white-space: normal; overflow: visible; text-overflow: clip;">${displayNum} ${v.text}</div>
                    </div>
                </div>
            `;
        }
        html += '</div>';

        bodyEl.innerHTML = html;
        bodyEl.scrollTop = 0;

    } catch (err) {
        // Log structured critical error diagnostics when scripture retrieval fails
        console.group("[CRITICAL ERROR] Scripture Reader Fetch Failure");
        console.error("Technical Context Summary:", {
            requestedReference: ref,
            bookOriginal: cardTitle,
            bookHebrew: toHebrewBookName(cardTitle),
            navigatorOnline: navigator.onLine,
            systemTimestamp: new Date().toISOString(),
            clientUserAgent: navigator.userAgent,
            exceptionMessage: err.message,
            exceptionStack: err.stack
        });
        if (window.lastReadingDiagnostic) {
            console.table(window.lastReadingDiagnostic);
        }
        console.groupEnd();

        bodyEl.innerHTML = `
            <div class="reading-error">
                <span class="reading-error-title">Conexão Indisponível</span>
                <span class="reading-error-message">Não foi possível carregar o texto sagrado no momento. Verifique sua conexão.</span>
                <small class="reading-error-detail">Detalhe técnico: ${escapeHtml(err.message)}</small>
            </div>
        `;
    }
}

export function openLocationModal() {
    const modal = document.getElementById('location-modal');
    if (!modal) return;

    trackMicroAction('modal_open', { modal: 'location' });
    closeOtherModalsOnDesktop('location-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (!history.state || !history.state.modalOpen) history.pushState({ modalOpen: true }, '');
    sessionStorage.setItem('openLocationModal', 'true');

    const readingBody = modal.querySelector('.reading-body');
    if (readingBody) readingBody.style.display = 'none';

    let skeletonContainer = modal.querySelector('.location-skeleton-container');
    if (!skeletonContainer) {
        skeletonContainer = document.createElement('div');
        skeletonContainer.className = 'location-skeleton-container';
        const modalContent = modal.querySelector('.modal-content, .reading-modal-content') || modal;
        modalContent.appendChild(skeletonContainer);
    }
    skeletonContainer.innerHTML = getSkeletonHTML();
    skeletonContainer.style.display = 'block';

    setTimeout(() => {
        if (skeletonContainer) skeletonContainer.style.display = 'none';
        if (readingBody) readingBody.style.display = 'block';

        const searchInput = document.getElementById('location-search-input');
        if (searchInput) {
            searchInput.value = '';
            renderSuggestions([]);
            fetchNearbyLocations();
            setTimeout(() => searchInput?.focus?.(), 100);
        }
    }, 150);
}

export function openPremiumGatedModal(featureName, readingTitle, refToOpen) {
    const modal = document.getElementById('info-modal');
    const titleEl = document.getElementById('info-modal-title');
    const bodyEl = document.getElementById('info-modal-body');

    if (!modal || !titleEl || !bodyEl) return;

    titleEl.textContent = 'Recurso Premium';
    bodyEl.innerHTML = `
        <div class="levels-container" style="display: flex; flex-direction: column; width: 100%;">
            <div class="info-modal-card">
                <div class="info-modal-value" style="font-size: var(--font-size-sm); line-height: 1.6; color: var(--text-primary); text-align: left; white-space: normal;">
                    A leitura de <strong>${escapeHtml(readingTitle)}</strong> (${escapeHtml(featureName)}) é um recurso exclusivo dos membros do Plano Premium.
                </div>
            </div>

            <div class="info-modal-card">
                <div class="info-modal-value" style="font-size: var(--font-size-sm); line-height: 1.6; color: var(--text-primary); text-align: left; white-space: normal;">
                    Desbloqueie todos os livros proféticos, salmos devocionais, bússola Mizrach e ferramentas avançadas.
                </div>
            </div>

            <div style="margin-top: 8px; padding: 4px 2px;">
                <button class="converter-action-btn" id="activate-premium-from-modal-btn" style="width: 100%; cursor: pointer;">
                    <i class="${ICONS.crown}" data-icon="crown" style="margin-right: 6px;"></i>
                    <span>Ativar Agora</span>
                </button>
            </div>
        </div>
    `;

    document.getElementById('activate-premium-from-modal-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        setUserPremium(true);
        closeModalDirectly(modal);
        if (refToOpen && readingTitle) {
            openReadingModal(refToOpen, readingTitle);
        } else {
            alert('Plano Premium ativado com sucesso! Todos os recursos foram desbloqueados.');
        }
    });

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    if (!history.state || !history.state.modalOpen) {
        history.pushState({ modalOpen: true }, '');
    }
}

export function initModals(updateDashboardCallback) {
    updateDashboardCallbackGlobal = updateDashboardCallback;

    document.addEventListener('click', (event) => {
        // 1. Trata cartões de informação (.info-trigger) - tanto fora quanto dentro do modal
        const infoCard = event.target.closest('.info-trigger');
        if (infoCard && !infoCard.classList.contains('not-ready')) {
            const titleText = infoCard.getAttribute('data-info-title') || '-';
            const htmlContent = infoCard.getAttribute('data-info-html') || '';
            if (htmlContent) {
                const infoModal = document.getElementById('info-modal');
                const isInsideInfoModal = !!infoCard.closest('#info-modal');
                if (isInsideInfoModal && infoModal && infoModal.style.display !== 'none') {
                    pushInfoModalView(titleText, htmlContent);
                } else {
                    closeOtherModalsOnDesktop();
                    openInfoModal(titleText, htmlContent);
                }
                return;
            }
        }

        // 2. Ignora cliques que ocorram dentro de qualquer modal já aberto
        if (event.target.closest('.modal-overlay')) return;

        // Ignora cliques nos cartões de Ferramentas Sagradas (gerenciados diretamente por toolsView)
        if (event.target.closest('#view-tools') || event.target.closest('#view-premium')) return;

        // Handle dashboard interactive cards
        const card = event.target.closest('.event-card, .settings-card, .location-trigger-btn, .app-location-badge, #card-local-vigente, #desktop-local-btn');
        if (!card) return;

        closeOtherModalsOnDesktop();

        if (card.classList.contains('location-trigger-btn') || card.classList.contains('app-location-badge') || card.id === 'card-local-vigente' || card.id === 'desktop-local-btn') {
            if (card.classList.contains('not-ready')) return;
            openLocationModal();
            return;
        }

        if (card.id === 'card-torah-wrapper' || card.id === 'card-haftara-wrapper' || card.id === 'card-ketuvim-wrapper') {
            const titleEl = card.querySelector('.card-title, .settings-card-title');
            const titleText = titleEl ? titleEl.textContent.trim() : '';
            if (!titleText || titleText === '-') return;

            const ref = card.getAttribute('data-ref');
            if (ref) openReadingModal(ref, titleText);
            return;
        }
    });

    document.getElementById('back-info-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        popInfoModalView();
    });

    document.getElementById('close-reading-btn')?.addEventListener('click', () => {
        closeModalSafely(document.getElementById('reading-modal'));
        sessionStorage.removeItem('openReadingModalRef');
        sessionStorage.removeItem('openReadingModalTitle');
    });

    document.getElementById('close-info-btn')?.addEventListener('click', () => {
        const m = document.getElementById('info-modal');
        if (m) closeModalSafely(m);
        sessionStorage.removeItem('openInfoModalTitle');
    });

    document.getElementById('close-location-btn')?.addEventListener('click', () => {
        const m = document.getElementById('location-modal');
        if (m) closeModalSafely(m);
        sessionStorage.removeItem('openLocationModal');
    });

    const searchInput = document.getElementById('location-search-input');
    let searchTimeout;

    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(searchTimeout);

        if (query.length < 3) {
            renderSuggestions([]);
            return;
        }

        // Log location search action query
        console.log(`[ACTION] Location query search: "${query}"`);

        searchTimeout = setTimeout(async () => {
            const currentQuery = e.target.value.trim();
            if (currentQuery !== query) return;

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=15&accept-language=pt&email=contato@yisraeldate.app`);
                if (!res.ok) {
                    const suggestionsList = document.getElementById('location-suggestions');
                    if (suggestionsList) {
                        suggestionsList.innerHTML = `
                            <li class="reading-error" style="margin: 8px 0; list-style: none;">
                                <span class="reading-error-title">Serviço Indisponível</span>
                                <span class="reading-error-message">Não foi possível consultar os servidores de localização.</span>
                            </li>
                        `;
                    }
                    return;
                }
                const data = await res.json();

                const afterQuery = document.getElementById('location-search-input')?.value.trim();
                if (afterQuery !== query) return;

                if (data.length === 0) {
                    const suggestionsList = document.getElementById('location-suggestions');
                    if (suggestionsList) {
                        suggestionsList.innerHTML = `
                            <li class="reading-error" style="margin: 8px 0; list-style: none; background: var(--hover-gradient); border-color: var(--card-border-color); box-shadow: none;">
                                <span class="reading-error-title" style="color: var(--text-primary);">Nenhum Resultado</span>
                                <span class="reading-error-message" style="color: var(--text-muted);">Não foi encontrada nenhuma localidade com este nome.</span>
                            </li>
                        `;
                    }
                    return;
                }

                data.sort((a, b) => (b.importance || 0) - (a.importance || 0));

                const seenDisplayNames = new Set();
                const finalResults = [];

                data.forEach(item => {
                    if (item.type === 'country' || item.class === 'country' || item.addresstype === 'country') return;

                    const parts = item.display_name.split(',').map(s => s.trim());
                    if (parts.length <= 1) return;

                    let locality = parts[0];
                    if (item.address) {
                        locality = item.address.village || item.address.town || item.address.city || item.address.municipality || item.address.county || item.address.suburb || item.address.hamlet || parts[0];
                    }

                    const country = item.address && item.address.country ? item.address.country : parts[parts.length - 1];
                    const displayText = `${locality}, ${country}`;

                    if (seenDisplayNames.has(displayText)) return;
                    seenDisplayNames.add(displayText);
                    finalResults.push({ item, displayText });
                });

                renderSuggestions(finalResults);
            } catch (err) {
                // Log network or JSON parsing error from Nominatim search API
                console.error('Location Search API error:', err);
                const suggestionsList = document.getElementById('location-suggestions');
                if (suggestionsList) {
                    suggestionsList.innerHTML = `
                        <li class="reading-error" style="margin: 8px 0; list-style: none;">
                            <span class="reading-error-title">Conexão Indisponível</span>
                            <span class="reading-error-message">Verifique a sua ligação à internet para pesquisar cidades.</span>
                        </li>
                    `;
                }
            }
        }, 260);
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const overlay = btn.closest('.modal-overlay');
            if (overlay) closeModalSafely(overlay);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                if (modal && modal.style.display !== 'none' && modal.style.display !== '') {
                    closeModalSafely(modal);
                }
            });
        }
        if (e.key === 'Enter' || e.key === ' ') {
            const focusable = document.activeElement;
            if (focusable && focusable.classList.contains('event-card')) {
                if (focusable.classList.contains('not-ready')) return;
                e.preventDefault();
                focusable.click();
            }
        }
    });

    initModalObserver();
    initModalGestures();
}

export function reopenModals() {
    if (sessionStorage.getItem('openLocationModal')) {
        document.getElementById('card-local-vigente')?.click();
    } else if (sessionStorage.getItem('openInfoModalTitle')) {
        const title = sessionStorage.getItem('openInfoModalTitle');
        const card = document.querySelector(`.event-card[data-info-title="${title}"]`);
        if (card) {
            card.click();
        } else {
            sessionStorage.removeItem('openInfoModalTitle');
        }
    } else if (sessionStorage.getItem('openReadingModalRef') && sessionStorage.getItem('openReadingModalTitle')) {
        openReadingModal(sessionStorage.getItem('openReadingModalRef'), sessionStorage.getItem('openReadingModalTitle'));
    }
}

// Developer Console Helpers for Bible translation switching
if (typeof window !== 'undefined') {
    window.setBibleVersion = (version) => {
        if (!version) {
            window.listBibleVersions();
            return;
        }
        const target = String(version).toUpperCase().trim();
        const validMap = {
            'NVT': 'NVT (Nova Versão Transformadora - PT-BR)',
            'OL': 'OL (O Livro - PT-PT)',
            'AA': 'AA (João Ferreira de Almeida Atualizada - PT-BR)'
        };
        if (validMap[target]) {
            localStorage.setItem('preferred_bible_version', target);
            try {
                [localStorage, sessionStorage].forEach(storage => {
                    if (!storage) return;
                    for (let i = storage.length - 1; i >= 0; i--) {
                        const key = storage.key(i);
                        if (key && key.startsWith('bible_cache_')) storage.removeItem(key);
                    }
                });
            } catch (e) { }
            console.log(`[ACTION] Bible translation version set to: ${target}`);
        } else {
            console.warn(`[ACTION] Invalid Bible version requested: "${version}". Supported versions: NVT, OL, AA`);
            window.listBibleVersions();
        }
    };

    window.resetBibleVersion = () => {
        localStorage.removeItem('preferred_bible_version');
        try {
            [localStorage, sessionStorage].forEach(storage => {
                if (!storage) return;
                for (let i = storage.length - 1; i >= 0; i--) {
                    const key = storage.key(i);
                    if (key && key.startsWith('bible_cache_')) storage.removeItem(key);
                }
            });
        } catch (e) { }
        console.log('[ACTION] Bible translation version reset to default (NVT)');
    };

    window.listBibleVersions = () => {
        console.log('[ACTION] Listing available Bible translation versions:');
        console.table([
            { Version: 'NVT', Name: 'Nova Versão Transformadora', Language: 'PT-BR', Command: "setBibleVersion('NVT')" },
            { Version: 'OL', Name: 'O Livro', Language: 'PT-PT', Command: "setBibleVersion('OL')" },
            { Version: 'AA', Name: 'Almeida Atualizada', Language: 'PT-BR', Command: "setBibleVersion('AA')" }
        ]);
    };
}