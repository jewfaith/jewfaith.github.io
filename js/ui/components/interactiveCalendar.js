/**
 * INTERACTIVECALENDAR.JS - CALENDÁRIO MENSAL INTERATIVO TORÁ & GREGORIANO
 * 
 * Concebido e desenvolvido para o Yisrael Date (jewfaith.github.io):
 * - Visualização mensal interativa com correlação dia a dia (Gregoriano & Hebraico).
 * - Navegação rápida de meses (<, >, botão 'Hoje').
 * - Badges visuais de alta legibilidade para Shabat, Festas Bíblicas, Tradições e Rosh Chodesh.
 * - Modal / Painel de detalhes completos ao selecionar qualquer dia do mês.
 * - Telemetria HEART integrada (Adoption, Engagement e Task Success).
 */

import { state } from '../../state.js';
import { HEBREW_MONTHS_PT, FESTIVAL_DESCRIPTIONS, getFestivalDescription } from '../../domain/constants.js';
import { getHebrewDateFromGregorian } from '../../domain/biblicalCalendar.js';
import { getParashaSummary } from '../../domain/parashot.js';
import { trackHeartEvent, trackTaskSuccess } from '../../services/telemetryService.js';
import { ICONS, getEventIcon } from '../icons.js';
import { formatHebrewInText, formatCardTwoWords, createDescriptionCardHTML } from '../../domain/formatters.js';
import { getFestivalIcon } from '../festivalsView.js';
import { openModalElement, closeModalSafely } from '../modals/modalManager.js';

let displayedYear = null;
let displayedMonth = null; // 0-indexed (0 = Jan, 11 = Dez)
let selectedDateStr = null;

const GREGORIAN_MONTHS_FULL = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Inicializa a data atual do calendário com base na data do sistema ou simulação
 */
function initCalendarDate() {
    const baseDate = (state.isSimulation && state.simulatedGregorianDate)
        ? new Date(state.simulatedGregorianDate)
        : new Date();

    if (displayedYear === null || displayedMonth === null) {
        displayedYear = baseDate.getFullYear();
        displayedMonth = baseDate.getMonth();
    }
}

/**
 * Retorna uma chave canónica de data no formato YYYY-MM-DD
 */
function formatDateKey(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
}

/**
 * Constrói um mapa de eventos indexados por data gregoriana YYYY-MM-DD
 */
function buildDateEventsIndex(events) {
    const index = new Map();
    if (!Array.isArray(events)) return index;

    events.forEach(ev => {
        if (!ev) return;
        let dateKey = null;

        if (ev.raw && ev.raw.date) {
            dateKey = ev.raw.date.split('T')[0];
        } else if (ev.time) {
            const d = new Date(ev.time);
            dateKey = formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
        }

        if (!dateKey) return;

        if (!index.has(dateKey)) {
            index.set(dateKey, []);
        }
        index.get(dateKey).push(ev);
    });

    return index;
}

/**
 * Formata uma string de data hebraica para a nomenclatura bíblica oficial da Torá (Aviv, Ziv, Etanim, Bul).
 */
export function formatHebrewDateString(rawHdate) {
    if (!rawHdate) return '';
    const parts = String(rawHdate).trim().split(/\s+/);
    if (parts.length >= 2) {
        const day = parts[0];
        const rawM = parts.slice(1, parts.length > 2 ? -1 : undefined).join(' ');
        const year = parts.length > 2 ? parts[parts.length - 1] : '';
        const mPt = HEBREW_MONTHS_PT[rawM] || rawM;
        return [day, mPt, year].filter(Boolean).join(' ');
    }
    return rawHdate;
}

/**
 * Retorna os dados hebraicos exatos de qualquer dia gregoriano
 */
function getHebrewDateInfo(targetDate, eventsIndex) {
    const dateKey = formatDateKey(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayEvents = eventsIndex ? (eventsIndex.get(dateKey) || []) : [];

    // 1. Se houver evento com data hebraica explícita na API
    const withHdate = dayEvents.find(e => e.raw && e.raw.hdate);
    if (withHdate && withHdate.raw.hdate) {
        const fullStr = formatHebrewDateString(withHdate.raw.hdate);
        const parts = withHdate.raw.hdate.split(' ');
        const hd = parseInt(parts[0], 10) || 1;
        const rawM = parts.slice(1, -1).join(' ') || parts[1];
        const hm = HEBREW_MONTHS_PT[rawM] || rawM;
        const hy = parts[parts.length - 1] || '';
        return { hd, hm, hy, fullStr };
    }

    // 2. Cálculo astronómico exato offline
    const hObj = getHebrewDateFromGregorian(targetDate);
    const hm = HEBREW_MONTHS_PT[hObj.hm] || hObj.hm;
    const fullStr = `${hObj.hd} ${hm} ${hObj.hy}`;
    return { hd: hObj.hd, hm, hy: hObj.hy, fullStr };
}

/**
 * Renderiza o Calendário Mensal Interativo
 */
export function renderInteractiveCalendar() {
    const root = document.getElementById('interactive-calendar-root');
    if (!root) return;

    initCalendarDate();

    const today = (state.isSimulation && state.simulatedGregorianDate)
        ? new Date(state.simulatedGregorianDate)
        : new Date();
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    const eventsIndex = buildDateEventsIndex(state.unifiedEvents || []);

    // Primeiro dia do mês e total de dias
    const firstDayOfMonth = new Date(displayedYear, displayedMonth, 1);
    const startWeekday = firstDayOfMonth.getDay(); // 0: Dom ... 6: Sáb
    const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(displayedYear, displayedMonth, 0).getDate();

    // Determina o intervalo do mês hebraico com cálculo matemático exato
    const firstDayH = getHebrewDateInfo(new Date(displayedYear, displayedMonth, 1), eventsIndex);
    const lastDayH = getHebrewDateInfo(new Date(displayedYear, displayedMonth, daysInMonth), eventsIndex);

    let titleHebrew = '';
    if (firstDayH.hm === lastDayH.hm) {
        titleHebrew = `${firstDayH.hm} ${firstDayH.hy}`;
    } else if (String(firstDayH.hy) === String(lastDayH.hy)) {
        titleHebrew = `${firstDayH.hm} – ${lastDayH.hm} ${lastDayH.hy}`;
    } else {
        titleHebrew = `${firstDayH.hm} ${firstDayH.hy} – ${lastDayH.hm} ${lastDayH.hy}`;
    }

    const titleGregorian = `${GREGORIAN_MONTHS_FULL[displayedMonth]} ${displayedYear}`;
    const predominantHebrewMonth = firstDayH.hm;

    let html = `
        <div class="interactive-calendar-card glass-panel" role="region" aria-label="Calendário Mensal">
            <!-- Barra Superior do Calendário -->
            <div class="calendar-header-toolbar">
                <div class="calendar-title-wrap">
                    <h2 class="calendar-month-title">${titleGregorian}</h2>
                    ${titleHebrew ? `<span class="calendar-hebrew-subtitle">• <i class="fa-solid fa-moon"></i> ${titleHebrew}</span>` : ''}
                </div>
                <div class="calendar-nav-actions" role="toolbar" aria-label="Navegação do Calendário">
                    <button id="cal-btn-prev" class="calendar-nav-btn nav-arrow-btn" aria-label="Mês Anterior" title="Mês Anterior">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <button id="cal-btn-today" class="calendar-nav-btn calendar-today-btn" aria-label="Ir para Hoje" title="Ir para o dia de Hoje">
                        <i class="fa-solid fa-calendar-day"></i>
                        <span>Hoje</span>
                    </button>
                    <button id="cal-btn-next" class="calendar-nav-btn nav-arrow-btn" aria-label="Mês Seguinte" title="Mês Seguinte">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>

            <!-- Legenda Rápida de Badges -->
            <div class="calendar-legend-bar" aria-hidden="true">
                <span class="legend-item"><span class="legend-dot dot-today"></span> Hoje</span>
                <span class="legend-item"><span class="legend-dot dot-shabbat"></span> Shabat</span>
                <span class="legend-item"><span class="legend-dot dot-biblical"></span> Festa Bíblica</span>
                <span class="legend-item"><span class="legend-dot dot-traditional"></span> Tradição / Jejum</span>
                <span class="legend-item"><span class="legend-dot dot-rosh-chodesh"></span> Rosh Chodesh</span>
            </div>

            <!-- Grelha do Calendário -->
            <div class="calendar-grid-container" role="grid" aria-label="Grelha de dias de ${titleGregorian}">
                <!-- Cabeçalho dos Dias da Semana -->
                <div class="calendar-weekdays-row" role="row">
                    ${WEEKDAYS_SHORT.map((wd, i) => `
                        <div class="calendar-weekday-cell ${i === 6 ? 'is-shabbat-col' : ''}" role="columnheader" aria-label="${wd}">${wd}</div>
                    `).join('')}
                </div>

                <!-- Células dos Dias -->
                <div class="calendar-days-grid">
    `;

    // 1. Dias do Mês Anterior (padding)
    for (let p = startWeekday - 1; p >= 0; p--) {
        const prevDayNum = daysInPrevMonth - p;
        const prevDate = new Date(displayedYear, displayedMonth - 1, prevDayNum);
        const prevKey = formatDateKey(prevDate.getFullYear(), prevDate.getMonth(), prevDayNum);
        html += renderDayCell(prevDayNum, prevKey, prevDate, eventsIndex, true, false);
    }

    // 2. Dias do Mês Atual
    for (let day = 1; day <= daysInMonth; day++) {
        const cellDate = new Date(displayedYear, displayedMonth, day);
        const cellKey = formatDateKey(displayedYear, displayedMonth, day);
        const isToday = (cellKey === todayKey);
        html += renderDayCell(day, cellKey, cellDate, eventsIndex, false, isToday);
    }

    // 3. Dias do Mês Seguinte (padding para completar linha de 7)
    const totalRendered = startWeekday + daysInMonth;
    const remainingPadding = (7 - (totalRendered % 7)) % 7;
    for (let n = 1; n <= remainingPadding; n++) {
        const nextDate = new Date(displayedYear, displayedMonth + 1, n);
        const nextKey = formatDateKey(nextDate.getFullYear(), nextDate.getMonth(), n);
        html += renderDayCell(n, nextKey, nextDate, eventsIndex, true, false);
    }

    html += `
                </div>
            </div>
        </div>
    `;

    root.innerHTML = html;
    state.currentDisplayedHebrewMonth = predominantHebrewMonth;
    try {
        window.dispatchEvent(new CustomEvent('calendar-month-changed', {
            detail: {
                hebrewMonth: predominantHebrewMonth,
                gregorianYear: displayedYear,
                gregorianMonth: displayedMonth
            }
        }));
    } catch (e) { }
    attachCalendarListeners();
}

export function getDisplayedHebrewMonth() {
    return state.currentDisplayedHebrewMonth || '';
}

/**
 * Renderiza uma célula individual de dia do calendário
 */
function renderDayCell(dayNum, dateKey, dateObj, eventsIndex, isOtherMonth, isToday) {
    const isShabbat = (dateObj.getDay() === 6);
    const dayEvents = eventsIndex.get(dateKey) || [];

    const hasBiblical = dayEvents.some(e => e.isBiblical && e.category !== 'parashat' && e.name !== 'Yom Shabbat');
    const hasTraditional = dayEvents.some(e => e.isTraditional || e.category === 'fast');
    const hasRoshChodesh = dayEvents.some(e => e.category === 'roshchodesh' || (e.name && e.name.toLowerCase().includes('chodesh')));

    const hInfo = getHebrewDateInfo(dateObj, eventsIndex);
    const isFirstHebrewDay = (hInfo.hd === 1);

    let classes = ['calendar-day-cell'];
    if (isOtherMonth) classes.push('is-other-month');
    if (isToday) classes.push('is-today');
    if (isShabbat) classes.push('is-shabbat');
    if (isFirstHebrewDay) classes.push('is-rosh-chodesh-day');

    // Identifica títulos para tooltip/aria-label
    const eventTitles = dayEvents.map(e => e.name).filter(Boolean);
    const labelTitle = [
        `${dayNum} de ${GREGORIAN_MONTHS_FULL[dateObj.getMonth()]}`,
        `(${hInfo.fullStr})`,
        isShabbat ? 'Shabat' : '',
        eventTitles.join(', ')
    ].filter(Boolean).join(' • ');

    // No dia 1 do mês hebraico, exibe o nome do novo mês de forma elegante (ex: "1 Etan" ou "1 Elul")
    // Nos outros dias, exibe o número hebraico simples (ex: "19", "25", "9") sem cortes ou reticências
    const hebrewDisplay = isFirstHebrewDay 
        ? `1 ${hInfo.hm.slice(0, 4)}` 
        : `${hInfo.hd}`;

    return `
        <div class="${classes.join(' ')}" 
             data-date="${dateKey}" 
             data-hdate="${hInfo.fullStr}" 
             role="gridcell" 
             aria-label="${labelTitle}"
             title="${labelTitle}">
            <div class="day-cell-top">
                <span class="day-gregorian-num ${isToday ? 'today-num-badge' : ''}">${dayNum}</span>
                <span class="day-hebrew-num ${isFirstHebrewDay ? 'hebrew-new-month' : ''}" title="${hInfo.fullStr}">${hebrewDisplay}</span>
            </div>
            <div class="day-indicators-container">
                ${isToday ? `<span class="cal-dot dot-today" title="Hoje"></span>` : ''}
                ${isShabbat ? `<span class="cal-dot dot-shabbat" title="Shabat"></span>` : ''}
                ${hasBiblical ? `<span class="cal-dot dot-biblical" title="Festa Bíblica"></span>` : ''}
                ${hasTraditional ? `<span class="cal-dot dot-traditional" title="Tradição de Israel / Jejum"></span>` : ''}
                ${hasRoshChodesh ? `<span class="cal-dot dot-rosh-chodesh" title="Rosh Chodesh"></span>` : ''}
            </div>
        </div>
    `;
}

/**
 * Associa eventos de clique e navegação ao calendário
 */
function attachCalendarListeners() {
    const btnPrev = document.getElementById('cal-btn-prev');
    const btnNext = document.getElementById('cal-btn-next');
    const btnToday = document.getElementById('cal-btn-today');

    if (btnPrev) {
        btnPrev.addEventListener('click', (e) => {
            e.preventDefault();
            displayedMonth--;
            if (displayedMonth < 0) {
                displayedMonth = 11;
                displayedYear--;
            }
            trackHeartEvent('calendar_month_nav', { direction: 'prev', year: displayedYear, month: displayedMonth });
            renderInteractiveCalendar();
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', (e) => {
            e.preventDefault();
            displayedMonth++;
            if (displayedMonth > 11) {
                displayedMonth = 0;
                displayedYear++;
            }
            trackHeartEvent('calendar_month_nav', { direction: 'next', year: displayedYear, month: displayedMonth });
            renderInteractiveCalendar();
        });
    }

    if (btnToday) {
        btnToday.addEventListener('click', (e) => {
            e.preventDefault();
            const now = (state.isSimulation && state.simulatedGregorianDate)
                ? new Date(state.simulatedGregorianDate)
                : new Date();
            displayedYear = now.getFullYear();
            displayedMonth = now.getMonth();
            trackHeartEvent('calendar_nav_today', { year: displayedYear, month: displayedMonth });
            renderInteractiveCalendar();
        });
    }
}

/**
 * Manipula a seleção de um dia e abre o modal de detalhes do dia
 */
function handleDayClick(cell) {
    const dateKey = cell.getAttribute('data-date');
    const hdateStr = cell.getAttribute('data-hdate') || '';

    if (!dateKey) return;
    selectedDateStr = dateKey;

    // Atualiza estado visual de seleção
    document.querySelectorAll('.calendar-day-cell').forEach(c => c.classList.remove('is-selected'));
    cell.classList.add('is-selected');

    trackHeartEvent('calendar_day_select', { date: dateKey, hdate: hdateStr });
    trackTaskSuccess('inspect_calendar_day');

    openDayDetailsModal(dateKey, hdateStr);
}

/**
 * Abre e preenche o modal de detalhes do dia selecionado
 */
export function openDayDetailsModal(dateKey, hdateStr, options = {}) {
    const modal = document.getElementById('day-details-modal');
    if (!modal) return;

    const formattedHdate = formatHebrewDateString(hdateStr);

    const [y, m, d] = dateKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    const titleEl = document.getElementById('day-details-title');
    const subtitleEl = document.getElementById('day-details-subtitle');
    const bodyEl = document.getElementById('day-details-body');

    const formattedGregorian = `${d} ${GREGORIAN_MONTHS_FULL[dateObj.getMonth()]}`;
    const hdateTwoWords = `${hInfo.hd} ${hInfo.hm || 'Mês'}`;

    if (titleEl) titleEl.textContent = hdateTwoWords;
    if (subtitleEl) subtitleEl.textContent = formattedGregorian;

    const eventsIndex = buildDateEventsIndex(state.unifiedEvents || []);
    const dayEvents = eventsIndex.get(dateKey) || [];

    let bodyHtml = `
        <div class="day-details-container">
    `;

    // Se for Sábado (Yom Shabbat)
    if (dateObj.getDay() === 6) {
        const parashaEv = dayEvents.find(e => e.category === 'parashat' || (e.name && /^(?:Parashat|Parashá|Parashah|Parasha)\b/i.test(e.name)));
        const parashaName = parashaEv ? parashaEv.name.replace(/^(?:Parashat|Parashá|Parashah|Parasha)\s+/i, '').trim() : 'Yom Shabbat';
        const cardTitle = parashaName === 'Yom Shabbat' ? 'Yom Shabbat' : formatCardTwoWords(parashaName);
        const summary = getParashaSummary(parashaName) || getFestivalDescription('Yom Shabbat');
        let parashaHtml = '';
        if (summary) {
            const paragraphs = Array.isArray(summary) ? summary : [summary];
            parashaHtml = `
                <div class="modal-reading-narrative">
                    ${paragraphs.map(p => `
                        <p>${formatHebrewInText(p)}</p>
                    `).join('')}
                </div>
            `;
        }
        const safeTitle = cardTitle.replace(/"/g, '&quot;');
        const safeHtml = parashaHtml.replace(/"/g, '&quot;');
        bodyHtml += `
            <div class="settings-card event-card glass-panel info-trigger candle-lighting-card" 
                 tabindex="0" role="button" aria-label="${safeTitle}"
                 data-info-title="${safeTitle}"
                 data-info-html="${safeHtml}">
                <div class="settings-card-left">
                    <i class="fa-solid fa-fire-flame-curved settings-icon candle-icon"></i>
                    <div class="settings-card-text">
                        <span class="settings-card-title">${cardTitle}</span>
                        <span class="settings-card-desc">Descanso Sagrado</span>
                    </div>
                </div>
                <div class="card-arrow-action" aria-hidden="true">
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            </div>
        `;
    }

    // Festas e Eventos Especiais deste dia (exclui Yom Shabbat e Parashá já destacados no card de Shabat acima)
    const nonShabbatEvents = dayEvents.filter(e => e.name !== 'Yom Shabbat' && e.category !== 'parashat' && !/^(?:Parashat|Parashá|Parashah|Parasha)\b/i.test(e.name));
    if (nonShabbatEvents.length > 0) {
        bodyHtml += `
            <div class="festival-section-header">
                <h3 class="festival-section-title">Celebrações</h3>
            </div>
        `;

        nonShabbatEvents.forEach(evt => {
            const isBiblical = evt.isBiblical;
            const iconClass = getFestivalIcon(evt.name, isBiblical);
            const tagLabel = isBiblical ? 'Mandamento Bíblico' : (evt.category === 'fast' ? 'Jejum Solene' : 'Tradição Sagrada');
            const twoWordTitle = formatCardTwoWords(evt.name);

            const descData = getFestivalDescription(evt.name) || FESTIVAL_DESCRIPTIONS[evt.name] || 'Data comemorativa e solene no calendário de Israel.';
            const detailHtml = createDescriptionCardHTML(descData, '');
            const safeEvtTitle = twoWordTitle.replace(/"/g, '&quot;');
            const safeEvtHtml = detailHtml.replace(/"/g, '&quot;');

            bodyHtml += `
                <div class="settings-card event-card glass-panel info-trigger"
                     tabindex="0" role="button" aria-label="${safeEvtTitle}"
                     data-info-title="${safeEvtTitle}"
                     data-info-html="${safeEvtHtml}">
                    <div class="settings-card-left">
                        <i class="${iconClass} settings-icon"></i>
                        <div class="settings-card-text">
                            <span class="settings-card-title">${twoWordTitle}</span>
                            <span class="settings-card-desc">${tagLabel}</span>
                        </div>
                    </div>
                    <div class="card-arrow-action" aria-hidden="true">
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            `;
        });
    } else if (dateObj.getDay() !== 6) {
        bodyHtml += `
            <div class="settings-card glass-panel calendar-empty-card">
                <span class="calendar-empty-text">
                    Dia comum de trabalho e contagem regular no ciclo litúrgico bíblico.
                </span>
            </div>
        `;
    }

    bodyHtml += `</div>`;

    if (bodyEl) bodyEl.innerHTML = bodyHtml;

    openModalElement(modal, 'detalhes-dia', options);

    // Botão de fechar modal
    const closeBtn = document.getElementById('close-day-details-btn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            closeModalSafely(modal);
        };
    }
}
