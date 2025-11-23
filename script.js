// --- Configuração e Variáveis Globais ---
const defaultLat = 31.77; // Fallback para Jerusalem
const defaultLon = 35.22; // Fallback para Jerusalem

let currentLat = defaultLat;
let currentLon = defaultLon;

// --- Funções Utilitárias ---
const pad = (n) => String(n).padStart(2, '0');

function formatDate(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
}

const translations = {
    "Genesis": "Bereshit",
    "Exodus": "Shemot",
    "Leviticus": "Vaykra",
    "Numbers": "Badmibar",
    "Deuteronomy": "Devarim",
};

/**
 * Traduz o texto removendo acentos e substituindo nomes de livros.
 */
function translateText(text) {
    if (!text) return "";
    let translatedText = text;

    Object.entries(translations).forEach(([key, value]) => {
        translatedText = translatedText.replace(key, value);
    });

    return translatedText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Calcula o pôr do sol com base na data e localização.
 */
// Função de formatação de data (DD.MM.YYYY)
function formatDatePT(dateStr) {
    // Remove o "T" e a parte da hora e milissegundos
    const datePart = dateStr.split('T')[0]; // Pega apenas a parte da data (DD-MM-YYYY)

    // Converte o formato de data de DD-MM-YYYY para DD.MM.YYYY
    const [d, m, y] = datePart.split('-');
    return `${d}.${m}.${y}`;
}

/**
 * Calcula e formata o pôr do sol com base na data e localização.
 * @param {string} dateStr - Data no formato DD-MM-YYYY.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @returns {string} Hora e data formatadas do pôr do sol ("hora - data").
 */
function calculateSunsetForDate(dateStr, lat, lon) {
    try {
        // Converte DD-MM-YYYY para YYYY-MM-DD para criar o objeto Date
        const [d, m, y] = dateStr.split('-');
        const isoDateStr = `${y}-${m}-${d}`;  // Formato ISO para compatibilidade com Date
        const date = new Date(isoDateStr);

        // Obtém os horários do sol usando a biblioteca SunCalc
        const times = SunCalc.getTimes(date, lat, lon);
        const sunset = times.sunset;

        if (sunset) {
            // Formata a hora do pôr do sol no formato HH:MM (24h)
            const sunsetTime = sunset.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false, // Garante o formato de 24h
            });

            // Formata a data no formato DD.MM.YYYY
            const datePT = formatDatePT(isoDateStr);

            // Retorna a hora e a data separadas: "hora - data"
            return `${sunsetTime} - ${datePT}`;
        }
    } catch (e) {
        console.error("Erro ao calcular pôr do sol:", e);
    }
    return "-";
}

// --- Função para obter a Parashá e nome da Parashá ---
async function fetchParasha() {
    const dataAtual = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const url = `https://www.hebcal.com/shabbat?cfg=json&v=1&date=${dataAtual}`;

    try {
        const response = await fetch(url);
        if (response.status === 200) {
            const data = await response.json();
            const parashaItem = data.items.find(item => item.category === 'parashat');
            if (parashaItem) {
                const parashaTitle = translateText(parashaItem.title).replace("Parashat ", "");
                const torahReading = parashaItem.leyning?.torah || 'Não disponível';
                document.getElementById('parasha').textContent = parashaTitle;
                document.getElementById('parasha-date').textContent = torahReading;
            } else {
                document.getElementById('parasha').textContent = "-";
                document.getElementById('parasha-date').textContent = "Parashá não encontrada";
            }
        } else {
            console.error("Erro ao acessar a API Hebcal:", response.status);
        }
    } catch (error) {
        console.error("Erro ao buscar Parashá:", error);
        document.getElementById('parasha').textContent = "-";
        document.getElementById('parasha-date').textContent = "Erro na API";
    }
}


// --- Função de Geolocalização e UI ---
async function getCityName(lat, lon) {
    try {
        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}`;
        const response = await fetch(url);
        const data = await response.json();
        const city = data.locality || data.city || data.principalSubdivision;
        const country = data.countryName;
        return city && country ? `${translateText(city)}, ${translateText(country)}` : translateText(country) || "-";
    } catch (e) {
        console.error("Erro ao obter cidade:", e);
        return "-";
    }
}

async function updateLocationAndSunset(lat, lon) {
    currentLat = lat;
    currentLon = lon;

    fetchParasha();
    document.getElementById('coords').textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

    const today = new Date();
    const todayStr = `${pad(today.getDate())}-${pad(today.getMonth() + 1)}-${today.getFullYear()}`;
    const sunsetInfo = calculateSunsetForDate(todayStr, lat, lon);

    document.getElementById('sunset').textContent = sunsetInfo;
    document.getElementById('sunset-sub-value').textContent = "Início do dia hebraico";

    document.getElementById('location').classList.add('loading');
    const cityName = await getCityName(lat, lon);
    document.getElementById('location').classList.remove('loading');
    document.getElementById('location').textContent = cityName;
}

async function fetchHebcalData(lat, lon) {
    const now = new Date();
    const todayISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const today = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;

    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 10);
    const startISO = startDate.toISOString().split('T')[0];

    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 30);
    const endISO = endDate.toISOString().split('T')[0];

    try {
        const [convData, calData] = await Promise.all([
            fetch(`https://www.hebcal.com/converter?cfg=json&gy=${now.getFullYear()}&gm=${pad(now.getMonth() + 1)}&gd=${pad(now.getDate())}&g2h=1`).then(r => r.json()),
            fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&start=${startISO}&end=${endISO}&maj=on&min=on&mod=on&leyning=on&ss=on&latitude=${lat}&longitude=${lon}&yzkr=on`).then(r => r.json())
        ]);

        document.getElementById('hebrew-date').textContent = `${convData.hd} ${convData.hm} ${convData.hy}`;
        document.getElementById('hebrew-text').textContent = convData.hebrew;

        const nextHoliday = calData.items.find(i => (i.category === 'holiday' || i.category === 'roshchodesh') && i.date >= todayISO);
        if (nextHoliday) {
            const isToday = nextHoliday.date === todayISO;
            const holidayDate = formatDate(nextHoliday.date);
            const holidaySunsetInfo = calculateSunsetForDate(holidayDate, lat, lon);

            document.getElementById('holiday-label').textContent = isToday ? "Festividade hoje" : "Proxima festa";
            document.getElementById('holiday-name').textContent = translateText(nextHoliday.title);
            document.getElementById('holiday-date').textContent = holidaySunsetInfo;
        } else {
            document.getElementById('holiday-name').textContent = "-";
            document.getElementById('holiday-date').textContent = "Nada encontrado";
        }

    } catch (e) {
        console.error("Erro ao buscar calendário Hebcal:", e);
        document.getElementById('holiday-name').textContent = "-";
        document.getElementById('holiday-date').textContent = "Erro no calendário";
    }
}

// --- Inicialização ---
function init() {
    const clearLocationFields = () => {
        const fields = ['location', 'coords', 'sunset', 'sunset-sub-value', 'hebrew-date', 'hebrew-text', 'holiday-name', 'holiday-date', 'parasha', 'parasha-date'];
        fields.forEach(id => document.getElementById(id).textContent = "-");
    };

    clearLocationFields();

    if (!navigator.geolocation) {
        console.warn("Geolocalização não suportada.");
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        await updateLocationAndSunset(latitude, longitude);
        await fetchHebcalData(latitude, longitude);
    }, (err) => {
        console.error("Falha na geolocalização:", err);
        clearLocationFields();
    });
}

init();
