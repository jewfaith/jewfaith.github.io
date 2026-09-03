const NINETY_DAYS_SECONDS = 90 * 24 * 60 * 60;

export async function initStoragePersistence() {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
        try {
            const isPersisted = await navigator.storage.persisted();
            if (!isPersisted) {
                await navigator.storage.persist();
            }
        } catch (e) {}
    }
    // Estado ativo padrão do Plano Premium
    if (getPersistentSetting('yisrael_is_premium') === null) {
        savePersistentSetting('yisrael_is_premium', 'true');
    }
    // Pré-definição com o tempo padrão haláchico (18 min de velas e 8.5° de havdalá)
    if (!localStorage.getItem('yisrael_shabbat_customized')) {
        savePersistentSetting('yisrael_shabbat_offset', '18');
        savePersistentSetting('yisrael_havdalah_opinion', '8.5');
    }
    touchPersistenceExpiry();
}

export function setCookie(name, value, maxAgeSeconds = NINETY_DAYS_SECONDS) {
    if (typeof document === 'undefined') return;
    try {
        const encodedVal = encodeURIComponent(value);
        document.cookie = `${name}=${encodedVal}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
    } catch (e) {}
}

export function getCookie(name) {
    if (typeof document === 'undefined') return null;
    try {
        const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
        return match ? decodeURIComponent(match[3]) : null;
    } catch (e) {
        return null;
    }
}

export function savePersistentSetting(key, value) {
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem(key, value);
            localStorage.setItem(`${key}_timestamp`, Date.now().toString());
        } catch (e) {}
    }
    setCookie(key, value, NINETY_DAYS_SECONDS);
}

export function getPersistentSetting(key, fallback = null) {
    let val = null;
    if (typeof localStorage !== 'undefined') {
        try {
            val = localStorage.getItem(key);
        } catch (e) {}
    }

    if (!val) {
        val = getCookie(key);
        if (val && typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(key, val);
            } catch (e) {}
        }
    }

    return val !== null && val !== undefined ? val : fallback;
}

export function touchPersistenceExpiry() {
    const keys = [
        'yisrael_theme',
        'yisrael_time_format',
        'yisrael_animations',
        'yisrael_font_size',
        'yisrael_bible_lang',
        'yisrael_is_premium',
        'exactLocation'
    ];

    keys.forEach(k => {
        const val = getPersistentSetting(k, null);
        if (val) {
            setCookie(k, val, NINETY_DAYS_SECONDS);
        }
    });
}

export function isUserPremium() {
    return getPersistentSetting('yisrael_is_premium', 'true') !== 'false';
}

export function setUserPremium(isPremium) {
    savePersistentSetting('yisrael_is_premium', isPremium ? 'true' : 'false');
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('yisrael:premium-changed', { detail: { isPremium } }));
    }
}
