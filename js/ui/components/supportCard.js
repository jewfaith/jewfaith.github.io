/**
 * SUPPORTCARD.JS - COMPONENTE DE APOIO KO-FI & REPOUSO SAGRADO
 * 
 * Design oficial Ko-fi: link direto sem modal.
 * Respeita estritamente a Halachá no Shabat e Festas Solenes da Torá.
 */

import { state } from '../../state.js';
import { checkSacredRestStatus } from '../../domain/halacha.js';

export { SUPPORT_CONFIG } from './homeProducts.js';

let lastSupportRenderKey = null;
let isSupportEventsBound = false;

export function resetSupportRenderCache() {
    lastSupportRenderKey = null;
}

import { renderHomeProducts } from './homeProducts.js';

function bindSupportEvents() {
    if (isSupportEventsBound || typeof document === 'undefined') return;
    isSupportEventsBound = true;

    // Bloqueia tentativas de clique durante o repouso sagrado das Festas da Torá
    document.addEventListener('click', (e) => {
        const disabledTrigger = e.target.closest('.app-support-card.is-sacred-rest, .kofi-button-link.is-disabled');
        if (disabledTrigger) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
    }, true);
}

export function renderSupportCards(events = null, hdate = null, sunsetTime = null, isIsrael = null) {
    if (typeof document === 'undefined') return;

    const evs = events || state.unifiedEvents || [];
    const hd = hdate || state.currentHdate;
    const sunset = sunsetTime || state.currentSunsetTime || 0;
    const isIsr = isIsrael ?? state.userLocation?.isIsrael ?? true;

    const restStatus = checkSacredRestStatus(Date.now(), evs, hd, sunset, isIsr);
    const isRest = Boolean(restStatus.isRest && restStatus.type === 'yomtov');

    // Atualiza o estado de Repouso Sagrado no elemento raiz e no corpo da página (para o Floating Widget do Ko-fi)
    document.documentElement?.classList.toggle('is-sacred-rest', isRest);
    document.body?.classList.toggle('is-sacred-rest', isRest);

    // Remove qualquer cartão estático legado ou resquício de widget flutuante Ko-fi
    const elementsToRemove = document.querySelectorAll('.app-support-card, .floatingchat-container-wrap, .floatingchat-container-wrap-mobi, [id^="kofi-wo-container"], [id^="kofi-widget-overlay"]');
    elementsToRemove.forEach(el => el.remove());
}

if (typeof window !== 'undefined') {
    window.simulateYomTov = (simulate = true) => {
        try {
            if (simulate === true) {
                localStorage.setItem('yisrael_simulate_yomtov', 'true');
            } else if (simulate === false) {
                localStorage.setItem('yisrael_simulate_yomtov', 'force_normal');
            } else {
                localStorage.removeItem('yisrael_simulate_yomtov');
            }
        } catch (e) { }
        lastSupportRenderKey = null;
        renderSupportCards();
        renderHomeProducts();
    };

    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#teste-yomtov' || window.location.hash === '#yomtov-2h' || window.location.hash === '#yomtov-6h' || window.location.hash === '') {
            lastSupportRenderKey = null;
            renderSupportCards();
            renderHomeProducts();
        }
    });
}

// Hidratação imediata na inicialização do script (0ms)
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => renderSupportCards());
    } else {
        renderSupportCards();
    }
}

