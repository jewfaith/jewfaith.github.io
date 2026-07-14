import { state } from './state.js';
import { getGeolocation } from './api/geolocation.js';
import { hebcalFetch, fetchNominatimReverse } from './api/hebcal.js';
import { updateUIBlocks, renderEvents, showDashboardSkeletons } from './ui/dashboard.js';
import { initModals } from './ui/modals.js';
import { applyEstimatedTheme } from './ui/theme.js';

// Registro do Service Worker para PWA e Offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

async function updateDashboard() {
    // 0. Impor loading esqueleto imediatamente
    showDashboardSkeletons();

    // 0.5. Iniciar o temporizador de 250ms em paralelo com os pedidos de rede
    const minDelayPromise = new Promise(resolve => setTimeout(resolve, 250));

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

    // 1. Stale-While-Revalidate: Carrega cache instantaneamente (0ms) se existir
    const offlineDataRaw = localStorage.getItem('hebcal_offline_cache');
    let loadedFromCache = false;
    if (offlineDataRaw) {
        try {
            const data = JSON.parse(offlineDataRaw);
            state.unifiedEvents = data.events;
            state.currentZmanim = data.zmanim || null;
            await minDelayPromise; // Garante que a cache também respeita os 250ms
            updateUIBlocks(data.events, data.hdate, data.locName, data.sunset, data.isIsrael);
            renderEvents();
            loadedFromCache = true;
        } catch (e) {}
    }

    const grid = document.getElementById('upcoming-events-grid');

    try {
        if (!state.userLocation) {
            state.userLocation = await getGeolocation();
        }

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 6);
        const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

        let lat = state.userLocation ? state.userLocation.lat : 31.7683;
        let lon = state.userLocation ? state.userLocation.lon : 35.2137;
        let tzid = state.userLocation && state.userLocation.tz ? state.userLocation.tz : Intl.DateTimeFormat().resolvedOptions().timeZone;

        let overrideName = null;
        let overrideIsIsrael = null;

        // Se houver uma localização exata de GPS salva, sobrepor tudo
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

        let locationName = "Jerusalém";
        let isIsrael = true; // default to true since fallback is Jerusalem

        // Determine if in Israel via system timezone first as a quick local check
        const sysTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (overrideIsIsrael !== null) {
            isIsrael = overrideIsIsrael;
        } else if (geoWasDetected) {
            isIsrael = (sysTimezone === 'Asia/Jerusalem');
        }

        const hebcalStartDate = new Date(year, today.getMonth() - 6, 1);
        const hsYear = hebcalStartDate.getFullYear();
        const hsMonth = hebcalStartDate.getMonth() + 1;
        const hsDay = hebcalStartDate.getDate();
        const hebcalStartStr = `${hsYear}-${String(hsMonth).padStart(2, '0')}-${String(hsDay).padStart(2, '0')}`;

        // 1. FIRE NOMINATIM PROMISE FIRST (so we can resolve isIsrael before Hebcal if needed)
        const nomPromise = (geoWasDetected && !overrideName) ? fetchNominatimReverse(lat, lon) : Promise.resolve(null);

        // Se isIsrael não tiver override guardado, aguarda Nominatim para garantir
        // que o parâmetro i= do Hebcal reflecte o país real (não o fuso do sistema)
        if (overrideIsIsrael === null && geoWasDetected && !overrideName) {
            try {
                const earlyNom = await nomPromise;
                if (earlyNom && earlyNom.address && earlyNom.address.country_code) {
                    isIsrael = earlyNom.address.country_code.toLowerCase() === 'il';
                }
            } catch (e) { /* mantém estimativa pelo fuso do sistema */ }
        }

        // 2. FIRE HEBCAL EVENTS PROMISE — agora com isIsrael correcto (Doesn't block)
        const hebcalUrl = `https://www.hebcal.com/hebcal?v=1&cfg=json&geo=pos&latitude=${lat}&longitude=${lon}&start=${hebcalStartStr}&end=${endDateStr}&maj=on&min=on&mod=on&nx=on&mf=on&ss=off&s=on&i=${isIsrael ? 'on' : 'off'}&c=off&o=on`;
        const hebcalPromise = hebcalFetch(hebcalUrl).catch(() => null);

        // 3. AWAIT ZMANIM (Blocks here because Converter depends on it)
        let sunsetTime = 0;
        try {
            const zmRes = await fetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&date=${dateStr}&tzid=${tzid}`);
            const zmanimData = await zmRes.json();
            state.currentZmanim = zmanimData.times || null;
            sunsetTime = zmanimData.times && zmanimData.times.sunset ? new Date(zmanimData.times.sunset).getTime() : 0;
            state.currentSunsetTime = sunsetTime;
        } catch (e) { console.error('Zmanim failed', e); }
        
        const isAfterSunset = sunsetTime > 0 && new Date().getTime() > sunsetTime;

        // 4. AWAIT CONVERTER
        const converterUrl = `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1&strict=1${isAfterSunset ? '&gs=on' : ''}`;
        const hdateData = await hebcalFetch(converterUrl).catch(() => null);

        // 5. RESOLVE PARALLEL PROMISES
        const locData = await nomPromise;
        if (overrideName) {
            locationName = overrideName;
        } else if (locData && locData.address) {
            const addr = locData.address;
            const city = addr.city || addr.town || addr.village || addr.state;
            if (addr.country) locationName = city ? `${city}, ${addr.country}` : addr.country;
            else locationName = city || "Jerusalém";
            if (addr.country_code) isIsrael = (addr.country_code.toLowerCase() === 'il');
        }

        const hebcalData = await hebcalPromise;

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
                'Shmini Atzeret': { name: 'Shemini Atzeret' },
                'Shemini Atzeret': { name: 'Shemini Atzeret' },
                'Simchat Torah': { name: 'Simchat Torah' },
                'Rosh Chodesh': { name: 'Rosh Chodesh' },
                'Omer': { name: 'Sefirat Omer' }
            };

            const validCategories = ['holiday', 'parashat', 'fast', 'omer', 'roshchodesh'];
            const filteredItems = hebcalData.items.filter(item => validCategories.includes(item.category));

            // Collect unique dates so we can fetch each date's sunset individually
            // Limit to events happening in the next 10 days to keep imminent events hyper-realistic while saving API requests
            const tenDaysFromNow = new Date().getTime() + (10 * 24 * 60 * 60 * 1000);
            const uniqueDates = [...new Set(filteredItems.map(item => item.date.split('T')[0]))]
                .filter(d => new Date(`${d}T12:00:00`).getTime() <= tenDaysFromNow);

            // Fetch zmanim for each unique date in parallel
            const sunsetByDate = { [dateStr]: sunsetTime }; // seed with today already fetched
            await Promise.allSettled(
                uniqueDates
                    .filter(d => d !== dateStr)
                    .map(async (d) => {
                        try {
                            const _ctrl = new AbortController();
                            const _tid = setTimeout(() => _ctrl.abort(), 6000);
                            const r = await fetch(
                                `https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&date=${d}&tzid=${tzid}`,
                                { signal: _ctrl.signal }
                            );
                            clearTimeout(_tid);
                            if (!r.ok) return;
                            const zm = await r.json();
                            sunsetByDate[d] = zm.times && zm.times.sunset
                                ? new Date(zm.times.sunset).getTime()
                                : 0;
                        } catch (e) { /* fallback to 18:00 below */ }
                    })
            );

            state.unifiedEvents = filteredItems
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
                        // Minor fasts start at dawn (no dayOffset), major fasts/holidays start at sunset the day before
                        const MINOR_FASTS = ['asarabtevet', 'tzomtammuz', 'tzomgedaliah', "ta'anit esther", 'ta\'anitesther'];
                        const titleLower = item.title.toLowerCase().replace(/\s+/g, '');
                        const isMinorFast = item.category === 'fast' && MINOR_FASTS.some(f => titleLower.includes(f.replace(/\s+/g, '')));

                        let dayOffset = 0;
                        if (item.category === 'parashat' || item.category === 'omer') {
                            dayOffset = -1;
                        } else if (item.category === 'holiday' || item.category === 'roshchodesh') {
                            dayOffset = item.title.includes('Erev') ? 0 : -1;
                        } else if (item.category === 'fast') {
                            // Major fasts (Yom Kippur, Tisha B'Av) start the evening before; minor fasts start at dawn
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
                            // Previne que outros 'anos novos' menores sejam confundidos com o Yom Teruah
                            if (key === 'Rosh Hashana' && (cleanTitle.includes('LaBehemot') || cleanTitle.includes('LaIlanot'))) {
                                continue;
                            }
                            
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
                            "Ta'anit Esther": "Ta'anit Esther",
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

            updateUIBlocks(state.unifiedEvents, hdateData, locationName, sunsetTime, isIsrael);
        }
    } catch (err) {
        console.error("Dashboard Sync Failed", err);
        const offlineDataRaw = localStorage.getItem('hebcal_offline_cache');
        if (offlineDataRaw) {
            try {
                const data = JSON.parse(offlineDataRaw);
                state.unifiedEvents = data.events;
                state.currentZmanim = data.zmanim || null;
                updateUIBlocks(data.events, data.hdate, data.locName, data.sunset, data.isIsrael);
            } catch (e) {
                console.error("Failed to load offline cache", e);
                updateUIBlocks([], { hd: '-', hm: '', hy: '' }, 'Erro', 0, true);
            }
        } else {
            updateUIBlocks([], { hd: '-', hm: '', hy: '' }, 'Erro', 0, true);
        }
    }

    // Aguardar que os 250ms mínimos tenham passado (em paralelo com a rede)
    await minDelayPromise;

    renderEvents();

    // Quando tudo acabar de renderizar e preparar, espera 50ms para remover o esqueleto e mostrar a UI final
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
        // Se o pôr-do-sol já passou hoje, agenda a próxima atualização para a meia-noite (00:00:10)
        // para carregar o novo dia civil e recalcular os zmanim do dia seguinte.
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
