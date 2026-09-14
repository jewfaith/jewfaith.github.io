/**
 * GEOLOCATION.JS - CANONICAL DEFAULT & PRIVACY FIRST
 * A geolocalização automática do dispositivo está desativada por estrita privacidade.
 * A localização canónica predefinida é sempre Jerusalém, Israel, sendo qualquer
 * alteração realizada exclusivamente pelo utilizador de forma manual.
 */

export const JERUSALEM_DEFAULT = {
    lat: 31.7683,
    lon: 35.2137,
    tz: 'Asia/Jerusalem',
    name: 'Jerusalém, Israel',
    isIsrael: true,
    source: 'canonical-default'
};

export async function getGPSLocation() {
    return { ...JERUSALEM_DEFAULT };
}

export async function getGeolocation() {
    return { ...JERUSALEM_DEFAULT };
}