/**
 * INFOMODAL.JS - MODAL DE ESTUDOS TEOLÓGICOS E INFORMAÇÕES
 * 
 * Gerencia a exibição de conteúdos enriquecidos com pilha de navegação interna
 * (push/pop view), botão voltar e sincronização com o histórico do navegador.
 */

import { closeModalSafely } from './modalManager.js';

let infoModalStack = [];

/**
 * Abre o modal de informações com o título e conteúdo especificados.
 */
export function openInfoModal(titleText, htmlContent) {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('info-modal');
    const titleEl = document.getElementById('info-modal-title');
    const bodyEl = document.getElementById('info-modal-body');
    const backBtn = document.getElementById('back-info-btn');
    const closeBtn = document.getElementById('close-info-btn');

    if (!modal || !titleEl || !bodyEl) return;

    infoModalStack = [{ title: titleText, html: htmlContent }];
    if (backBtn) backBtn.style.display = 'none';
    if (closeBtn) closeBtn.style.display = 'flex';

    titleEl.textContent = titleText;
    bodyEl.innerHTML = htmlContent;
    bodyEl.scrollTop = 0;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    if (typeof history !== 'undefined' && (!history.state || !history.state.modalOpen)) {
        history.pushState({ modalOpen: true }, '');
    }
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
    if (backBtn) backBtn.style.display = 'flex';
    if (closeBtn) closeBtn.style.display = 'none';

    titleEl.textContent = titleText;
    bodyEl.innerHTML = htmlContent;
    bodyEl.scrollTop = 0;

    if (typeof sessionStorage !== 'undefined') {
        try {
            sessionStorage.setItem('openInfoModalTitle', titleText);
        } catch (e) { }
    }
}

/**
 * Retorna para a visão anterior na pilha do modal ou fecha o modal caso esteja na raiz.
 */
export function popInfoModalView() {
    if (infoModalStack.length <= 1) {
        if (typeof document !== 'undefined') {
            closeModalSafely(document.getElementById('info-modal'));
        }
        return;
    }

    infoModalStack.pop();
    const prev = infoModalStack[infoModalStack.length - 1];
    const titleEl = document.getElementById('info-modal-title');
    const bodyEl = document.getElementById('info-modal-body');
    const backBtn = document.getElementById('back-info-btn');
    const closeBtn = document.getElementById('close-info-btn');

    if (titleEl && bodyEl && prev) {
        titleEl.textContent = prev.title;
        bodyEl.innerHTML = prev.html;
        bodyEl.scrollTop = 0;
        if (typeof sessionStorage !== 'undefined') {
            try {
                sessionStorage.setItem('openInfoModalTitle', prev.title);
            } catch (e) { }
        }
    }

    const isSub = infoModalStack.length > 1;
    if (backBtn) backBtn.style.display = isSub ? 'flex' : 'none';
    if (closeBtn) closeBtn.style.display = isSub ? 'none' : 'flex';
}

// Sincronização com o evento popstate do navegador (botão voltar do hardware ou browser)
if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
        if (infoModalStack.length > 1) {
            popInfoModalView();
            return;
        }
        const modals = document.querySelectorAll('.modal-overlay');
        let anyClosed = false;
        modals.forEach(m => {
            if (m && m.style.display !== 'none' && m.style.display !== '') {
                m.style.display = 'none';
                m.classList.remove('is-closing');
                anyClosed = true;
            }
        });
        if (anyClosed) {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open', 'story-open');
            try {
                sessionStorage.removeItem('openReadingModalRef');
                sessionStorage.removeItem('openReadingModalTitle');
                sessionStorage.removeItem('openLocationModal');
                sessionStorage.removeItem('openInfoModalTitle');
            } catch (e) { }
            infoModalStack = [];
            const backBtn = document.getElementById('back-info-btn');
            if (backBtn) backBtn.style.display = 'none';
        }
    });
}
