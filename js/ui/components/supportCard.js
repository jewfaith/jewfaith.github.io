/**
 * SUPPORTCARD.JS - COMPONENTE DE APOIO KO-FI & REPOUSO SAGRADO
 * 
 * Design puro, limpo, sem ruído visual e sem opções de valor.
 * Respeita estritamente a Halachá no Shabat e Yom Tov.
 */

import { state } from '../../state.js';
import { checkSacredRestStatus } from '../../domain/halacha.js';
import { openInfoModal } from '../modals/infoModal.js';

export const SUPPORT_CONFIG = {
    kofiUrl: 'https://ko-fi.com/ashkenar',
    kofiEmbedUrl: 'https://ko-fi.com/ashkenar/?hidefeed=true&widget=true&embed=true&preview=true'
};

let lastSupportRenderKey = null;
let isSupportEventsBound = false;

export function resetSupportRenderCache() {
    lastSupportRenderKey = null;
}

export function getSupportOptionsModalHtml() {
    return `
        <div class="support-modal-container">
            <div class="support-modal-frame">
                <div class="kofi-loading-placeholder" id="kofi-loading-spinner">
                    <div class="kofi-css-spinner"></div>
                    <span class="kofi-loading-text">A ligar ao Ko-fi...</span>
                </div>
                <iframe id="kofi-embed-iframe"
                        src="${SUPPORT_CONFIG.kofiEmbedUrl}"
                        class="kofi-iframe-widget"
                        title="Apoiar o Yisrael Date"
                        allow="payment"
                        allowtransparency="true"
                        scrolling="no"
                        loading="eager"
                        onload="const p = document.getElementById('kofi-loading-spinner'); if(p) { p.classList.add('fade-out'); setTimeout(() => { p.style.display='none'; }, 260); }"
                        onerror="const p = document.getElementById('kofi-loading-spinner'); if(p) { p.classList.add('fade-out'); setTimeout(() => { p.style.display='none'; }, 260); }">
                </iframe>
            </div>
        </div>
    `;
}

export function openSupportOptionsModal() {
    openInfoModal('Apoiar o Yisrael Date', getSupportOptionsModalHtml());

    // Fallback de segurança para garantir que o spinner desaparece sempre
    setTimeout(() => {
        const p = document.getElementById('kofi-loading-spinner');
        if (p) {
            p.classList.add('fade-out');
            setTimeout(() => { if (p) p.style.display = 'none'; }, 260);
        }
    }, 2200);
}

function bindSupportEvents() {
    if (isSupportEventsBound || typeof document === 'undefined') return;
    isSupportEventsBound = true;

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.support-modal-trigger, .app-support-card');
        if (trigger) {
            if (trigger.classList.contains('is-sacred-rest')) return;
            e.preventDefault();
            e.stopPropagation();
            openSupportOptionsModal();
            return;
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const cardTrigger = e.target.closest('.app-support-card:not(.is-sacred-rest)');
            if (cardTrigger) {
                e.preventDefault();
                openSupportOptionsModal();
            }
        }
    });
}

export function renderSupportCards(events = null, hdate = null, sunsetTime = null, isIsrael = null) {
    if (typeof document === 'undefined') return;

    bindSupportEvents();

    const cards = document.querySelectorAll('.app-support-card');
    if (!cards.length) return;

    const evs = events || state.unifiedEvents || [];
    const hd = hdate || state.currentHdate;
    const sunset = sunsetTime || state.currentSunsetTime || 0;
    const isIsr = isIsrael ?? state.userLocation?.isIsrael ?? true;

    const restStatus = checkSacredRestStatus(Date.now(), evs, hd, sunset, isIsr);
    const currentKey = `${restStatus.isRest}_${restStatus.title || ''}_${restStatus.subType || ''}`;

    const allRendered = Array.from(cards).every(c => c.children && c.children.length > 0);
    if (currentKey === lastSupportRenderKey && (restStatus.isRest || allRendered)) {
        return;
    }
    lastSupportRenderKey = currentKey;

    let cardHtml = '';
    if (!restStatus.isRest) {
        cardHtml = `
            <div class="support-card-content">
                <button type="button" 
                        class="support-btn-primary support-btn-kofi support-modal-trigger" 
                        aria-label="Apoiar o Yisrael Date">
                    <span class="support-btn-text">Apoiar o Yisrael Date</span>
                </button>
                <div class="support-card-bottom">
                    <span class="support-security-note">Pagamento seguro via Ko-fi</span>
                </div>
            </div>
        `;
    }

    cards.forEach(card => {
        if (restStatus.isRest) {
            card.classList.add('is-sacred-rest');
            card.style.display = 'none';
            card.setAttribute('aria-hidden', 'true');
            card.removeAttribute('tabindex');
            card.removeAttribute('role');
            card.innerHTML = '';
        } else {
            card.classList.remove('is-sacred-rest');
            card.style.display = '';
            card.removeAttribute('aria-hidden');
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', 'Apoiar o Yisrael Date');
            card.innerHTML = cardHtml;
        }
    });
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
    };

    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#teste-yomtov' || window.location.hash === '#yomtov-2h' || window.location.hash === '#yomtov-6h') {
            lastSupportRenderKey = null;
            renderSupportCards();
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

