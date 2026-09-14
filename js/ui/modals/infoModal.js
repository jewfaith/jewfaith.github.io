/**
 * INFOMODAL.JS - MODAL DE ESTUDOS TEOLÓGICOS E INFORMAÇÕES
 * 
 * Gerencia a exibição de conteúdos enriquecidos com pilha de navegação interna
 * (push/pop view), botão voltar e sincronização com o histórico do navegador.
 */

import { closeModalSafely, checkModalsActive } from './modalManager.js';

let infoModalStack = [];

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
            if (indicator) {
                indicator.style.opacity = '0';
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 300);
            }
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
                    noticeEl.style.display = 'flex';
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
    setupKofiFrameLoaders(bodyEl);

    const hasKofi = bodyEl.querySelector('.kofi-embed-iframe-wrapper') !== null;
    modal.classList.toggle('has-kofi-embed', hasKofi);

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
    setupKofiFrameLoaders(bodyEl);
    modal.classList.toggle('has-kofi-embed', bodyEl.querySelector('.kofi-embed-iframe-wrapper') !== null);

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
    const modal = document.getElementById('info-modal');
    const titleEl = document.getElementById('info-modal-title');
    const bodyEl = document.getElementById('info-modal-body');
    const backBtn = document.getElementById('back-info-btn');
    const closeBtn = document.getElementById('close-info-btn');

    if (titleEl && bodyEl && prev) {
        titleEl.textContent = prev.title;
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

        const infoModal = document.getElementById('info-modal');
        const isInfoOpen = infoModal && infoModal.style.display !== 'none' && infoModal.style.display !== '';
        const zmanimModal = document.getElementById('zmanim-modal');
        const isZmanimOpen = zmanimModal && zmanimModal.style.display !== 'none' && zmanimModal.style.display !== '';

        if ((isInfoOpen && isZmanimOpen) || (isZmanimOpen && history.state && history.state.zmanimOpen)) {
            if (infoModal) {
                infoModal.style.display = 'none';
                infoModal.classList.remove('is-closing');
            }
            infoModalStack = [];
            const backBtn = document.getElementById('back-info-btn');
            if (backBtn) backBtn.style.display = 'none';
            const closeBtn = document.getElementById('close-info-btn');
            if (closeBtn) closeBtn.style.display = 'flex';
            try {
                sessionStorage.removeItem('openInfoModalTitle');
            } catch (e) { }
            checkModalsActive();
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
