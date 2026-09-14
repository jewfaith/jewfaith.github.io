/**
 * LOCATIONMODAL.JS - MODAL DE SELEÇÃO E PESQUISA DE LOCALIDADE
 * 
 * Gerencia a pesquisa de cidades com autocomplete Nominatim, cidades populares
 * com 1-toque, geolocalização e persistência de coordenadas com atualização instantânea.
 */

import { state } from '../../state.js';
import { updateSolarPosition } from '../solarArc.js';
import { applyEstimatedTheme } from '../theme.js';
import { ICONS } from '../icons.js';
import { escapeHtml } from '../../domain/formatters.js';
import { LOCATION_SUGGESTIONS_LIMIT } from '../../domain/constants.js';
import {
    POPULAR_1TOUCH_CITIES,
    fetchNearbyLocations,
    clearNearbyLocationsCache,
    getCachedNearbyLocations,
    getRecentLocations,
    saveSelectedLocation,
    getActiveCoords,
    isJerusalemLocation,
    isSameLocation
} from '../../services/locationService.js';
import { searchNominatim } from '../../api/nominatim.js';
import { closeModalSafely, closeOtherModalsOnDesktop } from './modalManager.js';
import { getReadingSkeletonHTML } from '../components/skeleton.js';
import { trackMicroAction } from '../../utils/umamiMonitor.js';

let updateDashboardCallback = null;

export function setLocationUpdateCallback(cb) {
    updateDashboardCallback = cb;
}

/**
 * Renderiza a lista de sugestões de localidades no modal.
 * REGRA RIGOROSA: Devem ser sempre exatamente 15 localizações na lista.
 * Sempre que uma localização recente assume um lugar, as outras compensam para deixar sempre em 15.
 */
export function renderSuggestions(results = [], options = {}) {
    if (typeof document === 'undefined') return;
    const suggestionsList = document.getElementById('location-suggestions');
    if (!suggestionsList) return;

    suggestionsList.innerHTML = '';
    const finalItems = [];

    if (!results || results.length === 0) {
        const currentLoc = getActiveCoords();
        const currentIsJerusalem = isJerusalemLocation(currentLoc);

        const recentLocations = getRecentLocations();
        const seenKeys = new Set();

        if (currentLoc) {
            const curPrimary = currentLoc.primaryText || (currentLoc.name ? currentLoc.name.split(',')[0].trim() : '');
            if (curPrimary) {
                seenKeys.add(curPrimary.toLowerCase());
            }
        }

        // 0. Histórico de Seleção Rápida (máx 3 válidas por 10 dias)
        // REGRA: Apenas a localização atual ativa é excluída das recentes.
        // Jerusalém NÃO é proibida de aparecer nas recentes.
        const filteredRecent = (recentLocations || []).filter(rec => {
            if (isSameLocation(rec, currentLoc)) return false;
            return true;
        });

        let hasJerusalemInRecents = false;
        for (const rec of filteredRecent) {
            if (finalItems.length >= LOCATION_SUGGESTIONS_LIMIT) break;
            const pText = rec.primaryText || (rec.name ? rec.name.split(',')[0].trim() : 'Localidade');
            const sText = rec.secondaryText || (rec.name && rec.name.includes(',') ? rec.name.split(',').slice(1).join(',').trim() : '');
            seenKeys.add(pText.toLowerCase());
            if (isJerusalemLocation(rec)) {
                hasJerusalemInRecents = true;
                seenKeys.add('jerusalém');
                seenKeys.add('jerusalem');
            }
            finalItems.push({
                primaryText: pText,
                secondaryText: sText,
                fullName: rec.name,
                lat: rec.lat,
                lon: rec.lon,
                tz: rec.tz,
                isIsrael: rec.isIsrael,
                iconClass: 'fa-solid fa-clock-rotate-left',
                isRecentAction: true
            });
        }

        // REGRA: Jerusalém DEVE SEMPRE APARECER, nem que seja no fundo da lista!
        // Se já está nas recentes, preenche até 15 normalmente.
        // Se não está nas recentes, reserva 1 vaga para Jerusalém entrar obrigatoriamente no fundo.
        const maxBeforeJerusalem = hasJerusalemInRecents ? LOCATION_SUGGESTIONS_LIMIT : (LOCATION_SUGGESTIONS_LIMIT - 1);

        // 1. Cidades Mais Próximas calculadas a partir da seleção escolhida
        const nearbyList = options.nearby || getCachedNearbyLocations();
        if (nearbyList && nearbyList.length > 0) {
            for (const near of nearbyList) {
                if (finalItems.length >= maxBeforeJerusalem) break;

                let pText = near.primaryText;
                let sText = near.secondaryText;
                if (!pText && near.displayText) {
                    const parts = near.displayText.split(',').map(s => s.trim());
                    pText = parts[0];
                    sText = parts.length > 1 ? parts[parts.length - 1] : '';
                } else if (!pText && near.item) {
                    const parts = (near.item.display_name || '').split(',').map(s => s.trim());
                    let locality = parts[0] || '';
                    if (near.item.address) {
                        locality = near.item.address.village || near.item.address.town || near.item.address.city || near.item.address.municipality || near.item.address.county || near.item.address.suburb || near.item.address.hamlet || parts[0];
                    }
                    const country = near.item.address && near.item.address.country ? near.item.address.country : (parts.length > 1 ? parts[parts.length - 1] : '');
                    pText = locality;
                    sText = country;
                }

                if (pText && !seenKeys.has(pText.toLowerCase())) {
                    const nearCoords = {
                        lat: near.item?.lat ? parseFloat(near.item.lat) : near.lat,
                        lon: near.item?.lon ? parseFloat(near.item.lon) : near.lon,
                        primaryText: pText
                    };
                    if (isSameLocation(nearCoords, currentLoc)) continue;
                    if (isJerusalemLocation(nearCoords)) continue;

                    seenKeys.add(pText.toLowerCase());
                    finalItems.push({
                        item: near.item,
                        displayText: near.displayText,
                        primaryText: pText,
                        secondaryText: sText,
                        lat: nearCoords.lat,
                        lon: nearCoords.lon,
                        iconClass: ICONS.location
                    });
                }
            }
        }

        // 2. Cidades Populares com 1 Toque (compensam até o limite antes de Jerusalém)
        for (const city of POPULAR_1TOUCH_CITIES) {
            if (finalItems.length >= maxBeforeJerusalem) break;
            if (isJerusalemLocation(city)) continue;
            if (!seenKeys.has(city.primaryText.toLowerCase()) && !isSameLocation(city, currentLoc)) {
                seenKeys.add(city.primaryText.toLowerCase());
                finalItems.push(city);
            }
        }

        // 3. Garantia Incondicional de Jerusalém:
        // Se Jerusalém não estava nas recentes, ela DEVE SEMPRE APARECER (no fundo da lista).
        if (!hasJerusalemInRecents) {
            finalItems.push({
                primaryText: 'Jerusalém',
                secondaryText: 'Israel',
                iconClass: 'fa-solid fa-star-of-david',
                isJerusalemAction: true
            });
            seenKeys.add('jerusalém');
            seenKeys.add('jerusalem');
        }
    } else {
        finalItems.push(...results.slice(0, LOCATION_SUGGESTIONS_LIMIT));
    }

    finalItems.forEach(resItem => {
        const li = document.createElement('li');
        li.className = 'legend-card';

        let primaryText = resItem.primaryText;
        let secondaryText = resItem.secondaryText;
        let iconClass = resItem.iconClass || ICONS.location;

        if (!primaryText && resItem.item) {
            const parts = (resItem.item.display_name || '').split(',').map(s => s.trim());
            let locality = parts[0] || '';
            if (resItem.item.address) {
                locality = resItem.item.address.village || resItem.item.address.town || resItem.item.address.city || resItem.item.address.municipality || resItem.item.address.county || resItem.item.address.suburb || resItem.item.address.hamlet || parts[0];
            }
            const country = resItem.item.address && resItem.item.address.country ? resItem.item.address.country : (parts.length > 1 ? parts[parts.length - 1] : '');
            primaryText = locality;
            secondaryText = country;
        } else if (!primaryText && resItem.displayText) {
            const parts = resItem.displayText.split(',').map(s => s.trim());
            primaryText = parts[0];
            secondaryText = parts.length > 1 ? parts[parts.length - 1] : '';
        }

        li.style.cssText = "display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 15px; border-radius: 14px; background: var(--hover-gradient); border: 0.5px solid var(--card-border-color); margin-bottom: 6px; box-sizing: border-box; cursor: pointer; transition: background 0.15s ease, border-color 0.15s ease;";
        li.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
                <div class="icon-circle" style="width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i class="${iconClass}"></i>
                </div>
                <div style="display: flex; flex-direction: column; text-align: left; min-width: 0; flex: 1; gap: 2px;">
                    <span style="font-size: var(--font-size-base); font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(primaryText)}</span>
                    <span style="font-size: var(--font-size-xs); color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(secondaryText) || 'Localidade'}</span>
                </div>
            </div>
        `;

        li.addEventListener('click', () => {
            let locObj = null;

            if (resItem.isJerusalemAction) {
                console.log('[Location] Localidade selecionada: Jerusalém');
                locObj = {
                    lat: 31.7683,
                    lon: 35.2137,
                    name: 'Jerusalém, Israel',
                    primaryText: 'Jerusalém',
                    secondaryText: 'Israel',
                    isIsrael: true,
                    tz: 'Asia/Jerusalem'
                };
            } else if (resItem.lat && resItem.lon) {
                const cleanSecondary = (secondaryText || '').replace(' • Recente', '').replace(' • Seleção rápida', '');
                const selectedName = resItem.fullName || (cleanSecondary ? `${primaryText}, ${cleanSecondary}` : primaryText);
                console.log(`[Location] Localidade rápida selecionada: ${selectedName}`);
                locObj = {
                    lat: resItem.lat,
                    lon: resItem.lon,
                    name: selectedName,
                    primaryText: primaryText,
                    secondaryText: cleanSecondary,
                    isIsrael: !!resItem.isIsrael,
                    tz: resItem.tz || 'UTC'
                };
            } else if (resItem.item) {
                const lat = parseFloat(resItem.item.lat);
                const lon = parseFloat(resItem.item.lon);
                const isIl = resItem.item.address && (resItem.item.address.country_code === 'il' || resItem.item.address.country === 'Israel');
                const tz = isIl ? 'Asia/Jerusalem' : Intl.DateTimeFormat().resolvedOptions().timeZone;
                const selectedName = `${primaryText}, ${secondaryText}`;
                console.log(`[Location] Localidade pesquisada selecionada: ${selectedName}`);
                locObj = {
                    lat,
                    lon,
                    name: selectedName,
                    primaryText,
                    secondaryText,
                    isIsrael: isIl,
                    tz
                };
            }

            if (locObj) {
                state.userLocation = locObj;
                state.locationName = locObj.name;
                state.userCityName = (locObj.primaryText || primaryText || locObj.name.split(',')[0] || 'Jerusalém').trim();
                saveSelectedLocation(locObj);
                applyEstimatedTheme(locObj.lat, locObj.lon);
            }

            clearNearbyLocationsCache();
            const modal = document.getElementById('location-modal');
            if (modal) closeModalSafely(modal);

            const searchInput = document.getElementById('location-search-input');
            if (searchInput) searchInput.value = '';

            const allLocEls = document.querySelectorAll('#card-local, #desktop-card-local, .loc-name-display');
            const fullLoc = secondaryText ? `${primaryText}, ${secondaryText}` : primaryText;
            allLocEls.forEach(el => {
                if (el) {
                    el.textContent = fullLoc;
                    const parent = el.closest('.location-text-wrap') || el.parentElement;
                    if (parent) {
                        const countryEl = parent.querySelector('.country-subtitle, .settings-card-desc');
                        if (countryEl) {
                            countryEl.textContent = 'Local selecionado';
                        }
                    }
                }
            });

            // Atualiza imediatamente o cálculo de horários zmanim / solar
            try {
                updateSolarPosition();
            } catch (e) { }

            if (updateDashboardCallback) {
                updateDashboardCallback();
            }
        });

        suggestionsList.appendChild(li);
    });
}

/**
 * Abre o modal de seleção de localidade com foco no campo de busca.
 */
export function openLocationModal() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('location-modal');
    if (!modal) return;

    trackMicroAction('modal_open', { modal: 'location' });
    closeOtherModalsOnDesktop('location-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (typeof history !== 'undefined' && (!history.state || !history.state.modalOpen)) {
        history.pushState({ modalOpen: true }, '');
    }
    if (typeof sessionStorage !== 'undefined') {
        try {
            sessionStorage.setItem('openLocationModal', 'true');
        } catch (e) { }
    }

    const readingBody = modal.querySelector('.reading-body');
    if (readingBody) readingBody.style.display = 'none';

    let skeletonContainer = modal.querySelector('.location-skeleton-container');
    if (!skeletonContainer) {
        skeletonContainer = document.createElement('div');
        skeletonContainer.className = 'location-skeleton-container';
        const modalContent = modal.querySelector('.modal-content, .reading-modal-content') || modal;
        modalContent.appendChild(skeletonContainer);
    }
    skeletonContainer.innerHTML = getReadingSkeletonHTML();
    skeletonContainer.style.display = 'block';

    setTimeout(() => {
        if (skeletonContainer) skeletonContainer.style.display = 'none';
        if (readingBody) readingBody.style.display = 'block';

        const searchInput = document.getElementById('location-search-input');
        if (searchInput) {
            searchInput.value = '';
            renderSuggestions([], { nearby: getCachedNearbyLocations() });
            fetchNearbyLocations((nearby) => {
                if (searchInput && searchInput.value.trim().length < 3) {
                    renderSuggestions([], { nearby });
                }
            });
            setTimeout(() => searchInput?.focus?.(), 100);
        }
    }, 150);
}

/**
 * Inicializa ouvintes do campo de busca de localidade com debounce.
 */
export function initLocationSearchListener() {
    if (typeof document === 'undefined') return;
    const searchInput = document.getElementById('location-search-input');
    if (!searchInput || searchInput.dataset.listenerBound) return;
    searchInput.dataset.listenerBound = 'true';

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(searchTimeout);

        if (query.length < 3) {
            renderSuggestions([], { nearby: getCachedNearbyLocations() });
            return;
        }

        searchTimeout = setTimeout(async () => {
            const currentQuery = searchInput.value.trim();
            if (currentQuery !== query) return;

            const data = await searchNominatim(query, 15);
            if (!data) {
                const suggestionsList = document.getElementById('location-suggestions');
                if (suggestionsList) {
                    suggestionsList.innerHTML = `
                        <li class="reading-error" style="margin: 8px 0; list-style: none;">
                            <span class="reading-error-title">Serviço Indisponível</span>
                            <span class="reading-error-message">Não foi possível consultar os servidores de localização.</span>
                        </li>
                    `;
                }
                return;
            }

            if (searchInput.value.trim() !== query) return;

            if (data.length === 0) {
                const suggestionsList = document.getElementById('location-suggestions');
                if (suggestionsList) {
                    suggestionsList.innerHTML = `
                        <li class="reading-error" style="margin: 8px 0; list-style: none; background: var(--hover-gradient); border-color: var(--card-border-color); box-shadow: none;">
                            <span class="reading-error-title" style="color: var(--text-primary);">Nenhum Resultado</span>
                            <span class="reading-error-message" style="color: var(--text-muted);">Não foi encontrada nenhuma localidade com este nome.</span>
                        </li>
                    `;
                }
                return;
            }

            data.sort((a, b) => (b.importance || 0) - (a.importance || 0));

            const seenDisplayNames = new Set();
            const finalResults = [];

            data.forEach(item => {
                if (item.type === 'country' || item.class === 'country' || item.addresstype === 'country') return;

                const parts = item.display_name.split(',').map(s => s.trim());
                if (parts.length <= 1) return;

                let locality = parts[0];
                if (item.address) {
                    locality = item.address.village || item.address.town || item.address.city || item.address.municipality || item.address.county || item.address.suburb || item.address.hamlet || parts[0];
                }

                const country = item.address && item.address.country ? item.address.country : parts[parts.length - 1];
                const key = `${locality}, ${country}`;

                if (seenDisplayNames.has(key)) return;
                seenDisplayNames.add(key);

                finalResults.push({
                    item,
                    primaryText: locality,
                    secondaryText: country
                });
            });

            renderSuggestions(finalResults);
        }, 400);
    });
}
