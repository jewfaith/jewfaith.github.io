import { state } from '../state.js';
import { closeModalSafely } from './modals.js';
import { ICONS } from './icons.js';

export function openZmanimModal() {
    const modal = document.getElementById('zmanim-modal');
    if (!modal) return;

    renderZmanimTable();
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    if (!history.state || !history.state.zmanimOpen) {
        history.pushState({ zmanimOpen: true }, '');
    }
}

export function closeZmanimModal() {
    const modal = document.getElementById('zmanim-modal');
    if (modal) closeModalSafely(modal);
}

export function initZmanimModal() {
    const closeBtn = document.getElementById('close-zmanim-modal-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeZmanimModal);

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.zmanim-trigger-btn, #card-zmanim-festivals');
        if (trigger) {
            e.preventDefault();
            openZmanimModal();
        }
    });
}

function fmt(isoStr) {
    if (!isoStr) return '--:--';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '--:--';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function renderZmanimTable() {
    const body = document.getElementById('zmanim-modal-body');
    if (!body) return;

    const z = state.currentZmanim || {};
    const locName = document.getElementById('card-local')?.textContent || 'Jerusalém';
    const hdate = document.getElementById('card-hdate')?.textContent || 'Hoje';

    const candleMin = localStorage.getItem('yisrael_shabbat_offset') || '18';
    const havdalahMin = localStorage.getItem('yisrael_havdalah_opinion') || '8.5';

    let candleTimeVal = z.candleLighting || z.candles;
    if (z.sunset) {
        const sunsetMs = new Date(z.sunset).getTime();
        candleTimeVal = new Date(sunsetMs - (parseInt(candleMin, 10) * 60 * 1000));
    }

    let havdalahTimeVal = z.tzeit85deg || z.tzeit7083deg || z.havdalah;
    if (z.sunset) {
        const sunsetMs = new Date(z.sunset).getTime();
        if (havdalahMin === '0') havdalahTimeVal = z.sunset;
        else if (havdalahMin === '8.5') havdalahTimeVal = z.tzeit85deg || (sunsetMs + 42 * 60 * 1000);
        else if (havdalahMin === '50') havdalahTimeVal = sunsetMs + (50 * 60 * 1000);
        else if (havdalahMin === '72') havdalahTimeVal = z.tzeit72min || (sunsetMs + 72 * 60 * 1000);
    }

    const zmanimList = [
        { label: 'Alot Shachar', desc: 'Primeira Luz', time: fmt(z.alotHaShachar), icon: ICONS.cloudSun },
        { label: 'Tempo Misheyakir', desc: 'Talit Tefilin', time: fmt(z.misheyakir || z.misheyakirMachmir), icon: ICONS.handsPraying },
        { label: 'Netz Chamah', desc: 'Nascer Sol', time: fmt(z.sunrise), icon: ICONS.sun, highlight: true },
        { label: 'Shemá GRA', desc: 'Limite Shemá', time: fmt(z.sofZmanShma), icon: ICONS.clock },
        { label: 'Sof Tefilah', desc: 'Limite Tefilá', time: fmt(z.sofZmanTfilla), icon: ICONS.hourglass },
        { label: 'Chatzot Yom', desc: 'Meio-dia Solar', time: fmt(z.chatzot), icon: ICONS.compass },
        { label: 'Mincha Gedolah', desc: 'Primeira Minchá', time: fmt(z.minchaGedola), icon: ICONS.bell },
        { label: 'Mincha Ketanah', desc: 'Segunda Minchá', time: fmt(z.minchaKetana), icon: ICONS.cloudSun },
        { label: 'Plag Mincha', desc: 'Tarde Plag', time: fmt(z.plagHaMincha), icon: ICONS.cloudMoon },
        { label: 'Hadlakat Nerot', desc: 'Velas Shabat', time: fmt(candleTimeVal), icon: ICONS.candles, highlight: true },
        { label: 'Shkiah Solar', desc: 'Sol Poente', time: fmt(z.sunset), icon: ICONS.cloudMoon, highlight: true },
        { label: 'Tzeit Kochavim', desc: 'Saída Estrelas', time: fmt(havdalahTimeVal), icon: ICONS.star, highlight: true },
        { label: 'Chatzot Layla', desc: 'Meia Noite', time: fmt(z.chatzotNight), icon: ICONS.moon }
    ];

    body.innerHTML = `
        <div class="zmanim-grid-list">
            ${zmanimList.map(item => `
                <div class="zmanim-row-item ${item.highlight ? 'highlight-zman' : ''}">
                    <div class="zmanim-left">
                        <div class="zmanim-icon-box">
                            <i class="${item.icon}"></i>
                        </div>
                        <div class="zmanim-labels">
                            <span class="zmanim-name">${item.label}</span>
                            <span class="zmanim-desc">${item.desc}</span>
                        </div>
                    </div>
                    <div class="zmanim-time-value">${item.time}</div>
                </div>
            `).join('')}
        </div>
    `;
}
