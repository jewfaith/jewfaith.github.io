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
        "I Samuel": "Shmuel Aleph",
        "II Samuel": "Shmuel Bet",
        "1 Samuel": "Shmuel Aleph",
        "2 Samuel": "Shmuel Bet",
        "I Kings": "Melachim Aleph",
        "II Kings": "Melachim Bet",
        "1 Kings": "Melachim Aleph",
        "2 Kings": "Melachim Bet",

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
        "I Chronicles": "Divrei HaYamim Aleph",
        "II Chronicles": "Divrei HaYamim Bet",
        "1 Chronicles": "Divrei HaYamim Aleph",
        "2 Chronicles": "Divrei HaYamim Bet"
    };
}

// ========================================
// 🕎 EASTER EGGS - 50 SEGREDOS JUDAICOS 🕎
// ========================================
// FÁCEIS (5): Descobertos facilmente
// MÉDIOS (10): Requerem alguma exploração
// DIFÍCEIS (15): Precisam de conhecimento específico
// QUASE IMPOSSÍVEIS (30): Extremamente obscuros
// ========================================

// Contador de Easter eggs descobertos
let discoveredEggs = new Set();
const TOTAL_EGGS = 50;

function unlockEgg(eggId, message, category) {
    if (!discoveredEggs.has(eggId)) {
        discoveredEggs.add(eggId);
        const categories = { easy: '🟢', medium: '🟡', hard: '🟠', impossible: '🔴' };
        const icon = categories[category] || '✡️';
        showToast(`${icon} ${message}`);
        console.log(`%c✡️ Easter Egg #${eggId} desbloqueado! (${discoveredEggs.size}/${TOTAL_EGGS})`, 'color: #fbbf24; font-size: 14px;');
        if (discoveredEggs.size === TOTAL_EGGS) {
            setTimeout(() => showMasterUnlock(), 1000);
        }
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:1rem 2rem;border-radius:1rem;font-size:1rem;z-index:9999;animation:slideUp 0.5s;box-shadow:0 10px 40px rgba(99,102,241,0.5);max-width:90%;text-align:center;';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function showMasterUnlock() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;animation:fadeIn 1s;';
    overlay.innerHTML = `
        <div style="text-align:center;color:#fbbf24;font-family:serif;">
            <p style="font-size:5rem;margin:0;">👑</p>
            <p style="font-size:2.5rem;margin:1rem;">MESTRE DA TORÁ</p>
            <p style="font-size:1.2rem;color:#fff;margin:1rem;">Você descobriu todos os 50 segredos!</p>
            <p style="font-size:1rem;color:#8b5cf6;margin:1rem;">"A sabedoria é mais preciosa que rubis"</p>
            <p style="font-size:0.8rem;color:#64748b;margin-top:2rem;">Toque para fechar</p>
        </div>
    `;
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
}

// ========================================
// 🟢 FÁCEIS (5) - Descobertos facilmente
// ========================================

// #1 - Triple-click em qualquer card
let cardClicks = 0;
let cardClickTimer = null;
document.addEventListener('click', (e) => {
    if (e.target.closest('.data-card')) {
        cardClicks++;
        clearTimeout(cardClickTimer);
        cardClickTimer = setTimeout(() => {
            if (cardClicks >= 3) {
                unlockEgg(1, "Bereshit 1:1 - 'No princípio criou Deus...'", 'easy');
            }
            cardClicks = 0;
        }, 400);
    }
});

// #2 - Clicar no botão GPS 3 vezes
let gpsClicks = 0;
const gpsBtnEgg = document.getElementById('gps-btn');
if (gpsBtnEgg) {
    gpsBtnEgg.addEventListener('click', () => {
        gpsClicks++;
        if (gpsClicks === 3) {
            unlockEgg(2, "🧭 'Hashem guia os passos do homem justo'", 'easy');
        }
    });
}

// #3 - Digitar "shalom" no campo de pesquisa
const searchInputEgg = document.getElementById('city-search');
if (searchInputEgg) {
    searchInputEgg.addEventListener('input', (e) => {
        if (e.target.value.toLowerCase() === 'shalom') {
            unlockEgg(3, "☮️ Shalom Aleichem - Paz esteja convosco!", 'easy');
        }
    });
}

// #4 - Scroll até o final da página
let scrolledToBottom = false;
window.addEventListener('scroll', () => {
    if (!scrolledToBottom && (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
        scrolledToBottom = true;
        unlockEgg(4, "📜 Você chegou ao fim... mas o estudo nunca termina!", 'easy');
    }
});

// #5 - Clicar no botão compartilhar
const shareBtnEgg = document.getElementById('share-btn');
if (shareBtnEgg) {
    shareBtnEgg.addEventListener('click', () => {
        unlockEgg(5, "🤝 'Mitzvah - Compartilhar o bem!'", 'easy');
    });
}

// ========================================
// 🟡 MÉDIOS (10) - Requerem alguma exploração
// ========================================

// #6 - Pressionar tecla "S" 7 vezes (Shabbat = 7º dia)
let sKeyCount = 0;
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 's' && !e.target.matches('input')) {
        sKeyCount++;
        if (sKeyCount === 7) {
            unlockEgg(6, "🕯️ Shabbat Shalom! O 7º dia de descanso!", 'medium');
            sKeyCount = 0;
        }
    }
});

// #7 - Clicar 18 vezes em qualquer lugar (Chai = 18)
let pageClicks = 0;
document.addEventListener('click', () => {
    pageClicks++;
    if (pageClicks === 18) {
        unlockEgg(7, "🍷 L'Chaim! חי (Chai) = 18 = VIDA!", 'medium');
    }
});

// #8 - Digitar "613" no campo de pesquisa
if (searchInputEgg) {
    searchInputEgg.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value === '613') {
            unlockEgg(8, "📜 613 Mitzvot - Os mandamentos da Torá!", 'medium');
        }
    });
}

// #9 - Permanecer na página por 5 minutos
setTimeout(() => {
    unlockEgg(9, "⏰ Paciência é uma virtude! 5 minutos de estudo!", 'medium');
}, 300000);

// #10 - Clicar com botão direito em um card
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.data-card')) {
        unlockEgg(10, "🔍 Há sempre mais para descobrir na Torá!", 'medium');
    }
});

// #11 - Pressionar F12 (console developer)
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') {
        unlockEgg(11, "💻 'Estude a Torá, mesmo em código!'", 'medium');
    }
});

// #12 - Double-click no título de qualquer card
document.addEventListener('dblclick', (e) => {
    if (e.target.matches('.card-label')) {
        unlockEgg(12, "📖 'Procura e encontrarás' - Talmud", 'medium');
    }
});

// #13 - Mover mouse em círculos (representando o ciclo judaico)
let mousePositions = [];
document.addEventListener('mousemove', (e) => {
    mousePositions.push({ x: e.clientX, y: e.clientY });
    if (mousePositions.length > 50) mousePositions.shift();
    if (mousePositions.length === 50) {
        const centerX = mousePositions.reduce((a, b) => a + b.x, 0) / 50;
        const centerY = mousePositions.reduce((a, b) => a + b.y, 0) / 50;
        let circular = true;
        for (let i = 0; i < mousePositions.length - 1; i++) {
            const dist1 = Math.sqrt((mousePositions[i].x - centerX) ** 2 + (mousePositions[i].y - centerY) ** 2);
            const dist2 = Math.sqrt((mousePositions[i + 1].x - centerX) ** 2 + (mousePositions[i + 1].y - centerY) ** 2);
            if (Math.abs(dist1 - dist2) > 100) circular = false;
        }
        if (circular && mousePositions[0].x !== mousePositions[49].x) {
            unlockEgg(13, "🔄 O ciclo da vida judaica - nascimento, Bar Mitzvah, casamento...", 'medium');
            mousePositions = [];
        }
    }
});

// #14 - Visitar a página à meia-noite
const currentHour = new Date().getHours();
if (currentHour === 0) {
    unlockEgg(14, "🌙 Tikun Chatzot - A meia-noite sagrada!", 'medium');
}

// #15 - Pressionar Alt+J (Jewish)
document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 'j') {
        unlockEgg(15, "✡️ Orgulho Judaico! Am Yisrael Chai!", 'medium');
    }
});

// ========================================
// 🟠 DIFÍCEIS (15) - Conhecimento específico
// ========================================

// #16 - Digitar "yerushalayim" (Jerusalém em hebraico)
if (searchInputEgg) {
    searchInputEgg.addEventListener('input', (e) => {
        if (e.target.value.toLowerCase() === 'yerushalayim') {
            unlockEgg(16, "🏛️ Yerushalayim - A Cidade Santa de Ouro!", 'hard');
        }
    });
}

// #17 - Código Konami
let konamiSequence = [];
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
document.addEventListener('keydown', (e) => {
    konamiSequence.push(e.key);
    konamiSequence = konamiSequence.slice(-10);
    if (konamiSequence.join(',') === konamiCode.join(',')) {
        unlockEgg(17, "🎮 Código secreto! Shema Yisrael!", 'hard');
        showShemaOverlay();
    }
});

function showShemaOverlay() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.5s;';
    overlay.innerHTML = `<div style="text-align:center;color:#fbbf24;"><p style="font-size:3rem;direction:rtl;">שְׁמַע יִשְׂרָאֵל</p><p style="color:#fff;font-size:1.2rem;margin:1rem;">Shema Yisrael, Adonai Eloheinu, Adonai Echad</p></div>`;
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
}

// #18 - Digitar "torah" em qualquer lugar da página
let typedText = '';
document.addEventListener('keypress', (e) => {
    if (!e.target.matches('input')) {
        typedText += e.key.toLowerCase();
        typedText = typedText.slice(-5);
        if (typedText === 'torah') {
            unlockEgg(18, "📜 A Torá é árvore de vida para quem a ela se apega!", 'hard');
        }
    }
});

// #19 - Digitar "alef" (primeira letra hebraica)
document.addEventListener('keypress', (e) => {
    if (!e.target.matches('input')) {
        typedText += e.key.toLowerCase();
        if (typedText.includes('alef')) {
            unlockEgg(19, "א Alef - A primeira letra, o início de tudo!", 'hard');
            typedText = '';
        }
    }
});

// #20 - Visitar na sexta-feira (véspera de Shabbat)
if (new Date().getDay() === 5) {
    unlockEgg(20, "🕯️ Erev Shabbat! Prepare-se para o descanso sagrado!", 'hard');
}

// #21 - Digitar "mazal tov"
if (searchInputEgg) {
    searchInputEgg.addEventListener('input', (e) => {
        if (e.target.value.toLowerCase() === 'mazal tov') {
            unlockEgg(21, "🎉 Mazal Tov! Que a sorte esteja com você!", 'hard');
        }
    });
}

// #22 - Pressionar teclas H-A-S-H-E-M em sequência
let hashemKeys = '';
document.addEventListener('keydown', (e) => {
    if (!e.target.matches('input')) {
        hashemKeys += e.key.toLowerCase();
        hashemKeys = hashemKeys.slice(-6);
        if (hashemKeys === 'hashem') {
            unlockEgg(22, "✡️ Baruch Hashem - Bendito seja o Nome!", 'hard');
        }
    }
});

// #23 - Clicar 40 vezes (40 dias no Sinai)
let clicks40 = 0;
document.addEventListener('click', () => {
    clicks40++;
    if (clicks40 === 40) {
        unlockEgg(23, "⛰️ 40 dias no Monte Sinai - A Torá foi dada!", 'hard');
    }
});

// #24 - Shake do dispositivo móvel (representando o Lulav)
if (window.DeviceMotionEvent) {
    let lastShake = 0;
    window.addEventListener('devicemotion', (e) => {
        const acceleration = e.accelerationIncludingGravity;
        if (acceleration) {
            const magnitude = Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2);
            if (magnitude > 25 && Date.now() - lastShake > 2000) {
                lastShake = Date.now();
                unlockEgg(24, "🌿 Agite o Lulav! Chag Sukkot Sameach!", 'hard');
            }
        }
    });
}

// #25 - Hold de 10 segundos em um card (10 Mandamentos)
let holdTimer = null;
document.addEventListener('mousedown', (e) => {
    if (e.target.closest('.data-card')) {
        holdTimer = setTimeout(() => {
            unlockEgg(25, "📜 10 segundos = 10 Mandamentos de Hashem!", 'hard');
        }, 10000);
    }
});
document.addEventListener('mouseup', () => clearTimeout(holdTimer));

// #26 - Digitar "amen"
document.addEventListener('keypress', (e) => {
    if (!e.target.matches('input')) {
        typedText += e.key.toLowerCase();
        if (typedText.includes('amen') || typedText.includes('amém')) {
            unlockEgg(26, "🙏 Amén! Assim seja!", 'hard');
            typedText = '';
        }
    }
});

// #27 - Pressionar setas em padrão de Magen David (hexagrama)
let arrowPattern = [];
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        arrowPattern.push(e.key);
        arrowPattern = arrowPattern.slice(-6);
        if (arrowPattern.join(',') === 'ArrowUp,ArrowRight,ArrowDown,ArrowLeft,ArrowUp,ArrowDown') {
            unlockEgg(27, "✡️ Magen David - O Escudo de David!", 'hard');
        }
    }
});

// #28 - Visitar no sábado (Shabbat)
if (new Date().getDay() === 6) {
    unlockEgg(28, "🕯️ Shabbat Shalom! Dia de descanso sagrado!", 'hard');
}

// #29 - Redimensionar janela 7 vezes
let resizeCount = 0;
window.addEventListener('resize', () => {
    resizeCount++;
    if (resizeCount === 7) {
        unlockEgg(29, "📐 7 redimensionamentos = 7 dias da criação!", 'hard');
    }
});

// #30 - Digitar "mitzvah"
if (searchInputEgg) {
    searchInputEgg.addEventListener('input', (e) => {
        if (e.target.value.toLowerCase() === 'mitzvah') {
            unlockEgg(30, "📜 Uma Mitzvah puxa outra Mitzvah!", 'hard');
        }
    });
}

// ========================================
// 🔴 QUASE IMPOSSÍVEIS (30) - Extremamente obscuros
// ========================================

// #31 - Digitar o número 26 (valor numérico de YHVH)
if (searchInputEgg) {
    searchInputEgg.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value === '26') {
            unlockEgg(31, "✡️ 26 = Gematria do Nome Sagrado!", 'impossible');
        }
    });
}

// #32 - Visitar às 6:13 AM ou PM (613 mitzvot)
const checkTime613 = () => {
    const now = new Date();
    if (now.getHours() % 12 === 6 && now.getMinutes() === 13) {
        unlockEgg(32, "⏰ 6:13 - O momento das 613 Mitzvot!", 'impossible');
    }
};
setInterval(checkTime613, 60000);
checkTime613();

// #33 - Clicar exatamente 248 vezes (248 mandamentos positivos)
let clicks248 = 0;
document.addEventListener('click', () => {
    clicks248++;
    if (clicks248 === 248) {
        unlockEgg(33, "✅ 248 cliques = 248 Mitzvot positivas (Asseh)!", 'impossible');
    }
});

// #34 - Pressionar Tab 12 vezes (12 tribos de Israel)
let tabCount = 0;
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        tabCount++;
        if (tabCount === 12) {
            unlockEgg(34, "🏕️ 12 = As 12 Tribos de Israel!", 'impossible');
        }
    }
});

// #35 - Digitar "baruch ata adonai" (início de bênção)
let blessingTyped = '';
document.addEventListener('keypress', (e) => {
    if (!e.target.matches('input')) {
        blessingTyped += e.key.toLowerCase();
        if (blessingTyped.includes('baruch ata adonai')) {
            unlockEgg(35, "� Bendito és Tu, Adonai, nosso Deus!", 'impossible');
            blessingTyped = '';
        }
    }
});

// #36-38 - Visitar em data de feriado judaico
const checkJewishHoliday = () => {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    if ((month === 8 || month === 9) && day >= 1 && day <= 10) {
        unlockEgg(36, "🍎 Shaná Tová! Rosh Hashaná - Feliz Ano Novo!", 'impossible');
    }
    if (month === 11 && day >= 20 && day <= 28) {
        unlockEgg(37, "🕎 Chag Chanukah Sameach! Festival das Luzes!", 'impossible');
    }
    if ((month === 2 || month === 3) && day >= 15 && day <= 22) {
        unlockEgg(38, "🍷 Chag Pessach Sameach! Êxodo do Egito!", 'impossible');
    }
};
checkJewishHoliday();

// #39 - Digitar "ehyeh asher ehyeh" (Eu Sou o que Sou)
document.addEventListener('keypress', (e) => {
    if (!e.target.matches('input')) {
        blessingTyped += e.key.toLowerCase();
        if (blessingTyped.includes('ehyeh asher ehyeh')) {
            unlockEgg(39, "🔥 Êxodo 3:14 - 'Eu Sou o que Sou'", 'impossible');
            blessingTyped = '';
        }
    }
});

// #40 - Manter página aberta por exatamente 18 minutos (Chai)
setTimeout(() => {
    unlockEgg(40, "⏱️ 18 minutos = Chai = VIDA! L'Chaim!", 'impossible');
}, 18 * 60 * 1000);

// #41 - Digitar "kotel" (Muro das Lamentações)
if (searchInputEgg) {
    searchInputEgg.addEventListener('input', (e) => {
        if (e.target.value.toLowerCase() === 'kotel') {
            unlockEgg(41, "🧱 O Kotel - Muro das Lamentações em Yerushalayim!", 'impossible');
        }
    });
}

// #42 - Scroll para cima e para baixo 42 vezes (42 jornadas no deserto)
let scrollDirectionChanges = 0;
let lastScrollTop = 0;
let lastDirection = null;
window.addEventListener('scroll', () => {
    const direction = window.scrollY > lastScrollTop ? 'down' : 'up';
    if (lastDirection && direction !== lastDirection) {
        scrollDirectionChanges++;
        if (scrollDirectionChanges === 42) {
            unlockEgg(42, "🏜️ 42 jornadas no deserto - Masai!", 'impossible');
        }
    }
    lastDirection = direction;
    lastScrollTop = window.scrollY;
});

// #43 - Clicar em todos os cards em sequência específica
let cardClickSequence = [];
document.querySelectorAll('.data-card').forEach((card, index) => {
    card.addEventListener('click', () => {
        cardClickSequence.push(index);
        if (cardClickSequence.length >= 7 &&
            cardClickSequence.slice(-7).every((v, i, a) => i === 0 || a[i - 1] < v)) {
            unlockEgg(43, "📚 Sequência perfeita! Como os 7 livros da Torá!", 'impossible');
        }
    });
});

// #44 - Digitar "pikuach nefesh" (salvar uma vida)
if (searchInputEgg) {
    searchInputEgg.addEventListener('input', (e) => {
        if (e.target.value.toLowerCase() === 'pikuach nefesh') {
            unlockEgg(44, "❤️ Pikuach Nefesh - Salvar uma vida supera quase tudo!", 'impossible');
        }
    });
}

// #45 - Pressionar tecla 25 vezes em 1 segundo (5x5 = 5 livros)
let rapidKeys = [];
document.addEventListener('keydown', () => {
    rapidKeys.push(Date.now());
    rapidKeys = rapidKeys.filter(t => Date.now() - t < 1000);
    if (rapidKeys.length >= 25) {
        unlockEgg(45, "📖 5x5 = Os 5 livros do Chumash!", 'impossible');
        rapidKeys = [];
    }
});

// #46 - Digitar "teshuvah" (arrependimento)
if (searchInputEgg) {
    searchInputEgg.addEventListener('input', (e) => {
        if (e.target.value.toLowerCase() === 'teshuvah') {
            unlockEgg(46, "� Teshuvah - O caminho do arrependimento e retorno!", 'impossible');
        }
    });
}

// #47 - Visitar às 3:00 AM (hora do Tikun Chatzot)
if (new Date().getHours() === 3) {
    unlockEgg(47, "🌙 Hora sagrada do Tikun - Lamentação pelo Templo!", 'impossible');
}

// #48 - Digitar sequência do Tetragramaton (YHVH = 10-5-6-5)
let numberSequence = '';
document.addEventListener('keypress', (e) => {
    if (!isNaN(e.key)) {
        numberSequence += e.key;
        numberSequence = numberSequence.slice(-7);
        if (numberSequence === '1056510' || numberSequence.includes('10565')) {
            unlockEgg(48, "✡️ י-ה-ו-ה - O Nome Inefável em Gematria!", 'impossible');
        }
    }
});

// #49 - Pressionar Ctrl+Shift+T (Torá)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
        unlockEgg(49, "📜 Ctrl+Shift+T = Torá, a árvore da vida!", 'impossible');
    }
});

// #50 - O GRANDE SEGREDO: Digitar "ani maamin" (Eu acredito)
if (searchInputEgg) {
    searchInputEgg.addEventListener('input', (e) => {
        if (e.target.value.toLowerCase() === 'ani maamin') {
            unlockEgg(50, "🕯️ Ani Maamin - EU ACREDITO! A fé completa no Mashiach!", 'impossible');
            showFinalSecret();
        }
    });
}

function showFinalSecret() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#1a1a2e,#16213e);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;animation:fadeIn 1s;';
    overlay.innerHTML = `
        <div style="text-align:center;color:#fbbf24;font-family:serif;padding:2rem;">
            <p style="font-size:4rem;margin:0;">✡️</p>
            <p style="font-size:2rem;direction:rtl;margin:1rem;">אֲנִי מַאֲמִין</p>
            <p style="font-size:1.5rem;color:#fff;margin:1rem;">Ani Maamin - Eu Acredito</p>
            <p style="font-size:1rem;color:#8b5cf6;margin:1rem;max-width:500px;">
                "Eu acredito com fé perfeita na vinda do Mashiach,<br>
                e ainda que ele demore, eu aguardarei sua vinda a cada dia."
            </p>
            <p style="font-size:0.8rem;color:#64748b;margin-top:2rem;">🕯️ Toque para fechar 🕯️</p>
        </div>
    `;
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
}

// Console inicial
console.log('%c🕎 Or HaZman - Luz do Tempo 🕎', 'font-size: 24px; color: #fbbf24; font-weight: bold;');
console.log('%c✡️ 50 segredos judaicos escondidos neste site!', 'font-size: 14px; color: #8b5cf6;');
console.log('%c🔍 FÁCEIS: 5 | MÉDIOS: 10 | DIFÍCEIS: 15 | QUASE IMPOSSÍVEIS: 20', 'font-size: 12px; color: #64748b;');
console.log('%c💡 Dica: Explore, clique, digite palavras sagradas...', 'font-size: 12px; color: #6366f1;');

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

