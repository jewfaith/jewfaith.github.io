/**
 * READINGSVIEW.JS - MÓDULO INTERATIVO DE LEITURAS UNIFICADAS
 * 
 * Layout limpo, minimalista e direto inspirado no design de mockups nativos:
 * Seletores superiores flutuantes lado a lado (Livro e Perek) e fluxo contínuo
 * de versículos em cards individuais logo abaixo, sem divisões ou botões extras.
 */

import { parseRef } from '../../domain/scriptureRef.js';
import { fetchBibleVerses } from '../../services/bibleService.js';
import { fetchReadingByRef } from '../../services/sefariaService.js';
import { escapeHtml, formatHebrewInText } from '../../domain/formatters.js';
import { trackMicroAction } from '../../utils/umamiMonitor.js';
import { initCustomSelects, syncCustomSelect } from '../components/customSelect.js';

export const TANAKH_DIVISIONS = {
    torah: {
        id: 'torah',
        name: 'Torah',
        desc: 'Torah • Chamishah Chumshei Torah',
        books: [
            { id: 'Bereshit', name: 'Bereshit', chapters: 50 },
            { id: 'Shemot', name: 'Shemot', chapters: 40 },
            { id: 'Vayikra', name: 'Vayikra', chapters: 27 },
            { id: 'Bamidbar', name: 'Bamidbar', chapters: 36 },
            { id: 'Devarim', name: 'Devarim', chapters: 34 }
        ]
    },
    neviim: {
        id: 'neviim',
        name: "Nevi'im",
        desc: 'Nevi\'im • Livros Proféticos',
        books: [
            { id: 'Yehoshua', name: 'Yehoshua', chapters: 24 },
            { id: 'Shoftim', name: 'Shoftim', chapters: 21 },
            { id: 'I Shmuel', name: 'I Shmuel', chapters: 31 },
            { id: 'II Shmuel', name: 'II Shmuel', chapters: 24 },
            { id: 'I Melachim', name: 'I Melachim', chapters: 22 },
            { id: 'II Melachim', name: 'II Melachim', chapters: 25 },
            { id: 'Yeshayahu', name: 'Yeshayahu', chapters: 66 },
            { id: 'Yirmiyahu', name: 'Yirmiyahu', chapters: 52 },
            { id: 'Yechezkel', name: 'Yechezkel', chapters: 48 },
            { id: 'Hoshea', name: 'Hoshea', chapters: 14 },
            { id: 'Yoel', name: 'Yoel', chapters: 4 },
            { id: 'Amos', name: 'Amos', chapters: 9 },
            { id: 'Ovadia', name: 'Ovadia', chapters: 1 },
            { id: 'Yona', name: 'Yona', chapters: 4 },
            { id: 'Micha', name: 'Micha', chapters: 7 },
            { id: 'Nachum', name: 'Nachum', chapters: 3 },
            { id: 'Chavakuk', name: 'Chavakuk', chapters: 3 },
            { id: 'Tzefania', name: 'Tzefania', chapters: 3 },
            { id: 'Chagai', name: 'Chagai', chapters: 2 },
            { id: 'Zecharia', name: 'Zecharia', chapters: 14 },
            { id: 'Malachi', name: 'Malachi', chapters: 4 }
        ]
    },
    ketuvim: {
        id: 'ketuvim',
        name: 'Ketuvim',
        desc: 'Ketuvim • Escritos Sagrados',
        books: [
            { id: 'Tehilim', name: 'Tehilim', chapters: 150 },
            { id: 'Mishlei', name: 'Mishlei', chapters: 31 },
            { id: 'Iyov', name: 'Iyov', chapters: 42 },
            { id: 'Shir HaShirim', name: 'Shir HaShirim', chapters: 8 },
            { id: 'Ruth', name: 'Ruth', chapters: 4 },
            { id: 'Eichah', name: 'Eichah', chapters: 5 },
            { id: 'Kohelet', name: 'Kohelet', chapters: 12 },
            { id: 'Esther', name: 'Esther', chapters: 10 },
            { id: 'Daniel', name: 'Daniel', chapters: 12 },
            { id: 'Ezra', name: 'Ezra', chapters: 10 },
            { id: 'Nechemia', name: 'Nechemia', chapters: 13 },
            { id: 'I Divrei Hayamim', name: 'I Divrei Hayamim', chapters: 29 },
            { id: 'II Divrei Hayamim', name: 'II Divrei Hayamim', chapters: 36 }
        ]
    }
};

export const TRADITIONS_DATA = {
    Mishnah: {
        name: 'Mishnah',
        desc: 'Torah Shebe\'al Peh',
        works: [
            {
                name: 'Pirkei Avot',
                sections: [
                    { ref: 'Pirkei Avot 1', label: 'Perek 1' },
                    { ref: 'Pirkei Avot 2', label: 'Perek 2' },
                    { ref: 'Pirkei Avot 3', label: 'Perek 3' },
                    { ref: 'Pirkei Avot 4', label: 'Perek 4' },
                    { ref: 'Pirkei Avot 5', label: 'Perek 5' },
                    { ref: 'Pirkei Avot 6', label: 'Perek 6' }
                ]
            },
            {
                name: 'Mishnah Berakhot',
                sections: [
                    { ref: 'Mishnah Berakhot 1', label: 'Perek 1' },
                    { ref: 'Mishnah Berakhot 2', label: 'Perek 2' }
                ]
            }
        ]
    },
    Talmud: {
        name: 'Talmud',
        desc: 'Gemara',
        works: [
            {
                name: 'Berakhot',
                sections: [
                    { ref: 'Berakhot 2a', label: 'Daf 2a' },
                    { ref: 'Berakhot 2b', label: 'Daf 2b' },
                    { ref: 'Berakhot 3a', label: 'Daf 3a' },
                    { ref: 'Berakhot 3b', label: 'Daf 3b' },
                    { ref: 'Berakhot 4a', label: 'Daf 4a' },
                    { ref: 'Berakhot 4b', label: 'Daf 4b' },
                    { ref: 'Berakhot 5a', label: 'Daf 5a' },
                    { ref: 'Berakhot 5b', label: 'Daf 5b' }
                ]
            },
            {
                name: 'Shabbat',
                sections: [
                    { ref: 'Shabbat 2a', label: 'Daf 2a' },
                    { ref: 'Shabbat 2b', label: 'Daf 2b' },
                    { ref: 'Shabbat 3a', label: 'Daf 3a' },
                    { ref: 'Shabbat 3b', label: 'Daf 3b' }
                ]
            }
        ]
    },
    Halakhah: {
        name: 'Halakhah',
        desc: 'Halakhah',
        works: [
            {
                name: 'Shulchan Arukh',
                sections: [
                    { ref: 'Shulchan Arukh, Orach Chayim 1', label: 'Siman 1 • Hashkamat HaBoker' },
                    { ref: 'Shulchan Arukh, Orach Chayim 2', label: 'Siman 2 • Levishat Begadim' },
                    { ref: 'Shulchan Arukh, Orach Chayim 3', label: 'Siman 3 • Hanhagat Beit HaKise' },
                    { ref: 'Shulchan Arukh, Orach Chayim 4', label: 'Siman 4 • Netilat Yadayim' },
                    { ref: 'Shulchan Arukh, Orach Chayim 5', label: 'Siman 5 • Kavanat HaBerakhot' },
                    { ref: 'Shulchan Arukh, Orach Chayim 6', label: 'Siman 6 • Seder Berakhot' },
                    { ref: 'Shulchan Arukh, Orach Chayim 7', label: 'Siman 7 • Asher Yatzar' }
                ]
            },
            {
                name: 'Ben Ish Hai',
                sections: [
                    { ref: 'Ben Ish Hai, Introduction 1', label: 'Petichah 1' }
                ]
            }
        ]
    },
    Midrash: {
        name: 'Midrash',
        desc: 'Midrash',
        works: [
            {
                name: 'Mekhilta',
                sections: [
                    { ref: 'Mekhilta DeRabbi Shimon Ben Yochai 3', label: 'Perek 3' },
                    { ref: 'Mekhilta DeRabbi Shimon Ben Yochai 4', label: 'Perek 4' },
                    { ref: 'Mekhilta DeRabbi Shimon Ben Yochai 6', label: 'Perek 6' },
                    { ref: 'Mekhilta DeRabbi Yishmael, Tractate Pischa 1', label: 'Pischa 1' }
                ]
            },
            {
                name: 'Sifrei Zuta',
                sections: [
                    { ref: 'Sifrei Zuta; Midrashah shel Lod, Preface', label: 'Hakdamah' }
                ]
            }
        ]
    },
    Chasidut: {
        name: 'Chasidut',
        desc: 'Chasidut',
        works: [
            {
                name: 'Tiferet Yosef',
                sections: [
                    { ref: 'Tiferet Yosef 1', label: 'Perek 1' }
                ]
            }
        ]
    }
};

export const ALL_TANAKH_BOOKS = [
    ...TANAKH_DIVISIONS.torah.books,
    ...TANAKH_DIVISIONS.neviim.books,
    ...TANAKH_DIVISIONS.ketuvim.books
];

export const ALL_TRADITION_WORKS = Object.values(TRADITIONS_DATA).flatMap(cat =>
    cat.works.map(w => ({ ...w, category: cat.name }))
);

let isReadingsInitialized = false;
let isLoadingReading = false;

/**
 * Inicialização principal da visualização de Leituras
 */
export function initReadingsView() {
    if (typeof document === 'undefined') return;

    const bookSelect = document.getElementById('readings-book-select');
    const chapterSelect = document.getElementById('readings-chapter-select');

    if (!bookSelect || !chapterSelect) return;

    if (!isReadingsInitialized) {
        isReadingsInitialized = true;

        // 1. Popula todas as obras (Tanakh + Tradições agrupadas sem divisão externa)
        populateUnifiedWorkSelect(bookSelect);

        // 2. Evento ao alterar Livro/Obra
        bookSelect.addEventListener('change', () => {
            const selectedVal = bookSelect.value;
            populateUnifiedChapterSelect(chapterSelect, selectedVal);
            syncCustomSelect(chapterSelect);
            loadAndDisplaySelectedReading();
        });

        // 3. Evento ao alterar Capítulo/Seção
        chapterSelect.addEventListener('change', () => {
            loadAndDisplaySelectedReading();
        });
    }

    // Inicializa seleção padrão (Bereshit 1) se ainda não preenchido
    if (!bookSelect.value) {
        bookSelect.value = 'Bereshit';
    }
    populateUnifiedChapterSelect(chapterSelect, bookSelect.value);

    // Inicializa componentes dropdown customizados com suporte a iOS glass
    initCustomSelects('#view-leituras select');

    // Carrega e exibe imediatamente o capítulo selecionado (ex: Bereshit 1)
    loadAndDisplaySelectedReading();
}

/**
 * Popula o primeiro seletor com todas as obras litúrgicas sem títulos de divisão ou optgroups
 */
function populateUnifiedWorkSelect(selectEl) {
    selectEl.innerHTML = '';

    // Todos os livros do Tanakh (Bereshit até Divrei Hayamim) sem rótulos de divisão
    ALL_TANAKH_BOOKS.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = b.name;
        if (b.id === 'Bereshit') opt.selected = true;
        selectEl.appendChild(opt);
    });

    // Obras das Tradições (Pirkei Avot, Talmud, Halakhah, etc.)
    ALL_TRADITION_WORKS.forEach(w => {
        const opt = document.createElement('option');
        opt.value = `tradition:${w.name}`;
        opt.textContent = w.name;
        selectEl.appendChild(opt);
    });
}

/**
 * Popula o segundo seletor com capítulos ou seções da obra atual
 */
function populateUnifiedChapterSelect(selectEl, workVal) {
    selectEl.innerHTML = '';

    if (workVal.startsWith('tradition:')) {
        const workName = workVal.replace('tradition:', '');
        const work = ALL_TRADITION_WORKS.find(w => w.name === workName) || ALL_TRADITION_WORKS[0];

        if (work && work.sections) {
            work.sections.forEach((sec, idx) => {
                const opt = document.createElement('option');
                opt.value = sec.ref;
                opt.textContent = sec.label;
                if (idx === 0) opt.selected = true;
                selectEl.appendChild(opt);
            });
        }
    } else {
        // Tanakh
        const book = ALL_TANAKH_BOOKS.find(b => b.id === workVal) || ALL_TANAKH_BOOKS[0];
        const totalChapters = book ? book.chapters : 50;

        for (let c = 1; c <= totalChapters; c++) {
            const opt = document.createElement('option');
            opt.value = String(c);
            opt.textContent = `Perek ${c}`;
            if (c === 1) opt.selected = true;
            selectEl.appendChild(opt);
        }
    }
}

/**
 * Carrega e renderiza o texto diretamente no fluxo de versículos
 */
async function loadAndDisplaySelectedReading() {
    const bookSelect = document.getElementById('readings-book-select');
    const chapterSelect = document.getElementById('readings-chapter-select');
    const streamContainer = document.getElementById('readings-verses-stream');

    if (!bookSelect || !chapterSelect || !streamContainer) return;
    if (isLoadingReading) return;

    isLoadingReading = true;
    streamContainer.setAttribute('aria-busy', 'true');

    // Loader temático sutil enquanto busca os versículos
    streamContainer.innerHTML = `
        <div class="thematic-loader-container" style="min-height: 180px;">
            <div class="thematic-star-loader" role="status" aria-label="A carregar texto">
                <i class="fa-solid fa-star-of-david" aria-hidden="true"></i>
            </div>
        </div>
    `;

    const workVal = bookSelect.value;
    const isTradition = workVal.startsWith('tradition:');

    // Atualiza a badge divisória com a referência ativa
    const badgeTextEl = document.getElementById('readings-current-badge-text');
    if (badgeTextEl) {
        if (isTradition) {
            const selectedOpt = chapterSelect.options[chapterSelect.selectedIndex];
            badgeTextEl.textContent = `${workVal.replace('tradition:', '')} • ${selectedOpt?.textContent || chapterSelect.value}`;
        } else {
            const book = ALL_TANAKH_BOOKS.find(b => b.id === workVal) || ALL_TANAKH_BOOKS[0];
            const chapter = parseInt(chapterSelect.value, 10) || 1;
            badgeTextEl.textContent = `${book.name} ${chapter}`;
        }
    }

    try {
        if (isTradition) {
            // Leitura da Tradição Rabínica (Sefaria)
            const workName = workVal.replace('tradition:', '');
            const targetRef = chapterSelect.value;
            const work = ALL_TRADITION_WORKS.find(w => w.name === workName);
            const category = work?.category || 'Mishnah';

            trackMicroAction('tradition_read', { work: workName, ref: targetRef });

            const reading = await fetchReadingByRef(targetRef, category);

            if (!reading || !reading.ok || !reading.paragraphs || reading.paragraphs.length === 0) {
                throw new Error(reading?.error || 'Não foi possível obter os parágrafos desta seção.');
            }

            const sectionMatch = targetRef.match(/\s(\d+[ab]?)(?::.*)?$/);
            const sectionNum = sectionMatch ? sectionMatch[1] : '1';

            let html = '';
            reading.paragraphs.forEach((p, idx) => {
                const verseNum = idx + 1;
                const displayNum = `${sectionNum}:${verseNum}`;
                const cleanText = String(p || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

                html += `
                    <div class="readings-verse-card">
                        <div class="readings-verse-body">
                            <strong class="readings-verse-num">${displayNum}</strong>
                            <span class="readings-verse-text">${formatHebrewInText(escapeHtml(cleanText))}</span>
                        </div>
                    </div>
                `;
            });

            streamContainer.innerHTML = html;
        } else {
            // Leitura do Tanakh (Bíblia)
            const book = ALL_TANAKH_BOOKS.find(b => b.id === workVal) || ALL_TANAKH_BOOKS[0];
            const chapter = parseInt(chapterSelect.value, 10) || 1;
            const refString = `${book.id} ${chapter}`;

            trackMicroAction('chapter_read', { book: book.id, chapter });

            const parsed = parseRef(refString);
            if (!parsed) throw new Error('Referência bíblica inválida.');

            const { verses } = await fetchBibleVerses(parsed, refString);

            if (!verses || verses.length === 0) {
                throw new Error('Nenhum versículo encontrado para este capítulo.');
            }

            let html = '';
            for (const v of verses) {
                const displayNum = `${v.chapter}:${v.verse}`;
                html += `
                    <div class="readings-verse-card">
                        <div class="readings-verse-body">
                            <strong class="readings-verse-num">${displayNum}</strong>
                            <span class="readings-verse-text">${escapeHtml(v.text)}</span>
                        </div>
                    </div>
                `;
            }

            streamContainer.innerHTML = html;
        }
    } catch (err) {
        console.warn('[ReadingsView] Erro ao carregar leitura:', err?.message);
        streamContainer.innerHTML = `
            <div class="readings-verse-card" style="text-align: center; padding: 28px 16px;">
                <div style="font-weight: 700; color: var(--error-color, #f85149); font-size: 15px; margin-bottom: 6px;">
                    Texto Indisponível
                </div>
                <div style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 14px;">
                    Não foi possível carregar os versículos no momento.
                </div>
                <button type="button" id="readings-retry-btn" class="settings-card glass-panel" style="margin: 0 auto; display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; cursor: pointer; border-radius: 12px;">
                    <i class="fa-solid fa-arrows-rotate"></i> <span>Tentar Novamente</span>
                </button>
            </div>
        `;

        document.getElementById('readings-retry-btn')?.addEventListener('click', () => {
            loadAndDisplaySelectedReading();
        });
    } finally {
        isLoadingReading = false;
        streamContainer.setAttribute('aria-busy', 'false');
    }
}

/**
 * Função de retrocompatibilidade para outros módulos
 */
export function updateTraditionsDailyCard() {}
