/**
 * INFOMODAL.JS - MODAL DE ESTUDOS TEOLÓGICOS E INFORMAÇÕES
 * 
 * Gerencia a exibição de conteúdos enriquecidos com pilha de navegação interna
 * (push/pop view), botão voltar e sincronização com o histórico do navegador.
 */

import { closeModalSafely, checkModalsActive, openModalElement } from './modalManager.js';
import { ensureTwoWords } from '../../domain/formatters.js';

let infoModalStack = [];
let returnToModalId = null;

export function getInfoModalStackLength() {
    return infoModalStack.length + (returnToModalId ? 1 : 0);
}

let activeKofiTimers = [];

export function clearKofiTimers() {
    activeKofiTimers.forEach(t => clearTimeout(t));
    activeKofiTimers = [];
    const modal = document.getElementById('info-modal');
    if (modal) modal.classList.remove('has-kofi-embed');
}

function setupKofiFrameLoaders(container) {
    if (!container) return;
    clearKofiTimers();

    const wrappers = container.querySelectorAll('.kofi-embed-iframe-wrapper');
    wrappers.forEach(wrapper => {
        const frame = wrapper.querySelector('.kofi-modal-frame');
        const statusEl = wrapper.querySelector('.kofi-loading-status');
        const noticeEl = wrapper.querySelector('.kofi-loading-notice');
        const indicator = wrapper.querySelector('.kofi-loading-indicator');

        const dismiss = () => {
            wrapper.classList.add('is-loaded');
            clearKofiTimers();
        };

        if (frame) {
            frame.addEventListener('load', dismiss, { once: true });
            frame.addEventListener('error', dismiss, { once: true });
        }

        // Aviso 1: Se demorar mais de 3 segundos, atualiza o texto de estado
        activeKofiTimers.push(setTimeout(() => {
            if (!wrapper.classList.contains('is-loaded') && statusEl) {
                statusEl.textContent = 'A estabelecer ligação segura...';
            }
        }, 3000));

        // Aviso 2: Se demorar mais de 5.5 segundos, exibe o aviso detalhado com botão de abertura
        activeKofiTimers.push(setTimeout(() => {
            if (!wrapper.classList.contains('is-loaded')) {
                if (statusEl) {
                    statusEl.textContent = 'Ligação prolongada em curso...';
                }
                if (noticeEl) {
                    noticeEl.classList.add('is-visible');
                }
            }
        }, 5500));

        // Fallback final: após 12 segundos liberta a sobreposição
        activeKofiTimers.push(setTimeout(() => {
            if (!wrapper.classList.contains('is-loaded')) {
                dismiss();
            }
        }, 12000));
    });
}

/**
 * Abre o modal de informações com o título e conteúdo especificados.
 */
export function openInfoModal(titleText, htmlContent, options = {}) {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('info-modal');
    const titleEl = document.getElementById('info-modal-title');
    const bodyEl = document.getElementById('info-modal-body');
    const backBtn = document.getElementById('back-info-btn');
    const closeBtn = document.getElementById('close-info-btn');

    if (!modal || !titleEl || !bodyEl) return;

    returnToModalId = options.returnToModalId || null;
    infoModalStack = [{ title: titleText, html: htmlContent }];

    const showBack = !!returnToModalId;
    if (backBtn) backBtn.classList.toggle('is-hidden', !showBack);
    if (closeBtn) closeBtn.classList.toggle('is-hidden', showBack);

    titleEl.textContent = (titleText && titleText.trim()) ? titleText.trim() : 'Informação Sagrada';
    bodyEl.innerHTML = htmlContent;
    bodyEl.scrollTop = 0;
    setupKofiFrameLoaders(bodyEl);

    const hasKofi = bodyEl.querySelector('.kofi-embed-iframe-wrapper') !== null;
    modal.classList.toggle('has-kofi-embed', hasKofi);

    openModalElement(modal, 'informacoes', options);

    if (typeof sessionStorage !== 'undefined') {
        try {
            sessionStorage.setItem('openInfoModalTitle', titleText);
        } catch (e) { }
    }
}

/**
 * Empilha uma nova visão no modal de informações mantendo o histórico navegável.
 */
export function pushInfoModalView(titleText, htmlContent) {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('info-modal');
    const titleEl = document.getElementById('info-modal-title');
    const bodyEl = document.getElementById('info-modal-body');
    const backBtn = document.getElementById('back-info-btn');
    const closeBtn = document.getElementById('close-info-btn');

    if (!modal || !titleEl || !bodyEl) return;

    infoModalStack.push({ title: titleText, html: htmlContent });
    if (backBtn) backBtn.classList.remove('is-hidden');
    if (closeBtn) closeBtn.classList.add('is-hidden');

    titleEl.textContent = (titleText && titleText.trim()) ? titleText.trim() : 'Informação Sagrada';
    bodyEl.innerHTML = htmlContent;
    bodyEl.scrollTop = 0;
    setupKofiFrameLoaders(bodyEl);
    modal.classList.toggle('has-kofi-embed', bodyEl.querySelector('.kofi-embed-iframe-wrapper') !== null);

    if (typeof sessionStorage !== 'undefined') {
        try {
            sessionStorage.setItem('openInfoModalTitle', titleText);
        } catch (e) { }
    }
}

/**
 * Retorna para a visão anterior na pilha do modal ou fecha o modal (ou retorna ao modal de origem) caso esteja na raiz.
 */
export function popInfoModalView() {
    if (infoModalStack.length <= 1) {
        if (typeof document !== 'undefined') {
            const parentId = returnToModalId;
            returnToModalId = null;
            closeModalSafely(document.getElementById('info-modal'), { skipUrlSync: !!parentId });
            if (parentId) {
                const parentEl = document.getElementById(parentId);
                if (parentEl) {
                    const slug = parentId === 'zmanim-modal' ? 'horarios' : (parentId === 'day-details-modal' ? 'detalhes-dia' : '');
                    openModalElement(parentEl, slug);
                }
            }
        }
        return;
    }

    infoModalStack.pop();
    const prev = infoModalStack[infoModalStack.length - 1];
    const modal = document.getElementById('info-modal');
    const titleEl = document.getElementById('info-modal-title');
    const bodyEl = document.getElementById('info-modal-body');
    const backBtn = document.getElementById('back-info-btn');
    const closeBtn = document.getElementById('close-info-btn');

    if (titleEl && bodyEl && prev) {
        titleEl.textContent = (prev.title && prev.title.trim()) ? prev.title.trim() : 'Informação Sagrada';
        bodyEl.innerHTML = prev.html;
        bodyEl.scrollTop = 0;
        setupKofiFrameLoaders(bodyEl);
        if (modal) {
            modal.classList.toggle('has-kofi-embed', bodyEl.querySelector('.kofi-embed-iframe-wrapper') !== null);
        }
        if (typeof sessionStorage !== 'undefined') {
            try {
                sessionStorage.setItem('openInfoModalTitle', prev.title);
            } catch (e) { }
        }
    }

    const isSub = infoModalStack.length > 1 || !!returnToModalId;
    if (backBtn) backBtn.classList.toggle('is-hidden', !isSub);
    if (closeBtn) closeBtn.classList.toggle('is-hidden', isSub);
}
