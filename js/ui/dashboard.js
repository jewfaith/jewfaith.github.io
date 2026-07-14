import { state } from '../state.js';
import { applySolarTheme } from './theme.js';
import { findActiveFestival, transliterateTorah, pickReading } from '../domain/halacha.js';
import { FESTIVAL_CATS, FESTIVAL_TORAH_READINGS, FESTIVAL_HAFTARA_READINGS, KETUVIM_BOOKS, KETUVIM_TOTAL_WEIGHT, FESTIVAL_TEHILIM, FESTIVAL_DESCRIPTIONS } from '../domain/constants.js';
import { LCG, getStringSimilarity } from '../utils/math.js';
import { getEventIcon } from './icons.js';
import { startTimers } from './timers.js';
import { reopenModals } from './modals.js';

export function showDashboardSkeletons() {
    // Restore the skeletons for all top cards
    const cards = [
        { id: 'card-parasha', subId: 'card-parasha-wrapper' },
        { id: 'card-torah', subId: 'card-torah-wrapper' },
        { id: 'card-haftara', subId: 'card-haftara-wrapper' },
        { id: 'card-ketuvim', subId: 'card-ketuvim-wrapper' },
        { id: 'card-local', subId: 'card-local-vigente' },
        { id: 'card-hdate', subId: 'card-hdate-wrapper' },
        { id: 'card-zmanim', subId: 'card-zmanim-wrapper' },
        { id: 'card-share', subId: 'card-share-wrapper' }
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

    // Restore upcoming grid skeletons
    const grid = document.getElementById('upcoming-events-grid');
    if (grid) {
        grid.innerHTML = `
          <div class="event-card event-item glass-panel not-ready" tabindex="0" role="button">
            <div class="icon-circle localvigente"><i class="fa-solid fa-star"></i></div>
            <div class="card-content" style="width: 100%;">
              <h2 class="card-title"><span class="skeleton-line" style="display: inline-block; width: 60%; height: 24px; border-radius: 6px;"></span></h2>
              <span class="card-subtitle"><span class="skeleton-line" style="display: inline-block; width: 40%; height: 16px; border-radius: 4px; margin-top: 4px;"></span></span>
            </div>
          </div>
          <div class="event-card event-item glass-panel not-ready" tabindex="0" role="button">
            <div class="icon-circle datahebraica"><i class="fa-solid fa-star"></i></div>
            <div class="card-content" style="width: 100%;">
              <h2 class="card-title"><span class="skeleton-line" style="display: inline-block; width: 75%; height: 24px; border-radius: 6px;"></span></h2>
              <span class="card-subtitle"><span class="skeleton-line" style="display: inline-block; width: 50%; height: 16px; border-radius: 4px; margin-top: 4px;"></span></span>
            </div>
          </div>
          <div class="event-card event-item glass-panel not-ready" tabindex="0" role="button">
            <div class="icon-circle parashat"><i class="fa-solid fa-star"></i></div>
            <div class="card-content" style="width: 100%;">
              <h2 class="card-title"><span class="skeleton-line" style="display: inline-block; width: 50%; height: 24px; border-radius: 6px;"></span></h2>
              <span class="card-subtitle"><span class="skeleton-line" style="display: inline-block; width: 35%; height: 16px; border-radius: 4px; margin-top: 4px;"></span></span>
            </div>
          </div>
          <div class="event-card event-item glass-panel not-ready" tabindex="0" role="button">
            <div class="icon-circle roshchodesh"><i class="fa-solid fa-star"></i></div>
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
    const hebrewMonthsPT = {
        "Nisan": "Nisã", "Iyyar": "Iyar", "Sivan": "Sivã", "Tammuz": "Tamuz",
        "Av": "Av", "Elul": "Elul", "Tishrei": "Tishrei", "Cheshvan": "Cheshvan",
        "Kislev": "Kislev", "Tevet": "Tevet", "Sh'vat": "Shevat", 
        "Adar I": "Adar I", "Adar II": "Adar II", "Adar": "Adar"
    };
    let displayMonth = hebrewMonthsPT[currentHdate.hm] || currentHdate.hm || 'Mês';
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
                if (ev.name) {
                    let gYear = null, gMonth = null, gDay = null;
                    if (ev.raw && ev.raw.date) {
                         const gparts = ev.raw.date.split('T')[0].split('-');
                         gYear = parseInt(gparts[0], 10);
                         gMonth = parseInt(gparts[1], 10);
                         gDay = parseInt(gparts[2], 10);
                    }
                    
                    let gregText = '';
                    if (gDay !== null) {
                        const paddedGDay = String(gDay).padStart(2, '0');
                        gregText = `${paddedGDay} ${gregMonths[gMonth - 1]}`;
                    }
                    
                    const isDup = legendItems.some(i => i.name === ev.name && i.firstDay === hDay);
                    if (!isDup) {
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
    
    if (legendItems.length > 0) {
        html += `<div class="calendar-legend">
            <ul class="legend-list" style="padding: 0; margin: 0; list-style: none; display: flex; flex-direction: column">`;
        let idx = 0;
        for (const item of legendItems) {
            html += `<li class="legend-card" style="padding: 12px 14px;">
                <div style="font-size: 1rem; font-weight: 400; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${item.name}, ${item.gregText || 'Data indisponível'}
                </div>
            </li>`;
            idx++;
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
    const mapping = {
        'Bereshit': 'Genesis',
        'Shemot': 'Exodus',
        'Vayikra': 'Leviticus',
        'Bamidbar': 'Numbers',
        'Devarim': 'Deuteronomy',
        'Yehoshua': 'Joshua',
        'Shoftim': 'Judges',
        'II Shmuel': 'II Samuel',
        'I Shmuel': 'I Samuel',
        'II Melachim': 'II Kings',
        'I Melachim': 'I Kings',
        'Yeshayahu': 'Isaiah',
        'Yirmiyahu': 'Jeremiah',
        'Yechezkel': 'Ezekiel',
        'Hoshea': 'Hosea',
        'Yoel': 'Joel',
        'Amos': 'Amos',
        'Ovadia': 'Obadiah',
        'Yona': 'Jonah',
        'Micha': 'Micah',
        'Nachum': 'Nahum',
        'Chavakuk': 'Habakkuk',
        'Tzefania': 'Zephaniah',
        'Chagai': 'Haggai',
        'Zecharia': 'Zechariah',
        'Malachi': 'Malachi',
        'Tehilim': 'Psalms',
        'Mishlei': 'Proverbs',
        'Iyov': 'Job',
        'Kohelet': 'Ecclesiastes',
        'Ruth': 'Ruth',
        'Esther': 'Esther',
        'Daniel': 'Daniel',
        'Ezra': 'Ezra',
        'Nechemia': 'Nehemiah'
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
            if (isIsrael) {
                isCholHaMoed = (idx >= 1 && idx <= 5);
            } else {
                isCholHaMoed = (idx >= 2 && idx <= 5);
            }
        } else if (activeFestival.category === 'sukkot') {
            if (isIsrael) {
                isCholHaMoed = (idx >= 1 && idx <= 6);
            } else {
                isCholHaMoed = (idx >= 2 && idx <= 6);
            }
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
        if (activeFestival) {
            elParashaSubtitle.textContent = 'Leitura Especial';
        } else {
            elParashaSubtitle.textContent = 'Ciclo Anual';
        }
    }
    
    const nearFestival = findActiveFestival(events, now, twentyFourHoursMs, Object.keys(FESTIVAL_TORAH_READINGS));

    const elParashaWrapper = document.getElementById('card-parasha-wrapper');
    if (elParashaWrapper && elParasha) {
        let pName = elParasha.textContent;
        let torahRef = '';
        let haftaraRef = '';
        let aliyotHtml = '';
        
        if (nearFestival) {
             torahRef = pickReading(FESTIVAL_TORAH_READINGS[nearFestival.category], nearFestival.dayIndex) || '';
             haftaraRef = pickReading(FESTIVAL_HAFTARA_READINGS[nearFestival.category], nearFestival.dayIndex) || '';
        } else if (upcomingParasha && upcomingParasha.raw && upcomingParasha.raw.leyning) {
             const ley = upcomingParasha.raw.leyning;
             torahRef = ley.torah || '';
             const hOptions = [ley.haftarah, ley.haftarah_sephardic, ley.haftarah_chabad, ley.haftarah_teiman, ley.haftarah_itali].filter(Boolean);
             haftaraRef = (hOptions[0] || '').split(' | ')[0].trim();
             
             if (ley["1"]) {
                 const aliyotNames = ["Rishon", "Sheni", "Shlishi", "Revii", "Chamishi", "Shishi", "Shevii"];
                 const aliyotNums = ["01", "02", "03", "04", "05", "06", "07"];
                 const keys = ["1", "2", "3", "4", "5", "6", "7"];
                 
                 for (let i = 0; i < keys.length; i++) {
                     const key = keys[i];
                     if (ley[key]) {
                         aliyotHtml += `
                            <div class="legend-card" style="padding: 12px 14px;">
                                <div style="font-size: 1rem; font-weight: 400; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${aliyotNames[i]}, ${transliterateTorah(ley[key])}
                                </div>
                            </div>
                        `;
                     }
                 }
             }
        }
        
        elParashaWrapper.setAttribute('data-info-title', pName);
        let contentHtml = '';
        if (aliyotHtml) {
            contentHtml = aliyotHtml;
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

            const chapter = (seed2 % selectedBook.chapters) + 1;
            ketuvimRawRef = `${selectedBook.name} ${chapter}`;
        }

        if (elKetuvimWrapper) {
            elKetuvimWrapper.setAttribute('data-ref', toEnglishRef(ketuvimRawRef));
            const sub = elKetuvimWrapper.querySelector('.card-subtitle');
            if (sub) sub.textContent = 'Escrito Sagrado';
        }
        elKetuvim.textContent = transliterateTorah(ketuvimRawRef) || '-';
    }

    const elDateWrapper = document.getElementById('card-hdate-wrapper');
    if (elDate) {
        let hm = hdate.hm || '';
        const hbMonths = {
            "Nisan": "Nisã", "Iyyar": "Iyar", "Sivan": "Sivã", "Tammuz": "Tamuz",
            "Av": "Av", "Elul": "Elul", "Tishrei": "Tishrei", "Cheshvan": "Cheshvan",
            "Kislev": "Kislev", "Tevet": "Tevet", "Sh'vat": "Shevat", 
            "Adar I": "Adar I", "Adar II": "Adar II", "Adar": "Adar"
        };
        hm = hbMonths[hm] || hm;
        elDate.textContent = `${hdate.hd} ${hm}`;
        
        if (elDateWrapper) {
            elDateWrapper.setAttribute('data-info-title', `${hm} ${hdate.hy}`);
            let contentHtml = generateCalendarHTML(events, hdate);
            elDateWrapper.setAttribute('data-info-html', contentHtml);
            const sub = elDateWrapper.querySelector('.card-subtitle');
            if (sub) sub.textContent = 'Data Hebraica';
        }
    }
    if (elLoc) {
        elLoc.textContent = locationName || 'Jerusalém';
        const elLocSubtitle = elLoc.nextElementSibling;
        if (elLocSubtitle) {
            if (activeFestival) {
                if (isIsrael) {
                    elLocSubtitle.textContent = 'Local Vigente (Israel)';
                } else {
                    elLocSubtitle.textContent = `Local Vigente (${isExtraDay ? 'Chutz laAretz' : 'Chutz'})`;
                }
            } else {
                elLocSubtitle.textContent = 'Local Vigente';
            }
        }
    }

    // --- Halachic Donation Button Logic & Persuasive Copy ---
    const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    let isHolyDayBlocked = false;

    // Check Shabbat boundaries (+/- 5 horas)
    const currentDayOfWeek = new Date(now).getDay(); // 0=Sun, 5=Fri, 6=Sat
    if (currentDayOfWeek === 5 && sunsetTime > 0 && now >= sunsetTime - FIVE_HOURS_MS) {
        isHolyDayBlocked = true;
    } else if (currentDayOfWeek === 6 && sunsetTime > 0 && now <= sunsetTime + FIVE_HOURS_MS) {
        isHolyDayBlocked = true;
    }

    // Check Yom Tov boundaries (+/- 5 horas)
    if (!isHolyDayBlocked) {
        for (const cat of FESTIVAL_CATS) {
            const evts = events.filter(e => e.category === cat).sort((a, b) => a.time - b.time);
            for (let i = 0; i < evts.length; i++) {
                let isChmDay = false;
                if (cat === 'matzot') isChmDay = isIsrael ? (i >= 1 && i <= 5) : (i >= 2 && i <= 5);
                else if (cat === 'sukkot') isChmDay = isIsrael ? (i >= 1 && i <= 6) : (i >= 2 && i <= 6);

                if (!isChmDay) {
                    const ytStart = evts[i].time;
                    const ytEnd = ytStart + TWENTY_FOUR_HOURS_MS;
                    if (now >= ytStart - FIVE_HOURS_MS && now <= ytEnd + FIVE_HOURS_MS) {
                        isHolyDayBlocked = true;
                        break;
                    }
                }
            }
            if (isHolyDayBlocked) break;
        }
    }

    const shareCard = document.getElementById('card-share-wrapper');
    if (shareCard) {
        const title = shareCard.querySelector('.card-title');
        const subtitle = shareCard.querySelector('.card-subtitle');
        if (title) title.textContent = 'Yisrael Date';
        if (subtitle) subtitle.textContent = 'Enviar Convite';
    }

    const elZmanim = document.getElementById('card-zmanim');
    const elZmanimWrapper = document.getElementById('card-zmanim-wrapper');
    if (elZmanim && elZmanimWrapper) {
        elZmanim.textContent = 'Zman Hayom';
        const sub = elZmanimWrapper.querySelector('.card-subtitle');
        if (sub) sub.textContent = 'Hora Atual';
        
        let zmanimHtml = '';
        if (state.currentZmanim) {
            const formatZman = (isoString) => {
                if (!isoString) return '--:--';
                // A API do Hebcal retorna no fuso horário do local pedido (ex: 2021-09-06T13:42:00+03:00).
                // Ao usar substring(11, 16), extraímos exatamente a hora local do Zman.
                return isoString.substring(11, 16);
            };
            const zmanimMap = [
                { key: 'alotHaShachar', label: 'Alot Hashachar' },
                { key: 'sunrise', label: 'Netz Hachama' },
                { key: 'sofZmanShma', label: 'Zman Shma' },
                { key: 'sofZmanTfila', label: 'Zman Tefila' },
                { key: 'chatzot', label: 'Chatzot Hayom' },
                { key: 'minchaGedola', label: 'Mincha Gedola' },
                { key: 'plagHaMincha', label: 'Plag Hamincha' },
                { key: 'sunset', label: 'Shkiat Hachama' },
                { key: 'tzeit7083deg', label: 'Tzeit Hakochavim' },
                { key: 'tzeit72min', label: 'Rabbeinu Tam' }
            ];
            
            for (const {key, label} of zmanimMap) {
                if (state.currentZmanim[key]) {
                    zmanimHtml += `
                        <div class="legend-card" style="padding: 12px 14px;">
                            <div style="font-size: 1rem; font-weight: 400; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary);">
                                ${formatZman(state.currentZmanim[key])}, ${label}
                            </div>
                        </div>
                    `;
                }
            }
        } else {
             zmanimHtml += `
                 <div class="info-modal-card">
                     <div class="info-modal-value">Horário Indisponível</div>
                 </div>
             `;
        }
        
        
        elZmanimWrapper.setAttribute('data-info-title', 'Zman Hayom');
        elZmanimWrapper.setAttribute('data-info-html', zmanimHtml);
    }

    document.querySelectorAll('.event-card.not-ready').forEach(el => {
        el.classList.remove('not-ready');
        const iconEl = el.querySelector('.icon-circle i');
        if (iconEl && iconEl.hasAttribute('data-original-class')) {
            iconEl.className = iconEl.getAttribute('data-original-class');
        }
    });
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
    const omerEvents = sorted.filter(e => e.category === 'omer');
    const firstOmer = omerEvents[0];
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

        let isTooSimilar = false;
        if (!item.isBiblical) {
            for (const added of unique) {
                if (!added.isBiblical && getStringSimilarity(item.name, added.name) >= 0.70) {
                    isTooSimilar = true;
                    break;
                }
            }
        }
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

    upcoming.forEach(evt => {
        const icon = getEventIcon(evt.category, evt.name);

        let baseName = evt.name;
        if (evt.name.includes('laOmer')) baseName = 'Sefirat Omer';
        else if (evt.name.includes('Hanukkah')) baseName = 'Chag Hanukkah';

        let festivalData = FESTIVAL_DESCRIPTIONS[baseName] || FESTIVAL_DESCRIPTIONS[evt.name];
        
        let infoHtml = '';
        if (festivalData && typeof festivalData === 'object' && festivalData.torah) {
            infoHtml = `
                <div class="levels-container" style="display:flex; flex-direction:column;">
                    <div class="info-modal-card" style="flex-direction:column; align-items:flex-start; gap:8px; white-space:normal; overflow:visible;">
                        <div class="info-modal-value" style="font-weight:400; font-size:0.95rem; line-height:1.6; text-align:left; white-space:normal; overflow:visible; text-overflow:clip;">${festivalData.torah}</div>
                    </div>
                    <div class="info-modal-card" style="flex-direction:column; align-items:flex-start; gap:8px; white-space:normal; overflow:visible;">
                        <div class="info-modal-value" style="font-weight:400; font-size:0.95rem; line-height:1.6; text-align:left; white-space:normal; overflow:visible; text-overflow:clip;">${festivalData.neviim}</div>
                    </div>
                    <div class="info-modal-card" style="flex-direction:column; align-items:flex-start; gap:8px; white-space:normal; overflow:visible;">
                        <div class="info-modal-value" style="font-weight:400; font-size:0.95rem; line-height:1.6; text-align:left; white-space:normal; overflow:visible; text-overflow:clip;">${festivalData.ketuvim}</div>
                    </div>
                    <div class="info-modal-card" style="flex-direction:column; align-items:flex-start; gap:8px; white-space:normal; overflow:visible;">
                        <div class="info-modal-value" style="font-weight:400; font-size:0.95rem; line-height:1.6; text-align:left; white-space:normal; overflow:visible; text-overflow:clip;">${festivalData.talmud}</div>
                    </div>
                    <div class="info-modal-card" style="flex-direction:column; align-items:flex-start; gap:8px; border-bottom:none; white-space:normal; overflow:visible;">
                        <div class="info-modal-value" style="font-weight:400; font-size:0.95rem; line-height:1.6; text-align:left; white-space:normal; overflow:visible; text-overflow:clip;">${festivalData.sod}</div>
                    </div>
                </div>
            `;
        } else {
            let desc = festivalData || 'Uma data significativa no calendário judaico.';
            infoHtml = `
                <div class="info-modal-card" style="margin-bottom: 0; white-space:normal; overflow:visible;">
                    <div class="info-modal-value" style="font-weight: 400; font-size: 1.05rem; line-height: 1.6; color: var(--text-primary); text-align: left; padding: 4px 0; white-space:normal; overflow:visible; text-overflow:clip;">${desc}</div>
                </div>
            `;
        }

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

        grid.appendChild(wrapper);
    });

    ['card-local-vigente', 'card-hdate-wrapper', 'card-zmanim-wrapper', 'card-share-wrapper'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('not-ready');
            const iconEl = el.querySelector('.icon-circle i');
            if (iconEl && iconEl.hasAttribute('data-original-class')) {
                iconEl.className = iconEl.getAttribute('data-original-class');
            }
        }
    });
    
    startTimers();
    reopenModals();
}
