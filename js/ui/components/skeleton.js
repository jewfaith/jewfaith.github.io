/**
 * SKELETON.JS - COMPONENTES VISUAIS DE CARREGAMENTO ESQUELETO
 * 
 * Centraliza os templates de skeletons do dashboard e modal de leitura bíblica.
 */

/**
 * Gera cartões de esqueleto para listas de eventos e configurações.
 */
export function createSkeletonCardsHTML(count = 5) {
    const widths = ['70%', '80%', '60%', '75%', '65%'];
    let html = '';
    for (let i = 0; i < count; i++) {
        const w = widths[i % widths.length];
        html += `
            <div class="settings-card event-card glass-panel skeleton-card not-ready" aria-hidden="true">
                <div class="settings-card-left">
                    <div class="skeleton-line" style="width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; margin-right: 12px;"></div>
                    <div class="settings-card-text" style="width: 100%;">
                        <span class="skeleton-line" style="display: block; width: ${w}; height: 16px; border-radius: 4px; margin-bottom: 4px;"></span>
                        <span class="skeleton-line" style="display: block; width: 35%; height: 11px; border-radius: 3px;"></span>
                    </div>
                </div>
                <div class="skeleton-line" style="width: 7px; height: 11px; border-radius: 2px; opacity: 0.25; flex-shrink: 0;"></div>
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
