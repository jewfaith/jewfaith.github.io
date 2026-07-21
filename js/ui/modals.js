import { startTimers, stopTimers } from './timers.js';
import { state } from '../state.js';
import { applyEstimatedTheme } from './theme.js';

// Sanitize strings before innerHTML to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

let updateDashboardCallbackGlobal = null;
let nearbyLocationsCache = [];
let isFetchingNearby = false;

// Purge any legacy cached Bible verses that contain orphaned artifacts or outdated versions
(function purgeLegacyBibleCache() {
    try {
        const ptTranslations = ['NVT', 'OL'];
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
                    } catch(e) {
                        storage.removeItem(key);
                    }
                }
            }
        });
    } catch(e) {}
})();

function getActiveCoords() {
    const exactLocRaw = localStorage.getItem('exactLocation');
    if (exactLocRaw) {
        try {
            return JSON.parse(exactLocRaw);
        } catch (e) {}
    }
    if (state.userLocation) {
        return state.userLocation;
    }
    // Fallback to Jerusalem
    return { lat: 31.7683, lon: 35.2137 };
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

        const latDelta = 0.4; // Reduced to ~44km radius to prevent distant big cities from dominating
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

                for (const item of data) {
                    // Filter out streets, POIs, etc. Only allow places and administrative boundaries
                    if (item.class !== 'place' && item.class !== 'boundary') {
                        continue;
                    }
                    // Filter out countries and large states
                    if (['country', 'state', 'region'].includes(item.type) || ['country', 'state'].includes(item.addresstype)) {
                        continue;
                    }
                    const parts = item.display_name.split(',').map(s => s.trim());
                    if (parts.length <= 1) {
                        continue;
                    }
                    
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

                    uniqueItems.push({
                        item,
                        displayText,
                        distSq
                    });
                }
            } catch (e) {
                console.error(`Error querying nearby locations for type ${q}:`, e);
            }

            if (uniqueItems.length < 12) {
                await new Promise(resolve => setTimeout(resolve, 250));
            }
        }

        // Calculate actual distance in km and sort
        uniqueItems.forEach(u => {
            u.distanceKm = Math.sqrt(u.distSq) * 111;
        });
        uniqueItems.sort((a, b) => a.distanceKm - b.distanceKm);

        // Group into 5km interval bins (0-5km, 5-10km, etc.)
        const binnedItems = [];
        const usedBins = new Set();
        
        for (const item of uniqueItems) {
            const bin = Math.floor(item.distanceKm / 5);
            if (!usedBins.has(bin)) {
                usedBins.add(bin);
                binnedItems.push(item);
            }
        }

        // Fill remaining slots if we have fewer than 15 items to keep cache warm
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
        console.error('Error fetching nearby locations:', err);
    } finally {
        isFetchingNearby = false;
        const searchInput = document.getElementById('location-search-input');
        if (searchInput && searchInput.value.trim().length < 3) {
            renderSuggestions([]);
        }
    }
}

function renderSuggestions(results) {
    const suggestionsList = document.getElementById('location-suggestions');
    if (!suggestionsList) return;

    suggestionsList.innerHTML = '';
    const finalItems = [];

    const searchInput = document.getElementById('location-search-input');
    const isSearching = searchInput && searchInput.value.trim().length >= 3;

    // Search results logic

    // 2. Add search results (up to 7 items if searching, or 6 if not searching)
    const maxSearchResults = isSearching ? 7 : 6;
    const searchItems = results.slice(0, maxSearchResults);
    finalItems.push(...searchItems);

    // 3. Fill the rest with nearby locations (at least 3 items, up to 10 items total)
    const neededNearby = Math.max(3, 10 - finalItems.length);
    const seenNames = new Set(finalItems.map(r => r.displayText));
    
    let addedCount = 0;
    for (const nearby of nearbyLocationsCache) {
        if (addedCount >= neededNearby) break;
        if (!seenNames.has(nearby.displayText)) {
            seenNames.add(nearby.displayText);
            finalItems.push(nearby);
            addedCount++;
        }
    }

    // 4. Render slots
    finalItems.forEach(resItem => {
        const li = document.createElement('li');
        li.className = 'legend-card';
        
        const parts = resItem.displayText.split(',').map(s => s.trim());
        const primaryText = parts[0];
        const secondaryText = parts.slice(1, 4).join(', ');

        li.style.cssText = "display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-radius: 14px; background: rgba(255, 255, 255, 0.025); border: 1px solid var(--card-border-color); margin-bottom: 8px; box-sizing: border-box; cursor: pointer; transition: background 0.2s ease, border-color 0.2s ease;";
        li.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
                <div style="width: 34px; height: 34px; border-radius: 10px; background: var(--accent-bg); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(255, 255, 255, 0.06);">
                    <i class="fa-solid fa-location-dot" style="color: var(--accent-color); font-size: 14px;"></i>
                </div>
                <div style="display: flex; flex-direction: column; text-align: left; min-width: 0; flex: 1;">
                    <span style="font-size: var(--font-size-base); font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(primaryText)}</span>
                    <span style="font-size: var(--font-size-xs); color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(secondaryText) || 'Localidade'}</span>
                </div>
            </div>
        `;

        li.addEventListener('click', () => {
            if (resItem.isCurrent) {
                console.log('[ACTION] Localização Automática');
                localStorage.removeItem('exactLocation');
            } else {
                const lat = parseFloat(resItem.item.lat);
                const lon = parseFloat(resItem.item.lon);
                const isIl = resItem.item.address && (resItem.item.address.country_code === 'il' || resItem.item.address.country === 'Israel');
                const tz = isIl ? 'Asia/Jerusalem' : Intl.DateTimeFormat().resolvedOptions().timeZone;
                console.log(`[ACTION] ${resItem.displayText}`);
                localStorage.setItem('exactLocation', JSON.stringify({ 
                    lat, 
                    lon, 
                    name: resItem.displayText,
                    isIsrael: isIl,
                    tz: tz
                }));
                applyEstimatedTheme(lat, lon);
            }
            
            nearbyLocationsCache = [];

            const modal = document.getElementById('location-modal');
            if (modal) {
                closeModalSafely(modal);
            }

            const searchInput = document.getElementById('location-search-input');
            if (searchInput) searchInput.value = '';

            const localTitle = document.getElementById('card-local');
            if (localTitle) localTitle.textContent = 'Calculando...';

            renderSuggestions([]);

            if (updateDashboardCallbackGlobal) {
                updateDashboardCallbackGlobal();
            }
        });

        suggestionsList.appendChild(li);
    });

    // Pad remaining slots with empty lines if needed
    const remaining = 10 - finalItems.length;
    for (let i = 0; i < remaining; i++) {
        const li = document.createElement('li');
        li.className = 'legend-card';
        li.style.cssText = "opacity: 0.05; pointer-events: none; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 14px; background: rgba(255, 255, 255, 0.025); border: 1px solid var(--card-border-color); margin-bottom: 8px; box-sizing: border-box;";
        li.innerHTML = `
            <div style="width: 34px; height: 34px; border-radius: 10px; background: var(--skeleton-bg); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(255, 255, 255, 0.06);"></div>
            <div style="display: flex; flex-direction: column; text-align: left; min-width: 0; flex: 1; gap: 4px;">
                <div style="width: 60%; height: 16px; background: var(--skeleton-bg); border-radius: 4px;"></div>
                <div style="width: 40%; height: 12px; background: var(--skeleton-bg); border-radius: 4px;"></div>
            </div>
        `;
        suggestionsList.appendChild(li);
    }
}

function checkModalsActive() {
    const overlays = document.querySelectorAll('.modal-overlay');
    let anyActive = false;
    overlays.forEach(overlay => {
        if (overlay.style.display && overlay.style.display !== 'none') {
            anyActive = true;
        }
    });

    const wrapper = document.querySelector('.dashboard-wrapper');
    if (anyActive) {
        document.body.classList.add('modal-open');
        if (wrapper) {
            wrapper.setAttribute('inert', '');
        }
        stopTimers();
    } else {
        document.body.classList.remove('modal-open');
        if (wrapper) {
            wrapper.removeAttribute('inert');
        }
        startTimers();
    }
}

function initModalObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                checkModalsActive();
            }
        });
    });

    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
        observer.observe(overlay, { attributes: true, attributeFilter: ['style'] });
    });

    // Observe body dynamically for new modals to keep it generic and future-proof
    const bodyObserver = new MutationObserver((mutations) => {
        let needsRebind = false;
        mutations.forEach(m => {
            m.addedNodes.forEach(node => {
                if (node.classList && (node.classList.contains('modal-overlay') || node.querySelector('.modal-overlay'))) {
                    needsRebind = true;
                }
            });
        });
        if (needsRebind) {
            observer.disconnect();
            const currentOverlays = document.querySelectorAll('.modal-overlay');
            currentOverlays.forEach(overlay => {
                observer.observe(overlay, { attributes: true, attributeFilter: ['style'] });
            });
            checkModalsActive();
        }
    });

    bodyObserver.observe(document.body, { childList: true, subtree: true });
    checkModalsActive();
}

function cleanText(text) {
    if (!text) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    return (doc.body.textContent || '').trim();
}

// Bolls.life book ID mapping (Old Testament only, 1-39)
const BOLLS_BOOK_IDS = {
    'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
    'Joshua': 6, 'Judges': 7, 'Ruth': 8,
    'I Samuel': 9, 'II Samuel': 10, '1 Samuel': 9, '2 Samuel': 10,
    'I Kings': 11, 'II Kings': 12, '1 Kings': 11, '2 Kings': 12,
    'I Chronicles': 13, 'II Chronicles': 14,
    'Ezra': 15, 'Nehemiah': 16, 'Esther': 17,
    'Job': 18, 'Psalms': 19, 'Proverbs': 20,
    'Ecclesiastes': 21, 'Song of Solomon': 22, 'Song of Songs': 22,
    'Isaiah': 23, 'Jeremiah': 24, 'Lamentations': 25,
    'Ezekiel': 26, 'Daniel': 27,
    'Hosea': 28, 'Joel': 29, 'Amos': 30,
    'Obadiah': 31, 'Jonah': 32, 'Micah': 33,
    'Nahum': 34, 'Habakkuk': 35, 'Zephaniah': 36,
    'Haggai': 37, 'Zechariah': 38, 'Malachi': 39
};

function toHebrewBookName(text) {
    if (!text) return '';
    let result = text;
    const mapping = {
        'Genesis': 'Bereshit',
        'Exodus': 'Shemot',
        'Leviticus': 'Vayikra',
        'Numbers': 'Bamidbar',
        'Deuteronomy': 'Devarim',
        'Joshua': 'Yehoshua',
        'Judges': 'Shoftim',
        'II Samuel': 'II Shmuel',
        'I Samuel': 'I Shmuel',
        '2 Samuel': 'II Shmuel',
        '1 Samuel': 'I Shmuel',
        'II Kings': 'II Melachim',
        'I Kings': 'I Melachim',
        '2 Kings': 'II Melachim',
        '1 Kings': 'I Melachim',
        'Isaiah': 'Yeshayahu',
        'Jeremiah': 'Yirmiyahu',
        'Ezekiel': 'Yechezkel',
        'Hosea': 'Hoshea',
        'Joel': 'Yoel',
        'Amos': 'Amos',
        'Obadiah': 'Ovadia',
        'Jonah': 'Yona',
        'Micah': 'Micha',
        'Nahum': 'Nachum',
        'Habakkuk': 'Chavakuk',
        'Zephaniah': 'Tzefania',
        'Haggai': 'Chagai',
        'Zechariah': 'Zecharia',
        'Malachi': 'Malachi',
        'Psalms': 'Tehilim',
        'Proverbs': 'Mishlei',
        'Job': 'Iyov',
        'Ecclesiastes': 'Kohelet',
        'Ruth': 'Ruth',
        'Esther': 'Esther',
        'Daniel': 'Daniel',
        'Ezra': 'Ezra',
        'Nehemiah': 'Nechemia'
    };
    for (const [eng, heb] of Object.entries(mapping)) {
        result = result.replace(new RegExp(`\\b${eng}\\b`, 'g'), heb);
    }
    return result;
}

/**
 * Parse a Sefaria-style reference into structured data.
 * Examples: "Genesis 12:21-51", "Genesis 12:21-13:5", "Psalms 23", "Ezekiel 1:1-28, 3:12"
 */
function parseRef(ref) {
    const clean = ref.trim();
    // Match book name (may start with I/II/1/2 prefix)
    const match = clean.match(/^((?:I{1,2}\s+|[12]\s+)?[A-Za-z\s]+?)\s+(\d.*)$/);
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
            // Single chapter or single verse: "23" or "12:3"
            const subparts = rangeParts[0].split(':');
            if (subparts.length > 1) {
                currentChapter = parseInt(subparts[0], 10);
                const verse = parseInt(subparts[1], 10);
                ranges.push({
                    startChapter: currentChapter, startVerse: verse,
                    endChapter: currentChapter, endVerse: verse
                });
            } else {
                const val = parseInt(subparts[0], 10);
                if (currentChapter !== null) {
                    // It's a single verse in the current chapter
                    ranges.push({
                        startChapter: currentChapter, startVerse: val,
                        endChapter: currentChapter, endVerse: val
                    });
                } else {
                    // It's a whole chapter
                    currentChapter = val;
                    ranges.push({
                        startChapter: currentChapter, startVerse: null,
                        endChapter: currentChapter, endVerse: null
                    });
                }
            }
        } else {
            // Range: "12:21-51", "12:21-13:5", or "21-25"
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

            ranges.push({
                startChapter, startVerse,
                endChapter, endVerse
            });
        }
    }

    return { bookId, bookName, ranges };
}

/**
 * Fetch verses from Bolls.life API for a parsed reference.
 */
async function fetchBibleVerses(parsed, refKey) {
    const cacheKey = 'bible_cache_' + (refKey || '').replace(/\s+/g, '_');
    const cached = localStorage.getItem(cacheKey) || sessionStorage.getItem(cacheKey);
    const preferredVersion = localStorage.getItem('preferred_bible_version');
    if (cached) {
        try {
            const parsedCache = JSON.parse(cached);
            const ptTranslations = ['NVT', 'OL'];
            if (parsedCache && parsedCache.verses) {
                if (preferredVersion) {
                    if (parsedCache.translation === preferredVersion) return { ...parsedCache, isCache: true };
                } else if (ptTranslations.includes(parsedCache.translation)) {
                    return { ...parsedCache, isCache: true };
                }
            }
            localStorage.removeItem(cacheKey);
            sessionStorage.removeItem(cacheKey);
        } catch(e) {}
    }

    const { bookId, ranges, bookName } = parsed;
    const allVerses = [];
    const chapterCache = {};
    const diagnosticLog = [];

    async function getChapterData(ch) {
        if (chapterCache[ch]) return chapterCache[ch];
        
        let translations = ['NVT', 'OL'];
        if (preferredVersion && ['NVT', 'OL'].includes(preferredVersion)) {
            translations = [preferredVersion];
        }
        const fetchPromise = (trans) => new Promise(async (resolve, reject) => {
            const url = `https://bolls.life/get-chapter/${trans}/${bookId}/${ch}/`;
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 8000);
            const startTime = performance.now();
            try {
                const res = await fetch(url, { signal: ctrl.signal });
                const duration = Math.round(performance.now() - startTime);
                clearTimeout(tid);
                
                diagnosticLog.push({
                    endpoint: 'Bolls.life',
                    translation: trans,
                    url: url,
                    status: res.status,
                    statusText: res.statusText,
                    durationMs: duration,
                    success: res.ok,
                    error: res.ok ? null : `HTTP Status ${res.status}`
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
            } catch(e) {
                const duration = Math.round(performance.now() - startTime);
                clearTimeout(tid);
                
                diagnosticLog.push({
                    endpoint: 'Bolls.life',
                    translation: trans,
                    url: url,
                    status: 0,
                    statusText: 'Network Exception/Timeout',
                    durationMs: duration,
                    success: false,
                    error: e.name === 'AbortError' ? 'Timeout (8000ms)' : e.message
                });
                reject(e);
            }
        });

        try {
            const result = await Promise.any(translations.map(t => fetchPromise(t)));
            chapterCache[ch] = result;
            window.lastReadingDiagnostic = diagnosticLog;
            return result;
        } catch(err) {
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
                // Filter by verse range
                if (ch === startChapter && startVerse !== null && vNum < startVerse) continue;
                if (ch === endChapter && endVerse !== null && vNum > endVerse) continue;

                allVerses.push({
                    chapter: ch,
                    verse: vNum,
                    text: cleanText(v.text)
                });
            }
        }
    }

    const payload = { verses: allVerses, translation: chosenTranslation, isCache: false };
    if (allVerses.length > 0) {
        try {
            localStorage.setItem(cacheKey, JSON.stringify(payload));
        } catch (e) {
            try { sessionStorage.setItem(cacheKey, JSON.stringify(payload)); } catch (e2) {}
        }
    }

    return payload;
}

window.addEventListener('popstate', (e) => {
    const modals = [
        document.getElementById('reading-modal'),
        document.getElementById('location-modal'),
        document.getElementById('info-modal')
    ];
    let anyClosed = false;
    modals.forEach(m => {
        if (m && m.style.display !== 'none' && m.style.display !== '') {
            m.style.display = 'none';
            anyClosed = true;
        }
    });
    if (anyClosed) {
        document.body.style.overflow = '';
        sessionStorage.removeItem('openReadingModalRef');
        sessionStorage.removeItem('openReadingModalTitle');
        sessionStorage.removeItem('openLocationModal');
        sessionStorage.removeItem('openInfoModalTitle');
    }
});

export function closeModalSafely(modal) {
    if (modal && modal.style.display !== 'none' && modal.style.display !== '') {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        sessionStorage.removeItem('openReadingModalRef');
        sessionStorage.removeItem('openReadingModalTitle');
        sessionStorage.removeItem('openLocationModal');
        sessionStorage.removeItem('openInfoModalTitle');
        if (history.state && history.state.modalOpen) {
            history.back();
        }
    }
}

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModalSafely(e.target);
    }
});

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

async function openReadingModal(ref, cardTitle) {
    const modal = document.getElementById('reading-modal');
    const titleEl = document.getElementById('reading-modal-title');
    const bodyEl = document.getElementById('reading-modal-body');
    if (!modal || !titleEl || !bodyEl) return;

    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (!history.state || !history.state.modalOpen) history.pushState({ modalOpen: true }, '');
    sessionStorage.setItem('openReadingModalRef', ref);
    sessionStorage.setItem('openReadingModalTitle', cardTitle);

    // Set title
    titleEl.textContent = toHebrewBookName(cardTitle);

    // Set loading state (Skeleton loader for a professional look)
    bodyEl.innerHTML = getSkeletonHTML();

    // Atraso para transição suave do modal
    await new Promise(resolve => setTimeout(resolve, 250));

    try {
        const parsed = parseRef(ref);
        if (!parsed) throw new Error('Referência não reconhecida.');
        const { verses, translation, isCache } = await fetchBibleVerses(parsed, ref);
        if (verses.length === 0) {
            throw new Error('Nenhum texto encontrado para esta referência.');
        }

        // Set title
        titleEl.textContent = toHebrewBookName(cardTitle);

        if (isCache) {
            console.log(`[CACHE] ${translation} - ${toHebrewBookName(ref)}`);
        } else {
            console.log(`[API] ${translation} - ${toHebrewBookName(ref)}`);
        }

        let html = '<div class="verses-container">';
        for (const v of verses) {
            const paddedChapter = String(v.chapter).padStart(2, '0');
            const paddedVerse = String(v.verse).padStart(2, '0');
            const displayNum = `${paddedChapter}:${paddedVerse}`;
            html += `
                <div class="legend-card" style="align-items: flex-start; margin: 0;">
                    <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px;">
                        <div class="verse-text" style="padding-right: 0; text-align: left; font-size: var(--font-size-base); white-space: normal; overflow: visible; text-overflow: clip;">${displayNum} ${v.text}</div>
                    </div>
                </div>
            `;
        }
        html += '</div>';

        bodyEl.innerHTML = html;
        bodyEl.scrollTop = 0;

    } catch (err) {
        console.group("[ERRO CRITICO] Scripture Reader Fetch Failure");
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
        
        console.warn("Parallel & Fallback Network Request Diagnostics Trace:");
        if (window.lastReadingDiagnostic) {
            console.table(window.lastReadingDiagnostic);
        } else {
            console.log("No diagnostic trace was captured.");
        }
        
        console.log(
            "Hypothetical Diagnostic Vectors:\n" +
            "  - Vector A (CORS/Extensoes): Bloqueio local por Adblockers ou firewalls de rede local (ex: Pi-hole).\n" +
            "  - Vector B (Roteamento): navigator.onLine = " + navigator.onLine + ". Possivel falta de link de internet.\n" +
            "  - Vector C (API Outage): Indisponibilidade dos endpoints da Bolls.life e Bible-API simultaneamente."
        );
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

export function initModals(updateDashboardCallback) {
    updateDashboardCallbackGlobal = updateDashboardCallback;

    document.addEventListener('click', (event) => {
        const shareItem = event.target.closest('.share-option-item');
        if (shareItem) {
            const action = shareItem.getAttribute('data-share-action');
            const shareText = 'Acesse a parashá, o mês hebraico, as leituras bíblicas e as festas em tempo real no Yisrael Date: ';

            const shareNames = { whatsapp: 'WhatsApp', copy: 'Copiar Link', email: 'Email' };
            console.log(`[ACTION] ${shareNames[action] || action}`);

            if (action === 'whatsapp') {
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + shareUrl)}`, '_blank');
            } else if (action === 'copy') {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        const label = shareItem.querySelector('span');
                        if (label) {
                            const orig = label.textContent;
                            label.textContent = 'Link copiado!';
                            label.style.color = 'var(--accent-color)';
                            setTimeout(() => { label.textContent = orig; label.style.color = ''; }, 2500);
                        }
                    }).catch(() => {
                        prompt('Copie o link do aplicativo:', shareUrl);
                    });
                } else {
                    prompt('Copie o link do aplicativo:', shareUrl);
                }
            } else if (action === 'email') {
                const mailLink = document.createElement('a');
                mailLink.href = `mailto:?subject=${encodeURIComponent('Convite: Yisrael Date')}&body=${encodeURIComponent(shareText + '\n' + shareUrl)}`;
                mailLink.style.display = 'none';
                document.body.appendChild(mailLink);
                mailLink.click();
                document.body.removeChild(mailLink);
            }
            return;
        }

        const card = event.target.closest('.event-card, .legend-card');
        if (!card) return;

        if (card.id === 'card-local-vigente') {
            if (card.classList.contains('not-ready')) return;
            console.log('[MODAL] Pesquisa de Localização');
            const modal = document.getElementById('location-modal');
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                if (!history.state || !history.state.modalOpen) history.pushState({ modalOpen: true }, '');
                sessionStorage.setItem('openLocationModal', 'true');

                const readingBody = modal.querySelector('.reading-body');
                
                // Hide actual content list
                if (readingBody) readingBody.style.display = 'none';
                
                // Inject skeleton container
                let skeletonContainer = modal.querySelector('.location-skeleton-container');
                if (!skeletonContainer) {
                    skeletonContainer = document.createElement('div');
                    skeletonContainer.className = 'location-skeleton-container';
                    modal.querySelector('.modal-content').appendChild(skeletonContainer);
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
                        setTimeout(() => searchInput.focus(), 100);
                    }
                }, 250);
            }
            return;
        }

        if (card.id === 'card-parasha-wrapper' || card.id === 'card-hdate-wrapper' || card.id === 'card-share-wrapper' || card.classList.contains('info-trigger')) {
            if (card.classList.contains('not-ready')) return;
            const modal = document.getElementById('info-modal');
            const titleEl = document.getElementById('info-modal-title');
            const bodyEl = document.getElementById('info-modal-body');
            
            if (modal && titleEl && bodyEl) {
                const titleText = card.getAttribute('data-info-title') || '-';
                const htmlContent = card.getAttribute('data-info-html') || '';
                
                if (htmlContent) {
                    console.log(`[MODAL] ${titleText}`);
                    titleEl.textContent = titleText;
                    
                    // Show skeleton first
                    bodyEl.innerHTML = getSkeletonHTML();
                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                    if (!history.state || !history.state.modalOpen) history.pushState({ modalOpen: true }, '');
                    sessionStorage.setItem('openInfoModalTitle', titleText);

                    // Atraso para transição suave
                    setTimeout(() => {
                        bodyEl.innerHTML = htmlContent;
                    }, 250);
                }
            }
            return;
        }

        if (card.id === 'card-torah-wrapper' || card.id === 'card-haftara-wrapper' || card.id === 'card-ketuvim-wrapper') {
            const titleEl = card.querySelector('.card-title');
            const titleText = titleEl ? titleEl.textContent.trim() : '';
            if (!titleText || titleText === '-') return;

            const ref = card.getAttribute('data-ref');
            if (ref) {
                openReadingModal(ref, titleText);
            }
            return;
        }

        const titleEl = card.querySelector('.card-title');
        const subtitleEl = card.querySelector('.card-subtitle') || card.querySelector('.timer-countdown');

        if (titleEl) {
            const textToCopy = titleEl.textContent.trim();
            if (!textToCopy || textToCopy === '-') return;

            navigator.clipboard.writeText(textToCopy).then(() => {
                if (subtitleEl) {
                    const originalText = subtitleEl.textContent;
                    subtitleEl.setAttribute('data-copied', 'true');
                    subtitleEl.textContent = 'Item Copiado';
                    setTimeout(() => {
                        subtitleEl.removeAttribute('data-copied');
                        subtitleEl.textContent = originalText;
                    }, 1200);
                }
            }).catch(err => {
                console.error('Falha ao copiar texto: ', err);
            });
        }
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

        console.log(`[ACTION] Pesquisa "${query}"`);

        searchTimeout = setTimeout(async () => {
            const currentQuery = e.target.value.trim();
            // Guard: if the user cleared or changed the input since the timer was set, bail
            if (currentQuery !== query) return;

            const spinner = document.getElementById('search-spinner');
            if (spinner) spinner.style.display = 'block';
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=15&accept-language=pt&email=contato@yisraeldate.app`);
                if (!res.ok) return;
                const data = await res.json();

                // Guard again after async: check the input still matches
                const afterQuery = document.getElementById('location-search-input')?.value.trim();
                if (afterQuery !== query) return;

                if (data.length === 0) {
                    renderSuggestions([]);
                    return;
                }

                data.sort((a, b) => (b.importance || 0) - (a.importance || 0));

                const seenDisplayNames = new Set();
                const finalResults = [];

                data.forEach(item => {
                    if (item.type === 'country' || item.class === 'country' || item.addresstype === 'country') {
                        return;
                    }
                    const parts = item.display_name.split(',').map(s => s.trim());
                    if (parts.length <= 1) {
                        return;
                    }
                    
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
                console.error('Search API error:', err);
            } finally {
                const spinner = document.getElementById('search-spinner');
                if (spinner) spinner.style.display = 'none';
            }
        }, 600);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const locationModal = document.getElementById('location-modal');
            if (locationModal && locationModal.style.display !== 'none') {
                closeModalSafely(locationModal);
                sessionStorage.removeItem('openLocationModal');
            }
            const readingModal = document.getElementById('reading-modal');
            if (readingModal && readingModal.style.display !== 'none') {
                closeModalSafely(readingModal);
                sessionStorage.removeItem('openReadingModalRef');
                sessionStorage.removeItem('openReadingModalTitle');
            }
            const infoModal = document.getElementById('info-modal');
            if (infoModal && infoModal.style.display !== 'none') {
                closeModalSafely(infoModal);
                sessionStorage.removeItem('openInfoModalTitle');
            }
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



    // Initialize the global observer to freeze background on any modal open
    initModalObserver();
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

// Expose Bible version switcher helpers to the window object for testing via Console
window.setBibleVersion = (version) => {
    if (!version) {
        window.listBibleVersions();
        return;
    }
    const target = String(version).toUpperCase().trim();
    const validMap = {
        'NVT': 'NVT (Nova Versão Transformadora - PT-BR)',
        'OL': 'OL (O Livro - PT-PT)'
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
        } catch(e) {}
        console.log(`[ACTION] Bible Version ${target}`);
    } else {
        console.warn(`[ACTION] Bible Version Invalid ${version}`);
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
    } catch(e) {}
    console.log('[ACTION] Bible Version Reset');
};

window.listBibleVersions = () => {
    console.log('[ACTION] Bible Version List');
    console.table([
        { Version: 'NVT', Name: 'Nova Versão Transformadora', Language: 'PT-BR', Command: "setBibleVersion('NVT')" },
        { Version: 'OL', Name: 'O Livro', Language: 'PT-PT', Command: "setBibleVersion('OL')" }
    ]);
};
