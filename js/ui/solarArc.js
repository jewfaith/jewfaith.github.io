import { state } from '../state.js';
import { ICONS } from './icons.js';
import { getSelectedLocation, JERUSALEM_COORDS } from '../services/locationService.js';

export function initSolarArc() {
    renderSolarArcWidget();
    updateSolarPosition();
}

export function renderSolarArcWidget() {
    const container = document.getElementById('solar-arc-container');
    if (!container) return;

    container.innerHTML = `
        <div class="settings-card event-card glass-panel" id="card-solar-glance" tabindex="0" role="button" aria-label="Ver Tabela Completa de Zmanim" style="cursor: pointer;">
            <div class="settings-card-left">
                <i class="${ICONS.sun} settings-icon" data-icon="sun" id="solar-hero-icon"></i>
                <div class="settings-card-text">
                    <span class="settings-card-title" id="solar-hero-city-title">Sha'ah Zmanit</span>
                    <span class="settings-card-desc" id="solar-phase-label">Horário Litúrgico</span>
                </div>
            </div>
            <div class="card-arrow-action" aria-hidden="true">
                <i class="fa-solid fa-arrow-right"></i>
            </div>
        </div>
    `;

    updateSolarPosition();
}

export function updateSolarPosition() {
    if (typeof document !== 'undefined' && document.hidden) return;

    const cityTitle = document.getElementById('solar-hero-city-title');
    const phaseLabel = document.getElementById('solar-phase-label');
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

    let nextEventName = 'Sol Poente';
    let targetEventMs = sunsetMs;
    let phaseName = 'Dia Haláchico';
    let iconClass = ICONS.sun;
    let dataIcon = 'sun';

    if (nowMs < dawnMs) {
        nextEventName = 'Alvorada Alot';
        targetEventMs = dawnMs;
        phaseName = 'Noite Haláchica';
        iconClass = ICONS.moon;
        dataIcon = 'moon';
    } else if (nowMs >= dawnMs && nowMs < sunriseMs) {
        nextEventName = 'Nascer do Sol';
        targetEventMs = sunriseMs;
        phaseName = 'Crepúsculo Matinal';
        iconClass = ICONS.sunrise;
        dataIcon = 'sunrise';
    } else if (nowMs >= sunriseMs && nowMs < noonMs) {
        nextEventName = 'Meio-dia Chatzot';
        targetEventMs = noonMs;
        phaseName = 'Manhã Haláchica';
        iconClass = ICONS.sun;
        dataIcon = 'sun';
    } else if (nowMs >= noonMs && nowMs < sunsetMs) {
        nextEventName = 'Sol Poente';
        targetEventMs = sunsetMs;
        phaseName = 'Tarde Mincha';
        iconClass = ICONS.cloudSun;
        dataIcon = 'cloudSun';
    } else if (nowMs >= sunsetMs && nowMs < duskMs) {
        nextEventName = 'Estrelas Tzeit';
        targetEventMs = duskMs;
        phaseName = 'Crepúsculo Vespertino';
        iconClass = ICONS.cloudMoon;
        dataIcon = 'cloudMoon';
    } else {
        nextEventName = 'Alvorada Alot';
        targetEventMs = dawnMs + 24 * 60 * 60 * 1000;
        phaseName = 'Noite Haláchica';
        iconClass = ICONS.moon;
        dataIcon = 'moon';
    }

    const diffMs = Math.max(0, targetEventMs - nowMs);
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const exactHours = totalMinutes / 60;

    let countdownStr = '';
    if (totalMinutes < 2) {
        countdownStr = 'agora';
    } else if (exactHours >= 0.85) {
        const roundedHours = Math.round(exactHours);
        countdownStr = `em ${roundedHours}h`;
    } else {
        countdownStr = `em ${totalMinutes} min`;
    }

    // Sha'ah Zmanit (Hora Haláchica Gra: 1/12 da duração do dia ou noite)
    const isDaytime = nowMs >= sunriseMs && nowMs < sunsetMs;
    let shaaZmanitMs;
    if (isDaytime) {
        const dayDurationMs = Math.max(1, sunsetMs - sunriseMs);
        shaaZmanitMs = dayDurationMs / 12;
    } else {
        let nightDurationMs;
        if (nowMs < sunriseMs) {
            const prevSunsetMs = sunsetMs - 24 * 60 * 60 * 1000;
            nightDurationMs = Math.max(1, sunriseMs - prevSunsetMs);
        } else {
            const nextSunriseMs = sunriseMs + 24 * 60 * 60 * 1000;
            nightDurationMs = Math.max(1, nextSunriseMs - sunsetMs);
        }
        shaaZmanitMs = nightDurationMs / 12;
    }

    if (cityTitle && cityTitle.textContent !== "Sha'ah Zmanit") {
        cityTitle.textContent = "Sha'ah Zmanit";
        cityTitle.title = "Sha'ah Zmanit";
    }

    if (phaseLabel && phaseLabel.textContent !== "Horário Litúrgico") {
        phaseLabel.textContent = "Horário Litúrgico";
    }

    if (heroIcon) {
        heroIcon.className = `${iconClass} settings-icon`;
        if (dataIcon) heroIcon.setAttribute('data-icon', dataIcon);
    }

    const festZmanSub = document.getElementById('zmanim-festivals-sub');
    if (festZmanSub) {
        festZmanSub.textContent = nextEventName || 'Tabela Solar';
    }
}
