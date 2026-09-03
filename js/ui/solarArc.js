import { state } from '../state.js';
import { openZmanimModal } from './zmanimTable.js';
import { ICONS } from './icons.js';

let solarArcInterval = null;

export function initSolarArc() {
    renderSolarArcWidget();
    if (solarArcInterval) clearInterval(solarArcInterval);
    solarArcInterval = setInterval(updateSolarPosition, 10000);
}

export function renderSolarArcWidget() {
    const container = document.getElementById('solar-arc-container');
    if (!container) return;

    container.innerHTML = `
        <div class="festival-hero-card glass-panel" id="card-solar-glance" tabindex="0" role="button" aria-label="Ver Tabela Completa de Zmanim" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-radius: 18px;">
            <div style="display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1;">
                <div class="icon-circle" style="width: 48px; height: 48px; font-size: 20px; border-radius: 14px; background: var(--icon-unified-grad); border: 0.5px solid var(--icon-unified-border); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                    <i class="${ICONS.sun}" data-icon="sun" style="color: var(--icon-unified-color);" id="solar-hero-icon"></i>
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
                    <h2 class="solar-title" id="solar-hero-city-title" style="font-size: 1.12rem; font-weight: 800; letter-spacing: -0.02em; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Jerusalém Israel</h2>
                    <span class="solar-subtitle" id="solar-hero-event-sub" style="font-size: var(--font-size-xs); color: var(--accent-color); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Horários Solares</span>
                </div>
            </div>
            <div class="solar-action-chevron" style="display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-left: 10px;">
                <i class="${ICONS.chevronRight}" data-icon="chevronRight" style="color: var(--text-muted); font-size: 12px;"></i>
            </div>
        </div>
    `;

    document.getElementById('card-solar-glance')?.addEventListener('click', openZmanimModal);
    updateSolarPosition();
}

export function updateSolarPosition() {
    if (typeof document !== 'undefined' && document.hidden) return;

    const cityTitle = document.getElementById('solar-hero-city-title');
    const eventSub = document.getElementById('solar-hero-event-sub');
    const phaseLabel = document.getElementById('solar-phase-label');
    const countdownText = document.getElementById('solar-countdown-text');
    const heroIcon = document.getElementById('solar-hero-icon');

    const now = new Date();
    const nowMs = now.getTime();

    let sunriseMs, sunsetMs, noonMs, dawnMs, duskMs;

    if (state.currentZmanim && state.currentZmanim.sunrise && state.currentZmanim.sunset) {
        sunriseMs = new Date(state.currentZmanim.sunrise).getTime();
        sunsetMs = new Date(state.currentZmanim.sunset).getTime();
        dawnMs = state.currentZmanim.alotHaShachar ? new Date(state.currentZmanim.alotHaShachar).getTime() : sunriseMs - 72 * 60 * 1000;
        duskMs = state.currentZmanim.tzeit7083deg ? new Date(state.currentZmanim.tzeit7083deg).getTime() : sunsetMs + 45 * 60 * 1000;
        noonMs = (sunriseMs + sunsetMs) / 2;
    } else {
        const today = new Date();
        sunriseMs = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 0, 0).getTime();
        sunsetMs = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 30, 0).getTime();
        noonMs = (sunriseMs + sunsetMs) / 2;
        dawnMs = sunriseMs - 60 * 60 * 1000;
        duskMs = sunsetMs + 45 * 60 * 1000;
    }

    const fmtTime = (ms) => {
        const d = new Date(ms);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    let nextEventName = 'Pôr Sol';
    let targetEventMs = sunsetMs;
    let phaseName = 'DIA HALÁCHICO';
    let iconClass = ICONS.sun;

    if (nowMs < dawnMs) {
        nextEventName = 'Alvorada Alot';
        targetEventMs = dawnMs;
        phaseName = 'NOITE HALÁCHICA';
        iconClass = ICONS.moon;
    } else if (nowMs >= dawnMs && nowMs < sunriseMs) {
        nextEventName = 'Nascer Sol';
        targetEventMs = sunriseMs;
        phaseName = 'CREPÚSCULO MATINAL';
        iconClass = ICONS.sunrise;
    } else if (nowMs >= sunriseMs && nowMs < noonMs) {
        nextEventName = 'Meio-dia Chatzot';
        targetEventMs = noonMs;
        phaseName = 'MANHÃ HALÁCHICA';
        iconClass = ICONS.sun;
    } else if (nowMs >= noonMs && nowMs < sunsetMs) {
        nextEventName = 'Pôr Sol';
        targetEventMs = sunsetMs;
        phaseName = 'TARDE MINCHA';
        iconClass = ICONS.cloudSun;
    } else if (nowMs >= sunsetMs && nowMs < duskMs) {
        nextEventName = 'Estrelas Tzeit';
        targetEventMs = duskMs;
        phaseName = 'CREPÚSCULO VESPERTINO';
        iconClass = ICONS.cloudMoon;
    } else {
        nextEventName = 'Alvorada Alot';
        targetEventMs = dawnMs + 24 * 60 * 60 * 1000;
        phaseName = 'NOITE HALÁCHICA';
        iconClass = ICONS.moon;
    }

    const diffMs = Math.max(0, targetEventMs - nowMs);
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const exactHours = totalMinutes / 60;

    let countdownStr = '';
    if (totalMinutes < 2) {
        countdownStr = 'Agora';
    } else if (exactHours >= 0.85) {
        const roundedHours = Math.round(exactHours);
        countdownStr = `${roundedHours}h`;
    } else {
        countdownStr = `${totalMinutes} min`;
    }

    if (phaseLabel) phaseLabel.textContent = phaseName;
    if (countdownText) countdownText.textContent = `${nextEventName} • ${countdownStr}`;

    const cityName = state.userCityName || state.locationName || 'Jerusalém Israel';
    let cleanCity = cityName.split(',')[0].trim();
    const cityWords = cleanCity.split(/\s+/);
    if (cityWords.length === 1) {
        cleanCity = `${cleanCity} Israel`;
    } else if (cityWords.length > 2) {
        cleanCity = `${cityWords[0]} ${cityWords[1]}`;
    }

    if (cityTitle) {
        cityTitle.textContent = cleanCity;
    }
    if (eventSub) {
        eventSub.textContent = 'Horários Solares';
    }
    if (heroIcon) {
        heroIcon.className = iconClass;
    }
}
