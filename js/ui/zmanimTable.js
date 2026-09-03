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
        { label: 'Alot HaShachar', desc: 'Alvorada (Primeira luz)', time: fmt(z.alotHaShachar), icon: ICONS.cloudSun },
        { label: 'Misheyakir', desc: 'Talit e Tefilin', time: fmt(z.misheyakir || z.misheyakirMachmir), icon: ICONS.handsPraying },
        { label: 'Netz HaChamah', desc: 'Nascer do Sol', time: fmt(z.sunrise), icon: ICONS.sun, highlight: true },
        { label: 'Sof Zman Shema (GRA)', desc: 'Hora limite do Shemá', time: fmt(z.sofZmanShma), icon: ICONS.clock },
        { label: 'Sof Zman Tefilah', desc: 'Hora limite da oração matinal', time: fmt(z.sofZmanTfilla), icon: ICONS.hourglass },
        { label: 'Chatzot HaYom', desc: 'Meio-dia Solar astronômico', time: fmt(z.chatzot), icon: ICONS.compass },
        { label: 'Mincha Gedolah', desc: 'Início da oração de Minchá', time: fmt(z.minchaGedola), icon: ICONS.bell },
        { label: 'Mincha Ketanah', desc: 'Horário ideal da tarde', time: fmt(z.minchaKetana), icon: ICONS.cloudSun },
        { label: 'Plag HaMincha', desc: 'Fim da tarde (Plag)', time: fmt(z.plagHaMincha), icon: ICONS.cloudMoon },
        { label: 'Hadlakat Nerot', desc: `Acendimento de Velas (${candleMin} min)`, time: fmt(candleTimeVal), icon: ICONS.candles, highlight: true },
        { label: 'Shkiah', desc: 'Pôr do Sol astronômico', time: fmt(z.sunset), icon: ICONS.cloudMoon, highlight: true },
        { label: 'Tzeit HaKochavim', desc: 'Saída das Estrelas (Havdalá)', time: fmt(havdalahTimeVal), icon: ICONS.star, highlight: true },
        { label: 'Chatzot HaLayla', desc: 'Meia-noite haláchica', time: fmt(z.chatzotNight), icon: ICONS.moon }
    ];

    body.innerHTML = `
        <div class="zmanim-summary-hero glass-panel">
            <div class="zmanim-hero-location"><i class="${ICONS.location}" data-icon="location"></i> ${locName}</div>
            <div class="zmanim-hero-date">${hdate}</div>
        </div>
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
