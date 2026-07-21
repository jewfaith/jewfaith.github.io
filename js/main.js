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
    document.body.classList.remove('loaded');
    showDashboardSkeletons();

    const minDelayPromise = new Promise(resolve => setTimeout(resolve, 350));

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

        const hebcalStartDate = new Date(year, today.getMonth() - 6, 1);
        const hsYear = hebcalStartDate.getFullYear();
        const hsMonth = hebcalStartDate.getMonth() + 1;
        const hsDay = hebcalStartDate.getDate();
        const hebcalStartStr = `${hsYear}-${String(hsMonth).padStart(2, '0')}-${String(hsDay).padStart(2, '0')}`;

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
                .map(item => {
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
                            if (key === 'Rosh Hashana' && (cleanTitle.includes('LaBehemot') || cleanTitle.includes('LaIlanot'))) {
                                continue;
                            }
                            
                            itemName = biblicalMapping[key].name;
                            isBiblical = true;
                            customCategory = key.toLowerCase().replace(/ /g, '');

                            if (key === 'Parashat') {
                                itemName = 'Yom Shabbat';
                                customCategory = 'parashat';
                            } else if (key === 'Rosh Chodesh') {
                                itemName = 'Rosh Chodesh';
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
                        return null;
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

            updateUIBlocks(state.unifiedEvents, hdateData || { hd: 15, hm: 'Av', hy: 5786 }, locationName, sunsetTime, isIsrael);
        } else {
            const offlineDataRaw = localStorage.getItem('hebcal_offline_cache');
            if (offlineDataRaw) {
                try {
                    const data = JSON.parse(offlineDataRaw);
                    state.unifiedEvents = data.events || [];
                    state.currentZmanim = data.zmanim || null;
                    updateUIBlocks(data.events || [], data.hdate || { hd: 15, hm: 'Av', hy: 5786 }, locationName || data.locName || "Jerusalém, Israel", data.sunset || 0, data.isIsrael !== undefined ? data.isIsrael : true);
                } catch(e) {
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
