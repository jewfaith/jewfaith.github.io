/**
 * MODALMANAGER.JS - GESTÃO CENTRALIZADA DO CICLO DE VIDA DE MODAIS
 * 
 * Controla abertura, fecho seguro com animações iOS 18, acessibilidade (ARIA),
 * gestos touch swipe-down e observação de estado de overlays.
 */

import { trackMicroAction } from '../../utils/umamiMonitor.js';

let observer = null;

/**
 * Verifica se algum modal está visível e atualiza classes de scroll e foco no body.
 */
export function checkModalsActive() {
    if (typeof document === 'undefined') return;
    const anyModalOpen = Array.from(document.querySelectorAll('.modal-overlay')).some(m => {
        return m.style.display && m.style.display !== 'none';
    });

    if (anyModalOpen) {
        document.body.classList.add('modal-open');
    } else {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    }
}

/**
 * Inicializa o MutationObserver para sincronizar automaticamente a classe modal-open no body.
 */
export function initModalObserver() {
    if (typeof document === 'undefined' || observer) return;

    observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'style') {
                checkModalsActive();
            }
        });
    });

    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => observer.observe(overlay, { attributes: true, attributeFilter: ['style'] }));
    checkModalsActive();
}

/**
 * Fecha um modal de forma suave e acessível com animação de saída.
 */
export function closeModalSafely(modal, skipHistory = false) {
    if (!modal) return;
    if (modal.style.display === 'none' || modal.style.display === '') return;
    if (modal.classList.contains('is-closing')) return;

    trackMicroAction('modal_close', { modalId: modal.id });

    const content = modal.querySelector('.modal-content, .reading-modal-content');

    modal.classList.add('is-closing');
    if (content) {
        content.classList.add('is-closing');
    }

    try {
        sessionStorage.removeItem('openReadingModalRef');
        sessionStorage.removeItem('openReadingModalTitle');
        sessionStorage.removeItem('openLocationModal');
        sessionStorage.removeItem('openInfoModalTitle');
    } catch (e) { }

    const backBtn = document.getElementById('back-info-btn');
    if (backBtn) backBtn.style.display = 'none';
    const closeBtn = document.getElementById('close-info-btn');
    if (closeBtn) closeBtn.style.display = 'flex';

    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('is-closing');
        modal.style.backgroundColor = '';
        if (content) {
            content.classList.remove('is-closing');
            content.style.transform = '';
            content.style.transition = '';
        }
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
        if (!skipHistory && history.state && (
            history.state.modalOpen ||
            history.state.zmanimOpen ||
            history.state.berachotOpen ||
            history.state.tehilimOpen ||
            history.state.calendarOpen ||
            history.state.converterOpen ||
            history.state.pirkeiOpen ||
            history.state.talmudOpen ||
            history.state.mishnaOpen ||
            history.state.settingsOpen ||
            history.state.shabbatOpen
        )) {
            try {
                history.back();
            } catch (e) { }
        }
    }, 200);
}

/**
 * Fecha um modal imediatamente sem animação de transição (útil em trocas rápidas no desktop).
 */
export function closeModalDirectly(modal) {
    if (!modal) return;
    modal.style.display = 'none';
    modal.classList.remove('is-closing');
    modal.style.backgroundColor = '';
    const content = modal.querySelector('.modal-content, .reading-modal-content');
    if (content) {
        content.classList.remove('is-closing');
        content.style.transform = '';
        content.style.transition = '';
    }
    try {
        sessionStorage.removeItem('openReadingModalRef');
        sessionStorage.removeItem('openReadingModalTitle');
        sessionStorage.removeItem('openLocationModal');
        sessionStorage.removeItem('openInfoModalTitle');
    } catch (e) { }
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
}

/**
 * Fecha todos os outros modais abertos no layout Desktop (>= 768px).
 */
export function closeOtherModalsOnDesktop(exceptModalId = null) {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        document.querySelectorAll('.modal-overlay').forEach(m => {
            if (m.id !== exceptModalId && m.style.display && m.style.display !== 'none') {
                closeModalDirectly(m);
            }
        });
    }
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

        let rafId = null;
        let pendingDy = 0;

        const onTouchMove = (e) => {
            if (e.touches.length !== 1 || !canDragFromHere) return;
            const touch = e.touches[0];
            const dy = touch.clientY - startY;
            const dx = touch.clientX - startX;

            if (!isDraggingDown) {
                const atScrollTop = !scrollableBody || scrollableBody.scrollTop <= 0;
                if (dy > 6 && dy > Math.abs(dx) * 1.1 && atScrollTop) {
                    isDraggingDown = true;
                    content.style.animation = 'none';
                    content.style.transition = 'none';
                }
            }

            if (isDraggingDown && dy > 0) {
                if (e.cancelable) {
                    e.preventDefault();
                }
                pendingDy = dy;
                if (!rafId) {
                    rafId = requestAnimationFrame(() => {
                        content.style.transform = `translate3d(0, ${pendingDy}px, 0)`;
                        overlay.style.backgroundColor = `rgba(0, 0, 0, ${Math.max(0.15, 0.65 - (pendingDy / 400) * 0.5)})`;
                        rafId = null;
                    });
                }
            }
        };

        const onTouchEnd = (e) => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            if (!isDraggingDown) {
                canDragFromHere = false;
                return;
            }
            const touch = e.changedTouches[0];
            const dy = touch.clientY - startY;
            const elapsed = Date.now() - startTime;
            const velocity = dy / (elapsed || 1);

            if (dy > 60 || velocity > 0.3) {
                closeModalSafely(overlay);
            } else {
                content.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
                content.style.transform = 'translate3d(0, 0, 0)';
                overlay.style.backgroundColor = '';
            }
            isDraggingDown = false;
            canDragFromHere = false;
        };

        const onTouchCancel = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            if (isDraggingDown) {
                content.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
                content.style.transform = 'translate3d(0, 0, 0)';
                overlay.style.backgroundColor = '';
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
}
