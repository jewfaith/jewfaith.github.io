import { LOCATION_EXPIRATION_MS, LOCATION_STORAGE_KEYS } from '../domain/constants.js';

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
    if (!getPersistentSetting('yisrael_shabbat_customized')) {
        savePersistentSetting('yisrael_shabbat_offset', '18');
        savePersistentSetting('yisrael_havdalah_opinion', '8.5');
    }
    touchPersistenceExpiry();
}

export function setCookie(name, value, maxAgeSeconds = NINETY_DAYS_SECONDS) {
    if (typeof document === 'undefined') return;
    try {
        const encodedVal = encodeURIComponent(value);
        const secureFlag = (typeof location !== 'undefined' && location.protocol === 'https:') ? '; Secure' : '';
        document.cookie = `${name}=${encodedVal}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax${secureFlag}`;
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

export function removePersistentSetting(key) {
    try {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_timestamp`);
    } catch (e) {}
    if (typeof document !== 'undefined') {
        try {
            const secureFlag = (typeof location !== 'undefined' && location.protocol === 'https:') ? '; Secure' : '';
            document.cookie = `${key}=; max-age=0; path=/; SameSite=Lax${secureFlag}`;
        } catch (e) {}
    }
}

export function savePersistentSetting(key, value) {
    try {
        localStorage.setItem(key, value);
        localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    } catch (e) {}
    setCookie(key, value, NINETY_DAYS_SECONDS);
}

export function getPersistentSettingWithExpiry(key, maxAgeMs, fallback = null) {
    try {
        const val = localStorage.getItem(key);
        if (val !== null && val !== undefined) {
            const tsRaw = localStorage.getItem(`${key}_timestamp`);
            if (tsRaw) {
                const ts = parseInt(tsRaw, 10);
                if (!isNaN(ts) && (Date.now() - ts > maxAgeMs)) {
                    removePersistentSetting(key);
                    return fallback;
                }
            }
            return val;
        }
    } catch (e) {}

    const cookieVal = getCookie(key);
    if (cookieVal) {
        try {
            localStorage.setItem(key, cookieVal);
            localStorage.setItem(`${key}_timestamp`, Date.now().toString());
        } catch (e) {}
        return cookieVal;
    }

    return fallback;
}

export function getPersistentSetting(key, fallback = null) {
    if (key === LOCATION_STORAGE_KEYS.ACTIVE_LOCATION || key === 'exactLocation') {
        return getPersistentSettingWithExpiry(key, LOCATION_EXPIRATION_MS, fallback);
    }

    let val = null;
    try {
        val = localStorage.getItem(key);
    } catch (e) {}

    if (!val) {
        val = getCookie(key);
        if (val) {
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
        if (k === 'exactLocation' || k === LOCATION_STORAGE_KEYS.ACTIVE_LOCATION) {
            const val = getPersistentSetting(k, null);
            if (val) {
                try {
                    const tsRaw = localStorage.getItem(`${k}_timestamp`);
                    const ts = tsRaw ? parseInt(tsRaw, 10) : 0;
                    if (ts > 0) {
                        const elapsedSec = Math.floor((Date.now() - ts) / 1000);
                        const remainingSec = NINETY_DAYS_SECONDS - elapsedSec;
                        if (remainingSec > 0) {
                            setCookie(k, val, remainingSec);
                        } else {
                            removePersistentSetting(k);
                        }
                    }
                } catch (e) {}
            }
        } else {
            const val = getPersistentSetting(k, null);
            if (val) {
                setCookie(k, val, NINETY_DAYS_SECONDS);
            }
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
