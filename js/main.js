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

// Função auxiliar para carregar o cache sem repetir código
function loadOfflineCache(defaultLocName = "Jerusalém, Israel", defaultIsIsrael = true) {
    const offlineDataRaw = localStorage.getItem('hebcal_offline_cache');
    if (offlineDataRaw) {
        try {
            const data = JSON.parse(offlineDataRaw);
            state.unifiedEvents = data.events || [];
            state.currentZmanim = data.zmanim || null;
            state.currentSunsetTime = data.sunset || 0;
            updateUIBlocks(
                data.events || [],
                data.hdate || { hd: 15, hm: 'Av', hy: 5786 },
                data.locName || defaultLocName,
                data.sunset || 0,
                data.isIsrael ?? defaultIsIsrael
            );
            return true;
        } catch (e) { /* cache inválido */ }
    }
    updateUIBlocks([], { hd: 15, hm: 'Av', hy: 5786 }, defaultLocName, 0, defaultIsIsrael);
    return false;
}

async function updateDashboard() {
    // 1. Aplicação rápida do tema
    const exactLocRaw = localStorage.getItem('exactLocation');
    if (exactLocRaw) {
        try {
            const exactLoc = JSON.parse(exactLocRaw);
            const parsedLat = parseFloat(exactLoc.lat);
            const parsedLon = parseFloat(exactLoc.lon);
            applyEstimatedTheme(!isNaN(parsedLat) ? parsedLat : undefined, !isNaN(parsedLon) ? parsedLon : undefined);
        } catch (e) {
            applyEstimatedTheme();
        }
    } else {
        applyEstimatedTheme();
    }

    // 2. Hidratação Instantânea via Cache (0ms startup)
    const hasHydratedFromCache = loadOfflineCache();

    if (hasHydratedFromCache) {
        renderEvents();
        document.body.classList.add('loaded');
    } else {
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

        let lat = state.userLocation?.lat ?? 31.7683;
        let lon = state.userLocation?.lon ?? 35.2137;
        let tzid = state.userLocation?.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

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
        let isIsrael = overrideIsIsrael ?? (geoWasDetected ? Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Jerusalem' : true);

        const hebcalStartStr = `${year}-01-01`;
        const endDateStr = `${year + 1}-12-31`;

        // Requisições paralelas
        const nomPromise = (geoWasDetected && !overrideName) ? fetchNominatimReverse(lat, lon) : Promise.resolve(null);
        const zmanimPromise = hebcalFetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&date=${dateStr}&tzid=${tzid}`).catch(() => null);
        const hebcalUrl = `https://www.hebcal.com/hebcal?v=1&cfg=json&geo=pos&latitude=${lat}&longitude=${lon}&start=${hebcalStartStr}&end=${endDateStr}&maj=on&min=on&mod=on&nx=on&mf=on&ss=off&s=on&i=${isIsrael ? 'on' : 'off'}&c=off&o=on`;
        const hebcalPromise = hebcalFetch(hebcalUrl).catch(() => null);

        const [zmanimData, locData] = await Promise.all([zmanimPromise, nomPromise]);

        let sunsetTime = 0;
        if (zmanimData?.times) {
            state.currentZmanim = zmanimData.times;
            sunsetTime = zmanimData.times.sunset ? new Date(zmanimData.times.sunset).getTime() : 0;
            state.currentSunsetTime = sunsetTime;
        }

        const isAfterSunset = sunsetTime > 0 && Date.now() > sunsetTime;
        const converterUrl = `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1&strict=1${isAfterSunset ? '&gs=on' : ''}`;

        const [hdateData, hebcalData] = await Promise.all([
            hebcalFetch(converterUrl).catch(() => null),
            hebcalPromise
        ]);

        if (overrideName) {
            locationName = overrideName;
        } else if (locData?.address) {
            const addr = locData.address;
            const city = addr.city || addr.town || addr.village || addr.state;
            locationName = addr.country ? (city ? `${city}, ${addr.country}` : addr.country) : (city || "Jerusalem");
            if (addr.country_code) isIsrael = (addr.country_code.toLowerCase() === 'il');
        }

        if (hebcalData?.items) {
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
                'Rosh Chodesh': { name: 'Rosh Chodesh' },
                'Omer': { name: 'Sefirat Omer' }
            };

            const validCategories = ['holiday', 'parashat', 'fast', 'omer', 'roshchodesh'];
            const filteredItems = hebcalData.items.filter(item => validCategories.includes(item.category));

            const defaultSunsetH = sunsetTime ? new Date(sunsetTime).getHours() : 18;
            const defaultSunsetM = sunsetTime ? new Date(sunsetTime).getMinutes() : 0;

            state.unifiedEvents = filteredItems.flatMap(item => {
                const parts = item.date.split('T')[0].split('-');
                let dateObj = new Date();

                if (parts.length === 3) {
                    const y = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10) - 1;
                    const d = parseInt(parts[2], 10);
                    const MINOR_FASTS = ['asarabtevet', 'tzomtammuz', 'tzomgedaliah', "ta'anit esther", "ta'anitesther"];
                    const titleLower = item.title.toLowerCase().replace(/\s+/g, '');
                    const isMinorFast = item.category === 'fast' && MINOR_FASTS.some(f => titleLower.includes(f));

                    let dayOffset = 0;
                    if (item.category === 'parashat' || item.category === 'omer') {
                        dayOffset = -1;
                    } else if (item.category === 'holiday' || item.category === 'roshchodesh') {
                        dayOffset = item.title.includes('Erev') ? 0 : -1;
                    } else if (item.category === 'fast') {
                        dayOffset = isMinorFast ? 0 : -1;
                    }
                    dateObj = new Date(y, m, d + dayOffset, defaultSunsetH, defaultSunsetM, 0);
                }

                const cleanTitle = item.title.replace(/[\u2018\u2019]/g, "'");
                let itemName = item.title;
                let isBiblical = false;
                let isTraditional = false;
                let customCategory = item.category;

                for (const key in biblicalMapping) {
                    if (cleanTitle.includes(key)) {
                        if (['Rosh Hashana', 'Shavuot', 'Yom Kippur', 'Sukkot'].some(k => key === k) && (cleanTitle.includes('II') || cleanTitle.includes('Erev') || cleanTitle.includes('LaBehemot') || cleanTitle.includes('LaIlanot'))) {
                            if (!(key === 'Pesach' && cleanTitle.includes('Erev'))) continue;
                        }

                        if (key === 'Rosh Hashana') {
                            const rawHdate = item.hdate || '1 Tishrei';
                            return [
                                { name: 'Yom Teruah', time: dateObj.getTime(), category: 'yomteruah', rawCategory: item.category, isBiblical: true, isTraditional: false, raw: item },
                                { name: 'Rosh Chodesh', time: dateObj.getTime(), category: 'roshchodesh', rawCategory: 'roshchodesh', isBiblical: true, isTraditional: false, raw: { ...item, title: `Rosh Chodesh ${rawHdate.split(' ').slice(1, -1).join(' ') || 'Tishrei'}`, category: 'roshchodesh', hdate: rawHdate } },
                                { name: 'Rosh Hashana', time: dateObj.getTime(), category: 'roshhashana', rawCategory: item.category, isBiblical: false, isTraditional: true, raw: item }
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
                            if (item.hdate && !item.hdate.startsWith('1 ')) return [];
                            const isAviv = item.hdate && (item.hdate.includes('Nisan') || item.hdate.includes('Aviv'));
                            itemName = isAviv ? 'Rosh Chodashim' : 'Rosh Chodesh';
                            customCategory = 'roshchodesh';
                        } else if (key === 'Pesach') {
                            customCategory = cleanTitle.includes('Erev') ? 'pesach' : 'matzot';
                            itemName = cleanTitle.includes('Erev') ? 'Yom Pessach' : 'Chag Matzot';
                        } else if (key === 'Omer') {
                            const match = cleanTitle.match(/\d+/);
                            if (match) itemName = `${match[0]} laOmer`;
                        }
                        break;
                    }
                }

                if (!isBiblical) {
                    const traditionalMapping = {
                        // Purim e dias associados
                        'Shushan Purim Katan': 'shushanpurimkatan',
                        'Purim Katan': 'purimkatan',
                        'Shushan Purim': 'shushanpurim',
                        'Purim': 'purim',
                        'Ta\'anit Esther': 'taanitesther',
                        'Taanit Esther': 'taanitesther',
                        'Fast of Esther': 'taanitesther',

                        // Chanukah
                        'Chanukah': 'chanukah',
                        'Hanukkah': 'chanukah',

                        // Festas e Datas do Calendário Rabínico
                        'Rosh Hashana LaBehemot': 'roshhashanalabehemot',
                        'Rosh Hashana': 'roshhashana',
                        'Rosh Hashanah': 'roshhashana',
                        'Simchat Torah': 'simchattorah',
                        'Simchas Torah': 'simchattorah',
                        'Hoshana Raba': 'hoshanarabbah',
                        'Hoshana Rabbah': 'hoshanarabbah',
                        'Tu BiShvat': 'tubishvat',
                        'Tu B\'Shevat': 'tubishvat',
                        'Tu B\'Av': 'tubaav',
                        'Lag BaOmer': 'lagbaomer',
                        'Lag B\'Omer': 'lagbaomer',
                        'Leil Selichot': 'leilselichot',

                        // Quatro Jejuns Rabínicos
                        'Tzom Gedaliah': 'tzomgedaliah',
                        'Fast of Gedaliah': 'tzomgedaliah',
                        'Asara B\'Tevet': 'tzomtevet',
                        'Tzom Tevet': 'tzomtevet',
                        'Fast of Tevet': 'tzomtevet',
                        '10 of Tevet': 'tzomtevet',
                        'Tzom Tammuz': 'tzomtammuz',
                        '17 of Tammuz': 'tzomtammuz',
                        'Fast of Tammuz': 'tzomtammuz',
                        'Tish\'a B\'Av': 'tishabav',
                        'Tisha B\'Av': 'tishabav',
                        'Fast of Av': 'tishabav',

                        // Shabbatot Especiais
                        'Shabbat Shekalim': 'shabbatshekalim',
                        'Shabbat Zachor': 'shabbatzachor',
                        'Shabbat Parah': 'shabbatparah',
                        'Shabbat HaChodesh': 'shabbathachodesh',
                        'Shabbat HaGadol': 'shabbathagadol',
                        'Shabbat Shirah': 'shabbatshirah',
                        'Shabbat Chazon': 'shabbatchazon',
                        'Shabbat Nachamu': 'shabbatnahamu',
                        'Shabbat Shuva': 'shabbatshuvah',
                        'Shabbat Shuvah': 'shabbatshuvah'
                    };

                    for (const tKey in traditionalMapping) {
                        if (cleanTitle.includes(tKey)) {
                            if ((tKey === 'Chanukah' || tKey === 'Hanukkah') && !(cleanTitle.includes('1 Candle') || cleanTitle.includes('8th Day') || cleanTitle === 'Chanukah' || cleanTitle === 'Hanukkah')) {
                                return [];
                            }
                            let mappedName = tKey;
                            if (tKey === 'Chanukah' || tKey === 'Hanukkah') mappedName = 'Chag Chanukah';
                            else if (tKey === 'Rosh Hashana LaBehemot') mappedName = 'Rosh Elul';
                            else if (tKey === 'Purim' && !cleanTitle.includes('Katan') && !cleanTitle.includes('Shushan')) mappedName = 'Yom Purim';
                            else if (tKey === 'Shushan Purim Katan') mappedName = 'Shushan Purim';
                            else if (tKey.startsWith('Rosh Hashana')) mappedName = 'Rosh Hashana';
                            else if (tKey === 'Ta\'anit Esther' || tKey === 'Taanit Esther' || tKey === 'Fast of Esther') mappedName = 'Ta\'anit Esther';
                            else if (tKey === 'Tzom Tammuz' || tKey === '17 of Tammuz' || tKey === 'Fast of Tammuz') mappedName = 'Tzom Tammuz';
                            else if (tKey === 'Asara B\'Tevet' || tKey === 'Tzom Tevet' || tKey === '10 of Tevet' || tKey === 'Fast of Tevet') mappedName = 'Tzom Tevet';
                            else if (tKey.includes('Tish') || tKey === 'Fast of Av') mappedName = "Tisha B'Av";
                            else if (tKey === 'Tzom Gedaliah' || tKey === 'Fast of Gedaliah') mappedName = 'Tzom Gedaliah';
                            else if (tKey.includes('Hoshana')) mappedName = 'Hoshana Rabbah';
                            else if (tKey.includes('Shuva')) mappedName = 'Shabbat Shuvah';
                            else if (tKey.includes('Simchat') || tKey.includes('Simchas')) mappedName = 'Simchat Torah';
                            else if (tKey.includes('Tu BiShvat') || tKey.includes('Tu B\'Shevat')) mappedName = 'Tu BiShvat';
                            else if (tKey.includes('Tu B\'Av')) mappedName = 'Tu B\'Av';
                            else if (tKey.includes('Lag B')) mappedName = 'Lag BaOmer';

                            itemName = mappedName;
                            isTraditional = true;
                            customCategory = traditionalMapping[tKey];
                            break;
                        }
                    }
                }

                if (!isBiblical && !isTraditional) return [];

                return [{
                    name: itemName,
                    time: dateObj.getTime(),
                    category: customCategory,
                    rawCategory: item.category,
                    isBiblical,
                    isTraditional,
                    raw: item
                }];
            });

            // Guardar no Cache Local
            localStorage.setItem('hebcal_offline_cache', JSON.stringify({
                events: state.unifiedEvents,
                hdate: hdateData,
                locName: locationName,
                sunset: sunsetTime,
                isIsrael,
                zmanim: state.currentZmanim,
                timestamp: Date.now()
            }));

            updateUIBlocks(state.unifiedEvents, hdateData || { hd: 15, hm: 'Av', hy: 5786 }, locationName, sunsetTime, isIsrael);
        } else {
            loadOfflineCache(locationName, isIsrael);
        }
    } catch (err) {
        console.error("Dashboard Sync Failed", err);
        loadOfflineCache();
    }

    await minDelayPromise;
    renderEvents();

    setTimeout(() => document.body.classList.add('loaded'), 50);

    // Agendar próximo recálculo (ao Pôr do Sol ou à Meia-Noite)
    if (state.sunsetTimeout) clearTimeout(state.sunsetTimeout);

    const now = Date.now();
    let delay = 0;

    if (state.currentSunsetTime > now) {
        delay = state.currentSunsetTime - now + 1000;
    } else {
        const nextMidnight = new Date();
        nextMidnight.setHours(24, 0, 10, 0);
        delay = nextMidnight.getTime() - now;
    }

    state.sunsetTimeout = setTimeout(() => updateDashboard(), delay);
}

// Inicialização
initModals(updateDashboard);
updateDashboard();