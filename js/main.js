import { state } from './state.js';
import { getGeolocation } from './api/geolocation.js';
import { hebcalFetch, fetchNominatimReverse } from './api/hebcal.js';
import { updateUIBlocks, renderEvents, showDashboardSkeletons } from './ui/dashboard.js';
import { initModals } from './ui/modals.js';
import { applyEstimatedTheme } from './ui/theme.js';
import { getFestivalDateRangeText } from './domain/constants.js';

// Registro do Service Worker para PWA e Offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

async function updateDashboard() {
    // Apply estimated theme instantly on start based on saved location to prevent theme flashes
    const exactLocRaw = localStorage.getItem('exactLocation');
    if (exactLocRaw) {
        try {
            const exactLoc = JSON.parse(exactLocRaw);
            const parsedLat = parseFloat(exactLoc.lat);
            const parsedLon = parseFloat(exactLoc.lon);
            if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
                applyEstimatedTheme(parsedLat, parsedLon);
            } else {
                applyEstimatedTheme();
            }
        } catch (e) {
            applyEstimatedTheme();
        }
    } else {
        applyEstimatedTheme();
    }

    // Instant Cache Hydration: Render cached state immediately if available for 0ms startup
    const offlineDataRaw = localStorage.getItem('hebcal_offline_cache');
    let hasHydratedFromCache = false;
    if (offlineDataRaw) {
        try {
            const cached = JSON.parse(offlineDataRaw);
            if (cached.events && cached.events.length) {
                state.unifiedEvents = cached.events;
                state.currentZmanim = cached.zmanim || null;
                state.currentSunsetTime = cached.sunset || 0;
                updateUIBlocks(cached.events, cached.hdate || { hd: 15, hm: 'Av', hy: 5786 }, cached.locName || "Jerusalém, Israel", cached.sunset || 0, cached.isIsrael !== undefined ? cached.isIsrael : true);
                renderEvents();
                document.body.classList.add('loaded');
                hasHydratedFromCache = true;
            }
        } catch (e) { }
    }

    if (!hasHydratedFromCache) {
        document.body.classList.remove('loaded');
        showDashboardSkeletons();
    }

    const minDelayPromise = hasHydratedFromCache ? Promise.resolve() : new Promise(resolve => setTimeout(resolve, 200));

    try {
        if (!state.userLocation) {
            state.userLocation = await getGeolocation();
        }

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        let lat = state.userLocation ? state.userLocation.lat : 31.7683;
        let lon = state.userLocation ? state.userLocation.lon : 35.2137;
        let tzid = state.userLocation && state.userLocation.tz ? state.userLocation.tz : Intl.DateTimeFormat().resolvedOptions().timeZone;

        let overrideName = null;
        let overrideIsIsrael = null;

        if (exactLocRaw) {
            try {
                const exactLoc = JSON.parse(exactLocRaw);
                const parsedLat = parseFloat(exactLoc.lat);
                const parsedLon = parseFloat(exactLoc.lon);
                if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
                    lat = parsedLat;
                    lon = parsedLon;
                    if (exactLoc.name) overrideName = String(exactLoc.name);
                    if (exactLoc.isIsrael !== undefined) overrideIsIsrael = !!exactLoc.isIsrael;
                    if (exactLoc.tz) tzid = String(exactLoc.tz);
                }
            } catch (e) { }
        }

        const geoWasDetected = !!state.userLocation || !!exactLocRaw;
        let locationName = "Jerusalém, Israel";
        let isIsrael = true;

        const sysTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (overrideIsIsrael !== null) {
            isIsrael = overrideIsIsrael;
        } else if (geoWasDetected) {
            isIsrael = (sysTimezone === 'Asia/Jerusalem');
        }

        const hebcalStartStr = `${year}-01-01`;
        const endDateStr = `${year + 1}-12-31`;

        // Fire all API requests in parallel
        const nomPromise = (geoWasDetected && !overrideName) ? fetchNominatimReverse(lat, lon) : Promise.resolve(null);
        const zmanimPromise = hebcalFetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&date=${dateStr}&tzid=${tzid}`).catch(() => null);
        const hebcalUrl = `https://www.hebcal.com/hebcal?v=1&cfg=json&geo=pos&latitude=${lat}&longitude=${lon}&start=${hebcalStartStr}&end=${endDateStr}&maj=on&min=on&mod=on&nx=on&mf=on&ss=off&s=on&i=${isIsrael ? 'on' : 'off'}&c=off&o=on`;
        const hebcalPromise = hebcalFetch(hebcalUrl).catch(() => null);

        const [zmanimData, locData] = await Promise.all([zmanimPromise, nomPromise]);

        let sunsetTime = 0;
        if (zmanimData && zmanimData.times) {
            state.currentZmanim = zmanimData.times;
            sunsetTime = zmanimData.times.sunset ? new Date(zmanimData.times.sunset).getTime() : 0;
            state.currentSunsetTime = sunsetTime;
        }

        const isAfterSunset = sunsetTime > 0 && new Date().getTime() > sunsetTime;
        const converterUrl = `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1&strict=1${isAfterSunset ? '&gs=on' : ''}`;

        const [hdateData, hebcalData] = await Promise.all([
            hebcalFetch(converterUrl).catch(() => null),
            hebcalPromise
        ]);

        if (overrideName) {
            locationName = overrideName;
        } else if (locData && locData.address) {
            const addr = locData.address;
            const city = addr.city || addr.town || addr.village || addr.state;
            if (addr.country) locationName = city ? `${city}, ${addr.country}` : addr.country;
            else locationName = city || "Jerusalem";
            if (addr.country_code) isIsrael = (addr.country_code.toLowerCase() === 'il');
        }

        console.log(`[API] ${locationName}`);

        if (hebcalData && hebcalData.items) {
            const biblicalMapping = {
                'Parashat': { name: 'Parashat' },
                'Pesach Sheni': { name: 'Pessach Sheni' },
                'Pesach': { name: 'Yom Pessach' },
                'Matzot': { name: 'Chag Matzot' },
                'Shavuot': { name: 'Yom Shavuot' },
                'Rosh Hashana': { name: 'Yom Teruah' },
                'Yom Kippur': { name: 'Yom Kippur' },
                'Sukkot': { name: 'Chag Sukkot' },
                'Shmini Atzeret': { name: 'Shemini Atzeret' },
                'Shemini Atzeret': { name: 'Shemini Atzeret' },
                'Simchat Torah': { name: 'Simchat Torah' },
                'Rosh Chodesh': { name: 'Rosh Chodesh' },
                'Omer': { name: 'Sefirat Omer' }
            };

            const validCategories = ['holiday', 'parashat', 'fast', 'omer', 'roshchodesh'];
            const filteredItems = hebcalData.items.filter(item => validCategories.includes(item.category));

            const defaultSunsetH = sunsetTime ? new Date(sunsetTime).getHours() : 18;
            const defaultSunsetM = sunsetTime ? new Date(sunsetTime).getMinutes() : 0;

            state.unifiedEvents = filteredItems
                .flatMap(item => {
                    const parts = item.date.split('T')[0].split('-');
                    let dateObj;
                    if (parts.length === 3) {
                        const y = parseInt(parts[0], 10);
                        const m = parseInt(parts[1], 10) - 1;
                        const d = parseInt(parts[2], 10);
                        const sH = defaultSunsetH;
                        const sM = defaultSunsetM;
                        const MINOR_FASTS = ['asarabtevet', 'tzomtammuz', 'tzomgedaliah', "ta'anit esther", 'ta\'anitesther'];
                        const titleLower = item.title.toLowerCase().replace(/\s+/g, '');
                        const isMinorFast = item.category === 'fast' && MINOR_FASTS.some(f => titleLower.includes(f.replace(/\s+/g, '')));

                        let dayOffset = 0;
                        if (item.category === 'parashat' || item.category === 'omer') {
                            dayOffset = -1;
                        } else if (item.category === 'holiday' || item.category === 'roshchodesh') {
                            dayOffset = item.title.includes('Erev') ? 0 : -1;
                        } else if (item.category === 'fast') {
                            dayOffset = isMinorFast ? 0 : -1;
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
                            if (key === 'Rosh Hashana' && (cleanTitle.includes('LaBehemot') || cleanTitle.includes('LaIlanot') || cleanTitle.includes('II') || cleanTitle.includes('Erev'))) {
                                continue;
                            }
                            if (key === 'Shavuot' && (cleanTitle.includes('II') || cleanTitle.includes('Erev'))) {
                                continue;
                            }
                            if (key === 'Yom Kippur' && cleanTitle.includes('Erev')) {
                                continue;
                            }
                            if (key === 'Sukkot' && cleanTitle.includes('Erev')) {
                                continue;
                            }

                            // Caso especial: 1 de Etanim gera 2 cards separados (Yom Teruah E Rosh Chodesh)
                            if (key === 'Rosh Hashana') {
                                const rawHdate = item.hdate || '1 Tishrei';
                                return [
                                    {
                                        name: 'Yom Teruah',
                                        time: dateObj.getTime(),
                                        category: 'yomteruah',
                                        rawCategory: item.category,
                                        isBiblical: true,
                                        isTraditional: false,
                                        raw: item
                                    },
                                    {
                                        name: 'Rosh Chodesh',
                                        time: dateObj.getTime(),
                                        category: 'roshchodesh',
                                        rawCategory: 'roshchodesh',
                                        isBiblical: true,
                                        isTraditional: false,
                                        raw: {
                                            ...item,
                                            title: `Rosh Chodesh ${rawHdate.split(' ').slice(1, -1).join(' ') || 'Tishrei'}`,
                                            category: 'roshchodesh',
                                            hdate: rawHdate
                                        }
                                    }
                                ];
                            }

                            itemName = biblicalMapping[key].name;
                            isBiblical = true;
                            customCategory = key.toLowerCase().replace(/ /g, '');

                            if (key === 'Parashat') {
                                itemName = 'Yom Shabbat';
                                customCategory = 'parashat';
                            } else if (key.includes('Atzeret')) {
                                itemName = 'Shemini Atzeret';
                                customCategory = 'sheminiatzeret';
                            } else if (key === 'Rosh Chodesh') {
                                // Na Torá, Rosh Chodesh é estritamente 1 único dia (o 1º dia do mês hebraico)
                                if (item.hdate && !item.hdate.startsWith('1 ')) {
                                    return [];
                                }
                                // No mês de Aviv (1º mês), é Rosh Chodashim (Shemot 12:2). Nos restantes, Rosh Chodesh.
                                const isAviv = item.hdate && (item.hdate.includes('Nisan') || item.hdate.includes('Aviv'));
                                itemName = isAviv ? 'Rosh Chodashim' : 'Rosh Chodesh';
                                customCategory = 'roshchodesh';
                            } else if (key === 'Pesach') {
                                if (cleanTitle.includes('Erev')) {
                                    customCategory = 'pesach';
                                    itemName = 'Yom Pessach';
                                } else {
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

                    // Mapeamento de tradições (NÃO são lei da Torá)
                    if (!isBiblical) {
                        const traditionalMapping = {
                            'Shabbat Shirah': { name: 'Shabbat Shirah', cat: 'shabbatshirah' },
                            'Purim Katan': { name: 'Purim Katan', cat: 'purimkatan' },
                            'Shushan Purim Katan': { name: 'Shushan Purim Katan', cat: 'shushanpurimkatan' },
                            'Shushan Purim': { name: 'Shushan Purim', cat: 'shushanpurim' },
                            'Shabbat HaChodesh': { name: 'Shabbat HaChodesh', cat: 'shabbathachodesh' },
                            'Shabbat HaGadol': { name: 'Shabbat HaGadol', cat: 'shabbathagadol' },
                            'Lag BaOmer': { name: 'Lag BaOmer', cat: 'lagbaomer' },
                            'Shabbat Chazon': { name: 'Shabbat Chazon', cat: 'shabbatchazon' },
                            'Shabbat Nachamu': { name: 'Shabbat Nachamu', cat: 'shabbatnahamu' },
                            'Leil Selichot': { name: 'Leil Selichot', cat: 'leilselichot' },
                            'Chanukah': { name: 'Chag Chanukah', cat: 'chanukah' }
                        };

                        // Tisha B'Av e Tzom Gedaliah da categoria 'fast'
                        if (cleanTitle === "Tish\u2018a B\u2019Av" || cleanTitle === "Tish'a B'Av") {
                            itemName = "Tisha B'Av";
                            isTraditional = true;
                            customCategory = 'tishabav';
                        } else if (cleanTitle === 'Tzom Gedaliah') {
                            itemName = 'Tzom Gedaliah';
                            isTraditional = true;
                            customCategory = 'tzomgedaliah';
                        } else {
                            for (const tKey in traditionalMapping) {
                                if (cleanTitle.includes(tKey)) {
                                    // Chanukah: agrupar todos os dias como um único evento
                                    if (tKey === 'Chanukah') {
                                        if (cleanTitle.includes('1 Candle') || cleanTitle === 'Chanukah: 8th Day') {
                                            itemName = traditionalMapping[tKey].name;
                                        } else {
                                            return []; // Ignorar dias intermédios
                                        }
                                    } else {
                                        itemName = traditionalMapping[tKey].name;
                                    }
                                    isTraditional = true;
                                    customCategory = traditionalMapping[tKey].cat;
                                    break;
                                }
                            }
                        }
                    }

                    if (!isBiblical && !isTraditional) {
                        return [];
                    }

                    return [{
                        name: itemName,
                        time: dateObj.getTime(),
                        category: customCategory,
                        rawCategory: item.category,
                        isBiblical: isBiblical,
                        isTraditional: isTraditional,
                        raw: item
                    }];
                });

            const festivalEvents = state.unifiedEvents.filter(ev =>
                ev.category !== 'parashat' &&
                ev.category !== 'omer' &&
                ev.name !== 'Yom Shabbat' &&
                !ev.name.includes('laOmer')
            );

            const formatGDate = (dateStr) => {
                if (!dateStr) return '';
                const parts = dateStr.split('T')[0].split('-');
                return parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
            };

            const hebrewMonthsPT = {
                'Nisan': 'Aviv', 'Iyyar': 'Ziv', 'Sivan': 'Sivan', 'Tammuz': 'Tamuz',
                'Av': 'Av', 'Elul': 'Elul', 'Tishrei': 'Etanim', 'Cheshvan': 'Bul',
                'Kislev': 'Kislev', 'Tevet': 'Tevet', 'Sh\'vat': 'Shevat', 'Shvat': 'Shevat',
                'Adar I': 'Adar I', 'Adar II': 'Adar II', 'Adar': 'Adar'
            };

            // Agrupa dias consecutivos da mesma festa baseado diretamente no Hebcal
            const mergedFestivals = [];
            for (const ev of festivalEvents) {
                const hParts = (ev.raw && ev.raw.hdate ? ev.raw.hdate : '').split(' ');
                const hDay = parseInt(hParts[0], 10) || 1;
                const hMonthEng = hParts.slice(1, -1).join(' ') || hParts[1] || '';
                const hMonth = hebrewMonthsPT[hMonthEng] || hMonthEng;

                const last = mergedFestivals[mergedFestivals.length - 1];
                const isSame = last && last.name === ev.name && last.hMonth === hMonth;
                const gapDays = last ? (ev.time - last.endTime) / (1000 * 60 * 60 * 24) : 999;

                if (isSame && gapDays <= 2) {
                    last.endHDay = hDay;
                    last.endDate = ev.raw && ev.raw.date ? ev.raw.date.split('T')[0] : last.endDate;
                    last.endTime = ev.time;
                } else {
                    const gDate = ev.raw && ev.raw.date ? ev.raw.date.split('T')[0] : '';
                    mergedFestivals.push({
                        name: ev.name,
                        hMonth: hMonth,
                        startHDay: hDay,
                        endHDay: hDay,
                        hdate: ev.raw && ev.raw.hdate ? ev.raw.hdate : '',
                        startDate: gDate,
                        endDate: gDate,
                        startTime: ev.time,
                        endTime: ev.time
                    });
                }
            }

            mergedFestivals.forEach(f => {
                const hRange = f.startHDay === f.endHDay ? `${f.startHDay} ${f.hMonth}` : `${f.startHDay} - ${f.endHDay} ${f.hMonth}`;
                const sDate = formatGDate(f.startDate);
                const eDate = formatGDate(f.endDate);
                const gregRange = (sDate === eDate || !eDate) ? sDate : `${sDate} - ${eDate}`;
                console.log(`[${hRange}] ${f.name} (${gregRange})`);
            });

            const offlinePayload = {
                events: state.unifiedEvents,
                hdate: hdateData,
                locName: locationName,
                sunset: sunsetTime,
                isIsrael: isIsrael,
                zmanim: state.currentZmanim,
                timestamp: new Date().getTime()
            };
            localStorage.setItem('hebcal_offline_cache', JSON.stringify(offlinePayload));

            updateUIBlocks(state.unifiedEvents, hdateData || { hd: 15, hm: 'Av', hy: 5786 }, locationName, sunsetTime, isIsrael);
        } else {
            const offlineDataRaw = localStorage.getItem('hebcal_offline_cache');
            if (offlineDataRaw) {
                try {
                    const data = JSON.parse(offlineDataRaw);
                    state.unifiedEvents = data.events || [];
                    state.currentZmanim = data.zmanim || null;
                    updateUIBlocks(data.events || [], data.hdate || { hd: 15, hm: 'Av', hy: 5786 }, locationName || data.locName || "Jerusalém, Israel", data.sunset || 0, data.isIsrael !== undefined ? data.isIsrael : true);
                } catch (e) {
                    updateUIBlocks([], { hd: 15, hm: 'Av', hy: 5786 }, locationName || "Jerusalém, Israel", 0, isIsrael);
                }
            } else {
                updateUIBlocks([], { hd: 15, hm: 'Av', hy: 5786 }, locationName || "Jerusalém, Israel", 0, isIsrael);
            }
        }
    } catch (err) {
        console.error("Dashboard Sync Failed", err);
        const offlineDataRaw = localStorage.getItem('hebcal_offline_cache');
        if (offlineDataRaw) {
            try {
                const data = JSON.parse(offlineDataRaw);
                state.unifiedEvents = data.events || [];
                state.currentZmanim = data.zmanim || null;
                updateUIBlocks(data.events || [], data.hdate || { hd: 15, hm: 'Av', hy: 5786 }, data.locName || "Jerusalém, Israel", data.sunset || 0, data.isIsrael !== undefined ? data.isIsrael : true);
            } catch (e) {
                updateUIBlocks([], { hd: 15, hm: 'Av', hy: 5786 }, "Jerusalém, Israel", 0, true);
            }
        } else {
            updateUIBlocks([], { hd: 15, hm: 'Av', hy: 5786 }, "Jerusalém, Israel", 0, true);
        }
    }

    await minDelayPromise;
    renderEvents();

    // Revela TODOS os cartões perfeitamente juntos no mesmo milissegundo
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 50);

    if (state.sunsetTimeout) clearTimeout(state.sunsetTimeout);
    if (state.currentSunsetTime > new Date().getTime()) {
        const msToSunset = state.currentSunsetTime - new Date().getTime();
        state.sunsetTimeout = setTimeout(async () => {
            await updateDashboard();
        }, msToSunset + 1000);
    } else {
        const nextMidnight = new Date();
        nextMidnight.setHours(24, 0, 10, 0);
        const msToMidnight = nextMidnight.getTime() - new Date().getTime();
        state.sunsetTimeout = setTimeout(async () => {
            await updateDashboard();
        }, msToMidnight);
    }
}

initModals(updateDashboard);
updateDashboard();

const xMINUTES_MS = 30 * 60 * 1000;
setInterval(() => {
    window.location.reload();
}, xMINUTES_MS);

