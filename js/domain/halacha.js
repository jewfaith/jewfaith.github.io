import { BOOK_MAP } from './constants.js';

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

export function getNextShabbatEvent(now = Date.now(), sunsetTime = null) {
    const nowDate = new Date(now);
    const day = nowDate.getDay(); // 0: Dom, 1: Seg, ..., 5: Sex, 6: Sáb

    let sunsetH = 18;
    let sunsetM = 0;
    if (sunsetTime) {
        const sDate = new Date(sunsetTime);
        if (!isNaN(sDate.getTime())) {
            sunsetH = sDate.getHours();
            sunsetM = sDate.getMinutes();
        }
    }

    let daysUntilFriday = (5 - day + 7) % 7;
    const thisFridaySunset = new Date(
        nowDate.getFullYear(),
        nowDate.getMonth(),
        nowDate.getDate() + daysUntilFriday,
        sunsetH,
        sunsetM,
        0,
        0
    ).getTime();

    const thisSaturdayEnd = thisFridaySunset + (25 * 60 * 60 * 1000);

    let shabbatStart = thisFridaySunset;
    let shabbatEnd = thisSaturdayEnd;

    if (day === 5 && now >= thisFridaySunset) {
        shabbatStart = thisFridaySunset;
        shabbatEnd = thisSaturdayEnd;
    } else if (day === 6) {
        const prevFridaySunset = new Date(
            nowDate.getFullYear(),
            nowDate.getMonth(),
            nowDate.getDate() - 1,
            sunsetH,
            sunsetM,
            0,
            0
        ).getTime();
        const saturdayEnd = prevFridaySunset + (25 * 60 * 60 * 1000);

        if (now <= saturdayEnd) {
            shabbatStart = prevFridaySunset;
            shabbatEnd = saturdayEnd;
        } else {
            const nextFridaySunset = new Date(
                nowDate.getFullYear(),
                nowDate.getMonth(),
                nowDate.getDate() + 6,
                sunsetH,
                sunsetM,
                0,
                0
            ).getTime();
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