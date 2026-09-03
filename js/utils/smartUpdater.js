import { state } from '../state.js';
import { updateSolarPosition } from '../ui/solarArc.js';

let heartbeatTimer = null;
let lastCheckTime = Date.now();
let lastDay = new Date().getDate();
let lastSunsetStatus = false;
let updateCallback = null;
let isSyncing = false;
let lastSyncTimestamp = 0;

/**
 * Inicializa o motor de atualização inteligente e contínua do aplicativo.
 * Monitora marcos astronômicos (Pôr do Sol, Meia-noite, Nascer do Sol),
 * reconexão de rede, reativação de aba e retorno de suspensão (sleep/wake).
 */
export function initSmartUpdater(callback) {
    updateCallback = callback;
    lastDay = new Date().getDate();
    lastCheckTime = Date.now();

    if (state.currentSunsetTime > 0) {
        lastSunsetStatus = Date.now() >= state.currentSunsetTime;
    }

    // 1. Heartbeat constante a cada 15 segundos
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(performHeartbeatCheck, 15000);

    // 2. Ouvintes de ciclo de vida do dispositivo e da rede
    if (typeof window !== 'undefined') {
        // Ao voltar à aba (desbloquear celular ou alternar abas)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                evaluateFreshness('visibilitychange');
            }
        });

        // Ao focar a janela do navegador
        window.addEventListener('focus', () => {
            evaluateFreshness('focus');
        });

        // Ao recuperar conectividade com a internet
        window.addEventListener('online', () => {
            triggerSmartUpdate('online_reconnected');
        });

        // Ao retornar pelo cache de navegação (bfcache)
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                triggerSmartUpdate('pageshow_cached');
            }
        });
    }
}

/**
 * Checagem de pulso a cada 15 segundos.
 * Detecta instantaneamente cruzamentos de pôr do sol, meia-noite e retorno de suspensão.
 */
function performHeartbeatCheck() {
    if (typeof document !== 'undefined' && document.hidden) return;

    const now = Date.now();
    const nowObj = new Date(now);
    const currentDay = nowObj.getDate();

    // Mantém o arco solar sempre sincronizado ao relógio em tempo real
    try {
        updateSolarPosition();
    } catch (e) { }

    // A. Detecção de suspensão / sleep-wake (tempo saltou mais de 45 segundos do esperado)
    const timeJump = now - lastCheckTime;
    if (timeJump > 45000) {
        lastCheckTime = now;
        lastDay = currentDay;
        triggerSmartUpdate('wake_from_sleep');
        return;
    }
    lastCheckTime = now;

    // B. Mudança de dia civil (meia-noite)
    if (currentDay !== lastDay) {
        lastDay = currentDay;
        triggerSmartUpdate('midnight_rollover');
        return;
    }

    // C. Cruzamento do Pôr do Sol (Shkiah) - Vira o dia hebraico no segundo exato
    if (state.currentSunsetTime > 0) {
        const isNowAfterSunset = now >= state.currentSunsetTime;
        if (isNowAfterSunset !== lastSunsetStatus) {
            lastSunsetStatus = isNowAfterSunset;
            triggerSmartUpdate('sunset_transition');
            return;
        }
    }

    // D. Transição de Zmanim solares críticos
    if (state.currentZmanim) {
        checkZmanimTransitions(now);
    }
}

/**
 * Avalia se os dados exibidos na tela estão desatualizados após inatividade.
 */
function evaluateFreshness(triggerSource) {
    const now = Date.now();
    const today = new Date(now).getDate();

    const timeSinceLastSync = now - lastSyncTimestamp;
    const sunsetCrossed = state.currentSunsetTime > 0 && ((now >= state.currentSunsetTime) !== lastSunsetStatus);

    // Se o dia mudou, ou se o pôr do sol passou, ou se passaram mais de 10 minutos sem sync
    if (today !== lastDay || sunsetCrossed || timeSinceLastSync > 10 * 60 * 1000) {
        triggerSmartUpdate(triggerSource);
    } else {
        // Atualiza a posição visual dos relógios solares de imediato
        try {
            updateSolarPosition();
        } catch (e) { }
    }
}

/**
 * Monitora marcos específicos de Zmanim
 */
function checkZmanimTransitions(now) {
    const z = state.currentZmanim;
    const criticalTimes = [
        z.alotHaShachar,
        z.sunrise,
        z.chatzot,
        z.tzeit7083deg,
        z.tzeit85deg
    ].filter(Boolean).map(t => new Date(t).getTime());

    for (const time of criticalTimes) {
        // Se cruzou o marco nos últimos 20 segundos
        if (now >= time && (now - time) <= 20000 && (now - lastSyncTimestamp) > 60000) {
            triggerSmartUpdate('zman_milestone');
            break;
        }
    }
}

/**
 * Executa a sincronização inteligente de forma silenciosa e fluida (sem telas brancas ou skeletons).
 */
export async function triggerSmartUpdate(reason = 'manual') {
    if (isSyncing) return;
    const now = Date.now();

    // Throttle protetor para evitar tempestade de requisições
    const isCritical = ['sunset_transition', 'midnight_rollover', 'wake_from_sleep'].includes(reason);
    if (!isCritical && (now - lastSyncTimestamp < 10000)) {
        return;
    }

    isSyncing = true;
    lastSyncTimestamp = now;

    try {
        if (typeof updateCallback === 'function') {
            await updateCallback({ silent: true, reason });
        }
    } catch (e) {
        console.warn('[SmartUpdater] Erro ao sincronizar dados:', e);
    } finally {
        isSyncing = false;
        lastDay = new Date().getDate();
        if (state.currentSunsetTime > 0) {
            lastSunsetStatus = Date.now() >= state.currentSunsetTime;
        }
    }
}
