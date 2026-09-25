/**
 * HOMEPRODUCTS.JS - CARTÕES DE PRODUTOS PAGOS E APOIO NA PÁGINA INICIAL
 * 
 * Apresenta produtos digitais e apoio ao projeto na página inicial (view-reading).
 * Adere estritamente à identidade visual: .settings-card.event-card.glass-panel,
 * títulos limpos de duas palavras e observância haláchica no Shabat e Festas da Torá.
 */

import { PREMIUM_SUBSCRIPTION } from '../../domain/premiumProducts.js';
import { state } from '../../state.js';
import { checkSacredRestStatus } from '../../domain/halacha.js';

export const SUPPORT_CONFIG = {
    kofiUrl: 'https://ko-fi.com/O0D721T8VH',
    kofiShopUrl: 'https://ko-fi.com/O0D721T8VH/shop',
    kofiTiersUrl: 'https://ko-fi.com/O0D721T8VH/tiers'
};

export const HOME_PRODUCTS_ITEMS = [
    {
        id: 'apoio-voluntario',
        twoWordTitle: 'Apoio Voluntário',
        subtitle: 'Contribuição Livre',
        briefDesc: 'Apoio voluntário independente para manutenção da infraestrutura, cálculos astronómicos de alta precisão e difusão das Festas da Torá.',
        icon: 'fa-solid fa-heart',
        desc: 'O Yisrael Date é uma iniciativa independente dedicada ao estudo bíblico, horários haláchicos de alta precisão e difusão das Festas da Torá. O acesso é totalmente gratuito e universal, sem anúncios comerciais e sem rastreio.',
        features: [
            'Manutenção de servidores e infraestrutura em nuvem',
            'Desenvolvimento contínuo de novas funcionalidades',
            'Acesso 100% gratuito e universal para toda a comunidade',
            'Sem publicidade comercial e sem recolha de dados pessoais'
        ],
        status: 'disponivel',
        url: SUPPORT_CONFIG.kofiUrl,
        btnType: 'kofi',
        btnText: 'Apoiar Projeto',
        btnNote: 'Apoio direto e seguro'
    }
];

export function buildProductModalHtml(item, isSacredRest = false, customReason = null) {
    const briefText = item.briefDesc || item.subtitle || '';

    if (isSacredRest) {
        const noticeText = customReason || 'Em observância às Festas Solenes da Torá (desde 2 horas antes até 2 horas depois do término), as contribuições financeiras encontram-se temporariamente suspensas durante este período sagrado.';
        return `
            <div class="levels-container compliance-modal-stack">
                ${briefText ? `
                    <div class="info-modal-card">
                        <div class="info-modal-value">
                            ${briefText}
                        </div>
                    </div>
                ` : ''}
                <div class="info-modal-card">
                    <div class="info-modal-value">
                        ${noticeText}
                    </div>
                </div>
            </div>
        `.trim();
    }

    const isAvailable = item.status === 'disponivel';

    let actionSection = '';
    if (isAvailable) {
        const embedUrl = item.embedUrl || (item.id === 'apoio-voluntario' 
            ? 'https://ko-fi.com/O0D721T8VH/?hidefeed=true&widget=true&embed=true' 
            : (item.id === 'subscricao-anual' 
                ? 'https://ko-fi.com/O0D721T8VH/tiers/?widget=true&embed=true' 
                : 'https://ko-fi.com/O0D721T8VH/shop/?widget=true&embed=true'));

        actionSection = `
            <div class="info-modal-card kofi-embed-card">
                <div class="kofi-embed-iframe-wrapper">
                    <div class="kofi-loading-indicator">
                        <div class="kofi-pure-spinner"></div>
                        <span class="kofi-loading-status">A carregar...</span>
                        <div class="kofi-loading-notice">
                            <span class="kofi-notice-title">Aviso Ligação</span>
                            <p class="kofi-notice-text">O carregamento está a demorar mais do que o habitual. Por favor aguarde um momento.</p>
                        </div>
                    </div>
                    <iframe src="${embedUrl}" 
                            title="${item.twoWordTitle}" 
                            class="kofi-modal-frame"
                            onload="this.parentElement.classList.add('is-loaded');"
                            onerror="this.parentElement.classList.add('is-loaded');"
                            allow="payment">
                    </iframe>
                </div>
            </div>
        `;
    } else {
        actionSection = `
            <div class="modal-action-box">
                <span class="premium-btn-action premium-btn-soon home-soon-btn">
                    <span>Disponível Brevemente</span>
                </span>
            </div>
        `;
    }

    return `
        <div class="levels-container compliance-modal-stack kofi-modal-stack">
            ${briefText ? `
                <div class="info-modal-card">
                    <div class="info-modal-value info-val-fluid">
                        ${briefText}
                    </div>
                </div>
            ` : ''}
            ${actionSection}
        </div>
    `.trim();
}

export function renderHomeProducts() {
    if (typeof document === 'undefined') return;
    const grid = document.getElementById('home-products-grid');
    if (!grid) return;

    const restStatus = checkSacredRestStatus(
        Date.now(),
        state.unifiedEvents || [],
        state.currentHdate,
        state.currentSunsetTime || 0,
        state.userLocation?.isIsrael ?? true
    );
    const isSacredRest = Boolean(restStatus.isRest && restStatus.type === 'yomtov');

    const renderKey = `v16_${isSacredRest ? 'rest' : 'normal'}_${HOME_PRODUCTS_ITEMS.length}`;
    if (grid.dataset.renderedProductsKey === renderKey && grid.children.length === HOME_PRODUCTS_ITEMS.length) {
        return;
    }

    grid.innerHTML = '';
    grid.dataset.renderedProductsKey = renderKey;

    const fragment = document.createDocumentFragment();

    HOME_PRODUCTS_ITEMS.forEach(item => {
        const modalHtml = buildProductModalHtml(item, isSacredRest, restStatus?.reason);

        const card = document.createElement('div');
        card.className = `settings-card event-card glass-panel info-trigger${isSacredRest ? ' is-sacred-rest is-blocked-torah' : ''}`;
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('data-info-title', item.twoWordTitle);
        card.setAttribute('data-info-html', modalHtml);
        card.setAttribute('aria-label', item.twoWordTitle);

        card.innerHTML = `
            <div class="settings-card-left">
                <i class="${item.icon} settings-icon"></i>
                <div class="settings-card-text">
                    <span class="settings-card-title">${item.twoWordTitle}</span>
                    <span class="settings-card-desc">${isSacredRest ? 'Observância Sagrada' : item.subtitle}</span>
                </div>
            </div>
            <div class="card-arrow-action" aria-hidden="true">
                <i class="fa-solid fa-arrow-right"></i>
            </div>
        `;

        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
}

if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => {
        renderHomeProducts();
    });
}

