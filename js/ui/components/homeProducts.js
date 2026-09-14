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
            <div class="info-modal-card kofi-embed-card" style="flex: 1 1 auto !important; min-height: 0 !important; height: 100% !important; width: 100% !important; display: flex !important; flex-direction: column !important; padding: 0 !important; overflow: hidden !important; border-radius: 16px !important; margin: 0 !important; background: #ffffff !important; border: 1px solid rgba(255, 255, 255, 0.12) !important; box-sizing: border-box !important;">
                <div class="kofi-embed-iframe-wrapper" style="position: relative !important; width: 100% !important; height: 100% !important; flex: 1 1 auto !important; min-height: 0 !important; overflow: hidden !important; background: #ffffff !important; box-sizing: border-box !important;">
                    <div class="kofi-loading-indicator" style="position: absolute !important; inset: 0 !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; gap: 14px !important; padding: 20px !important; box-sizing: border-box !important; text-align: center !important; color: #333333 !important; background: #fdfdfd !important; z-index: 5 !important; transition: opacity 0.3s ease, visibility 0.3s ease !important;">
                        <div class="kofi-pure-spinner"></div>
                        <span class="kofi-loading-status" style="font-size: 0.88rem !important; font-weight: 500 !important; color: #444444 !important; max-width: 90% !important; line-height: 1.4 !important;">A carregar...</span>
                        <div class="kofi-loading-notice" style="display: none; margin-top: 10px !important; padding: 14px 18px !important; background: #f7fafc !important; border: 1px solid #e2e8f0 !important; border-radius: 14px !important; flex-direction: column !important; align-items: center !important; gap: 6px !important; max-width: 92% !important; box-sizing: border-box !important;">
                            <span class="kofi-notice-title" style="font-size: 0.85rem !important; font-weight: 600 !important; color: #8C531B !important;">Aviso Ligação</span>
                            <p class="kofi-notice-text" style="font-size: 0.78rem !important; line-height: 1.45 !important; color: #666666 !important; margin: 0 !important; text-align: center !important;">O carregamento está a demorar mais do que o habitual. Por favor aguarde um momento.</p>
                        </div>
                    </div>
                    <iframe src="${embedUrl}" 
                            title="${item.twoWordTitle}" 
                            class="kofi-modal-frame"
                            style="position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; border: none !important; background: #ffffff !important; display: block !important;"
                            onload="this.parentElement.classList.add('is-loaded'); var p=this.parentElement.querySelector('.kofi-loading-indicator'); if(p) p.style.display='none';"
                            onerror="this.parentElement.classList.add('is-loaded'); var p=this.parentElement.querySelector('.kofi-loading-indicator'); if(p) p.style.display='none';"
                            allow="payment">
                    </iframe>
                </div>
            </div>
        `;
    } else {
        actionSection = `
            <div style="margin-top: 10px;">
                <span class="premium-btn-action premium-btn-soon" style="width: 100%; min-height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                    <span>Disponível Brevemente</span>
                </span>
            </div>
        `;
    }

    return `
        <div class="levels-container compliance-modal-stack kofi-modal-stack" style="display: flex !important; flex-direction: column !important; flex: 1 1 auto !important; min-height: 0 !important; height: 100% !important; width: 100% !important; overflow: hidden !important;">
            ${briefText ? `
                <div class="info-modal-card" style="flex-shrink: 0 !important; width: 100% !important; box-sizing: border-box !important;">
                    <div class="info-modal-value" style="font-weight: 400; font-size: var(--font-size-sm); line-height: 1.6; color: var(--text-primary); text-align: left; white-space: normal;">
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
        card.style.cursor = 'pointer';

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

