import { renderPrivacyView } from './privacyView.js';
import { renderFestivalsView } from './festivalsView.js';
import { trackMicroAction } from '../utils/umamiMonitor.js';
import { trackHeartEvent, trackFeatureAdoption } from '../services/telemetryService.js';

const TAB_HASH_MAP = {
    'hoje': 'hoje',
    'reading': 'hoje',
    'calendar': 'calendario',
    'festivals': 'calendario',
    'privacy': 'mais'
};

const HASH_TAB_MAP = {
    // Nova Aba Hoje
    'hoje': 'hoje',
    'today': 'hoje',
    'inicio': 'hoje',
    'início': 'hoje',
    'reading': 'hoje',
    'data': 'hoje',
    'tora': 'hoje',
    'torá': 'hoje',
    'torah': 'hoje',
    'premium': 'hoje',
    'loja': 'hoje',
    'store': 'hoje',
    'produtos': 'hoje',
    'conteudos': 'hoje',
    'conteúdos': 'hoje',
    'chat': 'hoje',
    'batepapo': 'hoje',
    'conta': 'hoje',
    'account': 'hoje',
    'login': 'hoje',
    'registo': 'hoje',
    'registro': 'hoje',
    'perfil': 'hoje',

    // Nova Aba Calendário
    'calendario': 'calendar',
    'calendário': 'calendar',
    'calendar': 'calendar',
    'festas': 'calendar',
    'festivals': 'calendar',
    'rito': 'calendar',
    'moed': 'calendar',
    'moadim': 'calendar',

    // Aba Informações / Privacidade / Definições
    'informacoes': 'privacy',
    'informações': 'privacy',
    'guia': 'privacy',
    'sobre': 'privacy',
    'mais': 'privacy',
    'info': 'privacy',
    'definicoes': 'privacy',
    'definições': 'privacy',
    'configuracoes': 'privacy',
    'configurações': 'privacy',
    'termos': 'privacy',
    'controlo': 'privacy',
    'controle': 'privacy',
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
    'tools': 'privacy'
};

let isNavInitialized = false;

export function getActiveTabFromUrl() {
    if (typeof window === 'undefined') return 'hoje';

    // 1. Verifica Hash na URL (#hoje, #calendario, #mais, #inicio, #festas, etc.)
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
    if (hash && HASH_TAB_MAP[hash]) {
        return HASH_TAB_MAP[hash];
    }

    // 2. A página inicial padrão do site é sempre 'hoje'
    return 'hoje';
}

const DESKTOP_HEADER_METADATA = {
    'hoje': {
        tag: 'Tempo Presente',
        title: 'Hoje • Tempo Presente',
        desc: 'Acompanhamento diário essencial, Zmanim astronómicos e leituras sagradas'
    },
    'reading': {
        tag: 'Tempo Presente',
        title: 'Hoje • Tempo Presente',
        desc: 'Acompanhamento diário essencial, Zmanim astronómicos e leituras sagradas'
    },
    'calendar': {
        tag: 'Ciclo Litúrgico',
        title: 'Calendário Mensal & Festas',
        desc: 'Navegação mensal completa, santas convocações da Torá e comemorações históricas'
    },
    'festivals': {
        tag: 'Ciclo Litúrgico',
        title: 'Calendário Mensal & Festas',
        desc: 'Navegação mensal completa, santas convocações da Torá e comemorações históricas'
    },
    'privacy': {
        tag: 'Definições & Mais',
        title: 'Mais Opções & Definições',
        desc: 'Definições personalizadas, salvaguardas de privacidade e informações institucionais'
    }
};

function updateDesktopHeader(targetTab) {
    if (typeof document === 'undefined') return;
    const meta = DESKTOP_HEADER_METADATA[targetTab];
    if (!meta) return;

    const tagEl = document.getElementById('desktop-view-tag-text');
    const titleEl = document.getElementById('desktop-view-title');
    const descEl = document.getElementById('desktop-view-desc');

    if (tagEl) tagEl.textContent = meta.tag;
    if (titleEl) titleEl.textContent = meta.title;
    if (descEl) descEl.textContent = meta.desc;
}

export function switchTab(targetTab, updateUrl = true, smoothScroll = true, userGesture = false) {
    if (!targetTab) return;

    // Normaliza nome da aba para compatibilidade canónica
    let canonicalTab = targetTab;
    if (targetTab === 'reading') canonicalTab = 'hoje';
    else if (targetTab === 'festivals') canonicalTab = 'calendar';

    trackMicroAction('tab_change', { tab: canonicalTab });
    trackHeartEvent('tab_view', { tab: canonicalTab, userGesture });
    trackFeatureAdoption(`tab_${canonicalTab}`);
    updateDesktopHeader(canonicalTab);

    const allTabButtons = document.querySelectorAll('[data-tab]');
    const tabViews = document.querySelectorAll('.app-tab-view');

    // Sincroniza estado ativo em todos os botões (desktop sidebar e mobile tabbar)
    allTabButtons.forEach(b => {
        const bTab = b.getAttribute('data-tab');
        const isActive = (bTab === canonicalTab) ||
                         (canonicalTab === 'hoje' && bTab === 'reading') ||
                         (canonicalTab === 'calendar' && bTab === 'festivals');
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Alterna a exibição das abas (suporta tanto IDs novos como IDs legados)
    tabViews.forEach(view => {
        const isTarget = (view.id === `view-${canonicalTab}`) ||
                         (canonicalTab === 'hoje' && (view.id === 'view-reading' || view.id === 'view-hoje')) ||
                         (canonicalTab === 'calendar' && (view.id === 'view-festivals' || view.id === 'view-calendar')) ||
                         (canonicalTab === 'privacy' && view.id === 'view-privacy');
        view.classList.toggle('active', isTarget);
    });

    // Atualiza a URL na barra de endereço (#hoje, #calendario, #mais)
    const hashName = TAB_HASH_MAP[canonicalTab] || 'hoje';
    if (updateUrl && typeof window !== 'undefined') {
        try {
            history.replaceState(null, '', '#' + hashName);
            localStorage.setItem('yisrael_active_tab', canonicalTab);
        } catch (e) {
            window.location.hash = hashName;
        }
    }

    // Rola para o topo suavemente ao alternar de aba
    if (smoothScroll && typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const mainArea = document.querySelector('.app-main-area');
        if (mainArea) {
            mainArea.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Resposta tátil quando o utilizador toca explicitamente num botão
    if (userGesture && typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
            navigator.vibrate(10);
        } catch (e) { }
    }

    if (canonicalTab === 'privacy') {
        if (typeof document !== 'undefined') {
            document.querySelectorAll('.modal-overlay').forEach(m => {
                m.style.display = 'none';
                m.classList.remove('is-closing');
            });
            document.body.classList.remove('modal-open');
        }
        renderPrivacyView();
    } else if (canonicalTab === 'calendar') {
        renderFestivalsView();
    }
}

export function initAppNavigation() {
    if (isNavInitialized) return;
    isNavInitialized = true;

    // Pré-renderiza a aba de termos para transição instantânea sem layout shift
    renderPrivacyView();

    // Delegação global de eventos para todos os botões com [data-tab] (estáticos e dinâmicos)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tab]');
        if (btn) {
            e.preventDefault();
            const targetTab = btn.getAttribute('data-tab');
            if (targetTab) {
                switchTab(targetTab, true, true, true);
            }
        }
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
