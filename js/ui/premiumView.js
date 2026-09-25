/**
 * PREMIUMVIEW.JS - VISTA DEDICADA DE CONTEÚDOS DIGITAIS PREMIUM
 * 
 * Apresenta a montra completa de produtos digitais, com catálogo categorizado,
 * filtros interativos e acesso direto a materiais de estudo e calendários,
 * processado externamente via Ko-fi.
 */

import { 
    PREMIUM_SUBSCRIPTION, 
    PREMIUM_CATEGORIES, 
    PREMIUM_PRODUCTS, 
    getProductsByCategory,
    getProductById
} from '../domain/premiumProducts.js';
import { state } from '../state.js';
import { checkSacredRestStatus } from '../domain/halacha.js';
import { openInfoModal } from './modals.js';
import { buildProductModalHtml } from './components/homeProducts.js';

// Retrocompatibilidade para eventuais chamadas anteriores
export { renderPrivacyView } from './privacyView.js';

let activeCategoryFilter = 'todos';
let isPremiumEventsBound = false;

function renderHeroHeader() {
    return `
        <div class="premium-hero-card glass-panel">
            <div class="premium-hero-content">
                <div class="premium-hero-badge">
                    <i class="fa-solid fa-crown" aria-hidden="true"></i>
                    <span>Exclusivo</span>
                </div>
                <h2 class="premium-hero-title">Premium</h2>
                <p class="premium-hero-subtitle">
                    Conteúdos exclusivos para aprofundar o calendário e as Festas da Torá.
                </p>
            </div>
        </div>
    `;
}

function renderSubscriptionCard() {
    const sub = PREMIUM_SUBSCRIPTION;
    return `
        <div class="premium-subscription-card glass-panel">
            <div class="premium-sub-badge-wrap">
                <span class="premium-sub-pill">
                    <i class="fa-solid fa-gem" aria-hidden="true"></i>
                    ${sub.badge}
                </span>
            </div>
            
            <div class="premium-sub-header">
                <div class="premium-sub-title-group">
                    <h3 class="premium-sub-title">${sub.name}</h3>
                    <span class="premium-sub-period-label">${sub.subtitle}</span>
                </div>
            </div>

            <p class="premium-sub-desc">${sub.description}</p>

            <ul class="premium-sub-features" aria-label="Benefícios da Subscrição">
                ${sub.highlights.map(h => `
                    <li class="premium-sub-feature-item">
                        <i class="fa-solid fa-check" aria-hidden="true"></i>
                        <span>${h}</span>
                    </li>
                `).join('')}
            </ul>

            <div class="premium-sub-action">
                <button type="button" 
                   class="premium-btn-primary premium-btn-subscribe premium-open-sub-modal-btn"
                   aria-label="${sub.ctaText}">
                    <i class="fa-solid fa-crown" aria-hidden="true"></i>
                    <span>${sub.ctaText}</span>
                </button>
                <span class="premium-sub-note">
                    <i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
                    Pagamento e entrega digital seguros
                </span>
            </div>
        </div>
    `;
}

function renderCategoryPills() {
    return `
        <div class="premium-filter-bar" role="tablist" aria-label="Filtrar por Categoria">
            ${PREMIUM_CATEGORIES.map(cat => `
                <button type="button" 
                        class="premium-filter-pill${activeCategoryFilter === cat.id ? ' active' : ''}" 
                        data-premium-cat="${cat.id}"
                        role="tab"
                        aria-selected="${activeCategoryFilter === cat.id ? 'true' : 'false'}">
                    <i class="${cat.icon}" aria-hidden="true"></i>
                    <span>${cat.name}</span>
                </button>
            `).join('')}
        </div>
    `;
}

function renderProductCard(product) {
    const isAvailable = product.status === 'disponivel';
    const isSoon = product.status === 'em_breve';

    let actionButtonHtml = '';
    if (isAvailable) {
        actionButtonHtml = `
            <button type="button" 
               class="premium-btn-action premium-btn-buy premium-open-product-modal-btn w-100"
               data-product-id="${product.id}"
               aria-label="Aceder a ${product.name}">
                <i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>
                <span>Aceder</span>
            </button>
        `;
    } else if (isSoon) {
        actionButtonHtml = `
            <span class="premium-btn-action premium-btn-soon w-100" 
                  aria-disabled="true" 
                  title="Este produto estará disponível brevemente">
                <i class="fa-solid fa-clock" aria-hidden="true"></i>
                <span>Em breve</span>
            </span>
        `;
    } else {
        actionButtonHtml = `
            <span class="premium-btn-action premium-btn-disabled w-100" aria-disabled="true">
                <span>Indisponível</span>
            </span>
        `;
    }

    const categoryObj = PREMIUM_CATEGORIES.find(c => c.id === product.category);
    const categoryName = categoryObj ? categoryObj.name : product.category;

    return `
        <div class="premium-product-card glass-panel" data-category="${product.category}">
            <div class="premium-product-top">
                <div class="premium-product-cat-tag">
                    <i class="${product.icon}" aria-hidden="true"></i>
                    <span>${categoryName}</span>
                </div>
                ${isSoon ? `<span class="premium-status-pill soon">Em breve</span>` : ''}
            </div>

            <h4 class="premium-product-title">${product.name}</h4>
            <p class="premium-product-desc">${product.desc}</p>

            ${product.features && product.features.length ? `
                <ul class="premium-product-features">
                    ${product.features.map(f => `
                        <li>
                            <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
                            <span>${f}</span>
                        </li>
                    `).join('')}
                </ul>
            ` : ''}

            <div class="premium-product-footer">
                <div class="premium-product-action-box">
                    ${actionButtonHtml}
                </div>
            </div>
        </div>
    `;
}

function renderProductsGrid(category = 'todos') {
    const products = getProductsByCategory(category);
    if (!products.length) {
        return `
            <div class="premium-empty-state glass-panel">
                <i class="fa-solid fa-box-open" aria-hidden="true"></i>
                <p>Nenhum produto encontrado nesta categoria de momento.</p>
            </div>
        `;
    }

    return `
        <div class="premium-products-grid" id="premium-products-grid-container">
            ${products.map(renderProductCard).join('')}
        </div>
    `;
}

function renderCategoriesOverview() {
    const validCats = PREMIUM_CATEGORIES.filter(c => c.id !== 'todos');
    return `
        <div class="festival-section-header">
            <div class="festival-section-title-wrap">
                <h3 class="festival-section-title">Categorias</h3>
            </div>
        </div>
        <div class="event-cards-row">
            ${validCats.map(cat => `
                <div class="settings-card event-card glass-panel premium-cat-card" 
                     data-filter-trigger="${cat.id}"
                     role="button"
                     tabindex="0"
                     aria-label="Ver produtos de ${cat.name}">
                    <div class="settings-card-left">
                        <i class="${cat.icon} settings-icon" aria-hidden="true"></i>
                        <div class="settings-card-text">
                            <span class="settings-card-title">${cat.name}</span>
                            <span class="settings-card-desc">${cat.description}</span>
                        </div>
                    </div>
                    <div class="card-arrow-action" aria-hidden="true">
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function bindPremiumEvents() {
    if (isPremiumEventsBound || typeof document === 'undefined') return;
    isPremiumEventsBound = true;

    document.addEventListener('click', (e) => {
        // 1. Alternância de filtros de categoria
        const filterBtn = e.target.closest('[data-premium-cat]');
        if (filterBtn) {
            e.preventDefault();
            const catId = filterBtn.getAttribute('data-premium-cat');
            if (catId && catId !== activeCategoryFilter) {
                activeCategoryFilter = catId;
                updateCategoryPillsAndGrid();
            }
            return;
        }

        // 2. Clique em cartões de categoria para filtrar
        const catCard = e.target.closest('[data-filter-trigger]');
        if (catCard) {
            e.preventDefault();
            const catId = catCard.getAttribute('data-filter-trigger');
            if (catId) {
                activeCategoryFilter = catId;
                updateCategoryPillsAndGrid();
                const filterBar = document.querySelector('.premium-filter-bar');
                if (filterBar) {
                    filterBar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
            return;
        }

        // 3. Abrir modal com pagamento/checkout integrado Ko-fi para subscrição anual
        const subBtn = e.target.closest('.premium-open-sub-modal-btn');
        if (subBtn) {
            e.preventDefault();
            const restStatus = checkSacredRestStatus(
                Date.now(),
                state.unifiedEvents || [],
                state.currentHdate,
                state.currentSunsetTime || 0,
                state.userLocation?.isIsrael ?? true
            );
            const isSacredRest = Boolean(restStatus.isRest && restStatus.type === 'yomtov');
            const subItem = {
                id: 'subscricao-anual',
                twoWordTitle: 'Subscrição Anual',
                subtitle: 'Acesso Anual',
                briefDesc: 'Acesso anual ilimitado a todos os calendários em alta resolução e materiais de estudo.',
                desc: PREMIUM_SUBSCRIPTION.description,
                features: PREMIUM_SUBSCRIPTION.highlights,
                status: PREMIUM_SUBSCRIPTION.status,
                url: PREMIUM_SUBSCRIPTION.kofiUrl,
                embedUrl: PREMIUM_SUBSCRIPTION.embedUrl,
                btnText: PREMIUM_SUBSCRIPTION.ctaText,
                btnNote: 'Acesso seguro e continuado'
            };
            openInfoModal('Subscrição Anual', buildProductModalHtml(subItem, isSacredRest, restStatus?.reason));
            return;
        }

        // 4. Abrir modal com pagamento/checkout integrado Ko-fi para produto digital
        const buyBtn = e.target.closest('.premium-open-product-modal-btn');
        if (buyBtn) {
            e.preventDefault();
            const productId = buyBtn.getAttribute('data-product-id');
            const product = getProductById(productId);
            if (!product) return;

            const restStatus = checkSacredRestStatus(
                Date.now(),
                state.unifiedEvents || [],
                state.currentHdate,
                state.currentSunsetTime || 0,
                state.userLocation?.isIsrael ?? true
            );
            const isSacredRest = Boolean(restStatus.isRest && restStatus.type === 'yomtov');

            const productItem = {
                id: product.id,
                twoWordTitle: product.name,
                subtitle: 'Conteúdo Digital',
                briefDesc: product.desc || 'Conteúdo digital completo para estudo bíblico e calendário sagrado.',
                desc: product.desc,
                features: product.features,
                status: product.status,
                url: product.kofiUrl || product.payhipUrl,
                embedUrl: product.embedUrl || 'https://ko-fi.com/O0D721T8VH/shop/?widget=true&embed=true',
                btnText: 'Adquirir Conteúdo',
                btnNote: 'Entrega digital imediata'
            };
            openInfoModal(product.name, buildProductModalHtml(productItem, isSacredRest, restStatus?.reason));
            return;
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const catCard = e.target.closest('[data-filter-trigger]');
            if (catCard) {
                e.preventDefault();
                const catId = catCard.getAttribute('data-filter-trigger');
                if (catId) {
                    activeCategoryFilter = catId;
                    updateCategoryPillsAndGrid();
                }
            }
        }
    });
}

function updateCategoryPillsAndGrid() {
    const pills = document.querySelectorAll('.premium-filter-pill');
    pills.forEach(p => {
        const cat = p.getAttribute('data-premium-cat');
        const isActive = cat === activeCategoryFilter;
        p.classList.toggle('active', isActive);
        p.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    const gridContainer = document.getElementById('premium-products-grid-container');
    if (gridContainer) {
        gridContainer.outerHTML = renderProductsGrid(activeCategoryFilter);
    }
}

export function renderPremiumView(force = false) {
    if (typeof document === 'undefined') return;

    const container = document.getElementById('premium-content-container');
    if (!container) return;

    bindPremiumEvents();

    if (!force && container.children.length > 0) {
        return;
    }

    container.innerHTML = `
        <div class="premium-view-wrapper">
            ${renderHeroHeader()}
            ${renderSubscriptionCard()}

            <div class="festival-section-header">
                <div class="festival-section-title-wrap">
                    <h3 class="festival-section-title">Conteúdos</h3>
                </div>
            </div>

            ${renderCategoryPills()}
            ${renderProductsGrid(activeCategoryFilter)}
            ${renderCategoriesOverview()}
        </div>
    `;
}
