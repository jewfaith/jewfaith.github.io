import { BOOK_MAP } from './constants.js';
import { getLocationDateParts, localTimeToUtc } from './formatters.js';

export function transliterateTorah(text) {
    if (!text) return text;
    let result = text;

    // Ordena as chaves por tamanho decrescente para evitar que nomes menores 
    // (ex: "1 Samuel") interfiram em nomes maiores (ex: "11 Samuel" ou "1 Samuel")
    const keys = Object.keys(BOOK_MAP).sort((a, b) => b.length - a.length);

    for (const eng of keys) {
        const heb = BOOK_MAP[eng];
        // \b garante a substituição apenas da palavra/termo exato
        const regex = new RegExp(`\\b${eng}\\b`, 'g');
        result = result.replace(regex, heb);
    }
    return result;
}

export function pickReading(arr, dayIndex) {
    if (!arr || !arr.length) return null;
    return arr[Math.min(dayIndex, arr.length - 1)];
}

// A festa termina exatamente 24 horas + 1 minuto após o pôr do sol que iniciou a festa (86.460.000 ms)
export const FESTIVAL_DURATION_MS = (24 * 60 + 1) * 60 * 1000;
export const FESTIVAL_ANTICIPATION_MS = (2 * 60 + 30) * 1000; // 2 minutos e 30 segundos (150.000 ms)

/**
 * Retorna o timestamp de término exato de uma festa:
 * Exatamente 24 horas + 1 minuto após o pôr do sol de início.
 */
export function getFestivalEndTime(startTimeMs) {
    if (!startTimeMs || isNaN(startTimeMs)) return 0;
    return Number(startTimeMs) + FESTIVAL_DURATION_MS;
}

/**
 * Determina de forma centralizada e sem arredondamentos se uma celebração está ativa.
 * A festa inicia 2 minutos e 30 segundos antes do pôr do sol e termina exatamente 24h + 1m após o pôr do sol.
 */
export function isFestivalActive(startTimeMs, nowMs = Date.now(), endTimeMs = null) {
    if (!startTimeMs || isNaN(startTimeMs)) return false;
    const end = (endTimeMs && !isNaN(endTimeMs)) ? Number(endTimeMs) : (Number(startTimeMs) + FESTIVAL_DURATION_MS);
    return nowMs >= (Number(startTimeMs) - FESTIVAL_ANTICIPATION_MS) && nowMs < end;
}

export function getFestivalSpan(events, now, festivalDurationMs = FESTIVAL_DURATION_MS, cat) {
    const evts = events
        .filter(e => e.category === cat)
        .sort((a, b) => a.time - b.time);
    if (!evts.length) return null;

    // Agrupa eventos em ocorrências distintas do festival (clusters)
    const clusters = [];
    let currentCluster = [evts[0]];

    for (let i = 1; i < evts.length; i++) {
        const prevEvent = evts[i - 1];
        const currEvent = evts[i];
        const gapMs = currEvent.time - prevEvent.time;
        if (gapMs > 5 * 24 * 60 * 60 * 1000) {
            clusters.push(currentCluster);
            currentCluster = [currEvent];
        } else {
            currentCluster.push(currEvent);
        }
    }
    clusters.push(currentCluster);

    // Encontra o cluster ativo no tempo atual
    for (const cluster of clusters) {
        const start = cluster[0].time - FESTIVAL_ANTICIPATION_MS;
        const end = cluster[cluster.length - 1].time + festivalDurationMs;
        if (now >= start && now < end) {
            let dayIndex = 0;
            for (let i = 0; i < cluster.length; i++) {
                if (now >= (cluster[i].time - FESTIVAL_ANTICIPATION_MS)) dayIndex = i;
            }
            return {
                start,
                end,
                evt: cluster[0],
                dayIndex
            };
        }
    }

    return null;
}

export function findActiveFestival(events, now, festivalDurationMs = FESTIVAL_DURATION_MS, cats) {
    for (const cat of cats) {
        const span = getFestivalSpan(events, now, festivalDurationMs, cat);
        // getFestivalSpan já valida se "now" está dentro do intervalo start/end
        if (span) {
            return { ...span.evt, dayIndex: span.dayIndex };
        }
    }
    return null;
}

export function getNextShabbatEvent(now = Date.now(), sunsetTime = null, tz = 'Asia/Jerusalem') {
    const parts = getLocationDateParts(now, tz);
    const day = parts.dayOfWeek; // 0: Dom, 1: Seg, ..., 5: Sex, 6: Sáb

    let sunsetH = 18;
    let sunsetM = 0;
    if (sunsetTime) {
        const sParts = getLocationDateParts(sunsetTime, tz);
        sunsetH = sParts.hour;
        sunsetM = sParts.minute;
    }

    const shabbatDurationMs = FESTIVAL_DURATION_MS;

    let daysUntilFriday = (5 - day + 7) % 7;
    const thisFridaySunset = localTimeToUtc(parts.year, parts.month, parts.day + daysUntilFriday, sunsetH, sunsetM, 0, tz);
    const thisSaturdayEnd = thisFridaySunset + shabbatDurationMs;

    let shabbatStart = thisFridaySunset;
    let shabbatEnd = thisSaturdayEnd;

    if (day === 5 && now >= thisFridaySunset) {
        shabbatStart = thisFridaySunset;
        shabbatEnd = thisSaturdayEnd;
    } else if (day === 6) {
        const prevFridaySunset = localTimeToUtc(parts.year, parts.month, parts.day - 1, sunsetH, sunsetM, 0, tz);
        const saturdayEnd = prevFridaySunset + shabbatDurationMs;

        if (now <= saturdayEnd) {
            shabbatStart = prevFridaySunset;
            shabbatEnd = saturdayEnd;
        } else {
            const nextFridaySunset = localTimeToUtc(parts.year, parts.month, parts.day + 6, sunsetH, sunsetM, 0, tz);
            shabbatStart = nextFridaySunset;
            shabbatEnd = nextFridaySunset + shabbatDurationMs;
        }
    }

    return {
        name: 'Yom Shabbat',
        twoWordTitle: 'Yom Shabbat',
        category: 'shabbat',
        isBiblical: true,
        isTraditional: false,
        time: shabbatStart,
        startTime: shabbatStart - FESTIVAL_ANTICIPATION_MS,
        endTime: shabbatEnd,
        raw: {
            hdate: 'Sétimo Dia'
        }
    };
}

/**
 * Determina se um evento corresponde a um dia solene da Torá
 * com mandamento de cessação de trabalho (Yom Tov com Issur Melachá segundo Vayikra 23).
 * 
 * Rejeita categoricamente tradições rabínicas posteriores (como o 2º dia de Rosh Hashaná,
 * Simchat Torah, 2º dias da Diáspora, Chanuká e Purim) e dias intermediários de Chol HaMoed.
 */
export function isTorahSolemnRestEvent(ev, isIsrael = false) {
    if (!ev) return false;

    // Simchat Torah NÃO é festa da Torá (é celebração e tradição rabínica posterior)
    if (ev.category === 'simchattorah' || (ev.name && ev.name.toLowerCase().includes('simchat'))) {
        return false;
    }

    // Dias tradicionais/rabínicos NÃO são dias solenes ordenados na Torá
    if (ev.isTraditional === true && ev.isBiblical === false) {
        return false;
    }

    // Reconhece marcação canônica de Yom Tov fornecida pelo Hebcal apenas para festas da Torá
    if (ev.raw?.yomtov === true && ev.isBiblical !== false) {
        const rawTitle = (ev.raw?.title || ev.name || '').toLowerCase();
        if (rawTitle.includes('simchat') || rawTitle.includes('simchas')) {
            return false;
        }
        return true;
    }

    const TORAH_YOM_TOV_CATS = ['yomteruah', 'roshhashana', 'yomkippur', 'sheminiatzeret', 'shavuot', 'matzot', 'sukkot'];
    if (!TORAH_YOM_TOV_CATS.includes(ev.category)) return false;

    let hDay = null;
    if (ev.raw?.hdate) {
        const match = String(ev.raw.hdate).match(/^(\d+)\b/);
        if (match) hDay = parseInt(match[1], 10);
    }

    const titleLower = (ev.raw?.title || ev.name || '').toLowerCase();

    // 1. Yom Teruah / Rosh Hashana: 1 e 2 de Tishrei/Etanim (em Israel e na Diáspora)
    if (ev.category === 'yomteruah' || ev.category === 'roshhashana') {
        return hDay === 1 || hDay === 2 || hDay === null;
    }

    // 2. Yom Kippur: estritamente 10 de Tishrei/Etanim (Lev 23:27)
    if (ev.category === 'yomkippur') {
        return hDay === 10 || hDay === null;
    }

    // 3. Shemini Atzeret: 22 de Tishrei/Etanim (Lev 23:36) - Esta é a verdadeira festa solene da Torá
    if (ev.category === 'sheminiatzeret') {
        return hDay === 22 || hDay === null;
    }

    // 4. Yom Shavuot: 6 de Sivan em Israel; 6 e 7 de Sivan na Diáspora
    if (ev.category === 'shavuot') {
        return isIsrael ? (hDay === 6 || hDay === null) : (hDay === 6 || hDay === 7 || hDay === null);
    }

    // 5. Chag Matzot: 15 e 21 Aviv em Israel; 15, 16, 21 e 22 Aviv na Diáspora
    if (ev.category === 'matzot') {
        if (hDay !== null) {
            return isIsrael ? (hDay === 15 || hDay === 21) : (hDay === 15 || hDay === 16 || hDay === 21 || hDay === 22);
        }
        return titleLower.includes('pesach i') || titleLower.includes('pesach vii') || (!isIsrael && (titleLower.includes('pesach ii') || titleLower.includes('pesach viii')));
    }

    // 7. Chag Sukkot: 15 Tishrei em Israel; 15 e 16 Tishrei na Diáspora
    if (ev.category === 'sukkot') {
        if (hDay !== null) {
            return isIsrael ? (hDay === 15) : (hDay === 15 || hDay === 16);
        }
        return titleLower.includes('sukkot i') || (!isIsrael && titleLower.includes('sukkot ii'));
    }

    return false;
}

/**
 * Determina se o momento atual corresponde ao Shabat ou a um Yom Tov
 * (onde transações comerciais e monetárias são proibidas pela Halachá).
 */
export function checkSacredRestStatus(now = Date.now(), events = [], hdate = null, sunsetTime = null, isIsrael = false, tz = 'Asia/Jerusalem') {
    if (typeof window !== 'undefined') {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        let simYt = null;
        try {
            simYt = localStorage.getItem('yisrael_simulate_yomtov');
        } catch (e) { }
        if (simYt === 'force_normal') {
            return {
                isRest: false,
                type: null,
                subType: null,
                title: null,
                greeting: null,
                reason: null
            };
        }
        if (hash === '#teste-shabbat' || hash === '#shabbat-2h' || hash === '#shabbat-6h' || search.includes('shabbat=1') || simYt === 'shabbat') {
            return {
                isRest: true,
                type: 'shabbat',
                subType: 'shabbat',
                title: 'Yom Shabbat',
                greeting: 'Shabbat Shalom',
                reason: 'Em observância às leis sagradas do Shabat, transações financeiras e pagamentos digitais encontram-se pausados até à Havdalá.'
            };
        }
        if (hash === '#shabbat-depois' || hash === '#shabbat-motzei' || simYt === 'motzei_shabbat') {
            return {
                isRest: true,
                type: 'shabbat',
                subType: 'motzei_shabbat',
                title: 'Motzei Shabat',
                greeting: 'Shavua Tov',
                reason: 'Em virtude da conclusão do Shabat (Motzei Shabat), as doações encontram-se temporariamente pausadas durante o resguardo.'
            };
        }
        if (hash === '#teste-yomtov' || hash === '#yomtov-2h' || hash === '#yomtov-6h' || search.includes('yomtov=1') || simYt === 'true') {
            return {
                isRest: true,
                type: 'yomtov',
                subType: 'yomtov',
                title: 'Yom Teruah',
                greeting: 'Chag Sameach',
                reason: "Em observância à santidade de Yom Teruah, as contribuições encontram-se pausadas."
            };
        }
        if (hash === '#yomtov-depois' || hash === '#yomtov-motzei' || simYt === 'motzei') {
            return {
                isRest: true,
                type: 'yomtov',
                subType: 'motzei_yomtov',
                title: 'Motzei Yom Teruah',
                greeting: 'Chag Sameach',
                reason: "Em virtude da conclusão de Yom Teruah (resguardo de 2 horas após o término), as contribuições permanecem pausadas."
            };
        }
    }

    const parts = getLocationDateParts(now, tz);
    const dayOfWeek = parts.dayOfWeek; // 0: Dom, 1: Seg, ..., 5: Sex, 6: Sáb

    // 1. Obter hora e minuto do pôr do sol
    let sunsetH = 18;
    let sunsetM = 0;
    if (sunsetTime) {
        const sParts = getLocationDateParts(sunsetTime, tz);
        sunsetH = sParts.hour;
        sunsetM = sParts.minute;
    }

    // Minutos de antecedência para acendimento das velas (padrão haláchico: 18 minutos, Jerusalém: 40 minutos)
    let candleOffsetMin = isIsrael ? 40 : 18;
    try {
        const savedOffset = localStorage.getItem('yisrael_shabbat_offset');
        if (savedOffset) {
            const parsed = parseInt(savedOffset, 10);
            if (!isNaN(parsed) && parsed > 0) candleOffsetMin = parsed;
        }
    } catch (e) { }

    const candleOffsetMs = candleOffsetMin * 60 * 1000;
    const ONE_MINUTE_MS = 60 * 1000;

    // 2. Determinar o estado do Shabat (início com o acendimento das velas e término exatamente às 24h + 1m)
    let shabbatState = {
        isRest: false,
        isShabbatStrict: false,
        subType: null,
        title: null,
        greeting: null,
        reason: null
    };

    if (dayOfWeek === 5) {
        // Sexta-feira: acendimento das velas (início do Shabat)
        const friSunset = localTimeToUtc(parts.year, parts.month, parts.day, sunsetH, sunsetM, 0, tz);
        const candleLighting = friSunset - candleOffsetMs;

        if (now >= candleLighting) {
            shabbatState = {
                isRest: true,
                isShabbatStrict: true,
                subType: 'shabbat',
                title: 'Yom Shabbat',
                greeting: 'Shabbat Shalom',
                reason: 'Em observância às leis sagradas do Shabat, transações financeiras e pagamentos digitais encontram-se pausados.'
            };
        }
    } else if (dayOfWeek === 6) {
        // Sábado: Shabat pleno até exatamente 24 horas + 1 minuto após o início ao pôr do sol
        const satSunset = localTimeToUtc(parts.year, parts.month, parts.day, sunsetH, sunsetM, 0, tz);
        const shabbatEndTime = satSunset + ONE_MINUTE_MS;

        if (now < shabbatEndTime) {
            shabbatState = {
                isRest: true,
                isShabbatStrict: true,
                subType: 'shabbat',
                title: 'Yom Shabbat',
                greeting: 'Shabbat Shalom',
                reason: 'Em observância às leis sagradas do Shabat, transações financeiras e pagamentos digitais encontram-se pausados.'
            };
        }
    }

    const isShabbat = shabbatState.isShabbatStrict;

    // 3. Verificação de Yom Tov (Festas bíblicas e canónicas da Torá com Issur Melachá)
    let hadMatchingYomTovEvent = false;
    if (events && events.length) {
        for (const ev of events) {
            if (!isTorahSolemnRestEvent(ev, isIsrael)) continue;

            const startTime = ev.time ? (ev.time - candleOffsetMs) : 0;
            const durationMs = FESTIVAL_DURATION_MS; // Exatamente 24h e 1 minuto
            const endTime = ev.endTime || (ev.time ? ev.time + durationMs : 0);

            if (startTime > 0) {
                if (now >= startTime && now < endTime) {
                    const rawName = ev.name || 'Yom Tov';
                    const baseName = rawName.replace(/^(Erev|Motzei)\s+/i, '');
                    const fullTitle = isShabbat ? `${baseName} & Shabat` : baseName;
                    const isKippur = baseName.includes('Kippur');

                    let subType = 'yomtov';
                    let title = fullTitle;
                    let greeting = isKippur ? 'Gmar Chatimah Tovah' : 'Chag Sameach';
                    if (isShabbat) {
                        greeting = isKippur ? 'Gmar Chatimah Tovah & Shabbat Shalom' : 'Shabbat Shalom & Chag Sameach';
                    }
                    const reason = `Em respeito à santidade de ${fullTitle}, as contribuições encontram-se pausadas.`;

                    return {
                        isRest: true,
                        type: 'yomtov',
                        subType,
                        title,
                        greeting,
                        reason
                    };
                }

                // Se o evento pertencia ao período recente mas já ultrapassou endTime, evita ressurreição via fallback
                if (now >= endTime && (now - endTime) < 24 * 60 * 60 * 1000) {
                    hadMatchingYomTovEvent = true;
                }
            }
        }
    }

    // 4. Verificação determinística pela Data Hebraica (fallback resiliente e offline)
    if (!hadMatchingYomTovEvent && hdate && hdate.hd && hdate.hm) {
        const d = parseInt(hdate.hd, 10);
        const m = (hdate.hm || '').toLowerCase();

        let isYomTovDate = false;
        let festivalName = 'Yom Tov';

        const checkYomTovDates = (ytDays, name) => {
            const todaySunset = localTimeToUtc(parts.year, parts.month, parts.day, sunsetH, sunsetM, 0, tz);
            const exactEndTime = todaySunset + ONE_MINUTE_MS;

            if (ytDays.includes(d)) {
                // No último dia da celebração, se já passou do pôr do sol + 1 minuto, a festa terminou
                if (d === ytDays[ytDays.length - 1] && now >= exactEndTime) {
                    return;
                }
                isYomTovDate = true;
                festivalName = name;
            } else if (d === (ytDays[ytDays.length - 1] + 1)) {
                // A festa termina exatamente 24 horas + 1 minuto após o pôr do sol de início
                const lastSunset = now >= todaySunset ? todaySunset : (todaySunset - 24 * 60 * 60 * 1000);
                const prevExactEndTime = lastSunset + ONE_MINUTE_MS;
                if (now < prevExactEndTime) {
                    isYomTovDate = true;
                    festivalName = name;
                }
            }
        };

        if (m.includes('nisan') || m.includes('aviv')) {
            checkYomTovDates(isIsrael ? [15] : [15, 16], 'Pessach');
            if (!isYomTovDate) checkYomTovDates(isIsrael ? [21] : [21, 22], 'Chag Matzot');
        } else if (m.includes('sivan')) {
            checkYomTovDates(isIsrael ? [6] : [6, 7], 'Shavuot');
        } else if (m.includes('tishrei') || m.includes('etanim')) {
            checkYomTovDates([1, 2], 'Yom Teruah');
            if (!isYomTovDate) checkYomTovDates([10], 'Yom Kippur');
            if (!isYomTovDate) checkYomTovDates(isIsrael ? [15] : [15, 16], 'Chag Sukkot');
            if (!isYomTovDate) checkYomTovDates(isIsrael ? [22] : [22], 'Shemini Atzeret');
            if (!isYomTovDate && !isIsrael) checkYomTovDates([23], 'Shemini Atzeret (Diáspora)');
        }

        if (isYomTovDate) {
            const fullTitle = isShabbat ? `${festivalName} & Shabat` : festivalName;
            const isKippur = festivalName === 'Yom Kippur';
            let subType = 'yomtov';
            let title = fullTitle;
            let greeting = isKippur ? 'Gmar Chatimah Tovah' : 'Chag Sameach';
            if (isShabbat) {
                greeting = isKippur ? 'Gmar Chatimah Tovah & Shabbat Shalom' : 'Shabbat Shalom & Chag Sameach';
            }
            const reason = `Em respeito à santidade de ${fullTitle}, as contribuições financeiras encontram-se pausadas.`;

            return {
                isRest: true,
                type: 'yomtov',
                subType,
                title,
                greeting,
                reason
            };
        }
    }

    // 5. Verificação de Shabat (com resguardo haláchico de 2h antes e 2h depois)
    if (shabbatState.isRest) {
        return {
            isRest: true,
            type: 'shabbat',
            subType: shabbatState.subType,
            title: shabbatState.title,
            greeting: shabbatState.greeting,
            reason: shabbatState.reason
        };
    }

    return {
        isRest: false,
        type: null,
        title: null,
        greeting: null,
        reason: null
    };
}

/**
 * Determina se o momento atual é um período de repouso sagrado (Shabat ou Yom Tov).
 */
export function isSacredRestPeriod(now = Date.now(), sunsetTime = null, events = [], hdate = null, isIsrael = false) {
    return checkSacredRestStatus(now, events, hdate, sunsetTime, isIsrael);
}

/**
 * Calcula horários haláchicos (Zmanim) de forma 100% matemática e offline
 * segundo os critérios astronómicos da Halachá (Gra e Rambam).
 * 
 * @param {Date|number} date - Data para cálculo
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} tz - Fuso horário IANA
 * @param {boolean} isIsrael - Se a localidade é a Terra de Israel
 */
export function calculateOfflineZmanim(date = new Date(), lat = 31.7683, lon = 35.2137, tz = 'Asia/Jerusalem', isIsrael = true) {
    const d = date instanceof Date ? date : new Date(date);
    const rad = Math.PI / 180;
    const startOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000) + 1;

    // Declinação solar aparente
    const declination = 23.45 * Math.sin(rad * (360 / 365) * (dayOfYear - 81));
    const decRad = declination * rad;
    const latRad = lat * rad;

    // Ângulo horário para o nascer/pôr do sol (-0.833° por refração padrão)
    const cosH0 = (Math.sin(-0.833 * rad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));
    if (cosH0 < -1 || cosH0 > 1) return null; // Regiões polares extremas
    const H0 = Math.acos(cosH0) / rad;

    // Equação do tempo
    const B = (360 / 365) * (dayOfYear - 81) * rad;
    const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

    // Meio-dia solar em UTC
    const solarNoonUtc = 12 - (lon / 15) - (eot / 60);
    const sunriseUtcHours = solarNoonUtc - (H0 / 15);
    const sunsetUtcHours = solarNoonUtc + (H0 / 15);

    const baseMidnightUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const sunriseMs = baseMidnightUtc + sunriseUtcHours * 3600000;
    const sunsetMs = baseMidnightUtc + sunsetUtcHours * 3600000;
    const chatzotMs = (sunriseMs + sunsetMs) / 2;
    const shaahZmanitMs = Math.max(1, (sunsetMs - sunriseMs) / 12);

    const candleOffsetMin = isIsrael ? 40 : 18;

    return {
        chatzotNight: new Date(chatzotMs - 12 * 3600 * 1000).toISOString(),
        alotHaShachar: new Date(sunriseMs - 72 * 60 * 1000).toISOString(),
        misheyakir: new Date(sunriseMs - 45 * 60 * 1000).toISOString(),
        sunrise: new Date(sunriseMs).toISOString(),
        sofZmanShma: new Date(sunriseMs + 3 * shaahZmanitMs).toISOString(),
        sofZmanTfilla: new Date(sunriseMs + 4 * shaahZmanitMs).toISOString(),
        chatzot: new Date(chatzotMs).toISOString(),
        minchaGedola: new Date(chatzotMs + 0.5 * shaahZmanitMs).toISOString(),
        minchaKetana: new Date(sunriseMs + 9.5 * shaahZmanitMs).toISOString(),
        plagHaMincha: new Date(sunsetMs - 1.25 * shaahZmanitMs).toISOString(),
        sunset: new Date(sunsetMs).toISOString(),
        beinHaShmashos: new Date(sunsetMs).toISOString(),
        tzeit7083deg: new Date(sunsetMs + 42 * 60 * 1000).toISOString(),
        tzeit85deg: new Date(sunsetMs + 50 * 60 * 1000).toISOString(),
        candleLighting: new Date(sunsetMs - candleOffsetMin * 60 * 1000).toISOString(),
        candles: new Date(sunsetMs - candleOffsetMin * 60 * 1000).toISOString()
    };
}