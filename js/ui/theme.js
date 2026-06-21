import { state } from '../state.js';

let solarThemeTimeout = null;

export function applyEstimatedTheme(lat, lon) {
    if (lat === undefined || lon === undefined) {
        const hour = new Date().getHours();
        const isDay = hour >= 6 && hour < 18;
        if (isDay) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        return;
    }

    const offsetHours = lon / 15;
    const utcTime = new Date();
    const utcHours = utcTime.getUTCHours() + utcTime.getUTCMinutes() / 60 + utcTime.getUTCSeconds() / 3600;

    let localHours = (utcHours + offsetHours) % 24;
    if (localHours < 0) localHours += 24;

    const isDay = localHours >= 6 && localHours < 18;

    if (isDay) {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

export function applySolarTheme() {
    if (solarThemeTimeout) {
        clearTimeout(solarThemeTimeout);
    }
    
    const now = new Date().getTime();
    let isDay = true;
    let nextEventTime = null;

    if (state.currentZmanim && state.currentZmanim.sunrise && state.currentZmanim.sunset) {
        const sunrise = new Date(state.currentZmanim.sunrise).getTime() - 600000;
        const sunset = new Date(state.currentZmanim.sunset).getTime() - 600000;
        
        if (now < sunrise) {
            isDay = false;
            nextEventTime = sunrise;
        } else if (now >= sunrise && now < sunset) {
            isDay = true;
            nextEventTime = sunset;
        } else {
            isDay = false;
        }

        if (isDay) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    } else {
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
    }

    if (nextEventTime) {
        const timeUntilNext = nextEventTime - now;
        if (timeUntilNext > 0 && timeUntilNext <= 24 * 60 * 60 * 1000) {
            solarThemeTimeout = setTimeout(() => {
                applySolarTheme();
            }, timeUntilNext + 1000);
        }
    }
}
