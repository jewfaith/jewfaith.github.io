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
    HEBREW_MONTHS_PT
} from '../../domain/constants.js';
import { getParashaSummary } from '../../domain/parashot.js';
import { LCG, getStringSimilarity } from '../../utils/math.js';
import { getEventIcon, ICONS } from '../icons.js';
import { startTimers, formatTimeRemaining, GREGORIAN_MONTHS_PT } from '../timers.js';
import { initSolarArc, updateSolarPosition } from '../solarArc.js';
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
    toEnglishRef
} from '../../domain/formatters.js';
import { createSkeletonCardsHTML } from '../components/skeleton.js';
import { showShareToast, shareAppUrl, initShareListeners } from '../components/shareModal.js';
import { renderSupportCards } from '../components/supportCard.js';
import { applyDailyReadingsToCards } from '../../services/sefariaService.js';

const HEBREW_MONTHS_MAP = HEBREW_MONTHS_PT;

export function createDescriptionCardHTML(festivalData, defaultText) {
    if (festivalData && typeof festivalData === 'object' && festivalData.torah) {
        const keys = ['info', 'torah', 'neviim', 'ketuvim', 'talmud', 'sod'];
        return `
            <div class="levels-container" style="display:flex; flex-direction:column;">
                ${keys.map((key, idx) => `
                    <div class="info-modal-card" style="flex-direction:column; align-items:flex-start; gap:8px; white-space:normal; overflow:visible; ${idx === keys.length - 1 ? 'border-bottom:none;' : ''}">
                        <div class="info-modal-value" style="font-weight:400; font-size: var(--font-size-sm); line-height:1.6; text-align:left; white-space:normal; overflow:visible; text-overflow:clip;">${formatHebrewInText(festivalData[key])}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (Array.isArray(festivalData)) {
        return `
            <div class="levels-container" style="display: flex; flex-direction: column; gap: 8px;">
                ${festivalData.map((description, index) => `
                    <div class="info-modal-card" style="display: flex; flex-direction: column; align-items: flex-start; ${index === festivalData.length - 1 ? '' : 'border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 8px;'}">
                        <div class="info-modal-value" style="font-weight: 400; font-size: var(--font-size-sm); line-height: 1.6; text-align: left; white-space: normal;">
                            ${formatHebrewInText(description)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    const desc = (typeof festivalData === 'string' ? festivalData : null) || defaultText;
    return `
        <div class="info-modal-card" style="margin-bottom: 0; white-space:normal; overflow:visible;">
            <div class="info-modal-value" style="font-weight: 400; font-size: var(--font-size-sm); line-height: 1.6; color: var(--text-primary); text-align: left; padding: 4px 0; white-space:normal; overflow:visible; text-overflow:clip;">${formatHebrewInText(desc)}</div>
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
                subEl.innerHTML = '<span class="skeleton-line" style="display: inline-block; width: 45%; height: 11px; border-radius: 3px;"></span>';
            }
        }
        if (titleEl) {
            titleEl.innerHTML = '<span class="skeleton-line" style="display: inline-block; width: 75%; height: 16px; border-radius: 4px;"></span>';
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

    const rabbinicList = document.getElementById('rabbinic-festivals-list');
    if (rabbinicList) {
        rabbinicList.innerHTML = createSkeletonCardsHTML(5);
    }
}

export function generateCalendarHTML(events, currentHdate, nowMs = Date.now()) {
    if (!currentHdate) return '';

    let displayMonth = HEBREW_MONTHS_MAP[currentHdate.hm] || currentHdate.hm || 'Mês';
    const currentHy = currentHdate.hy || 5786;
    const currentHd = currentHdate.hd || 1;

    let html = `<div class="calendar-modal-content" style="display: flex; flex-direction: column; gap: 10px;">`;

    let legendItems = [];

    for (const ev of events) {
        if (!ev || !ev.raw || !ev.raw.hdate) continue;

        const parts = ev.raw.hdate.split(' ');
        if (parts.length >= 3) {
            const hDay = parseInt(parts[0], 10);
            const hMonthRaw = parts.slice(1, -1).join(' ');
            const hYear = parseInt(parts[parts.length - 1], 10);

            if (hMonthRaw === currentHdate.hm && hYear === currentHy) {
                if (ev.raw && ev.raw.title && ev.raw.title.includes('Rosh Chodesh')) {
                    const titleParts = ev.raw.title.split(' ');
                    const targetMonth = titleParts.slice(2).join(' ');
                    if (targetMonth && targetMonth !== currentHdate.hm) {
                        continue;
                    }
                }
                if (ev.name) {
                    const isDup = legendItems.some(i => {
                        if (ev.name === 'Yom Shabbat') {
                            return i.name === ev.name && i.firstDay === hDay;
                        }
                        return i.name === ev.name || getStringSimilarity(i.name, ev.name) >= 0.70;
                    });

                    if (isDup && ev.name !== 'Yom Shabbat') {
                        const existingIndex = legendItems.findIndex(i => i.name === ev.name || getStringSimilarity(i.name, ev.name) >= 0.70);
                        if (existingIndex !== -1 && hDay > legendItems[existingIndex].firstDay) {
                            legendItems[existingIndex] = {
                                dayText: `${hDay}`,
                                name: ev.name,
                                isBiblical: !!ev.isBiblical,
                                category: ev.category,
                                firstDay: hDay
                            };
                        }
                    } else if (!isDup) {
                        legendItems.push({
                            dayText: `${hDay}`,
                            name: ev.name,
                            isBiblical: !!ev.isBiblical,
                            category: ev.category,
                            firstDay: hDay
                        });
                    }
                }
            }
        }
    }

    const isSpecialShabbatItem = (item) => {
        if (!item || !item.name) return false;
        const n = item.name.trim();
        return n !== 'Yom Shabbat' && (n.startsWith('Shabbat ') || (item.category && item.category.startsWith('shabbat')));
    };

    legendItems = legendItems.filter(item => {
        if (item.name === 'Yom Shabbat') {
            const hasSpecialOnSameDay = legendItems.some(other =>
                other.firstDay === item.firstDay && isSpecialShabbatItem(other)
            );
            if (hasSpecialOnSameDay) return false;
        }
        return true;
    });

    legendItems.sort((a, b) => {
        if (a.firstDay !== b.firstDay) return a.firstDay - b.firstDay;
        return (b.isBiblical ? 1 : 0) - (a.isBiblical ? 1 : 0);
    });

    const multiDayCategories = ['matzot', 'sukkot', 'hanukkah', 'omer', 'roshhashana'];
    const mergedLegend = [];
    for (const item of legendItems) {
        const last = mergedLegend[mergedLegend.length - 1];
        const isMultiDay = multiDayCategories.includes(item.category) || item.name.includes('Matzot') || item.name.includes('Sukkot');
        if (last && last.name === item.name && isMultiDay && (item.firstDay === last.lastDay + 1 || item.firstDay === last.lastDay)) {
            last.lastDay = item.firstDay;
        } else {
            mergedLegend.push({ ...item, lastDay: item.firstDay });
        }
    }

    if (mergedLegend.length > 0) {
        html += `<div class="calendar-legend">
            <ul class="legend-list" style="padding: 0; margin: 0; list-style: none; display: flex; flex-direction: column; gap: 8px;">`;
        for (const item of mergedLegend) {
            let baseName = item.name;
            if (item.name.includes('laOmer')) baseName = 'Sefirat Omer';
            else if (item.name.includes('Hanukkah')) baseName = 'Chag Hanukkah';

            const festivalData = FESTIVAL_DESCRIPTIONS[baseName] || FESTIVAL_DESCRIPTIONS[item.name];
            const defaultDesc = 'Esta é uma data significativa no calendário israelita. O seu significado está relacionado com a história, a tradição e os ensinamentos do povo de Israel, podendo envolver acontecimentos históricos, mandamentos da Torá, práticas religiosas ou outros elementos transmitidos ao longo das gerações.';
            const infoHtml = createDescriptionCardHTML(festivalData, defaultDesc);

            const safeInfoHtml = infoHtml.replace(/"/g, '&quot;');
            const itemTitle = formatCardTwoWords(item.name, 'Sagrado');
            const safeName = itemTitle.replace(/"/g, '&quot;');
            const iconClass = getFestivalIcon(item.name);
            const dateSubtitle = item.firstDay === item.lastDay ? `${item.firstDay} ${displayMonth}` : `${item.firstDay}-${item.lastDay} ${displayMonth}`;

            html += `<li class="settings-card event-card glass-panel info-trigger" 
                         data-info-title="${safeName}" 
                         data-info-html="${safeInfoHtml}" 
                         tabindex="0"
                         role="button"
                         aria-label="${safeName}"
                         style="cursor: pointer;">
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
        html += `<div class="settings-card glass-panel" style="padding: 16px 18px; border-radius: 14px; text-align: left;">
            <span style="font-size: var(--font-size-sm); line-height: 1.6; color: var(--text-primary);">
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

    if (elParasha) {
        if (festivalReadingState) {
            elParasha.textContent = festivalReadingState;
        } else {
            const rawTitle = upcomingParasha ? upcomingParasha.raw.title.replace('Parashat ', '').replace(/[\u2018\u2019]/g, "'") : '-';
            elParasha.textContent = formatTwoWordParasha(rawTitle);
        }
    }
    if (elParashaSubtitle) {
        elParashaSubtitle.textContent = festivalReadingState ? 'Leitura Especial' : 'Ciclo Anual';
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

        elParashaWrapper.classList.add('info-trigger');
        elParashaWrapper.setAttribute('data-info-title', pName);

        let parashaSummary = getParashaSummary(pName);
        let contentHtml = '';

        if (parashaSummary) {
            const paragraphs = Array.isArray(parashaSummary) ? parashaSummary : [parashaSummary];
            contentHtml = `
        <div class="levels-container" style="display:flex; flex-direction:column;">
            ${paragraphs.map((p, idx) => `
                <div class="info-modal-card" style="flex-direction:column; align-items:flex-start; gap:6px; white-space:normal; overflow:visible; ${idx === paragraphs.length - 1 ? 'border-bottom:none;' : ''}">
                    <div class="info-modal-value" style="font-weight:400; font-size: var(--font-size-sm); line-height:1.65; text-align:left; white-space:normal; overflow:visible; text-overflow:clip; color: var(--text-primary);">${formatHebrewInText(p)}</div>
                </div>
            `).join('')}
        </div>
    `;
        } else {
            contentHtml = `
                <div class="info-modal-card">
                    <div class="info-modal-value" style="font-weight: 400; font-size: var(--font-size-sm); line-height: 1.6; text-align: left;">Porção da Torá: ${transliterateTorah(torahRef) || '-'}</div>
                </div>
                <div class="info-modal-card">
                    <div class="info-modal-value" style="font-weight: 400; font-size: var(--font-size-sm); line-height: 1.6; text-align: left;">Haftará: ${transliterateTorah(haftaraRef) || '-'}</div>
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
        if (elTorahSub) elTorahSub.textContent = 'Lei Escrita';
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
        if (elHaftaraSub) elHaftaraSub.textContent = 'Olhar Futuro';
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
        if (elKetuvimSub) elKetuvimSub.textContent = 'Escrito Sagrado';
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
                elDateSub.textContent = `Ano ${hdate.hy || 5786}`;
            }
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
                    countryEl.textContent = 'Local selecionado';
                }
            }
        }
    });

    const elGreeting = document.getElementById('dashboard-greeting');
    if (elGreeting) {
        const nowDate = new Date(now);
        const dayOfWeek = nowDate.getDay();

        let sunsetH = 18;
        let sunsetM = 0;
        if (sunsetTime) {
            const sDate = new Date(sunsetTime);
            if (!isNaN(sDate.getTime())) {
                sunsetH = sDate.getHours();
                sunsetM = sDate.getMinutes();
            }
        }

        let isShabbat = false;
        if (dayOfWeek === 5) {
            const candleLighting = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), sunsetH, sunsetM - 18, 0).getTime();
            if (now >= candleLighting) isShabbat = true;
        } else if (dayOfWeek === 6) {
            const havdalahTime = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), sunsetH, sunsetM + 45, 0).getTime();
            if (now <= havdalahTime) isShabbat = true;
        }

        const isErevShabbat = (dayOfWeek === 5 && !isShabbat);
        const isMotzeiShabbat = (dayOfWeek === 6 && !isShabbat);

        if (isShabbat || isErevShabbat) {
            if (activeFestival) {
                const isKippur = activeFestival.category === 'yomkippur' || (activeFestival.name && activeFestival.name.toLowerCase().includes('kippur'));
                elGreeting.textContent = isKippur ? 'Gmar Chatimah Tovah & Shabbat Shalom' : 'Shabbat Shalom & Chag Sameach';
            } else {
                elGreeting.textContent = 'Shabbat Shalom';
            }
        } else if (isMotzeiShabbat) {
            elGreeting.textContent = 'Shavua Tov';
        } else if (activeFestival) {
            const isKippur = activeFestival.category === 'yomkippur' || (activeFestival.name && activeFestival.name.toLowerCase().includes('kippur'));
            elGreeting.textContent = isKippur ? 'Gmar Chatimah Tovah' : 'Chag Sameach';
        } else {
            const h = nowDate.getHours();
            if (h >= 5 && h < 12) {
                elGreeting.textContent = 'Boker Tov';
            } else if (h >= 12 && h < 18) {
                elGreeting.textContent = 'Tzoharayim Tovim';
            } else {
                elGreeting.textContent = 'Erev Tov';
            }
        }
    }

    const elGregorian = document.getElementById('dashboard-gregorian-date');
    if (elGregorian) {
        const dateToUse = (state.isSimulation && state.simulatedGregorianDate)
            ? new Date(state.simulatedGregorianDate)
            : new Date(now);
        const dNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const mNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const dayStr = dNames[dateToUse.getDay()];
        const numDay = String(dateToUse.getDate()).padStart(2, '0');
        const monthStr = mNames[dateToUse.getMonth()];
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
}

export function initUtilities() {
    initThemeSwitcher();
    initSolarArc();
    initZmanimModal();
    initAppNavigation();
    initShareListeners();
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

    let shabbatEvent = getNextShabbatEvent(now, state.currentSunsetTime);

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
        const isSpecial = SPECIAL_SHABBAT_NAMES.some(s => nm.includes(s) || cat.includes(s.replace(/\s+/g, '')));
        if (!isSpecial) return false;

        return Math.abs(evt.time - shabbatEvent.time) <= 36 * 60 * 60 * 1000;
    });

    if (matchingSpecialShabbat) {
        const specialTitle = formatTitle(matchingSpecialShabbat.name);
        shabbatEvent = {
            ...shabbatEvent,
            name: specialTitle,
            twoWordTitle: specialTitle,
            category: matchingSpecialShabbat.category || 'shabbat',
            isBiblical: false,
            isTraditional: true,
            raw: matchingSpecialShabbat.raw || shabbatEvent.raw
        };
    }

    const validEvents = (state.unifiedEvents || []).filter(evt => {
        if (!evt || !evt.name) return false;
        if ((evt.time + twentyFourHoursMs) < now) return false;
        if (evt.category === 'parashat' || evt.category === 'omer') return false;
        if (evt.name.includes('laOmer')) return false;

        if (matchingSpecialShabbat && evt === matchingSpecialShabbat) return false;
        if (evt.name.toLowerCase() === 'yom shabbat') return false;

        return true;
    });

    validEvents.push(shabbatEvent);
    validEvents.sort((a, b) => a.time - b.time);

    const unique = [];
    const seenTitles = new Set();

    for (const evt of validEvents) {
        const title = formatTitle(evt.name);
        if (seenTitles.has(title)) continue;
        seenTitles.add(title);
        unique.push({ ...evt, twoWordTitle: title });
        if (unique.length >= 5) break;
    }

    const FALLBACK_FESTIVALS = [
        { name: 'Yom Shabbat', category: 'shabbat', isBiblical: true, hdate: 'Sétimo Dia' },
        { name: 'Yom Teruah', category: 'yomteruah', isBiblical: true, hdate: '01 Eitanim', month: 'Setembro' },
        { name: 'Tzom Gedaliah', category: 'fast', isTraditional: true, hdate: '03 Eitanim', month: 'Setembro' },
        { name: 'Yom Kippur', category: 'yomkippur', isBiblical: true, hdate: '10 Eitanim', month: 'Outubro' },
        { name: 'Chag Sukkot', category: 'sukkot', isBiblical: true, hdate: '15-21 Eitanim', month: 'Outubro' },
        { name: 'Shemini Atzeret', category: 'sheminiatzeret', isBiblical: true, hdate: '22 Eitanim', month: 'Outubro' },
        { name: 'Chag Chanukah', category: 'chanukah', isTraditional: true, hdate: '25-2 Kislev', month: 'Dezembro' },
        { name: 'Yom Purim', category: 'purim', isTraditional: true, hdate: '14 Adar', month: 'Março' },
        { name: 'Yom Pessach', category: 'pesach', isBiblical: true, hdate: '14 Aviv', month: 'Abril' },
        { name: 'Chag Matzot', category: 'matzot', isBiblical: true, hdate: '15-21 Aviv', month: 'Abril' },
        { name: 'Yom Shavuot', category: 'shavuot', isBiblical: true, hdate: '06 Sivan', month: 'Junho' }
    ];

    while (unique.length < 5) {
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

    const eventsFingerprint = unique.map(e => `${e.twoWordTitle}_${e.time || ''}_${e.month || ''}`).join(';;');
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
        else if (evt.name.includes('Hanukkah')) baseName = 'Chag Hanukkah';

        const festivalData = FESTIVAL_DESCRIPTIONS[baseName] || FESTIVAL_DESCRIPTIONS[evt.twoWordTitle] || FESTIVAL_DESCRIPTIONS[evt.name];
        const defaultDesc = 'Esta é uma data sagrada no calendário da Torá. O seu significado está relacionado com as ordenanças divinas e ensinamentos perpétuos de Israel.';

        const infoHtml = createDescriptionCardHTML(festivalData, defaultDesc);

        const card = document.createElement('div');
        card.className = 'settings-card event-card glass-panel info-trigger';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('data-info-title', twoWordTitle);
        card.setAttribute('data-info-html', infoHtml);
        card.setAttribute('aria-label', twoWordTitle);
        card.style.cursor = 'pointer';

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
}
