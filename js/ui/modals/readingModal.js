/**
 * READINGMODAL.JS - MODAL DE LEITURA DAS ESCRITURAS SAGRADAS
 * 
 * Orquestra a exibição acessível de versículos bíblicos da Torá, Haftará
 * e Ketuvim, sanitização anti-XSS, diagnóstico detalhado e sugestões
 * de leitura subsequente (discovery loop).
 */

import { toHebrewBookName, parseRef } from '../../domain/scriptureRef.js';
import { escapeHtml } from '../../domain/formatters.js';
import { fetchBibleVerses } from '../../services/bibleService.js';
import { getReadingSkeletonHTML } from '../components/skeleton.js';
import { closeOtherModalsOnDesktop } from './modalManager.js';
import { trackMicroAction } from '../../utils/umamiMonitor.js';

/**
 * Abre o modal de leitura com a referência e título fornecidos.
 */
export async function openReadingModal(ref, cardTitle) {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('reading-modal');
    const titleEl = document.getElementById('reading-modal-title');
    const bodyEl = document.getElementById('reading-modal-body');
    if (!modal || !titleEl || !bodyEl) return;

    trackMicroAction('modal_open', { modal: 'reading', ref, title: cardTitle });

    closeOtherModalsOnDesktop('reading-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (typeof history !== 'undefined' && (!history.state || !history.state.modalOpen)) {
        history.pushState({ modalOpen: true }, '');
    }
    if (typeof sessionStorage !== 'undefined') {
        try {
            sessionStorage.setItem('openReadingModalRef', ref);
            sessionStorage.setItem('openReadingModalTitle', cardTitle);
        } catch (e) { }
    }

    titleEl.textContent = '';
    bodyEl.innerHTML = `
        <div class="thematic-loader-container">
            <div class="thematic-star-loader" role="status" aria-label="A carregar">
                <i class="fa-solid fa-star-of-david" aria-hidden="true"></i>
            </div>
        </div>
    `;

    try {
        const parsed = parseRef(ref);
        if (!parsed) throw new Error('Referência não reconhecida.');
        const { verses, translation, isCache } = await fetchBibleVerses(parsed, ref);
        if (verses.length === 0) throw new Error('Nenhum texto encontrado para esta referência.');

        titleEl.textContent = cardTitle;

        if (isCache) {
            console.log(`[Scripture] Leitura servida da cache: ${translation} • ${ref}`);
        } else {
            console.log(`[Scripture] Leitura carregada via API: ${translation} • ${ref}`);
        }

        let html = '<div class="verses-container">';
        let currentSectionBook = null;
        const hasMultipleBooks = new Set(verses.map(v => v.bookName).filter(Boolean)).size > 1;

        for (const v of verses) {
            currentSectionBook = v.bookName;

            const displayNum = `${v.chapter}:${v.verse}`;
            html += `
                <div class="legend-card" style="align-items: flex-start; margin: 0;">
                    <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px;">
                        <div class="verse-text" style="padding-right: 0; text-align: left; font-size: var(--font-size-sm); white-space: normal; overflow: visible; text-overflow: clip;"><strong style="font-size: 0.78rem; opacity: 0.75; margin-right: 6px;">${displayNum}</strong>${escapeHtml(v.text)}</div>
                    </div>
                </div>
            `;
        }
        html += '</div>';
        bodyEl.innerHTML = html;
        bodyEl.scrollTop = 0;
    } catch (err) {
        console.warn(`[Scripture] Falha ao carregar leitura (${ref}):`, err?.message || 'Erro de rede');

        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        bodyEl.innerHTML = `
            <div class="reading-error">
                <span class="reading-error-title">${!isOnline ? 'Conexão Indisponível' : 'Texto Indisponível'}</span>
                <span class="reading-error-message">${!isOnline ? 'Não foi possível carregar o texto sagrado no momento. Verifique sua conexão.' : 'Não foi possível carregar a passagem sagrada no momento.'}</span>
                <small class="reading-error-detail">Tente novamente ou selecione outra passagem.</small>
            </div>
        `;
    }
}
