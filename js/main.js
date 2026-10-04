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

// Bloqueio prioritário de PC e drag/arraste
try { initPcDisplayManager(); } catch (e) {}
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
    const offlineTodayZmanim = calculateOfflineZmanim(new Date(), activeLoc.lat, activeLoc.lon, activeLoc.tz, fallbackIsIsrael);
    const offlineSunset = offlineTodayZmanim?.sunset ? new Date(offlineTodayZmanim.sunset).getTime() : 0;
    const isNowAfterSunset = offlineSunset > 0 && Date.now() >= offlineSunset;
    state.isAfterSunset = isNowAfterSunset;

    const targetDate = isNowAfterSunset ? new Date(Date.now() + 86400000) : new Date();
    const offlineTargetZmanim = isNowAfterSunset ? calculateOfflineZmanim(targetDate, activeLoc.lat, activeLoc.lon, activeLoc.tz, fallbackIsIsrael) : offlineTodayZmanim;
    const offlineTomorrowZmanim = calculateOfflineZmanim(new Date(targetDate.getTime() + 86400000), activeLoc.lat, activeLoc.lon, activeLoc.tz, fallbackIsIsrael);

    try {
        const offlineDataRaw = localStorage.getItem('hebcal_offline_cache');
        if (offlineDataRaw) {
            const data = JSON.parse(offlineDataRaw);
            if (data.events && data.events.length > 0) {
                state.unifiedEvents = data.events;

                // Mesma lógica da Data Hebraica para os Horários Litúrgicos:
                // Transição imediata: se já passou o pôr do sol, atualiza imediatamente para o novo dia
                let effectiveHdate = data.hdate;
                if (isNowAfterSunset) {
                    const nextParts = getLocationDateParts(Date.now() + 86400000, activeLoc.tz);
                    effectiveHdate = getHebrewDateFromGregorian(nextParts.year, nextParts.month, nextParts.day) || effectiveHdate;
                    state.currentZmanim = data.tomorrowZmanim || offlineTargetZmanim;
                    state.tomorrowZmanim = offlineTomorrowZmanim;
                    state.currentSunsetTime = state.currentZmanim?.sunset ? new Date(state.currentZmanim.sunset).getTime() : (offlineSunset + 86400000);
                } else {
                    state.currentZmanim = data.zmanim || offlineTargetZmanim;
                    state.tomorrowZmanim = data.tomorrowZmanim || offlineTomorrowZmanim;
                    state.currentSunsetTime = data.sunset || offlineSunset;
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
    state.currentZmanim = offlineTargetZmanim;
    state.tomorrowZmanim = offlineTomorrowZmanim;
    state.currentSunsetTime = offlineTargetZmanim?.sunset ? new Date(offlineTargetZmanim.sunset).getTime() : offlineSunset;
    state.unifiedEvents = state.unifiedEvents || [];

    updateUIBlocks(state.unifiedEvents, offlineHdate, fallbackLocName, state.currentSunsetTime, fallbackIsIsrael);
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

        let todaySunsetTime = 0;
        if (zmanimData?.times?.sunset) {
            todaySunsetTime = new Date(zmanimData.times.sunset).getTime();
        } else {
            const fallbackZmanim = calculateOfflineZmanim(new Date(), lat, lon, tzid, isIsrael);
            if (fallbackZmanim?.sunset) {
                todaySunsetTime = new Date(fallbackZmanim.sunset).getTime();
            }
        }

        const isAfterSunset = todaySunsetTime > 0 && Date.now() >= todaySunsetTime;
        state.isAfterSunset = isAfterSunset;

        // 3. Mesma lógica para Data Hebraica e Horários Litúrgicos:
        // Ao pôr do sol, ambos avançam sincronizados para o novo dia bíblico/judaico
        let resolvedHdate;
        let activeZmanim;
        let upcomingZmanim;
        let activeSunsetTime;

        if (isAfterSunset) {
            resolvedHdate = getHebrewDateFromGregorian(tomorrowParts.year, tomorrowParts.month, tomorrowParts.day);
            activeZmanim = tomorrowZmanimData?.times || calculateOfflineZmanim(new Date(Date.now() + 86400000), lat, lon, tzid, isIsrael);
            upcomingZmanim = calculateOfflineZmanim(new Date(Date.now() + 2 * 86400000), lat, lon, tzid, isIsrael);
            activeSunsetTime = activeZmanim?.sunset ? new Date(activeZmanim.sunset).getTime() : (todaySunsetTime + 86400000);
        } else {
            resolvedHdate = getHebrewDateFromGregorian(year, month, day);
            activeZmanim = zmanimData?.times || calculateOfflineZmanim(new Date(), lat, lon, tzid, isIsrael);
            upcomingZmanim = tomorrowZmanimData?.times || calculateOfflineZmanim(new Date(Date.now() + 86400000), lat, lon, tzid, isIsrael);
            activeSunsetTime = todaySunsetTime;
        }

        state.currentZmanim = activeZmanim;
        state.tomorrowZmanim = upcomingZmanim;
        state.currentSunsetTime = activeSunsetTime;
        updateSolarPosition();

        const hebcalData = await calendarPromise;

        if (hebcalData?.items) {
            state.unifiedEvents = normalizeHebcalEvents(hebcalData.items, activeSunsetTime, isIsrael);

            // Guardar no Cache Local
            try {
                localStorage.setItem('hebcal_offline_cache', JSON.stringify({
                    events: state.unifiedEvents,
                    hdate: resolvedHdate,
                    locName: locationName,
                    sunset: activeSunsetTime,
                    isIsrael,
                    zmanim: state.currentZmanim,
                    tomorrowZmanim: state.tomorrowZmanim,
                    timestamp: Date.now()
                }));
            } catch (e) {
                console.warn('[OfflineCache] Erro ao salvar cache local:', e);
            }

            state.currentHdate = resolvedHdate;
            updateUIBlocks(state.unifiedEvents, resolvedHdate, locationName, activeSunsetTime, isIsrael);
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