import { state } from '../state.js';

let solarThemeTimeout = null;
let autoReloadTimeout = null;
let manualThemeOverride = false;

const OFFSET_MS = 30 * 60 * 1000;

function getSolarTimes() {
    let sunrise, sunset, solarNoon;

    if (state.currentZmanim?.sunrise && state.currentZmanim?.sunset) {
        sunrise = new Date(state.currentZmanim.sunrise).getTime();
        sunset = new Date(state.currentZmanim.sunset).getTime();
        solarNoon = sunrise + (sunset - sunrise) / 2;
    } else {
        const now = new Date();
        sunrise = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0).getTime();
        sunset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0).getTime();
        solarNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).getTime();
    }

    return {
        sunrise,
        sunset,
        solarNoon,
        morningStart: sunrise - OFFSET_MS,
        afternoonStart: solarNoon - OFFSET_MS,
        nightStart: sunset - OFFSET_MS
    };
}

function getThemeForTime(nowMs, solar) {
    if (nowMs >= solar.morningStart && nowMs < solar.afternoonStart) return 'day';
    if (nowMs >= solar.afternoonStart && nowMs < solar.nightStart) return 'afternoon';
    return 'night';
}

function getNextTransitionMs(nowMs, solar) {
    const transitions = [solar.morningStart, solar.afternoonStart, solar.nightStart];
    const next = transitions.find(t => t > nowMs);

    if (next) return next - nowMs;

    // Se todas passaram hoje, calcula para a primeira transição do dia seguinte (+24h)
    return (solar.morningStart + 24 * 60 * 60 * 1000) - nowMs;
}

function getThemeLabel(theme) {
    const labels = { day: 'Manhã', afternoon: 'Tarde', night: 'Noite' };
    return labels[theme] || theme;
}

export function applyEstimatedTheme(lat, lon) {
    if (manualThemeOverride) return;

    const now = new Date();
    let localHour = now.getHours() + now.getMinutes() / 60;

    // Ajuste por longitude simples
    if (lat !== undefined && lon !== undefined) {
        const offsetHours = lon / 15;
        const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
        localHour = (utcHours + offsetHours + 24) % 24;
    }

    let theme = 'night';
    if (localHour >= 5.5 && localHour < 11.5) theme = 'day';
    else if (localHour >= 11.5 && localHour < 17.5) theme = 'afternoon';

    document.documentElement.setAttribute('data-theme', theme);
    console.log(`[ACTION] Tema ${getThemeLabel(theme)}`);
}

export function applySolarTheme() {
    if (manualThemeOverride) return;

    if (solarThemeTimeout) clearTimeout(solarThemeTimeout);
    if (autoReloadTimeout) clearTimeout(autoReloadTimeout);

    const nowMs = Date.now();
    const solar = getSolarTimes();

    if (!state.currentZmanim?.sunrise || !state.currentZmanim?.sunset) {
        const exactLocRaw = localStorage.getItem('exactLocation');
        let loc = null;

        if (exactLocRaw) {
            try { loc = JSON.parse(exactLocRaw); } catch (e) { /* fallback */ }
        }

        const targetLoc = loc || state.userLocation;
        if (targetLoc) {
            applyEstimatedTheme(targetLoc.lat, targetLoc.lon);
        } else {
            applyEstimatedTheme();
        }

        scheduleAutoReload(solar, nowMs);
        return;
    }

    const theme = getThemeForTime(nowMs, solar);
    document.documentElement.setAttribute('data-theme', theme);
    console.log(`[ACTION] Tema ${getThemeLabel(theme)}`);

    scheduleAutoReload(solar, nowMs);
}

function scheduleAutoReload(solar, nowMs) {
    const transitions = [solar.morningStart, solar.afternoonStart, solar.nightStart];
    let nextReload = transitions.find(t => t > nowMs + 5000);

    if (!nextReload) {
        nextReload = solar.morningStart + 24 * 60 * 60 * 1000;
    }

    const msToReload = nextReload - nowMs;

    // Limite máximo do setTimeout no JS é ~24.8 dias (2147483647 ms)
    if (msToReload > 0 && msToReload <= 2147483647) {
        autoReloadTimeout = setTimeout(() => {
            console.log('[ACTION] Auto-reload na transição de tema');
            window.location.reload();
        }, msToReload + 1000);
    }
}

// Recalcula/reaplica quando a aba volta a ficar visível
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !manualThemeOverride) {
        applySolarTheme();
    }
});

// APIs Globais para Console
window.setTheme = (themeName) => {
    manualThemeOverride = true;
    if (solarThemeTimeout) clearTimeout(solarThemeTimeout);
    if (autoReloadTimeout) clearTimeout(autoReloadTimeout);

    const validThemes = ['day', 'afternoon', 'night'];
    if (validThemes.includes(themeName)) {
        document.documentElement.setAttribute('data-theme', themeName);
        console.log(`[MANUAL] Tema ${getThemeLabel(themeName)}`);
    } else {
        console.warn(`[Tema] Nome inválido. Escolha um destes: ${validThemes.join(', ')}`);
    }
};

window.resetTheme = () => {
    manualThemeOverride = false;
    applySolarTheme();
};