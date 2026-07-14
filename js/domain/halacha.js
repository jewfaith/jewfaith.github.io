import { BOOK_MAP } from './constants.js';

export function transliterateTorah(text) {
    if (!text) return text;
    let result = text;
    for (const [eng, heb] of Object.entries(BOOK_MAP)) {
        result = result.replace(new RegExp(eng, 'g'), heb);
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
    // Uma diferença de mais de 5 dias indica um evento em data ou ano diferente
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

    // Encontra o cluster que está ativo no momento "now"
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
        if (span && now >= span.start && now < span.end)
            return { ...span.evt, dayIndex: span.dayIndex };
    }
    return null;
}
