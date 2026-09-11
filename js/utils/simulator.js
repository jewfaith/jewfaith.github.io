/**
 * SIMULATOR.JS - SIMULADOR LITÚRGICO INTEGRAL PARA O CONSOLE
 * 
 * Transforma todo o aplicativo (dashboard, leituras bíblicas, parashá,
 * data hebraica, calendário mensal, repouso sagrado e zmanim) para funcionar
 * exatamente como ocorreria na data e solenidade real.
 */

import { state } from '../state.js';
import { updateUIBlocks, renderEvents, renderSupportCards } from '../ui/dashboard.js';
import { renderFestivalsView } from '../ui/festivalsView.js';
import { updateSolarPosition } from '../ui/solarArc.js';
import { normalizeHebcalEvents } from '../domain/eventMapper.js';
import { hebcalFetch } from '../api/hebcal.js';

let originalBackup = null;

function backupRealState() {
    if (!originalBackup) {
        originalBackup = {
            unifiedEvents: state.unifiedEvents ? [...state.unifiedEvents] : [],
            currentHdate: state.currentHdate ? { ...state.currentHdate } : null,
            currentSunsetTime: state.currentSunsetTime,
            currentZmanim: state.currentZmanim ? { ...state.currentZmanim } : null,
            simulatedGregorianDate: state.simulatedGregorianDate || null
        };
    }
}

function normalizeFestName(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

/**
 * Constrói a lista realista de eventos do mês sagrado para povoar
 * o calendário mensal, a lista de próximas festas e o repouso.
 */
function buildMonthEvents(simCategory, dayIndex, now, hYear = 5787) {
    const dayMs = 24 * 60 * 60 * 1000;
    const events = [];

    const createEvt = (name, cat, offsetDays, isBiblical, isYomTov, hDay, hMonth, extra = {}) => {
        const time = now + (offsetDays * dayMs) - 3600 * 1000;
        return {
            name,
            category: cat,
            time,
            endTime: time + dayMs,
            isBiblical,
            isTraditional: !isBiblical,
            raw: {
                title: name,
                category: 'holiday',
                yomtov: isYomTov,
                hdate: `${hDay} ${hMonth} ${hYear}`,
                date: new Date(time).toISOString().split('T')[0],
                ...extra
            }
        };
    };

    if (simCategory === 'yomteruah') {
        const dOffset = dayIndex === 0 ? 0 : -1;
        // 1 Tishrei: Yom Teruah & Rosh Chodesh & Rosh Hashana
        events.push(createEvt('Yom Teruah', 'yomteruah', dOffset, true, true, 1, 'Tishrei'));
        events.push(createEvt('Rosh Hashana', 'roshhashana', dOffset, false, true, 1, 'Tishrei'));
        events.push(createEvt('Rosh Chodesh', 'roshchodesh', dOffset, true, false, 1, 'Tishrei'));
        // 2 Tishrei: 2º dia
        events.push(createEvt('Yom Teruah', 'yomteruah', dOffset + 1, true, true, 2, 'Tishrei'));
        events.push(createEvt('Rosh Hashana', 'roshhashana', dOffset + 1, false, true, 2, 'Tishrei'));
        // 3 Tishrei: Tzom Gedaliah
        events.push(createEvt('Tzom Gedaliah', 'fast', dOffset + 2, false, false, 3, 'Tishrei'));
        // 10 Tishrei: Yom Kippur
        events.push(createEvt('Yom Kippur', 'yomkippur', dOffset + 9, true, true, 10, 'Tishrei'));
        // 15 Tishrei: Sukkot
        events.push(createEvt('Chag Sukkot', 'sukkot', dOffset + 14, true, true, 15, 'Tishrei'));
        // 22 Tishrei: Shemini Atzeret
        events.push(createEvt('Shemini Atzeret', 'sheminiatzeret', dOffset + 21, true, true, 22, 'Tishrei'));
    } else if (simCategory === 'pesach' || simCategory === 'matzot') {
        // Mês de Nisan
        events.push(createEvt('Rosh Chodashim', 'roshchodesh', -14, true, false, 1, 'Nisan'));
        events.push(createEvt('Yom Pessach', 'pesach', 0, true, true, 15, 'Nisan'));
        events.push(createEvt('Chag Matzot', 'matzot', 1, true, false, 16, 'Nisan'));
        events.push(createEvt('Chag Matzot', 'matzot', 6, true, true, 21, 'Nisan'));
        events.push(createEvt('Yom Shavuot', 'shavuot', 50, true, true, 6, 'Sivan'));
    } else if (simCategory === 'shavuot') {
        // Mês de Sivan
        events.push(createEvt('Rosh Chodesh', 'roshchodesh', -5, true, false, 1, 'Sivan'));
        events.push(createEvt('Yom Shavuot', 'shavuot', 0, true, true, 6, 'Sivan'));
        events.push(createEvt('Tzom Tammuz', 'fast', 41, false, false, 17, 'Tammuz'));
        events.push(createEvt('Tisha B\'Av', 'fast', 62, false, false, 9, 'Av'));
    } else if (simCategory === 'yomkippur') {
        // 10 Tishrei
        events.push(createEvt('Yom Teruah', 'yomteruah', -9, true, true, 1, 'Tishrei'));
        events.push(createEvt('Yom Kippur', 'yomkippur', 0, true, true, 10, 'Tishrei'));
        events.push(createEvt('Chag Sukkot', 'sukkot', 5, true, true, 15, 'Tishrei'));
        events.push(createEvt('Shemini Atzeret', 'sheminiatzeret', 12, true, true, 22, 'Tishrei'));
    } else if (simCategory === 'sukkot') {
        events.push(createEvt('Yom Kippur', 'yomkippur', -5, true, true, 10, 'Tishrei'));
        events.push(createEvt('Chag Sukkot', 'sukkot', 0, true, true, 15, 'Tishrei'));
        events.push(createEvt('Shemini Atzeret', 'sheminiatzeret', 7, true, true, 22, 'Tishrei'));
        events.push(createEvt('Chag Chanukah', 'chanukah', 70, false, false, 25, 'Kislev'));
    } else if (simCategory === 'sheminiatzeret') {
        events.push(createEvt('Chag Sukkot', 'sukkot', -7, true, true, 15, 'Tishrei'));
        events.push(createEvt('Shemini Atzeret', 'sheminiatzeret', 0, true, true, 22, 'Tishrei'));
        events.push(createEvt('Chag Chanukah', 'chanukah', 63, false, false, 25, 'Kislev'));
    }

    return events;
}

/**
 * Ativa a simulação completa de qualquer festa bíblica ou Shabat
 */
export function simulateFestival(nameOrDisable, opt = 1) {
    if (nameOrDisable === false || nameOrDisable === 'reset' || nameOrDisable === 'off') {
        return resetSimulation();
    }

    if (!nameOrDisable) {
        simulationHelp();
        return;
    }

    backupRealState();

    const normalized = normalizeFestName(String(nameOrDisable));
    const day = typeof opt === 'number' ? opt : (opt?.day || 1);
    const dayIndex = Math.max(0, day - 1);
    const now = Date.now();

    let simCategory = '';
    let simName = '';
    let simHdate = { hd: 1, hm: 'Tishrei', hy: 5787 };
    let simGregorian = '2026-09-12T12:00:00';
    let isYomTov = true;
    let isShabbat = false;

    if (normalized.includes('teruah') || normalized.includes('roshhashana') || normalized.includes('trombetas')) {
        simCategory = 'yomteruah';
        simName = 'Yom Teruah';
        simHdate = { hd: dayIndex === 0 ? 1 : 2, hm: 'Tishrei', hy: 5787 };
        simGregorian = dayIndex === 0 ? '2026-09-12T12:00:00' : '2026-09-13T12:00:00';
    } else if (normalized.includes('pesach') || normalized.includes('pessach') || normalized.includes('pascoa')) {
        simCategory = 'pesach';
        simName = 'Yom Pessach';
        simHdate = { hd: 15, hm: 'Nisan', hy: 5787 };
        simGregorian = '2027-04-22T12:00:00';
    } else if (normalized.includes('matzot') || normalized.includes('asmos')) {
        simCategory = 'matzot';
        simName = 'Chag Matzot';
        simHdate = { hd: dayIndex === 0 ? 15 : 21, hm: 'Nisan', hy: 5787 };
        simGregorian = '2027-04-28T12:00:00';
    } else if (normalized.includes('shavuot') || normalized.includes('pentecostes')) {
        simCategory = 'shavuot';
        simName = 'Yom Shavuot';
        simHdate = { hd: 6, hm: 'Sivan', hy: 5787 };
        simGregorian = '2027-06-11T12:00:00';
    } else if (normalized.includes('kippur') || normalized.includes('expiacao')) {
        simCategory = 'yomkippur';
        simName = 'Yom Kippur';
        simHdate = { hd: 10, hm: 'Tishrei', hy: 5787 };
        simGregorian = '2026-09-21T12:00:00';
    } else if (normalized.includes('sukkot') || normalized.includes('sucot') || normalized.includes('tabernaculos')) {
        simCategory = 'sukkot';
        simName = 'Chag Sukkot';
        simHdate = { hd: 15, hm: 'Tishrei', hy: 5787 };
        simGregorian = '2026-09-26T12:00:00';
    } else if (normalized.includes('shemini') || normalized.includes('atzeret')) {
        simCategory = 'sheminiatzeret';
        simName = 'Shemini Atzeret';
        simHdate = { hd: 22, hm: 'Tishrei', hy: 5787 };
        simGregorian = '2026-10-03T12:00:00';
    } else if (normalized.includes('cholhamoed') || normalized.includes('moed')) {
        simCategory = 'sukkot';
        simName = 'Chol HaMoed';
        simHdate = { hd: 17, hm: 'Tishrei', hy: 5787 };
        simGregorian = '2026-09-28T12:00:00';
        isYomTov = false;
    } else if (normalized.includes('shabbat') || normalized.includes('sabado')) {
        simCategory = 'parashat';
        simName = 'Yom Shabbat';
        simHdate = { hd: 26, hm: 'Elul', hy: 5786 };
        simGregorian = '2026-09-05T12:00:00';
        isShabbat = true;
        isYomTov = false;
    } else {
        console.warn(`[Simulador] Ocasião não identificada: "${nameOrDisable}". Consulte as opções em simulationHelp()`);
        simulationHelp();
        return;
    }

    let simEvents = [];
    if (isShabbat) {
        simEvents = [
            {
                name: 'Yom Shabbat',
                category: 'parashat',
                time: now - 3600 * 1000,
                endTime: now + 24 * 3600 * 1000,
                isBiblical: true,
                isTraditional: false,
                raw: {
                    title: 'Parashat Ha\'azinu',
                    category: 'parashat',
                    yomtov: false,
                    hdate: '26 Elul 5786',
                    date: '2026-09-05',
                    leyning: {
                        torah: 'Deuteronomy 32:1-52',
                        haftarah: 'II Samuel 22:1-51'
                    }
                }
            }
        ];
    } else {
        simEvents = buildMonthEvents(simCategory, dayIndex, now, simHdate.hy);
    }

    // Configura o pôr do sol simulado
    const simulatedSunset = now + (6 * 3600 * 1000);
    const simulatedSunrise = now - (6 * 3600 * 1000);

    const simulatedZmanim = {
        alotHaShachar: new Date(simulatedSunrise - 72 * 60 * 1000).toISOString(),
        misheyakir: new Date(simulatedSunrise - 45 * 60 * 1000).toISOString(),
        sunrise: new Date(simulatedSunrise).toISOString(),
        sofZmanShma: new Date(simulatedSunrise + 3 * 60 * 60 * 1000).toISOString(),
        sofZmanTfilla: new Date(simulatedSunrise + 4 * 60 * 60 * 1000).toISOString(),
        chatzot: new Date((simulatedSunrise + simulatedSunset) / 2).toISOString(),
        minchaGedola: new Date(simulatedSunrise + 6.5 * 60 * 60 * 1000).toISOString(),
        sunset: new Date(simulatedSunset).toISOString(),
        tzeit7083deg: new Date(simulatedSunset + 45 * 60 * 1000).toISOString(),
        tzeit85deg: new Date(simulatedSunset + 50 * 60 * 1000).toISOString(),
        candleLighting: new Date(simulatedSunset - 18 * 60 * 1000).toISOString(),
        candles: new Date(simulatedSunset - 18 * 60 * 1000).toISOString()
    };

    state.isSimulation = true;
    state.simulatedGregorianDate = simGregorian;
    state.unifiedEvents = simEvents;
    state.currentHdate = simHdate;
    state.currentSunsetTime = simulatedSunset;
    state.currentZmanim = simulatedZmanim;

    const locName = state.locationName || 'Jerusalém, Israel';
    const isIsrael = state.userLocation?.isIsrael ?? true;

    // Atualiza absolutamente todas as secções da aplicação
    updateUIBlocks(simEvents, simHdate, locName, simulatedSunset, isIsrael);
    renderEvents();
    renderFestivalsView(true);
    updateSolarPosition();
    renderSupportCards();

    // Sumário no console com dados reais aplicados
    const greetingEl = document.getElementById('dashboard-greeting')?.textContent?.trim();
    const gregorianEl = document.getElementById('dashboard-gregorian-date')?.textContent?.trim();
    const parashaEl = document.getElementById('card-parasha')?.textContent?.trim();
    const parashaSub = document.getElementById('card-parasha-subtitle')?.textContent?.trim();
    const torahEl = document.getElementById('card-torah')?.textContent?.trim();
    const haftaraEl = document.getElementById('card-haftara')?.textContent?.trim();
    const ketuvimEl = document.getElementById('card-ketuvim')?.textContent?.trim();
    const hdateEl = document.getElementById('card-hdate')?.textContent?.trim();

    console.group(`%c🌟 [Simulação Completa Ativa] ${simName} (Dia ${day})`, 'color: #10b981; font-weight: bold; font-size: 14px;');
    console.table({
        'Saudação Litúrgica': greetingEl,
        'Data Gregoriana': gregorianEl,
        'Data Hebraica': `${hdateEl} ${simHdate.hy}`,
        'Cartão Parashá (Título)': parashaEl,
        'Cartão Parashá (Subtítulo)': parashaSub,
        'Torá (Lei Escrita)': torahEl,
        'Haftará (Profetas)': haftaraEl,
        'Ketuvim (Escrito)': ketuvimEl,
        'Repouso Sagrado / Doações': isYomTov ? 'Pausado (Yom Tov Ativo)' : (isShabbat ? 'Pausado (Shabat Ativo)' : 'Normal')
    });
    console.log('%c💡 Todos os cartões e modais agora refletem exatamente este dia. Clique nos cartões para abrir as leituras da festa!', 'color: #3b82f6;');
    console.log('%cPara voltar ao dia real, execute:%c resetSimulation()', 'color: #64748b;', 'color: #2563eb; font-weight: bold;');
    console.groupEnd();
}

/**
 * Simula qualquer data arbitrária (ex: "2026-09-12" ou "2027-04-22")
 */
export async function simulateDate(isoDateStr) {
    if (!isoDateStr) {
        console.warn('[Simulador] Informe a data no formato AAAA-MM-DD (ex: simulateDate("2026-09-12"))');
        return;
    }

    backupRealState();

    const parts = isoDateStr.trim().split('-');
    if (parts.length !== 3) {
        console.error('[Simulador] Formato de data inválido. Use AAAA-MM-DD.');
        return;
    }

    const [year, month, day] = parts.map(p => parseInt(p, 10));
    const loc = state.userLocation || { lat: 31.7683, lon: 35.2137, tz: 'Asia/Jerusalem', isIsrael: true };

    console.log(`%c[Simulador] A calcular liturgia completa para ${isoDateStr}...`, 'color: #3b82f6;');

    try {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const zmanimUrl = `https://www.hebcal.com/zmanim?cfg=json&latitude=${loc.lat}&longitude=${loc.lon}&date=${dateStr}&tzid=${loc.tz}`;
        const hebcalUrl = `https://www.hebcal.com/hebcal?v=1&cfg=json&geo=pos&latitude=${loc.lat}&longitude=${loc.lon}&start=${year}-01-01&end=${year + 1}-12-31&maj=on&min=on&mod=on&nx=on&mf=on&ss=off&s=on&i=${loc.isIsrael ? 'on' : 'off'}&c=off&o=on`;
        const converterUrl = `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1&strict=1`;

        const [zmanimData, hebcalData, hdateData] = await Promise.all([
            hebcalFetch(zmanimUrl).catch(() => null),
            hebcalFetch(hebcalUrl).catch(() => null),
            hebcalFetch(converterUrl).catch(() => null)
        ]);

        let sunsetTime = 0;
        if (zmanimData?.times?.sunset) {
            sunsetTime = new Date(zmanimData.times.sunset).getTime();
        }

        const events = hebcalData?.items ? normalizeHebcalEvents(hebcalData.items, sunsetTime) : [];

        state.isSimulation = true;
        state.simulatedGregorianDate = `${dateStr}T12:00:00`;
        state.unifiedEvents = events;
        state.currentHdate = hdateData;
        state.currentSunsetTime = sunsetTime;
        state.currentZmanim = zmanimData?.times || null;

        updateUIBlocks(events, hdateData, state.locationName, sunsetTime, loc.isIsrael);
        renderEvents();
        renderFestivalsView(true);
        updateSolarPosition();
        renderSupportCards();

        console.log(`%c✅ [Data Simulada: ${dateStr}] Dashboard atualizado com dados astronómicos e litúrgicos reais desse dia!`, 'color: #10b981; font-weight: bold;');
    } catch (err) {
        console.error('[Simulador] Erro ao sincronizar data:', err);
    }
}

/**
 * Restaura o estado e tempo reais
 */
export function resetSimulation() {
    if (!state.isSimulation && !originalBackup) {
        console.log('%c[Simulador] Nenhuma simulação ativa.', 'color: #64748b;');
        return;
    }

    state.isSimulation = false;
    state.simulatedGregorianDate = null;

    if (originalBackup) {
        state.unifiedEvents = originalBackup.unifiedEvents;
        state.currentHdate = originalBackup.currentHdate;
        state.currentSunsetTime = originalBackup.currentSunsetTime;
        state.currentZmanim = originalBackup.currentZmanim;
    }

    const locName = state.locationName || 'Jerusalém, Israel';
    const isIsrael = state.userLocation?.isIsrael ?? true;
    const sunsetTime = state.currentSunsetTime || 0;

    updateUIBlocks(state.unifiedEvents, state.currentHdate, locName, sunsetTime, isIsrael);
    renderEvents();
    renderFestivalsView(true);
    updateSolarPosition();
    renderSupportCards();

    originalBackup = null;

    console.log(
        '%c✅ [Simulação Desativada]%c Todo o site foi restaurado para a data, relógio e leituras reais.',
        'color: #10b981; font-weight: bold;',
        'color: inherit;'
    );
}

/**
 * Guia de comandos completo no console
 */
export function simulationHelp() {
    console.group('%c📖 Guia do Simulador Litúrgico Integral (Console)', 'color: #3b82f6; font-weight: bold; font-size: 14px;');
    console.log('%cComandos Rápidos:', 'color: #f59e0b; font-weight: bold;');
    console.log('  • simulate("teruah")        → Simula Yom Teruah (Kriat HaMoed, Bereshit 21, I Shmuel 1, Tehilim 24)');
    console.log('  • simulate("teruah", 2)     → Simula 2º Dia de Yom Teruah (Bereshit 22, Yirmiyahu 31, Tehilim 27)');
    console.log('  • simulate("pesach")        → Simula Yom Pessach (Shemot 12, Yehoshua 5, Tehilim 114)');
    console.log('  • simulate("shavuot")       → Simula Yom Shavuot (Shemot 19-20, Yechezkel 1, Tehilim 19)');
    console.log('  • simulate("yomkippur")     → Simula Yom Kippur (Vayikra 16, Yeshayahu 57, Gmar Chatimah Tovah)');
    console.log('  • simulate("sukkot")        → Simula Chag Sukkot (Vayikra 22-23, Zecharia 14, Tehilim 118)');
    console.log('  • simulate("sheminiatzeret") → Simula Shemini Atzeret (Devarim 14-16, I Melachim 8)');
    console.log('  • simulate("cholhamoed")    → Simula Chol HaMoed ("Leitura Especial")');
    console.log('  • simulate("shabbat")       → Simula Shabat Comum ("Ciclo Anual", Shabbat Shalom)');
    console.log('  • simulateDate("2026-09-12")→ Simula qualquer data AAAA-MM-DD específica');
    console.log('\n%cRestaurar dados reais:%c resetSimulation() ou simulate(false)', 'color: #10b981; font-weight: bold;', 'color: inherit;');
    console.groupEnd();
}

/**
 * Inicialização e ligação global ao window
 */
export function initSimulator() {
    if (typeof window === 'undefined') return;

    window.simulate = (target, opt) => {
        if (typeof target === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(target.trim())) {
            return simulateDate(target.trim());
        }
        return simulateFestival(target, opt);
    };
    window.simulateFestival = simulateFestival;
    window.simulateDate = simulateDate;
    window.resetSimulation = resetSimulation;
    window.simulationHelp = simulationHelp;

    console.log(
        '%c[Yisrael Date] Simulador Litúrgico Integral Pronto 🚀%c Digite %csimulate("teruah")%c no console para transformar todo o site!',
        'color: #2563eb; font-weight: bold;',
        'color: inherit;',
        'background: #2563eb; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-family: monospace;',
        'color: inherit;'
    );
}

if (typeof window !== 'undefined') {
    initSimulator();
}
