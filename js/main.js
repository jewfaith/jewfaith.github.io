/**
 * YISRAEL DATE • CALENDÁRIO DA TORÁ E HALACHÁ
 * 
 * Copyright (c) 2026 Mikhael. Todos os direitos reservados.
 * Conceção, arquitetura de software e desenvolvimento autoral exclusivo de Mikhael.
 * Repositório Oficial: https://github.com/jewfaith/jewfaith.github.io
 * 
 * É expressamente vedada a apropriação indébita, remoção de créditos ou usurpação desta obra.
 */

import { state } from './state.js';
import { hebcalFetch, fetchLiturgicalCalendar } from './api/hebcal.js';
import { renderFestivalsView } from './ui/festivalsView.js';
import { showDashboardSkeletons, updateUIBlocks, renderEvents } from './ui/dashboard.js';
import { initModals } from './ui/modals.js';
import { initThemeSwitcher } from './ui/themeSwitcher.js';
import { initShareListeners } from './ui/components/shareModal.js';
import { applyEstimatedTheme } from './ui/theme.js';
import { initStoragePersistence, getPersistentSetting } from './utils/persistence.js';
import { initSmartUpdater } from './utils/smartUpdater.js';
import { initAppNavigation } from './ui/appNavigation.js';
import { applyIconsToDOM } from './ui/icons.js';
import { initPcDisplayManager } from './ui/pcDisplayManager.js';
import { HEBREW_MONTHS_PT, loadFestivalDescriptions } from './domain/constants.js';
import { normalizeHebcalEvents } from './domain/eventMapper.js';
import { initUmamiMonitor, trackMicroAction } from './utils/umamiMonitor.js';
import { getSelectedLocation, clearExpiredLocations, JERUSALEM_COORDS, isSameLocation } from './services/locationService.js';
import { resolveLocationHierarchy, getTimezoneApproximateLocation, JERUSALEM_DEFAULT } from './api/geolocation.js';
import { getHebrewDateFromGregorian } from './domain/biblicalCalendar.js';
import { calculateOfflineZmanim } from './domain/halacha.js';
import { getLocationDateParts } from './domain/formatters.js';
import { updateSolarPosition } from './ui/solarArc.js';
import { renderZmanimTable } from './ui/zmanimTable.js';
import { initSimulator } from './utils/simulator.js';
import { initTelemetryService } from './services/telemetryService.js';
import { initConsoleControl } from './services/consoleControl.js';

// Bloqueio global de drag/arraste em todo o site
document.addEventListener('dragstart', (e) => e.preventDefault(), false);

// Garantia absoluta de desfaçamento do ecrã de carregamento: qualquer exceção liberta o layout
if (typeof window !== 'undefined') {
    const unlockUI = () => {
        if (document.body && !document.body.classList.contains('loaded')) {
            document.body.classList.add('loaded');
        }
    };
    window.addEventListener('error', unlockUI);
    window.addEventListener('unhandledrejection', unlockUI);
}

// Registro do Service Worker para PWA com atualização forçada e sem retenção de cache antigo
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((registration) => {
            // Força verificação de nova versão do sw.js imediatamente
            registration.update().catch(() => {});
        }).catch(err => {
            console.warn('[PWA] Falha no registo do ServiceWorker.');
        });
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_VERSION_UPDATED') {
            console.log('[PWA] Nova versão instalada em segundo plano:', event.data.version);
            // Se houver nova versão, limpa qualquer resquício de cache corrompido
            try {
                if (window.caches) {
                    caches.keys().then(keys => {
                        keys.forEach(k => {
                            if (!k.includes(event.data.version)) caches.delete(k);
                        });
                    });
                }
            } catch (e) {}
        }
    });
}

// Função auxiliar para carregar o cache sem repetir código
function loadOfflineCache(defaultLocName = null, defaultIsIsrael = null) {
    const activeLoc = getSelectedLocation() || getTimezoneApproximateLocation() || JERUSALEM_COORDS;
    const fallbackLocName = defaultLocName || activeLoc.name;
    const fallbackIsIsrael = defaultIsIsrael !== null ? defaultIsIsrael : activeLoc.isIsrael;

    state.userLocation = activeLoc;
    state.locationName = activeLoc.name;
    state.userCityName = (activeLoc.primaryText || activeLoc.name.split(',')[0] || 'Jerusalém').trim();

    const locParts = getLocationDateParts(Date.now(), activeLoc.tz);
    const offlineZmanim = calculateOfflineZmanim(new Date(), activeLoc.lat, activeLoc.lon, activeLoc.tz, fallbackIsIsrael);
    const offlineTomorrowZmanim = calculateOfflineZmanim(new Date(Date.now() + 86400000), activeLoc.lat, activeLoc.lon, activeLoc.tz, fallbackIsIsrael);
    const offlineSunset = offlineZmanim?.sunset ? new Date(offlineZmanim.sunset).getTime() : 0;
    const isNowAfterSunset = offlineSunset > 0 && Date.now() >= offlineSunset;

    try {
        const offlineDataRaw = localStorage.getItem('hebcal_offline_cache');
        if (offlineDataRaw) {
            const data = JSON.parse(offlineDataRaw);
            if (data.events && data.events.length > 0) {
                state.unifiedEvents = data.events;
                state.currentZmanim = data.zmanim || offlineZmanim;
                state.tomorrowZmanim = data.tomorrowZmanim || offlineTomorrowZmanim;
                state.currentSunsetTime = data.sunset || offlineSunset;

                // Transição imediata: se já passou o pôr do sol, atualiza imediatamente para a data do novo dia
                let effectiveHdate = data.hdate;
                if (isNowAfterSunset) {
                    const nextParts = getLocationDateParts(Date.now() + 86400000, activeLoc.tz);
                    effectiveHdate = getHebrewDateFromGregorian(nextParts.year, nextParts.month, nextParts.day) || effectiveHdate;
                }
                state.currentHdate = effectiveHdate || null;

                updateUIBlocks(
                    data.events,
                    effectiveHdate || { hd: 15, hm: 'Av'},
                    data.locName || fallbackLocName,
                    state.currentSunsetTime,
                    data.isIsrael ?? fallbackIsIsrael
                );
                renderFestivalsView();
                updateSolarPosition();
                renderZmanimTable();
                return true;
            }
        }
    } catch (e) {
        console.warn('[OfflineCache] Erro ao ler cache local:', e);
    }
    // Fallback resiliente e autônomo 100% offline (matemática exata Rambam e Gra para Jerusalém ou localização ativa)
    const targetParts = isNowAfterSunset ? getLocationDateParts(Date.now() + 86400000, activeLoc.tz) : locParts;
    const offlineHdate = getHebrewDateFromGregorian(targetParts.year, targetParts.month, targetParts.day);

    state.currentHdate = offlineHdate;
    state.currentZmanim = offlineZmanim;
    state.tomorrowZmanim = offlineTomorrowZmanim;
    state.currentSunsetTime = offlineSunset;
    state.unifiedEvents = state.unifiedEvents || [];

    updateUIBlocks(state.unifiedEvents, offlineHdate, fallbackLocName, offlineSunset, fallbackIsIsrael);
    renderFestivalsView();
    updateSolarPosition();
    renderZmanimTable();
    return true;
}

async function updateDashboard(options = {}) {
    // Modo Offline-First: Se estiver sem rede, hidrata a partir da cache local
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        const loaded = loadOfflineCache();
        if (loaded) {
            renderEvents();
            document.body.classList.add('loaded');
        }
        return;
    }

    const isSilent = !!options.silent;

    // 1. Aplicação rápida do tema
    const selectedLoc = getSelectedLocation();
    const approxTzLoc = getTimezoneApproximateLocation();
    if (selectedLoc) {
        applyEstimatedTheme(selectedLoc.lat, selectedLoc.lon);
    } else if (approxTzLoc) {
        applyEstimatedTheme(approxTzLoc.lat, approxTzLoc.lon);
    } else {
        applyEstimatedTheme();
    }

    // 2. Hidratação Instantânea via Cache (0ms startup)
    const isAlreadyLoaded = document.body.classList.contains('loaded');
    let hasHydratedFromCache = false;

    if (!isAlreadyLoaded && !isSilent) {
        hasHydratedFromCache = loadOfflineCache();
        if (hasHydratedFromCache) {
            renderEvents();
            document.body.classList.add('loaded');
        } else {
            document.body.classList.remove('loaded');
            showDashboardSkeletons();
        }
    }

    const minDelayPromise = (hasHydratedFromCache || isSilent || isAlreadyLoaded) 
        ? Promise.resolve() 
        : new Promise(resolve => setTimeout(resolve, 200));

    try {
        const activeLoc = selectedLoc || approxTzLoc || JERUSALEM_COORDS;
        state.userLocation = activeLoc;
        state.locationName = activeLoc.name;
        state.userCityName = (activeLoc.primaryText || activeLoc.name.split(',')[0] || 'Jerusalém').trim();

        // Sincroniza imediatamente o card solar com a localidade ativa
        updateSolarPosition();

        let lat = activeLoc.lat;
        let lon = activeLoc.lon;
        let tzid = activeLoc.tz;
        let locationName = activeLoc.name;
        let isIsrael = activeLoc.isIsrael;

        const locParts = getLocationDateParts(Date.now(), tzid);
        const year = locParts.year;
        const month = locParts.month;
        const day = locParts.day;
        const dateStr = locParts.dateStr;

        const hebcalStartStr = `${year}-01-01`;
        const endDateStr = `${year + 1}-12-31`;

        const tomorrowParts = getLocationDateParts(Date.now() + 24 * 60 * 60 * 1000, tzid);
        const tomorrowDateStr = tomorrowParts.dateStr;

        // 1. Zmanim astronómicos dinâmicos adaptados rigorosamente às coordenadas do visitante
        const zmanimPromise = hebcalFetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&date=${dateStr}&tzid=${tzid}`).catch(() => null);
        const tomorrowZmanimPromise = hebcalFetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&date=${tomorrowDateStr}&tzid=${tzid}`).catch(() => null);

        // 2. Calendário Litúrgico obtido da camada central de dados estáticos locais (0ms, offline-ready)
        const calendarPromise = fetchLiturgicalCalendar(isIsrael).catch(() => null);

        const [zmanimData, tomorrowZmanimData] = await Promise.all([zmanimPromise, tomorrowZmanimPromise]);

        let sunsetTime = 0;
        if (zmanimData?.times) {
            state.currentZmanim = zmanimData.times;
            sunsetTime = zmanimData.times.sunset ? new Date(zmanimData.times.sunset).getTime() : 0;
            state.currentSunsetTime = sunsetTime;
            updateSolarPosition();
        } else {
            const fallbackZmanim = calculateOfflineZmanim(new Date(), lat, lon, tzid, isIsrael);
            if (fallbackZmanim) {
                state.currentZmanim = fallbackZmanim;
                sunsetTime = fallbackZmanim.sunset ? new Date(fallbackZmanim.sunset).getTime() : 0;
                state.currentSunsetTime = sunsetTime;
                updateSolarPosition();
            }
        }
        if (tomorrowZmanimData?.times) {
            state.tomorrowZmanim = tomorrowZmanimData.times;
        } else {
            state.tomorrowZmanim = calculateOfflineZmanim(new Date(Date.now() + 86400000), lat, lon, tzid, isIsrael);
        }

        const isAfterSunset = sunsetTime > 0 && Date.now() >= sunsetTime;

        // 3. Conversão de data hebraica instantânea: algoritmo matemático Rambam (0ms, 100% offline, zero requests externas)
        let resolvedHdate;
        if (isAfterSunset) {
            const nextParts = getLocationDateParts(Date.now() + 24 * 60 * 60 * 1000, tzid);
            resolvedHdate = getHebrewDateFromGregorian(nextParts.year, nextParts.month, nextParts.day);
        } else {
            resolvedHdate = getHebrewDateFromGregorian(year, month, day);
        }

        const hebcalData = await calendarPromise;

        if (hebcalData?.items) {
            state.unifiedEvents = normalizeHebcalEvents(hebcalData.items, sunsetTime);

            // Guardar no Cache Local
            try {
                localStorage.setItem('hebcal_offline_cache', JSON.stringify({
                    events: state.unifiedEvents,
                    hdate: resolvedHdate,
                    locName: locationName,
                    sunset: sunsetTime,
                    isIsrael,
                    zmanim: state.currentZmanim,
                    tomorrowZmanim: state.tomorrowZmanim,
                    timestamp: Date.now()
                }));
            } catch (e) {
                console.warn('[OfflineCache] Erro ao salvar cache local:', e);
            }

            state.currentHdate = resolvedHdate;
            state.currentSunsetTime = sunsetTime;
            updateUIBlocks(state.unifiedEvents, resolvedHdate, locationName, sunsetTime, isIsrael);
            updateSolarPosition();
        } else {
            loadOfflineCache(locationName, isIsrael);
        }
    } catch (err) {
        console.warn('[Dashboard] Falha na sincronização online. A utilizar dados locais.');
        loadOfflineCache();
    }

    await minDelayPromise;
    try {
        renderEvents();
        renderFestivalsView();
        renderZmanimTable();
    } catch (e) {
        console.warn('[Dashboard] Render tolerou erro:', e);
    }

    if (document.body) {
        document.body.classList.add('loaded');
    }

    // Carrega descrições teológicas extensas (957 KB) em segundo plano sem bloquear o LCP/INP
    loadFestivalDescriptions().then(() => {
        if (state.unifiedEvents && state.currentHdate) {
            updateUIBlocks(state.unifiedEvents, state.currentHdate, state.locationName, state.currentSunsetTime, state.userLocation?.isIsrael ?? true);
        }
        renderEvents();
        renderFestivalsView(true);
        renderZmanimTable();
    }).catch(() => {});

    // Gestão temporal centralizada no smartUpdater.js para evitar timers duplicados
    if (state.sunsetTimeout) {
        clearTimeout(state.sunsetTimeout);
        state.sunsetTimeout = null;
    }
}

// Inicialização resiliente e tolerante a falhas
try { applyIconsToDOM(); } catch (e) { console.warn(e); }
try { initStoragePersistence(); } catch (e) { console.warn(e); }
try { clearExpiredLocations(); } catch (e) { console.warn(e); }

// Sincronização inicial instantânea: Salva -> Fuso Horário aproximado (0ms, offline, sem permissões) -> Jerusalém
const bootLoc = getSelectedLocation() || getTimezoneApproximateLocation() || JERUSALEM_COORDS;
state.userLocation = bootLoc;
state.locationName = bootLoc.name;
state.userCityName = (bootLoc.primaryText || bootLoc.name.split(',')[0] || 'Jerusalém').trim();

// Inicialização imediata de tema e partilha (0ms, funcional antes de carregar eventos)
try { initThemeSwitcher(); } catch (e) { console.warn(e); }
try { initShareListeners(); } catch (e) { console.warn(e); }
try { initPcDisplayManager(); } catch (e) { console.warn(e); }
try { initAppNavigation(); } catch (e) { console.warn(e); }
try { initModals(updateDashboard); } catch (e) { console.warn(e); }
try { initUmamiMonitor(); } catch (e) { console.warn(e); }
try { initTelemetryService(); } catch (e) { console.warn(e); }
try { updateDashboard(); } catch (e) { console.warn(e); }
try { initSmartUpdater(updateDashboard); } catch (e) { console.warn(e); }
try { initSimulator(); } catch (e) { console.warn(e); }
try { initConsoleControl(updateDashboard); } catch (e) { console.warn(e); }

// Resolução não-bloqueante em segundo plano da localização aproximada por IP quando não há seleção manual prévia
// Totalmente silencioso, SEM pedir autorização ao utilizador.
if (!getSelectedLocation()) {
    setTimeout(async () => {
        try {
            const resolved = await resolveLocationHierarchy(getSelectedLocation);
            if (!getSelectedLocation() && resolved && !isSameLocation(resolved, state.userLocation)) {
                state.userLocation = resolved;
                state.locationName = resolved.name;
                state.userCityName = (resolved.primaryText || resolved.name.split(',')[0] || 'Jerusalém').trim();
                updateDashboard({ silent: true });
            }
        } catch (e) {
            console.warn('[Location] Resolução aproximada em segundo plano tolerou erro e manteve fallback:', e);
        }
    }, 100);
}

// Garantia de remoção do ecrã de carregamento global mesmo em redes lentas
setTimeout(() => {
    if (!document.body.classList.contains('loaded')) {
        document.body.classList.add('loaded');
    }
}, 3500);