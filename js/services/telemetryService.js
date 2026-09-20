/**
 * TELEMETRYSERVICE.JS - GOOGLE HEART METRICS & A/B TESTING ENGINE
 * 
 * Framework de medição de UX para o Yisrael Date (jewfaith.github.io):
 * - Happiness: Satisfação e feedback qualitativo
 * - Engagement: Tempo ativo de sessão (heartbeats), profundidade de navegação e interações
 * - Adoption: Adoção da nova aba 'Hoje' e do 'Calendário Mensal Interativo'
 * - Retention: Taxa de retorno diário (DAU), dias entre visitas consecutivas
 * - Task Success: Conclusão de tarefas-chave (ver Zmanim, ler Parashá, consultar datas)
 * 
 * Integração universal: Google Analytics (gtag.js / dataLayer) + Umami Analytics + Fallback Offline.
 */

import { trackMicroAction } from '../utils/umamiMonitor.js';

const HEART_STORAGE_KEYS = {
    FIRST_VISIT: 'jewfaith_first_visit',
    LAST_VISIT: 'jewfaith_last_visit',
    VISIT_COUNT: 'jewfaith_visit_count',
    AB_VARIANT: 'jewfaith_ab_variant',
    TASK_SUCCESS: 'jewfaith_task_metrics'
};

// Variantes A/B: 'A' (layout clássico) vs 'B' (novo layout com Hoje + Calendário)
let currentVariant = null;
let sessionStartTime = Date.now();
let activeHeartbeatsSent = new Set();
let sessionActionsCount = 0;

/**
 * Inicializa ou recupera a variante de teste A/B do utilizador
 */
export function getABVariant() {
    if (currentVariant) return currentVariant;
    try {
        let stored = localStorage.getItem(HEART_STORAGE_KEYS.AB_VARIANT);
        if (!stored || (stored !== 'A' && stored !== 'B')) {
            // 90% dos utilizadores recebem a variante B (novo design moderno), 10% recebem A para controlo estatístico
            stored = Math.random() < 0.90 ? 'B' : 'A';
            localStorage.setItem(HEART_STORAGE_KEYS.AB_VARIANT, stored);
        }
        currentVariant = stored;
    } catch (e) {
        currentVariant = 'B';
    }
    return currentVariant;
}

/**
 * Permite alternar manualmente a variante para efeitos de teste
 */
export function setABVariant(variant) {
    if (variant === 'A' || variant === 'B') {
        currentVariant = variant;
        try {
            localStorage.setItem(HEART_STORAGE_KEYS.AB_VARIANT, variant);
        } catch (e) { }
        trackHeartEvent('ab_variant_override', { variant });
    }
}

/**
 * Dispara evento unificado para Google Analytics (gtag) e Umami
 */
export function trackHeartEvent(eventName, eventParams = {}) {
    if (typeof window === 'undefined') return;

    sessionActionsCount++;
    const payload = {
        ...eventParams,
        ab_variant: getABVariant(),
        session_time_sec: Math.floor((Date.now() - sessionStartTime) / 1000),
        actions_in_session: sessionActionsCount,
        timestamp: Date.now()
    };

    // 1. Umami Analytics / Telemetria Interna Estritamente Agregada (Zero PII)
    try {
        trackMicroAction(`heart:${eventName}`, payload);
    } catch (err) {
        // Silencioso
    }

    // 3. Registo em modo desenvolvimento
    if (typeof window !== 'undefined' && window._jewfaithDebug) {
        console.log(`[HEART Telemetry] ${eventName}`, payload);
    }
}

/**
 * Rastreia a retenção de utilizadores (Google HEART: Retention)
 */
function recordRetentionMetrics() {
    try {
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;

        const firstVisit = localStorage.getItem(HEART_STORAGE_KEYS.FIRST_VISIT);
        if (!firstVisit) {
            localStorage.setItem(HEART_STORAGE_KEYS.FIRST_VISIT, String(now));
            localStorage.setItem(HEART_STORAGE_KEYS.LAST_VISIT, String(now));
            localStorage.setItem(HEART_STORAGE_KEYS.VISIT_COUNT, '1');
            trackHeartEvent('user_first_visit', { is_new_user: true });
            return;
        }

        const lastVisit = parseInt(localStorage.getItem(HEART_STORAGE_KEYS.LAST_VISIT) || '0', 10);
        let visitCount = parseInt(localStorage.getItem(HEART_STORAGE_KEYS.VISIT_COUNT) || '1', 10);

        const daysSinceLast = Math.floor((now - lastVisit) / oneDayMs);

        if (daysSinceLast >= 1) {
            visitCount += 1;
            localStorage.setItem(HEART_STORAGE_KEYS.VISIT_COUNT, String(visitCount));
            localStorage.setItem(HEART_STORAGE_KEYS.LAST_VISIT, String(now));

            trackHeartEvent('user_return_visit', {
                days_since_last: daysSinceLast,
                total_visits: visitCount,
                is_retained_user: true
            });
        }
    } catch (e) { }
}

/**
 * Inicia cronómetros de engajamento na sessão (Google HEART: Engagement)
 */
function initEngagementHeartbeats() {
    const intervals = [15, 30, 60, 180, 300, 600]; // 15s, 30s, 1m, 3m, 5m, 10m

    intervals.forEach(sec => {
        setTimeout(() => {
            if (typeof document !== 'undefined' && !document.hidden && !activeHeartbeatsSent.has(sec)) {
                activeHeartbeatsSent.add(sec);
                trackHeartEvent('session_engagement_heartbeat', {
                    duration_seconds: sec,
                    active_view: getActiveTabName()
                });
            }
        }, sec * 1000);
    });

    // Rastreia saída da página para duração final da sessão
    if (typeof window !== 'undefined') {
        const reportSessionEnd = () => {
            const finalDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
            if (finalDuration >= 5) {
                trackHeartEvent('session_end', {
                    total_duration_sec: finalDuration,
                    total_actions: sessionActionsCount
                });
            }
        };

        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                reportSessionEnd();
            }
        });
        window.addEventListener('pagehide', reportSessionEnd);
    }
}

function getActiveTabName() {
    if (typeof document === 'undefined') return 'hoje';
    const activeView = document.querySelector('.app-tab-view.active');
    if (!activeView) return 'hoje';
    if (activeView.id.includes('calendar') || activeView.id.includes('festivals')) return 'calendario';
    if (activeView.id.includes('privacy')) return 'mais';
    return 'hoje';
}

/**
 * Rastreia Adoção de Funcionalidades (Google HEART: Adoption)
 */
export function trackFeatureAdoption(featureName, metadata = {}) {
    trackHeartEvent('feature_adoption', {
        feature: featureName,
        ...metadata
    });
}

/**
 * Rastreia Conclusão de Tarefas-Chave (Google HEART: Task Success)
 */
export function trackTaskSuccess(taskName, details = {}) {
    trackHeartEvent('task_success', {
        task: taskName,
        ...details
    });

    try {
        const raw = localStorage.getItem(HEART_STORAGE_KEYS.TASK_SUCCESS) || '{}';
        const parsed = JSON.parse(raw);
        parsed[taskName] = (parsed[taskName] || 0) + 1;
        parsed.lastCompleted = Date.now();
        localStorage.setItem(HEART_STORAGE_KEYS.TASK_SUCCESS, JSON.stringify(parsed));
    } catch (e) { }
}

/**
 * Inicialização central de telemetria HEART
 */
export function initTelemetryService() {
    getABVariant();
    recordRetentionMetrics();
    initEngagementHeartbeats();

    // Rastreia carregamento inicial da aplicação
    trackHeartEvent('app_session_start', {
        device_screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
        is_pwa: typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
    });
}
