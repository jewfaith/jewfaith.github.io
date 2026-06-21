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

        const latDelta = 1.8;
        const cosLat = Math.cos(lat * Math.PI / 180);
        const lonDelta = latDelta / (cosLat > 0.01 ? cosLat : 1);

        const left = lon - lonDelta;
        const right = lon + lonDelta;
        const top = lat + latDelta;
        const bottom = lat - latDelta;

        const queryTypes = ['suburb', 'village', 'town'];
        const seen = new Set();
        const uniqueItems = [];

        for (const q of queryTypes) {
            if (uniqueItems.length >= 12) break;

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&viewbox=${left},${top},${right},${bottom}&bounded=1&format=json&limit=15&accept-language=pt`);
                if (!res.ok) continue;
                const data = await res.json();

                for (const item of data) {
                    if (item.type === 'country' || item.class === 'country' || item.addresstype === 'country') {
                        continue;
                    }
                    const parts = item.display_name.split(',').map(s => s.trim());
                    if (parts.length <= 1) {
                        continue;
                    }
                    const displayText = parts.slice(0, 4).join(', ');

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

        // Group into 20km interval bins (0-20km, 20-40km, etc.)
        const binnedItems = [];
        const usedBins = new Set();
        
        for (const item of uniqueItems) {
            const bin = Math.floor(item.distanceKm / 20);
            if (bin < 10 && !usedBins.has(bin)) {
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

    // 1. Prepend Current Active Location at slot 1 ONLY if not actively searching
    const currentLocName = document.getElementById('card-local')?.textContent || '';
    const hasValidName = currentLocName && !['-', 'Calculando...', 'Restaurando...', 'Aguardando GPS...', 'Erro GPS'].includes(currentLocName);
    
    if (!isSearching) {
        const activeCoords = getActiveCoords();
        const activeItem = {
            isCurrent: true,
            item: {
                lat: activeCoords.lat,
                lon: activeCoords.lon
            },
            displayText: hasValidName ? currentLocName : 'Jerusalém, Israel'
        };
        finalItems.push(activeItem);
    }

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
        
        const parts = resItem.displayText.split(',').map(s => s.trim());
        const primaryText = parts[0];
        const secondaryText = parts.slice(1, 4).join(', ');

        li.innerHTML = `<strong>${primaryText}</strong>${secondaryText ? `<span class="suggestion-secondary">, ${secondaryText}</span>` : ''}`;

        li.addEventListener('click', () => {
            if (resItem.isCurrent) {
                // Clicking the active location resets manual override and pulls device GPS/IP again
                localStorage.removeItem('exactLocation');
            } else {
                const lat = parseFloat(resItem.item.lat);
                const lon = parseFloat(resItem.item.lon);
                localStorage.setItem('exactLocation', JSON.stringify({ lat, lon }));
                applyEstimatedTheme(lat, lon);
            }
            
            nearbyLocationsCache = [];

            const modal = document.getElementById('location-modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
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
async function fetchARAVerses(parsed) {
    const { bookId, startChapter, startVerse, endChapter, endVerse } = parsed;
    const allVerses = [];

    for (let ch = startChapter; ch <= endChapter; ch++) {
        const url = `https://bolls.life/get-chapter/ARA/${bookId}/${ch}/`;
        const res = await fetch(url);
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

    return allVerses;
}

async function openReadingModal(ref, cardTitle) {
    const modal = document.getElementById('reading-modal');
    const titleEl = document.getElementById('reading-modal-title');
    const bodyEl = document.getElementById('reading-modal-body');
    if (!modal || !titleEl || !bodyEl) return;

    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Set title
    titleEl.textContent = toHebrewBookName(cardTitle);

    // Set loading state
    bodyEl.innerHTML = `
        <div class="reading-loading">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <span>Carregando texto sagrado...</span>
        </div>
    `;

    try {
        const parsed = parseRef(ref);
        if (!parsed) throw new Error('Referência não reconhecida.');

        const verses = await fetchARAVerses(parsed);
        if (verses.length === 0) {
            throw new Error('Nenhum texto encontrado para esta referência.');
        }

        let html = '';
        for (const v of verses) {
            const displayNum = `${v.chapter}:${v.verse}`;
            html += `
                <div class="verse-row">
                    <div class="verse-portuguese">
                        <span class="verse-num">${displayNum}</span>
                        <div class="verse-text">${v.text}</div>
                    </div>
                </div>
            `;
        }

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

                const searchInput = document.getElementById('location-search-input');
                if (searchInput) {
                    searchInput.value = '';
                    renderSuggestions([]);
                    fetchNearbyLocations();
                    setTimeout(() => searchInput.focus(), 100);
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

    document.getElementById('location-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'location-modal') {
            document.getElementById('location-modal').style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    document.getElementById('close-reading-btn')?.addEventListener('click', () => {
        document.getElementById('reading-modal').style.display = 'none';
        document.body.style.overflow = '';
    });

    document.getElementById('reading-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'reading-modal') {
            document.getElementById('reading-modal').style.display = 'none';
            document.body.style.overflow = '';
        }
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
            const spinner = document.getElementById('search-spinner');
            if (spinner) spinner.style.display = 'block';
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=15&accept-language=pt`);
                if (!res.ok) return;
                const data = await res.json();

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
                    const displayText = parts.slice(0, 4).join(', ');

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
                locationModal.style.display = 'none';
                document.body.style.overflow = '';
            }
            const readingModal = document.getElementById('reading-modal');
            if (readingModal && readingModal.style.display !== 'none') {
                readingModal.style.display = 'none';
                document.body.style.overflow = '';
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
