import { startTimers, stopTimers } from './timers.js';
import { state } from '../state.js';
import { applyEstimatedTheme } from './theme.js';

let updateDashboardCallbackGlobal = null;
let nearbyLocationsCache = [];
let isFetchingNearby = false;

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

        li.style.cssText = "font-size: 1rem; font-weight: 400; text-align: left; color: var(--text-primary); cursor: pointer;";
        li.innerHTML = `${primaryText}${secondaryText ? `, ${secondaryText}` : ''}`;

        li.addEventListener('click', () => {
            if (resItem.isCurrent) {
                // Clicking the active location resets manual override and pulls device GPS/IP again
                localStorage.removeItem('exactLocation');
            } else {
                const lat = parseFloat(resItem.item.lat);
                const lon = parseFloat(resItem.item.lon);
                const isIl = resItem.item.address && resItem.item.address.country_code === 'il';
                localStorage.setItem('exactLocation', JSON.stringify({ 
                    lat, 
                    lon, 
                    name: resItem.displayText,
                    isIsrael: isIl
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
        li.textContent = '-';
        li.style.opacity = '0.1';
        li.style.pointerEvents = 'none';
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
 * Examples: "Genesis 12:21-51", "Genesis 12:21-13:5", "Psalms 23"
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

    // Parse the chapter:verse range
    // Formats: "23" | "12:21-51" | "12:21-13:5"
    const rangeParts = rest.split('-');

    if (rangeParts.length === 1) {
        // Single chapter or single verse: "23" or "12:3"
        const parts = rangeParts[0].split(':');
        const chapter = parseInt(parts[0], 10);
        const verse = parts.length > 1 ? parseInt(parts[1], 10) : null;
        return {
            bookId, bookName,
            startChapter: chapter, startVerse: verse,
            endChapter: chapter, endVerse: verse
        };
    }

    // Start part
    const startParts = rangeParts[0].split(':');
    const startChapter = parseInt(startParts[0], 10);
    const startVerse = startParts.length > 1 ? parseInt(startParts[1], 10) : null;

    // End part: could be just verse "51" or chapter:verse "13:5"
    const endRaw = rangeParts[1].trim();
    if (endRaw.includes(':')) {
        const endParts = endRaw.split(':');
        return {
            bookId, bookName,
            startChapter, startVerse,
            endChapter: parseInt(endParts[0], 10),
            endVerse: parseInt(endParts[1], 10)
        };
    } else {
        return {
            bookId, bookName,
            startChapter, startVerse,
            endChapter: startChapter,
            endVerse: parseInt(endRaw, 10)
        };
    }
}

/**
 * Fetch verses from Bolls.life ARA API for a parsed reference.
 */
async function fetchARAVerses(parsed, refKey) {
    const cacheKey = 'bible_cache_' + (refKey || '').replace(/\s+/g, '_');
    const cached = localStorage.getItem(cacheKey) || sessionStorage.getItem(cacheKey);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch(e) {}
    }

    const { bookId, startChapter, startVerse, endChapter, endVerse } = parsed;
    const allVerses = [];

    for (let ch = startChapter; ch <= endChapter; ch++) {
        const url = `https://bolls.life/get-chapter/ARA/${bookId}/${ch}/`;
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 7000);
        let res;
        try {
            res = await fetch(url, { signal: ctrl.signal });
        } catch(e) {
            clearTimeout(tid);
            throw new Error('API Timeout ou Erro de rede');
        }
        clearTimeout(tid);
        if (!res.ok) throw new Error(`Erro na API: status ${res.status}`);
        const data = await res.json();

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

    if (allVerses.length > 0) {
        try {
            localStorage.setItem(cacheKey, JSON.stringify(allVerses));
        } catch (e) {
            try { sessionStorage.setItem(cacheKey, JSON.stringify(allVerses)); } catch (e2) {}
        }
    }

    return allVerses;
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
        const verses = await fetchARAVerses(parsed, ref);
        if (verses.length === 0) {
            throw new Error('Nenhum texto encontrado para esta referência.');
        }

        let html = '<div class="verses-container">';
        for (const v of verses) {
            const paddedChapter = String(v.chapter).padStart(2, '0');
            const paddedVerse = String(v.verse).padStart(2, '0');
            const displayNum = `${paddedChapter}:${paddedVerse}`;
            html += `
                <div class="legend-card" style="align-items: flex-start; margin: 0;">
                    <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px;">
                        <div class="verse-text" style="padding-right: 0; text-align: left; font-size: 1.05rem; white-space: normal; overflow: visible; text-overflow: clip;">${displayNum} ${v.text}</div>
                    </div>
                </div>
            `;
        }
        html += '</div>';

        bodyEl.innerHTML = html;
        bodyEl.scrollTop = 0;

    } catch (err) {
        console.error('Erro ao buscar leitura:', err);
        bodyEl.innerHTML = `
            <div class="reading-error">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>Não foi possível carregar o texto sagrado no momento. Verifique sua conexão.</span>
                <small style="color: var(--text-muted); font-size: 0.8rem; margin-top: 4px;">${err.message}</small>
            </div>
        `;
    }
}

export function initModals(updateDashboardCallback) {
    updateDashboardCallbackGlobal = updateDashboardCallback;

    document.addEventListener('click', (event) => {
        const card = event.target.closest('.event-card');
        if (!card) return;

        if (card.id === 'card-local-vigente') {
            if (card.classList.contains('not-ready')) return;
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

        if (card.id === 'card-parasha-wrapper' || card.id === 'card-hdate-wrapper' || card.classList.contains('info-trigger')) {
            if (card.classList.contains('not-ready')) return;
            const modal = document.getElementById('info-modal');
            const titleEl = document.getElementById('info-modal-title');
            const bodyEl = document.getElementById('info-modal-body');
            
            if (modal && titleEl && bodyEl) {
                const titleText = card.getAttribute('data-info-title') || '-';
                const htmlContent = card.getAttribute('data-info-html') || '';
                
                if (htmlContent) {
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

        if (card.id === 'card-paypal-wrapper') {
            if (card.classList.contains('not-ready') || card.classList.contains('locked')) {
                // Se estiver bloqueado (Yom Tov / Shabbat), mostrar modal de aviso
                if (card.classList.contains('locked')) {
                    const modal = document.getElementById('info-modal');
                    const titleEl = document.getElementById('info-modal-title');
                    const bodyEl = document.getElementById('info-modal-body');
                    if (modal && titleEl && bodyEl) {
                        titleEl.textContent = 'Apoio Pausado';
                        bodyEl.innerHTML = `
                            <div class="levels-container" style="display:flex; flex-direction:column;">
                                <div class="info-modal-card" style="flex-direction:column; align-items:flex-start; gap:8px; white-space:normal; overflow:visible;">
                                    <div class="info-modal-value" style="font-weight:400; font-size:0.95rem; line-height:1.6; text-align:left; white-space:normal; overflow:visible; text-overflow:clip;">Status Atual: O recebimento de apoios financeiros está temporariamente suspenso em respeito à santidade do dia.</div>
                                </div>
                                <div class="info-modal-card" style="flex-direction:column; align-items:flex-start; gap:8px; white-space:normal; overflow:visible;">
                                    <div class="info-modal-value" style="font-weight:400; font-size:0.95rem; line-height:1.6; text-align:left; white-space:normal; overflow:visible; text-overflow:clip;">Halachá: A lei judaica determina a cessação de transações financeiras e trabalho físico durante os dias sagrados. Essa pausa honra o mandamento do descanso e permite a elevação espiritual.</div>
                                </div>
                                <div class="info-modal-card" style="flex-direction:column; align-items:flex-start; gap:8px; white-space:normal; overflow:visible;">
                                    <div class="info-modal-value" style="font-weight:400; font-size:0.95rem; line-height:1.6; text-align:left; white-space:normal; overflow:visible; text-overflow:clip;">Período de Bloqueio: A suspensão entra em vigor de forma preventiva cinco horas antes do pôr do sol e se encerra apenas cinco horas após a saída das estrelas do último dia da festividade.</div>
                                </div>
                                <div class="info-modal-card" style="flex-direction:column; align-items:flex-start; gap:8px; white-space:normal; overflow:visible;">
                                    <div class="info-modal-value" style="font-weight:400; font-size:0.95rem; line-height:1.6; text-align:left; white-space:normal; overflow:visible; text-overflow:clip;">Margem de Segurança: Para evitar qualquer infração involuntária nos momentos que antecedem ou sucedem a festividade, o sistema adiciona automaticamente este intervalo preventivo em ambas as extremidades do dia sagrado.</div>
                                </div>
                            </div>
                        `;
                        modal.style.display = 'flex';
                        document.body.style.overflow = 'hidden';
                        if (!history.state || !history.state.modalOpen) history.pushState({ modalOpen: true }, '');
                    }
                }
                return;
            }
            window.open('https://paypal.me/ashkenar', '_blank');
            return;
        }

        if (card.id === 'card-share-wrapper') {
            if (card.classList.contains('not-ready')) return;
            const shareUrl = window.location.href;
            
            const copyLink = () => {
                try {
                    const tempInput = document.createElement('input');
                    tempInput.value = shareUrl;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    
                    const subtitleEl = card.querySelector('.card-subtitle');
                    if (subtitleEl) {
                        const originalText = subtitleEl.getAttribute('data-orig') || subtitleEl.textContent;
                        subtitleEl.setAttribute('data-orig', originalText);
                        subtitleEl.textContent = 'Link Copiado!';
                        setTimeout(() => subtitleEl.textContent = originalText, 2000);
                    }
                } catch(e) {
                    prompt('Copie o link do projeto:', shareUrl);
                }
            };

            const fallbackShare = () => {
                try {
                    const tempInput = document.createElement('input');
                    tempInput.value = shareUrl;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    
                    const subtitleEl = card.querySelector('.card-subtitle');
                    if (subtitleEl) {
                        const originalText = subtitleEl.getAttribute('data-orig') || subtitleEl.textContent;
                        subtitleEl.setAttribute('data-orig', originalText);
                        subtitleEl.textContent = 'Link Copiado';
                        setTimeout(() => subtitleEl.textContent = originalText, 2000);
                    }
                } catch(e) {
                    prompt('Copie o link abaixo:', shareUrl);
                }
            };

            if (navigator.share) {
                navigator.share({
                    title: 'Yisrael Date',
                    text: 'Acesse horários, parashá, feriados e zmanim em tempo real.',
                    url: shareUrl
                }).catch(err => {
                    fallbackShare();
                });
            } else {
                fallbackShare();
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
