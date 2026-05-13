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

    const matchingTz = results.filter(r => r.tz === sysTimezone);
    if (matchingTz.length > 0) {
        const avgLat = matchingTz.reduce((sum, r) => sum + r.lat, 0) / matchingTz.length;
        const avgLon = matchingTz.reduce((sum, r) => sum + r.lon, 0) / matchingTz.length;
        finalLoc = { lat: avgLat, lon: avgLon };
    }
    else if (results.length > 0) {
        const avgLat = results.reduce((sum, r) => sum + r.lat, 0) / results.length;
        const avgLon = results.reduce((sum, r) => sum + r.lon, 0) / results.length;
        finalLoc = { lat: avgLat, lon: avgLon };
    }
    else if (TZ_FALLBACKS[sysTimezone]) {
        finalLoc = { ...TZ_FALLBACKS[sysTimezone] };
    }

    if (finalLoc) {
        return finalLoc;
    }

    return null;
}

async function updateDashboard() {
    const grid = document.getElementById('upcoming-events-grid');
    if (grid) {
        grid.innerHTML = '<div class="events-list-container glass-panel" style="color:#94a3b8;grid-column:1/-1;text-align:center;padding:28px;">Ligando Sistema</div>';
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

        const lat = userLocation ? userLocation.lat : 31.7683;
        const lon = userLocation ? userLocation.lon : 35.2137;
        const geoWasDetected = !!userLocation;

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
        const hebcalUrl = `https://www.hebcal.com/hebcal?v=1&cfg=json&geo=pos&latitude=${lat}&longitude=${lon}&start=${dateStr}&end=${endDateStr}&maj=on&min=off&mod=off&nx=on&mf=off&ss=off&s=on&i=on&c=off&o=on`;
        const hebcalData = await hebcalFetch(hebcalUrl);

        if (hebcalData && hebcalData.items) {
            const biblicalMapping = {
                'Parashat': { name: 'Yom Shabbat', easterEggClass: 'egg-shabbat' },
                'Pesach Sheni': { name: 'Pessach Sheni', easterEggClass: 'egg-pesach' },
                'Pesach': { name: 'Chag Pessach', easterEggClass: 'egg-pesach' },
                'Matzot': { name: 'Chag Matzot', easterEggClass: 'egg-pesach' },
                'Shavuot': { name: 'Yom Shavuot', easterEggClass: 'egg-shavuot' },
                'Rosh Hashana': { name: 'Yom Teruah', easterEggClass: 'egg-teruah' },
                'Yom Kippur': { name: 'Yom Kippur', easterEggClass: 'egg-kippur' },
                'Sukkot': { name: 'Chag Sukkot', easterEggClass: 'egg-sukkot' },
                'Shemini Atzeret': { name: 'Shemini Atzeret', easterEggClass: 'egg-simchat' },
                'Rosh Chodesh': { name: 'Rosh Chodesh', easterEggClass: 'egg-roshchodesh' },
                'Omer': { name: 'Sefirat Omer', easterEggClass: 'egg-omer' }
            };

            const validCategories = ['holiday', 'parashat', 'fast', 'omer', 'roshchodesh'];
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
                    let isBiblical = false;
                    let isTraditional = false;
                    let customCategory = item.category;
                    let easterEggClass = '';

                    for (const key in biblicalMapping) {
                        if (item.title.includes(key)) {
                            itemName = biblicalMapping[key].name;
                            easterEggClass = biblicalMapping[key].easterEggClass || '';
                            isBiblical = true;
                            customCategory = key.toLowerCase().replace(/ /g, '');

                            if (key === 'Parashat') {
                                customCategory = 'parashat';
                            } else if (key === 'Omer') {
                                const match = item.title.match(/\d+/);
                                if (match) {
                                    itemName = `${match[0]} laOmer`;
                                }
                            }
                            break;
                        }
                    }

                    if (!isBiblical) {
                        // As 20 Maiores Festas Tradicionais, Jejuns e Históricas (Pós-Torah)
                        const traditionalMapping = {
                            'Chanukah': 'Chag Chanukkah',
                            'Purim': 'Yom Purim',
                            'Tu BiShvat': 'Tu BiShvat',
                            'Lag BaOmer': 'Lag BaOmer',
                            'Tish\'a B\'Av': 'Tisha BeAv',
                            'Tu B\'Av': 'Tu BeAv',
                            'Asara B\'Tevet': 'Asara BeTevet',
                            'Tzom Tammuz': 'Tzom Tamuz',
                            'Ta\'anit Esther': 'Taanit Ester',
                            'Tzom Gedaliah': 'Tzom Gedalyah',
                            'Shushan Purim': 'Shushan Purim',
                            'Purim Katan': 'Purim Katan',
                            'Leil Selichot': 'Leil Selichot',
                            'Sigd': 'Yom Sigd',
                            'Yom HaShoah': 'Yom HaShoah',
                            'Yom HaZikaron': 'Yom HaZikaron',
                            'Yom HaAtzmaut': 'Yom HaAtzmaut',
                            'Yom Yerushalayim': 'Yom Yerushalayim',
                            'Yom HaAliyah': 'Yom HaAliyah',
                        };
                        for (const key in traditionalMapping) {
                            if (item.title.includes(key)) {
                                itemName = traditionalMapping[key];
                                isTraditional = true;
                                customCategory = 'traditional';
                                break;
                            }
                        }
                    }

                    if (!isBiblical && !isTraditional) {
                        itemName = itemName.split(' ').slice(0, 2).join(' ');
                    }

                    return {
                        name: itemName,
                        time: dateObj.getTime(),
                        category: customCategory,
                        rawCategory: item.category,
                        isBiblical: isBiblical,
                        isTraditional: isTraditional,
                        easterEggClass: easterEggClass,
                        raw: item
                    };
                });
            updateUIBlocks(unifiedEvents, hdateData, locationName, sunsetTime);
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

function updateUIBlocks(events, hdate, locationName) {
    const now = new Date().getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    const upcomingParasha = events.find(e =>
        e.raw.category === 'parashat' && (e.time + twentyFourHoursMs) > now
    );
    const elParasha = document.getElementById('card-parasha');
    const elTorah = document.getElementById('card-torah');
    const elHaftara = document.getElementById('card-haftara');
    const elKetuvim = document.getElementById('card-ketuvim');
    const elDate = document.getElementById('card-hdate');
    const elLoc = document.getElementById('card-local');

    if (elParasha) {
        let pName = upcomingParasha.raw.title.replace('Parashat ', '');
        elParasha.textContent = pName;
    }

    if (elTorah) {
        let torahText = '';
        if (upcomingParasha && upcomingParasha.raw && upcomingParasha.raw.leyning && upcomingParasha.raw.leyning.torah) {
            torahText = transliterateTorah(upcomingParasha.raw.leyning.torah);
        }
        elTorah.textContent = torahText;
    }

    if (elHaftara) {
        let haftaraText = '';
        if (upcomingParasha && upcomingParasha.raw && upcomingParasha.raw.leyning) {
            const ley = upcomingParasha.raw.leyning;
            const hOptions = [ley.haftarah, ley.haftarah_sephardic, ley.haftarah_chabad, ley.haftarah_teiman, ley.haftarah_itali].filter(Boolean);
            haftaraText = hOptions[0] || '';
        }
        elHaftara.textContent = transliterateTorah(haftaraText.split(' | ')[0].trim());
    }


    if (elKetuvim) {
        const shabbatTehilim = ['Tehilim 23-24', 'Tehilim 27-29', 'Tehilim 46-48', 'Tehilim 84-85', 'Tehilim 90-92', 'Tehilim 93-96', 'Tehilim 97-100', 'Tehilim 145-147'];
        const omerTehilim = ['Tehilim 1-2', 'Tehilim 3-4', 'Tehilim 5-6', 'Tehilim 7-8', 'Tehilim 9-10', 'Tehilim 11-12', 'Tehilim 13-14', 'Tehilim 15-16', 'Tehilim 17-18', 'Tehilim 19-20', 'Tehilim 21-22', 'Tehilim 23-24', 'Tehilim 25-26', 'Tehilim 27-28', 'Tehilim 29-30', 'Tehilim 31-32', 'Tehilim 33-34', 'Tehilim 35-36', 'Tehilim 37-38', 'Tehilim 39-40', 'Tehilim 41-42', 'Tehilim 43-44', 'Tehilim 45-46', 'Tehilim 47-48', 'Tehilim 49-50', 'Tehilim 51-52', 'Tehilim 53-54', 'Tehilim 55-56', 'Tehilim 57-58', 'Tehilim 59-60', 'Tehilim 61-62', 'Tehilim 63-64', 'Tehilim 65-66', 'Tehilim 67-68', 'Tehilim 69-70', 'Tehilim 71-72', 'Tehilim 73-74', 'Tehilim 75-76', 'Tehilim 77-78', 'Tehilim 79-80', 'Tehilim 81-82', 'Tehilim 83-84', 'Tehilim 85-86', 'Tehilim 87-88', 'Tehilim 89-90', 'Tehilim 91-92', 'Tehilim 93-94', 'Tehilim 95-96', 'Tehilim 97-98', 'Tehilim 99-100'];

        const FESTIVAL_READING = {
            'parashat': shabbatTehilim[Math.floor(Math.random() * shabbatTehilim.length)],
            'pesachsheni': 'Tehilim 25-26',
            'pesach': 'Tehilim 114-115',
            'matzot': 'Tehilim 118-119',
            'shavuot': 'Tehilim 19-20',
            'roshhashana': 'Tehilim 81-82',
            'yomkippur': 'Tehilim 51-52',
            'sukkot': 'Tehilim 65-67',
            'sheminiatzeret': 'Tehilim 47-48',
            'roshchodesh': 'Tehilim 104-105'
        };

        const CATEGORY_PRIORITY = {
            'pesach': 10,
            'matzot': 10,
            'shavuot': 10,
            'parashat': 10,
            'omer': 10,
            'yomkippur': 10,
            'sheminiatzeret': 10,
            'pesachsheni': 8,
            'sukkot': 8,
            'roshchodesh': 7
        };

        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const nearEvents = events.filter(e =>
            (e.time + twentyFourHoursMs) > now && (e.time - now) < sevenDaysMs
        );

        const nearEvent = nearEvents.sort((a, b) => {
            const pa = CATEGORY_PRIORITY[a.category] ?? 1;
            const pb = CATEGORY_PRIORITY[b.category] ?? 1;
            return pb - pa;
        })[0] || null;

        let ketuvimText = null;
        if (nearEvent) {
            if (nearEvent.category === 'omer') {
                const match = nearEvent.name.match(/\d+/);
                if (match) {
                    const day = parseInt(match[0], 10);
                    ketuvimText = omerTehilim[day - 1] || 'Tehilim 67';
                }
            } else {
                ketuvimText = FESTIVAL_READING[nearEvent.category] || null;
            }
        }

        if (!ketuvimText) {
            const KETUVIM_BOOKS = [
                { name: 'Tehilim', chapters: 149 },
                { name: 'Mishlei', chapters: 30 },
                { name: 'Iyov', chapters: 41 },
                { name: 'Rut', chapters: 3 },
                { name: 'Eicha', chapters: 4 },
                { name: 'Kohelet', chapters: 11 },
                { name: 'Ester', chapters: 9 }
            ];

            const chunks = [];
            for (const b of KETUVIM_BOOKS) {
                let start = 1;
                while (start <= b.chapters) {
                    let size = 3;
                    let remaining = b.chapters - start + 1;

                    if (remaining === 4) size = 4;
                    else if (remaining === 5) size = 3;
                    else if (remaining === 2) size = 2;
                    else if (remaining === 1) size = 1;

                    let end = start + size - 1;
                    chunks.push(`${b.name} ${start === end ? start : start + '-' + end}`);
                    start = end + 1;
                }
            }

            const isAfterSunset = currentSunsetTime > 0 && now > currentSunsetTime;
            const d = new Date(now + (isAfterSunset ? 86400000 : 0));
            const continuousDay = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

            ketuvimText = chunks[continuousDay % chunks.length];
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
    if (elLoc) elLoc.textContent = locationName || 'Jerusalém';
}

function getEventIcon(category) {
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
        case 'traditional': return '<i class="fa-solid fa-star-of-david"></i>';
        default: return '<i class="fa-solid fa-bookmark"></i>';
    }
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
        if (seenNames.has(item.name)) continue;

        if (item.name === 'Yom Shabbat') {
            if (shabbatCount < 1) {
                unique.push(item);
                shabbatCount++;
                seenNames.add(item.name);
            }
        } else {
            if (majorCount < 3) {
                unique.push(item);
                majorCount++;
                seenNames.add(item.name);
            }
        }
        if (shabbatCount >= 1 && majorCount >= 3) break;
    }

    const upcoming = unique.sort((a, b) => a.time - b.time);

    if (upcoming.length === 0) {
        grid.innerHTML = '<div class="events-list-container glass-panel" style="grid-column:1/-1;text-align:center;padding:28px;">Sem Festividade</div>';
        return;
    }

    upcoming.forEach(evt => {
        const icon = getEventIcon(evt.category);
        const eggClass = evt.easterEggClass ? evt.easterEggClass : '';

        const card = document.createElement('div');
        card.innerHTML = `
            <div class="event-card event-item glass-panel ${eggClass}">
                <div class="icon-circle ${evt.category}">
                    ${icon}
                </div>
                <div class="card-content">
                    <h2 class="card-title">${evt.name}</h2>
                    ${evt.easterEgg ? `<div style="font-size: 0.7rem; color: rgba(148, 163, 184, 0.7); margin-top: -6px; margin-bottom: 8px; font-style: italic; letter-spacing: 0.3px;">${evt.easterEgg}</div>` : ''}
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
            const startTimePlus1m = startTimestamp + (1 * 60 * 1000);
            const endTimestamp = startTimestamp + (24 * 60 * 60 * 1000);
            const endTimeMinus5m = endTimestamp - (5 * 60 * 1000);

            const diffToStart = startTimestamp - now;
            const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

            if (now >= startTimePlus1m && now < endTimeMinus5m) {
                timer.textContent = 'Neste Momento';
            } else if (now >= endTimeMinus5m && now <= endTimestamp) {
                timer.textContent = 'Fim Iminente';
            } else if (now > endTimestamp) {
                const card = timer.closest('.events-list-container');
                if (card) card.remove();
                anyExpired = true;
            } else if (diffToStart <= 5 * 60 * 1000) {
                timer.textContent = 'Ultimo Preparo';
            } else if (diffToStart > ninetyDaysMs) {
                timer.textContent = 'Em Breve';
            } else {
                const d = String(Math.floor(diffToStart / (1000 * 60 * 60 * 24))).padStart(2, '0');
                const h = String(Math.floor((diffToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
                const m = String(Math.floor((diffToStart % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
                timer.textContent = `${d}d ${h}h ${m}m`;
                timer.style.color = '';
            }
        });

        const grid = document.getElementById('upcoming-events-grid');
        if (anyExpired && grid && grid.children.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:28px;">Sem Festividade</div>';
        }
    }

    update();
    timerInterval = setInterval(update, 100);
}


updateDashboard();
setInterval(updateDashboard, 160000);
