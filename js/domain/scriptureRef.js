/**
 * SCRIPTUREREF.JS - PARSER E MAPEAMENTO DE REFERÊNCIAS BÍBLICAS
 * 
 * Centraliza os identificadores canónicos de livros da Tanakh/Bíblia,
 * mapeamentos em português, inglês e hebraico, e o analisador sintático
 * de referências (capítulos, versículos e intervalos múltiplos).
 */

const SHARED_DOM_PARSER = typeof DOMParser !== 'undefined' ? new DOMParser() : null;

/**
 * Remove tags HTML e sanitiza o texto puro.
 */
export function cleanText(text) {
    if (!text) return '';
    if (SHARED_DOM_PARSER) {
        const doc = SHARED_DOM_PARSER.parseFromString(text, 'text/html');
        return (doc.body.textContent || '').trim();
    }
    return String(text).replace(/<[^>]*>/g, '').trim();
}

/**
 * Mapeamento canónico de nomes de livros bíblicos para IDs na API Bolls.
 */
export const BOLLS_BOOK_IDS = {
    'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
    'Joshua': 6, 'Judges': 7, 'Ruth': 8,
    'I Samuel': 9, 'II Samuel': 10, '1 Samuel': 9, '2 Samuel': 10, 'Samuel': 9,
    'I Kings': 11, 'II Kings': 12, '1 Kings': 11, '2 Kings': 12, 'Kings': 11,
    'I Chronicles': 13, 'II Chronicles': 14, '1 Chronicles': 13, '2 Chronicles': 14, 'Chronicles': 13,
    'Ezra': 15, 'Nehemiah': 16, 'Esther': 17,
    'Job': 18, 'Psalms': 19, 'Proverbs': 20,
    'Ecclesiastes': 21, 'Song of Solomon': 22, 'Song of Songs': 22,
    'Isaiah': 23, 'Jeremiah': 24, 'Lamentations': 25,
    'Ezekiel': 26, 'Daniel': 27,
    'Hosea': 28, 'Joel': 29, 'Amos': 30,
    'Obadiah': 31, 'Jonah': 32, 'Micah': 33,
    'Nahum': 34, 'Habakkuk': 35, 'Zephaniah': 36,
    'Haggai': 37, 'Zechariah': 38, 'Malachi': 39,

    'Bereshit': 1, 'Shemot': 2, 'Vayikra': 3, 'Bamidbar': 4, 'Devarim': 5,
    'Yehoshua': 6, 'Shoftim': 7,
    'I Shmuel': 9, 'II Shmuel': 10, '1 Shmuel': 9, '2 Shmuel': 10, 'Shmuel': 9,
    'I Melachim': 11, 'II Melachim': 12, '1 Melachim': 11, '2 Melachim': 12, 'Melachim': 11,
    'Yeshayahu': 23, 'Yirmiyahu': 24, 'Yechezkel': 26,
    'Hoshea': 28, 'Yoel': 29, 'Amos': 30, 'Ovadia': 31, 'Yona': 32, 'Micha': 33,
    'Nachum': 34, 'Chavakuk': 35, 'Tzefania': 36, 'Chagai': 37, 'Zecharia': 38, 'Malachi': 39,
    'Tehilim': 19, 'Mishlei': 20, 'Iyov': 18, 'Shir HaShirim': 22,
    'Eichah': 25, 'Kohelet': 21, 'Nechemia': 16,
    'I Divrei Hayamim': 13, 'II Divrei Hayamim': 14, '1 Divrei Hayamim': 13, '2 Divrei Hayamim': 14,
    'Divrei Hayamim': 13, 'Divrei HaYamim': 13,

    'Gênesis': 1, 'Êxodo': 2, 'Levítico': 3, 'Números': 4, 'Deuteronômio': 5,
    'Josué': 6, 'Juízes': 7, 'Rute': 8,
    '1 Crônicas': 13, '2 Crônicas': 14, 'I Crônicas': 13, 'II Crônicas': 14, 'Crônicas': 13,
    '1 Reis': 11, '2 Reis': 12, 'I Reis': 11, 'II Reis': 12, 'Reis': 11,
    'Esdras': 15, 'Neemias': 16, 'Ester': 17,
    'Jó': 18, 'Salmos': 19, 'Provérbios': 20, 'Eclesiastes': 21, 'Cânticos': 22, 'Cantares': 22,
    'Isaías': 23, 'Jeremias': 24, 'Lamentações': 25,
    'Ezequiel': 26, 'Oséias': 28, 'Oseias': 28, 'Miqueias': 33, 'Naum': 34, 'Habacuque': 35, 'Sofonias': 36, 'Ageu': 37, 'Zacarias': 38, 'Malaquias': 39
};

/**
 * Converte nomes em inglês/português para nomenclatura hebraica transliterada canónica.
 */
export function toHebrewBookName(text) {
    if (!text) return '';
    let result = text;

    const dhRegex = /^(?:(?:I{1,2}|[12])\s+)?(?:Divrei\s+Ha?yamim|Chronicles|Crônicas)\s+(\d+)(.*)$/i;
    const dhMatch = result.match(dhRegex);
    if (dhMatch) {
        const rawCh = parseInt(dhMatch[1], 10);
        const rest = dhMatch[2] || '';
        const isExplicitSecond = /^II\s+|^2\s+/i.test(result);
        if (rawCh > 29) {
            return `II Divrei Hayamim ${rawCh - 29}${rest}`;
        } else if (isExplicitSecond) {
            return `II Divrei Hayamim ${rawCh}${rest}`;
        } else {
            return `I Divrei Hayamim ${rawCh}${rest}`;
        }
    }

    const mapping = {
        'Genesis': 'Bereshit', 'Exodus': 'Shemot', 'Leviticus': 'Vayikra', 'Numbers': 'Bamidbar', 'Deuteronomy': 'Devarim',
        'Joshua': 'Yehoshua', 'Judges': 'Shoftim', 'II Samuel': 'II Shmuel', 'I Samuel': 'I Shmuel', '2 Samuel': 'II Shmuel',
        '1 Samuel': 'I Shmuel', 'Samuel': 'Shmuel', 'II Kings': 'II Melachim', 'I Kings': 'I Melachim', '2 Kings': 'II Melachim',
        '1 Kings': 'I Melachim', 'Kings': 'Melachim', 'Isaiah': 'Yeshayahu', 'Jeremiah': 'Yirmiyahu', 'Ezekiel': 'Yechezkel',
        'Hosea': 'Hoshea', 'Joel': 'Yoel', 'Amos': 'Amos', 'Ovadia': 'Obadiah', 'Jonah': 'Yona', 'Micah': 'Micha', 'Nahum': 'Nachum',
        'Habakkuk': 'Chavakuk', 'Zephaniah': 'Tzefania', 'Haggai': 'Chagai', 'Zechariah': 'Zecharia', 'Malachi': 'Malachi',
        'Psalms': 'Tehilim', 'Proverbs': 'Mishlei', 'Job': 'Iyov', 'Song of Solomon': 'Shir HaShirim', 'Song of Songs': 'Shir HaShirim',
        'Ruth': 'Ruth', 'Lamentations': 'Eichah', 'Ecclesiastes': 'Kohelet', 'Esther': 'Esther', 'Daniel': 'Daniel', 'Ezra': 'Ezra',
        'Nehemiah': 'Nechemia', 'II Chronicles': 'II Divrei Hayamim', 'I Chronicles': 'I Divrei Hayamim', '2 Chronicles': 'II Divrei Hayamim',
        '1 Chronicles': 'I Divrei Hayamim', 'Chronicles': 'Divrei Hayamim', 'Crônicas': 'Divrei Hayamim'
    };
    for (const [eng, heb] of Object.entries(mapping)) {
        result = result.replace(new RegExp(`\\b${eng}\\b`, 'g'), heb);
    }
    return result;
}

/**
 * Analisa uma única referência bíblica (ex: "Shemot 12:21-51").
 */
export function parseSingleRef(cleanRef, defaultBookName) {
    if (!cleanRef) return null;
    let clean = cleanRef.trim();

    const dhRegex = /^(?:(?:I{1,2}|[12])\s+)?(?:Divrei\s+Ha?yamim|Chronicles|Crônicas)\s+(\d+)(.*)$/i;
    const dhMatch = clean.match(dhRegex);
    if (dhMatch) {
        const rawCh = parseInt(dhMatch[1], 10);
        const rest = dhMatch[2] || '';
        const isExplicitSecond = /^II\s+|^2\s+/i.test(clean);
        if (rawCh > 29) {
            clean = `II Chronicles ${rawCh - 29}${rest}`;
        } else if (isExplicitSecond) {
            clean = `II Chronicles ${rawCh}${rest}`;
        } else {
            clean = `I Chronicles ${rawCh}${rest}`;
        }
    }

    const shmuelRegex = /^(?:(?:I{1,2}|[12])\s+)?(?:Shmuel|Samuel)\s+(\d+)(.*)$/i;
    const shMatch = clean.match(shmuelRegex);
    if (shMatch) {
        const rawCh = parseInt(shMatch[1], 10);
        const rest = shMatch[2] || '';
        const isExplicitSecond = /^II\s+|^2\s+/i.test(clean);
        if (rawCh > 31) {
            clean = `II Samuel ${rawCh - 31}${rest}`;
        } else if (isExplicitSecond) {
            clean = `II Samuel ${rawCh}${rest}`;
        } else {
            clean = `I Samuel ${rawCh}${rest}`;
        }
    }

    const melachimRegex = /^(?:(?:I{1,2}|[12])\s+)?(?:Melachim|Kings|Reis)\s+(\d+)(.*)$/i;
    const melMatch = clean.match(melachimRegex);
    if (melMatch) {
        const rawCh = parseInt(melMatch[1], 10);
        const rest = melMatch[2] || '';
        const isExplicitSecond = /^II\s+|^2\s+/i.test(clean);
        if (rawCh > 22) {
            clean = `II Kings ${rawCh - 22}${rest}`;
        } else if (isExplicitSecond) {
            clean = `II Kings ${rawCh}${rest}`;
        } else {
            clean = `I Kings ${rawCh}${rest}`;
        }
    }

    let bookName = defaultBookName;
    let rest = clean;

    const match = clean.match(/^((?:I{1,2}\s+|[12]\s+)?[A-Za-zÀ-ÿ\s]+?)\s+(\d.*)$/);
    if (match && BOLLS_BOOK_IDS[match[1].trim()]) {
        bookName = match[1].trim();
        rest = match[2].trim();
    }

    if (!bookName) return null;
    const bookId = BOLLS_BOOK_IDS[bookName];
    if (!bookId) return null;

    const parts = rest.split(',');
    const ranges = [];
    let currentChapter = null;

    for (const part of parts) {
        const trimmedPart = part.trim();
        if (!trimmedPart) continue;

        const rangeParts = trimmedPart.split('-');
        if (rangeParts.length === 1) {
            const subparts = rangeParts[0].split(':');
            if (subparts.length > 1) {
                currentChapter = parseInt(subparts[0], 10);
                const verse = parseInt(subparts[1], 10);
                ranges.push({ startChapter: currentChapter, startVerse: verse, endChapter: currentChapter, endVerse: verse });
            } else {
                const val = parseInt(subparts[0], 10);
                if (currentChapter !== null) {
                    ranges.push({ startChapter: currentChapter, startVerse: val, endChapter: currentChapter, endVerse: val });
                } else {
                    currentChapter = val;
                    ranges.push({ startChapter: currentChapter, startVerse: null, endChapter: currentChapter, endVerse: null });
                }
            }
        } else {
            const startRaw = rangeParts[0].trim();
            const endRaw = rangeParts[1].trim();

            const startParts = startRaw.split(':');
            let startChapter, startVerse;
            if (startParts.length > 1) {
                currentChapter = parseInt(startParts[0], 10);
                startChapter = currentChapter;
                startVerse = parseInt(startParts[1], 10);
            } else {
                startChapter = currentChapter;
                startVerse = parseInt(startParts[0], 10);
            }

            const endParts = endRaw.split(':');
            let endChapter, endVerse;
            if (endParts.length > 1) {
                endChapter = parseInt(endParts[0], 10);
                endVerse = parseInt(endParts[1], 10);
                currentChapter = endChapter;
            } else {
                endChapter = startChapter;
                endVerse = parseInt(endRaw, 10);
            }

            ranges.push({ startChapter, startVerse, endChapter, endVerse });
        }
    }

    if (ranges.length === 0) return null;
    return { bookId, bookName, ranges };
}

/**
 * Analisa referências completas podendo conter múltiplas seções separadas por ponto e vírgula.
 */
export function parseRef(ref) {
    if (!ref) return null;
    const rawSections = ref.split(';').map(s => s.trim()).filter(Boolean);
    const sections = [];
    let lastBookName = null;

    for (const sec of rawSections) {
        const parsed = parseSingleRef(sec, lastBookName);
        if (parsed) {
            lastBookName = parsed.bookName;
            sections.push(parsed);
        }
    }

    if (sections.length === 0) return null;

    return {
        sections,
        bookId: sections[0].bookId,
        bookName: sections[0].bookName,
        ranges: sections[0].ranges
    };
}
