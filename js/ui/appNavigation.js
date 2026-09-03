import { renderPrivacyView } from './premiumView.js';

const TAB_HASH_MAP = {
    'reading': 'data',
    'festivals': 'rito',
    'privacy': 'controlo'
};

const HASH_TAB_MAP = {
    'data': 'reading',
    'rito': 'festivals',
    'controlo': 'privacy',
    'controle': 'privacy',
    'tora': 'reading',
    'torá': 'reading',
    'torah': 'reading',
    'inicio': 'reading',
    'início': 'reading',
    'reading': 'reading',
    'festas': 'festivals',
    'festivals': 'festivals',
    'privacidade': 'privacy',
    'privacy': 'privacy',
    'conformidade': 'privacy',
    'compliance': 'privacy',
    'gdpr': 'privacy',
    'cookies': 'privacy',
    'rgpd': 'privacy',
    'lgpd': 'privacy',
    'legal': 'privacy',
    'extras': 'privacy',
    'tools': 'privacy',
    'chat': 'reading',
    'batepapo': 'reading',
    'conta': 'reading',
    'account': 'reading',
    'login': 'reading',
    'registo': 'reading',
    'registro': 'reading',
    'perfil': 'reading'
};

let isNavInitialized = false;

export function getActiveTabFromUrl() {
    if (typeof window === 'undefined') return 'reading';

    // 1. Verifica Hash na URL (#inicio, #festas, #privacidade, #chat, #conta)
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
    if (hash && HASH_TAB_MAP[hash]) {
        return HASH_TAB_MAP[hash];
    }

    // 2. Verifica Query Params (?tab=privacidade)
    try {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab')?.toLowerCase().trim();
        if (tabParam && HASH_TAB_MAP[tabParam]) {
            return HASH_TAB_MAP[tabParam];
        }
    } catch (e) { }

    // 3. Fallback para LocalStorage se a URL não tiver hash
    try {
        const savedTab = localStorage.getItem('yisrael_active_tab');
        if (savedTab && ['reading', 'festivals', 'privacy', 'chat', 'account'].includes(savedTab)) {
            return savedTab;
        }
    } catch (e) { }

    return 'reading';
}

export function switchTab(targetTab, updateUrl = true, smoothScroll = true, userGesture = false) {
    if (!targetTab) return;

    const allTabButtons = document.querySelectorAll('[data-tab]');
    const tabViews = document.querySelectorAll('.app-tab-view');

    // Sincroniza estado ativo em todos os botões (desktop sidebar e mobile tabbar)
    allTabButtons.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === targetTab);
    });

    // Alterna a exibição das abas
    tabViews.forEach(view => {
        view.classList.toggle('active', view.id === `view-${targetTab}`);
    });

    // Atualiza a URL na barra de endereço (#inicio, #festas, #extras, #chat, #conta)
    const hashName = TAB_HASH_MAP[targetTab] || 'inicio';
    if (updateUrl && typeof window !== 'undefined') {
        try {
            history.replaceState(null, '', '#' + hashName);
            localStorage.setItem('yisrael_active_tab', targetTab);
        } catch (e) {
            window.location.hash = hashName;
        }
    }

    // Rola para o topo suavemente ao alternar de aba (tanto window em mobile como app-main-area no desktop)
    if (smoothScroll && typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const mainArea = document.querySelector('.app-main-area');
        if (mainArea) {
            mainArea.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Resposta tátil apenas quando o utilizador toca explicitamente num botão (evita intervenção do navegador no boot)
    if (userGesture && typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
            navigator.vibrate(10);
        } catch (e) { }
    }

    if (targetTab === 'privacy') {
        renderPrivacyView();
    }
}

export function initAppNavigation() {
    if (isNavInitialized) return;
    isNavInitialized = true;

    // Se o utilizador abriu diretamente na aba de privacidade, renderiza-a
    if (getActiveTabFromUrl() === 'privacy') {
        renderPrivacyView();
    }

    const allTabButtons = document.querySelectorAll('[data-tab]');

    allTabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = btn.getAttribute('data-tab');
            if (targetTab) {
                switchTab(targetTab, true, true, true);
            }
        });
    });

    // Sincroniza caso o utilizador use os botões de Avançar / Recuar do navegador
    if (typeof window !== 'undefined') {
        window.addEventListener('hashchange', () => {
            const tabFromHash = getActiveTabFromUrl();
            switchTab(tabFromHash, false, false, false);
        });

        // Restaura a aba da URL no carregamento inicial da página sem vibrar
        const initialTab = getActiveTabFromUrl();
        switchTab(initialTab, true, false, false);
    }
}
