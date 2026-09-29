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
    initModalObserver,
    openModalElement,
    openModalByKey,
    initModalUrlSync
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
import { escapeHtml } from '../domain/formatters.js';
import { ICONS } from './icons.js';
import { state } from '../state.js';
import { getFestivalDescription, HEBREW_MONTHS_PT } from '../domain/constants.js';
import { createDescriptionCardHTML, generateCalendarHTML } from './views/dashboardView.js';

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
    openModalElement,
    openModalByKey,
    initModalUrlSync
};

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

        // B. Cartões de Informação (.info-trigger: Festas, Parashá, Calendário e Zmanim em Sha'ah Zmanit)
        const infoTrigger = event.target.closest('.info-trigger');
        if (infoTrigger) {
            // Card de Data Hebraica (#card-hdate-wrapper):
            // Apresenta o modal no estilo rico com a lista cronológica de celebrações, festas e Shabbatot do mês bíblico
            if (infoTrigger.id === 'card-hdate-wrapper' || infoTrigger.closest('#card-hdate-wrapper')) {
                event.preventDefault();
                event.stopPropagation();
                const hdate = state.currentHdate;
                const displayMonth = hdate ? (HEBREW_MONTHS_PT[hdate.hm] || hdate.hm) : 'Mês';
                const titleText = hdate ? `${hdate.hd} ${displayMonth}` : (infoTrigger.getAttribute('data-info-title') || 'Data Hebraica');
                let htmlContent = infoTrigger.getAttribute('data-info-html') || '';
                if (!htmlContent && hdate) {
                    htmlContent = generateCalendarHTML(state.unifiedEvents || [], hdate, Date.now());
                }
                closeOtherModalsOnDesktop('info-modal');
                openInfoModal(titleText, htmlContent);
                return;
            }

            const visibleTitleEl = infoTrigger.querySelector('.settings-card-title, .card-title');
            const visibleCardTitle = visibleTitleEl ? visibleTitleEl.textContent.trim() : '';
            const dataInfoTitle = infoTrigger.getAttribute('data-info-title') || '';
            const lookupTitle = dataInfoTitle || visibleCardTitle || '-';
            const titleText = visibleCardTitle || dataInfoTitle || '-';
            let htmlContent = infoTrigger.getAttribute('data-info-html') || '';

            // Se o HTML armazenado for um fallback curto e as descrições teológicas já estiverem carregadas, gera o cartão rico
            if (!htmlContent || htmlContent.includes('Celebração sagrada do calendário bíblico e judaico.')) {
                const richDesc = getFestivalDescription(lookupTitle) || getFestivalDescription(titleText);
                if (richDesc && (richDesc.torah || richDesc.info || Array.isArray(richDesc) || typeof richDesc === 'string')) {
                    htmlContent = createDescriptionCardHTML(richDesc, `Detalhes e celebração de ${titleText}.`);
                    infoTrigger.setAttribute('data-info-html', htmlContent);
                }
            }

            if (!htmlContent) {
                htmlContent = `<div class="info-modal-card"><div class="info-modal-value">Detalhes e celebração de ${titleText}.</div></div>`;
            }
            event.preventDefault();
            event.stopPropagation();

            // Se for dentro de #info-modal, empilha a visão internamente com botão Voltar
            if (infoTrigger.closest('#info-modal')) {
                pushInfoModalView(titleText, htmlContent);
                return;
            }

            // Se for clicado dentro de #zmanim-modal, preserva retorno ao modal pai
            const parentModal = infoTrigger.closest('#zmanim-modal');
            const returnToModalId = parentModal ? parentModal.id : null;

            closeOtherModalsOnDesktop('info-modal');
            openInfoModal(titleText, htmlContent, { returnToModalId });
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
            const zmanimCardTitle = zmanimTrigger.querySelector('.settings-card-title, .card-title')?.textContent?.trim() ||
                document.getElementById('solar-hero-city-title')?.textContent?.trim() ||
                "Sha'ah Zmanit";
            closeOtherModalsOnDesktop('zmanim-modal');
            openZmanimModal({ cardTitle: zmanimCardTitle });
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
            const sefariaCardTitle = sefariaTrigger.querySelector('.settings-card-title, .card-title')?.textContent?.trim() || '';
            closeOtherModalsOnDesktop('sefaria-modal');
            openSefariaModal(cat, targetRef, { cardTitle: sefariaCardTitle });
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
    });

    // Suporte universal a acessibilidade via teclado (Enter / Espaço) em todos os cards interativos (WCAG 2.1 AA)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            const trigger = event.target.closest('[role="button"], .info-trigger, .location-trigger-btn, .sefaria-category-card, .event-card, .settings-card');
            if (trigger && trigger.tagName !== 'BUTTON' && trigger.tagName !== 'INPUT' && trigger.tagName !== 'TEXTAREA' && trigger.tagName !== 'A') {
                event.preventDefault();
                trigger.click();
            }
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

    initModalUrlSync();
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