/**
 * SKELETON.JS - COMPONENTES VISUAIS DE CARREGAMENTO ESQUELETO
 * 
 * Centraliza os templates de skeletons do dashboard e modal de leitura bíblica.
 */

/**
 * Gera cartões de esqueleto para listas de eventos e configurações.
 */
export function createSkeletonCardsHTML(count = 5) {
    const widthClasses = ['w-70p', 'w-80p', 'w-60p', 'w-75p', 'w-65p'];
    let html = '';
    for (let i = 0; i < count; i++) {
        const wClass = widthClasses[i % widthClasses.length];
        html += `
            <div class="settings-card event-card glass-panel skeleton-card not-ready" aria-hidden="true">
                <div class="settings-card-left">
                    <div class="skeleton-line skeleton-icon-dot"></div>
                    <div class="settings-card-text skeleton-text-container">
                        <span class="skeleton-line skeleton-line-title ${wClass}"></span>
                        <span class="skeleton-line skeleton-line-sub w-35p"></span>
                    </div>
                </div>
                <div class="skeleton-line skeleton-arrow-dot"></div>
            </div>
        `;
    }
    return html;
}

/**
 * Gera o esqueleto de carregamento para o modal de leitura bíblica.
 */
export function getReadingSkeletonHTML() {
    return `
        <div class="thematic-loader-container">
            <div class="thematic-star-loader" role="status" aria-label="A carregar">
                <i class="fa-solid fa-star-of-david" aria-hidden="true"></i>
            </div>
        </div>
    `;
}
