import { renderPrivacyView } from './privacyView.js';
import { renderFestivalsView } from './festivalsView.js';
import { trackMicroAction } from '../utils/umamiMonitor.js';
import { trackHeartEvent, trackFeatureAdoption } from '../services/telemetryService.js';

const TAB_HASH_MAP = {
    'hoje': 'hoje',
    'reading': 'hoje',
    'tora': 'hoje',
    'torah': 'hoje',
    'calendar': 'moadim',
    'festivals': 'moadim',
    'moadim': 'moadim',
    'festas': 'moadim',
    'privacy': 'guia',
    'guia': 'guia'
};

const HASH_TAB_MAP = {
    // 1. Aba Hoje
    'hoje': 'hoje',
    'today': 'hoje',
    'inicio': 'hoje',
    'início': 'hoje',
    'reading': 'hoje',
    'data': 'hoje',
    'zmanim': 'hoje',
    'horarios': 'hoje',
    'horários': 'hoje',
    'chat': 'hoje',
    'batepapo': 'hoje',
    'conta': 'hoje',
    'account': 'hoje',
    'login': 'hoje',
    'perfil': 'hoje',

    // 2. Estudo Sagrado & Leituras (redirecionam para 'hoje' com scroll suave até à seção de estudo)
    'tora': 'hoje',
    'torá': 'hoje',
    'torah': 'hoje',
    'chumash': 'hoje',
    'parasha': 'hoje',
    'parashá': 'hoje',
    'haftara': 'hoje',
    'haftará': 'hoje',
    'ketuvim': 'hoje',
    'sefaria': 'hoje',
    'tanakh': 'hoje',
    'estudo': 'hoje',
    'leituras': 'hoje',

    // 3. Aba Moadim & Festas
    'moadim': 'calendar',
    'moed': 'calendar',
    'calendario': 'calendar',
    'calendário': 'calendar',
    'calendar': 'calendar',
    'festas': 'calendar',
    'festivals': 'calendar',
    'rito': 'calendar',
    'omer': 'calendar',

    // 4. Aba Guia / Metodologia / Privacidade / Conformidade
    'guia': 'privacy',
    'informacoes': 'privacy',
    'informações': 'privacy',
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
    'tools': 'privacy',
    'loja': 'privacy',
    'store': 'privacy',
    'produtos': 'privacy',
    'premium': 'privacy'
};

let isNavInitialized = false;

export function getActiveTabFromUrl() {
    if (typeof window === 'undefined') return 'hoje';

    // 1. Verifica Hash na URL (#hoje, #tora, #moadim, #guia, etc.)
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
        docTitle: 'Yisrael Date • Calendário Hebraico, Torá e Horários Zmanim',
        desc: 'Acompanhamento diário essencial, Zmanim astronómicos e síntese litúrgica'
    },
    'reading': {
        tag: 'Tempo Presente',
        title: 'Hoje • Tempo Presente',
        docTitle: 'Yisrael Date • Calendário Hebraico, Torá e Horários Zmanim',
        desc: 'Acompanhamento diário essencial, Zmanim astronómicos e síntese litúrgica'
    },
    'calendar': {
        tag: 'Ciclo Litúrgico',
        title: 'Moadim & Festas de Israel',
        docTitle: 'Moadim e Festas de Israel • Calendário Bíblico | Yisrael Date',
        desc: 'Navegação mensal completa, santas convocações da Torá e comemorações históricas'
    },
    'festivals': {
        tag: 'Ciclo Litúrgico',
        title: 'Moadim & Festas de Israel',
        docTitle: 'Moadim e Festas de Israel • Calendário Bíblico | Yisrael Date',
        desc: 'Navegação mensal completa, santas convocações da Torá e comemorações históricas'
    },
    'moadim': {
        tag: 'Ciclo Litúrgico',
        title: 'Moadim & Festas de Israel',
        docTitle: 'Moadim e Festas de Israel • Calendário Bíblico | Yisrael Date',
        desc: 'Navegação mensal completa, santas convocações da Torá e comemorações históricas'
    },
    'privacy': {
        tag: 'Metodologia & Guia',
        title: 'Guia do Projeto & Metodologia',
        docTitle: 'Guia, Metodologia Haláchica e Privacidade | Yisrael Date',
        desc: 'Metodologia de cálculo haláchico, transparência ética, fontes e diretrizes'
    },
    'guia': {
        tag: 'Metodologia & Guia',
        title: 'Guia do Projeto & Metodologia',
        docTitle: 'Guia, Metodologia Haláchica e Privacidade | Yisrael Date',
        desc: 'Metodologia de cálculo haláchico, transparência ética, fontes e diretrizes'
    }
};

function updateDesktopHeader(targetTab) {
    if (typeof document === 'undefined') return;
    const meta = DESKTOP_HEADER_METADATA[targetTab];
    if (!meta) return;

    if (meta.docTitle) {
        document.title = meta.docTitle;
    }

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
    let scrollToStudy = false;
    if (targetTab === 'reading') canonicalTab = 'hoje';
    else if (targetTab === 'torah' || targetTab === 'tora') {
        canonicalTab = 'hoje';
        scrollToStudy = true;
    }
    else if (targetTab === 'festivals' || targetTab === 'moadim') canonicalTab = 'calendar';
    else if (targetTab === 'guia') canonicalTab = 'privacy';

    trackMicroAction('tab_change', { tab: targetTab });
    trackHeartEvent('tab_view', { tab: targetTab, userGesture });
    trackFeatureAdoption(`tab_${targetTab}`);
    updateDesktopHeader(canonicalTab);

    const allTabButtons = document.querySelectorAll('[data-tab]');
    const tabViews = document.querySelectorAll('.app-tab-view');

    // Sincroniza estado ativo em todos os botões (desktop sidebar e mobile tabbar)
    allTabButtons.forEach(b => {
        const bTab = b.getAttribute('data-tab');
        const isActive = (bTab === canonicalTab) ||
                         (canonicalTab === 'hoje' && (bTab === 'reading' || bTab === 'hoje')) ||
                         (canonicalTab === 'calendar' && (bTab === 'festivals' || bTab === 'moadim' || bTab === 'calendar')) ||
                         (canonicalTab === 'privacy' && (bTab === 'guia' || bTab === 'privacy' || bTab === 'mais'));
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    // Alterna a exibição das abas (suporta tanto IDs novos como IDs legados)
    tabViews.forEach(view => {
        const isTarget = (view.id === `view-${canonicalTab}`) ||
                         (canonicalTab === 'hoje' && (view.id === 'view-reading' || view.id === 'view-hoje')) ||
                         (canonicalTab === 'calendar' && (view.id === 'view-festivals' || view.id === 'view-calendar' || view.id === 'view-moadim')) ||
                         (canonicalTab === 'privacy' && (view.id === 'view-privacy' || view.id === 'view-guia'));
        view.classList.toggle('active', isTarget);
    });

    // Atualiza a URL na barra de endereço (#hoje, #tora, #moadim, #guia)
    const hashName = TAB_HASH_MAP[targetTab] || TAB_HASH_MAP[canonicalTab] || 'hoje';
    if (updateUrl && typeof window !== 'undefined') {
        try {
            const nextUrl = (hashName === 'hoje' && !window.location.hash) ? window.location.pathname : ('#' + hashName);
            history.replaceState(null, '', nextUrl);
            localStorage.setItem('yisrael_active_tab', targetTab);
        } catch (e) {
            window.location.hash = hashName;
        }
    }

    // Rola para a seção ou topo suavemente ao alternar de aba
    if (scrollToStudy && typeof window !== 'undefined') {
        setTimeout(() => {
            const studySection = document.getElementById('section-estudo-sagrado') || document.getElementById('card-torah-wrapper');
            if (studySection) {
                studySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 60);
    } else if (smoothScroll && typeof window !== 'undefined') {
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
                m.classList.add('is-hidden');
                m.classList.remove('is-open');
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
