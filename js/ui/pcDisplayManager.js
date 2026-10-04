/**
 * GESTOR DE BLOQUEIO NO COMPUTADOR (PC)
 * Esta aplicação foi concebida exclusivamente para dispositivos móveis (smartphones).
 * O funcionamento em computadores (PC / desktop) está desativado.
 */

/**
 * Avalia se o ambiente atual é um computador / PC
 */
export function isPcEnvironment() {
    if (typeof window === 'undefined') return false;

    // 1. Resolução padrão de PC / Desktop (largura de ecrã >= 768px)
    if (window.innerWidth >= 768) return true;

    // 2. Deteção de dispositivo não-móvel (computador com janela encolhida manualmente)
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Se não for agente móvel e não possuir ecrã tátil, é um PC
    if (!isMobileUA && !hasTouch) return true;

    return false;
}

/**
 * Aplica ou revoga o bloqueio de funcionamento no PC
 */
export function enforcePcBlock() {
    if (typeof document === 'undefined') return;

    const isBlocked = isPcEnvironment();
    const htmlEl = document.documentElement;

    if (isBlocked) {
        htmlEl.classList.add('is-pc-blocked');
        htmlEl.setAttribute('data-pc-blocked', 'true');

        // Atualiza a indicação do endereço no ecrã de bloqueio
        const urlEl = document.getElementById('pc-block-current-url');
        if (urlEl && typeof window !== 'undefined') {
            try {
                const host = window.location.host || window.location.hostname || 'jewfaith.github.io';
                urlEl.textContent = host;
            } catch (e) {}
        }

        // Torna a árvore da aplicação inerte para impedir qualquer interação em segundo plano
        const appLayout = document.querySelector('.app-layout');
        if (appLayout) {
            appLayout.setAttribute('inert', '');
        }
    } else {
        htmlEl.classList.remove('is-pc-blocked');
        htmlEl.removeAttribute('data-pc-blocked');

        const appLayout = document.querySelector('.app-layout');
        if (appLayout) {
            appLayout.removeAttribute('inert');
        }
    }
}

export function getPcDisplayMode() {
    return 'blocked';
}

export function setPcDisplayMode() {
    enforcePcBlock();
}

/**
 * Inicializa a monitorização do bloqueio de PC
 */
export function initPcDisplayManager() {
    enforcePcBlock();

    if (typeof window !== 'undefined') {
        window.addEventListener('resize', enforcePcBlock, { passive: true });
        window.addEventListener('orientationchange', enforcePcBlock, { passive: true });
        window.getPcDisplayMode = getPcDisplayMode;
        window.setPcDisplayMode = setPcDisplayMode;
    }
}
