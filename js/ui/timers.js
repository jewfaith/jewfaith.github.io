import { state } from '../state.js';
import { renderSupportCards } from './components/supportCard.js';
import { FESTIVAL_DURATION_MS, FESTIVAL_ANTICIPATION_MS } from '../domain/halacha.js';

export function stopTimers() {
    if (state.timerInterval) {
        clearTimeout(state.timerInterval);
        state.timerInterval = null;
    }
}

export const GREGORIAN_MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function formatTimeRemaining(diffMs, startTimestamp = null) {
    // 2 minutos e 50 segundos restantes ou menos: coloca como "Em Curso"
    if (diffMs <= FESTIVAL_ANTICIPATION_MS) {
        return 'Em Curso';
    }

    const pad = n => String(n).padStart(2, '0');

    // Se faltar mais de 90 dias (+90 dias): exibe "Em [Mês Gregoriano]"
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    if (diffMs > ninetyDaysMs) {
        if (startTimestamp) {
            const dateObj = new Date(startTimestamp);
            if (!isNaN(dateObj.getTime())) {
                return `Em ${GREGORIAN_MONTHS_PT[dateObj.getMonth()]}`;
            }
        }
        const targetDate = new Date(Date.now() + diffMs);
        return `Em ${GREGORIAN_MONTHS_PT[targetDate.getMonth()]}`;
    }

    // Se faltar 70 horas ou mais (e até 90 dias): exibe dias (d)
    if (diffMs >= 70 * 60 * 60 * 1000) {
        const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
        return `Faltam ${pad(days)}d`;
    }

    const totalMinutes = Math.floor(diffMs / (60 * 1000));

    // Se faltar pelo menos 1h32m (92 minutos): exibe horas (h) com arredondamento a partir de 31m (sempre >= 2h)
    if (totalMinutes >= 92) {
        const baseHours = Math.floor(totalMinutes / 60);
        const remMinutes = totalMinutes % 60;
        const displayHours = remMinutes >= 31 ? baseHours + 1 : baseHours;
        return `Faltam ${pad(displayHours)}h`;
    }

    // Menos de 1h32m (e acima de 2m 50s): exibe em minutos (m) e nunca "Falta 01h"
    return `Faltam ${pad(totalMinutes)}m`;
}

let lastRestCheck = 0;

export function startTimers() {
    stopTimers();

    function update() {
        if (document.hidden) return;

        const now = Date.now();
        if (now - lastRestCheck > 30000) {
            lastRestCheck = now;
            renderSupportCards();
        }
        let anyExpired = false;
        let minNextUpdate = 60 * 60 * 1000;

        const timers = document.querySelectorAll('.timer-countdown');

        timers.forEach(timer => {
            if (timer.getAttribute('data-copied') === 'true') {
                minNextUpdate = Math.min(minNextUpdate, 1200);
                return;
            }

            const startTimestamp = Number(timer.getAttribute('data-time'));

            if (isNaN(startTimestamp) || startTimestamp <= 0) {
                const monthAttr = timer.getAttribute('data-month');
                const fallbackText = monthAttr ? `Em ${monthAttr}` : `Em ${GREGORIAN_MONTHS_PT[new Date().getMonth()]}`;
                if (timer.textContent !== fallbackText) {
                    timer.textContent = fallbackText;
                }
                return;
            }

            const endAttr = Number(timer.getAttribute('data-end'));
            const endTimestamp = (!isNaN(endAttr) && endAttr > 0)
                ? endAttr
                : (startTimestamp + FESTIVAL_DURATION_MS);

            // Transição para "Em Curso" a partir de 2 minutos e 50 segundos restantes
            const startTime = startTimestamp - FESTIVAL_ANTICIPATION_MS;
            const diffToStart = startTimestamp - now;

            let nextUpdateForThisTimer = minNextUpdate;
            let newText = timer.textContent;
            const isOngoing = now >= startTime && now <= endTimestamp;

            if (isOngoing) {
                newText = 'Em Curso';
                timer.classList.add('ongoing');
                nextUpdateForThisTimer = Math.max(500, endTimestamp - now + 500);
            } else if (now > endTimestamp) {
                const card = timer.closest('.event-card');
                if (card && typeof card.remove === 'function' && !card.dataset.isRemoving) {
                    card.dataset.isRemoving = 'true';
                    card.style.transition = 'opacity 0.22s ease, transform 0.22s ease, max-height 0.22s ease, margin 0.22s ease, padding 0.22s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.96)';
                    card.style.maxHeight = `${card.offsetHeight}px`;
                    void card.offsetHeight;
                    card.style.maxHeight = '0px';
                    card.style.marginTop = '0px';
                    card.style.marginBottom = '0px';
                    card.style.paddingTop = '0px';
                    card.style.paddingBottom = '0px';
                    card.style.overflow = 'hidden';
                    setTimeout(() => {
                        try { card.remove(); } catch (e) { }
                    }, 230);
                }

                anyExpired = true;
            } else {
                timer.classList.remove('ongoing');

                newText = formatTimeRemaining(diffToStart, startTimestamp);

                // Agenda a transição para "Em Curso" no momento exato em que faltarem 2 minutos e 50 segundos
                const timeToOngoing = diffToStart - FESTIVAL_ANTICIPATION_MS;
                const msToNextMinute = diffToStart % 60000;
                const regularStep = msToNextMinute > 0 ? msToNextMinute : 60000;
                nextUpdateForThisTimer = Math.min(regularStep, timeToOngoing > 0 ? timeToOngoing : regularStep);
            }

            if (timer.textContent !== newText) {
                timer.textContent = newText;
            }

            if (nextUpdateForThisTimer > 0 && nextUpdateForThisTimer < minNextUpdate) {
                minNextUpdate = nextUpdateForThisTimer;
            }
        });

        const grid = document.getElementById('upcoming-events-grid');
        if (anyExpired && grid && grid.children.length === 0) {
            grid.innerHTML = '';
        }

        // agenda a próxima atualização garantindo um valor mínimo saudável (ex: 500ms)
        const safeDelay = Math.max(500, minNextUpdate);
        state.timerInterval = setTimeout(update, safeDelay);
    }

    update();
}

// Sincroniza e força a atualização assim que a aba voltar a ficar visível, e suspende quando oculta
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            startTimers();
            renderSupportCards();
        } else {
            stopTimers();
        }
    });
}