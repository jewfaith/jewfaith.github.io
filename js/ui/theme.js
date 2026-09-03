import { state } from '../state.js';
import { getPersistentSetting } from '../utils/persistence.js';

let autoReloadTimeout = null;

const OFFSET_MS = 15 * 60 * 1000; // 15min twilight transition buffer

export function getSavedThemePreference() {
    const saved = getPersistentSetting('yisrael_theme', null);
    if (saved === 'day' || saved === 'light') return 'day';
    if (saved === 'night' || saved === 'dark') return 'night';
    return null;
}

function getSolarTimes() {
    let sunrise, sunset;

    if (state.currentZmanim?.sunrise && state.currentZmanim?.sunset) {
        sunrise = new Date(state.currentZmanim.sunrise).getTime();
        sunset = new Date(state.currentZmanim.sunset).getTime();
    } else {
        const now = new Date();
        sunrise = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0).getTime();
        sunset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0).getTime();
    }

    return {
        sunrise,
        sunset,
        morningStart: sunrise - OFFSET_MS,
        nightStart: sunset - OFFSET_MS
    };
}

function getThemeForTime(nowMs, solar) {
    // Dia (Sépia) durante as horas de sol, Noite (Escuro) durante a noite
    if (nowMs >= solar.morningStart && nowMs < solar.nightStart) return 'day';
    return 'night';
}

export function getActiveTheme() {
    if (typeof document !== 'undefined') {
        return document.documentElement.getAttribute('data-theme') || 'night';
    }
    return 'night';
}

/**
 * Aplica o tema solar automático com base na hora local estimada, respeitando a memória do utilizador
 */
export function applyEstimatedTheme(lat, lon) {
    const manualTheme = getSavedThemePreference();
    if (manualTheme) {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', manualTheme);
        }
        return;
    }

    const now = new Date();
    let localHour = now.getHours() + now.getMinutes() / 60;

    if (lat !== undefined && lon !== undefined) {
        const offsetHours = lon / 15;
        const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
        localHour = (utcHours + offsetHours + 24) % 24;
    }

    let theme = 'night';
    if (localHour >= 6.0 && localHour < 18.0) theme = 'day';

    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

/**
 * Aplica o tema astronômico 100% automático e agenda a transição perfeita
 */
export function applySolarTheme() {
    if (autoReloadTimeout) clearTimeout(autoReloadTimeout);

    const manualTheme = getSavedThemePreference();
    if (manualTheme) {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', manualTheme);
        }
        return;
    }

    const nowMs = Date.now();
    const solar = getSolarTimes();

    if (!state.currentZmanim?.sunrise || !state.currentZmanim?.sunset) {
        const exactLocRaw = localStorage.getItem('exactLocation');
        let loc = null;
        if (exactLocRaw) {
            try { loc = JSON.parse(exactLocRaw); } catch (e) {}
        }

        const targetLoc = loc || state.userLocation;
        if (targetLoc) {
            applyEstimatedTheme(targetLoc.lat, targetLoc.lon);
        } else {
            applyEstimatedTheme();
        }

        scheduleAutoTransition(solar, nowMs);
        return;
    }

    const theme = getThemeForTime(nowMs, solar);
    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
    }
    scheduleAutoTransition(solar, nowMs);
}

function scheduleAutoTransition(solar, nowMs) {
    const transitions = [solar.morningStart, solar.nightStart];
    let nextTransition = transitions.find(t => t > nowMs + 2000);

    if (!nextTransition) {
        nextTransition = solar.morningStart + 24 * 60 * 60 * 1000;
    }

    const msToTransition = nextTransition - nowMs;

    if (msToTransition > 0 && msToTransition <= 2147483647) {
        autoReloadTimeout = setTimeout(() => {
            applySolarTheme();
        }, msToTransition + 1000);
    }
}

// Escuta visibilidade da aba para sincronização instantânea ao desbloquear
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            applySolarTheme();
        }
    });
}