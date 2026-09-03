import { applySolarTheme, getActiveTheme } from './theme.js';
import { savePersistentSetting, getPersistentSetting } from '../utils/persistence.js';

let isThemeSwitcherInitialized = false;

export function getCurrentThemeMode() {
    try {
        const saved = getPersistentSetting('yisrael_theme', 'auto');
        if (saved === 'light' || saved === 'day') return 'light';
        if (saved === 'dark' || saved === 'night') return 'dark';
        return 'auto';
    } catch (e) {
        return 'auto';
    }
}

export function updateDesktopThemePills(activeMode) {
    const current = activeMode || getCurrentThemeMode();
    const pills = document.querySelectorAll('.desktop-theme-pill');
    pills.forEach(pill => {
        const pMode = pill.getAttribute('data-theme-mode');
        if (pMode === current) {
            pill.classList.add('active');
            pill.setAttribute('aria-pressed', 'true');
        } else {
            pill.classList.remove('active');
            pill.setAttribute('aria-pressed', 'false');
        }
    });
}

export function setThemeMode(mode) {
    if (mode === 'light') {
        document.documentElement.setAttribute('data-theme', 'day');
        savePersistentSetting('yisrael_theme', 'light');
        try { localStorage.setItem('yisrael_theme', 'light'); } catch (e) {}
    } else if (mode === 'dark') {
        document.documentElement.setAttribute('data-theme', 'night');
        savePersistentSetting('yisrael_theme', 'dark');
        try { localStorage.setItem('yisrael_theme', 'dark'); } catch (e) {}
    } else { // 'auto'
        savePersistentSetting('yisrael_theme', 'auto');
        try { localStorage.setItem('yisrael_theme', 'auto'); } catch (e) {}
        applySolarTheme();
    }

    const sel1 = document.getElementById('view-settings-theme');
    const sel2 = document.getElementById('settings-theme');
    if (sel1) sel1.value = mode;
    if (sel2) sel2.value = mode;

    updateDesktopThemePills(mode);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
    }
}

export function initThemeSwitcher() {
    applySolarTheme();
    updateDesktopThemePills();

    if (isThemeSwitcherInitialized) return;
    isThemeSwitcherInitialized = true;

    const toggleTheme = () => {
        const current = getActiveTheme();
        const next = current === 'day' ? 'night' : 'day';
        const nextMode = next === 'day' ? 'light' : 'dark';
        setThemeMode(nextMode);
    };

    document.getElementById('mobile-theme-toggle-btn')?.addEventListener('click', toggleTheme);
    document.getElementById('desktop-theme-toggle-btn')?.addEventListener('click', toggleTheme);

    // Seletores de pílula específicos para PC: Auto, Light, Dark
    const pillGroup = document.getElementById('pc-theme-mode-selector');
    if (pillGroup) {
        pillGroup.addEventListener('click', (e) => {
            const btn = e.target.closest('.desktop-theme-pill');
            if (!btn) return;
            const chosen = btn.getAttribute('data-theme-mode');
            if (chosen) {
                setThemeMode(chosen);
            }
        });
    }

    if (typeof window !== 'undefined') {
        window.setThemeMode = setThemeMode;
    }
}
