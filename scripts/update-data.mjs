/**
 * SCRIPTS/UPDATE-DATA.MJS - CENTRAL DATA LAYER BUILDER
 * 
 * Executa no GitHub Actions (ou localmente via Node.js):
 * 1. Obtém e valida o calendário litúrgico de 2 anos (Diáspora e Israel) da Hebcal API.
 * 2. Obtém e valida o catálogo de obras em português da Sefaria API.
 * 3. Pré-carrega leituras semanais da Parashá e Moadim da API Bolls.life.
 * 4. Obtém e agrega métricas de alcance comunitário da API Umami (com secret seguro).
 * 5. Garante integridade absoluta dos dados: NUNCA substitui dados válidos por nulos ou vazios.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const TIMEOUT_MS = 15000;

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timer);
        return response;
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

function safeReadExistingJson(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        }
    } catch (e) {
        console.warn(`[DataIntegrity] Aviso: Ficheiro existente corrompido em ${path.basename(filePath)}: ${e.message}`);
    }
    return null;
}

function safeWriteJson(filePath, data) {
    const tempPath = `${filePath}.tmp`;
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(tempPath, jsonStr, 'utf-8');
    fs.renameSync(tempPath, filePath);
    console.log(`[DataIntegrity] Gravado com sucesso: ${path.basename(filePath)} (${Buffer.byteLength(jsonStr)} bytes)`);
}

// =========================================================================
// 1. CALENDÁRIO HEBRAICO E LITÚRGICO (HEBCAL API)
// =========================================================================

async function updateHebcalCalendar(isIsrael, currentYear) {
    const fileName = isIsrael ? 'calendar-israel.json' : 'calendar-diaspora.json';
    const targetFile = path.join(DATA_DIR, fileName);
    const existingData = safeReadExistingJson(targetFile);

    const startYear = currentYear;
    const endYear = currentYear + 1;
    const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&geo=none&start=${startYear}-01-01&end=${endYear}-12-31&maj=on&min=on&mod=on&nx=on&mf=on&ss=on&s=on&i=${isIsrael ? 'on' : 'off'}&c=off&o=on`;

    console.log(`[Hebcal] A obter calendário para ${isIsrael ? 'Israel' : 'Diáspora'} (${startYear}-${endYear})...`);

    try {
        const res = await fetchWithTimeout(url, {
            headers: {
                'User-Agent': 'YisraelDateBot/1.0 (+https://jewfaith.github.io)',
                'Accept': 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        // Validação rigorosa dos dados recebidos
        if (!data || !Array.isArray(data.items)) {
            throw new Error('Formato inválido: items não é um array.');
        }

        if (data.items.length < 100) {
            throw new Error(`Contagem de eventos plausível não atingida (recebidos ${data.items.length}, mínimo esperado 100).`);
        }

        const validCategories = new Set(['holiday', 'parashat', 'fast', 'omer', 'roshchodesh']);
        const validItems = data.items.filter(item => {
            return item && typeof item.title === 'string' && typeof item.date === 'string' && validCategories.has(item.category);
        });

        if (validItems.length < 80) {
            throw new Error(`Apenas ${validItems.length} itens válidos de categorias litúrgicas reconhecidas.`);
        }

        const payload = {
            generatedAt: new Date().toISOString(),
            isIsrael,
            startYear,
            endYear,
            totalItems: validItems.length,
            items: validItems
        };

        safeWriteJson(targetFile, payload);
        return { success: true, count: validItems.length };
    } catch (err) {
        console.error(`[Hebcal] Erro ao atualizar calendário (${isIsrael ? 'Israel' : 'Diáspora'}): ${err.message}`);
        if (existingData && Array.isArray(existingData.items) && existingData.items.length > 0) {
            console.log(`[Hebcal] Preservada versão anterior válida de ${fileName} (${existingData.items.length} itens).`);
            return { success: false, preserved: true, count: existingData.items.length };
        }
        throw err;
    }
}

// =========================================================================
// 2. CATÁLOGO SEFARIA EM PORTUGUÊS (SEFARIA API)
// =========================================================================

const SEFARIA_ALLOWED_CATEGORIES = [
    'Mishnah', 'Talmud', 'Halakhah', 'Tosefta', 'Midrash',
    'Musar', 'Jewish Thought', 'Chasidut', 'Kabbalah', 'Responsa'
];

function matchAllowedCategory(catName) {
    if (!catName || typeof catName !== 'string') return null;
    const clean = catName.trim().toLowerCase();
    for (const allowed of SEFARIA_ALLOWED_CATEGORIES) {
        const a = allowed.toLowerCase();
        if (clean === a) return allowed;
        if (a === 'musar' && (clean === 'mussar' || clean === 'mussar literature')) return allowed;
        if (a === 'jewish thought' && (clean === 'philosophy' || clean === 'thought')) return allowed;
        if (a === 'chasidut' && (clean === 'hasidut' || clean === 'chassidut')) return allowed;
    }
    return null;
}

function isTanakhOrCommentary(parentKeys, title, url) {
    const pStr = parentKeys.join(' ').toLowerCase();
    const tStr = (title || '').toLowerCase();
    const uStr = (url || '').toLowerCase();

    if (pStr.includes('tanakh')) return true;
    if (pStr.includes('torah') || pStr.includes('prophets') || pStr.includes('writings')) return true;
    if (pStr.includes('rishonim on tanakh') || pStr.includes('acharonim on tanakh') || pStr.includes('modern commentary on tanakh')) return true;

    const biblicalBooks = [
        'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy',
        'joshua', 'judges', 'samuel', 'kings', 'isaiah', 'jeremiah',
        'ezekiel', 'hosea', 'joel', 'amos', 'obadiah', 'jonah',
        'micah', 'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah',
        'malachi', 'psalms', 'proverbs', 'job', 'song of songs',
        'ruth', 'lamentations', 'ecclesiastes', 'esther', 'daniel',
        'ezra', 'nehemiah', 'chronicles'
    ];

    for (const b of biblicalBooks) {
        if (tStr.includes(`on ${b}`) || uStr.includes(`on_${b}`)) {
            return true;
        }
    }
    return false;
}

async function updateSefariaCatalog() {
    const targetFile = path.join(DATA_DIR, 'sefaria-pt-catalog.json');
    const existingData = safeReadExistingJson(targetFile);

    console.log('[Sefaria] A obter catálogo de traduções em português...');

    try {
        const res = await fetchWithTimeout('https://www.sefaria.org/api/texts/translations/pt', {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const rawData = await res.json();
        if (!rawData || typeof rawData !== 'object') {
            throw new Error('Catálogo Sefaria devolveu formato não-objeto.');
        }

        const catalog = {};
        for (const cat of SEFARIA_ALLOWED_CATEGORIES) {
            catalog[cat] = [];
        }

        function walkTree(node, currentCat, pathList = []) {
            if (Array.isArray(node)) {
                for (const item of node) {
                    if (!item || !item.title) continue;
                    if (isTanakhOrCommentary(pathList, item.title, item.url)) continue;

                    const exists = catalog[currentCat].some(existing => existing.title === item.title);
                    if (!exists) {
                        catalog[currentCat].push({
                            title: item.title,
                            url: item.url || '',
                            versionTitle: item.versionTitle || 'Português [pt]',
                            subCategory: pathList.join(' > ')
                        });
                    }
                }
                return;
            }

            if (typeof node === 'object' && node !== null) {
                for (const key of Object.keys(node)) {
                    if (key.toLowerCase() === 'tanakh') continue;
                    walkTree(node[key], currentCat, [...pathList, key]);
                }
            }
        }

        for (const topKey of Object.keys(rawData)) {
            if (topKey.toLowerCase() === 'tanakh') continue;
            const matched = matchAllowedCategory(topKey);
            if (matched) {
                walkTree(rawData[topKey], matched, [topKey]);
            }
        }

        let totalWorks = 0;
        for (const cat of SEFARIA_ALLOWED_CATEGORIES) {
            totalWorks += catalog[cat].length;
        }

        if (totalWorks < 5) {
            throw new Error(`Apenas ${totalWorks} obras encontradas no catálogo Sefaria (mínimo esperado: 5).`);
        }

        const payload = {
            generatedAt: new Date().toISOString(),
            totalWorks,
            catalog
        };

        safeWriteJson(targetFile, payload);
        return { success: true, count: totalWorks };
    } catch (err) {
        console.error(`[Sefaria] Erro ao atualizar catálogo: ${err.message}`);
        if (existingData && existingData.catalog) {
            console.log(`[Sefaria] Preservada versão anterior válida do catálogo Sefaria.`);
            return { success: false, preserved: true, count: existingData.totalWorks || 0 };
        }
        throw err;
    }
}

// =========================================================================
// 3. LEITURAS BÍBLICAS DA PARASHÁ E MOADIM (BOLLS.LIFE API)
// =========================================================================

const TANAKH_BOOK_NAME_TO_ID = {
    'Bereshit': 1, 'Genesis': 1,
    'Shemot': 2, 'Exodus': 2,
    'Vayikra': 3, 'Leviticus': 3,
    'Bamidbar': 4, 'Numbers': 4,
    'Devarim': 5, 'Deuteronomy': 5,
    'Yehoshua': 6, 'Joshua': 6,
    'Shoftim': 7, 'Judges': 7,
    'I Shmuel': 9, '1 Samuel': 9, '1 Shmuel': 9,
    'II Shmuel': 10, '2 Samuel': 10, '2 Shmuel': 10,
    'I Melachim': 11, '1 Kings': 11, '1 Melachim': 11,
    'II Melachim': 12, '2 Kings': 12, '2 Melachim': 12,
    'Yeshayahu': 23, 'Isaiah': 23,
    'Yirmiyahu': 24, 'Jeremiah': 24,
    'Yechezkel': 26, 'Ezekiel': 26,
    'Hoshea': 28, 'Hosea': 28,
    'Yoel': 29, 'Joel': 29,
    'Amos': 30,
    'Ovadia': 31, 'Obadiah': 31,
    'Yona': 32, 'Jonah': 32,
    'Micha': 33, 'Micah': 33,
    'Nachum': 34, 'Nahum': 34,
    'Chavakuk': 35, 'Habakkuk': 35,
    'Tzefania': 36, 'Zephaniah': 36,
    'Chagai': 37, 'Haggai': 37,
    'Zecharia': 38, 'Zechariah': 38,
    'Malachi': 39,
    'Tehilim': 19, 'Psalms': 19,
    'Mishlei': 20, 'Proverbs': 20,
    'Iyov': 18, 'Job': 18,
    'Shir HaShirim': 22, 'Song of Songs': 22,
    'Ruth': 8,
    'Eichah': 25, 'Lamentations': 25,
    'Kohelet': 21, 'Ecclesiastes': 21,
    'Esther': 17,
    'Daniel': 27,
    'Ezra': 15,
    'Nechemia': 16, 'Nehemiah': 16,
    'I Divrei Hayamim': 13, '1 Chronicles': 13,
    'II Divrei Hayamim': 14, '2 Chronicles': 14
};

function cleanScriptureText(text) {
    if (!text) return '';
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

async function fetchBollsChapter(bookId, chapter, translations = ['NVT', 'OL', 'AA']) {
    let actualBookId = bookId;
    let actualCh = chapter;

    if (actualBookId === 13 && actualCh > 29) { actualBookId = 14; actualCh = actualCh - 29; }
    else if (actualBookId === 9 && actualCh > 31) { actualBookId = 10; actualCh = actualCh - 31; }
    else if (actualBookId === 11 && actualCh > 22) { actualBookId = 12; actualCh = actualCh - 22; }
    else if (actualBookId === 15 && actualCh > 10) { actualBookId = 16; actualCh = actualCh - 10; }

    for (const trans of translations) {
        try {
            const url = `https://bolls.life/get-chapter/${trans}/${actualBookId}/${actualCh}/`;
            const res = await fetchWithTimeout(url, {
                headers: { 'Accept': 'application/json', 'User-Agent': USER_AGENT }
            }, 8000);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    return { data, trans };
                }
            }
        } catch (e) {
            // Continua para próxima tradução
        }
    }
    return null;
}

function parseSimpleRef(refStr) {
    if (!refStr || typeof refStr !== 'string') return null;
    const clean = refStr.trim();
    // Ex: "Shemot 33:12-34:26" ou "Genesis 47:28-50:26" ou "I Kings 2:1-12"
    const match = clean.match(/^([1-2I]+(?:\s+[A-Za-z]+)+|[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+):(\d+)|-(\d+))?$/);
    if (!match) return null;

    const bookName = match[1].trim();
    const bookId = TANAKH_BOOK_NAME_TO_ID[bookName];
    if (!bookId) return null;

    const startChapter = parseInt(match[2], 10);
    const startVerse = parseInt(match[3], 10);

    let endChapter = startChapter;
    let endVerse = startVerse;

    if (match[4] && match[5]) {
        endChapter = parseInt(match[4], 10);
        endVerse = parseInt(match[5], 10);
    } else if (match[6]) {
        endVerse = parseInt(match[6], 10);
    }

    return { bookId, bookName, startChapter, startVerse, endChapter, endVerse };
}

async function fetchVersesForRef(parsedRef) {
    const { bookId, bookName, startChapter, startVerse, endChapter, endVerse } = parsedRef;
    const allVerses = [];
    let chosenTrans = '';

    for (let ch = startChapter; ch <= endChapter; ch++) {
        const result = await fetchBollsChapter(bookId, ch);
        if (!result) return null;
        chosenTrans = result.trans;

        for (const v of result.data) {
            const vNum = v.verse;
            if (ch === startChapter && vNum < startVerse) continue;
            if (ch === endChapter && vNum > endVerse) continue;

            allVerses.push({
                bookName,
                chapter: ch,
                verse: vNum,
                text: cleanScriptureText(v.text)
            });
        }
    }

    return { verses: allVerses, translation: chosenTrans };
}

async function updateParashatReadings() {
    const targetFile = path.join(DATA_DIR, 'parashat-readings.json');
    const existing = safeReadExistingJson(targetFile) || { readings: {} };
    const readingsStore = { ...existing.readings };

    // Lista de referências essenciais e sazonais para pré-carregamento imediato (Torá e Haftará)
    const targetRefs = [
        // Shabatot e Ciclo Inicial de Bereshit (Outono)
        'Shemot 33:12-34:26', // Shabat Chol HaMoed
        'Yechezkel 38:18-39:16', // Haftará Shabat Chol HaMoed
        'Devarim 33:1-34:12', // Vezot HaBerachah / Simchat Torah
        'Bereshit 1:1-6:8',   // Bereshit
        'Yeshayahu 42:5-43:10', // Haftará Bereshit
        'Bereshit 6:9-11:32', // Noach
        'Yeshayahu 54:1-55:5', // Haftará Noach
        'Bereshit 12:1-17:27', // Lech Lecha
        'Yeshayahu 40:27-41:16', // Haftará Lech Lecha
        'Bereshit 18:1-22:24', // Vayera
        'II Melachim 4:1-37', // Haftará Vayera
        'Bereshit 23:1-25:18', // Chayei Sarah
        'I Melachim 1:1-31', // Haftará Chayei Sarah

        // Grandes Moadim da Torá
        'Shemot 12:21-51',     // Pessach
        'Yehoshua 5:2-6:1',    // Haftará Pessach
        'Vayikra 22:26-23:44', // Chag Matzot / Sukkot
        'Shemot 19:1-20:23',   // Yom Shavuot
        'Yechezkel 1:1-28',    // Haftará Shavuot
        'Bereshit 21:1-34',    // Yom Teruah (1º Dia)
        'I Shmuel 1:1-2:10',   // Haftará Yom Teruah
        'Vayikra 16:1-34',     // Yom Kippur
        'Yeshayahu 57:14-58:14', // Haftará Yom Kippur
        'Zecharia 14:1-21',    // Haftará Sukkot
        'Devarim 14:22-16:17', // Shemini Atzeret
        'I Melachim 8:54-66',  // Haftará Shemini Atzeret
        'Bamidbar 28:19-25',   // Musaf Festas
        'Bamidbar 29:12-35'    // Musaf Sukkot
    ];

    console.log(`[Scripture] A verificar/pré-carregar ${targetRefs.length} leituras sagradas...`);

    let newlyFetched = 0;
    for (const ref of targetRefs) {
        if (readingsStore[ref] && Array.isArray(readingsStore[ref].verses) && readingsStore[ref].verses.length > 0) {
            continue; // Já em cache estática válida
        }

        const parsed = parseSimpleRef(ref);
        if (!parsed) continue;

        try {
            console.log(`[Scripture] A descarregar leitura para ${ref}...`);
            const res = await fetchVersesForRef(parsed);
            if (res && res.verses.length > 0) {
                readingsStore[ref] = {
                    verses: res.verses,
                    translation: res.translation,
                    fetchedAt: new Date().toISOString()
                };
                newlyFetched++;
            }
        } catch (e) {
            console.warn(`[Scripture] Aviso: Não foi possível obter ${ref}: ${e.message}`);
        }
    }

    const payload = {
        generatedAt: new Date().toISOString(),
        totalReadings: Object.keys(readingsStore).length,
        readings: readingsStore
    };

    safeWriteJson(targetFile, payload);
    return { success: true, count: Object.keys(readingsStore).length, newlyFetched };
}

// =========================================================================
// 4. ESTATÍSTICAS HISTÓRICAS E AGREGADAS (UMAMI CLOUD API)
// =========================================================================

const WEBSITE_ID = '6cd4c599-d27b-4542-aced-dcef8e470f0c';

async function updateUmamiStats() {
    const targetFile = path.join(DATA_DIR, 'umami.json');
    const existing = safeReadExistingJson(targetFile);

    // Tokens de autenticação via ambiente (GitHub Actions Secret)
    const apiKey = process.env.UMAMI_API_KEY || process.env.UMAMI_TOKEN;

    if (!apiKey) {
        console.log('[Umami] Nenhuma UMAMI_API_KEY configurada nas variáveis de ambiente.');
        if (existing && existing.stats) {
            console.log('[Umami] Preservada versão anterior das estatísticas.');
            return { success: true, preserved: true, configured: false };
        }
        // Cria estrutura de modelo transparente sem falhar
        const placeholder = {
            generatedAt: new Date().toISOString(),
            configured: false,
            stats: {
                pageviews: 0,
                visitors: 0,
                visits: 0,
                bounces: 0,
                totaltime: 0
            },
            countries: [],
            note: 'Estatísticas centralizadas ativadas. Aguarda configuração do secret UMAMI_API_KEY.'
        };
        safeWriteJson(targetFile, placeholder);
        return { success: true, configured: false };
    }

    console.log('[Umami] A consultar API do Umami Cloud para métricas agregadas...');

    try {
        const now = Date.now();
        const startAt = now - (90 * 24 * 60 * 60 * 1000); // Últimos 90 dias

        const headers = {
            'Accept': 'application/json',
            'x-umami-api-key': apiKey
        };

        // 1. Stats gerais (pageviews, visitors, visits, bounces, totaltime)
        const statsRes = await fetchWithTimeout(
            `https://api.umami.is/v1/websites/${WEBSITE_ID}/stats?startAt=${startAt}&endAt=${now}`,
            { headers }
        );

        if (!statsRes.ok) {
            throw new Error(`Umami Stats HTTP ${statsRes.status}: ${statsRes.statusText}`);
        }
        const statsData = await statsRes.json();

        // 2. Métricas por país
        let countriesData = [];
        try {
            const countryRes = await fetchWithTimeout(
                `https://api.umami.is/v1/websites/${WEBSITE_ID}/metrics?startAt=${startAt}&endAt=${now}&type=country`,
                { headers }
            );
            if (countryRes.ok) {
                countriesData = await countryRes.json();
            }
        } catch (e) {
            console.warn('[Umami] Aviso ao obter métricas de países:', e.message);
        }

        const payload = {
            generatedAt: new Date().toISOString(),
            configured: true,
            period: '90d',
            stats: {
                pageviews: statsData.pageviews?.value ?? statsData.pageviews ?? 0,
                visitors: statsData.visitors?.value ?? statsData.visitors ?? 0,
                visits: statsData.visits?.value ?? statsData.visits ?? 0,
                bounces: statsData.bounces?.value ?? statsData.bounces ?? 0,
                totaltime: statsData.totaltime?.value ?? statsData.totaltime ?? 0
            },
            countries: Array.isArray(countriesData) ? countriesData.slice(0, 10) : []
        };

        safeWriteJson(targetFile, payload);
        return { success: true, configured: true };
    } catch (err) {
        console.error(`[Umami] Erro ao consultar API do Umami: ${err.message}`);
        if (existing && existing.stats) {
            console.log('[Umami] Preservada versão anterior das estatísticas.');
            return { success: false, preserved: true, configured: true };
        }
        // Cria estrutura de contingência
        const fallback = {
            generatedAt: new Date().toISOString(),
            configured: true,
            error: 'API temporariamente indisponível',
            stats: existing?.stats || { pageviews: 0, visitors: 0, visits: 0, bounces: 0, totaltime: 0 },
            countries: existing?.countries || []
        };
        safeWriteJson(targetFile, fallback);
        return { success: false, configured: true };
    }
}

// =========================================================================
// 5. MANIFESTO CENTRAL DE DADOS (MANIFEST.JSON)
// =========================================================================

function updateManifest(results) {
    const targetFile = path.join(DATA_DIR, 'manifest.json');
    const manifest = {
        schemaVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
        sources: {
            calendarDiaspora: {
                file: 'data/calendar-diaspora.json',
                status: results.diaspora?.success ? 'ok' : (results.diaspora?.preserved ? 'preserved' : 'error'),
                eventsCount: results.diaspora?.count || 0
            },
            calendarIsrael: {
                file: 'data/calendar-israel.json',
                status: results.israel?.success ? 'ok' : (results.israel?.preserved ? 'preserved' : 'error'),
                eventsCount: results.israel?.count || 0
            },
            sefariaCatalog: {
                file: 'data/sefaria-pt-catalog.json',
                status: results.sefaria?.success ? 'ok' : (results.sefaria?.preserved ? 'preserved' : 'error'),
                worksCount: results.sefaria?.count || 0
            },
            parashatReadings: {
                file: 'data/parashat-readings.json',
                status: results.readings?.success ? 'ok' : 'error',
                readingsCount: results.readings?.count || 0
            },
            umamiAnalytics: {
                file: 'data/umami.json',
                status: results.umami?.success ? 'ok' : 'error',
                configured: !!results.umami?.configured
            }
        }
    };

    safeWriteJson(targetFile, manifest);
}

// =========================================================================
// ORQUESTRADOR PRINCIPAL
// =========================================================================

async function main() {
    console.log('====================================================');
    console.log('  YISRAEL DATE • ATUALIZAÇÃO CENTRAL DA CAMADA DE DADOS');
    console.log('====================================================');
    console.log(`Data e hora: ${new Date().toISOString()}`);

    const currentYear = new Date().getFullYear();
    const results = {};

    try {
        results.diaspora = await updateHebcalCalendar(false, currentYear);
    } catch (e) {
        results.diaspora = { success: false, error: e.message };
    }

    try {
        results.israel = await updateHebcalCalendar(true, currentYear);
    } catch (e) {
        results.israel = { success: false, error: e.message };
    }

    try {
        results.sefaria = await updateSefariaCatalog();
    } catch (e) {
        results.sefaria = { success: false, error: e.message };
    }

    try {
        results.readings = await updateParashatReadings();
    } catch (e) {
        results.readings = { success: false, error: e.message };
    }

    try {
        results.umami = await updateUmamiStats();
    } catch (e) {
        results.umami = { success: false, error: e.message };
    }

    updateManifest(results);

    console.log('====================================================');
    console.log('  SINCRONIZAÇÃO CONCLUÍDA');
    console.log('====================================================');
}

main().catch(err => {
    console.error('[FatalError] Falha crítica na geração dos dados:', err);
    process.exit(1);
});
