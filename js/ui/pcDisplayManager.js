// Gestor de Modo de Exibição no PC (Desktop >= 768px)
// Modo exclusivo: 'drawer' (Painel Lateral à direita)

const STORAGE_KEY = 'pc_display_mode';

export function getPcDisplayMode() {
    return 'drawer';
}

export function setPcDisplayMode(mode = 'drawer') {
    try {
        localStorage.setItem(STORAGE_KEY, 'drawer');
    } catch (e) { }

    document.documentElement.setAttribute('data-pc-mode', 'drawer');

    // Garante que a interface nunca fique travada por inert no desktop
    const wrapper = document.querySelector('.app-layout');
    if (wrapper) {
        wrapper.removeAttribute('inert');
    }
}

export function initPcDisplayManager() {
    const wrapper = document.querySelector('.app-layout');
    if (wrapper) {
        wrapper.removeAttribute('inert');
    }

    setPcDisplayMode('drawer');

    if (typeof window !== 'undefined') {
        window.setPcDisplayMode = setPcDisplayMode;
        window.getPcDisplayMode = getPcDisplayMode;
    }
}
