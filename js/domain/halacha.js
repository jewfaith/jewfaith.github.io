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

export function getFestivalSpan(events, now, twentyFourHoursMs, cat) {
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
        const start = cluster[0].time;
        const end = cluster[cluster.length - 1].time + twentyFourHoursMs;
        if (now >= start && now < end) {
            let dayIndex = 0;
            for (let i = 0; i < cluster.length; i++) {
                if (now >= cluster[i].time) dayIndex = i;
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

export function findActiveFestival(events, now, twentyFourHoursMs, cats) {
    for (const cat of cats) {
        const span = getFestivalSpan(events, now, twentyFourHoursMs, cat);
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

    let daysUntilFriday = (5 - day + 7) % 7;
    const thisFridaySunset = localTimeToUtc(parts.year, parts.month, parts.day + daysUntilFriday, sunsetH, sunsetM, 0, tz);
    const thisSaturdayEnd = thisFridaySunset + (25 * 60 * 60 * 1000);

    let shabbatStart = thisFridaySunset;
    let shabbatEnd = thisSaturdayEnd;

    if (day === 5 && now >= thisFridaySunset) {
        shabbatStart = thisFridaySunset;
        shabbatEnd = thisSaturdayEnd;
    } else if (day === 6) {
        const prevFridaySunset = localTimeToUtc(parts.year, parts.month, parts.day - 1, sunsetH, sunsetM, 0, tz);
        const saturdayEnd = prevFridaySunset + (25 * 60 * 60 * 1000);

        if (now <= saturdayEnd) {
            shabbatStart = prevFridaySunset;
            shabbatEnd = saturdayEnd;
        } else {
            const nextFridaySunset = localTimeToUtc(parts.year, parts.month, parts.day + 6, sunsetH, sunsetM, 0, tz);
            shabbatStart = nextFridaySunset;
            shabbatEnd = nextFridaySunset + (25 * 60 * 60 * 1000);
        }
    }

    return {
        name: 'Yom Shabbat',
        twoWordTitle: 'Yom Shabbat',
        category: 'shabbat',
        isBiblical: true,
        isTraditional: false,
        time: shabbatStart,
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
export function isTorahSolemnRestEvent(ev) {
    if (!ev || !ev.isBiblical) return false;

    const TORAH_YOM_TOV_CATS = ['yomteruah', 'yomkippur', 'sheminiatzeret', 'shavuot', 'matzot', 'sukkot'];
    if (!TORAH_YOM_TOV_CATS.includes(ev.category)) return false;

    let hDay = null;
    if (ev.raw?.hdate) {
        const match = String(ev.raw.hdate).match(/^(\d+)\b/);
        if (match) hDay = parseInt(match[1], 10);
    }

    const titleLower = (ev.raw?.title || ev.name || '').toLowerCase();

    // 1. Yom Teruah: estritamente 1 de Tishrei/Etanim (Lev 23:24)
    if (ev.category === 'yomteruah') {
        return hDay === 1 || hDay === null;
    }

    // 2. Yom Kippur: estritamente 10 de Tishrei/Etanim (Lev 23:27)
    if (ev.category === 'yomkippur') {
        return hDay === 10 || hDay === null;
    }

    // 3. Shemini Atzeret: estritamente 22 de Tishrei/Etanim (Lev 23:36)
    if (ev.category === 'sheminiatzeret') {
        return hDay === 22 || hDay === null;
    }

    // 4. Yom Shavuot: estritamente 6 de Sivan (Lev 23:21) - 1 único dia
    if (ev.category === 'shavuot') {
        return hDay === 6 || hDay === null;
    }

    // 5. Chag Matzot: estritamente o 1º dia (15 Aviv) e o 7º dia (21 Aviv) (Lev 23:7-8).
    // Os dias 16 a 20 são Chol HaMoed; o 8º dia (22) é rabínico da Diáspora.
    if (ev.category === 'matzot') {
        if (hDay !== null) {
            return hDay === 15 || hDay === 21;
        }
        return (titleLower.includes('pesach i') && !titleLower.includes('pesach ii')) || titleLower.includes('pesach vii');
    }

    // 6. Chag Sukkot: estritamente o 1º dia (15 Etanim/Tishrei) (Lev 23:35).
    // Os dias 16 a 21 são Chol HaMoed; o 2º dia da Diáspora não é ordenança da Torá.
    if (ev.category === 'sukkot') {
        if (hDay !== null) {
            return hDay === 15;
        }
        return titleLower.includes('sukkot i') && !titleLower.includes('sukkot ii');
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
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

    // 2. Determinar o estado do Shabat (início com o acendimento das velas e término pós-Havdalá)
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
                reason: 'Em observância às leis sagradas do Shabat, transações financeiras e pagamentos digitais encontram-se pausados até à Havdalá.'
            };
        }
    } else if (dayOfWeek === 6) {
        // Sábado: Shabat pleno e resguardo pós-Havdalá (2 horas)
        const satSunset = localTimeToUtc(parts.year, parts.month, parts.day, sunsetH, sunsetM, 0, tz);
        const havdalahTime = satSunset + (45 * 60 * 1000);
        const motzeiShabbatBufferEnd = havdalahTime + TWO_HOURS_MS;

        if (now < havdalahTime) {
            shabbatState = {
                isRest: true,
                isShabbatStrict: true,
                subType: 'shabbat',
                title: 'Yom Shabbat',
                greeting: 'Shabbat Shalom',
                reason: 'Em observância às leis sagradas do Shabat, transações financeiras e pagamentos digitais encontram-se pausados até à Havdalá.'
            };
        } else if (now <= motzeiShabbatBufferEnd) {
            shabbatState = {
                isRest: true,
                isShabbatStrict: false,
                subType: 'motzei_shabbat',
                title: 'Motzei Shabat',
                greeting: 'Shavua Tov',
                reason: 'Em virtude da conclusão do Shabat (Motzei Shabat), as doações permanecem pausadas.'
            };
        }
    } else if (dayOfWeek === 0) {
        // Domingo de madrugada: resguardo pós-Havdalá do sábado (2 horas)
        const prevSatSunset = localTimeToUtc(parts.year, parts.month, parts.day - 1, sunsetH, sunsetM, 0, tz);
        const havdalahTime = prevSatSunset + (45 * 60 * 1000);
        const motzeiShabbatBufferEnd = havdalahTime + TWO_HOURS_MS;

        if (now <= motzeiShabbatBufferEnd) {
            shabbatState = {
                isRest: true,
                isShabbatStrict: false,
                subType: 'motzei_shabbat',
                title: 'Motzei Shabat',
                greeting: 'Shavua Tov',
                reason: 'Em virtude da conclusão do Shabat (Motzei Shabat), as doações permanecem pausadas.'
            };
        }
    }

    const isShabbat = shabbatState.isShabbatStrict;

    // 3. Verificação de Yom Tov (Festas bíblicas da Torá com Issur Melachá segundo Vayikra 23)
    if (events && events.length) {
        for (const ev of events) {
            if (!isTorahSolemnRestEvent(ev)) continue;

            const startTime = ev.time ? (ev.time - candleOffsetMs) : 0;
            const durationMs = 25.5 * 60 * 60 * 1000; // ~25 horas e meia desde a entrada até à saída das estrelas
            const endTime = ev.endTime || (ev.time ? ev.time + durationMs : 0);

            if (startTime > 0) {
                const bufferEndTime = endTime + TWO_HOURS_MS;

                if (now >= startTime && now <= bufferEndTime) {
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
                    let reason = '';

                    if (now > endTime) {
                        subType = 'motzei_yomtov';
                        title = `Motzei ${fullTitle}`;
                        greeting = isKippur ? 'Gmar Chatimah Tovah' : 'Shavua Tov / Chag Sameach';
                        reason = `Em virtude da conclusão de ${fullTitle} (resguardo de 2 horas após o término da data sagrada), as contribuições permanecem pausadas.`;
                    } else {
                        subType = 'yomtov';
                        reason = `Em respeito à santidade de ${fullTitle}, as contribuições encontram-se pausadas.`;
                    }

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
        }
    }

    // 4. Verificação determinística pela Data Hebraica (fallback resiliente e offline)
    if (hdate && hdate.hd && hdate.hm) {
        const d = parseInt(hdate.hd, 10);
        const m = (hdate.hm || '').toLowerCase();

        let isYomTovDate = false;
        let isMotzeiYomTov = false;
        let festivalName = 'Yom Tov';

        const checkYomTovDates = (ytDays, name) => {
            if (ytDays.includes(d)) {
                isYomTovDate = true;
                festivalName = name;
            } else if (d === (ytDays[ytDays.length - 1] + 1)) {
                const todaySunset = localTimeToUtc(parts.year, parts.month, parts.day, sunsetH, sunsetM, 0, tz);
                const lastSunset = now >= todaySunset ? todaySunset : (todaySunset - 24 * 60 * 60 * 1000);
                const havdalahApproxMs = lastSunset + (45 * 60 * 1000);
                const twoHoursAfterHavdalah = havdalahApproxMs + TWO_HOURS_MS;
                if (now <= twoHoursAfterHavdalah) {
                    isMotzeiYomTov = true;
                    festivalName = name;
                }
            }
        };

        if (m.includes('nisan')) {
            checkYomTovDates([15], 'Pessach');
            if (!isYomTovDate && !isMotzeiYomTov) checkYomTovDates([21], 'Chag Matzot');
        } else if (m.includes('sivan')) {
            checkYomTovDates([6], 'Shavuot');
        } else if (m.includes('tishrei')) {
            checkYomTovDates([1], 'Yom Teruah');
            if (!isYomTovDate && !isMotzeiYomTov) checkYomTovDates([10], 'Yom Kippur');
            if (!isYomTovDate && !isMotzeiYomTov) checkYomTovDates([15], 'Chag Sukkot');
            if (!isYomTovDate && !isMotzeiYomTov) checkYomTovDates([22], 'Shemini Atzeret');
        }

        if (isYomTovDate || isMotzeiYomTov) {
            const fullTitle = isShabbat ? `${festivalName} & Shabat` : festivalName;
            const isKippur = festivalName === 'Yom Kippur';
            let subType = isMotzeiYomTov ? 'motzei_yomtov' : 'yomtov';
            let title = isMotzeiYomTov ? `Motzei ${fullTitle}` : fullTitle;
            let greeting = isKippur ? 'Gmar Chatimah Tovah' : 'Chag Sameach';
            if (isShabbat) {
                greeting = isKippur ? 'Gmar Chatimah Tovah & Shabbat Shalom' : 'Shabbat Shalom & Chag Sameach';
            } else if (isMotzeiYomTov) {
                greeting = isKippur ? 'Gmar Chatimah Tovah' : 'Shavua Tov / Chag Sameach';
            }

            let reason = '';
            if (isMotzeiYomTov) {
                reason = `Em virtude da conclusão de ${fullTitle} (resguardo de 2 horas após o término da data sagrada), as contribuições permanecem pausadas.`;
            } else {
                reason = `Em respeito à santidade de ${fullTitle}, as contribuições financeiras encontram-se pausadas.`;
            }

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
        alotHaShachar: new Date(sunriseMs - 72 * 60 * 1000).toISOString(),
        misheyakir: new Date(sunriseMs - 45 * 60 * 1000).toISOString(),
        sunrise: new Date(sunriseMs).toISOString(),
        sofZmanShma: new Date(sunriseMs + 3 * shaahZmanitMs).toISOString(),
        sofZmanTfilla: new Date(sunriseMs + 4 * shaahZmanitMs).toISOString(),
        chatzot: new Date(chatzotMs).toISOString(),
        minchaGedola: new Date(chatzotMs + 0.5 * shaahZmanitMs).toISOString(),
        sunset: new Date(sunsetMs).toISOString(),
        tzeit7083deg: new Date(sunsetMs + 42 * 60 * 1000).toISOString(),
        tzeit85deg: new Date(sunsetMs + 50 * 60 * 1000).toISOString(),
        candleLighting: new Date(sunsetMs - candleOffsetMin * 60 * 1000).toISOString(),
        candles: new Date(sunsetMs - candleOffsetMin * 60 * 1000).toISOString()
    };
}