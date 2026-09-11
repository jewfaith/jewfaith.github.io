/**
 * MODALS.JS - FACHADA E ORQUESTRADOR CENTRAL DE MODAIS
 * 
 * Ponto de entrada unificado para todos os modais da aplicação (Leitura, Localização,
 * Estudos Teológicos e Horários Haláchicos), delegando para submódulos especializados
 * e preservando 100% da API pública original para retrocompatibilidade total.
 */

import {
    closeModalSafely,
    closeModalDirectly,
    closeOtherModalsOnDesktop,
    initModalGestures,
    initModalObserver
} from './modals/modalManager.js';

import {
    openInfoModal,
    pushInfoModalView,
    popInfoModalView
} from './modals/infoModal.js';

import { openReadingModal } from './modals/readingModal.js';
import { openLocationModal, setLocationUpdateCallback, initLocationSearchListener } from './modals/locationModal.js';
import { initSefariaModal, openSefariaModal, closeSefariaModal } from './modals/sefariaModal.js';
import { openZmanimModal, initZmanimModal, closeZmanimModal } from './zmanimTable.js';
import { initWelcomeModal, checkAndShowWelcomeModal, openWelcomeModal, closeWelcomeModal } from './modals/welcomeModal.js';
import { escapeHtml } from '../domain/formatters.js';
import { ICONS } from './icons.js';
import { setUserPremium } from '../utils/persistence.js';

// Re-exportações canónicas para preservação estrita da interface pública
export {
    openInfoModal,
    pushInfoModalView,
    popInfoModalView,
    closeModalSafely,
    closeModalDirectly,
    closeOtherModalsOnDesktop,
    initModalGestures,
    openLocationModal,
    openReadingModal,
    openSefariaModal,
    closeSefariaModal,
    openZmanimModal,
    closeZmanimModal,
    openWelcomeModal,
    closeWelcomeModal,
    checkAndShowWelcomeModal
};

/**
 * Modal para recursos exclusivos / gated premium.
 */
export function openPremiumGatedModal(featureName, readingTitle, refToOpen) {
    const modal = document.getElementById('info-modal');
    const titleEl = document.getElementById('info-modal-title');
    const bodyEl = document.getElementById('info-modal-body');

    if (!modal || !titleEl || !bodyEl) return;

    titleEl.textContent = 'Recurso Premium';
    bodyEl.innerHTML = `
        <div class="levels-container" style="display: flex; flex-direction: column; width: 100%;">
            <div class="info-modal-card">
                <div class="info-modal-value" style="font-size: var(--font-size-sm); line-height: 1.6; color: var(--text-primary); text-align: left; white-space: normal;">
                    A leitura de <strong>${escapeHtml(readingTitle)}</strong> (${escapeHtml(featureName)}) é um recurso exclusivo dos membros do Plano Premium.
                </div>
            </div>

            <div class="info-modal-card">
                <div class="info-modal-value" style="font-size: var(--font-size-sm); line-height: 1.6; color: var(--text-primary); text-align: left; white-space: normal;">
                    Desbloqueie todos os livros proféticos, salmos devocionais, bússola Mizrach e ferramentas avançadas.
                </div>
            </div>

            <div style="margin-top: 8px; padding: 4px 2px;">
                <button class="converter-action-btn" id="activate-premium-from-modal-btn" style="width: 100%; cursor: pointer;">
                    <i class="${ICONS.crown}" data-icon="crown" style="margin-right: 6px;"></i>
                    <span>Ativar Agora</span>
                </button>
            </div>
        </div>
    `;

    document.getElementById('activate-premium-from-modal-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        setUserPremium(true);
        closeModalDirectly(modal);
        if (refToOpen && readingTitle) {
            openReadingModal(refToOpen, readingTitle);
        } else {
            alert('Plano Premium ativado com sucesso! Todos os recursos foram desbloqueados.');
        }
    });

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    if (typeof history !== 'undefined' && (!history.state || !history.state.modalOpen)) {
        history.pushState({ modalOpen: true }, '');
    }
}

let isModalsInitialized = false;

/**
 * Inicialização dos modais da aplicação e delegação de eventos do DOM.
 */
export function initModals(updateDashboardCallback) {
    if (updateDashboardCallback) {
        setLocationUpdateCallback(updateDashboardCallback);
    }

    if (isModalsInitialized || typeof document === 'undefined') return;
    isModalsInitialized = true;

    initModalGestures();
    initModalObserver();
    initLocationSearchListener();
    initSefariaModal();
    initZmanimModal();

    document.addEventListener('click', (event) => {

        // B. Cartões de Informação dentro de Modais (ex: Lista de Celebrações no Calendário dentro de #info-modal)
        const innerInfoTrigger = event.target.closest('#info-modal .info-trigger');
        if (innerInfoTrigger) {
            const titleText = innerInfoTrigger.getAttribute('data-info-title') || '-';
            let htmlContent = innerInfoTrigger.getAttribute('data-info-html') || '';
            if (!htmlContent) {
                htmlContent = `<div class="info-modal-card"><div class="info-modal-value">Detalhes e celebração de ${titleText}.</div></div>`;
            }
            event.preventDefault();
            event.stopPropagation();
            pushInfoModalView(titleText, htmlContent);
            return;
        }

        // Ignora outros cliques originados dentro de modais abertos ou visões externas de utilitários
        if (event.target.closest('.modal-overlay')) return;
        if (event.target.closest('#view-tools') || event.target.closest('#view-premium')) return;

        // 1. Zmanim / Horários Haláchicos (#card-solar-glance, #solar-arc-container, .zmanim-trigger-btn, #card-zmanim-festivals)
        const zmanimTrigger = event.target.closest('#card-solar-glance, #solar-arc-container, .zmanim-trigger-btn, #card-zmanim-festivals');
        if (zmanimTrigger) {
            event.preventDefault();
            event.stopPropagation();
            closeOtherModalsOnDesktop('zmanim-modal');
            openZmanimModal();
            return;
        }

        // 2. Localização (#card-local-vigente, .location-trigger-btn, .app-location-badge, #desktop-local-btn)
        const locTrigger = event.target.closest('#card-local-vigente, .location-trigger-btn, .app-location-badge, #desktop-local-btn');
        if (locTrigger) {
            event.preventDefault();
            event.stopPropagation();
            closeOtherModalsOnDesktop('location-modal');
            openLocationModal();
            return;
        }

        // 3. Literatura Judaica / Sefaria (#card-sefaria-single, .sefaria-category-card, #card-sefaria-random-wrapper)
        const sefariaTrigger = event.target.closest('#card-sefaria-single, .sefaria-category-card, #card-sefaria-random-wrapper');
        if (sefariaTrigger) {
            event.preventDefault();
            event.stopPropagation();
            const cat = sefariaTrigger.getAttribute('data-category') || 'Mishnah';
            const targetRef = sefariaTrigger.getAttribute('data-ref') || 'Pirkei Avot 1';
            closeOtherModalsOnDesktop('sefaria-modal');
            openSefariaModal(cat, targetRef);
            return;
        }

        // 4. Leituras Bíblicas (Torá, Haftará, Ketuvim)
        const scriptureTrigger = event.target.closest('#card-torah-wrapper, #card-haftara-wrapper, #card-ketuvim-wrapper');
        if (scriptureTrigger) {
            event.preventDefault();
            event.stopPropagation();
            const titleEl = scriptureTrigger.querySelector('.card-title, .settings-card-title');
            const titleText = titleEl ? titleEl.textContent.trim() : '';
            let ref = scriptureTrigger.getAttribute('data-ref');

            // Fallbacks de segurança se o ref ainda não tiver sido preenchido
            if (!ref || ref === '-' || ref === 'null') {
                if (scriptureTrigger.id === 'card-torah-wrapper') ref = 'Deuteronomy 32:1-52';
                else if (scriptureTrigger.id === 'card-haftara-wrapper') ref = 'Hosea 14:2-10; Joel 2:15-27';
                else if (scriptureTrigger.id === 'card-ketuvim-wrapper') ref = 'Esther 1';
            }

            if (ref) {
                closeOtherModalsOnDesktop('reading-modal');
                openReadingModal(ref, titleText || ref);
                return;
            }
        }

        // 5. Cartões de Informação / Festas / Parashá (.info-trigger)
        const infoTrigger = event.target.closest('.info-trigger');
        if (infoTrigger) {
            const titleText = infoTrigger.getAttribute('data-info-title') || '-';
            let htmlContent = infoTrigger.getAttribute('data-info-html') || '';
            if (!htmlContent) {
                htmlContent = `<div class="info-modal-card"><div class="info-modal-value">Detalhes e celebração de ${titleText}.</div></div>`;
            }
            event.preventDefault();
            event.stopPropagation();
            closeOtherModalsOnDesktop('info-modal');
            openInfoModal(titleText, htmlContent);
            return;
        }
    });

    document.getElementById('back-info-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        popInfoModalView();
    });

    document.getElementById('close-reading-btn')?.addEventListener('click', () => {
        closeModalSafely(document.getElementById('reading-modal'));
        try {
            sessionStorage.removeItem('openReadingModalRef');
            sessionStorage.removeItem('openReadingModalTitle');
        } catch (e) { }
    });

    document.getElementById('close-info-btn')?.addEventListener('click', () => {
        const m = document.getElementById('info-modal');
        if (m) closeModalSafely(m);
        try {
            sessionStorage.removeItem('openInfoModalTitle');
        } catch (e) { }
    });

    document.getElementById('close-location-btn')?.addEventListener('click', () => {
        const m = document.getElementById('location-modal');
        if (m) closeModalSafely(m);
        try {
            sessionStorage.removeItem('openLocationModal');
        } catch (e) { }
    });

    document.getElementById('close-zmanim-modal-btn')?.addEventListener('click', () => {
        closeZmanimModal();
    });
}

/**
 * Reabre modais após recarregamentos caso existam chaves ativas em sessionStorage.
 */
export function reopenModals() {
    if (typeof document === 'undefined') return;
    try {
        const openOverlay = document.querySelector(
            '#reading-modal[style*="display: flex"], #reading-modal[style*="display: block"], ' +
            '#info-modal[style*="display: flex"], #info-modal[style*="display: block"], ' +
            '#zmanim-modal[style*="display: flex"], #zmanim-modal[style*="display: block"], ' +
            '#location-modal[style*="display: flex"], #location-modal[style*="display: block"], ' +
            '.modal-overlay[style*="display: flex"], .modal-overlay[style*="display: block"]'
        );
        if (openOverlay) return;

        if (sessionStorage.getItem('openLocationModal')) {
            document.getElementById('card-local-vigente')?.click();
        } else if (sessionStorage.getItem('openInfoModalTitle')) {
            const title = sessionStorage.getItem('openInfoModalTitle');
            const card = document.querySelector(`.event-card[data-info-title="${title}"]`);
            if (card) {
                card.click();
            } else {
                sessionStorage.removeItem('openInfoModalTitle');
            }
        } else if (sessionStorage.getItem('openReadingModalRef') && sessionStorage.getItem('openReadingModalTitle')) {
            openReadingModal(sessionStorage.getItem('openReadingModalRef'), sessionStorage.getItem('openReadingModalTitle'));
        }
    } catch (e) { }
}

// Utilitários de consola para desenvolvedores (seleção de tradução bíblica)
if (typeof window !== 'undefined') {
    window.setBibleVersion = (version) => {
        if (!version) {
            window.listBibleVersions();
            return;
        }
        const target = String(version).toUpperCase().trim();
        const validMap = {
            'NVT': 'NVT (Nova Versão Transformadora - PT-BR)',
            'OL': 'OL (O Livro - PT-PT)',
            'AA': 'AA (João Ferreira de Almeida Atualizada - PT-BR)'
        };
        if (validMap[target]) {
            try {
                localStorage.setItem('preferred_bible_version', target);
                [localStorage, sessionStorage].forEach(storage => {
                    if (!storage) return;
                    for (let i = storage.length - 1; i >= 0; i--) {
                        const key = storage.key(i);
                        if (key && key.startsWith('bible_cache_')) storage.removeItem(key);
                    }
                });
            } catch (e) { }
            console.log(`[Scripture] Versão da tradução bíblica definida para: ${target}`);
        } else {
            console.warn(`[Scripture] Versão inválida: "${version}". Versões suportadas: NVT, OL, AA`);
            window.listBibleVersions();
        }
    };

    window.resetBibleVersion = () => {
        try {
            localStorage.removeItem('preferred_bible_version');
            [localStorage, sessionStorage].forEach(storage => {
                if (!storage) return;
                for (let i = storage.length - 1; i >= 0; i--) {
                    const key = storage.key(i);
                    if (key && key.startsWith('bible_cache_')) storage.removeItem(key);
                }
            });
        } catch (e) { }
        console.log('[Scripture] Versão da tradução bíblica restaurada para o padrão (NVT)');
    };

    window.listBibleVersions = () => {
        console.log('[Scripture] Versões de tradução disponíveis:');
        console.table([
            { Version: 'NVT', Name: 'Nova Versão Transformadora', Language: 'PT-BR', Command: "setBibleVersion('NVT')" },
            { Version: 'OL', Name: 'O Livro', Language: 'PT-PT', Command: "setBibleVersion('OL')" },
            { Version: 'AA', Name: 'Almeida Atualizada', Language: 'PT-BR', Command: "setBibleVersion('AA')" }
        ]);
    };
}