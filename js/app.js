// ========================================
// OR HAZMAN - JEWISH CALENDAR DASHBOARD
// ========================================

document.addEventListener('DOMContentLoaded', initApp);

// Global state
let countdownInterval = null;
let lastHebcalData = null;
let lastZmanimData = null;
let lastCityName = "";
let lastDistrictName = "";
let lastCountry = "";
let lastIsManual = false;

// Expose refresh function for i18n
window.refreshApp = function () {
    if (lastHebcalData) processHebcalData(lastHebcalData);
    if (lastZmanimData) renderZmanim(lastZmanimData);
    updateDOM('location-type', lastIsManual ? t("status.location_selected") : t("status.location_gps"));

    // Refresh location card text if needed
    if (lastCityName) {
        updateDOM('location-city', lastCityName);
        updateDOM('location-district', lastDistrictName || lastCountry);
    }
};

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

// Share the app with message + URL
function shareApp() {
    const shareMessage = "✡️ Or HaZman - Calendário Judaico Completo! Horários de Shabat, Festas e mais. Confira: ";
    const shareUrl = window.location.href;
    const fullText = shareMessage + shareUrl;

    // Try native share first (mobile)
    if (navigator.share) {
        navigator.share({
            title: 'Or HaZman - Luz do Tempo',
            text: '✡️ Calendário Judaico Completo! Horários de Shabat, Festas e mais.',
            url: shareUrl
        }).catch(() => copyToClipboard(fullText));
    } else {
        copyToClipboard(fullText);
    }
}

function copyToClipboard(text) {
    const shareBtn = document.getElementById('share-btn');
    const icon = shareBtn.querySelector('i');
    const originalClass = icon.className;

    navigator.clipboard.writeText(text).then(() => {
        icon.className = 'fas fa-check';
        showToast('📋 Mensagem copiada! Cole para compartilhar.');
        setTimeout(() => {
            icon.className = originalClass;
        }, 2000);
    }).catch(() => {
        showToast('📋 Mensagem copiada!');
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
            const label = card.querySelector('.card-label').textContent;
            const value = card.querySelector('.card-value').textContent;

            // Construct text to copy
            const textToCopy = `${label}: ${value}`;

            // Copy logic
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Visual feedback
                const icon = btn.querySelector('i');
                const originalClass = icon.className;

                icon.className = 'fas fa-check';
                btn.style.background = 'var(--gold)';
                btn.style.color = 'var(--cosmic-darker)';

                showToast(`📋 ${label} copiado!`);

                setTimeout(() => {
                    icon.className = originalClass;
                    btn.style.background = '';
                    btn.style.color = '';
                }, 2000);
            }).catch(() => {
                showToast('❌ Erro ao copiar');
            });
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
        showError('🌍 GPS não disponível neste navegador');
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
                await fetchData(lat, lon, false);

                // Show success feedback
                icon.className = 'fas fa-circle-check';
                setTimeout(() => {
                    icon.className = originalClass;
                }, 1500);

            } catch (e) {
                console.error('Geocode error:', e);
                searchInput.value = 'Localização Atual';
                await fetchData(lat, lon, false);
                icon.className = originalClass;
            }

            gpsBtn.disabled = false;
        },
        (err) => {
            console.error('GPS Error:', err);
            let message;
            switch (err.code) {
                case err.PERMISSION_DENIED:
                    message = '📍 Permissão de localização negada. Por favor, permita o acesso.';
                    break;
                case err.POSITION_UNAVAILABLE:
                    message = '📍 Localização indisponível no momento.';
                    break;
                case err.TIMEOUT:
                    message = '⏱️ Tempo esgotado ao buscar localização.';
                    break;
                default:
                    message = '📍 Não foi possível obter sua localização.';
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
        showError(currentLang === 'pt'
            ? '🔍 Digite o nome de uma cidade para começar!'
            : '🔍 Type a city name to get started!');
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
            await fetchData(lat, lon, true);
        } else {
            throw new Error('NOT_FOUND');
        }
    } catch (e) {
        let friendlyMessage;
        if (e.message === 'NOT_FOUND') {
            friendlyMessage = currentLang === 'pt'
                ? '🌍 Não encontramos essa cidade. Tente outro nome!'
                : '🌍 We couldn\'t find that city. Try another name!';
        } else if (e.message === 'NETWORK' || e.message.includes('fetch')) {
            friendlyMessage = currentLang === 'pt'
                ? '📡 Sem internet! Verifique sua conexão.'
                : '📡 No internet! Check your connection.';
        } else {
            friendlyMessage = currentLang === 'pt'
                ? '😅 Algo deu errado. Tente novamente!'
                : '😅 Something went wrong. Try again!';
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
                await fetchData(lat, lon, false);
            },
            async (err) => {
                console.warn("GPS Denied or Error:", err);

                // Try to fallback to saved coordinates if GPS fails
                const savedCoords = localStorage.getItem('userCoords');
                if (savedCoords) {
                    try {
                        const { lat, lon } = JSON.parse(savedCoords);
                        await fetchData(lat, lon, false);
                        return;
                    } catch (e) {
                        console.error("Saved coords invalid", e);
                    }
                }

                console.warn("Using Jerusalem as fallback");
                await fetchData(31.7683, 35.2137, false);
            }
        );
    } else {
        fetchData(31.7683, 35.2137, false);
    }
}

// ========================================
// DATA FETCHING
// ========================================

async function fetchData(lat, lon, isManual = false) {
    try {
        showLoading();
        lastIsManual = isManual;

        // Update location type indicator
        updateDOM('location-type', isManual ? t("status.location_selected") : t("status.location_gps"));

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
        updateDOM('location-district', districtName || country);
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

        const hebcalUrl = `https://www.hebcal.com/hebcal?v=1&cfg=json&geo=pos&latitude=${lat}&longitude=${lon}&start=${dateStr}&end=${endDateStr}&maj=on&min=on&mod=on&nx=on&mf=on&ss=on&s=on`;
        const zmanimUrl = `https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&date=${dateStr}`;

        // 2a. Fetch standard calendar data
        const [hebcalRes, zmanimRes] = await Promise.all([
            fetch(hebcalUrl),
            fetch(zmanimUrl)
        ]);

        if (!hebcalRes.ok || !zmanimRes.ok) throw new Error("Erro ao buscar dados do Hebcal");

        const hebcalData = await hebcalRes.json();
        const zmanimData = await zmanimRes.json();

        // 2b. Calculate afterSunset status
        let isAfterSunset = false;
        if (zmanimData.times && zmanimData.times.sunset) {
            const sunsetTime = new Date(zmanimData.times.sunset);
            if (new Date() > sunsetTime) {
                isAfterSunset = true;
            }
        }

        // 2c. Fetch accurate Hebrew Date (with sunset logic)
        const converterUrl = `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${today.getDate()}&g2h=1&strict=1${isAfterSunset ? '&gs=on' : ''}`;
        const converterRes = await fetch(converterUrl);
        const converterData = await converterRes.json();

        // Save state
        lastHebcalData = hebcalData;
        lastZmanimData = zmanimData;
        lastCityName = cityName;
        lastDistrictName = districtName;
        lastCountry = country;

        // Process and render data
        processHebcalData(hebcalData, converterData);
        renderZmanim(zmanimData);

        // Show dashboard
        hideLoading();
        document.getElementById('error-view').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');

    } catch (e) {
        console.error("Data Error:", e);
        let friendlyMessage;
        if (e.message && e.message.includes('fetch')) {
            friendlyMessage = currentLang === 'pt'
                ? '📡 Problema de conexão! Verifique sua internet.'
                : '📡 Connection issue! Check your internet.';
        } else if (e.message && e.message.includes('Hebcal')) {
            friendlyMessage = currentLang === 'pt'
                ? '⏱️ Serviço temporariamente indisponível. Tente em alguns segundos!'
                : '⏱️ Service temporarily unavailable. Try in a few seconds!';
        } else {
            friendlyMessage = currentLang === 'pt'
                ? '😅 Algo inesperado aconteceu. Tente recarregar a página!'
                : '😅 Something unexpected happened. Try reloading the page!';
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
        updateDOM('sunset-date', sunsetDate.toLocaleDateString(currentLang === 'pt' ? 'pt-PT' : 'en-US', {
            day: 'numeric',
            month: 'long'
        }));
    }
}

// ========================================
// DATA PROCESSING
// ========================================

function processHebcalData(data, converterData, isAfterSunset) {
    if (!data || !data.items) return;

    const items = data.items;

    // Calculate effective date (switch to tomorrow if after sunset)
    const now = new Date();
    const effectiveDate = new Date(now);
    if (isAfterSunset) {
        effectiveDate.setDate(effectiveDate.getDate() + 1);
    }
    const effectiveDateStr = effectiveDate.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0]; // Keep true today for comparisons if needed

    // 1. Find and display Parashah (Next upcoming or today's)
    // We look for the first parashah on or after the effective date
    const parashah = items.find(i => i.category === 'parashat' && i.date >= effectiveDateStr);
    if (parashah) {
        const parashahName = parashah.title.replace('Parashat ', '');
        updateDOM('parashah-name', parashahName);

        // Torah reading
        if (parashah.leyning && parashah.leyning.torah) {
            updateDOM('torah-reading', transliterateText(parashah.leyning.torah));
        } else {
            updateDOM('torah-reading', t("status.check_sefer"));
        }

        // Haftarah reading
        if (parashah.leyning && parashah.leyning.haftarah) {
            updateDOM('haftara-reading', transliterateText(parashah.leyning.haftarah));
        } else {
            updateDOM('haftara-reading', t("status.check_sefer"));
        }
    }

    // 2. Find and display candle lighting time
    // If it's Friday night after sunset, effectiveDate is Saturday.
    // Candles for this Friday are in the past (< Saturday).
    // So this will find NEXT week's candles. 
    // If user wants "Shabbat Shalom" for Friday night, we might need special logic. 
    // But for "Next Event", technically next candles is next week.
    // Let's stick to effectiveDateStr to be consistent with "Next Event".
    const candles = items.find(i => i.category === 'candles' && i.date >= effectiveDateStr);

    // Special case: If it is currently Friday night (after sunset), we might want to show "Shabbat Shalom"
    // instead of jumping 7 days ahead.
    // Let's check if there was a candle event TODAY (true today) that we just passed.
    const passedCandles = items.find(i => i.category === 'candles' && i.date === todayStr);

    if (passedCandles && isAfterSunset) {
        // We are in Shabbat (presumably)
        updateDOM('countdown', "Shabbat Shalom");
        updateDOM('label.shabbat_in', t("status.check_sefer")); // Optional: Change label?
    } else if (candles) {
        const candleDate = new Date(candles.date);
        startCountdown(candleDate);
    }

    // 3. Display Hebrew date (from Converter API)
    if (converterData) {
        const transliteratedDate = `${converterData.hd} ${converterData.hm} ${converterData.hy}`;
        updateDOM('hebrew-date', transliteratedDate);
    }

    // 4. Find and display upcoming holidays
    const holidays = items
        .filter(i => i.category === 'holiday' && i.date >= effectiveDateStr)
        .slice(0, 4);

    // 4.1 Check for Current Holiday (using effective date)
    const currentHoliday = items.find(i => i.category === 'holiday' && i.date === effectiveDateStr);

    if (currentHoliday) {
        updateDOM('current-holiday-name', currentHoliday.title);
        updateDOM('current-holiday-desc', t("desc.current_holiday"));
    } else {
        updateDOM('current-holiday-name', t("msg.no_holiday_today"));
        updateDOM('current-holiday-desc', t("msg.ordinary_day"));
    }

    if (holidays.length > 0) {
        // If the first upcoming holiday is the one currently happening (same day), skip to next? 
        // Or show it as "Next" too? Usually we show the NEXT one distinct from current.
        // If currentHoliday is set, we might want to show holidays[1] if holidays[0] is same.
        let nextH = holidays[0];
        if (currentHoliday && nextH.date === currentHoliday.date && holidays.length > 1) {
            nextH = holidays[1];
        }

        const hDate = new Date(nextH.date);
        const dateStr = hDate.toLocaleDateString(currentLang === 'pt' ? 'pt-PT' : 'en-US', {
            day: 'numeric',
            month: 'long'
        });

        updateDOM('next-holiday-name', nextH.title);
        updateDOM('next-holiday-date', dateStr);
    } else {
        updateDOM('next-holiday-name', t("msg.no_holidays"));
        updateDOM('next-holiday-date', t("msg.check_calendar"));
    }
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
            el.textContent = "Shabbat Shalom";
            clearInterval(countdownInterval);
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        el.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    tick();
    countdownInterval = setInterval(tick, 1000);
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


