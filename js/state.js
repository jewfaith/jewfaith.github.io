export const state = {
    timerInterval: null,
    unifiedEvents: [],
    userLocation: {
        lat: 31.7683,
        lon: 35.2137,
        name: 'Jerusalém, Israel',
        isIsrael: true,
        tz: 'Asia/Jerusalem'
    },
    currentSunsetTime: 0,
    currentHdate: null,
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