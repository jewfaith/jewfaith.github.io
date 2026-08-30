import { state } from '../state.js';

let solarThemeTimeout = null;
let autoReloadTimeout = null;
let manualThemeOverride = false;

const OFFSET_MS = 30 * 60 * 1000;

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
    if (nowMs >= solar.morningStart && nowMs < solar.nightStart) return 'day';
    return 'night';
}

function getNextTransitionMs(nowMs, solar) {
    const transitions = [solar.morningStart, solar.nightStart];
    const next = transitions.find(t => t > nowMs);

    if (next) return next - nowMs;

    // Se todas passaram hoje, calcula para a primeira transição do dia seguinte (+24h)
    return (solar.morningStart + 24 * 60 * 60 * 1000) - nowMs;
}

function getThemeLabel(theme) {
    const labels = { day: 'Dia', night: 'Noite' };
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
    if (localHour >= 5.5 && localHour < 17.5) theme = 'day';

    document.documentElement.setAttribute('data-theme', theme);
    // Log estimated theme application based on current local hour/longitude
    console.log(`[ACTION] Theme set to estimated: ${theme.toUpperCase()}`);
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
    // Log solar-calculated theme application
    console.log(`[ACTION] Theme set by solar zmanim: ${theme.toUpperCase()}`);

    scheduleAutoReload(solar, nowMs);
}

function scheduleAutoReload(solar, nowMs) {
    const transitions = [solar.morningStart, solar.nightStart];
    let nextReload = transitions.find(t => t > nowMs + 5000);

    if (!nextReload) {
        nextReload = solar.morningStart + 24 * 60 * 60 * 1000;
    }

    const msToReload = nextReload - nowMs;

    // Maximum setTimeout delay in JavaScript is ~24.8 days (2147483647 ms)
    if (msToReload > 0 && msToReload <= 2147483647) {
        autoReloadTimeout = setTimeout(() => {
            // Log automatic page reload triggered at solar theme transition boundary
            console.log('[ACTION] Automatic page reload triggered at theme transition boundary');
            window.location.reload();
        }, msToReload + 1000);
    }
}

// Recalculate/reapply theme when browser tab regains visibility
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !manualThemeOverride) {
            applySolarTheme();
        }
    });
}

// Global Developer Console APIs
if (typeof window !== 'undefined') {
    window.setTheme = (themeName) => {
        manualThemeOverride = true;
        if (solarThemeTimeout) clearTimeout(solarThemeTimeout);
        if (autoReloadTimeout) clearTimeout(autoReloadTimeout);

        const validThemes = ['day', 'night'];
        if (validThemes.includes(themeName)) {
            if (typeof document !== 'undefined') {
                document.documentElement.setAttribute('data-theme', themeName);
            }
            // Log manual theme override command
            console.log(`[MANUAL] Theme override applied: ${themeName.toUpperCase()}`);
        } else {
            // Warn developer about invalid theme name
            console.warn(`[THEME] Invalid theme name: "${themeName}". Please choose one of: ${validThemes.join(', ')}`);
        }
    };

    window.resetTheme = () => {
        manualThemeOverride = false;
        // Log reset to automatic solar theme calculation
        console.log('[ACTION] Theme override cleared, reverting to solar automatic theme');
        applySolarTheme();
    };
}