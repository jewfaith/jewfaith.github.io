import { state } from '../state.js';

let solarThemeTimeout = null;
let autoReloadTimeout = null;
let manualThemeOverride = false;

// Offset: 30 minutos antes da transição real
const OFFSET_MS = 30 * 60 * 1000;

/**
 * Determina o tema com base na hora solar e aplica 30 min antes da transição.
 * 3 Paletas:
 *   - "day"       → Manhã (do nascer do sol - 30min até ao meio solar - 30min)
 *   - "afternoon"  → Tarde (do meio solar - 30min até ao pôr do sol - 30min)
 *   - "night"      → Noite (do pôr do sol - 30min até ao nascer do sol - 30min)
 */

function getSolarTimes() {
    let sunrise, sunset, solarNoon;

    if (state.currentZmanim && state.currentZmanim.sunrise && state.currentZmanim.sunset) {
        sunrise = new Date(state.currentZmanim.sunrise).getTime();
        sunset = new Date(state.currentZmanim.sunset).getTime();
        // Meio solar = ponto médio entre nascer e pôr do sol
        solarNoon = sunrise + (sunset - sunrise) / 2;
    } else {
        // Fallback: horários estimados
        const now = new Date();
        sunrise = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0).getTime();
        sunset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0).getTime();
        solarNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).getTime();
    }

    return {
        sunrise,
        sunset,
        solarNoon,
        // Transições com 30 min de antecedência
        morningStart: sunrise - OFFSET_MS,
        afternoonStart: solarNoon - OFFSET_MS,
        nightStart: sunset - OFFSET_MS
    };
}

function getThemeForTime(nowMs, solar) {
    if (nowMs >= solar.morningStart && nowMs < solar.afternoonStart) {
        return 'day';
    } else if (nowMs >= solar.afternoonStart && nowMs < solar.nightStart) {
        return 'afternoon';
    } else {
        return 'night';
    }
}

function getNextTransitionMs(nowMs, solar) {
    const transitions = [solar.morningStart, solar.afternoonStart, solar.nightStart];

    // Próxima transição futura
    for (const t of transitions) {
        if (t > nowMs) {
            return t - nowMs;
        }
    }

    // Se todas já passaram, a próxima é o nascer do sol de amanhã - 30min
    const tomorrowMorning = solar.morningStart + 24 * 60 * 60 * 1000;
    return tomorrowMorning - nowMs;
}

function getThemeLabel(theme) {
    switch (theme) {
        case 'day': return 'Manhã';
        case 'afternoon': return 'Tarde';
        case 'night': return 'Noite';
        default: return theme;
    }
}

export function applyEstimatedTheme(lat, lon) {
    if (manualThemeOverride) return;

    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;

    let localHour = hour;
    if (lat !== undefined && lon !== undefined) {
        const offsetHours = lon / 15;
        const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
        localHour = ((utcHours + offsetHours) % 24 + 24) % 24;
    }

    // Transições estimadas com 30 min de antecedência (sem dados precisos de zmanim)
    // Nascer ~06:00 → tema manhã às 05:30, Meio-dia ~12:00 → tema tarde às 11:30, Pôr do sol ~18:00 → tema noite às 17:30
    let theme;
    if (localHour >= 5.5 && localHour < 11.5) {
        theme = 'day';
    } else if (localHour >= 11.5 && localHour < 17.5) {
        theme = 'afternoon';
    } else {
        theme = 'night';
    }

    document.documentElement.setAttribute('data-theme', theme);
    console.log(`[ACTION] Tema ${getThemeLabel(theme)}`);
}

export function applySolarTheme() {
    if (manualThemeOverride) return;

    if (solarThemeTimeout) {
        clearTimeout(solarThemeTimeout);
        solarThemeTimeout = null;
    }

    const nowMs = Date.now();
    const solar = getSolarTimes();

    if (!(state.currentZmanim && state.currentZmanim.sunrise && state.currentZmanim.sunset)) {
        // Fallback: usar estimativa por coordenadas
        const exactLocRaw = localStorage.getItem('exactLocation');
        if (exactLocRaw) {
            try {
                const loc = JSON.parse(exactLocRaw);
                applyEstimatedTheme(loc.lat, loc.lon);
            } catch (e) {
                applyEstimatedTheme();
            }
        } else if (state.userLocation) {
            applyEstimatedTheme(state.userLocation.lat, state.userLocation.lon);
        } else {
            applyEstimatedTheme();
        }
        scheduleAutoReload(solar, nowMs);
        return;
    }

    const theme = getThemeForTime(nowMs, solar);
    document.documentElement.setAttribute('data-theme', theme);
    console.log(`[ACTION] Tema ${getThemeLabel(theme)}`);

    // Agendar próxima transição de tema
    const msToNext = getNextTransitionMs(nowMs, solar);
    if (msToNext > 0 && msToNext <= 36 * 60 * 60 * 1000) {
        solarThemeTimeout = setTimeout(() => {
            applySolarTheme();
        }, msToNext + 500);
    }

    // Agendar auto-reload nas transições
    scheduleAutoReload(solar, nowMs);
}

/**
 * Auto-Reload: recarrega a página inteira nos momentos de transição de tema.
 * Funciona tanto online como offline (usa dados cacheados).
 * Momentos de reload:
 *   1. Nascer do sol - 30min (entrada na manhã)
 *   2. Meio solar - 30min (entrada na tarde)
 *   3. Pôr do sol - 30min (entrada na noite)
 */
function scheduleAutoReload(solar, nowMs) {
    if (autoReloadTimeout) {
        clearTimeout(autoReloadTimeout);
        autoReloadTimeout = null;
    }

    const reloadTimes = [
        solar.morningStart,
        solar.afternoonStart,
        solar.nightStart
    ];

    // Encontrar o próximo momento de reload
    let nextReload = null;
    for (const t of reloadTimes) {
        if (t > nowMs + 5000) { // +5s de margem para não recarregar instantaneamente
            nextReload = t;
            break;
        }
    }

    if (!nextReload) {
        // Todos já passaram hoje, agendar para o nascer de amanhã - 30min
        nextReload = solar.morningStart + 24 * 60 * 60 * 1000;
    }

    const msToReload = nextReload - nowMs;
    if (msToReload > 0 && msToReload <= 36 * 60 * 60 * 1000) {
        autoReloadTimeout = setTimeout(() => {
            console.log(`[ACTION] Auto-reload na transição de tema`);
            window.location.reload();
        }, msToReload + 1000);
    }
}

// Expose theme switcher helpers to the window object for easy testing/debugging via the Console
window.setTheme = (themeName) => {
    manualThemeOverride = true;
    if (solarThemeTimeout) {
        clearTimeout(solarThemeTimeout);
        solarThemeTimeout = null;
    }
    if (autoReloadTimeout) {
        clearTimeout(autoReloadTimeout);
        autoReloadTimeout = null;
    }
    const validThemes = ['day', 'afternoon', 'night'];
    if (validThemes.includes(themeName)) {
        document.documentElement.setAttribute('data-theme', themeName);
        console.log(`[MANUAL] Tema ${getThemeLabel(themeName)}`);
    } else {
        console.warn(`[Tema] Nome invalido. Escolha um destes: ${validThemes.join(', ')}`);
    }
};

window.resetTheme = () => {
    manualThemeOverride = false;
    applySolarTheme();
};
