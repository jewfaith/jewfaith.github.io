/**
 * SYSTEM DIAGNOSTICS & TELEMETRY MONITOR - Yisrael Date
 * 
 * Gere todos os avisos e erros do sistema num único bloco minimalista e sem tags.
 * Suporta monitorização de telemetria (Umami), estado de rede offline e integridade do runtime.
 */

const WEBSITE_ID = '6cd4c599-d27b-4542-aced-dcef8e470f0c';
const UMAMI_API_ENDPOINT = 'https://cloud.umami.is/api/send';

const ERROR_PRIORITIES = {
    'offline': 100,
    'network': 90,
    'storage': 80,
    'runtime': 70,
    'umami': 20,
    'test': 10
};

let isUmamiBlocked = false;
let isDirectFallbackActive = false;
let umamiSessionCache = null;
const activeErrors = new Map();
const microActionQueue = [];
let isFlushingQueue = false;

function sanitizePayloadData(data) {
    if (!data || typeof data !== 'object') return {};
    const clean = {};
    for (const [key, val] of Object.entries(data)) {
        const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
        if (!safeKey) continue;
        if (typeof val === 'string') {
            clean[safeKey] = val.slice(0, 100);
        } else if (typeof val === 'number' && Number.isFinite(val)) {
            clean[safeKey] = val;
        } else if (typeof val === 'boolean') {
            clean[safeKey] = val;
        }
    }
    return clean;
}

export function getUmamiStatus() {
    return {
        isBlocked: isUmamiBlocked,
        isLoaded: isUmamiActive() || isDirectFallbackActive,
        isFallback: isDirectFallbackActive
    };
}

export function setSystemError(id, errorData) {
    if (!id || !errorData) return;

    // Regra estrita: Apenas o erro de telemetria desativada é exibido nos cartões
    if (id !== 'umami' && id !== 'test_umami') return;

    // Regra estrita: Remover todas as tags HTML
    const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, '').trim();

    // Regra estrita: Títulos só podem ter rigorosamente duas palavras
    let title = stripHtml(errorData.title);
    const words = title.split(/\s+/).filter(Boolean);
    if (words.length > 2) {
        title = words.slice(0, 2).join(' ');
    } else if (words.length === 1) {
        title = `${words[0]} Inativo`;
    } else if (words.length === 0) {
        title = 'Telemetria Desativada';
    }

    const desc = stripHtml(errorData.desc);
    const priority = typeof errorData.priority === 'number' ? errorData.priority : (ERROR_PRIORITIES[id] ?? 50);

    activeErrors.set(id, {
        id,
        icon: errorData.icon || 'fa-solid fa-triangle-exclamation',
        title,
        desc,
        priority
    });
    renderSystemErrorBlock();
}

export function clearSystemError(id) {
    if (activeErrors.has(id)) {
        activeErrors.delete(id);
        renderSystemErrorBlock();
    }
}

export function renderSystemErrorBlock() {
    if (typeof document === 'undefined') return;

    const block = document.getElementById('system-error-block');
    if (!block) return;

    const iconEl = document.getElementById('system-error-icon');
    const titleEl = document.getElementById('system-error-title');
    const descEl = document.getElementById('system-error-desc');

    if (activeErrors.size === 0) {
        block.classList.remove('is-visible');
        block.style.display = 'none';
        if (iconEl) iconEl.innerHTML = '';
        if (titleEl) titleEl.textContent = '';
        if (descEl) descEl.textContent = '';
        return;
    }

    // Seleciona rigorosamente um único erro por vez: o mais crítico (maior prioridade)
    let topError = null;
    for (const err of activeErrors.values()) {
        if (!topError || (err.priority ?? 0) > (topError.priority ?? 0)) {
            topError = err;
        }
    }

    if (!topError) {
        block.classList.remove('is-visible');
        block.style.display = 'none';
        return;
    }

    if (iconEl) {
        iconEl.innerHTML = `<i class="${topError.icon}"></i>`;
    }
    if (titleEl) {
        titleEl.textContent = topError.title;
    }
    if (descEl) {
        descEl.textContent = topError.desc;
    }

    block.setAttribute('data-active-error', topError.id || '');
    block.style.display = 'flex';
    void block.offsetHeight;
    block.classList.add('is-visible');
}

function checkTestMode() {
    if (typeof window === 'undefined') return false;
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('umami_error') || urlParams.has('test_umami') || urlParams.has('erro_umami')) {
            return true;
        }
        if (window.location.hash === '#erro-umami' || window.location.hash === '#test-umami') {
            return true;
        }
        if (localStorage.getItem('yisrael_simulate_umami_error') === 'true') {
            return true;
        }
    } catch (e) { }
    return false;
}

export function initUmamiMonitor() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    setupErrorBlockListeners();

    // Utilitários de consola para testes e depuração
    window.simulateUmamiError = (simulate = true) => {
        try {
            localStorage.setItem('yisrael_simulate_umami_error', simulate ? 'true' : 'false');
        } catch (e) { }
        if (simulate) {
            handleUmamiFailure();
        } else {
            runDiagnostics(false);
        }
    };

    window.simulateSystemError = (id, simulate = true, title = 'Erro Teste', desc = 'Descrição do erro de teste.', priority = null) => {
        if (simulate) {
            setSystemError(id, { icon: 'fa-solid fa-triangle-exclamation', title, desc, priority });
        } else {
            clearSystemError(id);
        }
    };

    window.trackMicroAction = trackMicroAction;

    window.umamiMonitor = {
        runDiagnostics,
        showUmamiAlert: handleUmamiFailure,
        hideUmamiAlert: () => clearSystemError('umami'),
        getStatus: getUmamiStatus,
        setSystemError,
        clearSystemError,
        trackMicroAction
    };

    // Guarda de conexão contínua (exige 100% internet ativa)
    initConnectionGuard();

    // Rastreio de cada micro ação no DOM
    initMicroActionTracker();

    // 1. Se estiver explicitamente em modo de teste, exibe imediatamente
    if (checkTestMode()) {
        handleUmamiFailure();
        return;
    }

    // Se o script já falhou antes do módulo inicializar (ex: bloqueado por adblocker no <head>)
    if (window.__umamiScriptFailed) {
        runDiagnostics(false);
    }

    // 2. Escuta se o script do Umami falhar ao carregar (ex: bloqueio de script por adblocker)
    window.addEventListener('error', (e) => {
        const target = e.target;
        if (target && (target.id === 'umami-script' || (target.src && target.src.includes('umami')))) {
            runDiagnostics(false);
        }
    }, true);

    // 3. Deteta violação de CSP direcionada a recursos Umami
    window.addEventListener('securitypolicyviolation', (e) => {
        const uri = String(e.blockedURI || '');
        if (uri.includes('umami')) {
            handleUmamiFailure();
        }
    });

    // 4. Garante envio de eventos pendentes quando a aba fecha ou fica oculta
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            flushQueue();
        }
    });
    window.addEventListener('pagehide', () => {
        flushQueue();
    });

    const script = document.getElementById('umami-script') || document.querySelector('script[src*="umami"]');
    if (script) {
        script.addEventListener('error', () => {
            runDiagnostics(false);
        });
        script.addEventListener('load', () => {
            setTimeout(() => {
                flushQueue();
                runDiagnostics(false);
            }, 150);
        });
    }

    // 5. Verificação de segurança tolerante a redes lentas (evita falso positivo em 3G)
    setTimeout(() => {
        if (!isUmamiActive() && !isDirectFallbackActive) {
            runDiagnostics(false);
        }
    }, 3000);
}

async function sendDirectTelemetry(eventName, eventData = {}) {
    if (typeof window === 'undefined') return false;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;

    try {
        const screenStr = (typeof window.screen !== 'undefined')
            ? `${window.screen.width || 0}x${window.screen.height || 0}`
            : '1024x768';
        const langStr = (typeof navigator !== 'undefined' && navigator.language)
            ? navigator.language
            : 'pt';
        const hostStr = (typeof window.location !== 'undefined' && window.location.hostname)
            ? window.location.hostname
            : 'localhost';
        const urlStr = (typeof window.location !== 'undefined')
            ? (window.location.pathname + window.location.search)
            : '/';

        const safeData = sanitizePayloadData(eventData);

        const payload = {
            type: 'event',
            payload: {
                website: WEBSITE_ID,
                hostname: hostStr,
                screen: screenStr,
                language: langStr,
                name: String(eventName || 'micro_action').slice(0, 50),
                data: safeData,
                url: urlStr
            }
        };

        const headers = {
            'Content-Type': 'application/json'
        };
        if (umamiSessionCache) {
            headers['x-umami-cache'] = umamiSessionCache;
        }

        const res = await fetch(UMAMI_API_ENDPOINT, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            mode: 'cors',
            keepalive: true
        });

        if (res.ok) {
            isDirectFallbackActive = true;
            try {
                const token = res.headers.get('x-umami-cache');
                if (token) {
                    umamiSessionCache = token;
                } else {
                    const data = await res.json();
                    if (data && data.cache) {
                        umamiSessionCache = data.cache;
                    }
                }
            } catch (e) { }
            return true;
        }
        return false;
    } catch (err) {
        return false;
    }
}

async function flushQueue() {
    if (isFlushingQueue || microActionQueue.length === 0) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    isFlushingQueue = true;
    try {
        while (microActionQueue.length > 0) {
            const item = microActionQueue.shift();
            if (!item) break;

            if (isUmamiActive()) {
                try {
                    window.umami.track(item.name, item.data);
                } catch (e) {
                    await sendDirectTelemetry(item.name, item.data);
                }
            } else {
                await sendDirectTelemetry(item.name, item.data);
            }
        }
    } finally {
        isFlushingQueue = false;
    }
}

export function trackMicroAction(name, data = {}) {
    if (typeof window === 'undefined') return;

    // Se estiver sem rede, a aplicação não atua
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    const eventName = String(name || 'micro_action').slice(0, 50);
    const safeData = sanitizePayloadData(data);

    if (isUmamiActive()) {
        try {
            flushQueue();
            window.umami.track(eventName, safeData);
            return;
        } catch (e) {
            // Em caso de falha no método nativo, prossegue para fallback direto
        }
    }

    if (microActionQueue.length < 100) {
        microActionQueue.push({ name: eventName, data: safeData, timestamp: Date.now() });
    }
    flushQueue();
}

export function setConnectionState(isOnline) {
    if (typeof document === 'undefined') return;
    const overlay = document.getElementById('wifi-required-overlay');
    if (!overlay) return;

    if (isOnline) {
        overlay.style.display = 'none';
        if (document.body) document.body.classList.remove('connection-blocked');
    } else {
        overlay.style.display = 'flex';
        if (document.body) document.body.classList.add('connection-blocked');
    }
}

export function initConnectionGuard() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const check = () => {
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        setConnectionState(isOnline);
        if (isOnline) {
            trackMicroAction('connection:online', { timestamp: Date.now() });
        }
    };

    window.addEventListener('online', () => {
        check();
        runDiagnostics(false);
    });

    window.addEventListener('offline', () => {
        setConnectionState(false);
    });

    check();
}

export function initMicroActionTracker() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Captura global delegada para cada micro clique e interação
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, a, .event-card, .settings-card, .app-tab-btn, .sidebar-nav-item, .info-modal-card, .desktop-mode-pill, [role="button"]');
        if (!target) return;

        let actionType = 'click';
        let identifier = target.id || target.getAttribute('data-tab') || target.getAttribute('data-action') || target.className.split(' ')[0] || target.tagName.toLowerCase();
        let label = (target.getAttribute('aria-label') || target.title || target.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 35);

        if (target.classList.contains('app-tab-btn') || target.classList.contains('sidebar-nav-item')) {
            actionType = 'tab_click';
            identifier = target.getAttribute('data-tab') || identifier;
        } else if (target.classList.contains('event-card') || target.classList.contains('settings-card')) {
            actionType = 'card_click';
        } else if (target.tagName === 'A') {
            actionType = 'link_click';
        }

        trackMicroAction(`${actionType}:${identifier}`, {
            label,
            element: target.tagName.toLowerCase()
        });
    }, { passive: true });
}

function isUmamiActive() {
    return typeof window !== 'undefined' 
        && typeof window.umami === 'object' 
        && window.umami !== null
        && typeof window.umami.track === 'function';
}

export async function runDiagnostics(forceTest = false) {
    let failed = false;

    if (forceTest || checkTestMode()) {
        failed = true;
    } else if (isUmamiActive()) {
        try {
            await fetch('https://gateway.umami.is', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store'
            });
            failed = false;
        } catch (e) {
            if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                failed = false;
            } else {
                const directOk = await sendDirectTelemetry('telemetry_heartbeat');
                failed = !directOk;
            }
        }
    } else {
        // window.umami não carregou (ex: adblocker no script.js). Tenta endpoint direto /api/send
        const directOk = await sendDirectTelemetry('telemetry_heartbeat');
        if (directOk) {
            failed = false;
            isDirectFallbackActive = true;
        } else {
            if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                failed = false;
            } else {
                failed = true;
            }
        }
    }

    if (failed) {
        handleUmamiFailure();
    } else {
        isUmamiBlocked = false;
        updatePrivacyUmamiBadge(false);
        clearSystemError('umami');
        flushQueue();
    }

    return !failed;
}

function handleUmamiFailure() {
    isUmamiBlocked = true;
    updatePrivacyUmamiBadge(true);
    setSystemError('umami', {
        icon: 'fa-solid fa-chart-simple',
        title: 'Telemetria Desativada',
        desc: 'Não consegue agir.'
    });
}

function setupErrorBlockListeners() {
    if (typeof window !== 'undefined') {
        window.addEventListener('hashchange', () => {
            if (window.location.hash === '#erro-umami' || window.location.hash === '#test-umami') {
                handleUmamiFailure();
            }
        });
    }
}

export function updatePrivacyUmamiBadge(isBlocked) {
    const statusContainer = document.getElementById('umami-live-status-pill');
    const subnote = document.querySelector('.umami-privacy-subnote');

    if (statusContainer) {
        if (isBlocked) {
            statusContainer.className = 'umami-live-clean is-error';
            statusContainer.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Telemetria Desativada';
            if (subnote) {
                subnote.textContent = 'Não consegue agir.';
            }
        } else {
            statusContainer.className = 'umami-live-clean is-ok';
            statusContainer.innerHTML = '<i class="fa-solid fa-circle-check"></i> Telemetria Ativa';
            if (subnote) {
                subnote.textContent = 'Métricas anónimas ativas sem recolha de dados pessoais.';
            }
        }
    }
}
