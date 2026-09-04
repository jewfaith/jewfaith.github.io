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

    // 1. Inicia o agendamento adaptativo e alinhado aos limites do relógio
    scheduleNextPulse();

    // 2. Ouvintes de ciclo de vida do dispositivo e da rede
    if (typeof window !== 'undefined') {
        // Ao alternar abas ou desbloquear ecrã do telemóvel
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                evaluateFreshness('visibilitychange');
                scheduleNextPulse();
            } else {
                // Suspende o temporizador quando oculto para poupar bateria e evitar estrangulamento
                if (heartbeatTimer) {
                    clearTimeout(heartbeatTimer);
                    heartbeatTimer = null;
                }
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
 * Avalia se o momento atual está próximo (<= 90s) de um evento astronómico crítico
 * (Pôr do Sol ou marcos principais de Zmanim). Nesses instantes, o pulso é acelerado
 * para garantir transição suave e imediata da data e das orações.
 */
function isNearCriticalAstronomicalEvent(now) {
    if (state.currentSunsetTime > 0) {
        const diffSunset = Math.abs(state.currentSunsetTime - now);
        if (diffSunset <= 90000) return true;
    }
    if (state.currentZmanim) {
        const z = state.currentZmanim;
        const criticalTimes = [
            z.alotHaShachar,
            z.sunrise,
            z.chatzot,
            z.tzeit7083deg,
            z.tzeit85deg
        ].filter(Boolean).map(t => new Date(t).getTime());

        for (const t of criticalTimes) {
            if (Math.abs(t - now) <= 90000) return true;
        }
    }
    return false;
}

/**
 * Agenda o próximo pulso adaptativo com alinhamento exato ao segundo 00 do minuto seguinte.
 * Elimina o desfasamento (timer drift) e evita desperdícios contínuos de CPU.
 */
function scheduleNextPulse() {
    if (heartbeatTimer) {
        clearTimeout(heartbeatTimer);
        heartbeatTimer = null;
    }

    if (typeof document !== 'undefined' && document.hidden) {
        return;
    }

    const now = Date.now();

    // Alinhamento exato ao segundo 00 do próximo minuto civil (+80ms para compensar latência)
    let delay = 60000 - (now % 60000) + 80;

    // Se estiver próximo de uma transição astronómica, pulsa a cada 5 segundos
    if (isNearCriticalAstronomicalEvent(now)) {
        delay = Math.min(delay, 5000);
    }

    heartbeatTimer = setTimeout(() => {
        performHeartbeatCheck();
        scheduleNextPulse();
    }, delay);
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
