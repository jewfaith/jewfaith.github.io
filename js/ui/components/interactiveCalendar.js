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
import { HEBREW_MONTHS_PT, FESTIVAL_DESCRIPTIONS } from '../../domain/constants.js';
import { trackHeartEvent, trackTaskSuccess } from '../../services/telemetryService.js';
import { ICONS, getEventIcon } from '../icons.js';
import { formatHebrewInText } from '../../domain/formatters.js';
import { getFestivalIcon } from '../festivalsView.js';

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
 * Estima ou interpola a data hebraica para um determinado dia do mês
 */
function estimateHebrewDateForDay(targetDate, eventsIndex) {
    const dateKey = formatDateKey(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayEvents = eventsIndex.get(dateKey) || [];

    // 1. Se houver evento com data hebraica explícita
    const withHdate = dayEvents.find(e => e.raw && e.raw.hdate);
    if (withHdate) {
        return formatHebrewDateString(withHdate.raw.hdate);
    }

    // 2. Procura evento mais próximo no mapa para calcular offset
    const targetMs = targetDate.getTime();
    let closestEvent = null;
    let minDiff = Infinity;

    for (const [key, evList] of eventsIndex.entries()) {
        const evWithH = evList.find(e => e.raw && e.raw.hdate);
        if (evWithH) {
            const [y, m, d] = key.split('-').map(Number);
            const evDate = new Date(y, m - 1, d);
            const diffDays = Math.round((targetMs - evDate.getTime()) / (24 * 60 * 60 * 1000));
            if (Math.abs(diffDays) < Math.abs(minDiff)) {
                minDiff = diffDays;
                closestEvent = { ev: evWithH, diffDays };
            }
        }
    }

    if (closestEvent && closestEvent.ev.raw && closestEvent.ev.raw.hdate) {
        const parts = closestEvent.ev.raw.hdate.split(' ');
        if (parts.length >= 2) {
            const baseDay = parseInt(parts[0], 10);
            const rawMonthName = parts.slice(1, -1).join(' ') || parts[1];
            const monthName = HEBREW_MONTHS_PT[rawMonthName] || rawMonthName;
            const yearStr = parts[parts.length - 1];
            if (!isNaN(baseDay)) {
                let estimatedDay = baseDay + closestEvent.diffDays;
                if (estimatedDay >= 1 && estimatedDay <= 30) {
                    return `${estimatedDay} ${monthName} ${yearStr}`.trim();
                }
            }
        }
    }

    // 3. Fallback a partir do estado global
    if (state.currentHdate && state.currentHdate.hd && state.currentHdate.hm) {
        const now = new Date();
        const diffDays = Math.round((targetMs - now.getTime()) / (24 * 60 * 60 * 1000));
        let estDay = Number(state.currentHdate.hd) + diffDays;
        if (estDay >= 1 && estDay <= 30) {
            const mPt = HEBREW_MONTHS_PT[state.currentHdate.hm] || state.currentHdate.hm;
            return `${estDay} ${mPt} ${state.currentHdate.hy || 5786}`.trim();
        }
    }

    return '';
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

    // Determina o mês hebraico predominante a partir dos eventos do mês
    let predominantHebrewMonth = '';
    let hebrewYearStr = '';

    for (let day = 1; day <= daysInMonth; day++) {
        const key = formatDateKey(displayedYear, displayedMonth, day);
        const evList = eventsIndex.get(key) || [];
        const evWithH = evList.find(e => e.raw && e.raw.hdate);
        if (evWithH) {
            const parts = evWithH.raw.hdate.split(' ');
            if (parts.length >= 2) {
                const rawM = parts.slice(1, -1).join(' ') || parts[1];
                predominantHebrewMonth = HEBREW_MONTHS_PT[rawM] || rawM;
                hebrewYearStr = parts[parts.length - 1];
                break;
            }
        }
    }

    if (!predominantHebrewMonth && state.currentHdate?.hm) {
        predominantHebrewMonth = HEBREW_MONTHS_PT[state.currentHdate.hm] || state.currentHdate.hm;
        hebrewYearStr = state.currentHdate.hy || '';
    }

    const titleGregorian = `${GREGORIAN_MONTHS_FULL[displayedMonth]} ${displayedYear}`;
    const titleHebrew = predominantHebrewMonth ? `${predominantHebrewMonth} ${hebrewYearStr}`.trim() : '';

    let html = `
        <div class="interactive-calendar-card glass-panel" role="region" aria-label="Calendário Mensal">
            <!-- Barra Superior do Calendário -->
            <div class="calendar-header-toolbar">
                <div class="calendar-title-wrap">
                    <h2 class="calendar-month-title">${titleGregorian}</h2>
                    ${titleHebrew ? `<span class="calendar-hebrew-subtitle">${titleHebrew}</span>` : ''}
                </div>
                <div class="calendar-nav-actions" role="toolbar" aria-label="Navegação do Calendário">
                    <button id="cal-btn-prev" class="calendar-nav-btn" aria-label="Mês Anterior" title="Mês Anterior">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <button id="cal-btn-today" class="calendar-nav-btn calendar-today-btn" aria-label="Ir para Hoje" title="Ir para o dia de Hoje">
                        <i class="fa-solid fa-calendar-day"></i>
                        <span>Hoje</span>
                    </button>
                    <button id="cal-btn-next" class="calendar-nav-btn" aria-label="Mês Seguinte" title="Mês Seguinte">
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
    const hasParasha = dayEvents.some(e => e.category === 'parashat' || (e.name && e.name.startsWith('Parashat')));

    const hdateString = estimateHebrewDateForDay(dateObj, eventsIndex);
    const hdateShort = hdateString ? hdateString.split(' ').slice(0, 2).join(' ') : '';

    let classes = ['calendar-day-cell'];
    if (isOtherMonth) classes.push('is-other-month');
    if (isToday) classes.push('is-today');
    if (isShabbat) classes.push('is-shabbat');
    if (hasBiblical) classes.push('has-biblical');
    if (hasTraditional) classes.push('has-traditional');
    if (hasRoshChodesh) classes.push('has-rosh-chodesh');
    if (selectedDateStr === dateKey) classes.push('is-selected');

    // Identifica títulos para tooltip/aria-label
    const eventTitles = dayEvents.map(e => e.name).filter(Boolean);
    const labelTitle = [
        `${dayNum} de ${GREGORIAN_MONTHS_FULL[dateObj.getMonth()]}`,
        hdateString ? `(${hdateString})` : '',
        eventTitles.join(', ')
    ].filter(Boolean).join(' • ');

    return `
        <div class="${classes.join(' ')}" 
             data-date="${dateKey}" 
             data-hdate="${hdateString}" 
             tabindex="0" 
             role="gridcell" 
             aria-label="${labelTitle}"
             title="${labelTitle}">
            <div class="day-cell-top">
                <span class="day-gregorian-num">${dayNum}</span>
                ${hdateShort ? `<span class="day-hebrew-num">${hdateShort}</span>` : ''}
            </div>
            <div class="day-indicators-container">
                ${isToday ? `<span class="cal-badge badge-today" title="Hoje"><i class="fa-solid fa-circle"></i></span>` : ''}
                ${isShabbat ? `<span class="cal-badge badge-shabbat" title="Shabat"><i class="fa-solid fa-candle-holder"></i></span>` : ''}
                ${hasBiblical ? `<span class="cal-badge badge-biblical" title="Festa Bíblica"><i class="fa-solid fa-scroll"></i></span>` : ''}
                ${hasTraditional ? `<span class="cal-badge badge-traditional" title="Tradição de Israel"><i class="fa-solid fa-star-of-david"></i></span>` : ''}
                ${hasRoshChodesh ? `<span class="cal-badge badge-rosh-chodesh" title="Rosh Chodesh"><i class="fa-solid fa-moon"></i></span>` : ''}
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

    // Delegação de clique e teclado nas células dos dias
    const grid = document.querySelector('.calendar-days-grid');
    if (grid) {
        grid.addEventListener('click', (e) => {
            const cell = e.target.closest('.calendar-day-cell');
            if (cell) {
                handleDayClick(cell);
            }
        });

        grid.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const cell = e.target.closest('.calendar-day-cell');
                if (cell) {
                    e.preventDefault();
                    handleDayClick(cell);
                }
            }
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
export function openDayDetailsModal(dateKey, hdateStr) {
    const modal = document.getElementById('day-details-modal');
    if (!modal) return;

    const formattedHdate = formatHebrewDateString(hdateStr);

    const [y, m, d] = dateKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    const titleEl = document.getElementById('day-details-title');
    const subtitleEl = document.getElementById('day-details-subtitle');
    const bodyEl = document.getElementById('day-details-body');

    const dNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const formattedGregorian = `${dNames[dateObj.getDay()]}, ${d} de ${GREGORIAN_MONTHS_FULL[dateObj.getMonth()]} de ${y}`;

    if (titleEl) titleEl.textContent = formattedGregorian;
    if (subtitleEl) subtitleEl.textContent = formattedHdate || 'Data Hebraica Sagrada';

    const eventsIndex = buildDateEventsIndex(state.unifiedEvents || []);
    const dayEvents = eventsIndex.get(dateKey) || [];

    let bodyHtml = `
        <div class="day-details-container" style="display: flex; flex-direction: column; gap: 14px;">
            <!-- Badge de Data Hebraica -->
            <div class="settings-card event-card glass-panel" style="margin-bottom: 0;">
                <div class="settings-card-left">
                    <i class="fa-solid fa-calendar-check settings-icon" style="color: var(--accent-color);"></i>
                    <div class="settings-card-text">
                        <span class="settings-card-title">${formattedHdate || 'Calendário da Torá'}</span>
                        <span class="settings-card-desc">${formattedGregorian}</span>
                    </div>
                </div>
            </div>
    `;

    // Se for Sábado (Yom Shabbat)
    if (dateObj.getDay() === 6) {
        const parashaEv = dayEvents.find(e => e.category === 'parashat' || (e.name && /^(?:Parashat|Parashá|Parashah|Parasha)\b/i.test(e.name)));
        const parashaName = parashaEv ? parashaEv.name.replace(/^(?:Parashat|Parashá|Parashah|Parasha)\s+/i, '').trim() : 'Yom Shabbat';
        bodyHtml += `
            <div class="settings-card event-card glass-panel" style="border-left: 3px solid #E5A93C;">
                <div class="settings-card-left">
                    <i class="fa-solid fa-candle-holder settings-icon" style="color: #E5A93C;"></i>
                    <div class="settings-card-text">
                        <span class="settings-card-title">${parashaName === 'Yom Shabbat' ? 'Yom Shabbat' : `Shabbat ${parashaName}`}</span>
                        <span class="settings-card-desc">Sétimo Dia Sagrado • Santa Convocação</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Festas e Eventos Especiais deste dia (exclui Yom Shabbat e Parashá já destacados no card de Shabat acima)
    const nonShabbatEvents = dayEvents.filter(e => e.name !== 'Yom Shabbat' && e.category !== 'parashat' && !/^(?:Parashat|Parashá|Parashah|Parasha)\b/i.test(e.name));
    if (nonShabbatEvents.length > 0) {
        bodyHtml += `
            <div class="festival-section-header" style="margin-top: 14px; margin-bottom: 6px;">
                <h3 class="festival-section-title">Celebrações e Comemorações</h3>
            </div>
        `;

        nonShabbatEvents.forEach(evt => {
            const isBiblical = evt.isBiblical;
            const iconClass = getFestivalIcon(evt.name, isBiblical);
            const tagLabel = isBiblical ? 'Mandamento da Torá' : (evt.category === 'fast' ? 'Jejum Comemorativo' : 'Tradição de Israel');

            const descData = FESTIVAL_DESCRIPTIONS[evt.name] || 'Data comemorativa e solene no calendário de Israel.';
            const descText = typeof descData === 'string' ? descData : (Array.isArray(descData) ? descData[0] : (descData.info || 'Mandamento perpétuo da Torá.'));

            bodyHtml += `
                <div class="settings-card event-card glass-panel" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                        <i class="${iconClass} settings-icon" style="color: var(--accent-color);"></i>
                        <div class="settings-card-text" style="flex: 1;">
                            <span class="settings-card-title">${evt.name}</span>
                            <span class="settings-card-desc" style="color: var(--accent-color);">${tagLabel}</span>
                        </div>
                    </div>
                    <p style="font-size: var(--font-size-sm); line-height: 1.5; color: var(--text-secondary); margin: 4px 0 0 0;">
                        ${formatHebrewInText(descText)}
                    </p>
                </div>
            `;
        });
    } else if (dateObj.getDay() !== 6) {
        bodyHtml += `
            <div class="settings-card glass-panel" style="padding: 14px 16px;">
                <span style="font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.6;">
                    Dia comum de trabalho e contagem regular no ciclo litúrgico bíblico.
                </span>
            </div>
        `;
    }

    bodyHtml += `</div>`;

    if (bodyEl) bodyEl.innerHTML = bodyHtml;

    modal.style.display = 'flex';
    modal.classList.remove('is-closing');
    document.body.classList.add('modal-open');

    // Botão de fechar modal
    const closeBtn = document.getElementById('close-day-details-btn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        };
    }
}
