/**
 * SEFARIASERVICE.JS - SERVIÇO OFICIAL SEFARIA PARA LEITURAS EM PORTUGUÊS
 * 
 * Implementa a obtenção dinâmica de literatura judaica não-Tanakh traduzida
 * para português exclusivamente através da API oficial da Sefaria.
 * 
 * Fonte da verdade: Sefaria Live API
 * Endpoints oficiais:
 * - https://www.sefaria.org/api/texts/translations/pt
 * - https://www.sefaria.org/api/ref/{REF}
 * - https://www.sefaria.org/api/v3/texts/{REF}?version=portuguese
 */

export const SEFARIA_ALLOWED_CATEGORIES = Object.freeze([
    'Mishnah',
    'Talmud',
    'Halakhah',
    'Tosefta',
    'Midrash',
    'Musar',
    'Jewish Thought',
    'Chasidut',
    'Kabbalah',
    'Responsa'
]);

export const CATEGORY_DISPLAY_NAMES = Object.freeze({
    'Mishnah': 'Mishná',
    'Talmud': 'Talmud',
    'Halakhah': 'Halachá',
    'Tosefta': 'Tosefta',
    'Midrash': 'Midrash',
    'Musar': 'Mussar',
    'Jewish Thought': 'Pensamento Judaico',
    'Chasidut': 'Chassidut',
    'Kabbalah': 'Cabalá',
    'Responsa': 'Responsa'
});

export const CATEGORY_ICONS = Object.freeze({
    'Mishnah': 'fa-solid fa-building-columns',
    'Talmud': 'fa-solid fa-users-between-lines',
    'Halakhah': 'fa-solid fa-gavel',
    'Tosefta': 'fa-solid fa-lines-leaning',
    'Midrash': 'fa-solid fa-gem',
    'Musar': 'fa-solid fa-compass-drafting',
    'Jewish Thought': 'fa-solid fa-brain',
    'Chasidut': 'fa-solid fa-hand-holding-heart',
    'Kabbalah': 'fa-solid fa-infinity',
    'Responsa': 'fa-solid fa-comments'
});

const CATALOG_CACHE_TTL = 12 * 60 * 60 * 1000; // 12h
let inMemoryCatalog = null;
let catalogTimestamp = 0;

/**
 * Normaliza e valida se uma chave de categoria pertence às 10 categorias permitidas.
 */
export function matchAllowedCategory(catName) {
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

/**
 * Verifica se um nó, categoria ou título pertence ao Tanakh ou comentário de Tanakh.
 */
function isTanakhOrTanakhCommentary(parentKeys, title, url) {
    const pStr = parentKeys.join(' ').toLowerCase();
    const tStr = (title || '').toLowerCase();
    const uStr = (url || '').toLowerCase();

    // Verificação de categoria raiz
    if (pStr.includes('tanakh')) return true;
    if (pStr.includes('torah') || pStr.includes('prophets') || pStr.includes('writings')) return true;
    if (pStr.includes('rishonim on tanakh') || pStr.includes('acharonim on tanakh') || pStr.includes('modern commentary on tanakh')) return true;

    // Livros bíblicos individuais
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

/**
 * Obtém dinamicamente da Sefaria todas as obras com tradução para português,
 * agrupadas exclusivamente pelas 10 categorias literárias solicitadas.
 */
export async function fetchPtCatalog(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && inMemoryCatalog && (now - catalogTimestamp < CATALOG_CACHE_TTL)) {
        return inMemoryCatalog;
    }

    // Tenta carregar de sessionStorage
    if (!forceRefresh && typeof sessionStorage !== 'undefined') {
        try {
            const stored = sessionStorage.getItem('sefaria_pt_catalog');
            const storedTs = sessionStorage.getItem('sefaria_pt_catalog_ts');
            if (stored && storedTs && (now - parseInt(storedTs, 10) < CATALOG_CACHE_TTL)) {
                inMemoryCatalog = JSON.parse(stored);
                catalogTimestamp = parseInt(storedTs, 10);
                return inMemoryCatalog;
            }
        } catch (e) { }
    }

    const response = await fetch('https://www.sefaria.org/api/texts/translations/pt', {
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        throw new Error(`Sefaria API HTTP ${response.status}: Falha ao obter catálogo em português.`);
    }

    const rawData = await response.json();
    const catalog = {};
    for (const cat of SEFARIA_ALLOWED_CATEGORIES) {
        catalog[cat] = [];
    }

    function walkTree(node, currentCat, path = []) {
        if (Array.isArray(node)) {
            for (const item of node) {
                if (!item || !item.title) continue;
                if (isTanakhOrTanakhCommentary(path, item.title, item.url)) continue;

                // Deduplicação por título da obra
                const exists = catalog[currentCat].some(existing => existing.title === item.title);
                if (!exists) {
                    catalog[currentCat].push({
                        title: item.title,
                        url: item.url || '',
                        versionTitle: item.versionTitle || 'Português [pt]',
                        subCategory: path.join(' > ')
                    });
                }
            }
            return;
        }

        if (typeof node === 'object' && node !== null) {
            for (const key of Object.keys(node)) {
                if (key.toLowerCase() === 'tanakh') continue;
                walkTree(node[key], currentCat, [...path, key]);
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

    inMemoryCatalog = catalog;
    catalogTimestamp = now;

    if (typeof sessionStorage !== 'undefined') {
        try {
            sessionStorage.setItem('sefaria_pt_catalog', JSON.stringify(catalog));
            sessionStorage.setItem('sefaria_pt_catalog_ts', String(now));
        } catch (e) { }
    }

    return catalog;
}

/**
 * Retorna as categorias com o número dinâmico de obras disponíveis em português.
 */
export async function getCategoriesWithPtCount() {
    const catalog = await fetchPtCatalog();
    return SEFARIA_ALLOWED_CATEGORIES.map(cat => ({
        id: cat,
        name: CATEGORY_DISPLAY_NAMES[cat] || cat,
        icon: CATEGORY_ICONS[cat] || 'fa-solid fa-book',
        count: catalog[cat]?.length || 0,
        available: (catalog[cat]?.length || 0) > 0
    }));
}

/**
 * Extrai o último número de uma referência para identificar limites de capítulos/seções.
 */
function extractTrailingNumber(refStr) {
    if (!refStr || typeof refStr !== 'string') return null;
    const match = refStr.match(/(\d+)(?:[ab])?$/i);
    return match ? parseInt(match[1], 10) : null;
}

/**
 * Escolhe aleatoriamente uma unidade de leitura natural para a obra selecionada,
 * respeitando a estrutura da Sefaria (capítulo completo, daf completo, etc.).
 */
async function generateCandidateUnits(work) {
    const candidates = [];
    const rawUrlRef = work.url ? decodeURIComponent(work.url.split('?')[0].replace(/^\//, '')).replace(/_/g, ' ') : '';

    // Consulta metadados de estrutura da Sefaria via /api/ref/{REF}
    let refMeta = null;
    try {
        const metaRes = await fetch(`https://www.sefaria.org/api/ref/${encodeURIComponent(work.title)}`, {
            headers: { 'Accept': 'application/json' }
        });
        if (metaRes.ok) {
            refMeta = await metaRes.json();
        }
    } catch (e) { }

    if (refMeta && refMeta.is_ref && refMeta.navigation_refs) {
        const nav = refMeta.navigation_refs;
        const secName = (refMeta.section_names?.[0] || '').toLowerCase();
        const addrType = (refMeta.address_types?.[0] || '').toLowerCase();
        const isTalmud = addrType === 'talmud' || secName === 'daf';

        if (isTalmud) {
            // Unidade natural do Talmud: Daf / Amud completo (ex: Berakhot 2a)
            const lastDaf = extractTrailingNumber(nav.last_subref) || 20;
            // Gera 3 dafs aleatórios dentro da extensão do tratado
            for (let i = 0; i < 3; i++) {
                const randomDaf = Math.floor(Math.random() * (lastDaf - 1)) + 2;
                const side = Math.random() < 0.5 ? 'a' : 'b';
                candidates.push(`${work.title} ${randomDaf}${side}`);
            }
            if (nav.first_available_section_ref) {
                candidates.push(nav.first_available_section_ref);
            }
        } else {
            // Unidade natural de Mishná, Halachá, Avot, etc.: Capítulo / Perek completo
            const maxChap = extractTrailingNumber(nav.last_subref);
            if (maxChap && maxChap > 1) {
                // Sorteia 3 capítulos distintos
                const picked = new Set();
                for (let i = 0; i < 3; i++) {
                    const c = Math.floor(Math.random() * maxChap) + 1;
                    picked.add(`${work.title} ${c}`);
                }
                candidates.push(...Array.from(picked));
            }
            if (nav.first_available_section_ref) {
                candidates.push(nav.first_available_section_ref);
            }
        }
    }

    // Ponto de entrada garantido retornado no catálogo da Sefaria
    if (rawUrlRef && !candidates.includes(rawUrlRef)) {
        candidates.push(rawUrlRef);
    }

    // Se nenhuma unidade foi inferida, usa o título da própria obra
    if (candidates.length === 0) {
        candidates.push(work.title);
    }

    // Baralha os candidatos para garantir aleatoriedade genuína
    return candidates.sort(() => Math.random() - 0.5);
}

/**
 * Valida se um texto retornado pela API v3 possui conteúdo em português real e legível.
 */
function extractPortugueseText(v3Data) {
    if (!v3Data || !v3Data.versions || !Array.isArray(v3Data.versions) || v3Data.versions.length === 0) {
        return null;
    }

    // Localiza a versão em português
    const ptVersion = v3Data.versions.find(v => {
        const lang = (v.actualLanguage || v.language || '').toLowerCase();
        const vt = (v.versionTitle || '').toLowerCase();
        return lang === 'pt' || vt.includes('[pt]') || vt.includes('portuguese') || vt.includes('português');
    }) || v3Data.versions[0];

    if (!ptVersion || !ptVersion.text) return null;

    const rawText = ptVersion.text;
    let paragraphs = [];

    if (Array.isArray(rawText)) {
        const flatten = (arr) => {
            const out = [];
            for (const el of arr) {
                if (Array.isArray(el)) out.push(...flatten(el));
                else if (typeof el === 'string' && el.trim().length > 0) out.push(el.trim());
            }
            return out;
        };
        paragraphs = flatten(rawText);
    } else if (typeof rawText === 'string' && rawText.trim().length > 0) {
        paragraphs = [rawText.trim()];
    }

    if (paragraphs.length === 0) return null;

    return {
        versionTitle: ptVersion.versionTitle || 'Versão em Português [pt]',
        paragraphs
    };
}

/**
 * Realiza a leitura aleatória estritamente dentro da categoria selecionada.
 * Executa descoberta de unidade natural e validação prévia de conteúdo em português.
 * 
 * @param {string} category Categoria canônica (ex: 'Mishnah', 'Talmud', 'Halakhah', etc.)
 * @param {number} maxAttempts Número máximo de tentativas contra loops
 */
export async function getRandomReading(category, maxAttempts = 10) {
    const catalog = await fetchPtCatalog();
    const works = catalog[category];

    if (!works || works.length === 0) {
        return {
            ok: false,
            category,
            categoryName: CATEGORY_DISPLAY_NAMES[category] || category,
            error: `Nenhuma obra em português disponível no momento para a categoria ${CATEGORY_DISPLAY_NAMES[category] || category} na Sefaria.`
        };
    }

    // Baralha a lista de obras da categoria
    const shuffledWorks = [...works].sort(() => Math.random() - 0.5);

    let attempts = 0;
    for (const work of shuffledWorks) {
        if (attempts >= maxAttempts) break;

        const candidateUnits = await generateCandidateUnits(work);

        for (const unitRef of candidateUnits) {
            attempts++;
            if (attempts > maxAttempts) break;

            try {
                const endpoint = `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(unitRef)}?version=portuguese`;
                const res = await fetch(endpoint, {
                    headers: { 'Accept': 'application/json' }
                });

                if (!res.ok) continue;

                const v3Data = await res.json();

                // Validação de exclusão estrita de Tanakh
                const isTanakh = (v3Data.categories || []).some(c => c.toLowerCase() === 'tanakh') ||
                    (v3Data.primary_category || '').toLowerCase() === 'tanakh';
                if (isTanakh) continue;

                // Validação de presença de texto português com conteúdo
                const ptResult = extractPortugueseText(v3Data);
                if (!ptResult) continue;

                return {
                    ok: true,
                    ref: v3Data.ref || unitRef,
                    heRef: v3Data.heRef || '',
                    title: work.title,
                    heTitle: v3Data.heTitle || v3Data.heIndexTitle || '',
                    category,
                    categoryName: CATEGORY_DISPLAY_NAMES[category] || category,
                    subCategory: work.subCategory || (v3Data.categories || []).join(' > '),
                    versionTitle: ptResult.versionTitle,
                    paragraphs: ptResult.paragraphs,
                    sectionNames: v3Data.sectionNames || []
                };
            } catch (err) {
                // Erro de rede pontual em um segmento, continua a próxima tentativa
            }
        }
    }

    return {
        ok: false,
        category,
        categoryName: CATEGORY_DISPLAY_NAMES[category] || category,
        error: `Não foi possível encontrar uma unidade com tradução completa em português após ${maxAttempts} tentativas. Tente novamente.`
    };
}

/**
 * Retorna uma categoria aleatória entre as permitidas, sem recair em padrões fixos.
 */
export function getRandomCategory() {
    const cats = Object.keys(DAILY_READINGS_POOL);
    return cats[Math.floor(Math.random() * cats.length)] || 'Mishnah';
}

/**
 * Retorna um item aleatório do catálogo unificado sem padronização fixa.
 */
export function getRandomLiteratureItem() {
    if (!UNIFIED_LITERATURE_POOL || UNIFIED_LITERATURE_POOL.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * UNIFIED_LITERATURE_POOL.length);
    return UNIFIED_LITERATURE_POOL[randomIndex];
}

/**
 * Obtém uma leitura específica por referência direta, validando tradução em português.
 * Caso falhe ou não tenha tradução completa, recai dinamicamente sem passagens padronizadas.
 */
export async function fetchReadingByRef(unitRef, category = null) {
    const targetCategory = category || getRandomCategory();
    if (!unitRef) return await getRandomReading(targetCategory);

    try {
        const endpoint = `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(unitRef)}?version=portuguese`;
        const res = await fetch(endpoint, {
            headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) {
            return await getRandomReading(targetCategory);
        }

        const v3Data = await res.json();
        const ptResult = extractPortugueseText(v3Data);
        if (!ptResult || !ptResult.paragraphs || ptResult.paragraphs.length === 0) {
            return await getRandomReading(targetCategory);
        }

        const detectedCat = category || matchAllowedCategory(v3Data.primary_category || (v3Data.categories || [])[0]) || targetCategory;

        return {
            ok: true,
            ref: v3Data.ref || unitRef,
            heRef: v3Data.heRef || '',
            title: v3Data.indexTitle || unitRef,
            heTitle: v3Data.heTitle || v3Data.heIndexTitle || '',
            category: detectedCat,
            categoryName: CATEGORY_DISPLAY_NAMES[detectedCat] || detectedCat,
            subCategory: (v3Data.categories || []).join(' > '),
            versionTitle: ptResult.versionTitle,
            paragraphs: ptResult.paragraphs,
            sectionNames: v3Data.sectionNames || []
        };
    } catch (e) {
        return await getRandomReading(targetCategory);
    }
}

/**
 * Catálogo verificado de leituras com tradução autêntica e completa em português na Sefaria.
 * Assegura que o sorteio diário (POR DIA) apresente sempre uma unidade válida e legível.
 */
export const DAILY_READINGS_POOL = {
    Mishnah: [
        { ref: 'Pirkei Avot 1', displayTitle: 'Pirkei Avot 1' },
        { ref: 'Pirkei Avot 2', displayTitle: 'Pirkei Avot 2' },
        { ref: 'Pirkei Avot 3', displayTitle: 'Pirkei Avot 3' },
        { ref: 'Pirkei Avot 4', displayTitle: 'Pirkei Avot 4' },
        { ref: 'Pirkei Avot 5', displayTitle: 'Pirkei Avot 5' },
        { ref: 'Pirkei Avot 6', displayTitle: 'Pirkei Avot 6' },
        { ref: 'Mishnah Berakhot 1', displayTitle: 'Mishnah Berakhot 1' },
        { ref: 'Mishnah Berakhot 2', displayTitle: 'Mishnah Berakhot 2' }
    ],
    Talmud: [
        { ref: 'Berakhot 2a', displayTitle: 'Berakhot 2a' },
        { ref: 'Berakhot 2b', displayTitle: 'Berakhot 2b' },
        { ref: 'Berakhot 3a', displayTitle: 'Berakhot 3a' },
        { ref: 'Berakhot 3b', displayTitle: 'Berakhot 3b' },
        { ref: 'Berakhot 4a', displayTitle: 'Berakhot 4a' },
        { ref: 'Berakhot 4b', displayTitle: 'Berakhot 4b' },
        { ref: 'Berakhot 5a', displayTitle: 'Berakhot 5a' },
        { ref: 'Berakhot 5b', displayTitle: 'Berakhot 5b' },
        { ref: 'Shabbat 2a', displayTitle: 'Shabbat 2a' },
        { ref: 'Shabbat 2b', displayTitle: 'Shabbat 2b' },
        { ref: 'Shabbat 3a', displayTitle: 'Shabbat 3a' },
        { ref: 'Shabbat 3b', displayTitle: 'Shabbat 3b' }
    ],
    Halakhah: [
        { ref: 'Shulchan Arukh, Orach Chayim 1', displayTitle: 'Shulchan Arukh, Orach Chayim 1' },
        { ref: 'Shulchan Arukh, Orach Chayim 2', displayTitle: 'Shulchan Arukh, Orach Chayim 2' },
        { ref: 'Shulchan Arukh, Orach Chayim 3', displayTitle: 'Shulchan Arukh, Orach Chayim 3' },
        { ref: 'Shulchan Arukh, Orach Chayim 4', displayTitle: 'Shulchan Arukh, Orach Chayim 4' },
        { ref: 'Shulchan Arukh, Orach Chayim 5', displayTitle: 'Shulchan Arukh, Orach Chayim 5' },
        { ref: 'Shulchan Arukh, Orach Chayim 6', displayTitle: 'Shulchan Arukh, Orach Chayim 6' },
        { ref: 'Shulchan Arukh, Orach Chayim 7', displayTitle: 'Shulchan Arukh, Orach Chayim 7' },
        { ref: 'Ben Ish Hai, Introduction 1', displayTitle: 'Ben Ish Hai, Introduction 1' }
    ],
    Midrash: [
        { ref: 'Mekhilta DeRabbi Shimon Ben Yochai 3', displayTitle: 'Mekhilta DeRabbi Shimon Ben Yochai 3' },
        { ref: 'Mekhilta DeRabbi Shimon Ben Yochai 4', displayTitle: 'Mekhilta DeRabbi Shimon Ben Yochai 4' },
        { ref: 'Mekhilta DeRabbi Shimon Ben Yochai 6', displayTitle: 'Mekhilta DeRabbi Shimon Ben Yochai 6' },
        { ref: 'Mekhilta DeRabbi Yishmael, Tractate Pischa 1', displayTitle: 'Mekhilta DeRabbi Yishmael, Tractate Pischa 1' },
        { ref: 'Sifrei Zuta; Midrashah shel Lod, Preface', displayTitle: 'Sifrei Zuta; Midrashah shel Lod, Preface' }
    ],
    Chasidut: [
        { ref: 'Tiferet Yosef, Rosh Hashanah 1', displayTitle: 'Tiferet Yosef, Rosh Hashanah 1' },
        { ref: 'Tiferet Yosef, Rosh Hashanah 2', displayTitle: 'Tiferet Yosef, Rosh Hashanah 2' }
    ],
    Kabbalah: [
        { ref: 'Sefer Yetzirah 2', displayTitle: 'Sefer Yetzirah 2' },
        { ref: 'Sefer Yetzirah 3', displayTitle: 'Sefer Yetzirah 3' },
        { ref: 'Sefer Yetzirah 4', displayTitle: 'Sefer Yetzirah 4' },
        { ref: 'Sefer Yetzirah 5', displayTitle: 'Sefer Yetzirah 5' },
        { ref: 'Sefer Yetzirah 6', displayTitle: 'Sefer Yetzirah 6' },
        { ref: 'Zohar, Introduction 1', displayTitle: 'Zohar, Introduction 1' }
    ]
};

const DAILY_CATEGORY_OFFSETS = {
    Mishnah: 7,
    Talmud: 7,
    Halakhah: 7,
    Midrash: 0,
    Chasidut: 1,
    Kabbalah: 1
};

export const UNIFIED_LITERATURE_POOL = Object.freeze(
    Object.entries(DAILY_READINGS_POOL).flatMap(([category, items]) =>
        items.map(it => ({ ref: it.ref, category, displayTitle: it.displayTitle }))
    )
);

/**
 * Obtém a leitura unificada de literatura judaica para o ciclo atual de 8 horas.
 */
export function getUnifiedLiteratureReading(date = new Date()) {
    if (!UNIFIED_LITERATURE_POOL || UNIFIED_LITERATURE_POOL.length === 0) return null;
    const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
    const cycleIndex = Math.floor(date.getTime() / EIGHT_HOURS_MS);
    const index = Math.abs(cycleIndex) % UNIFIED_LITERATURE_POOL.length;
    return UNIFIED_LITERATURE_POOL[index];
}

/**
 * Retorna o número do dia haláchico (ciclo judaico que transita exatamente no pôr do sol).
 * Se já tiver passado do pôr do sol (Shekiyah), avança para a próxima jornada judaica.
 * 
 * @param {Date} [date] Data de referência
 * @param {number|null} [sunsetTime] Timestamp em ms do pôr do sol
 */
export function getHalachicDayNumber(date = new Date(), sunsetTime = null) {
    const nowMs = date.getTime();

    let effectiveSunset = sunsetTime;
    if (!effectiveSunset && typeof window !== 'undefined') {
        if (window.state?.currentSunsetTime) {
            effectiveSunset = window.state.currentSunsetTime;
        } else {
            try {
                const cached = localStorage.getItem('hebcal_offline_cache');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed && parsed.sunset) effectiveSunset = parsed.sunset;
                }
            } catch (e) {}
        }
    }

    // Se ainda não temos o pôr do sol exato da localização, usamos 18:00 como referência padrão
    if (!effectiveSunset) {
        const fallback = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 18, 0, 0);
        effectiveSunset = fallback.getTime();
    }

    // A cada pôr do sol (Shekiyah), a data haláchica vira para o novo dia (a cada pôr do sol muda)
    let d = new Date(date.getTime());
    if (nowMs >= effectiveSunset) {
        d.setDate(d.getDate() + 1);
    }

    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

/**
 * Retorna a chave de data do dia local no formato YYYY-MM-DD.
 */
export function getDailyDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Obtém a passagem da categoria para o ciclo atual de 8 horas (3 vezes ao dia).
 * A rotação é determinística e muda a cada 8 horas, acompanhando os 3 momentos
 * tradicionais de estudo e reflexão no Judaísmo (Shacharit / Mincha / Arvit).
 * 
 * @param {string} category Categoria literária
 * @param {Date} [date] Data de referência (padrão: agora)
 * @param {number|null} [sunsetTime] Timestamp do pôr do sol
 */
export function getDailyReadingForCategory(category, date = new Date(), sunsetTime = null) {
    const pool = DAILY_READINGS_POOL[category];
    if (!pool || pool.length === 0) return null;

    // Ciclo dinâmico de 8 em 8 horas (3 intervalos diários: Manhã, Tarde e Noite)
    const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
    const cycleIndex = Math.floor(date.getTime() / EIGHT_HOURS_MS);
    const offset = DAILY_CATEGORY_OFFSETS[category] || 0;
    const index = Math.abs(cycleIndex + offset) % pool.length;

    return pool[index];
}

export const SEFARIA_CARD_SUBTITLES = Object.freeze({
    'Mishnah': 'Tradição Oral',
    'Talmud': 'Debate Rabínico',
    'Halakhah': 'Lei Prática',
    'Midrash': 'Sabedoria Rabínica',
    'Chasidut': 'Devoção Interior',
    'Kabbalah': 'Misticismo Oculto'
});

/**
 * Atualiza o cartão de literatura judaica no DOM com a passagem do ciclo atual de 8 horas.
 * O título do cartão exibe o nome da parte (ex.: Pirkei Avot 3) e o subtítulo a tradição.
 * 
 * @param {Date} [date] Data de referência
 * @param {number|null} [sunsetTime] Timestamp do pôr do sol
 */
export function applyDailyReadingsToCards(date = new Date(), sunsetTime = null) {
    if (typeof document === 'undefined') return;

    const currentItem = getUnifiedLiteratureReading(date) || getRandomLiteratureItem();
    if (!currentItem) return;

    const partTitle = currentItem.displayTitle || currentItem.ref || '';
    const subTitle = (currentItem.category && SEFARIA_CARD_SUBTITLES[currentItem.category]) || 'Obras Clássicas';
    const categoryIcon = (currentItem.category && CATEGORY_ICONS[currentItem.category]) || 'fa-solid fa-building-columns';

    const singleCard = document.getElementById('card-sefaria-single');
    if (singleCard) {
        const titleEl = singleCard.querySelector('.settings-card-title');
        const descEl = singleCard.querySelector('.settings-card-desc');
        const iconEl = singleCard.querySelector('i');

        if (titleEl && titleEl.textContent !== partTitle) {
            titleEl.textContent = partTitle;
        }
        if (descEl && descEl.textContent !== subTitle) {
            descEl.textContent = subTitle;
            descEl.style.display = '';
        }
        if (iconEl && categoryIcon) {
            iconEl.className = `${categoryIcon} settings-icon`;
        }
        singleCard.setAttribute('data-ref', currentItem.ref || '');
        singleCard.setAttribute('data-category', currentItem.category || '');
        singleCard.setAttribute('aria-label', partTitle);
        singleCard.classList.remove('not-ready');
    }
}


