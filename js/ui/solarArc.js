import { state } from '../state.js';
import { ICONS } from './icons.js';
import { getSelectedLocation, JERUSALEM_COORDS } from '../services/locationService.js';
import { checkSacredRestStatus } from '../domain/halacha.js';

export function initSolarArc() {
    renderSolarArcWidget();
    updateSolarPosition();
    updateShaahZmanitCardPosition();
    initTwoHourUpdateTimer();
}

export function renderSolarArcWidget() {
    const container = document.getElementById('solar-arc-container');
    if (!container) return;

    container.innerHTML = `
        <div class="settings-card event-card glass-panel" id="card-solar-glance" tabindex="0" role="button" aria-label="Ver Tabela Completa de Horários Litúrgicos (Zmanim)">
            <div class="settings-card-left">
                <i class="${ICONS.sun} settings-icon" data-icon="sun" id="solar-hero-icon"></i>
                <div class="settings-card-text">
                    <span class="settings-card-title" id="solar-hero-city-title">Sha'ah Zmanit</span>
                    <span class="settings-card-desc" id="solar-phase-label">Horários Litúrgicos</span>
                </div>
            </div>
            <div class="card-arrow-action" aria-hidden="true">
                <i class="fa-solid fa-arrow-right"></i>
            </div>
        </div>
    `;

    updateSolarPosition();
    updateShaahZmanitCardPosition();
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

    const shTotalMinutes = Math.max(1, Math.round(shaaZmanitMs / 60000));
    const shHours = String(Math.floor(shTotalMinutes / 60)).padStart(2, '0');
    const shMinutes = String(shTotalMinutes % 60).padStart(2, '0');

    const HERO_TITLE = "Sha'ah Zmanit";
    const HERO_DESC = "Horários Litúrgicos";

    if (cityTitle && cityTitle.textContent !== HERO_TITLE) {
        cityTitle.textContent = HERO_TITLE;
        cityTitle.title = "Sha'ah Zmanit • Horários Litúrgicos";
    }

    if (phaseLabel && phaseLabel.textContent !== HERO_DESC) {
        phaseLabel.textContent = HERO_DESC;
    }

    if (heroIcon) {
        heroIcon.className = `${iconClass} settings-icon`;
        if (dataIcon) heroIcon.setAttribute('data-icon', dataIcon);
    }

    const festZmanSub = document.getElementById('zmanim-festivals-sub');
    if (festZmanSub) {
        festZmanSub.textContent = nextEventName || 'Tabela Solar';
    }

    updateShaahZmanitCardPosition();
}

/**
 * Atualiza a posição e relevância do card do Sha'ah Zmanit na aba de Festas.
 * Regra: se a última festa tiver mais de 2 horas (fora do Shabat/Yom Tov e do resguardo de 2h pós-Havdalá),
 * empurra única e exclusivamente o card do Sha'ah Zmanit para a frente (topo da lista).
 */
export function updateShaahZmanitCardPosition() {
    if (typeof document === 'undefined') return;

    const solarContainer = document.getElementById('solar-arc-container');
    const hdateWrapper = document.getElementById('card-hdate-wrapper');
    if (!solarContainer || !hdateWrapper) return;

    const now = Date.now();
    let isFestivalActiveOrRecent = false;

    // 1. Verifica se estamos dentro do Shabat ou Festa Sagrada (ou no resguardo pós-Havdalá de 2h)
    try {
        const restStatus = checkSacredRestStatus(now, state.unifiedEvents, state.currentHdate, state.currentSunsetTime, state.userLocation?.isIsrael);
        if (restStatus && restStatus.isRest) {
            isFestivalActiveOrRecent = true;
        }
    } catch (e) { }

    // 2. Se não estiver em Shabat/Yom Tov estrito, avalia festivais bíblicos adicionais no calendário
    if (!isFestivalActiveOrRecent && state.unifiedEvents && state.unifiedEvents.length) {
        const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
        for (const ev of state.unifiedEvents) {
            if (!ev || !ev.time || !ev.isBiblical || ev.category === 'parashat' || ev.category === 'roshchodesh') continue;
            const evEnd = ev.endTime || (ev.time + 24 * 60 * 60 * 1000);
            if (now >= ev.time && now <= (evEnd + TWO_HOURS_MS)) {
                isFestivalActiveOrRecent = true;
                break;
            }
        }
    }

    const parent = solarContainer.parentElement;
    if (!parent) return;

    // Só reordena nós via insertBefore se partilharem o mesmo container pai (compatibilidade de layout)
    if (hdateWrapper && parent === hdateWrapper.parentElement) {
        if (!isFestivalActiveOrRecent) {
            if (parent.firstElementChild !== solarContainer) {
                parent.insertBefore(solarContainer, parent.firstElementChild);
            }
        } else {
            if (parent.firstElementChild !== hdateWrapper) {
                parent.insertBefore(hdateWrapper, parent.firstElementChild);
            }
        }
    }

    if (!isFestivalActiveOrRecent) {
        solarContainer.classList.add('pushed-forward');
        hdateWrapper.classList.remove('pushed-forward');
    } else {
        hdateWrapper.classList.add('pushed-forward');
        solarContainer.classList.remove('pushed-forward');
    }
}

let twoHourIntervalId = null;

/**
 * Atualização periódica a cada 2 horas (7.200.000 ms).
 * Mantém o ciclo solar, zmanim e a prioridade do card do Sha'ah Zmanit sincronizados.
 */
export function initTwoHourUpdateTimer() {
    if (twoHourIntervalId) clearInterval(twoHourIntervalId);

    twoHourIntervalId = setInterval(() => {
        try {
            updateSolarPosition();
            updateShaahZmanitCardPosition();
        } catch (e) {
            console.warn('[Shaah Zmanit] Erro no ciclo de 2 horas:', e);
        }
    }, 2 * 60 * 60 * 1000);
}
