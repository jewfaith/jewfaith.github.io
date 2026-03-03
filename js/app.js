// ========================================
// OR HAZMAN - JEWISH CALENDAR DASHBOARD
// ========================================

document.addEventListener('DOMContentLoaded', initApp);

// Global state
let countdownInterval = null;
let nextHolidayInterval = null;

// ========================================
// INITIALIZATION
// ========================================

// ========================================
// INITIALIZATION
// ========================================

async function initApp() {
    setupEventListeners();

    // Always request location permission on load
    requestLocation();
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    const gpsBtn = document.getElementById('gps-btn');
    const shareBtn = document.getElementById('share-btn');
    const searchInput = document.getElementById('city-search');

    // GPS button - get current location
    gpsBtn.addEventListener('click', () => getCurrentLocation());

    // Share button - share app
    shareBtn.addEventListener('click', () => shareApp());

    // Enter key in input - search for typed location
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchLocation(searchInput.value);
    });

    // Copy buttons
    setupCopyButtons();
}

// Share the app URL
function shareApp() {
    const shareUrl = window.location.href;
    const pageTitle = document.title || "Calendário Judaico";
    const fullText = `${pageTitle}\n${shareUrl}`;

    // Always copy to clipboard
    copyToClipboard(fullText);

    // Try native share (mobile) if available
    if (navigator.share) {
        navigator.share({
            title: "Calendário Judaico",
            url: shareUrl
        }).catch((e) => console.log('Share dismissed', e));
    }
}

function copyToClipboard(text) {
    // Copy with visual feedback (icon only, no toast)
    navigator.clipboard.writeText(text).then(() => {
        const shareBtn = document.getElementById('share-btn');
        if (!shareBtn) return; // Guard clause

        const icon = shareBtn.querySelector('i');
        const originalClass = icon.className;

        icon.className = 'fas fa-circle-check';
        setTimeout(() => {
            icon.className = originalClass;
        }, 1500);
    }).catch(() => {
        console.error("Failed to copy");
    });
}


// Setup copy buttons functionality
function setupCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click events if any

            const card = btn.closest('.data-card');
            if (!card) return;

            // Get content
            const value = card.querySelector('.card-value').textContent;

            // Determine label: Use data attribute if exists, otherwise NO label (just value)
            const customLabel = btn.getAttribute('data-copy-label');

            let textToCopy = value;
            if (customLabel) {
                textToCopy = `${customLabel}: ${value}`;
            }

            // Copy logic - Silent but with Icon Feedback
            navigator.clipboard.writeText(textToCopy).then(() => {
                const icon = btn.querySelector('i');
                const originalClass = icon.className;

                icon.className = 'fas fa-circle-check';

                setTimeout(() => {
                    icon.className = originalClass;
                }, 1500);
            }).catch(err => console.error("Copy failed", err));
        });
    });
}

// Get GPS location and populate input
async function getCurrentLocation() {
    const gpsBtn = document.getElementById('gps-btn');
    const searchInput = document.getElementById('city-search');
    const icon = gpsBtn.querySelector('i');

    // Show loading state
    const originalClass = icon.className;
    icon.className = 'fas fa-spinner fa-spin';
    gpsBtn.disabled = true;

    if (!navigator.geolocation) {
        showError(t("err.gps_denied")); // Using gps_denied as fallback or create new key for not supported
        icon.className = originalClass;
        gpsBtn.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            try {
                // Reverse geocode to get city name
                const response = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`
                );
                const data = await response.json();

                const cityName = data.city || data.locality || data.principalSubdivision || 'Localização Atual';
                const country = data.countryName || '';

                // Populate input with detected location
                searchInput.value = cityName + (country ? ', ' + country : '');

                // Trigger the search automatically
                await fetchData(lat, lon);


                // Show success feedback
                icon.className = 'fas fa-circle-check';
                setTimeout(() => {
                    icon.className = originalClass;
                }, 1500);

            } catch (e) {
                console.error('Geocode error:', e);
                searchInput.value = 'Localização Atual';
                await fetchData(lat, lon);
                icon.className = originalClass;

            }

            gpsBtn.disabled = false;
        },
        (err) => {
            console.error('GPS Error:', err);
            let message;
            switch (err.code) {
                case err.PERMISSION_DENIED:
                    message = t("err.gps_denied");
                    break;
                case err.POSITION_UNAVAILABLE:
                    message = t("err.gps_unavailable");
                    break;
                case err.TIMEOUT:
                    message = t("err.gps_timeout");
                    break;
                default:
                    message = t("err.gps_generic");
            }
            showError(message);
            icon.className = originalClass;
            gpsBtn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
}

// ========================================
// LOCATION HANDLING
// ========================================

async function searchLocation(query) {
    if (!query || query.trim() === '') {
        showError(t("err.search_empty"));
        return;
    }

    try {
        showLoading();

        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
        );

        if (!res.ok) {
            throw new Error('NETWORK');
        }

        const data = await res.json();

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            localStorage.setItem('userCoords', JSON.stringify({ lat, lon }));
            await fetchData(lat, lon);
        } else {

            throw new Error('NOT_FOUND');
        }
    } catch (e) {
        let friendlyMessage;
        if (e.message === 'NOT_FOUND') {
            friendlyMessage = t("err.city_not_found");
        } else if (e.message === 'NETWORK' || e.message.includes('fetch')) {
            friendlyMessage = t("err.network");
        } else {
            friendlyMessage = t("err.generic_retry");
        }
        showError(friendlyMessage);
    }
}

function requestLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                localStorage.setItem('userCoords', JSON.stringify({ lat, lon }));
                await fetchData(lat, lon);
            },

            async (err) => {
                console.warn("GPS Denied or Error:", err);

                // Try to fallback to saved coordinates if GPS fails
                const savedCoords = localStorage.getItem('userCoords');
                if (savedCoords) {
                    try {
                        const { lat, lon } = JSON.parse(savedCoords);
                        await fetchData(lat, lon);
                        return;

                    } catch (e) {
                        console.error("Saved coords invalid", e);
                    }
                }

                console.warn("Using Jerusalem as fallback");
                await fetchData(31.7683, 35.2137);
            }
        );
    } else {
        fetchData(31.7683, 35.2137);
    }
}


// ========================================
// DATA FETCHING
// ========================================

async function fetchData(lat, lon) {
    try {
        showLoading();

        // Update location type indicator
        // updateDOM('location-type', isManual ? t("status.location_selected") : t("status.location_gps"));

        // 1. Get city name from coordinates (BigDataCloud)
        const cityRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}`
        );
        const cityData = await cityRes.json();

        const cityName = cityData.city || cityData.locality || t("status.unknown_location");
        const districtName = cityData.principalSubdivision || "";
        const country = cityData.countryName || "";

        updateDOM('location-name', districtName ? `${cityName}, ${districtName}` : cityName);
        updateDOM('location-city', cityName);
        updateDOM('lat-long', `${lat.toFixed(4)}, ${lon.toFixed(4)}`);



        // 2. Fetch Jewish calendar data
        // VIAGEM NO TEMPO: Se houver uma data simulada, usamos essa em vez da real
        const today = window.simulatedDate ? new Date(window.simulatedDate + "T12:00:00") : new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const dateStr = today.toISOString().split('T')[0];

        // Calculate end date (8 months from now) to ensure we always have upcoming holidays
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 240);
        const endDateStr = endDate.toISOString().split('T')[0];

        const hebcalUrl = `https://www.hebcal.com/hebcal?v=1&cfg=json&geo=pos&latitude=${lat}&longitude=${lon}&start=${dateStr}&end=${endDateStr}&maj=on&min=on&mod=off&nx=on&mf=off&ss=off&s=on&i=on`;
        const zmanimUrl = `https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&date=${dateStr}`;

        // 2a. Fetch standard calendar data
        const [hebcalRes, zmanimRes] = await Promise.all([
            fetch(hebcalUrl),
            fetch(zmanimUrl)
        ]);

        if (!hebcalRes.ok || !zmanimRes.ok) throw new Error("Erro ao buscar dados do Hebcal");

        const hebcalData = await hebcalRes.json();
        const zmanimData = await zmanimRes.json();

        // PERSISTÊNCIA: Guardar os dados globalmente para uso no party()
        window.lastData = hebcalData;

        // 2b. Calculate afterSunset status & Shabbat Start Status (20 min before)
        let isAfterSunset = false;
        let isAfterShabbatStart = false; // Effectively "Is it Holiday Mode?" (20 min before sunset)

        if (zmanimData.times && zmanimData.times.sunset) {
            const sunsetTime = new Date(zmanimData.times.sunset);

            // Usa today em vez de new Date() solto para respeitar a simulação do Easter Egg
            if (today > sunsetTime) {
                isAfterSunset = true;
            }

            // Calculate "Shabbat/Holiday Start" threshold (Strict Sunset now)
            // This syncs with the countdown end time.
            const holidayStartTime = sunsetTime;
            if (today >= holidayStartTime) {
                isAfterShabbatStart = true;
            }
        }

        // 2c. Fetch accurate Hebrew Date (with sunset logic)
        // Note: Hebcal converter uses strict sunset or manual 'gs' param.
        // We probably want strict sunset for the DATE itself (e.g. 13 Nissan vs 14 Nissan),
        // but for SHOWING the holiday card, we want the "Early Start".
        // Let's keep strict sunset for the general date, but override for Holiday display.

        // SYNC FIX: Ensure Hebrew Date flips EXACTLY when the Holiday Logic flips (isAfterShabbatStart)
        const shouldUseNextDay = isAfterSunset || isAfterShabbatStart;
        const converterUrl = `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${today.getDate()}&g2h=1&strict=1${shouldUseNextDay ? '&gs=on' : ''}`;
        const converterRes = await fetch(converterUrl);
        const converterData = await converterRes.json();

        // Process and render data
        processHebcalData(hebcalData, converterData, isAfterSunset, zmanimData, isAfterShabbatStart);
        renderZmanim(zmanimData);

        // Show dashboard
        hideLoading();
        document.getElementById('error-view').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');

    } catch (e) {
        console.error("Data Error:", e);
        let friendlyMessage;
        if (e.message && e.message.includes('fetch')) {
            friendlyMessage = t("err.network");
        } else if (e.message && e.message.includes('Hebcal')) {
            friendlyMessage = t("err.service_unavailable");
        } else {
            friendlyMessage = t("err.generic_reload");
        }
        showError(friendlyMessage);
    }
}

function renderZmanim(data) {
    if (!data || !data.times) return;

    // Extract sunset time
    const sunsetISO = data.times.sunset;
    if (sunsetISO) {
        const sunsetDate = new Date(sunsetISO);
        const timeStr = sunsetDate.toLocaleTimeString(currentLang === 'pt' ? 'pt-PT' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        updateDOM('sunset-time', timeStr);


    }
}




// ========================================
// DATA PROCESSING
// ========================================

function processHebcalData(data, converterData, isAfterSunset, zmanimData, isAfterShabbatStart = false) {
    if (!data || !data.items) return;

    const items = data.items;

    // Calculate effective date (switch to tomorrow if after sunset OR after holiday start threshold)
    // We want the holiday to appear AS SOON as the countdown ends (20 min before sunset).
    // VIAGEM NO TEMPO: Se houver uma data simulada, o relógio interno obedece
    const now = window.simulatedDate ? new Date(window.simulatedDate + "T12:00:00") : new Date();
    const effectiveDate = new Date(now);

    // Use the broader "Holiday Start" definition for fetching today's events
    if (isAfterShabbatStart || isAfterSunset) {
        effectiveDate.setDate(effectiveDate.getDate() + 1);
    }
    const effectiveDateStr = effectiveDate.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0]; // Keep true today for comparisons if needed

    // 1. Find and display Parashah (Next upcoming or today's)
    // Handle Double Parashot (e.g. Matot-Masei) - they share the same DATE.
    // Use 'parashat' as category (Hebcal standard)
    const nextParashahItem = items.find(i => i.category === 'parashat' && i.date >= effectiveDateStr);

    if (nextParashahItem) {
        // Find ALL parashot on this date (in case of double portion)
        const parashotOnDate = items.filter(i => i.category === 'parashat' && i.date === nextParashahItem.date);

        // A. Combine Names
        const combinedName = parashotOnDate
            .map(p => p.title.replace('Parashat ', ''))
            .join(t("msg.sep_torah"));


        updateDOM('parashah-name', combinedName);

        const formatReadingList = (parts) => {
            if (!parts || parts.length === 0) return "";
            if (parts.length === 1) return parts[0];

            const getBook = (s) => {
                const match = s.match(/^(.+?)\s+\d+:/);
                return match ? match[1].trim() : s.split(/\d/)[0].trim();
            };

            const firstBook = getBook(parts[0]);
            let allSameBook = true;
            for (let i = 1; i < parts.length; i++) {
                if (getBook(parts[i]) !== firstBook) {
                    allSameBook = false;
                    break;
                }
            }

            if (allSameBook) {
                const firstPart = parts[0];
                const lastPart = parts[parts.length - 1];
                const start = firstPart.includes('-') ? firstPart.split('-')[0].trim() : firstPart;
                const end = lastPart.includes('-') ? lastPart.split('-').pop().trim() : lastPart.replace(firstBook, '').trim();
                return `${start}-${end}`;
            }
            return parts[0];
        };

        // B. Combine Torah Readings
        const rawTorah = parashotOnDate
            .map(p => p.leyning && p.leyning.torah ? transliterateText(p.leyning.torah) : "")
            .filter(t => t)
            .flatMap(t => t.split(';'))
            .map(t => t.split('|')[0].trim())
            .filter(t => t && !["Esther", "Rut", "Eicha", "Kohelet", "Shir HaShirim", "Tehillim", "Mishlei", "Iyov", "Daniel", "Ezra", "Nechemyah", "Divrei HaYamim"].some(book => t.startsWith(book)));

        const finalTorahDisplay = formatReadingList(rawTorah);
        updateDOM('torah-reading', finalTorahDisplay || t("status.check_sefer"));

        // C. Combine Haftarah Readings
        const rawHaftarah = parashotOnDate
            .map(p => p.leyning && p.leyning.haftarah ? transliterateText(p.leyning.haftarah) : "")
            .filter(h => h)
            .flatMap(h => h.split(';'))
            .map(h => h.split('|')[0].trim())
            .filter(h => h);

        const finalHaftarahDisplay = formatReadingList(rawHaftarah);
        updateDOM('haftara-reading', finalHaftarahDisplay || t("status.check_sefer"));

        // D. Combine Ketuvim Readings (Megillot)
        const rawKetuvim = parashotOnDate
            .map(p => p.leyning && p.leyning.megillah ? transliterateText(p.leyning.megillah) : "")
            .filter(k => k)
            .flatMap(k => k.split(';'))
            .map(k => k.split('|')[0].trim())
            .filter(k => k && ["Ester", "Rut", "Eicha", "Kohelet", "Shir HaShirim", "Tehillim", "Mishlei", "Iyov", "Daniel", "Ezra", "Nechemyah", "Divrei HaYamim"].some(book => k.startsWith(book) || k.startsWith("I " + book) || k.startsWith("II " + book)));

        const finalKetuvimDisplay = formatReadingList(rawKetuvim);

        let displayKetuvim = finalKetuvimDisplay;
        if (!displayKetuvim) {
            // Ciclo Anual de Ketuvim para semanas normais
            const ketuvimCycle = [
                // Tehillim (15 partes)
                "Tehillim 1-17",
                "Tehillim 18-34",
                "Tehillim 35-51",
                "Tehillim 52-68",
                "Tehillim 69-85",
                "Tehillim 86-102",
                "Tehillim 103-119",
                "Tehillim 120-135",
                "Tehillim 136-150",

                // Mishlei (6 partes)
                "Mishlei 1-5",
                "Mishlei 6-10",
                "Mishlei 11-15",
                "Mishlei 16-20",
                "Mishlei 21-25",
                "Mishlei 26-31",

                // Iyov (6 partes)
                "Iyov 1-7",
                "Iyov 8-14",
                "Iyov 15-21",
                "Iyov 22-28",
                "Iyov 29-35",
                "Iyov 36-42",

                // Cinco Megillot
                "Shir HaShirim 1-4",
                "Shir HaShirim 5-8",
                "Rut 1-2",
                "Rut 3-4",
                "Eicha 1-3",
                "Eicha 4-5",
                "Kohelet 1-6",
                "Kohelet 7-12",
                "Esther 1-5",
                "Esther 6-10",

                // Daniel (4 partes)
                "Daniel 1-3",
                "Daniel 4-6",
                "Daniel 7-9",
                "Daniel 10-12",

                // Ezra (2 partes)
                "Ezra 1-5",
                "Ezra 6-10",

                // Nechemyah (2 partes)
                "Nechemyah 1-6",
                "Nechemyah 7-13",

                // Divrei HaYamim I (3 partes)
                "I Divrei HaYamim 1-9",
                "I Divrei HaYamim 10-18",
                "I Divrei HaYamim 19-29",

                // Divrei HaYamim II (4 partes)
                "II Divrei HaYamim 1-12",
                "II Divrei HaYamim 13-24",
                "II Divrei HaYamim 25-34",
                "II Divrei HaYamim 35-36"
            ];

            // Usar o nome da Parashá para gerar um índice único e consistente
            if (parashotOnDate.length > 0) {
                const combinedName = parashotOnDate.map(p => p.title.replace('Parashat ', '')).join("");
                // Simple hash function para o nome da Parashá
                let hash = 0;
                for (let i = 0; i < combinedName.length; i++) {
                    hash = combinedName.charCodeAt(i) + ((hash << 5) - hash);
                }
                const index = Math.abs(hash) % ketuvimCycle.length;
                displayKetuvim = ketuvimCycle[index];
            } else {
                displayKetuvim = t("status.check_sefer");
            }
        }

        updateDOM('ketuvim-reading', displayKetuvim);

        const ketuvimCard = document.querySelector('.ketuvim-card');
        if (ketuvimCard) ketuvimCard.classList.remove('hidden');

    }

    // 2. Find and display candle lighting time OR Holy Day Status (Shabbat/Yom Tov)
    // Logic: 
    // - If sacred time (Shabbat/Yom Tov) is active: Show greeting (Shabbat Shalom / Chag Sameach).
    // - Otherwise: Show countdown to next sacred event (candles).

    // Determine if we are in a Sacred Period (Yom Tov or Shabbat)
    // Sacred Time starts at sunset of Erev and ends at sunset of the last day.

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const yomTovToday = items.find(i => i.date === todayStr && i.category === 'holiday' && i.yomtov);
    const yomTovTomorrow = items.find(i => i.date === tomorrowStr && i.category === 'holiday' && i.yomtov);

    let isSacredTime = false;
    let greeting = t("msg.shabbat_shalom"); // Default

    if (zmanimData && zmanimData.times.sunset) {
        const sunsetTime = new Date(zmanimData.times.sunset);
        const dayOfWeek = now.getDay();

        // A. SHABBAT CHECK
        if (dayOfWeek === 5 && now >= sunsetTime) {
            isSacredTime = true;
        } else if (dayOfWeek === 6 && now < sunsetTime) {
            isSacredTime = true;
        }

        // B. YOM TOV CHECK (Feriados que exigem repouso)
        // Se amanhã é feriado e já passou o pôr-do-sol -> Começou a Véspera (Erev)
        if (yomTovTomorrow && now >= sunsetTime) {
            isSacredTime = true;
            greeting = t("msg.chag_sameach");
        }
        // Se hoje é feriado e ainda não passou o pôr-do-sol -> Ainda estamos na festa
        if (yomTovToday && now < sunsetTime) {
            isSacredTime = true;
            greeting = t("msg.chag_sameach");
        }
    }

    // Final Status Check & Render
    if (isSacredTime) {
        updateDOM('countdown', greeting);
        updateDOM('label.shabbat_in', yomTovToday ? translateHoliday(yomTovToday.title) : t("msg.shabbat"));
        if (countdownInterval) clearInterval(countdownInterval);
    } else {
        // Not in sacred time, find NEXT candle lighting
        const nextCandles = items.find(i => i.category === 'candles' && i.date >= effectiveDateStr);
        if (nextCandles) {
            let targetDate = new Date(nextCandles.date);
            const candleDay = targetDate.toISOString().split('T')[0];

            // SYNC FIX: If candles are today, use strict sunset
            if (candleDay === todayStr && zmanimData && zmanimData.times.sunset) {
                targetDate = new Date(zmanimData.times.sunset);
            }

            startCountdown(targetDate);
            updateDOM('label.shabbat_in', t("label.shabbat_in"));
        }
    }

    // 3. Display Hebrew date (from Converter API)
    if (converterData) {
        // Usa a data do conversor para garantir sincronia na simulação
        const transliteratedDate = `${converterData.hd} ${converterData.hm}`;
        updateDOM('hebrew-date', transliteratedDate);
    }

    // 4. Find and display upcoming holidays with Strict Priority
    // Priority: Major (Torah) > Rosh Chodesh > Minor (Tradition)

    // 4a. Filter all relevant events
    const allEvents = items.filter(i =>
        (i.category === 'holiday' || i.category === 'roshchodesh') &&
        i.date >= effectiveDateStr &&
        !i.title.toLowerCase().includes('shabbat')
    );

    // 4b. Group by Date and Pick Best
    const bestEventsMap = new Map();

    allEvents.forEach(event => {
        const date = event.date;
        const currentBest = bestEventsMap.get(date);

        if (!currentBest) {
            bestEventsMap.set(date, event);
        } else {
            // Compare priorities
            const pCurrent = getHolidayPriority(currentBest);
            const pNew = getHolidayPriority(event);

            if (pNew > pCurrent) {
                bestEventsMap.set(date, event);
            }
        }
    });

    // 4c. Convert back to array and sort by date
    const sortedHolidays = Array.from(bestEventsMap.values())
        .sort((a, b) => a.date.localeCompare(b.date));

    // 4.1 Check for Current Holiday (using effective date)
    const currentHoliday = sortedHolidays.find(i => i.date === effectiveDateStr);
    if (currentHoliday) {
        updateDOM('current-holiday-name', translateHoliday(currentHoliday.title));

        let art = "";
        let easterEggIcon = "";
        let easterEggMsg = "";

        const title = currentHoliday.title.toLowerCase();

        if (title.includes('pessach') || title.includes('matzot')) {
            art = "Chag HaMatzot";
            easterEggIcon = "fa-bread-slice";
            easterEggMsg = "Sem Fermento, Tudo Limpo!";
        } else if (title.includes('shavuot')) {
            art = "Chag Shavuot";
            easterEggIcon = "fa-leaf";
            easterEggMsg = "Monte Florido!";
        } else if (title.includes('rosh hashanah') || title.includes('yom teruah') || title.includes('teruah')) {
            art = "Shana Tova";
            easterEggIcon = "fa-apple-alt";
            easterEggMsg = "Doce como Mel!";
        } else if (title.includes('yom kippur') || title.includes('kippur')) {
            art = "Gmar Chatima Tova";
            easterEggIcon = "fa-balance-scale";
            easterEggMsg = "Livro da Vida Selado";
        } else if (title.includes('sukkot')) {
            art = "Chag Sukkot";
            easterEggIcon = "fa-campground";
            easterEggMsg = "Hora de ir para a Cabana!";
        } else if (title.includes('shemini atzeret') || title.includes('simchat torah')) {
            art = "Chag Sameach";
            easterEggIcon = "fa-scroll";
            easterEggMsg = "Rodas Livres e Torá Nova!";
        }

        const holidayCard = document.getElementById('current-holiday-name');
        const holidayDesc = document.getElementById('current-holiday-desc');
        const holidayIcon = document.querySelector('.current-holiday-card .card-icon i');

        if (art) {
            if (holidayCard) {
                holidayCard.innerHTML = `<span>${art}</span>`;
                if (holidayDesc && easterEggMsg) {
                    holidayDesc.innerHTML = `<strong>${easterEggMsg}</strong>`;
                }
                if (holidayIcon && easterEggIcon) {
                    holidayIcon.className = `fas ${easterEggIcon}`;
                    holidayIcon.style.transform = "scale(1.3)";
                    holidayIcon.style.transition = "transform 0.5s";
                }
            }
        } else {
            // Caso seja um feriado mas SEM Easter Egg (ex: Purim) -> Reset visual
            if (holidayDesc) {
                holidayDesc.innerHTML = `<span data-i18n="desc.current_holiday">${t("desc.current_holiday") || "Momento Litúrgico"}</span>`;
                holidayDesc.style.color = "";
            }
            if (holidayIcon) {
                holidayIcon.className = "fas fa-glass-cheers";
                holidayIcon.style.cssText = "";
            }
        }

    } else {
        updateDOM('current-holiday-name', t("msg.no_holiday_today"));

        // Reset manual na ausência total de festa
        const holidayDesc = document.getElementById('current-holiday-desc');
        const holidayIcon = document.querySelector('.current-holiday-card .card-icon i');

        if (holidayDesc) {
            holidayDesc.innerHTML = `<span data-i18n="desc.current_holiday">${t("desc.current_holiday") || "Momento Litúrgico"}</span>`;
            holidayDesc.style.color = "";
        }
        if (holidayIcon) {
            holidayIcon.className = "fas fa-glass-cheers";
            holidayIcon.style.cssText = "";
        }
    }

    // Comandos de Teste F12 (Global Functions)
    window.party = function (holidayName) {
        if (!holidayName) {
            window.simulatedDate = null;
            console.log("Simulação terminada. Regresso ao dia real.");
            const savedCoords = localStorage.getItem('userCoords');
            if (savedCoords) {
                try {
                    const { lat, lon } = JSON.parse(savedCoords);
                    fetchData(lat, lon);
                } catch (e) {
                    fetchData(31.7683, 35.2137);
                }
            } else {
                fetchData(31.7683, 35.2137);
            }
            return;
        }

        if (typeof holidayName !== 'string') {
            console.log("Argumento inválido. Escreve o nome da festa, p. ex: party('sukkot')");
            return;
        }

        if (!window.lastData || !window.lastData.items) {
            console.log("Calendário inativo. Aguarda o carregamento.");
            return;
        }

        let titleQuery = holidayName.toLowerCase();

        const matchingHoliday = window.lastData.items.find(i =>
            i.category === 'holiday' && i.title.toLowerCase().includes(titleQuery)
        );

        console.log(`A simular temporalmente: ${matchingHoliday.title} (${matchingHoliday.date})...`);
        window.simulatedDate = matchingHoliday.date;

        const savedCoords = localStorage.getItem('userCoords');
        if (savedCoords) {
            try {
                const { lat, lon } = JSON.parse(savedCoords);
                fetchData(lat, lon);
            } catch (e) {
                fetchData(31.7683, 35.2137);
            }
        } else {
            fetchData(31.7683, 35.2137);
        }
    };

    // 4.2 Find Next Holiday (distinct from current)
    const holidays = sortedHolidays.filter(i => i.date > effectiveDateStr).slice(0, 1);

    if (holidays.length > 0) {
        const nextH = holidays[0];
        updateDOM('next-holiday-name', translateHoliday(nextH.title));

        // Calculate Target Time (Start of the Holiday)
        // Default: Sunset (approx 18:00) of the *previous* day (Erev)
        const parts = nextH.date.split('-'); // ["YYYY", "MM", "DD"]
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);

        // Erev is day - 1, set to 18:00 local time -> Adjust to strict 18:00 or Sunset if available
        let targetTime = new Date(year, month, day - 1, 18, 0, 0);

        // Try to find official candle lighting on Erev
        // Hebcal candle events usually use ISO string with time
        // We construct the Erev date string YYYY-MM-DD to match
        const erevCheck = new Date(year, month, day - 1);
        const erevStr = erevCheck.toISOString().split('T')[0];

        const candleEvent = items.find(i => i.category === 'candles' && i.date.startsWith(erevStr));

        if (candleEvent) {
            targetTime = new Date(candleEvent.date);
            // Standard candles logic (no extra offset)

            // SYNC FIX: If target is TODAY, use strict Sunset to avoid gap
            const tDay = targetTime.toISOString().split('T')[0];
            // We need 'now' which is available in processHebcalData scope? No, need to re-get or assume today from context
            // Actually 'date' passed to fetching zmanimData was 'today'.
            // So if tDay === todayStr...
            // We can pass zmanimData to here if we refactor, but better: 
            // Logic is inside processHebcalData, so we have access to zmanimData!

            const todayStr = window.simulatedDate ? window.simulatedDate : new Date().toISOString().split('T')[0];
            if (tDay === todayStr && zmanimData && zmanimData.times.sunset) {
                targetTime = new Date(zmanimData.times.sunset);
            }
        }

        // REGRA DOS 98 DIAS E REGRA DOS 15 MINUTOS (Pós-Início/Fim): 
        let shouldHideNextCountdown = false;

        // 1. Regra dos 98 dias: Se a festa estiver muito longe, não mostramos o contador numérico
        const diffMs = targetTime - now;
        const daysToNext = diffMs / (1000 * 60 * 60 * 24);
        if (daysToNext > 98) {
            shouldHideNextCountdown = true;
        }

        if (zmanimData && zmanimData.times.sunset) {
            const sunsetTime = new Date(zmanimData.times.sunset);

            // 2. Regra dos 15 min (Pós-Início): Festa/Shabbat começou agora (estamos no Sacred Time)
            if (isSacredTime) {
                const minutesSinceStart = (now - sunsetTime) / (1000 * 60);
                if (minutesSinceStart >= 0 && minutesSinceStart <= 15) {
                    shouldHideNextCountdown = true;
                }
            }

            // 3. Regra dos 15 min (Pós-Fim): Festa/Shabbat acabou de terminar (estamos fora do Sacred Time)
            if (!isSacredTime) {
                const minutesSinceEnd = (now - sunsetTime) / (1000 * 60);
                if (minutesSinceEnd >= 0 && minutesSinceEnd <= 15) {
                    // Verificamos se hoje era um dia sagrado que terminou no pôr-do-sol
                    const dayOfWeek = now.getDay();
                    if (dayOfWeek === 6 || yomTovToday) {
                        shouldHideNextCountdown = true;
                    }
                }
            }
        }

        if (shouldHideNextCountdown) {
            updateDOM('next-holiday-date', t("desc.next_holiday")); // "Próxima Ocorrência"
            if (nextHolidayInterval) clearInterval(nextHolidayInterval);
        } else {
            startNextHolidayCountdown(targetTime);
        }

    } else {
        updateDOM('next-holiday-name', t("msg.no_holidays"));
        if (nextHolidayInterval) clearInterval(nextHolidayInterval);
        updateDOM('next-holiday-date', t("msg.check_calendar"));
    }
}

// Helper: Determine priority of a holiday event
function getHolidayPriority(item) {
    // 1. Major Holidays (Torah) - Highest Priority
    if (item.subcat === 'major') return 3;

    // 2. Rosh Chodesh - Medium Priority
    if (item.category === 'roshchodesh') return 2;

    // 3. Minor Holidays (Hannukah, Purim) - Lowest Priority
    // (item.subcat === 'minor' or undefined)
    return 1;
}


// ========================================
// COUNTDOWN TIMER
// ========================================

function startCountdown(targetDate) {
    const el = document.getElementById('countdown');
    if (!el) return;

    // Clear existing interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    function tick() {
        // Respeita a simulação
        const now = window.simulatedDate ? new Date(window.simulatedDate + "T12:00:00") : new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            el.textContent = t("msg.shabbat_shalom");
            clearInterval(countdownInterval);

            // Force refresh to update status if we just crossed into Shabbat
            console.log("Shabbat started! Refreshing...");
            setTimeout(() => location.reload(), 1000); // Small buffer then reload
            return;
        }

        el.textContent = formatCountdownDuration(diff, false);
    }

    tick();
    countdownInterval = setInterval(tick, 1000);
}

function startNextHolidayCountdown(targetDate) {
    const el = document.getElementById('next-holiday-date');
    if (!el) return;

    if (nextHolidayInterval) clearInterval(nextHolidayInterval);

    function tick() {
        // Respeita a simulação
        const now = window.simulatedDate ? new Date(window.simulatedDate + "T12:00:00") : new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            clearInterval(nextHolidayInterval);
            // Auto refresh - Holiday Started
            console.log("Holiday started! Refreshing...");

            const savedCoords = localStorage.getItem('userCoords');
            if (savedCoords) {
                try {
                    const { lat, lon } = JSON.parse(savedCoords);
                    fetchData(lat, lon);
                } catch (e) {
                    location.reload();
                }
            } else {
                location.reload();
            }
            return;
        }

        el.textContent = formatCountdownDuration(diff, true);
    }

    tick();
    nextHolidayInterval = setInterval(tick, 1000);
}

/**
 * Formats a duration (ms) into DD:HH:MM (if > 24h) or HH:MM:SS (if < 24h)
 * @param {number} diff - Time difference in milliseconds
 * @param {boolean} usePrefix - Whether to prepend "Falta"/"Faltam"
 * @returns {string} Formatted time string
 */
function formatCountdownDuration(diff, usePrefix = true) {
    // Regra Geral: Se faltar menos de 15 minutos (900.000 ms), mostrar "Em breve"
    if (diff > 0 && diff <= 15 * 60 * 1000) {
        return t("msg.coming_soon");
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const prefix = usePrefix ? ((days > 1 || (days === 0 && hours !== 1)) ? t("msg.countdown_prefix_plural") : t("msg.countdown_prefix")) : "";

    // Logic: DD:HH:MM if > 24h, HH:MM:SS if < 24h
    if (days > 0) {
        return `${prefix}${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } else {
        return `${prefix}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

// ========================================
// UI HELPERS
// ========================================

function updateDOM(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('error-view').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showError(msg) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('error-view').classList.remove('hidden');
    updateDOM('error-msg', msg);
}

function transliterateText(text) {
    if (!text) return text;
    let newText = text;
    const mapping = getBookMapping();

    // Replace longest matches first to avoid partial replacements
    Object.keys(mapping).sort((a, b) => b.length - a.length).forEach(eng => {
        const regex = new RegExp(`\\b${eng}\\b`, 'g'); // Match whole words
        newText = newText.replace(regex, mapping[eng]);
    });

    return newText;
}

function getBookMapping() {
    return {
        // Torah (Pentateuch)
        "Genesis": "Bereshit",
        "Exodus": "Shemot",
        "Leviticus": "Vayikra",
        "Numbers": "Bamidbar",
        "Deuteronomy": "Devarim",

        // Prophets (Nevi'im) - Early
        "Joshua": "Yehoshua",
        "Judges": "Shoftim",
        "I Samuel": "I Shmuel",
        "II Samuel": "II Shmuel",
        "1 Samuel": "I Shmuel",
        "2 Samuel": "II Shmuel",
        "I Kings": "I Melachim",
        "II Kings": "II Melachim",
        "1 Kings": "I Melachim",
        "2 Kings": "II Melachim",

        // Prophets (Nevi'im) - Later
        "Isaiah": "Yeshayahu",
        "Jeremiah": "Yirmiyahu",
        "Ezekiel": "Yechezkel",

        // Twelve Minor Prophets (Trei Asar)
        "Hosea": "Hoshea",
        "Joel": "Yoel",
        "Amos": "Amos",
        "Obadiah": "Ovadyah",
        "Jonah": "Yonah",
        "Micah": "Michah",
        "Nahum": "Nachum",
        "Habakkuk": "Chavakuk",
        "Zephaniah": "Tzefaniah",
        "Haggai": "Chaggai",
        "Zechariah": "Zechariah",
        "Malachi": "Malachi",

        // Writings (Ketuvim)
        "Psalms": "Tehillim",
        "Proverbs": "Mishlei",
        "Job": "Iyov",
        "Song of Songs": "Shir HaShirim",
        "Ruth": "Rut",
        "Lamentations": "Eicha",
        "Ecclesiastes": "Kohelet",
        "Esther": "Ester",
        "Daniel": "Daniel",
        "Ezra": "Ezra",
        "Nehemiah": "Nechemyah",
        "I Chronicles": "I Divrei HaYamim",
        "II Chronicles": "II Divrei HaYamim",
        "1 Chronicles": "I Divrei HaYamim",
        "2 Chronicles": "II Divrei HaYamim"
    };
}

function translateHoliday(text) {
    if (!text) return text;

    // Direct replacements for major terms
    const mapping = {
        "Rosh Hashana": "Rosh Hashaná",
        "Yom Kippur": "Yom Kippur",
        "Sukkot": "Sukkot",
        "Shmini Atzeret": "Shemini Atzeret",
        "Simchat Torah": "Simchat Torá",
        "Chanukah": "Hanukkah",
        "Tu BiShvat": "Tu B'Shevat",
        "Purim": "Purim",
        "Pesach": "Pessach",
        "Shavuot": "Shavuot",
        "Tish'a B'Av": "Tish'á BeAv",
        "Rosh Chodesh": "Rosh Chodesh", // Usually kept or "Lua Nova"
        "Erev": "Véspera de",
        "Havdalah": "Havdalá",
        "Candle lighting": "Acendimento das Velas",
        "Lag BaOmer": "Lag Baômer",
        "Yom HaShoah": "Dia do Holocausto",
        "Yom HaZikaron": "Dia da Memória",
        "Yom HaAtzma'ut": "Dia da Independência",
        "Jerusalem Day": "Dia de Jerusalém",
        "Shabbat": "Repouso",
        "Shabbat Shalom": "Chag Sameach"
    };

    let newText = text;
    Object.keys(mapping).forEach(eng => {
        // Simple replace - can be enhanced with regex if needed for strict boundaries
        // Using replaceAll to cover everything
        newText = newText.split(eng).join(mapping[eng]);
    });

    return newText;
}

// ========================================
// UTILS
// ========================================

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:1rem 2rem;border-radius:1rem;font-size:1rem;z-index:9999;animation:slideUp 0.5s;box-shadow:0 10px 40px rgba(99,102,241,0.5);max-width:90%;text-align:center;';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// Inject CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(50px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(styleSheet);


