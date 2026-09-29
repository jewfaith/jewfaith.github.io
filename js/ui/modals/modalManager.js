/**
 * MODALMANAGER.JS - GESTÃO CENTRALIZADA DO CICLO DE VIDA DE MODAIS E HISTÓRICO
 * 
 * Fonte única de verdade para estado, abertura, fecho acessível, navegação
 * por histórico (Back/Forward), sincronização com ?modal= e gestos touch iOS.
 */

import { trackMicroAction } from '../../utils/umamiMonitor.js';

export const MODAL_KEY_MAP = {
    'zmanim': 'zmanim-modal',
    'localizacao': 'location-modal',
    'leitura': 'reading-modal',
    'informacoes': 'info-modal',
    'sefaria': 'sefaria-modal'
};

export const MODAL_ID_MAP = {
    'zmanim-modal': 'zmanim',
    'location-modal': 'localizacao',
    'reading-modal': 'leitura',
    'info-modal': 'informacoes',
    'sefaria-modal': 'sefaria'
};

let currentActiveModal = null;
let lastFocusedElement = null;
let isHandlingPopState = false;
let inAppNavigationDepth = 0;
let observer = null;

/**
 * Retorna o modal atualmente aberto, se existir.
 */
export function getCurrentActiveModal() {
    return currentActiveModal;
}

/**
 * Verifica se algum modal está visível e atualiza classes de scroll e foco no body.
 */
export function checkModalsActive() {
    if (typeof document === 'undefined') return;
    const anyModalOpen = Array.from(document.querySelectorAll('.modal-overlay')).some(m => {
        return m.classList.contains('is-open') && !m.classList.contains('is-hidden');
    });

    if (anyModalOpen) {
        document.body.classList.add('modal-open');
    } else {
        document.body.classList.remove('modal-open');
        currentActiveModal = null;
    }
}

/**
 * Inicializa o MutationObserver para sincronizar automaticamente a classe modal-open no body.
 */
export function initModalObserver() {
    if (typeof document === 'undefined' || observer) return;

    // Higienização inicial estrita: garante que nenhum modal inicia aberto
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
        overlay.classList.remove('is-open');
        overlay.classList.add('is-hidden');
        overlay.style.display = 'none';
    });

    observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'class') {
                checkModalsActive();
            }
        });
    });

    overlays.forEach(overlay => observer.observe(overlay, { attributes: true, attributeFilter: ['class'] }));
    checkModalsActive();
}

/**
 * Mantida para retrocompatibilidade sem injetar ?= ou parâmetros no URL.
 */
export function syncUrlWithModal(modalKey, action = 'push') {
    // A lógica de query parameters (?=) foi removida para manter o URL limpo e elegante
}

/**
 * Abre um elemento modal diretamente registando-o no gestor centralizado.
 */
export function openModalElement(modal, modalKey = null, options = {}) {
    if (!modal) return;

    // Proteção estrita: #info-modal NUNCA pode ser aberto com o corpo vazio
    if (modal.id === 'info-modal') {
        const bodyEl = document.getElementById('info-modal-body');
        if (!bodyEl || !bodyEl.innerHTML || !bodyEl.innerHTML.trim()) {
            console.warn('[ModalManager] Abertura de #info-modal prevenida: corpo de conteúdo vazio.');
            return;
        }
    }

    const key = modalKey || MODAL_ID_MAP[modal.id] || null;

    // Se outro modal estiver aberto, fecha-o diretamente sem histórico
    if (currentActiveModal && currentActiveModal !== modal) {
        closeModalDirectly(currentActiveModal);
    }

    // Salva elemento que possuía foco
    if (document.activeElement && document.activeElement !== document.body) {
        lastFocusedElement = document.activeElement;
    }

    currentActiveModal = modal;
    modal.style.display = '';
    modal.classList.remove('is-closing');
    modal.classList.remove('is-hidden');
    modal.classList.add('is-open');

    document.body.classList.add('modal-open');

    // Registo de histórico para fecho via botão Voltar sem alterar o URL (?=)
    if (!isHandlingPopState && !options.skipHistory) {
        try {
            history.pushState({ modalOpen: true, modalId: modal.id }, '', window.location.pathname + window.location.hash);
            inAppNavigationDepth++;
        } catch (e) { }
    }

    // Gestão acessível do foco
    const scheduleFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb) => setTimeout(cb, 0);
    scheduleFrame(() => {
        const inputTarget = modal.querySelector('input:not([disabled])');
        if (inputTarget) {
            try { inputTarget.focus({ preventScroll: true }); } catch (e) { }
        } else {
            modal.setAttribute('tabindex', '-1');
            try { modal.focus({ preventScroll: true }); } catch (e) { }
        }
    });

    checkModalsActive();
}

/**
 * Abre um modal através da sua chave semântica de rota ('zmanim', 'informacoes', etc.).
 */
export function openModalByKey(modalKey, options = {}) {
    if (!modalKey) return;
    switch (modalKey) {
        case 'zmanim':
            import('../zmanimTable.js').then(m => m.openZmanimModal(options)).catch(console.error);
            break;
        case 'localizacao':
            import('./locationModal.js').then(m => m.openLocationModal(options)).catch(console.error);
            break;
        case 'leitura':
            import('./readingModal.js').then(m => {
                const ref = options.ref || sessionStorage.getItem('openReadingModalRef') || 'Deuteronomy 32:1-52';
                const title = options.title || sessionStorage.getItem('openReadingModalTitle') || 'Leitura da Torá';
                m.openReadingModal(ref, title, options);
            }).catch(console.error);
            break;
        case 'sefaria':
            import('./sefariaModal.js').then(m => {
                m.openSefariaModal(options.category || null, options.ref || null, options);
            }).catch(console.error);
            break;
        case 'informacoes':
            import('./infoModal.js').then(m => {
                const storedTitle = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('openInfoModalTitle') : null;
                if (storedTitle && typeof document !== 'undefined' && document.querySelector) {
                    const card = document.querySelector(`.event-card[data-info-title="${storedTitle}"]`);
                    if (card && card.getAttribute('data-info-html')) {
                        card.click();
                        return;
                    }
                }
                m.openInfoModal('Informações da Tradição', '<div class="info-modal-card"><div class="info-modal-value">Visão geral das celebrações, festas bíblicas e calendário hebraico.</div></div>', options);
            }).catch(console.error);
            break;
        default:
            console.warn(`[ModalManager] Chave de rota de modal desconhecida: ${modalKey}`);
    }
}

/**
 * Fecha um modal de forma suave e acessível com animação de saída.
 */
export function closeModalSafely(modal, skipHistory = false) {
    if (!modal) return;
    const isVisible = modal.classList.contains('is-open') && !modal.classList.contains('is-hidden');
    if (!isVisible) return;
    if (modal.classList.contains('is-closing')) return;

    trackMicroAction('modal_close', { modalId: modal.id });

    const content = modal.querySelector('.modal-content, .reading-modal-content');

    modal.classList.add('is-closing');
    if (content) {
        content.style.transform = '';
        content.classList.add('is-closing');
    }

    try {
        sessionStorage.removeItem('openReadingModalRef');
        sessionStorage.removeItem('openReadingModalTitle');
        sessionStorage.removeItem('openLocationModal');
        sessionStorage.removeItem('openInfoModalTitle');
    } catch (e) { }

    const backBtn = document.getElementById('back-info-btn');
    if (backBtn) {
        backBtn.classList.add('is-hidden');
        backBtn.style.display = 'none';
    }
    const closeBtn = document.getElementById('close-info-btn');
    if (closeBtn) {
        closeBtn.classList.remove('is-hidden');
        closeBtn.style.display = '';
    }

    setTimeout(() => {
        modal.classList.remove('is-open');
        modal.classList.add('is-hidden');
        modal.classList.remove('is-closing');
        modal.style.display = 'none';
        if (content) {
            content.classList.remove('is-closing');
            content.classList.remove('is-dragging');
            content.classList.remove('is-snapback');
            content.style.transform = '';
        }
        if (modal.id === 'info-modal') {
            modal.classList.remove('has-kofi-embed');
            modal.classList.remove('has-back-nav');
            const frames = modal.querySelectorAll('.kofi-modal-frame');
            frames.forEach(f => {
                try { f.src = 'about:blank'; } catch (e) { }
            });
            import('./infoModal.js').then(m => m.clearKofiTimers?.()).catch(() => { });
        }
        if (currentActiveModal === modal) {
            currentActiveModal = null;
        }
        checkModalsActive();

        // Devolve o foco ao elemento original
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            try {
                lastFocusedElement.focus();
            } catch (e) { }
            lastFocusedElement = null;
        }

        // Gestão de histórico: desempilha se houver histórico interno registado
        if (!skipHistory && !isHandlingPopState) {
            if (inAppNavigationDepth > 0 && history.state && history.state.modalOpen) {
                inAppNavigationDepth = Math.max(0, inAppNavigationDepth - 1);
                try {
                    history.back();
                } catch (e) { }
            }
        }
    }, 200);
}

/**
 * Fecha um modal imediatamente sem animação de transição (útil em trocas rápidas).
 */
export function closeModalDirectly(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.classList.add('is-hidden');
    modal.classList.remove('is-closing');
    modal.classList.remove('has-kofi-embed');
    modal.classList.remove('has-back-nav');
    modal.style.display = 'none';
    const backBtn = document.getElementById('back-info-btn');
    if (backBtn) {
        backBtn.classList.add('is-hidden');
        backBtn.style.display = 'none';
    }
    const closeBtn = document.getElementById('close-info-btn');
    if (closeBtn) {
        closeBtn.classList.remove('is-hidden');
        closeBtn.style.display = '';
    }
    const content = modal.querySelector('.modal-content, .reading-modal-content');
    if (content) {
        content.classList.remove('is-closing');
        content.classList.remove('is-dragging');
        content.classList.remove('is-snapback');
        content.style.transform = '';
    }
    try {
        sessionStorage.removeItem('openReadingModalRef');
        sessionStorage.removeItem('openReadingModalTitle');
        sessionStorage.removeItem('openLocationModal');
        sessionStorage.removeItem('openInfoModalTitle');
    } catch (e) { }
    if (currentActiveModal === modal) {
        currentActiveModal = null;
    }
    checkModalsActive();
}

/**
 * Fecha todos os outros modais abertos no layout Desktop (>= 768px).
 */
export function closeOtherModalsOnDesktop(exceptModalId = null) {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        document.querySelectorAll('.modal-overlay').forEach(m => {
            const isVisible = m.classList.contains('is-open') && !m.classList.contains('is-hidden');
            if (m.id !== exceptModalId && isVisible) {
                closeModalDirectly(m);
            }
        });
    }
}

/**
 * Gestor do evento popstate do navegador (Back / Forward / hardware back).
 */
export function handlePopState(event) {
    isHandlingPopState = true;
    try {
        // Ao clicar no botão Voltar do navegador ou gesto mobile, fecha qualquer modal aberto
        const overlays = document.querySelectorAll('.modal-overlay');
        let closedAny = false;
        overlays.forEach(m => {
            const isVisible = m.classList.contains('is-open') && !m.classList.contains('is-hidden');
            if (isVisible) {
                closeModalSafely(m, true);
                closedAny = true;
            }
        });
        if (closedAny && inAppNavigationDepth > 0) {
            inAppNavigationDepth = Math.max(0, inAppNavigationDepth - 1);
        }
        currentActiveModal = null;
        checkModalsActive();
    } finally {
        setTimeout(() => {
            isHandlingPopState = false;
        }, 60);
    }
}

/**
 * Garante que o URL permanece limpo, removendo qualquer parâmetro ?= ou ?modal= residual.
 */
export function initModalUrlSync() {
    if (typeof window === 'undefined') return;
    try {
        if (window.location.search && (window.location.search.includes('modal=') || window.location.search === '?' || window.location.search === '?=')) {
            const cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState(null, '', cleanUrl);
        }
    } catch (e) { }
}

/**
 * Inicializa gestos tácteis para fecho por deslizamento (swipe-down) no padrão Apple iOS 18.
 */
export function initModalGestures() {
    if (typeof document === 'undefined') return;
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
        const content = overlay.querySelector('.modal-content, .reading-modal-content');
        if (!content || overlay.dataset.gestureBound) return;
        overlay.dataset.gestureBound = 'true';

        let startY = 0;
        let startX = 0;
        let startTime = 0;
        let isDraggingDown = false;
        let canDragFromHere = false;
        let scrollableBody = null;

        const onTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            const touch = e.touches[0];
            startY = touch.clientY;
            startX = touch.clientX;
            startTime = Date.now();
            isDraggingDown = false;

            scrollableBody = content.querySelector('.reading-body') || content.querySelector('.modal-body');
            const atScrollTop = !scrollableBody || scrollableBody.scrollTop <= 0;
            const isHeaderZone = !!e.target.closest('.ios-sheet-grabber, .reading-header, .search-container, .modal-close-btn');

            canDragFromHere = isHeaderZone || atScrollTop;
        };

        const onTouchMove = (e) => {
            if (e.touches.length !== 1 || !canDragFromHere) return;
            const touch = e.touches[0];
            const dy = touch.clientY - startY;
            const dx = touch.clientX - startX;

            if (!isDraggingDown) {
                const atScrollTop = !scrollableBody || scrollableBody.scrollTop <= 0;
                if (dy > 6 && dy > Math.abs(dx) * 1.1 && atScrollTop) {
                    isDraggingDown = true;
                    content.classList.remove('is-snapback');
                    content.classList.add('is-dragging');
                }
            }

            if (isDraggingDown && dy > 0) {
                if (e.cancelable) {
                    e.preventDefault();
                }
                content.style.transform = `translate3d(0, ${dy}px, 0)`;
            }
        };

        const onTouchEnd = (e) => {
            if (!isDraggingDown) {
                canDragFromHere = false;
                return;
            }
            const touch = e.changedTouches[0];
            const dy = touch.clientY - startY;
            const elapsed = Date.now() - startTime;
            const velocity = dy / (elapsed || 1);

            content.classList.remove('is-dragging');
            if (dy > 70 || velocity > 0.35) {
                content.style.transform = '';
                closeModalSafely(overlay);
            } else {
                content.style.transform = '';
                content.classList.add('is-snapback');
                setTimeout(() => {
                    content.classList.remove('is-snapback');
                }, 240);
            }
            isDraggingDown = false;
            canDragFromHere = false;
        };

        const onTouchCancel = () => {
            if (isDraggingDown) {
                content.classList.remove('is-dragging');
                content.style.transform = '';
                content.classList.add('is-snapback');
                setTimeout(() => {
                    content.classList.remove('is-snapback');
                }, 240);
                isDraggingDown = false;
            }
            canDragFromHere = false;
        };

        content.addEventListener('touchstart', onTouchStart, { passive: true });
        content.addEventListener('touchmove', onTouchMove, { passive: false });
        content.addEventListener('touchend', onTouchEnd, { passive: true });
        content.addEventListener('touchcancel', onTouchCancel, { passive: true });
    });
}

// Fecho ao clicar no backdrop do modal
if (typeof window !== 'undefined') {
    window.addEventListener('click', (e) => {
        if (e.target.classList && e.target.classList.contains('modal-overlay')) {
            closeModalSafely(e.target);
        }
    });

    // Tecla Escape fecha o modal ativo ou visão interna
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = currentActiveModal || Array.from(document.querySelectorAll('.modal-overlay')).find(m => m.classList.contains('is-open') && !m.classList.contains('is-hidden'));
            if (activeModal) {
                e.preventDefault();
                if (activeModal.id === 'info-modal') {
                    import('./infoModal.js').then(im => {
                        if (im.getInfoModalStackLength?.() > 1) {
                            im.popInfoModalView();
                        } else {
                            closeModalSafely(activeModal);
                        }
                    }).catch(() => closeModalSafely(activeModal));
                } else {
                    closeModalSafely(activeModal);
                }
            }
        }
    });

    // Ouvinte popstate único e centralizado
    window.addEventListener('popstate', handlePopState);
}
