import { state } from '../state.js';

let solarThemeTimeout = null;
let manualThemeOverride = false;

export function applyEstimatedTheme(lat, lon) {
    if (manualThemeOverride) return;

    const now = new Date();
    let isDay = true;
    
    // We offset the estimated transition hours by 50 minutes earlier (50m before 06:00 is 05:10; 50m before 18:00 is 17:10)
    const transitionStartHour = 5 + 10 / 60; // 05:10 AM
    const transitionEndHour = 17 + 10 / 60;   // 05:10 PM (17:10)

    if (lat === undefined || lon === undefined) {
        const hour = now.getHours() + now.getMinutes() / 60;
        isDay = hour >= transitionStartHour && hour < transitionEndHour;
    } else {
        const offsetHours = lon / 15;
        const utcTime = new Date();
        const utcHours = utcTime.getUTCHours() + utcTime.getUTCMinutes() / 60 + utcTime.getUTCSeconds() / 3600;

        let localHours = (utcHours + offsetHours) % 24;
        if (localHours < 0) localHours += 24;

        isDay = localHours >= transitionStartHour && localHours < transitionEndHour;
    }
    
    const themeName = isDay ? 'day' : 'night';
    document.documentElement.setAttribute('data-theme', themeName);
    console.log(`[ACTION] Tema ${isDay ? 'Dia' : 'Noite'}`);
}

export function applySolarTheme() {
    if (manualThemeOverride) return;

    if (solarThemeTimeout) {
        clearTimeout(solarThemeTimeout);
    }
    
    const now = new Date();
    const nowMs = now.getTime();
    
    let sunsetTime = null;
    let sunriseTime = null;
    
    if (state.currentZmanim && state.currentZmanim.sunset) {
        sunsetTime = new Date(state.currentZmanim.sunset).getTime();
    } else {
        const tempSunset = new Date();
        tempSunset.setHours(18, 0, 0, 0);
        sunsetTime = tempSunset.getTime();
    }
    
    if (state.currentZmanim && state.currentZmanim.sunrise) {
        sunriseTime = new Date(state.currentZmanim.sunrise).getTime();
    } else {
        const tempSunrise = new Date();
        tempSunrise.setHours(6, 0, 0, 0);
        sunriseTime = tempSunrise.getTime();
    }
    
    // Offset threshold: 50 minutes before sunrise and sunset
    const OFFSET_MS = 50 * 60 * 1000;
    const transitionSunrise = sunriseTime - OFFSET_MS;
    const transitionSunset = sunsetTime - OFFSET_MS;
    
    let isDay = true;
    let nextEventTime = null;
    
    if (state.currentZmanim && state.currentZmanim.sunrise && state.currentZmanim.sunset) {
        if (nowMs < transitionSunrise) {
            isDay = false;
            nextEventTime = transitionSunrise;
        } else if (nowMs >= transitionSunrise && nowMs < transitionSunset) {
            isDay = true;
            nextEventTime = transitionSunset;
        } else {
            isDay = false;
            // Next event is tomorrow's sunrise minus 50 minutes
            nextEventTime = transitionSunrise + 24 * 60 * 60 * 1000;
        }
    } else {
        // Fallback estimation
        const exactLocRaw = localStorage.getItem('exactLocation');
        if (exactLocRaw) {
            try {
                const loc = JSON.parse(exactLocRaw);
                applyEstimatedTheme(loc.lat, loc.lon);
                return;
            } catch (e) {}
        }
        if (state.userLocation) {
            applyEstimatedTheme(state.userLocation.lat, state.userLocation.lon);
            return;
        }
        applyEstimatedTheme();
        return;
    }
    
    document.documentElement.setAttribute('data-theme', isDay ? 'day' : 'night');
    
    if (nextEventTime) {
        const timeUntilNext = nextEventTime - nowMs;
        if (timeUntilNext > 0 && timeUntilNext <= 36 * 60 * 60 * 1000) {
            solarThemeTimeout = setTimeout(() => {
                applySolarTheme();
            }, timeUntilNext + 1000);
        }
    }
}

// Expose theme switcher helpers to the window object for easy testing/debugging via the Console
window.setTheme = (themeName) => {
    manualThemeOverride = true;
    if (solarThemeTimeout) {
        clearTimeout(solarThemeTimeout);
        solarThemeTimeout = null;
    }
    const validThemes = ['day', 'night'];
    if (validThemes.includes(themeName)) {
        document.documentElement.setAttribute('data-theme', themeName);
    } else {
        console.warn(`[Tema] Nome invalido. Escolha um destes: ${validThemes.join(', ')}`);
    }
};

window.resetTheme = () => {
    manualThemeOverride = false;
    applySolarTheme();
};


