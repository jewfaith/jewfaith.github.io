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
import { hebcalFetch } from './api/hebcal.js';
import { renderFestivalsView } from './ui/festivalsView.js';
import { showDashboardSkeletons, updateUIBlocks, renderEvents } from './ui/dashboard.js';
import { initModals } from './ui/modals.js';
import { applyEstimatedTheme } from './ui/theme.js';
import { initStoragePersistence, getPersistentSetting } from './utils/persistence.js';
import { initSmartUpdater } from './utils/smartUpdater.js';
import { initAppNavigation } from './ui/appNavigation.js';
import { applyIconsToDOM } from './ui/icons.js';
import { initPcDisplayManager } from './ui/pcDisplayManager.js';
import { HEBREW_MONTHS_PT } from './domain/constants.js';
import { normalizeHebcalEvents } from './domain/eventMapper.js';
import { initUmamiMonitor, trackMicroAction } from './utils/umamiMonitor.js';
import { getSelectedLocation, clearExpiredLocations, JERUSALEM_COORDS } from './services/locationService.js';
import { updateSolarPosition } from './ui/solarArc.js';
import { initSimulator } from './utils/simulator.js';

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
            // Atualização silenciosa: sem recarregar a janela para não interromper a leitura do utilizador
        }
    });
}

// Função auxiliar para carregar o cache sem repetir código
function loadOfflineCache(defaultLocName = null, defaultIsIsrael = null) {
    const activeLoc = getSelectedLocation() || JERUSALEM_COORDS;
    const fallbackLocName = defaultLocName || activeLoc.name;
    const fallbackIsIsrael = defaultIsIsrael !== null ? defaultIsIsrael : activeLoc.isIsrael;

    state.userLocation = activeLoc;
    state.locationName = activeLoc.name;
    state.userCityName = (activeLoc.primaryText || activeLoc.name.split(',')[0] || 'Jerusalém').trim();

    try {
        const offlineDataRaw = localStorage.getItem('hebcal_offline_cache');
        if (offlineDataRaw) {
            const data = JSON.parse(offlineDataRaw);
            if (data.events && data.events.length > 0) {
                state.unifiedEvents = data.events;
                state.currentZmanim = data.zmanim || null;
                state.currentSunsetTime = data.sunset || 0;
                state.currentHdate = data.hdate || null;
                updateUIBlocks(
                    data.events,
                    data.hdate || { hd: 15, hm: 'Av'},
                    data.locName || fallbackLocName,
                    data.sunset || 0,
                    data.isIsrael ?? fallbackIsIsrael
                );
                renderFestivalsView();
                updateSolarPosition();
                return true;
            }
        }
    } catch (e) {
        console.warn('[OfflineCache] Erro ao ler cache local:', e);
    }
    // Fallback resiliente: atualiza blocos e cartões de literatura imediatamente para nunca exibir cartões vazios
    const fallbackHdate = state.currentHdate || { hd: 15, hm: 'Nisan', hy: 5784 };
    updateUIBlocks(state.unifiedEvents || [], fallbackHdate, fallbackLocName, state.currentSunsetTime || 0, fallbackIsIsrael);
    renderFestivalsView();
    updateSolarPosition();
    return false;
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
    if (selectedLoc) {
        applyEstimatedTheme(selectedLoc.lat, selectedLoc.lon);
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
        const activeLoc = selectedLoc || JERUSALEM_COORDS;
        state.userLocation = activeLoc;
        state.locationName = activeLoc.name;
        state.userCityName = (activeLoc.primaryText || activeLoc.name.split(',')[0] || 'Jerusalém').trim();

        // Sincroniza imediatamente o card solar com a localidade ativa
        updateSolarPosition();

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        let lat = activeLoc.lat;
        let lon = activeLoc.lon;
        let tzid = activeLoc.tz;
        let locationName = activeLoc.name;
        let isIsrael = activeLoc.isIsrael;

        const hebcalStartStr = `${year}-01-01`;
        const endDateStr = `${year + 1}-12-31`;

        // Requisições paralelas litúrgicas
        const zmanimPromise = hebcalFetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&date=${dateStr}&tzid=${tzid}`).catch(() => null);
        const hebcalUrl = `https://www.hebcal.com/hebcal?v=1&cfg=json&geo=pos&latitude=${lat}&longitude=${lon}&start=${hebcalStartStr}&end=${endDateStr}&maj=on&min=on&mod=on&nx=on&mf=on&ss=off&s=on&i=${isIsrael ? 'on' : 'off'}&c=off&o=on`;
        const hebcalPromise = hebcalFetch(hebcalUrl).catch(() => null);

        const [zmanimData] = await Promise.all([zmanimPromise]);

        let sunsetTime = 0;
        if (zmanimData?.times) {
            state.currentZmanim = zmanimData.times;
            sunsetTime = zmanimData.times.sunset ? new Date(zmanimData.times.sunset).getTime() : 0;
            state.currentSunsetTime = sunsetTime;
            updateSolarPosition();
        }

        const isAfterSunset = sunsetTime > 0 && Date.now() > sunsetTime;
        const converterUrl = `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1&strict=1${isAfterSunset ? '&gs=on' : ''}`;

        const [hdateData, hebcalData] = await Promise.all([
            hebcalFetch(converterUrl).catch(() => null),
            hebcalPromise
        ]);

        if (hebcalData?.items) {
            state.unifiedEvents = normalizeHebcalEvents(hebcalData.items, sunsetTime);

            // Guardar no Cache Local
            try {
                localStorage.setItem('hebcal_offline_cache', JSON.stringify({
                    events: state.unifiedEvents,
                    hdate: hdateData,
                    locName: locationName,
                    sunset: sunsetTime,
                    isIsrael,
                    zmanim: state.currentZmanim,
                    timestamp: Date.now()
                }));
            } catch (e) {
                console.warn('[OfflineCache] Erro ao salvar cache local:', e);
            }

            state.currentHdate = hdateData;
            state.currentSunsetTime = sunsetTime;
            updateUIBlocks(state.unifiedEvents, hdateData || { hd: 15, hm: 'Av'}, locationName, sunsetTime, isIsrael);
            updateSolarPosition();
        } else {
            loadOfflineCache(locationName, isIsrael);
        }
    } catch (err) {
        console.warn('[Dashboard] Falha na sincronização online. A utilizar dados locais.');
        loadOfflineCache();
    }

    await minDelayPromise;
    renderEvents();
    renderFestivalsView();

    setTimeout(() => document.body.classList.add('loaded'), 50);

    // Gestão temporal centralizada no smartUpdater.js para evitar timers duplicados
    if (state.sunsetTimeout) {
        clearTimeout(state.sunsetTimeout);
        state.sunsetTimeout = null;
    }
}

// Inicialização
applyIconsToDOM();
initStoragePersistence();
clearExpiredLocations();

// Sincronização inicial instantânea com a localização selecionada
const bootLoc = getSelectedLocation() || JERUSALEM_COORDS;
state.userLocation = bootLoc;
state.locationName = bootLoc.name;
state.userCityName = (bootLoc.primaryText || bootLoc.name.split(',')[0] || 'Jerusalém').trim();

initPcDisplayManager();
initAppNavigation();
initModals(updateDashboard);
initUmamiMonitor();
updateDashboard();
initSmartUpdater(updateDashboard);
initSimulator();

// Garantia de remoção do ecrã de carregamento global mesmo em redes lentas
setTimeout(() => {
    if (!document.body.classList.contains('loaded')) {
        document.body.classList.add('loaded');
    }
}, 3500);