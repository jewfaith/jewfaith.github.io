import { state } from '../state.js';

export function stopTimers() {
    if (state.timerInterval) {
        clearTimeout(state.timerInterval);
        state.timerInterval = null;
    }
}

export function startTimers() {
    if (state.timerInterval) clearTimeout(state.timerInterval);

    const timers = Array.from(document.querySelectorAll('.timer-countdown'));

    function update() {
        if (document.hidden) {
            state.timerInterval = setTimeout(update, 1000); 
            return;
        }

        const now = new Date().getTime();
        let anyExpired = false;
        let minNextUpdate = 60 * 60 * 1000; 

        timers.forEach(timer => {
            if (timer.getAttribute('data-copied') === 'true') {
                minNextUpdate = Math.min(minNextUpdate, 1200);
                return;
            }
            const startTimestamp = parseInt(timer.getAttribute('data-time'));
            if (isNaN(startTimestamp)) {
                if (timer.textContent !== 'Em Breve') {
                    timer.textContent = 'Em Breve';
                }
                return;
            }
            const startTime = startTimestamp - 122000;
            const endTimestamp = startTimestamp + (24 * 60 * 60 * 1000) + 65000;

            const diffToStart = startTimestamp - now;
            let nextUpdateForThisTimer = minNextUpdate;
            let newText = timer.textContent;
            let newClass = timer.className;

            if (now >= startTime && now <= endTimestamp) {
                newText = 'Em Curso';
                if (!newClass.includes('ongoing')) newClass += ' ongoing';
                nextUpdateForThisTimer = endTimestamp - now + 1;
            } else if (now > endTimestamp) {
                const card = timer.closest('.event-card');
                const wrapper = card ? card.parentElement : null;
                if (wrapper) wrapper.remove(); else if (card) card.remove();
                anyExpired = true;
            } else {
                const threshold = 90 * 24 * 60 * 60 * 1000;
                if (diffToStart > threshold) {
                    const evtDate = new Date(startTimestamp);
                    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                    newText = `Em ${months[evtDate.getMonth()]}`;
                    nextUpdateForThisTimer = diffToStart - threshold;
                } else {
                    const totalHours = diffToStart / (1000 * 60 * 60);
                    if (totalHours > 95) {
                        const days = Math.floor(diffToStart / (1000 * 60 * 60 * 24));
                        newText = `Faltam ${String(days).padStart(2, '0')}d`;
                        let ms = diffToStart % 86400000;
                        if (ms === 0) ms = 86400000;
                        nextUpdateForThisTimer = Math.min(ms, diffToStart - 95 * 3600000);
                    } else if (totalHours < 1.5) {
                        const totalMins = Math.floor(diffToStart / (1000 * 60));
                        newText = `Faltam ${String(totalMins).padStart(2, '0')}m`;
                        let ms = diffToStart % 60000;
                        if (ms === 0) ms = 60000;
                        nextUpdateForThisTimer = Math.min(ms, diffToStart - 122000);
                    } else {
                        const h = Math.round(diffToStart / (1000 * 60 * 60));
                        newText = `Faltam ${String(h).padStart(2, '0')}h`;
                        let ms = diffToStart % 3600000;
                        let timeToNextHalfHour = (ms + 1800000) % 3600000;
                        if (timeToNextHalfHour === 0) timeToNextHalfHour = 3600000;
                        nextUpdateForThisTimer = Math.min(timeToNextHalfHour, diffToStart - 1.5 * 3600000);
                    }
                }
                timer.style.color = '';
                newClass = newClass.replace(' ongoing', '').replace('ongoing', '').trim();
            }

            if (timer.textContent !== newText) {
                timer.textContent = newText;
            }
            if (timer.className !== newClass) {
                timer.className = newClass;
            }

            if (nextUpdateForThisTimer > 0 && nextUpdateForThisTimer < minNextUpdate) {
                minNextUpdate = nextUpdateForThisTimer;
            }
        });

        const grid = document.getElementById('upcoming-events-grid');
        if (anyExpired && grid && grid.children.length === 0) {
            grid.innerHTML = `<div id="upcoming-events-grid" class="event-cards-row upcoming-events-grid">
    <div><div class="event-card event-item glass-panel"><div class="icon-circle"><i class="fa-solid fa-clock"></i></div><div class="card-content"><h2 class="card-title">-</h2><span class="timer-countdown" data-time="">Em Breve</span></div></div></div>
    <div><div class="event-card event-item glass-panel"><div class="icon-circle"><i class="fa-solid fa-clock"></i></div><div class="card-content"><h2 class="card-title">-</h2><span class="timer-countdown" data-time="">Em Breve</span></div></div></div>
    <div><div class="event-card event-item glass-panel"><div class="icon-circle"><i class="fa-solid fa-clock"></i></div><div class="card-content"><h2 class="card-title">-</h2><span class="timer-countdown" data-time="">Em Breve</span></div></div></div>
    <div><div class="event-card event-item glass-panel"><div class="icon-circle"><i class="fa-solid fa-clock"></i></div><div class="card-content"><h2 class="card-title">-</h2><span class="timer-countdown" data-time="">Em Breve</span></div></div></div>
</div>`;
        } 
        state.timerInterval = setTimeout(update, Math.max(10, minNextUpdate + 5));
    }

    update();
}
