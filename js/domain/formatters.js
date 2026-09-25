/**
 * FORMATTERS.JS - FORMATADORES DE TEXTO E APRESENTAÇÃO DO DOMÍNIO
 * 
 * Centraliza e unifica todas as funções de formatação estrita de 2 palavras,
 * envolventes acessíveis para hebraico (RTL), e normalização textual.
 */

import { transliterateTorah } from './halacha.js';
import { HEBREW_MONTHS_PT } from './constants.js';

/**
 * Envolve caracteres e palavras em hebraico na tag <span lang="he" dir="rtl" class="hebrew-text">
 * para renderização correta de fontes e suporte a leitores de tela.
 */
export function formatHebrewInText(text) {
    if (!text || typeof text !== 'string') return text;
    return text.replace(/([\u0590-\u05FF\uFB1D-\uFB4F][\u0590-\u05FF\uFB1D-\uFB4F\s"'\u05BE\-]*[\u0590-\u05FF\uFB1D-\uFB4F]|[\u0590-\u05FF\uFB1D-\uFB4F])/g, (match) => {
        return `<span lang="he" dir="rtl" class="hebrew-text">${match}</span>`;
    });
}

/**
 * Sanitiza strings para prevenção contra XSS em injeções HTML.
 */
export function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Garante que qualquer título de festividade ou evento tenha rigorosamente 2 palavras.
 */
export function formatTwoWordTitle(name) {
    if (!name) return 'Festa Sagrada';
    let clean = name.trim();

    if (clean.includes('Shekalim')) return 'Shabbat Shekalim';
    if (clean.includes('Zachor')) return 'Shabbat Zachor';
    if (clean.includes('Parah')) return 'Shabbat Parah';
    if (clean.includes('Chodesh') && clean.includes('Shabbat')) return 'Shabbat Chodesh';
    if (clean.includes('Gadol') && clean.includes('Shabbat')) return 'Shabbat Gadol';
    if (clean.includes('Shirah')) return 'Shabbat Shirah';
    if (clean.includes('Chazon')) return 'Shabbat Chazon';
    if (clean.includes('Nachamu')) return 'Shabbat Nachamu';
    if (clean.includes('Shuva') || clean.includes('Shuvah')) return 'Shabbat Shuvah';
    if (/^(?:Yom\s+)?(?:Shabbat|Shabbos)$/i.test(clean)) return 'Yom Shabbat';
    if (clean.includes('Teruah')) return 'Yom Teruah';
    if (clean.includes('Kippur')) return 'Yom Kippur';
    if (clean.includes('Sukkot')) return 'Chag Sukkot';
    if (clean.includes('Atzeret')) return 'Shemini Atzeret';
    if (clean.includes('Simchat') || clean.includes('Simchas')) return 'Simchat Torah';
    if (clean.includes('Chanukah') || clean.includes('Hanukkah')) return 'Chag Chanukah';
    if (clean.includes('BiShvat') || clean.includes('Shevat')) return 'Tu BiShvat';
    if (clean.includes('Shushan Purim')) return 'Shushan Purim';
    if (clean.includes('Purim Katan')) return 'Purim Katan';
    if (clean.includes('Purim')) return 'Yom Purim';
    if (clean.includes('Pessach Sheni') || clean.includes('Pesach Sheni')) return 'Pessach Sheni';
    if (clean.includes('Pessach') || clean.includes('Pesach')) return 'Yom Pessach';
    if (clean.includes('Matzot')) return 'Chag Matzot';
    if (clean.includes('Shavuot')) return 'Yom Shavuot';
    if (clean.includes('Lag B')) return 'Lag BaOmer';
    if (clean.includes('Tammuz') || clean.includes('Tamuz')) return 'Tzom Tamuz';
    if (clean.includes('Tisha') || clean.includes("Tish'a")) return "Tisha B'Av";
    if (clean.includes('Tu B')) return "Tu B'Av";
    if (clean.includes('Gedaliah')) return 'Tzom Gedaliah';
    if (clean.includes('Tevet')) return 'Tzom Tevet';
    if (clean.includes('Esther')) return "Ta'anit Esther";
    if (clean.includes('Rosh Hashana') || clean.includes('Rosh Hashanah')) return 'Rosh Hashana';
    if (clean.includes('Rosh Chodashim')) return 'Rosh Chodashim';
    if (clean.includes('Rosh Chodesh')) return 'Rosh Chodesh';
    if (clean.includes('Behemot')) return 'Rosh LaBehemot';
    if (clean.includes('Elul')) return 'Chodesh Elul';
    if (clean.includes('Selichot')) return 'Leil Selichot';
    if (clean.includes('Hoshana')) return 'Hoshana Rabbah';

    return clean;
}

/**
 * Formata subtítulo de festividade estritamente em duas palavras.
 */
export function formatTwoWordSubtitle(evt, isIsrael = true) {
    if (!evt) return 'Data Sagrada';
    const title = evt.twoWordTitle || evt.name || '';
    if (title.includes('Matzot')) return 'Chag Matzot';
    if (title.includes('Sukkot')) return 'Chag Sukkot';
    if (title.includes('Shavuot')) return '6 Sivan';
    if (title.includes('Shemini Atzeret')) return '22 Etanim';
    if (title.includes('Teruah')) return '1 Etanim';
    if (title.includes('Kippur')) return '10 Etanim';
    if (title.includes('Pessach Sheni')) return '14 Ziv';
    if (title.includes('Pessach') || title.includes('Pesach')) return '14 Aviv';
    if (title.includes('Chanukah') || title.includes('Hanukkah')) return '25 Kislev';
    if (title.includes('Rosh Hashana')) return '1 Etanim';
    if (title.includes('Simchat Torah')) return isIsrael ? '22 Etanim' : '23 Etanim';

    if (evt.raw && evt.raw.hdate) {
        let cleanHdate = String(evt.raw.hdate).replace(/(\d+)\s*(?:-|-|—|a|à|e)\s*(\d+)/g, '$1-$2');
        cleanHdate = cleanHdate.replace(/\s+de\s+/g, ' ');
        const parts = cleanHdate.split(' ');
        if (parts.length >= 2) {
            const rawM = parts[1];
            const m = HEBREW_MONTHS_PT[rawM] || rawM;
            return `${parts[0]} ${m}`;
        }
    }
    return evt.isBiblical ? 'Mandamento Bíblico' : 'Tradição Sagrada';
}

/**
 * Garante estritamente duas palavras para qualquer título ou subtítulo
 */
export function ensureTwoWords(text, fallback = 'Yisrael Date') {
    if (!text || typeof text !== 'string') return fallback;
    const clean = text.trim().replace(/[\(\)\[\]\{\}\•\–\—\-\:\;]/g, ' ');
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length === 0) return fallback;
    if (words.length === 1) return `${words[0]} Sagrado`;
    return `${words[0]} ${words[1]}`;
}

/**
 * Formata referência bíblica para inglês com numeração canónica.
 */
export function toEnglishRef(ref) {
    if (!ref) return '';
    const mapping = {
        'Bereshit': 'Genesis', 'Shemot': 'Exodus', 'Vayikra': 'Leviticus',
        'Bamidbar': 'Numbers', 'Devarim': 'Deuteronomy', 'Yehoshua': 'Joshua',
        'Shoftim': 'Judges', 'II Shmuel': 'II Samuel', 'I Shmuel': 'I Samuel',
        '2 Shmuel': 'II Samuel', '1 Shmuel': 'I Samuel', 'II Melachim': 'II Kings',
        'I Melachim': 'I Kings', '2 Melachim': 'II Kings', '1 Melachim': 'I Kings',
        'Yeshayahu': 'Isaiah', 'Yirmiyahu': 'Jeremiah', 'Yechezkel': 'Ezekiel',
        'Hoshea': 'Hosea', 'Yoel': 'Joel', 'Amos': 'Amos', 'Ovadia': 'Obadiah',
        'Yona': 'Jonah', 'Micha': 'Micah', 'Nachum': 'Nahum', 'Chavakuk': 'Habakkuk',
        'Tzefania': 'Zephaniah', 'Chagai': 'Haggai', 'Zecharia': 'Zechariah',
        'Malachi': 'Malachi', 'Tehilim': 'Psalms', 'Mishlei': 'Proverbs',
        'Iyov': 'Job', 'Shir HaShirim': 'Song of Solomon', 'Ruth': 'Ruth',
        'Eichah': 'Lamentations', 'Kohelet': 'Ecclesiastes', 'Esther': 'Esther',
        'Daniel': 'Daniel', 'Ezra': 'Ezra', 'Nechemia': 'Nehemiah',
        'II Divrei Hayamim': 'II Chronicles', 'I Divrei Hayamim': 'I Chronicles',
        '2 Divrei Hayamim': 'II Chronicles', '1 Divrei Hayamim': 'I Chronicles',
        'Divrei Hayamim': 'Chronicles'
    };

    const sections = ref.split(';').map(s => s.trim()).filter(Boolean);
    const converted = sections.map(sec => {
        let result = sec;
        const dhMatch = result.match(/^(?:Divrei\s+Ha?yamim|Chronicles)\s+(\d+)(.*)$/i);
        if (dhMatch) {
            const rawCh = parseInt(dhMatch[1], 10);
            const rest = dhMatch[2] || '';
            return rawCh > 29 ? `II Chronicles ${rawCh - 29}${rest}` : `I Chronicles ${rawCh}${rest}`;
        }

        for (const [heb, eng] of Object.entries(mapping)) {
            if (result.startsWith(heb)) {
                result = eng + result.substring(heb.length);
                break;
            }
        }
        return result;
    });

    return converted.join('; ');
}

/**
 * Formata leituras de Haftará preservando referências completas de livros, capítulos e versículos.
 */
export function formatHaftaraTwoWords(rawRef, fallback = 'Profetas') {
    if (!rawRef || rawRef === '-') return `Estudo ${fallback}`;
    const translated = transliterateTorah(rawRef);
    let clean = String(translated).trim();
    clean = clean.replace(/(\d+)\s*(?:-|a|à|e)\s*(\d+)/g, '$1-$2');
    clean = clean.replace(/[\(\)•]/g, ' ').replace(/\s+/g, ' ').trim();
    return clean || `Estudo ${fallback}`;
}

/**
 * Formata qualquer texto de card preservando a referência completa (sem limitador de duas palavras).
 */
export function formatCardTwoWords(str, fallback = 'Sagrado') {
    if (!str || str === '-') return `Estudo ${fallback}`;
    let clean = String(str).trim();
    clean = clean.replace(/(\d+)\s*(?:-|a|à|e)\s*(\d+)/g, '$1-$2');
    clean = clean.replace(/[\(\)•]/g, ' ').replace(/\s+/g, ' ').trim();
    return clean || `Estudo ${fallback}`;
}

/**
 * Formata nome da Parashá semanal com o título limpo (sem prefixo Parashat e sem limite de palavras/caracteres).
 */
export function formatTwoWordParasha(rawTitle) {
    if (!rawTitle || rawTitle === '-') return '-';
    let clean = String(rawTitle).replace(/[\u2018\u2019]/g, "'").trim();
    clean = clean.replace(/^(?:Parashat|Parashá|Parashah|Parasha)\s+/i, '').trim();
    return clean || '-';
}

/**
 * Formata o nome da localidade (primeira palavra/cidade).
 */
export function formatTwoWordLocation(locName) {
    if (!locName) return 'Jerusalém';
    const clean = String(locName).split(',')[0].replace(/[\(\):;]/g, ' ').replace(/\s+/g, ' ').trim();
    return clean || 'Jerusalém';
}

/**
 * Retorna o país da localidade.
 */
export function formatLocationCountry(locName) {
    if (!locName) return '';
    const parts = String(locName).split(',').map(part => part.trim()).filter(Boolean);
    return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Formata o local no formato canónico "Cidade, País".
 */
export function formatLocationCityCountry(locName) {
    if (!locName) return 'Jerusalém, Israel';
    const parts = String(locName).split(',').map(part => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
        const city = parts[0].replace(/[\(\):;]/g, ' ').replace(/\s+/g, ' ').trim();
        const country = parts[parts.length - 1].replace(/[\(\):;]/g, ' ').replace(/\s+/g, ' ').trim();
        return `${city}, ${country}`;
    }
    const single = parts[0]?.replace(/[\(\):;]/g, ' ').replace(/\s+/g, ' ').trim() || 'Jerusalém';
    if (single.toLowerCase() === 'jerusalém' || single.toLowerCase() === 'jerusalem') {
        return 'Jerusalém, Israel';
    }
    return single;
}

/**
 * Obtém os componentes de data e hora locais no fuso horário da localidade ativa.
 * Garante que cálculos de Shabat, zmanim e saudações utilizam o fuso correto e não o do computador.
 */
export function getLocationDateParts(dateOrMs = Date.now(), tz = 'Asia/Jerusalem') {
    const d = typeof dateOrMs === 'number' ? new Date(dateOrMs) : (dateOrMs instanceof Date ? dateOrMs : new Date(dateOrMs));
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz || 'Asia/Jerusalem',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: false
        });
        const parts = formatter.formatToParts(d);
        const map = {};
        for (const p of parts) map[p.type] = p.value;
        const year = parseInt(map.year, 10);
        const month = parseInt(map.month, 10);
        const day = parseInt(map.day, 10);
        let hour = parseInt(map.hour, 10);
        if (hour === 24) hour = 0;
        const minute = parseInt(map.minute, 10);
        const second = parseInt(map.second, 10);
        const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

        return {
            year,
            month,
            day,
            hour,
            minute,
            second,
            dayOfWeek,
            dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        };
    } catch (e) {
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        return {
            year,
            month,
            day,
            hour: d.getHours(),
            minute: d.getMinutes(),
            second: d.getSeconds(),
            dayOfWeek: d.getDay(),
            dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        };
    }
}

/**
 * Converte componentes locais (ano, mês, dia, hora, minuto, segundo) num fuso horário específico
 * para o carimbo de data/hora UTC equivalente em milissegundos.
 */
export function localTimeToUtc(year, month, day, hour = 0, minute = 0, second = 0, tz = 'Asia/Jerusalem') {
    let utcMs = Date.UTC(year, month - 1, day, hour, minute, second);
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz || 'Asia/Jerusalem',
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false
        });
        const parts = formatter.formatToParts(new Date(utcMs));
        const map = {};
        for (const p of parts) map[p.type] = p.value;
        let tzHour = parseInt(map.hour, 10);
        if (tzHour === 24) tzHour = 0;
        const tzUtcMs = Date.UTC(parseInt(map.year, 10), parseInt(map.month, 10) - 1, parseInt(map.day, 10), tzHour, parseInt(map.minute, 10), parseInt(map.second, 10));
        const offsetMs = tzUtcMs - utcMs;
        return utcMs - offsetMs;
    } catch (e) {
        return utcMs;
    }
}

