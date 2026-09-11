/**
 * SEFARIAMODAL.JS - INTERFACE DE LITERATURA JUDAICA SEFARIA
 * 
 * Exibe a leitura da Literatura Judaica diretamente em texto acessível,
 * com suporte a hebraico e português e sem elementos redundantes.
 */

import {
    getUnifiedLiteratureReading,
    getRandomLiteratureItem,
    getRandomCategory,
    fetchReadingByRef,
    getRandomReading,
    applyDailyReadingsToCards
} from '../../services/sefariaService.js';
import { escapeHtml, formatHebrewInText } from '../../domain/formatters.js';
import { closeModalSafely, closeOtherModalsOnDesktop } from './modalManager.js';
import { trackMicroAction } from '../../utils/umamiMonitor.js';

let isFetchingReading = false;
let isSefariaModalInitialized = false;

/**
 * Inicializa os ouvintes e gatilhos do modal Sefaria.
 */
export function initSefariaModal() {
    applyDailyReadingsToCards();

    if (isSefariaModalInitialized || typeof document === 'undefined') return;
    isSefariaModalInitialized = true;

    const triggerCards = document.querySelectorAll('.sefaria-category-card, #card-sefaria-random-wrapper, #card-sefaria-single');
    triggerCards.forEach(card => {
        const cat = card.getAttribute('data-category') || 'Mishnah';
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const targetRef = card.getAttribute('data-ref');
                openSefariaModal(cat, targetRef);
            }
        });
    });

    const closeBtn = document.getElementById('close-sefaria-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSefariaModal);
    }
}

/**
 * Abre o modal Sefaria exibindo a leitura literária.
 * O título do modal informa com precisão qual é a parte sendo lida (ex.: Pirkei Avot 3).
 */
export async function openSefariaModal(category = null, targetRef = null) {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('sefaria-modal');
    const body = document.getElementById('sefaria-modal-body');
    if (!modal || !body) return;

    const item = targetRef ? { ref: targetRef, category } : (getUnifiedLiteratureReading() || getRandomLiteratureItem());
    const partTitle = targetRef || item?.displayTitle || item?.ref || '';

    const titleEl = document.getElementById('sefaria-modal-title');
    const subtitleEl = document.getElementById('sefaria-modal-subtitle');
    if (titleEl) {
        titleEl.textContent = partTitle;
    }
    if (subtitleEl) {
        subtitleEl.textContent = '';
        subtitleEl.style.display = 'none';
    }

    trackMicroAction('modal_open', { modal: 'sefaria_reading', ref: partTitle });

    closeOtherModalsOnDesktop('sefaria-modal');
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';

    if (typeof history !== 'undefined' && (!history.state || !history.state.sefariaModalOpen)) {
        history.pushState({ sefariaModalOpen: true }, '');
    }

    // Durante o carregamento inicial, exibe estritamente o loader temático centralizado
    body.innerHTML = renderLoadingState();

    await renderSefariaModalView(targetRef, category);
}

/**
 * Fecha o modal Sefaria com segurança.
 */
export function closeSefariaModal() {
    const modal = document.getElementById('sefaria-modal');
    if (!modal) return;
    closeModalSafely(modal);
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
}

/**
 * Renderiza o carregador temático centralizado (sem textos ou esqueletos).
 */
function renderLoadingState() {
    return `
        <div class="thematic-loader-container" style="min-height: 240px; display: flex; align-items: center; justify-content: center;">
            <div class="thematic-star-loader" role="status" aria-label="A carregar">
                <i class="fa-solid fa-star-of-david" aria-hidden="true"></i>
            </div>
        </div>
    `;
}

/**
 * Renderiza a leitura diretamente no corpo do modal.
 */
async function renderSefariaModalView(targetRef = null, category = null) {
    const body = document.getElementById('sefaria-modal-body');
    if (!body) return;

    if (isFetchingReading) return;
    isFetchingReading = true;

    try {
        let reading;
        if (targetRef) {
            reading = await fetchReadingByRef(targetRef, category);
        } else {
            const item = getUnifiedLiteratureReading() || getRandomLiteratureItem();
            if (item) {
                reading = await fetchReadingByRef(item.ref, item.category);
            } else {
                reading = await getRandomReading(getRandomCategory());
            }
        }

        body.innerHTML = renderReadingContent(reading);

        if (reading && reading.ok) {
            const titleEl = document.getElementById('sefaria-modal-title');
            if (titleEl) {
                titleEl.textContent = reading.ref || reading.title || '';
            }
        }

        const retryBtn = document.getElementById('sefaria-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', async () => {
                body.innerHTML = renderLoadingState();
                await renderSefariaModalView(targetRef, category);
            });
        }
    } catch (err) {
        body.innerHTML = renderReadingContent({ ok: false, error: err?.message || 'Falha ao obter texto' });
    } finally {
        isFetchingReading = false;
    }
}

/**
 * Renderiza exclusivamente a lista de parágrafos da leitura,
 * no mesmo formato visual do modal de leituras bíblicas (capítulo:versículo).
 */
function renderReadingContent(reading) {
    if (!reading || !reading.ok) {
        return `
            <div class="reading-error" style="text-align: center; padding: 28px 14px;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 24px; color: var(--text-muted); margin-bottom: 8px;"></i>
                <span class="reading-error-title" style="display: block; font-weight: 700; margin-bottom: 4px;">
                    ${escapeHtml(reading?.error || 'Erro na Leitura')}
                </span>
                <p style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: 14px;">
                    Não foi possível carregar o texto da Sefaria no momento. Tente novamente.
                </p>
                <button type="button" id="sefaria-retry-btn" class="settings-card glass-panel" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 12px; cursor: pointer; border: 0.5px solid var(--accent-color); color: var(--accent-color); font-weight: 700; font-size: var(--font-size-sm); margin: 0 auto;">
                    <i class="fa-solid fa-arrows-rotate"></i>
                    <span>Tentar Novamente</span>
                </button>
            </div>
        `;
    }

    // Extrai o número do capítulo/secção da referência (ex.: "Pirkei Avot 3" → "3", "Berakhot 2a" → "2a")
    const refStr = reading.ref || '';
    const sectionMatch = refStr.match(/\s(\d+[ab]?)(?::.*)?$/);
    const sectionNum = sectionMatch ? sectionMatch[1] : '';

    const paragraphsHtml = (reading.paragraphs || []).map((p, idx) => {
        const verseNum = idx + 1;
        const displayNum = sectionNum ? `${sectionNum}:${verseNum}` : `${verseNum}`;
        return `
            <div class="legend-card" style="align-items: flex-start; margin: 0;">
                <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px;">
                    <div class="verse-text" style="padding-right: 0; text-align: left; font-size: var(--font-size-sm); white-space: normal; overflow: visible; text-overflow: clip;"><strong style="font-size: 0.78rem; opacity: 0.75; margin-right: 6px;">${displayNum}</strong>${formatHebrewInText(escapeHtml(p))}</div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="verses-container">
            ${paragraphsHtml}
        </div>
    `;
}
