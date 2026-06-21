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
    let dayIndex = 0;
    for (let i = 0; i < evts.length; i++) {
        if (now >= evts[i].time) dayIndex = i;
    }
    return {
        start: evts[0].time,
        end: evts[evts.length - 1].time + twentyFourHoursMs,
        evt: evts[0],
        dayIndex
    };
}

export function findActiveFestival(events, now, twentyFourHoursMs, cats) {
    for (const cat of cats) {
        const span = getFestivalSpan(events, now, twentyFourHoursMs, cat);
        if (span && now >= span.start && now < span.end)
            return { ...span.evt, dayIndex: span.dayIndex };
    }
    return null;
}
