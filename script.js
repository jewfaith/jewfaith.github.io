let timerInterval = null;
let unifiedEvents = [];
let userLocation = null;
let currentSunsetTime = 0;

const BOOK_MAP = {
    'Genesis': 'Bereshit',
    'Exodus': 'Shemot',
    'Leviticus': 'Vayikra',
    'Numbers': 'Bamidbar',
    'Deuteronomy': 'Devarim',
    'Joshua': 'Yehoshua',
    'Judges': 'Shoftim',
    'II Samuel': 'II Shmuel',
    'I Samuel': 'I Shmuel',
    '2 Samuel': 'II Shmuel',
    '1 Samuel': 'I Shmuel',
    'II Kings': 'II Melachim',
    'I Kings': 'I Melachim',
    '2 Kings': 'II Melachim',
    '1 Kings': 'I Melachim',
    'Isaiah': 'Yeshayahu',
    'Jeremiah': 'Yirmiyahu',
    'Ezekiel': 'Yechezkel',
    'Hosea': 'Hoshea',
    'Joel': 'Yoel',
    'Amos': 'Amos',
    'Obadiah': 'Ovadia',
    'Jonah': 'Yona',
    'Micah': 'Micha',
    'Nahum': 'Nachum',
    'Habakkuk': 'Chavakuk',
    'Zephaniah': 'Tzefania',
    'Haggai': 'Chagai',
    'Zechariah': 'Zecharia',
    'Malachi': 'Malachi'
};

function transliterateTorah(text) {
    if (!text) return text;
    let result = text;
    for (const [eng, heb] of Object.entries(BOOK_MAP)) {
        result = result.replace(new RegExp(eng, 'g'), heb);
    }
    return result;
}

async function hebcalFetch(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

async function getGeolocation() {
    const sysTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const endpoints = [
        {
            url: 'https://freeipapi.com/api/json',
            parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timeZone })
        },
        {
            url: 'https://ipwho.is/',
            parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone?.id })
        },
        {
            url: 'https://ipapi.co/json/',
            parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone })
        },
        {
            url: 'https://ipwhois.app/json/',
            parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone })
        },
        {
            url: 'https://json.geoiplookup.io/',
            parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone_name })
        },
        {
            url: 'https://ip-api.com/json/',
            parse: (data) => ({ lat: data.lat, lon: data.lon, tz: data.timezone })
        },
        {
            url: 'https://api.ip.sb/geoip',
            parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.timezone })
        },
        {
            url: 'https://reallyfreegeoip.org/json/',
            parse: (data) => ({ lat: data.latitude, lon: data.longitude, tz: data.time_zone })
        },
        {
            url: 'https://ipinfo.io/json',
            parse: (data) => {
                if (!data.loc) return null;
                const [lat, lon] = data.loc.split(',').map(parseFloat);
                return { lat, lon, tz: data.timezone };
            }
        },
        {
            url: 'https://geoplugin.net/json.gp',
            parse: (data) => ({
                lat: data.geoplugin_latitude,
                lon: data.geoplugin_longitude,
                tz: data.geoplugin_timezone
            })
        }
    ];

    const results = [];
    const fetchPromises = endpoints.map(async (ep) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3500);
        try {
            const res = await fetch(ep.url, { signal: controller.signal });
            if (!res.ok) return;
            const data = await res.json();
            const parsed = ep.parse(data);
            if (!parsed) return;
            const lat = parseFloat(parsed.lat);
            const lon = parseFloat(parsed.lon);
            const apiTz = parsed.tz;

            if (!isNaN(lat) && !isNaN(lon)) {
                results.push({ lat, lon, tz: apiTz });
            }
        } catch (e) { } finally {
            clearTimeout(id);
        }
    });

    await Promise.allSettled(fetchPromises);

    let finalLoc = null;

    const matchingTz = results.filter(r => r.tz === sysTimezone);
    const candidates = matchingTz.length > 0 ? matchingTz : results;

    if (candidates.length > 0) {
        // Algoritmo de Consenso (Centroide de Mínima Distância):
        // Escolhe o candidato cuja soma das distâncias para todos os outros seja mínima.
        // Isso elimina automaticamente qualquer outlier de rota/CDN/VPN e dá a maior estabilidade e precisão.
        let bestCandidate = candidates[0];
        let minDistanceSum = Infinity;

        for (const c1 of candidates) {
            let distanceSum = 0;
            for (const c2 of candidates) {
                const dLat = c1.lat - c2.lat;
                const dLon = c1.lon - c2.lon;
                distanceSum += Math.sqrt(dLat * dLat + dLon * dLon);
            }
            if (distanceSum < minDistanceSum) {
                minDistanceSum = distanceSum;
                bestCandidate = c1;
            }
        }
        finalLoc = { lat: bestCandidate.lat, lon: bestCandidate.lon };
    }

    if (finalLoc) {
        return finalLoc;
    }

    return null;
}

async function updateDashboard() {
    const grid = document.getElementById('upcoming-events-grid');
    if (grid) {
        grid.innerHTML = `<div id="upcoming-events-grid" class="event-cards-row upcoming-events-grid">
    <div>
        <div class="event-card event-item glass-panel">
            <div class="icon-circle">
                <i class="fa-solid fa-clock"></i>
            </div>
            <div class="card-content">
                <h2 class="card-title">-</h2>
                <span class="timer-countdown" data-time="">Em Breve</span>
            </div>
        </div>
    </div>

    <div>
        <div class="event-card event-item glass-panel">
            <div class="icon-circle">
                <i class="fa-solid fa-clock"></i>
            </div>
            <div class="card-content">
                <h2 class="card-title">-</h2>
                <span class="timer-countdown" data-time="">Em Breve</span>
            </div>
        </div>
    </div>

    <div>
        <div class="event-card event-item glass-panel">
            <div class="icon-circle">
                <i class="fa-solid fa-clock"></i>
            </div>
            <div class="card-content">
                <h2 class="card-title">-</h2>
                <span class="timer-countdown" data-time="">Em Breve</span>
            </div>
        </div>
    </div>

    <div>
        <div class="event-card event-item glass-panel">
            <div class="icon-circle">
                <i class="fa-solid fa-clock"></i>
            </div>
            <div class="card-content">
                <h2 class="card-title">-</h2>
                <span class="timer-countdown" data-time="">Em Breve</span>
            </div>
        </div>
    </div>

    <div>
        <div class="event-card event-item glass-panel">
            <div class="icon-circle">
                <i class="fa-solid fa-clock"></i>
            </div>
            <div class="card-content">
                <h2 class="card-title">-</h2>
                <span class="timer-countdown" data-time="">Em Breve</span>
            </div>
        </div>
    </div>

    <div>
        <div class="event-card event-item glass-panel">
            <div class="icon-circle">
                <i class="fa-solid fa-clock"></i>
            </div>
            <div class="card-content">
                <h2 class="card-title">-</h2>
                <span class="timer-countdown" data-time="">Em Breve</span>
            </div>
        </div>
    </div>
</div>`;
    }

    try {
        if (!userLocation) {
            userLocation = await getGeolocation();
        }

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 6);
        const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

        let lat = userLocation ? userLocation.lat : 31.7683;
        let lon = userLocation ? userLocation.lon : 35.2137;
        
        // Se houver uma localização exata de GPS salva, sobrepor tudo
        const exactLocRaw = localStorage.getItem('exactLocation');
        if (exactLocRaw) {
            try {
                const exactLoc = JSON.parse(exactLocRaw);
                lat = exactLoc.lat;
                lon = exactLoc.lon;
            } catch(e) {}
        }

        const geoWasDetected = !!userLocation || !!exactLocRaw;

        let locationName = "Jerusalém";
        let isIsrael = true; // default to true since fallback is Jerusalem

        // Determine if in Israel via system timezone first as a quick local check
        const sysTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (geoWasDetected) {
            isIsrael = (sysTimezone === 'Asia/Jerusalem');
        }

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
                    // Mostrar apenas o País ou Cidade + País (priorizando País se existir para maior confiabilidade)
                    const city = addr.city || addr.town || addr.village || addr.state;
                    if (addr.country) {
                        locationName = city ? `${city}, ${addr.country}` : addr.country;
                    } else {
                        locationName = city || "Jerusalém";
                    }
                    
                    if (addr.country_code) {
                        isIsrael = (addr.country_code.toLowerCase() === 'il');
                    }
                }
            } catch (e) { /* Keep fallback */ }
        }

        let sunsetTime = 0;
        try {
            const zmRes = await fetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&date=${dateStr}`);
            const zmanimData = await zmRes.json();
            sunsetTime = zmanimData.times && zmanimData.times.sunset ? new Date(zmanimData.times.sunset).getTime() : 0;
            currentSunsetTime = sunsetTime;
        } catch (e) { console.error('Zmanim failed', e); }
        const isAfterSunset = sunsetTime > 0 && new Date().getTime() > sunsetTime;


        const converterUrl = `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1&strict=1${isAfterSunset ? '&gs=on' : ''}`;
        const hdateData = await hebcalFetch(converterUrl);
        const hebcalUrl = `https://www.hebcal.com/hebcal?v=1&cfg=json&geo=pos&latitude=${lat}&longitude=${lon}&start=${dateStr}&end=${endDateStr}&maj=on&min=on&mod=on&nx=on&mf=on&ss=off&s=on&i=${isIsrael ? 'on' : 'off'}&c=off&o=on`;
        const hebcalData = await hebcalFetch(hebcalUrl);

        if (hebcalData && hebcalData.items) {
            const biblicalMapping = {
                'Parashat': { name: 'Yom Shabbat' },
                'Pesach Sheni': { name: 'Pessach Sheni' },
                'Pesach': { name: 'Yom Pessach' },
                'Matzot': { name: 'Chag Matzot' },
                'Shavuot': { name: 'Yom Shavuot' },
                'Rosh Hashana': { name: 'Yom Teruah' },
                'Yom Kippur': { name: 'Yom Kippur' },
                'Sukkot': { name: 'Chag Sukkot' },
                'Shemini Atzeret': { name: 'Shemini Atzeret' },
                'Rosh Chodesh': { name: 'Rosh Chodesh' },
                'Omer': { name: 'Sefirat Omer' }
            };

            const validCategories = ['holiday', 'parashat', 'fast', 'omer', 'roshchodesh'];
            const filteredItems = hebcalData.items.filter(item => validCategories.includes(item.category));

            // Collect unique dates so we can fetch each date's sunset individually
            const uniqueDates = [...new Set(filteredItems.map(item => item.date.split('T')[0]))];

            // Fetch zmanim for each unique date in parallel
            const sunsetByDate = { [dateStr]: sunsetTime }; // seed with today already fetched
            await Promise.allSettled(
                uniqueDates
                    .filter(d => d !== dateStr)
                    .map(async (d) => {
                        try {
                            const r = await fetch(
                                `https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&date=${d}`,
                                { signal: AbortSignal.timeout(6000) }
                            );
                            if (!r.ok) return;
                            const zm = await r.json();
                            sunsetByDate[d] = zm.times && zm.times.sunset
                                ? new Date(zm.times.sunset).getTime()
                                : 0;
                        } catch (e) { /* fallback to 18:00 below */ }
                    })
            );

            unifiedEvents = filteredItems
                .map(item => {
                    const parts = item.date.split('T')[0].split('-');
                    let dateObj;
                    if (parts.length === 3) {
                        const y = parseInt(parts[0], 10);
                        const m = parseInt(parts[1], 10) - 1;
                        const d = parseInt(parts[2], 10);
                        const eventDateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
                        const eventSunset = sunsetByDate[eventDateStr] || 0;
                        const sH = eventSunset ? new Date(eventSunset).getHours() : 18;
                        const sM = eventSunset ? new Date(eventSunset).getMinutes() : 0;
                        let dayOffset = 0;
                        if (item.category === 'parashat' || item.category === 'omer') {
                            dayOffset = -1;
                        } else if (item.category === 'holiday' || item.category === 'roshchodesh' || item.category === 'fast') {
                            dayOffset = item.title.includes('Erev') ? 0 : -1;
                        }
                        dateObj = new Date(y, m, d + dayOffset, sH, sM, 0);
                    } else {
                        dateObj = new Date();
                    }

                    const cleanTitle = item.title.replace(/[\u2018\u2019]/g, "'");
                    let itemName = item.title;
                    let isBiblical = false;
                    let isTraditional = false;
                    let customCategory = item.category;

                    for (const key in biblicalMapping) {
                        if (cleanTitle.includes(key)) {
                            itemName = biblicalMapping[key].name;
                            isBiblical = true;
                            customCategory = key.toLowerCase().replace(/ /g, '');

                            if (key === 'Parashat') {
                                customCategory = 'parashat';
                            } else if (key === 'Pesach') {
                                if (cleanTitle.includes('Erev')) {
                                    customCategory = 'pesach';
                                    itemName = 'Yom Pessach';
                                } else {
                                    // 'Pesach I/II/VII' etc. from Hebcal = Chag HaMatzot (15-21 Nissan)
                                    customCategory = 'matzot';
                                    itemName = 'Chag Matzot';
                                }
                            } else if (key === 'Omer') {
                                const match = cleanTitle.match(/\d+/);
                                if (match) {
                                    itemName = `${match[0]} laOmer`;
                                }
                            }
                            break;
                        }
                    }

                    if (!isBiblical) {
                        const traditionalMapping = {
                            "Chanukah": "Chag Hanukkah",
                            "Purim": "Yom Purim",
                            "Tzom Tammuz": "Tzom Tammuz",
                            "Tish'a B'Av": "Tisha BAv",
                            "Tzom Gedaliah": "Tzom Gedaliah",
                            "Asara B'Tevet": "Tzom Tevet"
                        };
                        const sortedKeys = Object.keys(traditionalMapping).sort((a, b) => b.length - a.length);
                        for (const key of sortedKeys) {
                            if (cleanTitle.includes(key)) {
                                if (key === 'Chanukah') {
                                    const match = cleanTitle.match(/(\d+)/);
                                    itemName = match ? `Hanukkah ${match[1]}` : traditionalMapping[key];
                                } else {
                                    itemName = traditionalMapping[key];
                                }
                                isTraditional = true;
                                customCategory = 'traditional';
                                break;
                            }
                        }
                    }

                    if (!isBiblical && !isTraditional) {
                        return null; // Descarta feriados tradicionais/menores não mapeados
                    }

                    return {
                        name: itemName,
                        time: dateObj.getTime(),
                        category: customCategory,
                        rawCategory: item.category,
                        isBiblical: isBiblical,
                        isTraditional: isTraditional,
                        raw: item
                    };
                })
                .filter(Boolean);
            updateUIBlocks(unifiedEvents, hdateData, locationName, sunsetTime, isIsrael);
        }

    } catch (err) {
        console.error("Dashboard Sync Failed", err);
    }

    renderEvents();

    if (currentSunsetTime > new Date().getTime()) {
        const msToSunset = currentSunsetTime - new Date().getTime();
        if (window.sunsetTimeout) clearTimeout(window.sunsetTimeout);
        window.sunsetTimeout = setTimeout(() => {
            updateDashboard();
        }, msToSunset + 1000);
    }
}

function updateUIBlocks(events, hdate, locationName, sunsetTime, isIsrael) {
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


    // Helper: check if 'now' falls within the full span of a festival category
    // Also returns which day (0-based) of the festival we are currently on
    function getFestivalSpan(cat) {
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
    function findActiveFestival(cats) {
        for (const cat of cats) {
            const span = getFestivalSpan(cat);
            if (span && now >= span.start && now < span.end)
                return { ...span.evt, dayIndex: span.dayIndex };
        }
        return null;
    }
    // Pick the correct reading for the current day (clamps to last entry if needed)
    function pickReading(arr, dayIndex) {
        if (!arr || !arr.length) return null;
        return arr[Math.min(dayIndex, arr.length - 1)];
    }

    const FESTIVAL_CATS = [
        'pesach', 'matzot', 'shavuot', 'roshhashana', 'yomkippur',
        'sukkot', 'sheminiatzeret'
    ];
    const activeFestival = findActiveFestival(FESTIVAL_CATS);

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

        // Detect Diaspora-only extra days (Yom Tov Sheni) when there is nothing left of the festival in the Torah
        if (!isIsrael) {
            if (activeFestival.category === 'matzot') {
                isExtraDay = (idx === 7); // Day 8 (22 Nissan) - Pesach ended in Israel
            } else if (activeFestival.category === 'shavuot') {
                isExtraDay = (idx === 1); // Day 2 (7 Sivan) - Shavuot ended in Israel
            } else if (activeFestival.category === 'sheminiatzeret') {
                isExtraDay = (idx === 1); // Day 2 / Simchat Torah (23 Tishrei) - Shemini Atzeret ended in Israel
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
            elParasha.textContent = upcomingParasha ? upcomingParasha.raw.title.replace('Parashat ', '').replace(/[\u2018\u2019]/g, '') : '-';
        }
    }
    if (elParashaSubtitle) {
        if (activeFestival) {
            elParashaSubtitle.textContent = 'Leitura Especial';
        } else {
            elParashaSubtitle.textContent = 'Ciclo Anual';
        }
    }


    // Per-day Torah readings for each Biblical festival (Chabad/Diaspora Nusach)
    const FESTIVAL_TORAH_READINGS = {
        'pesach': ['Shemot 12:21-51'],       // 14 Nissan – korban Pessach
        'matzot': [
            'Shemot 12:21-51',        // Dia 1 – 15 Nissan
            'Vayikra 22:26-23:44',    // Dia 2 – 16 Nissan
            'Bamidbar 28:19-25',      // Dia 3 – Chol HaMoed 1
            'Bamidbar 28:19-25',      // Dia 4 – Chol HaMoed 2
            'Bamidbar 28:19-25',      // Dia 5 – Chol HaMoed 3
            'Bamidbar 28:19-25',      // Dia 6 – Chol HaMoed 4
            'Shemot 13:17-15:26',     // Dia 7 – Shvi'i shel Pessach
            'Devarim 15:19 - 16:17'   // Dia 8 – Acharon shel Pessach
        ],
        'shavuot': [
            'Shemot 19:1-20:23',
            'Devarim 15:19 - 16:17'
        ],
        'roshhashana': [
            'Bereshit 21:1-34',
            'Bereshit 22:1-24'
        ],
        'yomkippur': ['Vayikra 16:1-34'],
        'sukkot': [
            'Vayikra 22:26-23:44',    // Dia 1
            'Vayikra 22:26-23:44',    // Dia 2
            'Bamidbar 29:17-22',      // Dia 3 – Chol HaMoed 1
            'Bamidbar 29:20-25',      // Dia 4 – Chol HaMoed 2
            'Bamidbar 29:23-28',      // Dia 5 – Chol HaMoed 3
            'Bamidbar 29:26-31',      // Dia 6 – Chol HaMoed 4
            'Bamidbar 29:26-34',      // Dia 7 – Hoshana Raba
        ],
        'sheminiatzeret': [
            'Devarim 14:22 - 16:17',
            'Devarim 33:1 - 34:12'
        ],
    };

    // Per-day Haftara readings for each Biblical festival (Chabad/Diaspora Nusach)
    const FESTIVAL_HAFTARA_READINGS = {
        'pesach': ['Yehoshua 5:2 - 6:1'],    // 14 Nissan
        'matzot': [
            'Yehoshua 5:2 - 6:1',          // Dia 1 – 15 Nissan
            'II Melachim 23:1-9,21-25',    // Dia 2 – 16 Nissan
            'Yechezkel 37:1-14',            // Dia 3 – Chol HaMoed 1
            'Yechezkel 37:1-14',            // Dia 4 – Chol HaMoed 2
            'Yechezkel 37:1-14',            // Dia 5 – Chol HaMoed 3
            'Yechezkel 37:1-14',            // Dia 6 – Chol HaMoed 4
            'II Shmuel 22:1-51',            // Dia 7 – Shvi'i shel Pessach
            'Yeshayahu 10:32 - 12:6',       // Dia 8 – Acharon shel Pessach
        ],
        'shavuot': [
            'Yechezkel 1:1-28, 3:12',
            'Chavakuk 2:20 - 3:19'
        ],
        'roshhashana': [
            'I Shmuel 1:1-2:10',
            'Yirmiyahu 31:1-19'
        ],
        'yomkippur': ['Yeshayahu 57:14-58:14'],
        'sukkot': [
            'Zecharia 14:1-21',             // Dia 1
            'I Melachim 8:2-21',            // Dia 2
            'Yechezkel 38:18-39:7',       // Dia 3 – Chol HaMoed 1
            'Yechezkel 38:18-39:7',       // Dia 4 – Chol HaMoed 2
            'Yechezkel 38:18-39:7',       // Dia 5 – Chol HaMoed 3
            'Yechezkel 38:18-39:7',       // Dia 6 – Chol HaMoed 4
            'Yechezkel 38:18-39:7',       // Dia 7 – Hoshana Raba
        ],
        'sheminiatzeret': [
            'I Melachim 8:54-66',
            'Yehoshua 1:1-18'
        ],
    };

    // nearFestival uses the same span logic
    const nearFestival = findActiveFestival(Object.keys(FESTIVAL_TORAH_READINGS));

    if (elTorah) {
        let torahText = '';
        if (nearFestival) {
            torahText = transliterateTorah(
                pickReading(FESTIVAL_TORAH_READINGS[nearFestival.category], nearFestival.dayIndex) || ''
            );
        } else if (upcomingParasha && upcomingParasha.raw && upcomingParasha.raw.leyning && upcomingParasha.raw.leyning.torah) {
            torahText = transliterateTorah(upcomingParasha.raw.leyning.torah);
        }
        elTorah.textContent = torahText;
    }

    if (elHaftara) {
        let haftaraText = '';
        if (nearFestival) {
            haftaraText = transliterateTorah(
                pickReading(FESTIVAL_HAFTARA_READINGS[nearFestival.category], nearFestival.dayIndex) || ''
            );
        } else if (upcomingParasha && upcomingParasha.raw && upcomingParasha.raw.leyning) {
            const ley = upcomingParasha.raw.leyning;
            const hOptions = [ley.haftarah, ley.haftarah_sephardic, ley.haftarah_chabad, ley.haftarah_teiman, ley.haftarah_itali].filter(Boolean);
            haftaraText = transliterateTorah((hOptions[0] || '').split(' | ')[0].trim());
        }
        elHaftara.textContent = haftaraText;
    }



    if (elKetuvim) {
        const isAfterSunset = currentSunsetTime > 0 && now > currentSunsetTime;
        const d = new Date(now + (isAfterSunset ? 86400000 : 0));
        const stableDaySeed = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

        const shabbatTehilim = [
            'Tehilim 23', 'Tehilim 92', 'Mishlei 31', 'Tehilim 104', 'Mishlei 3',
            'Tehilim 121', 'Mishlei 4', 'Tehilim 93', 'Mishlei 8', 'Daniel 2'
        ];
        const pesachTehilim = [
            'Tehilim 78', 'Tehilim 105', 'Tehilim 107', 'Tehilim 113', 'Tehilim 114',
            'Tehilim 115', 'Tehilim 116', 'Tehilim 117', 'Tehilim 118', 'Tehilim 136'
        ];
        const matzotTehilim = [
            'Tehilim 66', 'Tehilim 77', 'Tehilim 105', 'Tehilim 106', 'Tehilim 114',
            'Tehilim 115', 'Tehilim 116', 'Tehilim 117', 'Tehilim 118', 'Tehilim 136'
        ];
        const shavuotTehilim = [
            'Ruth 1', 'Ruth 2', 'Ruth 3', 'Ruth 4', 'Tehilim 19',
            'Tehilim 68', 'Tehilim 119', 'Mishlei 8', 'Nechemia 8', 'Mishlei 1'
        ];
        const roshhashanaTehilim = [
            'Tehilim 24', 'Tehilim 27', 'Tehilim 47', 'Tehilim 81', 'Tehilim 150',
            'Nechemia 9', 'Daniel 7', 'Tehilim 33', 'Tehilim 93', 'Tehilim 96'
        ];
        const yomkippurTehilim = [
            'Tehilim 25', 'Tehilim 32', 'Tehilim 51', 'Tehilim 86', 'Tehilim 103',
            'Tehilim 130', 'Tehilim 143', 'Daniel 9', 'Ezra 9', 'Tehilim 90'
        ];
        const sukkotTehilim = [
            'Kohelet 1', 'Kohelet 2', 'Kohelet 3', 'Kohelet 12', 'Tehilim 42',
            'Tehilim 67', 'Tehilim 121', 'Tehilim 122', 'Tehilim 126', 'Nechemia 8'
        ];
        const sheminiatzeretTehilim = [
            'Tehilim 1', 'Tehilim 19', 'Tehilim 119', 'Mishlei 3', 'Kohelet 12',
            'Tehilim 147', 'Tehilim 148', 'Tehilim 85', 'Tehilim 12', 'Tehilim 111'
        ];

        const FESTIVAL_READING = {
            'parashat': shabbatTehilim[stableDaySeed % shabbatTehilim.length],
            'pesach': pesachTehilim[stableDaySeed % pesachTehilim.length],
            'matzot': matzotTehilim[stableDaySeed % matzotTehilim.length],
            'shavuot': shavuotTehilim[stableDaySeed % shavuotTehilim.length],
            'roshhashana': roshhashanaTehilim[stableDaySeed % roshhashanaTehilim.length],
            'yomkippur': yomkippurTehilim[stableDaySeed % yomkippurTehilim.length],
            'sukkot': sukkotTehilim[stableDaySeed % sukkotTehilim.length],
            'sheminiatzeret': sheminiatzeretTehilim[stableDaySeed % sheminiatzeretTehilim.length]
        };

        let ketuvimText = null;
        if (nearFestival) {
            ketuvimText = FESTIVAL_READING[nearFestival.category] || null;
        } else if (d.getDay() === 6) {
            // Se hoje for Shabbat (lembrando que a data d já vira para o dia seguinte no pôr do sol)
            ketuvimText = FESTIVAL_READING['parashat'] || null;
        }

        if (!ketuvimText) {
            // Sorteia um livro do Ketuvim de forma estável para o dia
            // Usamos uma semente determinística com LCG para selecionar o livro e o capítulo
            const LCG = (seed) => (seed * 9301 + 49297) % 233280;
            const seed1 = LCG(stableDaySeed);
            const seed2 = LCG(seed1);

            const books = [
                { name: 'Tehilim', chapters: 150, weight: 67 },
                { name: 'Mishlei', chapters: 31, weight: 15 },
                { name: 'Iyov', chapters: 42, weight: 5 },
                { name: 'Kohelet', chapters: 12, weight: 4 },
                { name: 'Ruth', chapters: 4, weight: 2 },
                { name: 'Esther', chapters: 10, weight: 2 },
                { name: 'Daniel', chapters: 12, weight: 3 },
                { name: 'Ezra', chapters: 10, weight: 1 },
                { name: 'Nechemia', chapters: 13, weight: 1 }
            ];

            const totalWeight = books.reduce((sum, b) => sum + b.weight, 0);
            let selector = seed1 % totalWeight;
            let selectedBook = books[0];
            for (const b of books) {
                if (selector < b.weight) {
                    selectedBook = b;
                    break;
                }
                selector -= b.weight;
            }

            const chapter = (seed2 % selectedBook.chapters) + 1;
            ketuvimText = `${selectedBook.name} ${chapter}`;
        }

        elKetuvim.textContent = transliterateTorah(ketuvimText);
    }

    if (elDate) {
        let hm = hdate.hm || '';
        const hbMonths = {
            "Nisan": "Nissan", "Iyyar": "Iyar", "Sh'vat": "Shvat"
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
}

function getEventIcon(category, name) {
    if (name) {
        const cleanName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        if (cleanName.includes('hanukkah')) return '<i class="fa-solid fa-menorah"></i>';
        if (cleanName.includes('purim')) return '<i class="fa-solid fa-mask"></i>';
        if (cleanName.includes('tammuz')) return '<i class="fa-solid fa-burst"></i>';
        if (cleanName.includes('tisha')) return '<i class="fa-solid fa-fire"></i>';
        if (cleanName.includes('gedaliah')) return '<i class="fa-solid fa-user-slash"></i>';
        if (cleanName.includes('tevet')) return '<i class="fa-solid fa-shield-halved"></i>';
    }
    switch (category) {
        case 'parashat': return '<i class="fa-solid fa-leaf"></i>';
        case 'pesach': return '<i class="fa-solid fa-person-walking-luggage"></i>';
        case 'matzot': return '<i class="fa-solid fa-bread-slice"></i>';
        case 'shavuot': return '<i class="fa-solid fa-seedling"></i>';
        case 'roshhashana': return '<i class="fa-solid fa-bell"></i>';
        case 'yomkippur': return '<i class="fa-solid fa-hourglass-half"></i>';
        case 'sukkot': return '<i class="fa-solid fa-house-chimney"></i>';
        case 'sheminiatzeret': return '<i class="fa-solid fa-circle-notch"></i>';
        case 'simchattorah': return '<i class="fa-solid fa-book-open"></i>';
        case 'roshchodesh': return '<i class="fa-solid fa-moon"></i>';
        case 'omer': return '<i class="fa-solid fa-wheat-awn"></i>';
        default: return '<i class="fa-solid fa-star-of-david"></i>';
    }
}

function getStringSimilarity(s1, s2) {
    const clean = s => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const a = clean(s1);
    const b = clean(s2);
    if (a === b) return 1.0;
    if (a.length === 0 || b.length === 0) return 0.0;
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            );
        }
    }
    return 1.0 - (dp[a.length][b.length] / Math.max(a.length, b.length));
}

function renderEvents() {
    const grid = document.getElementById('upcoming-events-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const now = new Date().getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    const sorted = unifiedEvents
        .filter(evt => (evt.time + twentyFourHoursMs) > now)
        .sort((a, b) => a.time - b.time);
    const omerEvents = sorted.filter(e => e.category === 'omer');
    const firstOmer = omerEvents[0];
    const nonOmer = sorted.filter(e => e.category !== 'omer');

    let filtered = firstOmer ? [...nonOmer, firstOmer] : nonOmer;

    const biblical = filtered.filter(e => e.isBiblical);
    const traditional = filtered.filter(e => e.isTraditional);
    const others = filtered.filter(e => !e.isBiblical && !e.isTraditional);

    // Prioridade secundária: se ocorrerem ao mesmo tempo, bíblicas aparecem primeiro, depois tradicionais
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
            if (majorCount < 5) {
                unique.push(item);
                majorCount++;
                seenNames.add(normalized);
            }
        }
        if (shabbatCount >= 1 && majorCount >= 5) break;
    }

    const upcoming = unique.sort((a, b) => a.time - b.time);

    if (upcoming.length === 0) {
        grid.innerHTML = '<div class="events-list-container glass-panel" style="grid-column:1/-1;text-align:center;padding:28px;">Sem Festividade</div>';
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

    startTimers();
}

function startTimers() {
    if (timerInterval) clearInterval(timerInterval);

    function update() {
        const timers = document.querySelectorAll('.timer-countdown');
        const now = new Date().getTime();
        let anyExpired = false;

        timers.forEach(timer => {
            if (timer.getAttribute('data-copied') === 'true') return;
            const startTimestamp = parseInt(timer.getAttribute('data-time'));
            if (isNaN(startTimestamp)) {
                if (timer.textContent !== 'Em Breve') {
                    timer.textContent = 'Em Breve';
                }
                return;
            }
            const startTime = startTimestamp - (2 * 60 * 1000);
            const endTimestamp = startTimestamp + (24 * 60 * 60 * 1000) + (2 * 60 * 1000);

            const diffToStart = startTimestamp - now;

            if (now >= startTime && now <= endTimestamp) {
                timer.textContent = 'Em Curso';
                timer.classList.add('ongoing');
            } else if (now > endTimestamp) {
                const card = timer.closest('.event-card');
                const wrapper = card ? card.parentElement : null;
                if (wrapper) wrapper.remove(); else if (card) card.remove();
                anyExpired = true;
            } else {
                const threshold = (99 * 24 * 60 * 60 * 1000) + (22 * 60 * 60 * 1000) + (59 * 60 * 1000);
                if (diffToStart > threshold) {
                    timer.textContent = 'Em Breve';
                } else {
                    const d = String(Math.floor(diffToStart / (1000 * 60 * 60 * 24))).padStart(2, '0');
                    const h = String(Math.floor((diffToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
                    const m = String(Math.floor((diffToStart % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
                    timer.textContent = `${d}d ${h}h ${m}m`;
                }
                timer.style.color = '';
                timer.classList.remove('ongoing');
            }
        });

        const grid = document.getElementById('upcoming-events-grid');
        if (anyExpired && grid && grid.children.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:28px;">Sem Festividade</div>';
        }
    }

    update();
    timerInterval = setInterval(update, 10);
}


updateDashboard();

document.addEventListener('click', (event) => {
    const card = event.target.closest('.event-card');
    if (!card) return;

    // Check if it's the "Local Vigente" card to open the accuracy modal instead of copying
    if (card.id === 'card-local-vigente') {
        const modal = document.getElementById('location-modal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Auto-trigger a search guess based on current location string
        const searchInput = document.getElementById('location-search-input');
        if (searchInput) {
            const currentLocName = document.getElementById('card-local').textContent;
            if (currentLocName && !['-', 'Calculando...', 'Restaurando...', 'Aguardando GPS...', 'Erro GPS'].includes(currentLocName)) {
                // Use just the city part to get broader autocomplete guesses
                searchInput.value = currentLocName.split(',')[0].trim();
                searchInput.dispatchEvent(new Event('input'));
            } else {
                searchInput.value = '';
                document.getElementById('location-suggestions').innerHTML = '<li style="opacity: 0.2; pointer-events: none;">-</li><li style="opacity: 0.2; pointer-events: none;">-</li><li style="opacity: 0.2; pointer-events: none;">-</li>';
            }
            setTimeout(() => searchInput.focus(), 100);
        }
        
        return;
    }

    const titleEl = card.querySelector('.card-title');
    const subtitleEl = card.querySelector('.card-subtitle') || card.querySelector('.timer-countdown');

    if (titleEl) {
        const textToCopy = titleEl.textContent.trim();
        if (!textToCopy || textToCopy === '-') return;

        navigator.clipboard.writeText(textToCopy).then(() => {
            if (subtitleEl) {
                const originalText = subtitleEl.textContent;

                subtitleEl.setAttribute('data-copied', 'true');
                subtitleEl.textContent = 'Item Copiado';

                setTimeout(() => {
                    subtitleEl.removeAttribute('data-copied');
                    subtitleEl.textContent = originalText;
                }, 1200);
            }
        }).catch(err => {
            console.error('Falha ao copiar texto: ', err);
        });
    }
});

document.getElementById('location-modal')?.addEventListener('click', (e) => {
    // Fechar se clicar no fundo desfocado
    if (e.target.id === 'location-modal') {
        e.target.style.display = 'none';
        document.body.style.overflow = '';
    }
});

// Autocomplete Logic
const searchInput = document.getElementById('location-search-input');
const suggestionsList = document.getElementById('location-suggestions');
let searchTimeout;

searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);
    
    if (query.length < 3) {
        suggestionsList.innerHTML = '<li style="opacity: 0.2; pointer-events: none;">-</li><li style="opacity: 0.2; pointer-events: none;">-</li><li style="opacity: 0.2; pointer-events: none;">-</li>';
        return;
    }
    
    searchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&accept-language=pt`);
            if (!res.ok) return;
            const data = await res.json();
            
            suggestionsList.innerHTML = '';
            
            if (data.length === 0) {
                suggestionsList.innerHTML = '<li style="opacity: 0.2; pointer-events: none;">-</li><li style="opacity: 0.2; pointer-events: none;">-</li><li style="opacity: 0.2; pointer-events: none;">-</li>';
                return;
            }
            
            // Force exactly 3 results (pad with inactive elements if less)
            for (let i = 0; i < 3; i++) {
                const item = data[i];
                const li = document.createElement('li');
                
                if (item) {
                    const parts = item.display_name.split(',').map(s => s.trim());
                    li.textContent = parts.slice(0, 3).join(', ');
                    
                    li.addEventListener('click', () => {
                        const lat = parseFloat(item.lat);
                        const lon = parseFloat(item.lon);
                        
                        localStorage.setItem('exactLocation', JSON.stringify({ lat, lon }));
                        
                        document.getElementById('location-modal').style.display = 'none';
                        document.body.style.overflow = '';
                        searchInput.value = '';
                        suggestionsList.innerHTML = '<li style="opacity: 0.2; pointer-events: none;">-</li><li style="opacity: 0.2; pointer-events: none;">-</li><li style="opacity: 0.2; pointer-events: none;">-</li>';
                        
                        const localTitle = document.getElementById('card-local');
                        if (localTitle) localTitle.textContent = 'Calculando...';
                        
                        updateDashboard();
                    });
                } else {
                    li.textContent = '-';
                    li.style.opacity = '0.2';
                    li.style.pointerEvents = 'none';
                }
                suggestionsList.appendChild(li);
            }
            
            suggestionsList.style.display = 'block';
        } catch (err) {
            console.error('Search API error:', err);
        }
    }, 400); // 400ms debounce
});



// Removed dynamic watermark generator per user request, using static bg.png instead
