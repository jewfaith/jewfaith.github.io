import { state } from '../state.js';

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
    // Se faltar menos de 3 minutos (ou já estiver no período do festival): exibe "Em Curso"
    if (diffMs < 3 * 60 * 1000) {
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

    // Se faltar menos de 70 horas, mas pelo menos 1h32m (92 minutos): exibe horas (h)
    // Nas horas, arredonda para cima a partir de 31 minutos (xh31m = x + 1)
    if (totalMinutes >= 92) {
        const baseHours = Math.floor(totalMinutes / 60);
        const remMinutes = totalMinutes % 60;
        const displayHours = remMinutes >= 31 ? baseHours + 1 : baseHours;

        if (displayHours >= 2) {
            return `Faltam ${pad(displayHours)}h`;
        }
        return `Falta 01h`;
    }

    // Se faltar menos de 1h32m (e a partir de 3 minutos): exibe minutos (m) e não hora
    return `Faltam ${pad(totalMinutes)}m`;
}

export function startTimers() {
    stopTimers();

    function update() {
        if (document.hidden) return;

        const now = Date.now();
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
                : (startTimestamp + (24 * 60 * 60 * 1000));

            // Transição para "Em Curso" a partir de menos de 3 minutos antes do início
            const startTime = startTimestamp - (3 * 60 * 1000);
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
                const wrapper = card?.parentElement;
                if (wrapper && typeof wrapper.remove === 'function') {
                    wrapper.remove();
                } else if (card && typeof card.remove === 'function') {
                    card.remove();
                }

                anyExpired = true;
            } else {
                timer.classList.remove('ongoing');
                timer.style.color = '';

                newText = formatTimeRemaining(diffToStart, startTimestamp);

                if (diffToStart <= 5 * 60 * 1000) {
                    nextUpdateForThisTimer = Math.max(500, diffToStart - (3 * 60 * 1000));
                } else {
                    let ms = diffToStart % 60000;
                    nextUpdateForThisTimer = ms > 0 ? ms : 60000;
                }
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

// Sincroniza e força a atualização assim que a aba voltar a ficar visível
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            startTimers();
        }
    });
}