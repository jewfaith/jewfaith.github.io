/**
 * BIBLEAPI.JS - CLIENTE DE CONSULTA À API DE ESCRITURAS (BOLLS.LIFE)
 * 
 * Executa requisições assíncronas para obtenção de textos bíblicos da Tanakh,
 * com fallback simultâneo entre versões em língua portuguesa (NVT, OL, AA).
 */

/**
 * Consulta um capítulo específico de um livro na API Bolls com fallback de traduções.
 */
export async function fetchChapterFromApi(bookId, chapter, preferredVersion = null) {
    let actualBookId = bookId;
    let actualCh = chapter;

    // Normalização de divisões de livros em versões ocidentais vs. Tanakh
    if (actualBookId === 13 && actualCh > 29) { actualBookId = 14; actualCh = actualCh - 29; }
    else if (actualBookId === 9 && actualCh > 31) { actualBookId = 10; actualCh = actualCh - 31; }
    else if (actualBookId === 11 && actualCh > 22) { actualBookId = 12; actualCh = actualCh - 22; }
    else if (actualBookId === 15 && actualCh > 10) { actualBookId = 16; actualCh = actualCh - 10; }

    let translations = ['NVT', 'OL', 'AA'];
    if (preferredVersion && translations.includes(preferredVersion)) {
        translations = [preferredVersion, ...translations.filter(t => t !== preferredVersion)];
    }

    const diagnosticLog = [];

    const fetchPromise = (trans) => new Promise(async (resolve, reject) => {
        const url = `https://bolls.life/get-chapter/${trans}/${actualBookId}/${actualCh}/`;
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 8000);
        const startTime = performance.now();
        try {
            const res = await fetch(url, { signal: ctrl.signal });
            const duration = Math.round(performance.now() - startTime);
            clearTimeout(tid);

            diagnosticLog.push({
                endpoint: 'Bolls.life', translation: trans, url: url,
                status: res.status, statusText: res.statusText,
                durationMs: duration, success: res.ok, error: res.ok ? null : `HTTP Status ${res.status}`
            });

            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    resolve({ data, trans });
                    return;
                }
                reject(new Error(`Dados vazios para ${trans}`));
                return;
            }
            reject(new Error(`HTTP ${res.status} para ${trans}`));
        } catch (e) {
            const duration = Math.round(performance.now() - startTime);
            clearTimeout(tid);
            diagnosticLog.push({
                endpoint: 'Bolls.life', translation: trans, url: url,
                status: 0, statusText: 'Network Exception/Timeout',
                durationMs: duration, success: false, error: e.name === 'AbortError' ? 'Timeout (8000ms)' : e.message
            });
            reject(e);
        }
    });

    try {
        const result = await Promise.any(translations.map(t => fetchPromise(t)));
        if (typeof window !== 'undefined') {
            window.lastReadingDiagnostic = diagnosticLog;
        }
        return result;
    } catch (err) {
        if (typeof window !== 'undefined') {
            window.lastReadingDiagnostic = diagnosticLog;
        }
        throw new Error('Não foi possível carregar o capítulo de nenhum dos servidores.');
    }
}
