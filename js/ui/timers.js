import { state } from '../state.js';

export function stopTimers() {
    if (state.timerInterval) {
        clearTimeout(state.timerInterval);
        state.timerInterval = null;
    }
}

export function startTimers() {
    stopTimers();

    function update() {
        // Se a página estiver oculta, não executa o loop agressivo; 
        // a sincronização será refeita via listener 'visibilitychange'
        if (document.hidden) return;

        const now = Date.now();
        let anyExpired = false;
        let minNextUpdate = 60 * 60 * 1000; // Máximo 1h de espera por padrão

        // Recaptura do DOM para incluir novos elementos dinâmicos
        const timers = document.querySelectorAll('.timer-countdown');

        timers.forEach(timer => {
            if (timer.getAttribute('data-copied') === 'true') {
                minNextUpdate = Math.min(minNextUpdate, 1200);
                return;
            }

            const startTimestamp = Number(timer.getAttribute('data-time'));

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
            const isOngoing = now >= startTime && now <= endTimestamp;

            if (isOngoing) {
                newText = 'Em Curso';
                timer.classList.add('ongoing');
                nextUpdateForThisTimer = Math.max(100, endTimestamp - now + 100);
            } else if (now > endTimestamp) {
                const card = timer.closest('.event-card');
                const wrapper = card?.parentElement;
                if (wrapper) wrapper.remove();
                else card?.remove();

                anyExpired = true;
            } else {
                timer.classList.remove('ongoing');
                timer.style.color = '';

                const threshold = 90 * 24 * 60 * 60 * 1000; // 90 dias

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
                        nextUpdateForThisTimer = ms > 0 ? ms : 86400000;
                    } else if (totalHours < 1.5) {
                        const totalMins = Math.floor(diffToStart / (1000 * 60));
                        newText = `Faltam ${String(totalMins).padStart(2, '0')}m`;
                        let ms = diffToStart % 60000;
                        nextUpdateForThisTimer = ms > 0 ? ms : 60000;
                    } else {
                        const h = Math.round(diffToStart / (1000 * 60 * 60));
                        newText = `Faltam ${String(h).padStart(2, '0')}h`;
                        let ms = diffToStart % 3600000;
                        nextUpdateForThisTimer = ms > 0 ? ms : 3600000;
                    }
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
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        startTimers();
    }
});