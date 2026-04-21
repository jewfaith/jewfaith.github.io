const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

let timerInterval = null;
let unifiedEvents = [];
let userLocation = null;
let currentSunsetTime = 0;

const BOOK_MAP = {
    'Genesis': 'Bereshit',
    'Exodus': 'Shemot',
    'Leviticus': 'Vayikra',
    'Numbers': 'Bamidbar',
    'Deuteronomy': 'Devarim'
};

function transliterateTorah(text) {
    if (!text) return text;
    let result = text;
    for (const [eng, heb] of Object.entries(BOOK_MAP)) {
        result = result.replace(new RegExp(eng, 'g'), heb);
    }
    return result;
}

// Use plain fetch — Hebcal API has CORS enabled (Access-Control-Allow-Origin: *)
// This works even when opened as a local file://
async function hebcalFetch(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}


function setCookie(name, value, minutes) {
    const d = new Date();
    d.setTime(d.getTime() + (minutes * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + JSON.stringify(value) + ";" + expires + ";path=/";
}

function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return JSON.parse(c.substring(nameEQ.length, c.length));
    }
    return null;
}

const TZ_FALLBACKS = {
    'America/Sao_Paulo': { lat: -23.5505, lon: -46.6333 },
    'America/New_York': { lat: 40.6782, lon: -73.9442 },
    'America/Chicago': { lat: 41.8781, lon: -87.6298 },
    'America/Los_Angeles': { lat: 34.0522, lon: -118.2437 },
    'America/Argentina/Buenos_Aires': { lat: -34.6037, lon: -58.3816 },
    'Europe/London': { lat: 51.5074, lon: -0.1278 },
    'Europe/Paris': { lat: 48.8566, lon: 2.3522 },
    'Europe/Lisbon': { lat: 38.7223, lon: -9.1393 },
    'Europe/Madrid': { lat: 40.4168, lon: -3.7038 },
    'Europe/Berlin': { lat: 52.5200, lon: 13.4050 },
    'Europe/Rome': { lat: 41.9028, lon: 12.4964 },
    'Asia/Jerusalem': { lat: 31.7683, lon: 35.2137 },
    'Asia/Tel_Aviv': { lat: 32.0853, lon: 34.7818 },
    'Asia/Hong_Kong': { lat: 22.3193, lon: 114.1694 },
    'Australia/Sydney': { lat: -33.8688, lon: 151.2093 }
};

async function getGeolocation() {
    const cachedLoc = getCookie('user_loc');
    if (cachedLoc) return cachedLoc;

    const sysTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const endpoints = [
        { url: 'https://freeipapi.com/api/json', lat: 'latitude', lon: 'longitude', tz: 'timeZone' },
        { url: 'https://ipwho.is/', lat: 'latitude', lon: 'longitude', tz: 'timezone.id' },
        { url: 'https://ipapi.co/json/', lat: 'latitude', lon: 'longitude', tz: 'timezone' },
        { url: 'https://ipwhois.app/json/', lat: 'latitude', lon: 'longitude', tz: 'timezone' },
        { url: 'https://json.geoiplookup.io/', lat: 'latitude', lon: 'longitude', tz: 'timezone_name' }
    ];

    const results = [];
    const fetchPromises = endpoints.map(async (ep) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3500);
        try {
            const res = await fetch(ep.url, { signal: controller.signal });
            if (!res.ok) return;
            const data = await res.json();
            const lat = parseFloat(data[ep.lat]);
            const lon = parseFloat(data[ep.lon]);

            let apiTz = null;
            if (ep.tz.includes('.')) {
                const parts = ep.tz.split('.');
                apiTz = data[parts[0]] ? data[parts[0]][parts[1]] : null;
            } else {
                apiTz = data[ep.tz];
            }

            if (!isNaN(lat) && !isNaN(lon)) {
                results.push({ lat, lon, tz: apiTz });
            }
        } catch (e) { } finally {
            clearTimeout(id);
        }
    });

    await Promise.allSettled(fetchPromises);

    let finalLoc = null;

    // 1. Filter results that match system timezone (Detect VPNs)
    const matchingTz = results.filter(r => r.tz === sysTimezone);
    if (matchingTz.length > 0) {
        const avgLat = matchingTz.reduce((sum, r) => sum + r.lat, 0) / matchingTz.length;
        const avgLon = matchingTz.reduce((sum, r) => sum + r.lon, 0) / matchingTz.length;
        finalLoc = { lat: avgLat, lon: avgLon };
    }
    // 2. Fallback to any active IP result
    else if (results.length > 0) {
        const avgLat = results.reduce((sum, r) => sum + r.lat, 0) / results.length;
        const avgLon = results.reduce((sum, r) => sum + r.lon, 0) / results.length;
        finalLoc = { lat: avgLat, lon: avgLon };
    }
    // 3. Fallback to Timezone-to-Coord map
    else if (TZ_FALLBACKS[sysTimezone]) {
        finalLoc = { ...TZ_FALLBACKS[sysTimezone] };
    }

    if (finalLoc) {
        setCookie('user_loc', finalLoc, 1440);
        return finalLoc;
    }

    return null;
}

async function updateDashboard() {
    const grid = document.getElementById('upcoming-events-grid');
    if (grid) {
        grid.innerHTML = '<div class="events-list-container glass-panel" style="grid-column:1/-1;text-align:center;padding:28px;color:#94a3b8;">Sincronizando com Hebcal</div>';
    }

    try {
        if (!userLocation) {
            userLocation = await getGeolocation();
        }

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const dateStr = today.toISOString().split('T')[0];
        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 6);
        const endDateStr = endDate.toISOString().split('T')[0];

        // Fallback: Jerusalem if geolocation unavailable
        const lat = userLocation ? userLocation.lat : 31.7683;
        const lon = userLocation ? userLocation.lon : 35.2137;
        const geoWasDetected = !!userLocation;

        // 1. Get Location Name via Nominatim (OpenStreetMap) — more reliable than BigDataCloud
        let locationName = "Jerusalém";
        if (geoWasDetected) {
            try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 5000);
                const locRes = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=pt`,
                    { signal: ctrl.signal, headers: { 'Accept-Language': 'pt' } }
                );
                clearTimeout(tid);
                if (locRes.ok) {
                    const locData = await locRes.json();
                    const addr = locData.address || {};
                    locationName = addr.city || addr.town || addr.village || addr.county || addr.state || "Jerusalém";
                }
            } catch (e) { /* Keep Jerusalém fallback */ }
        }

        // 2. Zmanim — supports CORS, use fetch() directly (no JSONP needed)
        let sunsetTime = 0;
        try {
            const zmRes = await fetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&date=${dateStr}`);
            const zmanimData = await zmRes.json();
            sunsetTime = zmanimData.times && zmanimData.times.sunset ? new Date(zmanimData.times.sunset).getTime() : 0;
            currentSunsetTime = sunsetTime;
        } catch (e) { console.error('Zmanim failed', e); }
        const isAfterSunset = sunsetTime > 0 && new Date().getTime() > sunsetTime;

        // 3. Hebrew Date — actual today date, cfg=json + callback
        const converterUrl = `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1&strict=1${isAfterSunset ? '&gs=on' : ''}`;
        const hdateData = await hebcalFetch(converterUrl);

        // 4. Events — Inclusive of Rosh Chodesh (nx=on), Omer (o=on), and Major Holidays (maj=on)
        const hebcalUrl = `https://www.hebcal.com/hebcal?v=1&cfg=json&geo=pos&latitude=${lat}&longitude=${lon}&start=${dateStr}&end=${endDateStr}&maj=on&min=off&mod=off&nx=on&mf=off&ss=off&s=on&i=off&c=off&o=on`;
        const hebcalData = await hebcalFetch(hebcalUrl);

        if (hebcalData && hebcalData.items) {
            const biblicalMapping = {
                'Parashat': { name: 'Shabat', transliterated: '', ref: '' },
                'Pesach': { name: 'Pessach', transliterated: 'Pesach', ref: '' },
                'Matzot': { name: 'Chag HaMatzot', transliterated: 'Chag HaMatzot', ref: '' },
                'Shavuot': { name: 'Shavuot', transliterated: 'Shavuot', ref: '' },
                'Rosh Hashana': { name: 'Yom Teruá', transliterated: 'Rosh Hashana', ref: '' },
                'Yom Kippur': { name: 'Yom Kippur', transliterated: 'Yom Kippur', ref: '' },
                'Sukkot': { name: 'Sucot', transliterated: 'Sukkot', ref: '' },
                'Shemini Atzeret': { name: 'Shemini Atzeret', transliterated: 'Shemini Atzeret', ref: '' },
                'Simchat Torah': { name: 'Shemini Atzeret', transliterated: 'Simchat Torah', ref: '' },
                'Rosh Chodesh': { name: 'Rosh Chodesh', transliterated: 'Rosh Chodesh', ref: '' },
                'Omer': { name: 'Sefirat HaOmer', transliterated: 'Sefirat HaOmer', ref: '' }
            };

            const validCategories = ['holiday', 'parashat', 'fast', 'roshchodesh', 'omer'];
            unifiedEvents = hebcalData.items
                .filter(item => validCategories.includes(item.category))
                .map(item => {
                    const parts = item.date.split('-');
                    let dateObj;
                    if (parts.length === 3) {
                        const y = parseInt(parts[0], 10);
                        const m = parseInt(parts[1], 10) - 1;
                        const d = parseInt(parts[2], 10);
                        const sH = sunsetTime ? new Date(sunsetTime).getHours() : 18;
                        const sM = sunsetTime ? new Date(sunsetTime).getMinutes() : 0;
                        dateObj = new Date(y, m, d - 1, sH, sM, 0);
                    } else {
                        dateObj = new Date();
                    }

                    let itemName = item.title;
                    let itemTrans = "";
                    let isBiblical = false;

                    for (const key in biblicalMapping) {
                        if (item.title.includes(key)) {
                            itemName = biblicalMapping[key].name;
                            itemTrans = biblicalMapping[key].transliterated;
                            isBiblical = true;

                            // Special handling for Parashat name as subtitle
                            if (key === 'Parashat') {
                                itemTrans = item.title.replace('Parashat ', '');
                            }
                            break;
                        }
                    }

                    return {
                        name: itemName,
                        transliterated: itemTrans,
                        time: dateObj.getTime(),
                        category: item.category,
                        isBiblical: isBiblical,
                        raw: item
                    };
                });
            updateUIBlocks(unifiedEvents, hdateData, locationName, sunsetTime);
        }

    } catch (err) {
        console.error("Dashboard Sync Failed", err);
        if (grid) {
            grid.innerHTML = `<div class="events-list-container glass-panel" style="grid-column:1/-1;text-align:center;padding:28px;color:#ef4444;">${err.message}</div>`;
        }
    }

    renderEvents();
}

function updateUIBlocks(events, hdate, locationName) {
    const now = new Date().getTime();
    const twentyFiveHoursMs = 25 * 60 * 60 * 1000;

    const upcomingParasha = events.find(e =>
        e.raw.category === 'parashat' && (e.time + twentyFiveHoursMs) > now
    );
    const elParasha = document.getElementById('card-parasha');
    const elTorah = document.getElementById('card-torah');
    const elDate = document.getElementById('card-hdate');
    const elLoc = document.getElementById('card-local');

    const parasha = events.find(e => e.raw.category === 'parashat');
    if (elParasha) {
        let pName = parasha ? parasha.raw.title.replace('Parashat ', '') : '—';
        elParasha.textContent = pName;
    }
    if (elTorah) elTorah.textContent = parasha ? transliterateTorah(parasha.raw.leyning.torah) : '—';
    if (elDate) elDate.textContent = `${hdate.hd} ${hdate.hm}`;
    if (elLoc) elLoc.textContent = locationName || 'Jerusalém';
}

function getEventIcon(category) {
    switch (category) {
        case 'holiday': return '<i class="fa-solid fa-star-of-david"></i>';
        case 'parashat': return '<i class="fa-solid fa-leaf"></i>';
        case 'fast': return '<i class="fa-solid fa-hourglass-half"></i>';
        case 'roshchodesh': return '<i class="fa-solid fa-moon"></i>';
        case 'omer': return '<i class="fa-solid fa-wheat-awn"></i>';
        default: return '<i class="fa-solid fa-calendar-day"></i>';
    }
}

function renderEvents() {
    const grid = document.getElementById('upcoming-events-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const now = new Date().getTime();
    const twentyFiveHoursMs = 25 * 60 * 60 * 1000;

    // Sort all by time
    const sorted = unifiedEvents
        .filter(evt => (evt.time + twentyFiveHoursMs) > now)
        .sort((a, b) => a.time - b.time);

    // 1. Filter out all but the next/active Sefirat HaOmer
    const omerEvents = sorted.filter(e => e.category === 'omer');
    const firstOmer = omerEvents[0];
    const nonOmer = sorted.filter(e => e.category !== 'omer');

    let filtered = firstOmer ? [...nonOmer, firstOmer] : nonOmer;

    // 2. Prioritize Biblical events
    const biblical = filtered.filter(e => e.isBiblical);
    const others = filtered.filter(e => !e.isBiblical);

    // Sort merged by time then isBiblical
    const merged = [...biblical, ...others].sort((a, b) => {
        if (a.time !== b.time) return a.time - b.time;
        return (b.isBiblical ? 1 : 0) - (a.isBiblical ? 1 : 0);
    });

    // 3. De-duplicate and select 1 Shabat + 3 Major
    const unique = [];
    const seenNames = new Set();
    let shabatCount = 0;
    let majorCount = 0;

    for (const item of merged) {
        if (seenNames.has(item.name + item.time)) continue;

        if (item.name === 'Shabat') {
            if (shabatCount < 1) {
                unique.push(item);
                shabatCount++;
                seenNames.add(item.name + item.time);
            }
        } else {
            if (majorCount < 3) {
                unique.push(item);
                majorCount++;
                seenNames.add(item.name + item.time);
            }
        }
        if (shabatCount >= 1 && majorCount >= 3) break;
    }

    const upcoming = unique.sort((a, b) => a.time - b.time);

    if (upcoming.length === 0) {
        grid.innerHTML = '<div class="events-list-container glass-panel" style="grid-column:1/-1;text-align:center;padding:28px;color:#94a3b8;">Sem eventos próximos</div>';
        return;
    }

    upcoming.forEach(evt => {
        const icon = getEventIcon(evt.raw.category);
        const dateLabel = new Date(evt.time).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });

        const card = document.createElement('div');
        card.className = 'events-list-container glass-panel';
        card.innerHTML = `
            <div class="event-card event-item glass-panel">
                <div class="icon-circle yellow">
                    ${icon}
                </div>
                <div class="card-content">
                    <h2 class="card-title">${evt.name}</h2>
                    <span class="timer-countdown" data-time="${evt.time}">--d --h --m</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    startTimers();
}

function startTimers() {
    if (timerInterval) clearInterval(timerInterval);

    function update() {
        const timers = document.querySelectorAll('.timer-countdown');
        const now = new Date().getTime();
        let anyExpired = false;

        timers.forEach(timer => {
            const startTimestamp = parseInt(timer.getAttribute('data-time'));
            const startTimePlus1m = startTimestamp + (1 * 60 * 1000); // 1 min after sunset
            const endTimeMinus2m = startTimestamp + (25 * 60 * 60 * 1000) - (2 * 60 * 1000); // approx 25h - 2min

            const diffToStart = startTimestamp - now;
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

            if (now >= startTimePlus1m && now <= endTimeMinus2m) {
                // Precise "Festa Atual" logic
                timer.textContent = 'Festa Atual';
                timer.style.color = "#94a3b8"; // Highlight yellow
            } else if (now > endTimeMinus2m) {
                // Past the end time (remove after 25h total, but "Festa Atual" label disappears 2m before)
                if (now > (startTimestamp + 25 * 60 * 60 * 1000)) {
                    const card = timer.closest('.events-list-container');
                    if (card) card.remove();
                    anyExpired = true;
                } else {
                    timer.textContent = '--:--';
                }
            } else if (diffToStart > thirtyDaysMs) {
                timer.textContent = 'Em Breve';
            } else {
                const d = String(Math.floor(diffToStart / (1000 * 60 * 60 * 24))).padStart(2, '0');
                const h = String(Math.floor((diffToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
                const m = String(Math.floor((diffToStart % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
                timer.textContent = `${d}d ${h}h ${m}m`;
                timer.style.color = '';
            }
        });

        // If grid is now empty, show a message
        const grid = document.getElementById('upcoming-events-grid');
        if (anyExpired && grid && grid.children.length === 0) {
            grid.innerHTML = '<div class="events-list-container glass-panel" style="grid-column:1/-1;text-align:center;padding:28px;color:#94a3b8;">Sem eventos próximos</div>';
        }
    }

    update();
    timerInterval = setInterval(update, 60000);
}


updateDashboard();
setInterval(updateDashboard, 1800000); // 30 mins sync