/**
 * DASHBOARDVIEW.JS - VISÃO E APRESENTAÇÃO DA TELA PRINCIPAL (DASHBOARD)
 * 
 * Gerencia a renderização dos blocos litúrgicos de topo (saudação, calendário bíblico,
 * parashá semanal, leituras diárias, zmanim rápidos) e a grelha de próximos festivais.
 */

import { state } from '../../state.js';
import { applySolarTheme } from '../theme.js';
import { findActiveFestival, transliterateTorah, pickReading, getNextShabbatEvent } from '../../domain/halacha.js';
import {
    FESTIVAL_CATS,
    FESTIVAL_TORAH_READINGS,
    FESTIVAL_HAFTARA_READINGS,
    KETUVIM_BOOKS,
    KETUVIM_TOTAL_WEIGHT,
    FESTIVAL_TEHILIM,
    AVAILABLE_TEHILIM,
    FESTIVAL_DESCRIPTIONS,
    getFestivalDescription,
    HEBREW_MONTHS_PT
} from '../../domain/constants.js';
import { getParashaSummary } from '../../domain/parashot.js';
import { LCG, getStringSimilarity } from '../../utils/math.js';
import { getEventIcon, ICONS } from '../icons.js';
import { startTimers, formatTimeRemaining, GREGORIAN_MONTHS_PT } from '../timers.js';
import { initSolarArc, updateSolarPosition, updateShaahZmanitCardPosition } from '../solarArc.js';
import { initZmanimModal, openZmanimModal } from '../zmanimTable.js';
import { initThemeSwitcher } from '../themeSwitcher.js';
import { initAppNavigation } from '../appNavigation.js';
import { getFestivalIcon, renderFestivalsView } from '../festivalsView.js';
import {
    formatHebrewInText,
    formatTwoWordTitle,
    formatTwoWordSubtitle,
    formatHaftaraTwoWords,
    formatCardTwoWords,
    formatTwoWordParasha,
    formatTwoWordLocation,
    formatLocationCountry,
    formatLocationCityCountry,
    getLocationDateParts,
    toEnglishRef
} from '../../domain/formatters.js';
import { createSkeletonCardsHTML } from '../components/skeleton.js';
import { showShareToast, shareAppUrl, initShareListeners } from '../components/shareModal.js';
import { renderSupportCards } from '../components/supportCard.js';
import { renderHomeProducts } from '../components/homeProducts.js';
import { applyDailyReadingsToCards } from '../../services/sefariaService.js';
import { trackHeartEvent } from '../../services/telemetryService.js';

const HEBREW_MONTHS_MAP = HEBREW_MONTHS_PT;

export function createDescriptionCardHTML(festivalData, defaultText) {
    if (festivalData && typeof festivalData === 'object' && festivalData.torah) {
        const keys = ['info', 'torah', 'neviim', 'ketuvim', 'talmud', 'sod'];
        return `
            <div class="levels-container levels-flex-col">
                ${keys.map((key, idx) => `
                    <div class="info-modal-card info-card-col ${idx === keys.length - 1 ? 'no-border' : ''}">
                        <div class="info-modal-value info-val-fluid">${formatHebrewInText(festivalData[key])}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (Array.isArray(festivalData)) {
        return `
            <div class="modal-reading-narrative">
                ${festivalData.map(description => `
                    <p>
                        ${formatHebrewInText(description)}
                    </p>
                `).join('')}
            </div>
        `;
    }

    const desc = (typeof festivalData === 'string' ? festivalData : null) || defaultText;
    return `
        <div class="modal-reading-narrative">
            <p>
                ${formatHebrewInText(desc)}
            </p>
        </div>
    `;
}

function removeNotReadyState(elements) {
    if (!elements) return;
    const list = elements.length !== undefined ? Array.from(elements) : [elements];
    list.forEach(el => {
        if (el && el.classList) {
            el.classList.remove('not-ready');
            const nestedSkeletons = el.querySelectorAll('.skeleton-card, .skeleton-line');
            nestedSkeletons.forEach(sk => sk.classList.remove('not-ready'));
        }
    });
}

export function showDashboardSkeletons() {
    if (typeof document === 'undefined') return;
    const cards = [
        { id: 'card-local', subId: 'card-local-vigente' },
        { id: 'card-parasha', subId: 'card-parasha-wrapper' },
        { id: 'card-torah', subId: 'card-torah-wrapper' },
        { id: 'card-haftara', subId: 'card-haftara-wrapper' },
        { id: 'card-ketuvim', subId: 'card-ketuvim-wrapper' },
        { id: 'card-hdate', subId: 'card-hdate-wrapper' }
    ];

    cards.forEach(c => {
        const titleEl = document.getElementById(c.id);
        const wrapperEl = document.getElementById(c.subId);
        if (wrapperEl) {
            wrapperEl.classList.add('not-ready');
            const subEl = wrapperEl.querySelector('.settings-card-desc, .card-subtitle');
            if (subEl) {
                subEl.innerHTML = '<span class="skeleton-line skeleton-line-sub w-45p"></span>';
            }
        }
        if (titleEl) {
            titleEl.innerHTML = '<span class="skeleton-line skeleton-line-title w-75p"></span>';
        }
    });

    const tanakhList = document.getElementById('tanakh-festivals-list');
    if (tanakhList) {
        tanakhList.innerHTML = createSkeletonCardsHTML(5);
    }

    const grid = document.getElementById('upcoming-events-grid');
    if (grid) {
        grid.innerHTML = createSkeletonCardsHTML(5);
    }

    const productsGrid = document.getElementById('home-products-grid');
    if (productsGrid) {
        productsGrid.innerHTML = createSkeletonCardsHTML(4);
    }

    const rabbinicList = document.getElementById('rabbinic-festivals-list');
    if (rabbinicList) {
        rabbinicList.innerHTML = createSkeletonCardsHTML(5);
    }
}

function getCanonicalMonthKey(m) {
    if (!m) return '';
    const s = String(m).toLowerCase().replace(/['\s-]/g, '');
    if (s === 'nisan' || s === 'aviv') return 'aviv';
    if (s === 'iyyar' || s === 'iyr' || s === 'ziv') return 'ziv';
    if (s === 'sivan') return 'sivan';
    if (s === 'tammuz' || s === 'tamuz') return 'tamuz';
    if (s === 'av') return 'av';
    if (s === 'elul') return 'elul';
    if (s === 'tishrei' || s === 'tishri' || s === 'etanim') return 'etanim';
    if (s === 'cheshvan' || s === 'marcheshvan' || s === 'bul') return 'bul';
    if (s === 'kislev') return 'kislev';
    if (s === 'tevet') return 'tevet';
    if (s === 'shvat' || s === 'shevat') return 'shevat';
    if (s === 'adar1' || s === 'adari') return 'adari';
    if (s === 'adar2' || s === 'adarii') return 'adarii';
    if (s === 'adar') return 'adar';
    return s;
}

const SPECIAL_SHABBAT_NAMES = [
    'shabbat shekalim',
    'shabbat zachor',
    'shabbat parah',
    'shabbat hachodesh',
    'shabbat chodesh',
    'shabbat hagadol',
    'shabbat gadol',
    'shabbat shirah',
    'shabbat chazon',
    'shabbat nachamu',
    'shabbat shuva',
    'shabbat shuvah'
];

function isSpecialShabbatEvent(ev) {
    if (!ev) return false;
    const n = (ev.name || '').toLowerCase();
    const c = (ev.category || '').toLowerCase();
    const subcat = (ev.raw?.subcat || '').toLowerCase();
    const rawTitle = (ev.raw?.title || '').toLowerCase();
    if (subcat === 'shabbat') return true;
    return SPECIAL_SHABBAT_NAMES.some(s => 
        n.includes(s) || c.includes(s.replace(/\s+/g, '')) || rawTitle.includes(s)
    );
}

function getSpecialShabbatCanonicalName(ev) {
    const rawTitle = (ev.raw?.title || '').toLowerCase();
    const n = (ev.name || '').toLowerCase();
    if (rawTitle.includes('hagadol') || n.includes('hagadol') || rawTitle.includes('gadol')) return 'Shabbat HaGadol';
    if (rawTitle.includes('shuv') || n.includes('shuv')) return 'Shabbat Shuvah';
    if (rawTitle.includes('shekalim') || n.includes('shekalim')) return 'Shabbat Shekalim';
    if (rawTitle.includes('zachor') || n.includes('zachor')) return 'Shabbat Zachor';
    if (rawTitle.includes('parah') || n.includes('parah')) return 'Shabbat Parah';
    if (rawTitle.includes('chodesh') || n.includes('chodesh')) return 'Shabbat HaChodesh';
    if (rawTitle.includes('shirah') || n.includes('shirah')) return 'Shabbat Shirah';
    if (rawTitle.includes('chazon') || n.includes('chazon')) return 'Shabbat Chazon';
    if (rawTitle.includes('nachamu') || n.includes('nachamu')) return 'Shabbat Nachamu';
    return ev.name || 'Yom Shabbat';
}

export function generateCalendarHTML(events, currentHdate, nowMs = Date.now()) {
    if (!currentHdate) return '';

    const targetMonthKey = getCanonicalMonthKey(currentHdate.hm);
    let displayMonth = HEBREW_MONTHS_MAP[currentHdate.hm] || currentHdate.hm || 'Mês';
    const currentHy = currentHdate.hy;

    let html = `<div class="calendar-modal-content">`;

    const multiDayCategories = ['matzot', 'sukkot', 'hanukkah', 'chanukah', 'roshhashana'];
    const isMultiDayItem = (name, cat) => {
        const n = (name || '').toLowerCase();
        const c = (cat || '').toLowerCase();
        return multiDayCategories.some(m => c.includes(m)) ||
               n.includes('matzot') ||
               n.includes('sukkot') ||
               n.includes('chanukah') ||
               n.includes('hanukkah') ||
               n.includes('rosh hashana');
    };

    const monthEventsMap = new Map();
    const monthEvents = [];
    const specialShabbatsByDay = new Map();

    for (const ev of (events || [])) {
        if (!ev || !ev.name || !ev.raw) continue;

        let hDay = null;
        let hMonth = null;
        let hYear = null;

        if (ev.raw.hdate) {
            const parts = ev.raw.hdate.split(' ');
            if (parts.length >= 3) {
                hDay = parseInt(parts[0], 10);
                hMonth = parts.slice(1, -1).join(' ');
                hYear = parseInt(parts[parts.length - 1], 10);
            }
        }

        if (!hDay || !hMonth) continue;
        if (getCanonicalMonthKey(hMonth) !== targetMonthKey) continue;
        if (currentHy && hYear && hYear !== currentHy) continue;

        // Omite contagem diária individual do Omer no calendário mensal (Lag BaOmer é mantido)
        if (ev.category === 'omer' || (ev.name && ev.name.includes('laOmer'))) {
            continue;
        }

        monthEvents.push({ ev, hDay, hMonth, hYear });

        // Identifica Shabbatot especiais para associação com o respectivo sábado
        if (isSpecialShabbatEvent(ev)) {
            if (!specialShabbatsByDay.has(hDay)) {
                specialShabbatsByDay.set(hDay, []);
            }
            specialShabbatsByDay.get(hDay).push(ev);
            continue;
        }

        // Parashot semanais e Yom Shabbat genérico são agregados de forma sistemática por sábado
        if (ev.category === 'parashat' || ev.name === 'Yom Shabbat') {
            continue;
        }

        // Agrupamento de celebrações de múltiplos dias vs celebrações de dia único
        const multi = isMultiDayItem(ev.name, ev.category);
        const groupKey = multi ? `${ev.name}_${ev.category}` : `${ev.name}_${hDay}`;

        if (monthEventsMap.has(groupKey)) {
            const existing = monthEventsMap.get(groupKey);
            existing.days.push(hDay);
            existing.firstDay = Math.min(existing.firstDay, hDay);
            existing.lastDay = Math.max(existing.lastDay, hDay);
        } else {
            monthEventsMap.set(groupKey, {
                name: ev.name,
                category: ev.category,
                isBiblical: !!ev.isBiblical,
                days: [hDay],
                firstDay: hDay,
                lastDay: hDay
            });
        }
    }

    // Determina todos os sábados (Shabbatot) do mês hebraico de forma infalível
    const saturdayDays = new Set();

    // 1. Procurar por eventos que ocorrem em sábado no mês
    for (const item of monthEvents) {
        if (item.ev.raw?.date) {
            const d = new Date(item.ev.raw.date + 'T12:00:00Z');
            if (d.getUTCDay() === 6) {
                saturdayDays.add(item.hDay);
            }
        }
    }

    // 2. Usar evento âncora do mês (ou data hebraica atual como fallback) para calcular os 4 ou 5 sábados
    const anchor = monthEvents.find(e => e.ev.raw && e.ev.raw.date);
    let anchorDow = null;
    let anchorHDay = null;

    if (anchor) {
        const anchorDate = new Date(anchor.ev.raw.date + 'T12:00:00Z');
        anchorDow = anchorDate.getUTCDay();
        anchorHDay = anchor.hDay;
    } else if (currentHdate.hd) {
        anchorDow = new Date(nowMs).getDay();
        anchorHDay = currentHdate.hd;
    }

    if (anchorDow !== null && anchorHDay !== null) {
        const has30 = monthEvents.some(e => e.hDay === 30) ||
            ['aviv', 'sivan', 'av', 'etanim', 'shevat'].includes(targetMonthKey);
        const maxDays = has30 ? 30 : 29;

        for (let d = 1; d <= maxDays; d++) {
            const dow = ((anchorDow + (d - anchorHDay)) % 7 + 7) % 7;
            if (dow === 6) {
                saturdayDays.add(d);
            }
        }
    }

    let items = Array.from(monthEventsMap.values());

    // Ajuste canónico para duração completa de festividades com período fixo
    items.forEach(item => {
        if (item.name === 'Chag Matzot' && targetMonthKey === 'aviv') {
            item.firstDay = 15;
            item.lastDay = 21;
        } else if (item.name === 'Chag Sukkot' && targetMonthKey === 'etanim') {
            item.firstDay = 15;
            item.lastDay = 21;
        } else if (item.name === 'Rosh Hashana' && targetMonthKey === 'etanim') {
            item.firstDay = 1;
            item.lastDay = 2;
        }
    });

    for (const day of specialShabbatsByDay.keys()) {
        saturdayDays.add(day);
    }

    // Adiciona todos os 4 ou 5 Shabbatot do mês (o normal Yom Shabbat e também o rabínico/especial se houver)
    const sortedSaturdays = Array.from(saturdayDays).sort((a, b) => a - b);
    for (const satDay of sortedSaturdays) {
        // 1. Sempre adiciona o Yom Shabbat normal (bíblico)
        items.push({
            name: 'Yom Shabbat',
            category: 'parashat',
            isBiblical: true,
            isTraditional: false,
            days: [satDay],
            firstDay: satDay,
            lastDay: satDay
        });

        // 2. Se houver Shabbat especial/rabínico neste sábado, adiciona também (rabínico)
        if (specialShabbatsByDay.has(satDay)) {
            const specList = specialShabbatsByDay.get(satDay);
            const list = Array.isArray(specList) ? specList : [specList];
            for (const specEv of list) {
                const canonicalSpecName = getSpecialShabbatCanonicalName(specEv);
                items.push({
                    name: canonicalSpecName,
                    category: specEv.category || 'shabbat',
                    isBiblical: false,
                    isTraditional: true,
                    days: [satDay],
                    firstDay: satDay,
                    lastDay: satDay
                });
            }
        }
    }

    // Ordenação estritamente cronológica por firstDay, com prioridade bíblica em caso de empate
    items.sort((a, b) => {
        if (a.firstDay !== b.firstDay) return a.firstDay - b.firstDay;
        if (a.isBiblical !== b.isBiblical) return (b.isBiblical ? 1 : 0) - (a.isBiblical ? 1 : 0);
        return a.name.localeCompare(b.name);
    });

    if (items.length > 0) {
        html += `<div class="calendar-legend">
            <ul class="legend-list legend-list-flex">`;
        for (const item of items) {
            let baseName = item.name;
            if (item.name.includes('laOmer')) baseName = 'Sefirat Omer';
            else if (item.name.includes('Hanukkah') || item.name.includes('Chanukah')) baseName = 'Chag Chanukah';
            else if (item.name === 'Shabbat Shuva') baseName = 'Shabbat Shuvah';
            else if (item.name === 'Shabbat Gadol') baseName = 'Shabbat HaGadol';
            else if (item.name === 'Shabbat Chodesh') baseName = 'Shabbat HaChodesh';

            const festivalData = getFestivalDescription(baseName) || getFestivalDescription(item.name) || FESTIVAL_DESCRIPTIONS[baseName] || FESTIVAL_DESCRIPTIONS[item.name];
            const defaultDesc = 'Esta é uma data significativa no calendário israelita. O seu significado está relacionado com a história, a tradição e os ensinamentos do povo de Israel, podendo envolver acontecimentos históricos, mandamentos da Torá, práticas religiosas ou outros elementos transmitidos ao longo das gerações.';
            const infoHtml = createDescriptionCardHTML(festivalData, defaultDesc);

            const safeInfoHtml = infoHtml.replace(/"/g, '&quot;');
            const itemTitle = formatCardTwoWords(item.name, 'Sagrado');
            const safeName = itemTitle.replace(/"/g, '&quot;');
            const iconClass = getFestivalIcon(item.name, item.isBiblical);
            const dateSubtitle = item.firstDay === item.lastDay 
                ? `${item.firstDay} ${displayMonth}` 
                : `${item.firstDay}-${item.lastDay} ${displayMonth}`;

            html += `<li class="settings-card event-card glass-panel info-trigger" 
                         data-info-title="${safeName}" 
                         data-info-html="${safeInfoHtml}" 
                         tabindex="0"
                         role="button"
                         aria-label="${safeName}">
                <div class="settings-card-left">
                    <i class="${iconClass} settings-icon"></i>
                    <div class="settings-card-text">
                        <span class="settings-card-title">${itemTitle}</span>
                        <span class="settings-card-desc">${dateSubtitle}</span>
                    </div>
                </div>
                <div class="card-arrow-action" aria-hidden="true">
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            </li>`;
        }
        html += `</ul></div>`;
    } else {
        html += `<div class="settings-card glass-panel location-empty-card">
            <span class="location-empty-text">
                Nenhuma celebração registada no mês de ${displayMonth}.
            </span>
        </div>`;
    }

    html += `</div>`;
    return html;
}

export function updateUIBlocks(events, hdate, locationName, sunsetTime, isIsrael) {
    applySolarTheme();
    // Atualiza os cartões de literatura judaica com a transição sincronizada ao pôr do sol
    applyDailyReadingsToCards(new Date(), sunsetTime);
    const now = new Date().getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    const upcomingParasha = events.find(e =>
        e.raw.category === 'parashat' && (e.time + twentyFourHoursMs) > now
    );
    const elParasha = document.getElementById('card-parasha');
    const elParashaSubtitle = document.getElementById('card-parasha-subtitle');
    const elTorah = document.getElementById('card-torah');
    const elHaftara = document.getElementById('card-haftara');
    const elKetuvim = document.getElementById('card-ketuvim');
    const elDate = document.getElementById('card-hdate');

    const activeFestival = findActiveFestival(events, now, twentyFourHoursMs, FESTIVAL_CATS);

    // Determinação dos 3 estados no card de leitura para períodos festivos:
    // 1. "Keriat HaMoed" (dias solenes/Yom Tov bíblico da Torá)
    // 2. "Chol HaMoed" (dias intermédios)
    // 3. "Chutz laAretz" (segundo dia festivo / dia adicional na Diáspora)
    let festivalReadingState = null;

    if (hdate && hdate.hd && hdate.hm) {
        const d = parseInt(hdate.hd, 10);
        const m = (hdate.hm || '').toLowerCase();

        if (m.includes('nisan') || m.includes('aviv')) {
            if (d === 15 || d === 21) {
                festivalReadingState = 'Keriat HaMoed';
            } else if (d >= 16 && d <= 20) {
                festivalReadingState = 'Chol HaMoed';
            } else if (d === 22 && !isIsrael) {
                festivalReadingState = 'Chutz laAretz';
            }
        } else if (m.includes('sivan')) {
            if (d === 6) {
                festivalReadingState = 'Keriat HaMoed';
            } else if (d === 7 && !isIsrael) {
                festivalReadingState = 'Chutz laAretz';
            }
        } else if (m.includes('tishrei') || m.includes('etanim')) {
            if (d === 1) {
                festivalReadingState = 'Keriat HaMoed';
            } else if (d === 2 && !isIsrael) {
                festivalReadingState = 'Chutz laAretz';
            } else if (d === 10) {
                festivalReadingState = 'Keriat HaMoed';
            } else if (d === 15) {
                festivalReadingState = 'Keriat HaMoed';
            } else if (d >= 16 && d <= 21) {
                festivalReadingState = 'Chol HaMoed';
            } else if (d === 22) {
                festivalReadingState = 'Keriat HaMoed';
            } else if (d === 23 && !isIsrael) {
                festivalReadingState = 'Chutz laAretz';
            }
        }
    }

    if (!festivalReadingState && activeFestival) {
        const idx = activeFestival.dayIndex;
        if (activeFestival.category === 'matzot') {
            if (idx === 0 || idx === 6) festivalReadingState = 'Keriat HaMoed';
            else if (idx >= 1 && idx <= 5) festivalReadingState = 'Chol HaMoed';
            else if (idx >= 7 && !isIsrael) festivalReadingState = 'Chutz laAretz';
        } else if (activeFestival.category === 'sukkot') {
            if (idx === 0) festivalReadingState = 'Keriat HaMoed';
            else if (idx >= 1 && idx <= 6) festivalReadingState = 'Chol HaMoed';
        } else if (activeFestival.category === 'shavuot') {
            if (idx === 0) festivalReadingState = 'Keriat HaMoed';
            else if (idx >= 1 && !isIsrael) festivalReadingState = 'Chutz laAretz';
        } else if (activeFestival.category === 'sheminiatzeret') {
            if (idx === 0) festivalReadingState = 'Keriat HaMoed';
            else if (idx >= 1 && !isIsrael) festivalReadingState = 'Chutz laAretz';
        } else if (activeFestival.category === 'simchattorah') {
            if (!isIsrael) festivalReadingState = 'Chutz laAretz';
        } else if (['pesach', 'yomteruah', 'yomkippur'].includes(activeFestival.category)) {
            festivalReadingState = 'Keriat HaMoed';
        }
    }

    let actualParashaName = '';
    if (upcomingParasha && upcomingParasha.raw && upcomingParasha.raw.title) {
        actualParashaName = upcomingParasha.raw.title
            .replace(/^(?:Parashat|Parashá|Parashah|Parasha)\s+/i, '')
            .replace(/[\u2018\u2019]/g, "'")
            .trim();
    }

    if (elParasha) {
        if (festivalReadingState) {
            elParasha.textContent = festivalReadingState;
        } else {
            elParasha.textContent = formatTwoWordParasha(actualParashaName || '-');
        }
    }
    if (elParashaSubtitle) {
        elParashaSubtitle.textContent = festivalReadingState ? 'Leitura Festiva' : 'Parashá Semanal';
    }

    const nearFestival = findActiveFestival(events, now, twentyFourHoursMs, Object.keys(FESTIVAL_TORAH_READINGS));

    const elParashaWrapper = document.getElementById('card-parasha-wrapper');
    if (elParashaWrapper && elParasha) {
        let pName = elParasha.textContent;
        let torahRef = '';
        let haftaraRef = '';

        if (nearFestival) {
            torahRef = pickReading(FESTIVAL_TORAH_READINGS[nearFestival.category], nearFestival.dayIndex) || '';
            haftaraRef = pickReading(FESTIVAL_HAFTARA_READINGS[nearFestival.category], nearFestival.dayIndex) || '';
        } else if (upcomingParasha && upcomingParasha.raw && upcomingParasha.raw.leyning) {
            const ley = upcomingParasha.raw.leyning;
            torahRef = ley.torah || '';
            const hOptions = [ley.haftarah, ley.haftarah_sephardic, ley.haftarah_chabad, ley.haftarah_teiman, ley.haftarah_itali].filter(Boolean);
            haftaraRef = (hOptions[0] || '').split(' | ')[0].trim();
        }

        const modalTitle = formatTwoWordParasha(pName);

        elParashaWrapper.classList.add('info-trigger');
        elParashaWrapper.setAttribute('data-info-title', modalTitle);

        let parashaSummary = (actualParashaName ? getParashaSummary(actualParashaName) : null) || 
                             getParashaSummary(pName) || 
                             (festivalReadingState ? getParashaSummary(festivalReadingState) : null);

        let contentHtml = '';

        if (parashaSummary) {
            const paragraphs = Array.isArray(parashaSummary) ? parashaSummary : [parashaSummary];
            contentHtml = `
                <div class="modal-reading-narrative modal-reading-narrative-spaced">
                    ${paragraphs.map(p => `
                        <p>
                            ${formatHebrewInText(p)}
                        </p>
                    `).join('')}
                </div>
            `;
        } else {
            contentHtml = `
                <div class="modal-reading-narrative modal-reading-narrative-spaced">
                    <p>
                        A leitura pública da Torá e dos Profetas constitui o coração litúrgico da vida de Israel, conectando a congregação aos preceitos divinos, aos ensinamentos eternos e à memória da Aliança.
                    </p>
                </div>
            `;
        }

        elParashaWrapper.setAttribute('data-info-html', contentHtml);
    }

    if (elTorah) {
        let tRef = '';
        if (nearFestival) {
            tRef = pickReading(FESTIVAL_TORAH_READINGS[nearFestival.category], nearFestival.dayIndex) || '';
        } else if (upcomingParasha && upcomingParasha.raw && upcomingParasha.raw.leyning) {
            tRef = upcomingParasha.raw.leyning.torah || '';
        }
        const torahWrapper = document.getElementById('card-torah-wrapper');
        const englishRef = toEnglishRef(tRef);
        torahWrapper?.setAttribute('data-ref', englishRef || tRef);

        const firstSec = (tRef || '').split(';')[0].trim();
        const displayTorah = formatCardTwoWords(transliterateTorah(firstSec), 'Gênesis');
        elTorah.textContent = displayTorah;

        const elTorahSub = document.getElementById('card-torah-subtitle') || torahWrapper?.querySelector('.settings-card-desc');
        if (elTorahSub) elTorahSub.textContent = 'Porção da Torá';
    }

    if (elHaftara) {
        let hRef = '';
        if (nearFestival) {
            hRef = pickReading(FESTIVAL_HAFTARA_READINGS[nearFestival.category], nearFestival.dayIndex) || '';
        } else if (upcomingParasha && upcomingParasha.raw && upcomingParasha.raw.leyning) {
            const ley = upcomingParasha.raw.leyning;
            const hOptions = [ley.haftarah, ley.haftarah_sephardic, ley.haftarah_chabad, ley.haftarah_teiman, ley.haftarah_itali].filter(Boolean);
            hRef = (hOptions[0] || '').split(' | ')[0].trim();
        }
        const haftaraWrapper = document.getElementById('card-haftara-wrapper');
        const englishHaftaraRef = toEnglishRef(hRef);
        haftaraWrapper?.setAttribute('data-ref', englishHaftaraRef || hRef);

        elHaftara.textContent = formatHaftaraTwoWords(hRef, 'Profetas');

        const elHaftaraSub = document.getElementById('card-haftara-subtitle') || haftaraWrapper?.querySelector('.settings-card-desc');
        if (elHaftaraSub) elHaftaraSub.textContent = 'Leitura dos Profetas';
    }

    if (elKetuvim) {
        let kRef = '';
        if (nearFestival && FESTIVAL_TEHILIM[nearFestival.category]) {
            const arr = FESTIVAL_TEHILIM[nearFestival.category];
            kRef = arr[nearFestival.dayIndex % arr.length];
        } else {
            const hYear = hdate?.hy || 5786;
            const hMonth = hdate?.hm || 'Nisan';
            const hDay = hdate?.hd || 1;

            const seed = (hYear * 10000) + (hMonth.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 100) + hDay;
            const rng = new LCG(seed);

            const isFestivalTime = !!activeFestival;
            if (isFestivalTime && FESTIVAL_TEHILIM[activeFestival.category]) {
                const arr = FESTIVAL_TEHILIM[activeFestival.category];
                kRef = arr[rng.nextInt(0, arr.length - 1)];
            } else {
                const pick = rng.nextInt(0, KETUVIM_TOTAL_WEIGHT - 1);
                let currentWeight = 0;
                let selectedBook = KETUVIM_BOOKS[0];

                for (const book of KETUVIM_BOOKS) {
                    currentWeight += book.weight;
                    if (pick < currentWeight) {
                        selectedBook = book;
                        break;
                    }
                }

                if (selectedBook.name === 'Tehilim') {
                    const chapter = AVAILABLE_TEHILIM[rng.nextInt(0, AVAILABLE_TEHILIM.length - 1)];
                    kRef = `Tehilim ${chapter}`;
                } else if (selectedBook.name === 'Divrei Hayamim') {
                    const totalCh = selectedBook.chapters;
                    const ch = rng.nextInt(1, totalCh);
                    if (ch <= 29) {
                        kRef = `I Divrei Hayamim ${ch}`;
                    } else {
                        kRef = `II Divrei Hayamim ${ch - 29}`;
                    }
                } else {
                    const chapter = rng.nextInt(1, selectedBook.chapters);
                    kRef = `${selectedBook.name} ${chapter}`;
                }
            }
        }

        const ketuvimWrapper = document.getElementById('card-ketuvim-wrapper');
        const englishKetuvimRef = toEnglishRef(kRef);
        ketuvimWrapper?.setAttribute('data-ref', englishKetuvimRef || kRef);

        elKetuvim.textContent = formatCardTwoWords(transliterateTorah(kRef), 'Salmos');

        const elKetuvimSub = document.getElementById('card-ketuvim-subtitle') || ketuvimWrapper?.querySelector('.settings-card-desc');
        if (elKetuvimSub) elKetuvimSub.textContent = 'Escritos Sagrados';
    }

    if (elDate && hdate) {
        let displayMonth = HEBREW_MONTHS_MAP[hdate.hm] || hdate.hm;
        elDate.textContent = `${hdate.hd} ${displayMonth}`;

        const hdateWrapper = document.getElementById('card-hdate-wrapper');
        if (hdateWrapper) {
            hdateWrapper.classList.add('info-trigger');
            hdateWrapper.setAttribute('data-info-title', `${hdate.hd} ${displayMonth}`);
            const calHtml = generateCalendarHTML(events, hdate, now);
            hdateWrapper.setAttribute('data-info-html', calHtml);

            const elDateSub = document.getElementById('card-hdate-subtitle') || hdateWrapper.querySelector('.settings-card-desc');
            if (elDateSub) {
                elDateSub.textContent = 'Data Hebraica';
            }
        }

        const desktopHdatePill = document.getElementById('desktop-header-hdate-pill');
        const desktopHdateText = document.getElementById('desktop-header-hdate-text');
        if (desktopHdateText) {
            desktopHdateText.textContent = `${hdate.hd} ${displayMonth} ${hdate.hy || ''}`.trim();
        }
        if (desktopHdatePill) {
            desktopHdatePill.classList.add('info-trigger');
            desktopHdatePill.setAttribute('data-info-title', `${hdate.hd} ${displayMonth}`);
            const calHtml = generateCalendarHTML(events, hdate, now);
            desktopHdatePill.setAttribute('data-info-html', calHtml);
        }
    }

    const allLocEls = document.querySelectorAll('#card-local, #desktop-card-local, .loc-name-display');
    allLocEls.forEach(el => {
        if (el) {
            el.textContent = formatLocationCityCountry(locationName);
            const parent = el.closest('.location-text-wrap') || el.parentElement;
            if (parent) {
                const countryEl = parent.querySelector('.country-subtitle, .settings-card-desc');
                if (countryEl) {
                    countryEl.textContent = 'Localização Atual';
                }
            }
        }
    });

    const activeTz = state.userLocation?.tz || 'Asia/Jerusalem';
    const locDateParts = getLocationDateParts(now, activeTz);

    const elGreeting = document.getElementById('dashboard-greeting');
    if (elGreeting) {
        const dayOfWeek = locDateParts.dayOfWeek;

        let isShabbat = false;
        if (dayOfWeek === 5) {
            const candleLighting = sunsetTime ? (sunsetTime - (isIsrael ? 40 : 18) * 60 * 1000) : 0;
            if (candleLighting > 0 && now >= candleLighting) isShabbat = true;
        } else if (dayOfWeek === 6) {
            const havdalahTime = sunsetTime ? (sunsetTime + 45 * 60 * 1000) : 0;
            if (havdalahTime > 0 && now <= havdalahTime) isShabbat = true;
        }

        const isMotzeiShabbat = (dayOfWeek === 6 && !isShabbat);

        if (isShabbat) {
            if (activeFestival) {
                const isKippur = activeFestival.category === 'yomkippur' || (activeFestival.name && activeFestival.name.toLowerCase().includes('kippur'));
                elGreeting.textContent = isKippur ? 'Gmar Tov' : 'Shabbat Shalom';
            } else {
                elGreeting.textContent = 'Shabbat Shalom';
            }
        } else if (isMotzeiShabbat) {
            elGreeting.textContent = 'Shavua Tov';
        } else if (activeFestival) {
            const isKippur = activeFestival.category === 'yomkippur' || (activeFestival.name && activeFestival.name.toLowerCase().includes('kippur'));
            elGreeting.textContent = isKippur ? 'Gmar Tov' : 'Chag Sameach';
        } else {
            const h = locDateParts.hour;
            if (h >= 5 && h < 12) {
                elGreeting.textContent = 'Boker Tov';
            } else if (h >= 12 && h < 18) {
                elGreeting.textContent = 'Tzoharayim Tovim';
            } else {
                elGreeting.textContent = 'Laila Tov';
            }
        }
    }

    const elGregorian = document.getElementById('dashboard-gregorian-date');
    if (elGregorian) {
        const simTime = state.simulatedTime || (state.simulatedGregorianDate ? new Date(state.simulatedGregorianDate).getTime() : 0);
        const timeToUse = (state.isSimulation && simTime)
            ? simTime
            : now;
        const gregParts = getLocationDateParts(timeToUse, activeTz);
        const dNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const mNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const dayStr = dNames[gregParts.dayOfWeek];
        const numDay = String(gregParts.day).padStart(2, '0');
        const monthStr = mNames[gregParts.month - 1];
        elGregorian.textContent = `${dayStr}, ${numDay} ${monthStr}`;
    }

    renderSupportCards(events, hdate, sunsetTime, isIsrael);

    const wrappers = [
        document.getElementById('card-parasha-wrapper'),
        document.getElementById('card-torah-wrapper'),
        document.getElementById('card-haftara-wrapper'),
        document.getElementById('card-ketuvim-wrapper'),
        document.getElementById('card-hdate-wrapper'),
        document.getElementById('card-local-vigente'),
        document.getElementById('card-sefaria-single')
    ];
    removeNotReadyState(wrappers);

    if (events && events.length > 0) {
        const remainingSkeletons = document.querySelectorAll('.not-ready');
        removeNotReadyState(remainingSkeletons);
    }
    updateShaahZmanitCardPosition();
}

export function initStudyTabs() {
    if (typeof document === 'undefined') return;
    const targetMap = {
        torah: 'card-torah-wrapper',
        haftara: 'card-haftara-wrapper',
        ketuvim: 'card-ketuvim-wrapper',
        sefaria: 'card-sefaria-single'
    };

    const selectorBar = document.querySelector('.study-selector-bar, .study-segmented-tabs');
    if (!selectorBar) {
        Object.values(targetMap).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('is-hidden');
        });
        return;
    }

    if (selectorBar.dataset.initialized) return;
    selectorBar.dataset.initialized = 'true';

    selectorBar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-study-target]');
        if (!btn) return;
        const target = btn.getAttribute('data-study-target');
        if (!target) return;

        selectorBar.querySelectorAll('[data-study-target]').forEach(b => {
            const isActive = (b === btn);
            b.classList.toggle('active', isActive);
            b.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        const activeCardId = targetMap[target];
        const allCardIds = Object.values(targetMap);

        allCardIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.toggle('is-hidden', id !== activeCardId);
            }
        });

        trackHeartEvent('study_tab_change', { target });
    });
}

export function initUtilities() {
    initThemeSwitcher();
    initSolarArc();
    initZmanimModal();
    initAppNavigation();
    initShareListeners();
    initStudyTabs();
}

export function renderEvents() {
    if (typeof document === 'undefined') return;
    const grid = document.getElementById('upcoming-events-grid');
    if (!grid) return;

    const now = new Date().getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    function formatTitle(name) {
        return formatTwoWordTitle(name);
    }

    function formatSubtitle(evt) {
        const isIsrael = state.userLocation?.isIsrael ?? true;
        return formatTwoWordSubtitle(evt, isIsrael);
    }

    const shabbatEvent = getNextShabbatEvent(now, state.currentSunsetTime);

    const SPECIAL_SHABBAT_NAMES = [
        'shabbat shekalim',
        'shabbat zachor',
        'shabbat parah',
        'shabbat hachodesh',
        'shabbat chodesh',
        'shabbat hagadol',
        'shabbat gadol',
        'shabbat shirah',
        'shabbat chazon',
        'shabbat nachamu',
        'shabbat shuva',
        'shabbat shuvah'
    ];

    const matchingSpecialShabbat = (state.unifiedEvents || []).find(evt => {
        if (!evt || !evt.name) return false;
        const nm = evt.name.toLowerCase();
        const cat = (evt.category || '').toLowerCase();
        const isSpecial = SPECIAL_SHABBAT_NAMES.some(s => nm.includes(s) || cat.includes(s.replace(/\s+/g, ''))) || isSpecialShabbatEvent(evt);
        if (!isSpecial) return false;

        return Math.abs(evt.time - shabbatEvent.time) <= 36 * 60 * 60 * 1000;
    });

    let specialShabbatEvent = null;
    if (matchingSpecialShabbat) {
        const canonicalName = getSpecialShabbatCanonicalName(matchingSpecialShabbat);
        const specialTitle = formatTitle(canonicalName);
        specialShabbatEvent = {
            ...matchingSpecialShabbat,
            name: canonicalName,
            twoWordTitle: specialTitle,
            category: matchingSpecialShabbat.category || 'shabbat',
            isBiblical: false,
            isTraditional: true,
            time: shabbatEvent.time,
            endTime: shabbatEvent.endTime,
            raw: matchingSpecialShabbat.raw || shabbatEvent.raw
        };
    }

    const validEvents = (state.unifiedEvents || []).filter(evt => {
        if (!evt || !evt.name) return false;
        if ((evt.time + twentyFourHoursMs) < now) return false;
        if (evt.category === 'parashat' || evt.category === 'omer') return false;
        if (evt.name.includes('laOmer')) return false;

        if (matchingSpecialShabbat && (evt === matchingSpecialShabbat || (isSpecialShabbatEvent(evt) && Math.abs(evt.time - shabbatEvent.time) <= 36 * 60 * 60 * 1000))) return false;
        if (evt.name.toLowerCase() === 'yom shabbat') return false;

        return true;
    });

    validEvents.push(shabbatEvent);
    if (specialShabbatEvent) {
        validEvents.push(specialShabbatEvent);
    }

    validEvents.sort((a, b) => {
        if (a.time !== b.time) return a.time - b.time;
        if (a.isBiblical !== b.isBiblical) return (b.isBiblical ? 1 : 0) - (a.isBiblical ? 1 : 0);
        return a.name.localeCompare(b.name);
    });

    const unique = [];
    const seenTitles = new Set();
    const maxUpcomingCards = matchingSpecialShabbat ? 6 : 5;

    for (const evt of validEvents) {
        const title = formatTitle(evt.name);
        if (seenTitles.has(title)) continue;
        seenTitles.add(title);
        unique.push({ ...evt, twoWordTitle: title });
        if (unique.length >= maxUpcomingCards) break;
    }

    const FALLBACK_FESTIVALS = [
        { name: 'Yom Shabbat', category: 'shabbat', isBiblical: true, hdate: 'Sétimo Dia' },
        { name: 'Yom Teruah', category: 'yomteruah', isBiblical: true, hdate: '1 Etanim', month: 'Setembro' },
        { name: 'Tzom Gedaliah', category: 'fast', isTraditional: true, hdate: '3 Etanim', month: 'Setembro' },
        { name: 'Yom Kippur', category: 'yomkippur', isBiblical: true, hdate: '10 Etanim', month: 'Outubro' },
        { name: 'Chag Sukkot', category: 'sukkot', isBiblical: true, hdate: '15-21 Etanim', month: 'Outubro' },
        { name: 'Shemini Atzeret', category: 'sheminiatzeret', isBiblical: true, hdate: '22 Etanim', month: 'Outubro' },
        { name: 'Chag Chanukah', category: 'chanukah', isTraditional: true, hdate: '25 Kislev - 2 Tevet', month: 'Dezembro' },
        { name: 'Yom Purim', category: 'purim', isTraditional: true, hdate: '14 Adar', month: 'Março' },
        { name: 'Yom Pessach', category: 'pesach', isBiblical: true, hdate: '14 Aviv', month: 'Abril' },
        { name: 'Chag Matzot', category: 'matzot', isBiblical: true, hdate: '15-21 Aviv', month: 'Abril' },
        { name: 'Yom Shavuot', category: 'shavuot', isBiblical: true, hdate: '6 Sivan', month: 'Junho' }
    ];

    while (unique.length < maxUpcomingCards) {
        const nextFallback = FALLBACK_FESTIVALS.find(f => !seenTitles.has(f.name));
        if (!nextFallback) break;
        seenTitles.add(nextFallback.name);
        unique.push({
            name: nextFallback.name,
            twoWordTitle: nextFallback.name,
            category: nextFallback.category,
            isBiblical: nextFallback.isBiblical,
            isTraditional: nextFallback.isTraditional,
            month: nextFallback.month,
            raw: { hdate: nextFallback.hdate }
        });
    }

    const descKeysCount = Object.keys(FESTIVAL_DESCRIPTIONS).length;
    const eventsFingerprint = `${unique.map(e => `${e.twoWordTitle}_${e.time || ''}_${e.month || ''}`).join(';;')}__desc:${descKeysCount}`;
    if (grid.dataset.renderedEventsKey === eventsFingerprint && grid.children.length === unique.length) {
        startTimers();
        return;
    }

    grid.innerHTML = '';
    grid.dataset.renderedEventsKey = eventsFingerprint;

    const fragment = document.createDocumentFragment();

    unique.forEach(evt => {
        const twoWordTitle = evt.twoWordTitle;
        const twoWordDesc = formatSubtitle(evt);

        const rawIcon = getEventIcon(evt.category, evt.name, '');
        const classMatch = rawIcon.match(/class="([^"]+)"/);
        let iconClass = classMatch ? classMatch[1] : ICONS.starOfDavid;

        const isRabbinic = !evt.isBiblical || evt.isTraditional || twoWordDesc === 'Lei Rabínica' || evt.category === 'fast';
        if (isRabbinic) {
            const isShabbatSpecial = evt.name.toLowerCase().includes('shabbat') || twoWordTitle.toLowerCase().includes('shabbat');
            iconClass = isShabbatSpecial ? ICONS.candles : ICONS.starOfDavid;
        }

        let baseName = evt.name;
        if (evt.name.includes('laOmer')) baseName = 'Sefirat Omer';
        else if (evt.name.includes('Hanukkah') || evt.name.includes('Chanukah')) baseName = 'Chag Hanukkah';
        else if (evt.name === 'Shabbat Shuva' || evt.name === 'Shabbat Shuvah') baseName = 'Shabbat Shuvah';
        else if (evt.name === 'Shabbat Gadol' || evt.name === 'Shabbat HaGadol') baseName = 'Shabbat HaGadol';
        else if (evt.name === 'Shabbat Chodesh' || evt.name === 'Shabbat HaChodesh') baseName = 'Shabbat HaChodesh';

        const festivalData = getFestivalDescription(baseName) || getFestivalDescription(evt.twoWordTitle) || getFestivalDescription(evt.name) || FESTIVAL_DESCRIPTIONS[baseName] || FESTIVAL_DESCRIPTIONS[evt.twoWordTitle] || FESTIVAL_DESCRIPTIONS[evt.name];
        const defaultDesc = 'Esta é uma data sagrada no calendário da Torá. O seu significado está relacionado com as ordenanças divinas e ensinamentos perpétuos de Israel.';

        const infoHtml = createDescriptionCardHTML(festivalData, defaultDesc);

        const isSpecial = evt.isBiblical || (evt.name && evt.name.toLowerCase().includes('shabbat')) || twoWordTitle.toLowerCase().includes('shabbat');
        const card = document.createElement('div');
        card.className = `settings-card event-card glass-panel info-trigger ${isSpecial ? 'special-card' : ''}`;
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('data-info-title', twoWordTitle);
        card.setAttribute('data-info-html', infoHtml);
        card.setAttribute('aria-label', twoWordTitle);

        const initialCountdown = evt.time
            ? formatTimeRemaining(evt.time - now, evt.time)
            : (evt.month ? `Em ${evt.month}` : `Em ${GREGORIAN_MONTHS_PT[new Date().getMonth()]}`);

        card.innerHTML = `
            <div class="settings-card-left">
                <i class="${iconClass} settings-icon"></i>
                <div class="settings-card-text">
                    <span class="settings-card-title">${twoWordTitle}</span>
                    <span class="settings-card-desc timer-countdown" data-time="${evt.time || ''}" data-end="${evt.endTime || (evt.time ? evt.time + 24 * 60 * 60 * 1000 : '')}" data-month="${evt.month || ''}">${initialCountdown}</span>
                </div>
            </div>
            <div class="card-arrow-action" aria-hidden="true">
                <i class="fa-solid fa-arrow-right"></i>
            </div>
        `;

        fragment.appendChild(card);
    });

    grid.appendChild(fragment);

    removeNotReadyState(document.querySelectorAll('.not-ready'));

    startTimers();
    initUtilities();
    updateShaahZmanitCardPosition();
    renderHomeProducts();
}
