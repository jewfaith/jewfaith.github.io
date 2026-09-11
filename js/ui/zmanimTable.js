import { state } from '../state.js';
import { closeModalSafely } from './modals.js';
import { ICONS } from './icons.js';
import { getSelectedLocation, JERUSALEM_COORDS } from '../services/locationService.js';
import { getPersistentSetting } from '../utils/persistence.js';

export function openZmanimModal() {
    const modal = document.getElementById('zmanim-modal');
    if (!modal) return;

    const titleEl = document.getElementById('zmanim-modal-title');
    const cardTitle = document.getElementById('solar-hero-city-title')?.textContent?.trim() || "Sha'ah Zmanit";
    if (titleEl) {
        titleEl.textContent = cardTitle;
    }

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
    const activeLoc = state.userLocation || getSelectedLocation() || JERUSALEM_COORDS;
    const locName = activeLoc.name || document.getElementById('card-local')?.textContent || 'Jerusalém, Israel';

    const candleMin = getPersistentSetting('yisrael_shabbat_offset', '18');
    const havdalahMin = getPersistentSetting('yisrael_havdalah_opinion', '8.5');

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

    const now = new Date();
    const dayOfWeek = now.getDay();
    const isFriday = dayOfWeek === 5;
    const isSaturday = dayOfWeek === 6;

    let isErevYomTov = false;
    if (state.unifiedEvents && state.unifiedEvents.length) {
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        isErevYomTov = state.unifiedEvents.some(e => {
            if (!e || !e.raw) return false;
            const isYt = e.raw.yomtov === true || (e.isBiblical && ['pesach', 'matzot', 'shavuot', 'yomteruah', 'roshhashana', 'yomkippur', 'sukkot', 'sheminiatzeret'].includes(e.category));
            if (!isYt) return false;
            const evDate = e.raw.date ? e.raw.date.split('T')[0] : '';
            return evDate === todayStr || Math.abs(e.time - now.getTime()) < 24 * 60 * 60 * 1000;
        });
    }
    const showCandles = isFriday || isErevYomTov;
    const candleDesc = isFriday ? 'Velas Shabat' : 'Velas Festivas';

    // Função de garantia estrita: subtítulos sempre com exatamente duas palavras
    const formatTwoWords = (str) => {
        if (!str) return '';
        const parts = str.trim().split(/\s+/);
        if (parts.length <= 2) return str.trim();
        return `${parts[0]} ${parts[1]}`;
    };

    // ═══════════════════════════════════════════════════════
    // TABELA COMPLETA DE ZMANIM HALÁCHICOS (SUBTÍTULOS COM 2 PALAVRAS)
    // ═══════════════════════════════════════════════════════

    const sections = [];

    // ── SECÇÃO 1: AMANHECER ──
    sections.push({
        items: [
            { label: 'Chatzot Layla', desc: 'Meia Noite', time: fmt(z.chatzotNight), icon: ICONS.moon },
            { label: 'Alot Shachar', desc: 'Primeira Luz', time: fmt(z.alotHaShachar), icon: ICONS.cloudSun },
            { label: 'Alot HaTanya', desc: 'Alot Tanya', time: fmt(z.alosBaalHatanya), icon: ICONS.cloudSun },
            { label: 'Tempo Misheyakir', desc: 'Talit Tefilin', time: fmt(z.misheyakir), icon: ICONS.handsPraying },
            { label: 'Misheyakir Machmir', desc: 'Misheyakir Estrito', time: fmt(z.misheyakirMachmir), icon: ICONS.handsPraying },
            { label: 'Hanetz Civil', desc: 'Alvorecer Civil', time: fmt(z.dawn), icon: ICONS.sunrise },
            { label: 'Netz Chamah', desc: 'Nascer Solar', time: fmt(z.sunrise), icon: ICONS.sun, highlight: true }
        ]
    });

    // ── SECÇÃO 2: MANHÃ HALÁCHICA ──
    sections.push({
        items: [
            { label: 'Shemá MGA', desc: 'Shemá MGA', time: fmt(z.sofZmanShmaMGA), icon: ICONS.clock },
            { label: 'Shemá HaTanya', desc: 'Shemá Tanya', time: fmt(z.sofZmanShmaBaalHatanya), icon: ICONS.clock },
            { label: 'Shemá GRA', desc: 'Shemá GRA', time: fmt(z.sofZmanShma), icon: ICONS.clock, highlight: true },
            { label: 'Tefilah MGA', desc: 'Tefilah MGA', time: fmt(z.sofZmanTfillaMGA), icon: ICONS.hourglass },
            { label: 'Tefilah HaTanya', desc: 'Tefilah Tanya', time: fmt(z.sofZmanTfilaBaalHatanya), icon: ICONS.hourglass },
            { label: 'Sof Tefilah', desc: 'Tefilah GRA', time: fmt(z.sofZmanTfilla), icon: ICONS.hourglass, highlight: true }
        ]
    });

    // ── SECÇÃO 3: MEIO-DIA & TARDE ──
    sections.push({
        items: [
            { label: 'Chatzot Yom', desc: 'Meio Dia', time: fmt(z.chatzot), icon: ICONS.compass, highlight: true },
            { label: 'Mincha Gedolah', desc: 'Primeira Minchá', time: fmt(z.minchaGedola), icon: ICONS.bell },
            { label: 'Gedolah HaTanya', desc: 'Gedolah Tanya', time: fmt(z.minchaGedolaBaalHatanya), icon: ICONS.bell },
            { label: 'Mincha Ketanah', desc: 'Segunda Minchá', time: fmt(z.minchaKetana), icon: ICONS.cloudSun },
            { label: 'Ketanah HaTanya', desc: 'Ketanah Tanya', time: fmt(z.minchaKetanaBaalHatanya), icon: ICONS.cloudSun },
            { label: 'Plag Mincha', desc: 'Plag Minchá', time: fmt(z.plagHaMincha), icon: ICONS.cloudMoon },
            { label: 'Plag HaTanya', desc: 'Plag Tanya', time: fmt(z.plagHaminchaBaalHatanya), icon: ICONS.cloudMoon }
        ]
    });

    // ── SECÇÃO 4: SHABAT / YOM TOV (condicional) ──
    if (showCandles || isSaturday) {
        const shabYtItems = [];
        if (showCandles) {
            shabYtItems.push({ label: 'Hadlakat Nerot', desc: candleDesc, time: fmt(candleTimeVal), icon: ICONS.candles, highlight: true });
        }
        if (isSaturday) {
            shabYtItems.push({ label: 'Havdalá Shabat', desc: 'Saída Shabat', time: fmt(havdalahTimeVal), icon: ICONS.star, highlight: true });
        }
        sections.push({
            title: isFriday ? 'Erev Shabat' : (isSaturday ? 'Shabat' : 'Yom Tov'),
            items: shabYtItems
        });
    }

    // ── SECÇÃO 5: CREPÚSCULO & NOITE ──
    sections.push({
        items: [
            { label: 'Shkiah Solar', desc: 'Sol Poente', time: fmt(z.sunset), icon: ICONS.cloudMoon, highlight: true },
            { label: 'Bein Hashmashot', desc: 'Entre Sóis', time: fmt(z.beinHaShmashos), icon: ICONS.cloudMoon },
            { label: 'Tzeit HaTanya', desc: 'Estrelas Tanya', time: fmt(z.tzaisBaalHatanya), icon: ICONS.star },
            { label: 'Tzeit Kochavim', desc: 'Três Estrelas', time: fmt(z.tzeit7083deg), icon: ICONS.star },
            { label: 'Tzeit 8.5°', desc: 'Estrelas Rigorosas', time: fmt(z.tzeit85deg), icon: ICONS.star, highlight: !isSaturday },
            { label: 'Tzeit 42', desc: 'Tzeit 42min', time: fmt(z.tzeit42min), icon: ICONS.moon },
            { label: 'Tzeit 50', desc: 'Tzeit 50min', time: fmt(z.tzeit50min), icon: ICONS.moon },
            { label: 'Rabbeinu Tam', desc: 'Tzeit 72min', time: fmt(z.tzeit72min), icon: ICONS.moon }
        ]
    });

    // Filtra itens sem horário disponível (--:--) para variantes que nem sempre existem
    const filteredSections = sections.map(sec => ({
        ...sec,
        items: sec.items.filter(item => item.time !== '--:--')
    })).filter(sec => sec.items.length > 0);

    let shaaDayMin = '--';
    let shaaNightMin = '--';
    if (z.sunrise && z.sunset) {
        const srMs = new Date(z.sunrise).getTime();
        const ssMs = new Date(z.sunset).getTime();
        if (!isNaN(srMs) && !isNaN(ssMs)) {
            const dayDur = Math.max(1, ssMs - srMs);
            const nightDur = Math.max(1, (24 * 60 * 60 * 1000) - dayDur);
            shaaDayMin = `${Math.round((dayDur / 12) / (60 * 1000))} min`;
            shaaNightMin = `${Math.round((nightDur / 12) / (60 * 1000))} min`;
        }
    }

    body.innerHTML = `
        <div class="zmanim-grid-list">
            ${filteredSections.map((sec) => `${sec.items.map(item => `
                    <div class="zmanim-row-item ${item.highlight ? 'highlight-zman' : ''}">
                        <div class="zmanim-left">
                            <div class="zmanim-icon-box">
                                <i class="${item.icon}"></i>
                            </div>
                            <div class="zmanim-labels">
                                <span class="zmanim-name">${item.label}</span>
                                <span class="zmanim-desc">${formatTwoWords(item.desc)}</span>
                            </div>
                        </div>
                        <div class="zmanim-time-value">${item.time}</div>
                    </div>
                `).join('')}
            `).join('')}
        </div>
    `;
}

