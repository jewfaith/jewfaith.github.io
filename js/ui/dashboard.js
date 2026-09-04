import { state } from '../state.js';
import { applySolarTheme } from './theme.js';
import { findActiveFestival, transliterateTorah, pickReading, getNextShabbatEvent, checkSacredRestStatus } from '../domain/halacha.js';
import { FESTIVAL_CATS, FESTIVAL_TORAH_READINGS, FESTIVAL_HAFTARA_READINGS, KETUVIM_BOOKS, KETUVIM_TOTAL_WEIGHT, FESTIVAL_TEHILIM, AVAILABLE_TEHILIM, FESTIVAL_DESCRIPTIONS } from '../domain/constants.js';
import { getParashaSummary } from '../domain/parashot.js';
import { LCG, getStringSimilarity } from '../utils/math.js';
import { getEventIcon, ICONS } from './icons.js';
import { startTimers, formatTimeRemaining, GREGORIAN_MONTHS_PT } from './timers.js';
import { initSolarArc, updateSolarPosition } from './solarArc.js';
import { initZmanimModal, openZmanimModal } from './zmanimTable.js';
import { initThemeSwitcher } from './themeSwitcher.js';
import { initAppNavigation } from './appNavigation.js';
import { reopenModals } from './modals.js';
import { getFestivalIcon } from './festivalsView.js';
import { HEBREW_MONTHS_PT } from '../domain/constants.js';

const HEBREW_MONTHS_MAP = HEBREW_MONTHS_PT;

function createDescriptionCardHTML(festivalData, defaultText) {
    if (festivalData && typeof festivalData === 'object' && festivalData.torah) {
        const keys = ['info', 'torah', 'neviim', 'ketuvim', 'talmud', 'sod'];
        return `
            <div class="levels-container" style="display:flex; flex-direction:column;">
                ${keys.map((key, idx) => `
                    <div class="info-modal-card" style="flex-direction:column; align-items:flex-start; gap:8px; white-space:normal; overflow:visible; ${idx === keys.length - 1 ? 'border-bottom:none;' : ''}">
                        <div class="info-modal-value" style="font-weight:400; font-size: var(--font-size-sm); line-height:1.6; text-align:left; white-space:normal; overflow:visible; text-overflow:clip;">${festivalData[key]}</div>
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
                            ${description}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    const desc = (typeof festivalData === 'string' ? festivalData : null) || defaultText;
    return `
        <div class="info-modal-card" style="margin-bottom: 0; white-space:normal; overflow:visible;">
            <div class="info-modal-value" style="font-weight: 400; font-size: var(--font-size-sm); line-height: 1.6; color: var(--text-primary); text-align: left; padding: 4px 0; white-space:normal; overflow:visible; text-overflow:clip;">${desc}</div>
        </div>
    `;
}

function removeNotReadyState(elements) {
    elements.forEach(el => {
        if (typeof el === 'string') el = document.getElementById(el);
        if (!el) return;
        el.classList.remove('not-ready');
        const iconEl = el.querySelector('.icon-circle i');
        if (iconEl && iconEl.hasAttribute('data-original-class')) {
            iconEl.className = iconEl.getAttribute('data-original-class');
        }
    });
}

export function createSkeletonCardsHTML(count = 5) {
    const widths = ['70%', '80%', '60%', '75%', '65%'];
    let html = '';
    for (let i = 0; i < count; i++) {
        const w = widths[i % widths.length];
        html += `
            <div class="settings-card event-card glass-panel skeleton-card not-ready" aria-hidden="true">
                <div class="settings-card-left">
                    <div class="skeleton-line" style="width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; margin-right: 12px;"></div>
                    <div class="settings-card-text" style="width: 100%;">
                        <span class="skeleton-line" style="display: block; width: ${w}; height: 16px; border-radius: 4px; margin-bottom: 4px;"></span>
                        <span class="skeleton-line" style="display: block; width: 35%; height: 11px; border-radius: 3px;"></span>
                    </div>
                </div>
                <div class="skeleton-line" style="width: 7px; height: 11px; border-radius: 2px; opacity: 0.25; flex-shrink: 0;"></div>
            </div>
        `;
    }
    return html;
}

export function showDashboardSkeletons() {
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

function generateCalendarHTML(events, currentHdate) {
    if (!currentHdate) return '';

    let displayMonth = HEBREW_MONTHS_MAP[currentHdate.hm] || currentHdate.hm || 'Mês';
    const currentHy = currentHdate.hy;
    let html = `<div class="calendar-wrapper" style="display: flex; flex-direction: column; gap: 14px;">`;

    let legendItems = [];
    const gregMonths = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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
                    let gMonth = null, gDay = null;
                    if (ev.raw && ev.raw.date) {
                        const gparts = ev.raw.date.split('T')[0].split('-');
                        gMonth = parseInt(gparts[1], 10);
                        gDay = parseInt(gparts[2], 10);
                    }

                    let gregText = '';
                    if (gDay !== null) {
                        gregText = `${gDay} de ${gregMonths[gMonth - 1]}`;
                    }

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
                                gregText: gregText,
                                name: ev.name,
                                isBiblical: !!ev.isBiblical,
                                category: ev.category,
                                firstDay: hDay
                            };
                        }
                    } else if (!isDup) {
                        legendItems.push({
                            dayText: `${hDay}`,
                            gregText: gregText,
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
            if (last.gregText && item.gregText && last.gregText !== item.gregText) {
                const day1 = last.gregText.split(' ')[0];
                last.gregText = `${day1} a ${item.gregText}`;
            }
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
            const safeName = item.name.replace(/"/g, '&quot;');
            const iconClass = getFestivalIcon(item.name);
            const desc = item.isBiblical ? 'Base Toraica' : 'Lei Rabinica';

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
                        <span class="settings-card-title">${item.name}</span>
                        <span class="settings-card-desc">${desc}</span>
                    </div>
                </div>
                <i class="${ICONS.chevronRight}" data-icon="chevronRight" style="color: var(--text-muted); font-size: 11px;"></i>
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

function toEnglishRef(ref) {
    if (!ref) return '';
    let result = ref.trim();

    const dhMatch = result.match(/^(?:Divrei\s+Ha?yamim|Chronicles)\s+(\d+)(.*)$/i);
    if (dhMatch) {
        const rawCh = parseInt(dhMatch[1], 10);
        const rest = dhMatch[2] || '';
        return rawCh > 29 ? `II Chronicles ${rawCh - 29}${rest}` : `I Chronicles ${rawCh}${rest}`;
    }

    const mapping = {
        'Bereshit': 'Genesis', 'Shemot': 'Exodus', 'Vayikra': 'Leviticus',
        'Bamidbar': 'Numbers', 'Devarim': 'Deuteronomy', 'Yehoshua': 'Joshua',
        'Shoftim': 'Judges', 'II Shmuel': 'II Samuel', 'I Shmuel': 'I Samuel',
        '2 Shmuel': 'II Samuel', '1 Shmuel': 'I Samuel', 'II Melachim': 'II Kings',
        'I Melachim': 'I Kings', '2 Melachim': 'II Kings', '1 Melachim': 'I Kings',
        'Yeshayahu': 'Isaiah', 'Yirmiyahu': 'Jeremiah', 'Yechezkel': 'Ezekiel',
        'Hoshea': 'Hosea', 'Yoel': 'Joel', 'Amos': 'Amos', 'Ovadia': 'Obadiah',
        'Yona': 'Jonah', 'Micha': 'Micah', 'Nachum': 'Nahum', 'Chavakuk': 'Habakkuk',
        'Tzefania': 'Zephaniah', 'Chagai': 'Haggai', 'Zecharia': 'Zechariah',
        'Malachi': 'Malachi', 'Tehilim': 'Psalms', 'Mishlei': 'Proverbs',
        'Iyov': 'Job', 'Shir HaShirim': 'Song of Solomon', 'Ruth': 'Ruth',
        'Eichah': 'Lamentations', 'Kohelet': 'Ecclesiastes', 'Esther': 'Esther',
        'Daniel': 'Daniel', 'Ezra': 'Ezra', 'Nechemia': 'Nehemiah',
        'II Divrei Hayamim': 'II Chronicles', 'I Divrei Hayamim': 'I Chronicles',
        '2 Divrei Hayamim': 'II Chronicles', '1 Divrei Hayamim': 'I Chronicles',
        'Divrei Hayamim': 'Chronicles'
    };

    for (const [heb, eng] of Object.entries(mapping)) {
        if (result.startsWith(heb)) {
            result = eng + result.substring(heb.length);
            break;
        }
    }
    return result;
}

export function updateUIBlocks(events, hdate, locationName, sunsetTime, isIsrael) {
    applySolarTheme();
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

    let isCholHaMoed = false;
    let isExtraDay = false;
    if (activeFestival) {
        const idx = activeFestival.dayIndex;
        if (activeFestival.category === 'matzot') {
            isCholHaMoed = isIsrael ? (idx >= 1 && idx <= 5) : (idx >= 2 && idx <= 5);
        } else if (activeFestival.category === 'sukkot') {
            isCholHaMoed = isIsrael ? (idx >= 1 && idx <= 6) : (idx >= 2 && idx <= 6);
        }

        if (!isIsrael) {
            if (activeFestival.category === 'matzot') {
                isExtraDay = (idx === 7);
            } else if (activeFestival.category === 'shavuot') {
                isExtraDay = (idx === 1);
            } else if (activeFestival.category === 'simchattorah') {
                isExtraDay = true;
            }
        }
    }

    if (elParasha) {
        if (activeFestival) {
            if (isCholHaMoed) {
                elParasha.textContent = 'Chol HaMoed';
            } else if (isExtraDay) {
                elParasha.textContent = 'Chutz laAretz';
            } else {
                elParasha.textContent = 'Kriat HaMoed';
            }
        } else {
            elParasha.textContent = upcomingParasha ? upcomingParasha.raw.title.replace('Parashat ', '').replace(/[\u2018\u2019]/g, "'") : '-';
        }
    }
    if (elParashaSubtitle) {
        elParashaSubtitle.textContent = activeFestival ? 'Leitura Especial' : 'Ciclo Anual';
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
                    <div class="info-modal-value" style="font-weight:400; font-size: var(--font-size-sm); line-height:1.65; text-align:left; white-space:normal; overflow:visible; text-overflow:clip; color: var(--text-primary);">${p}</div>
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

    const elTorahWrapper = document.getElementById('card-torah-wrapper');
    if (elTorah) {
        let torahRawRef = '';
        if (nearFestival) {
            torahRawRef = pickReading(FESTIVAL_TORAH_READINGS[nearFestival.category], nearFestival.dayIndex) || '';
        } else if (upcomingParasha && upcomingParasha.raw && upcomingParasha.raw.leyning && upcomingParasha.raw.leyning.torah) {
            torahRawRef = upcomingParasha.raw.leyning.torah;
        }
        if (elTorahWrapper) {
            elTorahWrapper.setAttribute('data-ref', toEnglishRef(torahRawRef));
            const sub = elTorahWrapper.querySelector('.card-subtitle, .settings-card-desc');
            if (sub) sub.textContent = 'Lei Escrita';
        }
        elTorah.textContent = transliterateTorah(torahRawRef) || '-';
    }

    const elHaftaraWrapper = document.getElementById('card-haftara-wrapper');
    if (elHaftara) {
        let haftaraRawRef = '';
        if (nearFestival) {
            haftaraRawRef = pickReading(FESTIVAL_HAFTARA_READINGS[nearFestival.category], nearFestival.dayIndex) || '';
        } else if (upcomingParasha && upcomingParasha.raw && upcomingParasha.raw.leyning) {
            const ley = upcomingParasha.raw.leyning;
            const hOptions = [ley.haftarah, ley.haftarah_sephardic, ley.haftarah_chabad, ley.haftarah_teiman, ley.haftarah_itali].filter(Boolean);
            haftaraRawRef = (hOptions[0] || '').split(' | ')[0].trim();
        }
        if (elHaftaraWrapper) {
            elHaftaraWrapper.setAttribute('data-ref', toEnglishRef(haftaraRawRef));
            const sub = elHaftaraWrapper.querySelector('.card-subtitle, .settings-card-desc');
            const rightIcon = elHaftaraWrapper.querySelector('i:last-child');
            if (sub) sub.textContent = 'Olhar Futuro';
            elHaftaraWrapper.classList.remove('is-premium-gated');
            if (rightIcon) {
                rightIcon.className = ICONS.chevronRight;
                rightIcon.style.color = 'var(--text-muted)';
            }
        }
        elHaftara.textContent = transliterateTorah(haftaraRawRef) || '-';
    }

    const elKetuvimWrapper = document.getElementById('card-ketuvim-wrapper');
    if (elKetuvim) {
        const isAfterSunset = sunsetTime > 0 && now > sunsetTime;
        const d = new Date(now + (isAfterSunset ? 86400000 : 0));
        const stableDaySeed = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

        let ketuvimRawRef = null;
        if (nearFestival) {
            const arr = FESTIVAL_TEHILIM[nearFestival.category] || null;
            if (arr) ketuvimRawRef = arr[stableDaySeed % arr.length];
        } else if (d.getDay() === 6) {
            const arr = FESTIVAL_TEHILIM['shabbat'] || null;
            if (arr) ketuvimRawRef = arr[stableDaySeed % arr.length];
        }

        if (!ketuvimRawRef) {
            const seed1 = LCG(stableDaySeed);
            const seed2 = LCG(seed1);

            let selector = seed1 % KETUVIM_TOTAL_WEIGHT;
            let selectedBook = KETUVIM_BOOKS[0];
            for (const b of KETUVIM_BOOKS) {
                if (selector < b.weight) {
                    selectedBook = b;
                    break;
                }
                selector -= b.weight;
            }

            let chapter = (selectedBook.name === 'Tehilim')
                ? AVAILABLE_TEHILIM[seed2 % AVAILABLE_TEHILIM.length]
                : (seed2 % selectedBook.chapters) + 1;

            ketuvimRawRef = `${selectedBook.name} ${chapter}`;
        }

        let displayKetuvim = ketuvimRawRef;
        const dhMatch = ketuvimRawRef.match(/^(?:Divrei\s+Ha?yamim|Chronicles)\s+(\d+)(.*)$/i);
        if (dhMatch) {
            const rawCh = parseInt(dhMatch[1], 10);
            const rest = dhMatch[2] || '';
            displayKetuvim = rawCh > 29 ? `II Divrei Hayamim ${rawCh - 29}${rest}` : `I Divrei Hayamim ${rawCh}${rest}`;
        }

        if (elKetuvimWrapper) {
            elKetuvimWrapper.setAttribute('data-ref', toEnglishRef(displayKetuvim));
            const sub = elKetuvimWrapper.querySelector('.card-subtitle, .settings-card-desc');
            const rightIcon = elKetuvimWrapper.querySelector('i:last-child');
            if (sub) sub.textContent = 'Escrito Sagrado';
            elKetuvimWrapper.classList.remove('is-premium-gated');
            if (rightIcon) {
                rightIcon.className = ICONS.chevronRight;
                rightIcon.style.color = 'var(--text-muted)';
            }
        }
        elKetuvim.textContent = transliterateTorah(displayKetuvim) || '-';
    }

    const elDateWrapper = document.getElementById('card-hdate-wrapper');
    if (elDate) {
        let hm = hdate.hm || '';
        const displayMonth = HEBREW_MONTHS_MAP[hm] || hm;
        elDate.textContent = `${hdate.hd} de ${displayMonth}`;

        if (elDateWrapper) {
            elDateWrapper.classList.remove('not-ready');
            elDateWrapper.classList.add('info-trigger');
            elDateWrapper.setAttribute('data-info-title', `${hdate.hd} de ${displayMonth}`);
            elDateWrapper.setAttribute('data-info-html', generateCalendarHTML(events, hdate));
            const sub = elDateWrapper.querySelector('.card-subtitle, .settings-card-desc');
            if (sub) {
                sub.textContent = 'Mês Vigente';
            }
        }
    }

    const elLocalWrapper = document.getElementById('card-local-vigente');
    if (elLocalWrapper) {
        elLocalWrapper.classList.remove('not-ready');
        const sub = elLocalWrapper.querySelector('.settings-card-desc');
        if (sub) sub.textContent = 'Posição Ativa';
    }

    if (elParashaWrapper) {
        elParashaWrapper.classList.add('info-trigger');
        const sub = elParashaWrapper.querySelector('.settings-card-desc');
        if (sub) sub.textContent = 'Ciclo Anual';
    }

    if (elTorahWrapper) {
        const sub = elTorahWrapper.querySelector('.settings-card-desc');
        if (sub) sub.textContent = 'Lei Escrita';
    }

    if (elHaftaraWrapper) {
        const sub = elHaftaraWrapper.querySelector('.settings-card-desc');
        if (sub) sub.textContent = 'Olhar Futuro';
    }

    if (elKetuvimWrapper) {
        const sub = elKetuvimWrapper.querySelector('.settings-card-desc');
        if (sub) sub.textContent = 'Escrito Sagrado';
    }

    const allLocEls = document.querySelectorAll('#card-local, #desktop-card-local, .loc-name-display');
    allLocEls.forEach(el => {
        el.textContent = locationName || 'Jerusalém';
    });

    // Atualização dinâmica dos ciclos de estudo judaico (Pirkei Avot, Talmud, Mishná)
    updateSolarPosition();

    removeNotReadyState(document.querySelectorAll('.not-ready'));
    initUtilities();
    renderSupportCards(events, hdate, sunsetTime, isIsrael);
}

/**
 * Renderiza dinamicamente os cartões de apoio e créditos da barra lateral,
 * respeitando com exatidão a santidade do Shabat e Yom Tov (proibição de comércio na Torá/Halachá).
 */
export function renderSupportCards(events = null, hdate = null, sunsetTime = null, isIsrael = null) {
    const cards = document.querySelectorAll('.app-support-card');
    const sidebarCredits = document.querySelector('.sidebar-credits');
    if (!cards.length && !sidebarCredits) return;

    const evs = events || state.unifiedEvents || [];
    const hd = hdate || state.currentHdate;
    const sunset = sunsetTime || state.currentSunsetTime || 0;
    const isIsr = isIsrael ?? state.userLocation?.isIsrael ?? true;

    const restStatus = checkSacredRestStatus(Date.now(), evs, hd, sunset, isIsr);

    let cardHtml = '';
    if (restStatus.isRest) {
        const festTitle = restStatus.title || 'Yom Tov';
        const subType = restStatus.subType || 'yomtov';

        let authorFest = festTitle;
        let badgeText = 'Santidade do Tempo';
        let bodyDesc = '';
        let btnText = `Pausado (${festTitle})`;

        if (subType === 'erev_yomtov' || subType === 'erev_shabbat') {
            const isShab = subType === 'erev_shabbat';
            const cleanTitle = festTitle.replace(/\s*\(6h antes\)/, '');
            authorFest = isShab ? 'Erev Shabat' : `Erev ${cleanTitle}`;
            bodyDesc = isShab
                ? `Em preparação para o Shabat, as doações encontram-se temporariamente pausadas. Partilhar a aplicação apoia o projeto.`
                : `Em preparação para ${cleanTitle}, as doações encontram-se temporariamente pausadas. Partilhar a aplicação apoia o projeto.`;
            btnText = isShab ? `Pausado (Erev Shabat)` : `Pausado (Erev ${cleanTitle})`;
        } else if (subType === 'motzei_yomtov' || subType === 'motzei_shabbat') {
            const isShab = subType === 'motzei_shabbat';
            const cleanTitle = festTitle.replace(/\s*\(6h depois\)/, '');
            authorFest = isShab ? 'Motzei Shabat' : `Motzei ${cleanTitle}`;
            bodyDesc = isShab
                ? `Em respeito ao término do Shabat, as doações permanecem temporariamente pausadas.`
                : `Em respeito ao término de ${cleanTitle}, as doações permanecem temporariamente pausadas.`;
            btnText = isShab ? `Pausado (Motzei Shabat)` : `Pausado (Motzei ${cleanTitle})`;
        } else if (subType === 'shabbat') {
            authorFest = 'Yom Shabbat';
            bodyDesc = `Em observância ao Shabat, as doações encontram-se pausadas até à Havdalá.`;
            btnText = `Pausado (Shabat)`;
        } else {
            authorFest = festTitle;
            bodyDesc = `Em observância a ${festTitle}, as doações encontram-se temporariamente pausadas.`;
            btnText = `Pausado (${festTitle})`;
        }

        cardHtml = `
            <div class="support-mini-header">
              <div class="support-mini-author">
                <i class="fa-solid fa-menorah"></i>
                <span>Autoria de <strong>Mikhael</strong> &bull; <span class="support-mini-fest-name">${authorFest}</span></span>
              </div>
            </div>

            <p class="support-mini-desc">
              ${bodyDesc}
            </p>

            <div class="support-mini-actions">
              <button type="button" class="support-btn-primary is-disabled" disabled aria-disabled="true" title="Transações financeiras desativadas durante o período sagrado">
                <i class="fa-solid fa-lock"></i>
                <span>${btnText}</span>
              </button>
              <button type="button" class="support-btn-secondary yomtov-active app-share-trigger" aria-label="Partilhar o link do site Yisrael Date" title="Partilhar o site">
                <i class="fa-solid fa-share-nodes"></i>
                <span>Partilhar Aplicação</span>
              </button>
            </div>
        `;
    } else {
        cardHtml = `
            <div class="support-mini-header">
              <div class="support-mini-author">
                <i class="fa-solid fa-code"></i>
                <span>Autoria e Criação de <strong>Mikhael</strong></span>
              </div>
            </div>

            <p class="support-mini-desc">
              O <strong>Yisrael Date</strong> é uma obra autoral concebida e desenvolvida de forma independente por <strong>Mikhael</strong>. Se é útil no seu dia e estudo da Torá, considere apoiar a sua manutenção ou partilhar com amigos.
            </p>

            <div class="support-mini-actions">
              <a href="https://www.paypal.com/paypalme/ashkenar" target="_blank" rel="noopener noreferrer"
                class="support-btn-primary" aria-label="Apoiar Mikhael no PayPal com qualquer valor">
                <i class="fa-brands fa-paypal"></i>
                <span>Apoiar via PayPal</span>
              </a>
              <button type="button" class="support-btn-secondary app-share-trigger" aria-label="Partilhar o link do site Yisrael Date" title="Partilhar o site">
                <i class="fa-solid fa-share-nodes"></i>
                <span>Partilhar</span>
              </button>
            </div>

            <div class="support-mini-policy">
              <i class="fa-solid fa-clock-rotate-left"></i>
              <span>Doações pausadas no Shabat e em Yom Tov.</span>
            </div>
        `;
    }

    cards.forEach(card => {
        if (restStatus.isRest) {
            card.classList.add('is-sacred-rest');
            card.setAttribute('aria-label', `Apoio pausado em observância a ${restStatus.title || 'Yom Tov'}`);
        } else {
            card.classList.remove('is-sacred-rest');
            card.setAttribute('aria-label', 'Apoiar o criador');
        }
        card.innerHTML = cardHtml;
    });

    if (sidebarCredits) {
        if (restStatus.isRest) {
            const festTitle = restStatus.title || 'Yom Tov';
            sidebarCredits.innerHTML = `
                <span class="sidebar-credits-author">Autoria de <strong>Mikhael</strong></span>
                <div class="sidebar-credits-actions">
                  <button type="button" class="sidebar-share-btn app-share-trigger" aria-label="Partilhar o site" title="Partilhar Yisrael Date">
                    <i class="fa-solid fa-share-nodes"></i>
                  </button>
                  <span class="sidebar-paypal-link is-disabled" title="Doações pausadas durante ${festTitle} em observância haláchica" aria-disabled="true">
                    <i class="fa-solid fa-lock" style="font-size: 10px;"></i>
                    <span>Pausado (${festTitle})</span>
                  </span>
                </div>
            `;
        } else {
            sidebarCredits.innerHTML = `
                <span class="sidebar-credits-author">Autoria de <strong>Mikhael</strong></span>
                <div class="sidebar-credits-actions">
                  <button type="button" class="sidebar-share-btn app-share-trigger" aria-label="Partilhar o site" title="Partilhar Yisrael Date">
                    <i class="fa-solid fa-share-nodes"></i>
                  </button>
                  <a href="https://www.paypal.com/paypalme/ashkenar" target="_blank" rel="noopener noreferrer"
                    class="sidebar-paypal-link" aria-label="Apoiar Mikhael no PayPal" title="Apoiar criador no PayPal">
                    <i class="fa-brands fa-paypal"></i>
                    <span>Apoiar</span>
                    <i class="fa-solid fa-heart" style="font-size: 8px; color: #ff6b81; margin-left: 2px;"></i>
                  </a>
                </div>
            `;
        }
    }
}

if (typeof window !== 'undefined') {
    window.simulateYomTov = (simulate = true) => {
        try {
            localStorage.setItem('yisrael_simulate_yomtov', simulate ? 'true' : 'false');
        } catch (e) { }
        renderSupportCards();
    };

    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#teste-yomtov' || window.location.hash === '#yomtov-6h') {
            renderSupportCards();
        }
    });
}

// Hidratação imediata na inicialização do script (0ms)
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => renderSupportCards());
    } else {
        renderSupportCards();
    }
}

let toastTimeout = null;

export function showShareToast(message = 'Link copiado com sucesso!') {
    let toast = document.getElementById('app-share-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-share-toast';
        toast.className = 'app-share-toast';
        toast.innerHTML = '<i class="fa-solid fa-check"></i> <span class="toast-msg"></span>';
        document.body.appendChild(toast);
    }

    const msgSpan = toast.querySelector('.toast-msg');
    if (msgSpan) msgSpan.textContent = message;

    toast.classList.add('show');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2400);
}

export async function shareAppUrl() {
    const shareUrl = (window.location.origin && window.location.origin.startsWith('http') && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'))
        ? (window.location.origin + window.location.pathname)
        : 'https://jewfaith.github.io';

    const shareData = {
        title: 'Yisrael Date',
        text: 'Yisrael Date — Calendário da Torá, Horários Haláchicos (Zmanim) e Festas Bíblicas',
        url: shareUrl
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
        }
    }

    // Fallback: cópia direta para a área de transferência
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(shareUrl);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = shareUrl;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        showShareToast('Link copiado para a área de transferência!');
    } catch (e) {
        prompt('Copia o link do Yisrael Date:', shareUrl);
    }
}

let isShareInitialized = false;

export function initShareListeners() {
    if (isShareInitialized) return;
    isShareInitialized = true;

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.app-share-trigger');
        if (trigger) {
            e.preventDefault();
            e.stopPropagation();
            shareAppUrl();
        }
    });
}

let isUtilitiesInitialized = false;

export function initUtilities() {
    initThemeSwitcher();
    initSolarArc();
    initShareListeners();
    if (!isUtilitiesInitialized) {
        isUtilitiesInitialized = true;
        initZmanimModal();
        initAppNavigation();
        renderFestivalsView();

        document.getElementById('solar-arc-container')?.addEventListener('click', openZmanimModal);
    }
}

export function renderEvents() {
    const grid = document.getElementById('upcoming-events-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const now = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    function formatTwoWordTitle(name) {
        if (!name) return 'Festa Sagrada';
        let clean = name.trim();
        if (clean.includes('Shabbat') || clean.includes('Shabbos')) return 'Yom Shabbat';
        if (clean.includes('Teruah')) return 'Yom Teruah';
        if (clean.includes('Kippur')) return 'Yom Kippur';
        if (clean.includes('Sukkot')) return 'Chag Sukkot';
        if (clean.includes('Atzeret')) return 'Shemini Atzeret';
        if (clean.includes('Simchat') || clean.includes('Simchas')) return 'Simchat Torah';
        if (clean.includes('Chanukah') || clean.includes('Hanukkah')) return 'Chag Chanukah';
        if (clean.includes('BiShvat') || clean.includes('Shevat')) return 'Tu BiShvat';
        if (clean.includes('Shushan Purim')) return 'Shushan Purim';
        if (clean.includes('Purim')) return 'Yom Purim';
        if (clean.includes('Pessach Sheni') || clean.includes('Pesach Sheni')) return 'Pessach Sheni';
        if (clean.includes('Pessach') || clean.includes('Pesach')) return 'Yom Pessach';
        if (clean.includes('Matzot')) return 'Chag Matzot';
        if (clean.includes('Shavuot')) return 'Yom Shavuot';
        if (clean.includes('Lag B')) return 'Lag BaOmer';
        if (clean.includes('Tammuz') || clean.includes('Tamuz')) return 'Tzom Tamuz';
        if (clean.includes('Tisha') || clean.includes("Tish'a")) return "Tisha B'Av";
        if (clean.includes('Tu B')) return "Tu B'Av";
        if (clean.includes('Gedaliah')) return 'Tzom Gedaliah';
        if (clean.includes('Tevet')) return 'Tzom Tevet';
        if (clean.includes('Esther')) return "Ta'anit Esther";
        if (clean.includes('Rosh Hashana') || clean.includes('Rosh Hashanah')) return 'Rosh Hashana';
        if (clean.includes('Rosh Chodashim')) return 'Rosh Chodashim';
        if (clean.includes('Rosh Chodesh')) return 'Rosh Chodesh';
        if (clean.includes('Behemot')) return 'Rosh LaBehemot';
        if (clean.includes('Elul')) return 'Chodesh Elul';
        if (clean.includes('Shekalim')) return 'Shabbat Shekalim';
        if (clean.includes('Zachor')) return 'Shabbat Zachor';
        if (clean.includes('Parah')) return 'Shabbat Parah';
        if (clean.includes('Chodesh') && clean.includes('Shabbat')) return 'Shabbat Chodesh';
        if (clean.includes('Gadol') && clean.includes('Shabbat')) return 'Shabbat Gadol';
        if (clean.includes('Shirah')) return 'Shabbat Shirah';
        if (clean.includes('Chazon')) return 'Shabbat Chazon';
        if (clean.includes('Nachamu')) return 'Shabbat Nachamu';
        if (clean.includes('Shuva') || clean.includes('Shuvah')) return 'Shabbat Shuva';

        const words = clean.split(/\s+/);
        if (words.length === 2) return clean;
        if (words.length > 2) return `${words[0]} ${words[1]}`;
        return `${words[0]} Sagrado`;
    }

    function formatTwoWordSubtitle(evt) {
        if (evt.raw && evt.raw.hdate) {
            const parts = evt.raw.hdate.split(' ');
            if (parts.length >= 2) {
                const rawM = parts[1];
                const m = HEBREW_MONTHS_MAP[rawM] || rawM;
                const sub = `${parts[0]} ${m}`;
                if (sub.trim().split(/\s+/).length === 2) return sub;
            }
        }
        return evt.isBiblical ? 'Base Toraica' : 'Lei Rabinica';
    }

    // Gera o Shabbat da semana corrente ou vindouro
    let shabbatEvent = getNextShabbatEvent(now, state.currentSunsetTime);

    // Lista de termos dos Shabbatot especiais contemplados
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

    // Localiza se há algum Shabbat especial contemplado para este Shabbat específico
    const matchingSpecialShabbat = (state.unifiedEvents || []).find(evt => {
        if (!evt || !evt.name) return false;
        const nm = evt.name.toLowerCase();
        const cat = (evt.category || '').toLowerCase();
        const isSpecial = SPECIAL_SHABBAT_NAMES.some(s => nm.includes(s) || cat.includes(s.replace(/\s+/g, '')));
        if (!isSpecial) return false;

        // Ocorre na mesma janela deste Shabbat (diferença <= 36 horas)
        return Math.abs(evt.time - shabbatEvent.time) <= 36 * 60 * 60 * 1000;
    });

    if (matchingSpecialShabbat) {
        const specialTitle = formatTwoWordTitle(matchingSpecialShabbat.name);
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

    // Filtra apenas festas genuínas (excluindo contagem diária do Omer)
    const validEvents = (state.unifiedEvents || []).filter(evt => {
        if (!evt || !evt.name) return false;
        if ((evt.time + twentyFourHoursMs) < now) return false;
        if (evt.category === 'parashat' || evt.category === 'omer') return false;
        if (evt.name.includes('laOmer')) return false;

        // Se for o Shabbat especial incorporado como shabbatEvent desta semana, não duplica
        if (matchingSpecialShabbat && evt === matchingSpecialShabbat) return false;
        if (evt.name.toLowerCase() === 'yom shabbat') return false;

        return true;
    });

    // Insere o Shabbat semanal (que assume o nome do Shabbat Especial caso contemplado)
    validEvents.push(shabbatEvent);
    validEvents.sort((a, b) => a.time - b.time);

    const unique = [];
    const seenTitles = new Set();

    for (const evt of validEvents) {
        const title = formatTwoWordTitle(evt.name);
        if (seenTitles.has(title)) continue;
        seenTitles.add(title);
        unique.push({ ...evt, twoWordTitle: title });
        if (unique.length >= 5) break;
    }

    // Festas de contingência caso não haja 5 no cache atual
    const FALLBACK_FESTIVALS = [
        { name: 'Yom Shabbat', category: 'shabbat', isBiblical: true, hdate: 'Sétimo Dia' },
        { name: 'Yom Teruah', category: 'yomteruah', isBiblical: true, hdate: '01 Eitanim', month: 'Setembro' },
        { name: 'Tzom Gedaliah', category: 'fast', isTraditional: true, hdate: '03 Eitanim', month: 'Setembro' },
        { name: 'Yom Kippur', category: 'yomkippur', isBiblical: true, hdate: '10 Eitanim', month: 'Outubro' },
        { name: 'Chag Sukkot', category: 'sukkot', isBiblical: true, hdate: '15 Eitanim', month: 'Outubro' },
        { name: 'Shemini Atzeret', category: 'sheminiatzeret', isBiblical: true, hdate: '22 Eitanim', month: 'Outubro' },
        { name: 'Chag Chanukah', category: 'chanukah', isTraditional: true, hdate: '25 Kislev', month: 'Dezembro' },
        { name: 'Yom Purim', category: 'purim', isTraditional: true, hdate: '14 Adar', month: 'Março' },
        { name: 'Yom Pessach', category: 'pesach', isBiblical: true, hdate: '15 Aviv', month: 'Abril' },
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

    const fragment = document.createDocumentFragment();

    unique.forEach(evt => {
        const twoWordTitle = evt.twoWordTitle;
        const twoWordDesc = formatTwoWordSubtitle(evt);

        const rawIcon = getEventIcon(evt.category, evt.name, '');
        const classMatch = rawIcon.match(/class="([^"]+)"/);
        let iconClass = classMatch ? classMatch[1] : ICONS.starOfDavid;

        // Regra do utilizador: toda festa rabínica só tem Magen David, exceto os Shabbatot especiais
        const isRabbinic = !evt.isBiblical || evt.isTraditional || twoWordDesc === 'Lei Rabinica' || evt.category === 'fast';
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
            <i class="${ICONS.chevronRight}" data-icon="chevronRight" style="color: var(--text-muted); font-size: 11px;"></i>
        `;

        fragment.appendChild(card);
    });

    grid.appendChild(fragment);

    removeNotReadyState(document.querySelectorAll('.not-ready'));

    startTimers();
    initUtilities();
    reopenModals();
}