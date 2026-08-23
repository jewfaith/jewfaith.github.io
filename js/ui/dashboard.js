import { state } from '../state.js';
import { applySolarTheme } from './theme.js';
import { findActiveFestival, transliterateTorah, pickReading } from '../domain/halacha.js';
import { FESTIVAL_CATS, FESTIVAL_TORAH_READINGS, FESTIVAL_HAFTARA_READINGS, KETUVIM_BOOKS, KETUVIM_TOTAL_WEIGHT, FESTIVAL_TEHILIM, AVAILABLE_TEHILIM, FESTIVAL_DESCRIPTIONS } from '../domain/constants.js';
import { getParashaSummary } from '../domain/parashot.js';
import { LCG, getStringSimilarity } from '../utils/math.js';
import { getEventIcon } from './icons.js';
import { startTimers } from './timers.js';
import { reopenModals } from './modals.js';

const HEBREW_MONTHS_MAP = {
    "Nisan": "Aviv", "Iyyar": "Ziv", "Sivan": "Sivan", "Tammuz": "Tamuz",
    "Av": "Av", "Elul": "Elul", "Tishrei": "Etanim", "Cheshvan": "Bul",
    "Kislev": "Kislev", "Tevet": "Tevet", "Sh'vat": "Shevat",
    "Adar I": "Adar I", "Adar II": "Adar II", "Adar": "Adar"
};

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

export function showDashboardSkeletons() {
    const cards = [
        { id: 'card-parasha', subId: 'card-parasha-wrapper' },
        { id: 'card-info', subId: 'card-info-wrapper' },
        { id: 'card-torah', subId: 'card-torah-wrapper' },
        { id: 'card-haftara', subId: 'card-haftara-wrapper' },
        { id: 'card-ketuvim', subId: 'card-ketuvim-wrapper' },
        { id: 'card-local', subId: 'card-local-vigente' },
        { id: 'card-hdate', subId: 'card-hdate-wrapper' }
    ];

    cards.forEach(c => {
        const titleEl = document.getElementById(c.id);
        const wrapperEl = document.getElementById(c.subId);
        if (wrapperEl) {
            wrapperEl.classList.add('not-ready');
            const iconEl = wrapperEl.querySelector('.icon-circle i');
            if (iconEl) {
                if (!iconEl.hasAttribute('data-original-class')) {
                    iconEl.setAttribute('data-original-class', iconEl.className);
                }
                iconEl.className = 'fa-solid fa-circle-notch fa-spin';
            }
        }
        if (titleEl) {
            titleEl.innerHTML = '<span class="skeleton-line" style="display: inline-block; width: 75%; height: 24px; border-radius: 6px;"></span>';
            const subtitle = titleEl.nextElementSibling;
            if (subtitle && subtitle.classList.contains('card-subtitle')) {
                subtitle.innerHTML = '<span class="skeleton-line" style="display: inline-block; width: 45%; height: 16px; border-radius: 4px; margin-top: 4px;"></span>';
            }
        }
    });

    const grid = document.getElementById('upcoming-events-grid');
    if (grid) {
        grid.innerHTML = `
          <div class="event-card event-item glass-panel not-ready" tabindex="0" role="button">
            <div class="icon-circle localvigente"></div>
            <div class="card-content" style="width: 100%;">
              <h2 class="card-title"><span class="skeleton-line" style="display: inline-block; width: 60%; height: 24px; border-radius: 6px;"></span></h2>
              <span class="card-subtitle"><span class="skeleton-line" style="display: inline-block; width: 40%; height: 16px; border-radius: 4px; margin-top: 4px;"></span></span>
            </div>
          </div>
          <div class="event-card event-item glass-panel not-ready" tabindex="0" role="button">
            <div class="icon-circle datahebraica"></div>
            <div class="card-content" style="width: 100%;">
              <h2 class="card-title"><span class="skeleton-line" style="display: inline-block; width: 75%; height: 24px; border-radius: 6px;"></span></h2>
              <span class="card-subtitle"><span class="skeleton-line" style="display: inline-block; width: 50%; height: 16px; border-radius: 4px; margin-top: 4px;"></span></span>
            </div>
          </div>
          <div class="event-card event-item glass-panel not-ready" tabindex="0" role="button">
            <div class="icon-circle parashat"></div>
            <div class="card-content" style="width: 100%;">
              <h2 class="card-title"><span class="skeleton-line" style="display: inline-block; width: 50%; height: 24px; border-radius: 6px;"></span></h2>
              <span class="card-subtitle"><span class="skeleton-line" style="display: inline-block; width: 35%; height: 16px; border-radius: 4px; margin-top: 4px;"></span></span>
            </div>
          </div>
          <div class="event-card event-item glass-panel not-ready" tabindex="0" role="button">
            <div class="icon-circle roshchodesh"></div>
            <div class="card-content" style="width: 100%;">
              <h2 class="card-title"><span class="skeleton-line" style="display: inline-block; width: 80%; height: 24px; border-radius: 6px;"></span></h2>
              <span class="card-subtitle"><span class="skeleton-line" style="display: inline-block; width: 45%; height: 16px; border-radius: 4px; margin-top: 4px;"></span></span>
            </div>
          </div>
        `;
    }
}

function generateCalendarHTML(events, currentHdate) {
    if (!currentHdate) return '';

    let displayMonth = HEBREW_MONTHS_MAP[currentHdate.hm] || currentHdate.hm || 'Mês';
    const currentHy = currentHdate.hy;
    let html = `<div class="calendar-wrapper">`;

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
                        const paddedGDay = String(gDay).padStart(2, '0');
                        gregText = `${paddedGDay} ${gregMonths[gMonth - 1]}`;
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
                            const paddedHDay = String(hDay).padStart(2, '0');
                            legendItems[existingIndex] = {
                                dayText: `${paddedHDay}`,
                                gregText: gregText,
                                name: ev.name,
                                isBiblical: !!ev.isBiblical,
                                category: ev.category,
                                firstDay: hDay
                            };
                        }
                    } else if (!isDup) {
                        const paddedHDay = String(hDay).padStart(2, '0');
                        legendItems.push({
                            dayText: `${paddedHDay}`,
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

    legendItems.sort((a, b) => {
        if (a.firstDay !== b.firstDay) return a.firstDay - b.firstDay;
        return (b.isBiblical ? 1 : 0) - (a.isBiblical ? 1 : 0);
    });

    const multiDayCategories = ['matzot', 'sukkot', 'hanukkah', 'omer'];
    const mergedLegend = [];
    for (const item of legendItems) {
        const last = mergedLegend[mergedLegend.length - 1];
        const isMultiDay = multiDayCategories.includes(item.category) || item.name.includes('Matzot') || item.name.includes('Sukkot');
        if (last && last.name === item.name && isMultiDay && (item.firstDay === last.lastDay + 1 || item.firstDay === last.lastDay)) {
            last.lastDay = item.firstDay;
            if (last.gregText && item.gregText && last.gregText !== item.gregText) {
                const day1 = last.gregText.split(' ')[0];
                last.gregText = `${day1}–${item.gregText}`;
            }
        } else {
            mergedLegend.push({ ...item, lastDay: item.firstDay });
        }
    }

    if (mergedLegend.length > 0) {
        html += `<div class="calendar-legend">
            <ul class="legend-list" style="padding: 0; margin: 0; list-style: none; display: flex; flex-direction: column;">`;
        for (const item of mergedLegend) {
            const iconHtml = getEventIcon(item.category, item.name);

            let baseName = item.name;
            if (item.name.includes('laOmer')) baseName = 'Sefirat Omer';
            else if (item.name.includes('Hanukkah')) baseName = 'Chag Hanukkah';

            const festivalData = FESTIVAL_DESCRIPTIONS[baseName] || FESTIVAL_DESCRIPTIONS[item.name];
            const defaultDesc = 'Esta é uma data significativa no calendário israelita. O seu significado está relacionado com a história, a tradição e os ensinamentos do povo de Israel, podendo envolver acontecimentos históricos, mandamentos da Torá, práticas religiosas ou outros elementos transmitidos ao longo das gerações.';
            const infoHtml = createDescriptionCardHTML(festivalData, defaultDesc);

            const safeInfoHtml = infoHtml.replace(/"/g, '&quot;');
            const safeName = item.name.replace(/"/g, '&quot;');

            html += `<li class="legend-card info-trigger" data-info-title="${safeName}" data-info-html="${safeInfoHtml}" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-radius: 14px; background: rgba(255, 255, 255, 0.025); border: 1px solid var(--card-border-color); margin-bottom: 8px; box-sizing: border-box; cursor: pointer; transition: background 0.2s ease, border-color 0.2s ease;">
                <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
                    <div style="width: 34px; height: 34px; border-radius: 10px; background: var(--accent-bg); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(255, 255, 255, 0.06); color: var(--accent-color); font-size: 14px;">
                        ${iconHtml}
                    </div>
                    <div style="display: flex; flex-direction: column; text-align: left; min-width: 0; flex: 1;">
                        <span style="font-size: var(--font-size-base); font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
                        <span style="font-size: var(--font-size-xs); color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.gregText || 'Data indisponível'}</span>
                    </div>
                </div>
            </li>`;
        }
        html += `</ul></div>`;
    } else {
        html += `<div class="calendar-legend" style="margin-top: 10px; text-align: center; color: var(--text-muted); padding: 20px 0;">
            Nenhuma festa em ${displayMonth}.
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
    const elLoc = document.getElementById('card-local');

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
                    <div class="info-modal-label"><i class="fa-solid fa-scroll" style="margin-right: 8px;"></i>Porção da Torá</div>
                    <div class="info-modal-value highlight">${transliterateTorah(torahRef) || '-'}</div>
                </div>
                <div class="info-modal-card">
                    <div class="info-modal-label"><i class="fa-solid fa-feather-pointed" style="margin-right: 8px;"></i>Haftará</div>
                    <div class="info-modal-value secondary">${transliterateTorah(haftaraRef) || '-'}</div>
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
            const sub = elTorahWrapper.querySelector('.card-subtitle');
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
            const sub = elHaftaraWrapper.querySelector('.card-subtitle');
            if (sub) sub.textContent = 'Olhar Futuro';
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
            const sub = elKetuvimWrapper.querySelector('.card-subtitle');
            if (sub) sub.textContent = 'Escrito Sagrado';
        }
        elKetuvim.textContent = transliterateTorah(displayKetuvim) || '-';
    }

    const elDateWrapper = document.getElementById('card-hdate-wrapper');
    if (elDate) {
        let hm = hdate.hm || '';
        const displayMonth = HEBREW_MONTHS_MAP[hm] || hm;
        elDate.textContent = `${hdate.hd} ${displayMonth}`;

        if (elDateWrapper) {
            elDateWrapper.setAttribute('data-info-title', `${hdate.hd} ${displayMonth}`);
            elDateWrapper.setAttribute('data-info-html', generateCalendarHTML(events, hdate));
            const sub = elDateWrapper.querySelector('.card-subtitle');
            if (sub) sub.textContent = 'Data Hebraica';
        }
    }

    if (elLoc) {
        elLoc.textContent = locationName || 'Jerusalém';
        const elLocSubtitle = elLoc.nextElementSibling;
        if (elLocSubtitle) {
            elLocSubtitle.textContent = 'Local Vigente';
        }
    }

    removeNotReadyState(document.querySelectorAll('.event-card.not-ready'));
}

export function renderEvents() {
    const grid = document.getElementById('upcoming-events-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const now = new Date().getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    const sorted = state.unifiedEvents
        .filter(evt => (evt.time + twentyFourHoursMs) > now)
        .sort((a, b) => a.time - b.time);

    const firstOmer = sorted.find(e => e.category === 'omer');
    const nonOmer = sorted.filter(e => e.category !== 'omer');

    let filtered = firstOmer ? [...nonOmer, firstOmer] : nonOmer;

    const biblical = filtered.filter(e => e.isBiblical);
    const traditional = filtered.filter(e => e.isTraditional);
    const others = filtered.filter(e => !e.isBiblical && !e.isTraditional);

    const merged = [...biblical, ...traditional, ...others].sort((a, b) => {
        if (a.time !== b.time) return a.time - b.time;
        const priorityA = a.isBiblical ? 2 : (a.isTraditional ? 1 : 0);
        const priorityB = b.isBiblical ? 2 : (b.isTraditional ? 1 : 0);
        return priorityB - priorityA;
    });

    const unique = [];
    const seenNames = new Set();
    let shabbatCount = 0;
    let majorCount = 0;

    for (const item of merged) {
        if (!item.name) continue;
        const normalized = item.name.trim().toLowerCase().replace(/\s+/g, ' ');
        if (seenNames.has(normalized)) continue;

        const isTooSimilar = unique.some(added => getStringSimilarity(item.name, added.name) >= 0.70);
        if (isTooSimilar) continue;

        if (item.name === 'Yom Shabbat') {
            if (shabbatCount < 1) {
                unique.push(item);
                shabbatCount++;
                seenNames.add(normalized);
            }
        } else {
            if (majorCount < 3) {
                unique.push(item);
                majorCount++;
                seenNames.add(normalized);
            }
        }
        if (shabbatCount >= 1 && majorCount >= 3) break;
    }

    const upcoming = unique.sort((a, b) => a.time - b.time);

    if (upcoming.length === 0) {
        grid.innerHTML = '';
        return;
    }

    const fragment = document.createDocumentFragment();

    upcoming.forEach(evt => {
        const icon = getEventIcon(evt.category, evt.name, "");

        let baseName = evt.name;
        if (evt.name.includes('laOmer')) baseName = 'Sefirat Omer';
        else if (evt.name.includes('Hanukkah')) baseName = 'Chag Hanukkah';

        let festivalData = FESTIVAL_DESCRIPTIONS[baseName] || FESTIVAL_DESCRIPTIONS[evt.name];
        const defaultDesc = 'Esta é uma data significativa no calendário israelita. O seu significado está relacionado com a história, a tradição e os ensinamentos do povo de Yisrael, podendo envolver acontecimentos históricos, mandamentos da Torá, práticas religiosas ou outros elementos transmitidos ao longo das gerações.';
        
        const infoHtml = createDescriptionCardHTML(festivalData, defaultDesc);

        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="event-card event-item glass-panel info-trigger" tabindex="0" role="button" aria-label="Detalhes de ${evt.name}">
                <div class="icon-circle ${evt.category}">
                    ${icon}
                </div>
                <div class="card-content">
                    <h2 class="card-title">${evt.name}</h2>
                    <span class="timer-countdown" data-time="${evt.time}">Em Breve</span>
                </div>
            </div>
        `;

        const card = wrapper.querySelector('.event-card');
        card.setAttribute('data-info-title', evt.name);
        card.setAttribute('data-info-html', infoHtml);

        fragment.appendChild(wrapper);
    });

    grid.appendChild(fragment);

    removeNotReadyState(['card-local-vigente', 'card-hdate-wrapper']);

    startTimers();
    reopenModals();
}