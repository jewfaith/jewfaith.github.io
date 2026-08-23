export const state = {
    timerInterval: null,
    unifiedEvents: [],
    userLocation: null,
    currentSunsetTime: 0,
    currentZmanim: null,
    sunsetTimeout: null,
    // Opcional: estado do tema solar
    theme: {
        current: 'day',          // 'day' | 'afternoon' | 'night'
        manualOverride: false,
        solarTimeout: null,
        reloadTimeout: null
    }
};