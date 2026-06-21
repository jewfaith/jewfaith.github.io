import { state } from '../state.js';
import { applySolarTheme } from './theme.js';
import { findActiveFestival, transliterateTorah, pickReading } from '../domain/halacha.js';
import { FESTIVAL_CATS, FESTIVAL_TORAH_READINGS, FESTIVAL_HAFTARA_READINGS, KETUVIM_BOOKS, KETUVIM_TOTAL_WEIGHT, FESTIVAL_TEHILIM } from '../domain/constants.js';
import { LCG, getStringSimilarity } from '../utils/math.js';
import { getEventIcon } from './icons.js';
import { startTimers } from './timers.js';

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
            } else if (activeFestival.category === 'sheminiatzeret') {
                isExtraDay = (idx === 1); 
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
        }
        elTorah.textContent = transliterateTorah(torahRawRef);
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
        }
        elHaftara.textContent = transliterateTorah(haftaraRawRef);
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
        }
        elKetuvim.textContent = transliterateTorah(ketuvimRawRef);
    }

    if (elDate) {
        let hm = hdate.hm || '';
        const hbMonths = {
            "Nisan": "Nissan", "Iyyar": "Iyar", "Sh\\'vat": "Shvat"
        };
        hm = hbMonths[hm] || hm;
        elDate.textContent = `${hdate.hd} ${hm}`;
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
    const isAfterSunsetLocal = sunsetTime > 0 && now > sunsetTime;
    const currentHebrewDay = new Date(now + (isAfterSunsetLocal ? 86400000 : 0));
    const isHolyDay = (currentHebrewDay.getDay() === 6) || (activeFestival && !isCholHaMoed);
    
    const donateBtn = document.querySelector('.premium-donate-btn');
    const donateTitle = document.querySelector('.donation-title');
    const donateText = document.querySelector('.donation-text');

    if (donateBtn && donateText && donateTitle) {
        if (isHolyDay) {
            donateTitle.textContent = 'Dia Sagrado de Descanso 🕊️';
            donateText.innerHTML = 'Hoje é <strong>Shabat ou Yom Tov</strong>. Em respeito à Halachá (Lei Judaica), não realizamos transações financeiras nestes dias. <br><br>O recebimento de apoios foi temporariamente desativado para honrarmos o mandamento do descanso. Aproveite o dia e volte após a saída das estrelas!';
            donateBtn.style.pointerEvents = 'none';
            donateBtn.style.opacity = '0.5';
            donateBtn.style.filter = 'grayscale(100%)';
            donateBtn.querySelector('span').textContent = 'Indisponível Hoje';
            donateBtn.removeAttribute('href');
        } else {
            donateTitle.textContent = 'Faça parte deste projeto ☕';
            donateText.innerHTML = 'O Yisrael Date foi criado para ser um refúgio: <strong>rápido, privado e 100% livre de anúncios.</strong><br><br>Projetos independentes sobrevivem do apoio da própria comunidade. Se você valoriza ter a tradição sempre à mão, considere pagar um café para o desenvolvedor. Sua ação direta é o que garante que o app continuará gratuito para todos!';
            donateBtn.style.pointerEvents = 'auto';
            donateBtn.style.opacity = '1';
            donateBtn.style.filter = 'none';
            donateBtn.querySelector('span').textContent = 'Pagar um Café (PayPal)';
            donateBtn.setAttribute('href', 'https://paypal.me/ashkenar');
        }
    }
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
        const normalized = item.name.trim().toLowerCase().replace(/\\s+/g, ' ');
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
        grid.innerHTML = `<div id="upcoming-events-grid" class="event-cards-row upcoming-events-grid">
    <div><div class="event-card event-item glass-panel"><div class="icon-circle"><i class="fa-solid fa-clock"></i></div><div class="card-content"><h2 class="card-title">-</h2><span class="timer-countdown" data-time="">Em Breve</span></div></div></div>
    <div><div class="event-card event-item glass-panel"><div class="icon-circle"><i class="fa-solid fa-clock"></i></div><div class="card-content"><h2 class="card-title">-</h2><span class="timer-countdown" data-time="">Em Breve</span></div></div></div>
    <div><div class="event-card event-item glass-panel"><div class="icon-circle"><i class="fa-solid fa-clock"></i></div><div class="card-content"><h2 class="card-title">-</h2><span class="timer-countdown" data-time="">Em Breve</span></div></div></div>
    <div><div class="event-card event-item glass-panel"><div class="icon-circle"><i class="fa-solid fa-clock"></i></div><div class="card-content"><h2 class="card-title">-</h2><span class="timer-countdown" data-time="">Em Breve</span></div></div></div>
</div>`;
        return;
    }

    upcoming.forEach(evt => {
        const icon = getEventIcon(evt.category, evt.name);

        const card = document.createElement('div');
        card.innerHTML = `
            <div class="event-card event-item glass-panel">
                <div class="icon-circle ${evt.category}">
                    ${icon}
                </div>
                <div class="card-content">
                    <h2 class="card-title">${evt.name}</h2>
                    <span class="timer-countdown" data-time="${evt.time}">Em Breve</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    document.getElementById('card-local-vigente')?.classList.remove('not-ready');
    document.getElementById('card-hdate-wrapper')?.classList.remove('not-ready');
    
    startTimers();
}
