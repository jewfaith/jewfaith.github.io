/**
 * BIBLESERVICE.JS - SERVIÇO DE APLICAÇÃO PARA LEITURA BÍBLICA
 * 
 * Orquestra a obtenção de capítulos e versículos da Tanakh/Bíblia,
 * gerindo estratégias de cache offline, alinhamento ecuménico de versículos
 * e seleção de traduções em língua portuguesa.
 */

import { cleanText } from '../domain/scriptureRef.js';
import { fetchChapterFromApi } from '../api/bibleApi.js';

const PT_TRANSLATIONS = ['NVT', 'OL', 'AA'];

/**
 * Remove versões bíblicas descontinuadas ou caches corrompidos.
 */
export function purgeLegacyBibleCache() {
    if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') return;
    try {
        const pref = localStorage.getItem('preferred_bible_version');
        if (pref && !PT_TRANSLATIONS.includes(pref)) {
            localStorage.removeItem('preferred_bible_version');
        }
        [localStorage, sessionStorage].forEach(storage => {
            if (!storage) return;
            for (let i = storage.length - 1; i >= 0; i--) {
                const key = storage.key(i);
                if (key && key.startsWith('bible_cache_')) {
                    try {
                        const item = JSON.parse(storage.getItem(key));
                        if (!item || !item.translation || !PT_TRANSLATIONS.includes(item.translation)) {
                            storage.removeItem(key);
                        }
                    } catch (e) {
                        storage.removeItem(key);
                    }
                }
            }
        });
    } catch (e) { }
}

// Executa limpeza preventiva de versões antigas
purgeLegacyBibleCache();

/**
 * Obtém todos os versículos para uma referência analisada.
 */
export async function fetchBibleVerses(parsed, refKey) {
    if (!parsed) return { verses: [], translation: '', isCache: false };

    const cacheKey = 'bible_cache_' + (refKey || '').replace(/\s+/g, '_');
    let cached = null;
    let preferredVersion = null;
    try {
        cached = localStorage.getItem(cacheKey) || sessionStorage.getItem(cacheKey);
        preferredVersion = localStorage.getItem('preferred_bible_version');
    } catch (e) { }

    if (cached) {
        try {
            const parsedCache = JSON.parse(cached);
            if (parsedCache && parsedCache.verses && parsedCache.verses.length > 0) {
                if (preferredVersion) {
                    if (parsedCache.translation === preferredVersion) return { ...parsedCache, isCache: true };
                } else if (PT_TRANSLATIONS.includes(parsedCache.translation)) {
                    return { ...parsedCache, isCache: true };
                }
            }
            try {
                localStorage.removeItem(cacheKey);
                sessionStorage.removeItem(cacheKey);
            } catch (e2) { }
        } catch (e) { }
    }

    const sections = parsed.sections || [parsed];
    const allVerses = [];
    const chapterCache = {};

    async function getChapterData(bookId, ch) {
        const cKey = `${bookId}_${ch}`;
        if (chapterCache[cKey]) return chapterCache[cKey];
        const result = await fetchChapterFromApi(bookId, ch, preferredVersion);
        chapterCache[cKey] = result;
        return result;
    }

    let chosenTranslation = '';
    for (const sec of sections) {
        const { bookId, bookName, ranges } = sec;
        for (const range of ranges) {
            const { startChapter, startVerse, endChapter, endVerse } = range;

            // Tratamento especial: Malachi 3:4-24 abrange Malachi 3 e 4 nas versões cristãs
            if (bookId === 39 && startChapter === 3 && endChapter === 3 && endVerse && endVerse > 18) {
                const { data: data3, trans: trans3 } = await getChapterData(39, 3);
                chosenTranslation = trans3;
                for (const v of data3) {
                    if (startVerse !== null && v.verse < startVerse) continue;
                    if (v.verse > 18) continue;
                    allVerses.push({ bookName, chapter: 3, verse: v.verse, text: cleanText(v.text) });
                }
                const maxCh4 = Math.min(6, endVerse - 18);
                const { data: data4 } = await getChapterData(39, 4);
                for (const v of data4) {
                    if (v.verse > maxCh4) continue;
                    const hebVerse = 18 + v.verse;
                    allVerses.push({ bookName, chapter: 3, verse: hebVerse, text: cleanText(v.text) });
                }
                continue;
            }

            for (let ch = startChapter; ch <= endChapter; ch++) {
                const { data, trans } = await getChapterData(bookId, ch);
                chosenTranslation = trans;

                // Tratamento especial: Hoshea 14 (Hebraico 14:2-10 corresponde a NVT/OL 14:1-9)
                if (bookId === 28 && ch === 14) {
                    for (const v of data) {
                        const hebVerse = v.verse + 1; // Verso 1 na tradução é o Verso 2 no Tanakh
                        if (startVerse !== null && hebVerse < startVerse) continue;
                        if (endVerse !== null && hebVerse > endVerse) continue;
                        allVerses.push({ bookName, chapter: ch, verse: hebVerse, text: cleanText(v.text) });
                    }
                } else {
                    for (const v of data) {
                        const vNum = v.verse;
                        if (ch === startChapter && startVerse !== null && vNum < startVerse) continue;
                        if (ch === endChapter && endVerse !== null && vNum > endVerse) continue;

                        allVerses.push({ bookName, chapter: ch, verse: vNum, text: cleanText(v.text) });
                    }
                }
            }
        }
    }

    const payload = { verses: allVerses, translation: chosenTranslation, isCache: false };
    if (allVerses.length > 0) {
        try {
            localStorage.setItem(cacheKey, JSON.stringify(payload));
        } catch (e) {
            try { sessionStorage.setItem(cacheKey, JSON.stringify(payload)); } catch (e2) { }
        }
    }

    return payload;
}
