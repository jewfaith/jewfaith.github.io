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
    const fullText = shareUrl;

    // Always copy to clipboard
    copyToClipboard(fullText);

    // Try native share (mobile) if available, but don't rely on it for copy
    if (navigator.share) {
        navigator.share({
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
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const dateStr = today.toISOString().split('T')[0];

        // Calculate end date (6 months from now) to ensure we always have upcoming holidays
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 180);
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

        // 2b. Calculate afterSunset status & Shabbat Start Status (20 min before)
        let isAfterSunset = false;
        let isAfterShabbatStart = false; // Effectively "Is it Holiday Mode?" (20 min before sunset)

        if (zmanimData.times && zmanimData.times.sunset) {
            const sunsetTime = new Date(zmanimData.times.sunset);

            if (new Date() > sunsetTime) {
                isAfterSunset = true;
            }

            // Calculate "Shabbat/Holiday Start" threshold (Strict Sunset now)
            // This syncs with the countdown end time.
            const holidayStartTime = sunsetTime;
            if (new Date() >= holidayStartTime) {
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
    const now = new Date();
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

        // B. Combine Torah Readings (Continuous Range)
        const readings = parashotOnDate
            .map(p => p.leyning && p.leyning.torah ? transliterateText(p.leyning.torah) : "")
            .filter(t => t);

        let finalTorahDisplay = "";
        if (readings.length > 0) {
            if (readings.length === 1) {
                finalTorahDisplay = readings[0];
            } else {
                // Extract Start from First and End from Last
                const first = readings[0];
                const last = readings[readings.length - 1];

                // Get everything before the first hyphen (or space)
                const startPart = first.includes('-') ? first.split('-')[0].trim() : first;
                // Get everything after the last hyphen
                const endPart = last.includes('-') ? last.split('-').pop().trim() : last;

                finalTorahDisplay = `${startPart}${t("msg.sep_torah")}${endPart}`;
            }
        }


        updateDOM('torah-reading', finalTorahDisplay || t("status.check_sefer"));

        // C. Combine Haftarah Readings
        const haftarot = parashotOnDate
            .map(p => p.leyning && p.leyning.haftarah ? transliterateText(p.leyning.haftarah) : "")
            .filter(h => h);

        // Join multiple haftarot with separator
        const uniqueHaftarot = [...new Set(haftarot)].join(t("msg.sep_haftarah"));


        updateDOM('haftara-reading', uniqueHaftarot || t("status.check_sefer"));
    }

    // 2. Find and display candle lighting time OR Shabbat Status
    // Logic: 
    // - If Friday after sunset: It is Shabbat.
    // - If Saturday before Havdalah: It is Shabbat.
    // - Otherwise: Show countdown to next candles.

    const candles = items.find(i => i.category === 'candles' && i.date >= effectiveDateStr);
    const havdalah = items.find(i => i.category === 'havdalah' && i.date >= todayStr);

    let isShabbatNow = false;
    const dayOfWeek = now.getDay(); // 5 = Friday, 6 = Saturday

    // Check Friday Night (Start at Sunset)
    if (dayOfWeek === 5 && zmanimData && zmanimData.times.sunset) {
        const sunsetTime = new Date(zmanimData.times.sunset);
        const startTime = sunsetTime; // Strict Sunset

        if (now >= startTime) {
            isShabbatNow = true;
        }
    }
    // Check Saturday (Until Sunset)
    else if (dayOfWeek === 6 && zmanimData && zmanimData.times.sunset) {
        // User Request: Shabbat Shalom disappears at Saturday Sunset
        const sunsetTime = new Date(zmanimData.times.sunset);
        const cutoffTime = sunsetTime; // Strict Sunset

        if (now < cutoffTime) {
            isShabbatNow = true;
        }
    }

    if (isShabbatNow) {
        updateDOM('countdown', t("msg.shabbat_shalom"));
        updateDOM('label.shabbat_in', havdalah ? t("label.havdalah") : t("msg.shabbat")); // Optional: Show "Havdalah" label?
        // Clear countdown if running
        if (countdownInterval) clearInterval(countdownInterval);

    } else if (candles) {
        // Not Shabbat, show countdown
        let targetDate = new Date(candles.date);

        // SYNC FIX: If the candle event is TODAY, use strict Sunset time to match the Transition Trigger
        // This avoids the 18-minute gap (Countdown ends at 18:42, but Shabbat starts at 19:00)
        const candleDay = targetDate.toISOString().split('T')[0];
        const todayStr = now.toISOString().split('T')[0];

        if (candleDay === todayStr && zmanimData && zmanimData.times.sunset) {
            targetDate = new Date(zmanimData.times.sunset);
        }

        startCountdown(targetDate);
        updateDOM('label.shabbat_in', t("label.shabbat_in"));
    }

    // 3. Display Hebrew date (from Converter API)
    if (converterData) {
        const transliteratedDate = `${converterData.hd} ${converterData.hm} ${converterData.hy}`;
        updateDOM('hebrew-date', transliteratedDate);
    }

    // 4. Find and display upcoming holidays with Strict Priority
    // Priority: Major (Torah) > Rosh Chodesh > Minor (Tradition)

    // 4a. Filter all relevant events
    const allEvents = items.filter(i =>
        (i.category === 'holiday' || i.category === 'roshchodesh') &&
        i.date >= effectiveDateStr
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




        // Toggle Holiday Mode (Major Holidays only)
        document.body.className = ''; // Reset classes
        document.body.classList.add('cosmic-bg-enabled'); // Keep base background if needed or handle via CSS

        if (currentHoliday) {
            const hDate = currentHoliday.date; // YYYY-MM-DD
            // We need Hebrew Date to be precise, but Hebcal event name/subcat is easier
            // Mapping User Request to Hebcal Names/Dates roughly if possible, or using partial string match on title
            const title = currentHoliday.title.toLowerCase();

            // 1. Matzot (Passover) - 15 & 21 Nissan
            // Hebcal: "Pesach I", "Pesach VII"
            if (title.includes('pesach') || title.includes('matzot')) {
                document.body.classList.add('theme-matzot');
            }
            // 2. Shavuot - 6 Sivan
            else if (title.includes('shavuot')) {
                document.body.classList.add('theme-shavuot');
            }
            // 3. Teruah (Rosh Hashana) - 1 Tishrei
            else if (title.includes('rosh hashanah') || title.includes('teruah')) {
                document.body.classList.add('theme-teruah');
            }
            // 4. Kippur (Yom Kippur) - 10 Tishrei
            else if (title.includes('yom kippur')) {
                document.body.classList.add('theme-kippur');
            }
            // 5. Sukkot - 15 Tishrei
            else if (title.includes('sukkot')) {
                document.body.classList.add('theme-sukkot');
            }
            // 6. Atzeret (Shemini Atzeret/Simchat Torah) - 22 Tishrei
            else if (title.includes('shemini atzeret') || title.includes('simchat torah')) {
                document.body.classList.add('theme-atzeret');
            }
            // Fallback for other majors
            else if (currentHoliday.subcat === 'major') {
                document.body.classList.add('holiday-mode');
            }
        }

    } else {
        updateDOM('current-holiday-name', t("msg.no_holiday_today"));
        document.body.classList.remove('holiday-mode');


    }

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

            const todayStr = new Date().toISOString().split('T')[0];
            if (tDay === todayStr && zmanimData && zmanimData.times.sunset) {
                targetTime = new Date(zmanimData.times.sunset);
            }
        }

        startNextHolidayCountdown(targetTime);

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
        const now = new Date();
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
        const now = new Date();
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
        "Yom Kippur": "Yom Kipur",
        "Sukkot": "Sucot",
        "Shmini Atzeret": "Shemini Atzeret",
        "Simchat Torah": "Simchat Torá",
        "Chanukah": "Hanucá",
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
        "Jerusalem Day": "Dia de Jerusalém"
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


