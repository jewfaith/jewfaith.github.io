/**
 * CONSOLECONTROL.JS - CENTRO DE CONTROLO LITÚRGICO & AJUDA VIA CONSOLE
 * 
 * Fornece interface interativa e controlada via console do navegador (DevTools):
 * - Catálogo de comandos seguros para navegação, diagnóstico e testes.
 * - Salvaguardas ativas: zero eval(), lista estrita de permissões (allowlist),
 *   sem injeção em DOM, validação estrita de argumentos e objetos imutáveis.
 * - Idioma: 100% Português (PT) com aliases transparentes para máxima ergonomia.
 */

import { state } from '../state.js';
import { switchTab } from '../ui/appNavigation.js';
import { setThemeMode, getCurrentThemeMode } from '../ui/themeSwitcher.js';
import { applyFestivalFilter } from '../ui/festivalsView.js';
import {
    getSelectedLocation,
    saveSelectedLocation,
    JERUSALEM_COORDS,
    POPULAR_1TOUCH_CITIES
} from './locationService.js';
import { checkSacredRestStatus } from '../domain/halacha.js';
import { simulateFestival, simulateDate, resetSimulation } from '../utils/simulator.js';
import { updateSolarPosition } from '../ui/solarArc.js';
import { HEBREW_MONTHS_PT } from '../domain/constants.js';

let updateDashboardCallback = null;

/**
 * Exibe o cabeçalho de inicialização limpo e profissional
 */
export function printWelcomeBanner() {
    console.log(
        '%c YISRAEL DATE %c v3.3.0 %c Festas Bíblicas %c\n' +
        '%cSimulador Litúrgico pronto:\n' +
        '%c • %cparty("kippur")%c     → Simula Yom Kippur\n' +
        '%c • %cparty("terua", 2)%c   → Simula 2º Dia de Yom Teruah\n' +
        '%c • %cparty("pesach")%c     → Simula Yom Pessach\n' +
        '%c • %cparty("sukkot")%c     → Simula Chag Sukkot\n' +
        '%c • %cparty("shavuot")%c    → Simula Yom Shavuot\n' +
        '%c • %cparty("shemini")%c    → Simula Shemini Atzeret\n' +
        '%c • %cparty("shabbat")%c    → Simula Yom Shabbat\n' +
        '%cPara restaurar ao tempo real: %cparty()',
        // Badges
        'background: #1e293b; color: #d4af37; font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 3px 0 0 3px; font-family: monospace;',
        'background: #0f172a; color: #94a3b8; font-weight: 500; font-size: 11px; padding: 2px 6px; border-left: 1px solid #334155; font-family: monospace;',
        'background: #0f172a; color: #10b981; font-weight: 600; font-size: 11px; padding: 2px 7px; border-radius: 0 3px 3px 0; border-left: 1px solid #334155; font-family: monospace;',
        '',
        // Subtítulo
        'color: #94a3b8; font-size: 11px; margin-top: 4px;',
        // Itens
        'color: #64748b;', 'color: #38bdf8; font-weight: 600; font-family: monospace;', 'color: #64748b;',
        'color: #64748b;', 'color: #38bdf8; font-weight: 600; font-family: monospace;', 'color: #64748b;',
        'color: #64748b;', 'color: #38bdf8; font-weight: 600; font-family: monospace;', 'color: #64748b;',
        'color: #64748b;', 'color: #38bdf8; font-weight: 600; font-family: monospace;', 'color: #64748b;',
        'color: #64748b;', 'color: #38bdf8; font-weight: 600; font-family: monospace;', 'color: #64748b;',
        'color: #64748b;', 'color: #38bdf8; font-weight: 600; font-family: monospace;', 'color: #64748b;',
        'color: #64748b;', 'color: #38bdf8; font-weight: 600; font-family: monospace;', 'color: #64748b;',
        // Footer restaurar
        'color: #94a3b8; font-size: 11px; font-weight: 500;',
        'color: #10b981; font-weight: 700; font-family: monospace;'
    );
}

/**
 * Exibe o catálogo estruturado de simulações de celebrações bíblicas
 */
export function printHelpMenu() {
    console.group(
        '%c YISRAEL DATE %c Festas Bíblicas para Simulação %c v3.3.0 ',
        'background: #1e293b; color: #d4af37; font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 3px 0 0 3px; font-family: monospace;',
        'background: #0f172a; color: #f1f5f9; font-weight: 600; font-size: 11px; padding: 2px 8px; border-left: 1px solid #334155;',
        'background: #0f172a; color: #10b981; font-weight: 600; font-size: 11px; padding: 2px 7px; border-radius: 0 3px 3px 0; border-left: 1px solid #334155; font-family: monospace;'
    );

    console.table([
        { 'Comando': 'party("kippur")', 'Celebração': 'Yom Kippur', 'Leituras': 'Vayikra 16, Yeshayahu 57' },
        { 'Comando': 'party("terua")', 'Celebração': 'Yom Teruah (1º Dia)', 'Leituras': 'Bereshit 21, I Shmuel 1, Tehilim 24' },
        { 'Comando': 'party("terua", 2)', 'Celebração': '2º Dia de Rosh Hashana', 'Leituras': 'Bereshit 22, Yirmiyahu 31, Tehilim 27' },
        { 'Comando': 'party("pesach")', 'Celebração': 'Yom Pessach', 'Leituras': 'Shemot 12, Yehoshua 5, Tehilim 114' },
        { 'Comando': 'party("sukkot")', 'Celebração': 'Chag Sukkot', 'Leituras': 'Vayikra 22-23, Zecharia 14, Tehilim 118' },
        { 'Comando': 'party("shavuot")', 'Celebração': 'Yom Shavuot', 'Leituras': 'Shemot 19-20, Yechezkel 1, Tehilim 19' },
        { 'Comando': 'party("shemini")', 'Celebração': 'Shemini Atzeret', 'Leituras': 'Devarim 14-16, I Melachim 8' },
        { 'Comando': 'party("cholhamoed")', 'Celebração': 'Chol HaMoed', 'Leituras': 'Leitura Intermediária Especial' },
        { 'Comando': 'party("shabbat")', 'Celebração': 'Yom Shabbat', 'Leituras': 'Ciclo Anual Regular (Ha\'azinu)' },
        { 'Comando': 'party()', 'Celebração': 'Restaurar Hoje', 'Leituras': 'Restaura todos os dados reais de hoje' }
    ]);

    console.log('%cPara retornar ao tempo real de hoje, execute:%c party()', 'color: #64748b; font-size: 11px;', 'color: #10b981; font-weight: bold; font-family: monospace;');
    console.groupEnd();
    return 'Guia de celebrações apresentado.';
}

/**
 * Tabela imutável de comandos permitidos (Strict Allowlist)
 */
const SAFE_COMMAND_REGISTRY = Object.freeze({
    'party': (arg, rawArgs) => party(arg, rawArgs && rawArgs.length > 1 ? (parseInt(rawArgs[1], 10) || rawArgs[1]) : 1),
    'festa': (arg, rawArgs) => party(arg, rawArgs && rawArgs.length > 1 ? (parseInt(rawArgs[1], 10) || rawArgs[1]) : 1),
    'festas': () => printHelpMenu(),

    'kippur': () => party('kippur'),
    'yomkippur': () => party('yomkippur'),
    'terua': (arg) => party('terua', arg ? parseInt(arg, 10) : 1),
    'teruah': (arg) => party('teruah', arg ? parseInt(arg, 10) : 1),
    'roshhashana': (arg) => party('roshhashana', arg ? parseInt(arg, 10) : 1),
    'pesach': () => party('pesach'),
    'pessach': () => party('pesach'),
    'sukkot': () => party('sukkot'),
    'sucot': () => party('sukkot'),
    'shavuot': () => party('shavuot'),
    'shemini': () => party('sheminiatzeret'),
    'sheminiatzeret': () => party('sheminiatzeret'),
    'cholhamoed': () => party('cholhamoed'),
    'shabbat': () => party('shabbat'),

    'restaurar': () => party(),
    'reset': () => party(),

    'ajuda': () => printHelpMenu(),
    'help': () => printHelpMenu(),
    '?': () => printHelpMenu(),

    'aba': (arg) => handleTabCommand(arg),
    'tab': (arg) => handleTabCommand(arg),
    'tema': (arg) => handleThemeCommand(arg),
    'theme': (arg) => handleThemeCommand(arg),
    'local': (arg) => handleLocationCommand(arg),
    'location': (arg) => handleLocationCommand(arg),
    'cidade': (arg) => handleLocationCommand(arg),
    'estado': () => handleStatusCommand(),
    'status': () => handleStatusCommand(),
    'descanso': () => handleShabbatCommand(),
    'simular': (arg, rawArgs) => party(arg, rawArgs && rawArgs.length > 1 ? (parseInt(rawArgs[1], 10) || rawArgs[1]) : 1),
    'simulate': (arg, rawArgs) => party(arg, rawArgs && rawArgs.length > 1 ? (parseInt(rawArgs[1], 10) || rawArgs[1]) : 1),
    'limpar': () => handleClearCacheCommand(),
    'limparcache': () => handleClearCacheCommand(),
    'resetcache': () => handleClearCacheCommand()
});

function handleTabCommand(arg) {
    const clean = String(arg || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (clean === 'hoje' || clean === 'today' || clean === 'dashboard' || clean === 'inicio') {
        switchTab('today', true, true, true);
        console.log('%c[Navegação] Aba alterada para: "Hoje" (Zmanim e Leituras)', 'color: #38bdf8; font-weight: 600;');
        return 'Aba Hoje ativa.';
    }
    if (clean === 'calendario' || clean === 'calendar' || clean === 'festas' || clean === 'festivals') {
        switchTab('calendar', true, true, true);
        console.log('%c[Navegação] Aba alterada para: "Calendário" (Mensal e Festas)', 'color: #38bdf8; font-weight: 600;');
        return 'Aba Calendário ativa.';
    }
    if (clean === 'mais' || clean === 'more' || clean === 'privacidade' || clean === 'privacy' || clean === 'termos' || clean === 'info') {
        switchTab('privacy', true, true, true);
        console.log('%c[Navegação] Aba alterada para: "Mais" (Privacidade e Termos)', 'color: #38bdf8; font-weight: 600;');
        return 'Aba Mais ativa.';
    }
    console.warn('Aba inválida. Opções disponíveis: "hoje", "calendario", "mais".');
    return 'Falha na navegação: aba não permitida.';
}

function handleThemeCommand(arg) {
    const clean = String(arg || '').toLowerCase().trim();
    if (clean === 'claro' || clean === 'dia' || clean === 'light' || clean === 'day') {
        setThemeMode('light');
        console.log('%c[Tema] Modo visual alterado para: Claro', 'color: #38bdf8; font-weight: 600;');
        return 'Modo Claro ativado.';
    }
    if (clean === 'escuro' || clean === 'noite' || clean === 'dark' || clean === 'night') {
        setThemeMode('dark');
        console.log('%c[Tema] Modo visual alterado para: Escuro', 'color: #38bdf8; font-weight: 600;');
        return 'Modo Escuro ativado.';
    }
    if (clean === 'auto' || clean === 'solar' || clean === 'automatico' || clean === 'tempo') {
        setThemeMode('auto');
        console.log('%c[Tema] Modo visual alterado para: Solar Automático', 'color: #38bdf8; font-weight: 600;');
        return 'Modo Solar Automático ativado.';
    }
    console.warn('Modo de tema inválido. Opções disponíveis: "claro", "escuro", "auto".');
    return 'Falha: tema não reconhecido.';
}

function handleFestivalsCommand(arg) {
    switchTab('calendar', true, true, true);

    const clean = String(arg || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (clean === 'biblicas' || clean === 'biblica' || clean === 'tora' || clean === 'tanakh') {
        applyFestivalFilter('biblical');
        console.log('%c[Festas] Filtro ativado: Bíblicas da Torá (9 celebrações)', 'color: #38bdf8; font-weight: 600;');
        return 'Filtro Bíblicas ativo.';
    }
    if (clean === 'rabinicas' || clean === 'rabinica' || clean === 'tradicao') {
        applyFestivalFilter('rabbinic');
        console.log('%c[Festas] Filtro ativado: Tradição Rabínica (16 celebrações)', 'color: #38bdf8; font-weight: 600;');
        return 'Filtro Rabínicas ativo.';
    }
    if (clean === 'mes' || clean === 'destemes' || clean === 'atual') {
        applyFestivalFilter('month');
        console.log('%c[Festas] Filtro ativado: Celebrações deste mês', 'color: #38bdf8; font-weight: 600;');
        return 'Filtro Deste Mês ativo.';
    }
    if (clean === 'todas' || clean === 'all' || clean === 'tudo') {
        applyFestivalFilter('all');
        console.log('%c[Festas] Filtro ativado: Todas as celebrações (25 celebrações)', 'color: #38bdf8; font-weight: 600;');
        return 'Filtro Todas ativo.';
    }

    console.warn('Categoria inválida. Opções disponíveis: "biblicas", "rabinicas", "mes", "todas".');
    return 'Falha: categoria não reconhecida.';
}

function handleLocationCommand(arg) {
    const query = String(arg || '').toLowerCase().trim();

    if (!query || query === 'status' || query === 'info' || query === 'atual' || query === 'estado') {
        const loc = getSelectedLocation() || state.userLocation || JERUSALEM_COORDS;
        console.group(
            '%c YISRAEL DATE %c Localidade Ativa %c ' + (loc.name || loc.fullName) + ' ',
            'background: #1e293b; color: #d4af37; font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 3px 0 0 3px; font-family: monospace;',
            'background: #0f172a; color: #f1f5f9; font-weight: 600; font-size: 11px; padding: 2px 8px; border-left: 1px solid #334155;',
            'background: #0f172a; color: #38bdf8; font-weight: 600; font-size: 11px; padding: 2px 7px; border-radius: 0 3px 3px 0; border-left: 1px solid #334155;'
        );
        console.table({
            'Nome': { 'Detalhe': loc.name || loc.fullName },
            'Coordenadas': { 'Detalhe': `${loc.lat}, ${loc.lon}` },
            'Fuso Horário': { 'Detalhe': loc.tz || 'UTC' },
            'Região': { 'Detalhe': loc.isIsrael ? 'Israel' : 'Diáspora' }
        });
        console.groupEnd();
        return loc;
    }

    if (query === 'cidades' || query === 'lista' || query === 'ajuda' || query === 'help') {
        console.group(
            '%c YISRAEL DATE %c Cidades Homologadas ',
            'background: #1e293b; color: #d4af37; font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 3px 0 0 3px; font-family: monospace;',
            'background: #0f172a; color: #f1f5f9; font-weight: 600; font-size: 11px; padding: 2px 8px; border-radius: 0 3px 3px 0; border-left: 1px solid #334155;'
        );
        const citiesList = [
            { 'Comando': 'local("jerusalem")', 'Cidade': 'Jerusalém, Israel', 'Fuso': 'Asia/Jerusalem (Israel)' }
        ];
        POPULAR_1TOUCH_CITIES.forEach(c => {
            citiesList.push({
                'Comando': `local("${c.primaryText.toLowerCase()}")`,
                'Cidade': c.fullName,
                'Fuso': c.tz
            });
        });
        console.table(citiesList);
        console.groupEnd();
        return 'Lista de cidades apresentada.';
    }

    if (query.includes('jerusal') || query.includes('israel')) {
        applyLocationSafely(JERUSALEM_COORDS);
        return 'Localidade definida para Jerusalém, Israel.';
    }

    const matched = POPULAR_1TOUCH_CITIES.find(c => {
        const p = c.primaryText.toLowerCase();
        const f = c.fullName.toLowerCase();
        return p.includes(query) || query.includes(p) || f.includes(query);
    });

    if (matched) {
        applyLocationSafely({
            lat: matched.lat,
            lon: matched.lon,
            name: matched.fullName,
            primaryText: matched.primaryText,
            secondaryText: matched.secondaryText,
            isIsrael: matched.isIsrael,
            tz: matched.tz
        });
        return `Localidade definida para ${matched.fullName}.`;
    }

    console.warn(`Localidade "${query}" não reconhecida. Digite local("cidades") para consultar a lista homologada.`);
    return 'Falha: localidade não permitida.';
}

function applyLocationSafely(locObj) {
    state.userLocation = locObj;
    state.locationName = locObj.name;
    state.userCityName = (locObj.primaryText || locObj.name.split(',')[0] || 'Jerusalém').trim();

    saveSelectedLocation(locObj);

    const allLocEls = document.querySelectorAll('#card-local, #desktop-card-local, .loc-name-display');
    allLocEls.forEach(el => {
        if (el) el.textContent = locObj.name;
    });

    try {
        updateSolarPosition();
    } catch (e) { }

    if (typeof updateDashboardCallback === 'function') {
        updateDashboardCallback();
    }

    console.log(`%c[Localização] Localidade ativa definida para: ${locObj.name}`, 'color: #38bdf8; font-weight: 600;');
}

function handleStatusCommand() {
    const loc = getSelectedLocation() || state.userLocation || JERUSALEM_COORDS;
    const now = new Date();
    const hdate = state.currentHdate;
    const hMonth = hdate?.hm ? (HEBREW_MONTHS_PT[hdate.hm] || hdate.hm) : 'Aviv';
    const hdateFormatted = hdate ? `${hdate.hd} de ${hMonth} de ${hdate.hy}` : (document.getElementById('card-hdate')?.textContent?.trim() || 'Calculada no ecrã');

    // Pôr do Sol formatado
    let sunsetStr = '';
    if (state.currentSunsetTime && state.currentSunsetTime > 0) {
        sunsetStr = new Date(state.currentSunsetTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    } else if (state.currentZmanim?.sunset) {
        sunsetStr = new Date(state.currentZmanim.sunset).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    }

    // Parashá da semana
    const parashaEl = document.getElementById('card-parasha')?.textContent?.trim();
    const parashaEvt = state.unifiedEvents?.find(e => e.category === 'parashat');
    const parashaName = parashaEl || parashaEvt?.name || 'Vezot HaBerachah';

    // Descanso sagrado
    const rest = checkSacredRestStatus(
        Date.now(),
        state.unifiedEvents || [],
        state.currentHdate,
        state.currentSunsetTime || 0,
        loc.isIsrael
    );
    const restStatus = rest.isRest ? `Em vigor (${rest.title || 'Shabat'})` : 'Dia comum de trabalho';

    const currentTheme = getCurrentThemeMode();
    const themeStr = currentTheme === 'light' ? 'Claro' : (currentTheme === 'dark' ? 'Escuro' : 'Solar Automático');
    const simStr = state.isSimulation ? `Simulação Ativa (${state.simulatedFestivalName || 'Data simulada'})` : 'Tempo Real';

    console.group(
        '%c YISRAEL DATE %c Diagnóstico do Sistema %c v3.2.7 ',
        'background: #1e293b; color: #d4af37; font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 3px 0 0 3px; font-family: monospace;',
        'background: #0f172a; color: #38bdf8; font-weight: 600; font-size: 11px; padding: 2px 8px; border-left: 1px solid #334155;',
        'background: #0f172a; color: #94a3b8; font-weight: 500; font-size: 11px; padding: 2px 7px; border-radius: 0 3px 3px 0; border-left: 1px solid #334155; font-family: monospace;'
    );

    const infoTable = {
        'Data Gregoriana': { 'Informação': now.toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
        'Data Bíblica (Torá)': { 'Informação': hdateFormatted },
        'Parashá da Semana': { 'Informação': parashaName },
        'Descanso Sagrado': { 'Informação': restStatus },
        'Localidade Ativa': { 'Informação': `${loc.name} (${loc.isIsrael ? 'Israel' : 'Diáspora'})` }
    };

    if (sunsetStr) {
        infoTable['Pôr do Sol Hoje'] = { 'Informação': sunsetStr };
    }

    infoTable['Tema Visual'] = { 'Informação': themeStr };
    infoTable['Modo do Sistema'] = { 'Informação': simStr };

    console.table(infoTable);
    console.groupEnd();

    return {
        dataGregoriana: now.toISOString(),
        dataHebraica: hdateFormatted,
        parasha: parashaName,
        descanso: restStatus,
        localidade: loc.name,
        porDoSol: sunsetStr || null,
        tema: themeStr,
        modo: simStr,
        simulacaoAtiva: state.isSimulation
    };
}

function handleShabbatCommand() {
    const loc = getSelectedLocation() || state.userLocation || JERUSALEM_COORDS;
    const rest = checkSacredRestStatus(
        Date.now(),
        state.unifiedEvents || [],
        state.currentHdate,
        state.currentSunsetTime || 0,
        loc.isIsrael
    );

    const statusText = rest.isRest ? 'Cessação de trabalho ativa' : 'Dia comum de trabalho';

    console.group(
        `%c YISRAEL DATE %c Descanso Sagrado %c ${statusText} `,
        'background: #1e293b; color: #d4af37; font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 3px 0 0 3px; font-family: monospace;',
        'background: #0f172a; color: #f1f5f9; font-weight: 600; font-size: 11px; padding: 2px 8px; border-left: 1px solid #334155;',
        `background: #0f172a; color: ${rest.isRest ? '#10b981' : '#94a3b8'}; font-weight: 600; font-size: 11px; padding: 2px 7px; border-radius: 0 3px 3px 0; border-left: 1px solid #334155;`
    );
    console.table({
        'Estado': { 'Detalhe': rest.isRest ? 'Cessação de trabalho ativa' : 'Dia comum de trabalho' },
        'Ocasião': { 'Detalhe': rest.title || 'Sem celebração restritiva ativa' },
        'Saudação': { 'Detalhe': rest.greeting || 'Shavua Tov' },
        'Fundamento Haláchico': { 'Detalhe': rest.reason || 'Sem restrições litúrgicas ativas.' }
    });
    console.groupEnd();

    return rest;
}

function handleResetSimulationCommand() {
    resetSimulation();
    return 'Simulação desativada. Dados reais de hoje reativados.';
}

function handleSimulateCommand(arg, rawArgs) {
    const clean = String(arg || '').toLowerCase().trim();
    if (!clean || clean === 'ajuda' || clean === 'help') {
        console.group(
            '%c YISRAEL DATE %c Comandos de Simulação ',
            'background: #1e293b; color: #d4af37; font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 3px 0 0 3px; font-family: monospace;',
            'background: #0f172a; color: #f1f5f9; font-weight: 600; font-size: 11px; padding: 2px 8px; border-radius: 0 3px 3px 0; border-left: 1px solid #334155;'
        );
        console.table([
            { 'Comando': 'simular("teruah")', 'Celebração': 'Yom Teruah', 'Ação': 'Ativa liturgia de 1º Tishrei' },
            { 'Comando': 'simular("pesach")', 'Celebração': 'Yom Pessach', 'Ação': 'Ativa liturgia de 15 Nisan' },
            { 'Comando': 'simular("shavuot")', 'Celebração': 'Yom Shavuot', 'Ação': 'Ativa liturgia de Shavuot' },
            { 'Comando': 'simular("yomkippur")', 'Celebração': 'Yom Kippur', 'Ação': 'Ativa liturgia de 10 Tishrei' },
            { 'Comando': 'simular("sukkot")', 'Celebração': 'Chag Sukkot', 'Ação': 'Ativa liturgia de 15 Tishrei' },
            { 'Comando': 'restaurar()', 'Celebração': 'Restaurar', 'Ação': 'Retorna à data e relógio de hoje' }
        ]);
        console.groupEnd();
        return 'Opções de simulação apresentadas.';
    }

    if (clean === 'reset' || clean === 'real' || clean === 'fim' || clean === 'desativar' || clean === 'restaurar') {
        resetSimulation();
        return 'Simulação desativada. Dados reais restaurados.';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        simulateDate(clean);
        return `Simulação para a data ${clean} iniciada.`;
    }

    const ALLOWED_SIMULATIONS = new Set([
        'teruah', 'pesach', 'pessach', 'shavuot', 'yomkippur', 'kippur',
        'sukkot', 'sheminiatzeret', 'cholhamoed', 'shabbat'
    ]);

    if (ALLOWED_SIMULATIONS.has(clean)) {
        simulateFestival(clean);
        return `Simulação de ${clean} iniciada.`;
    }

    console.warn(`Simulação "${clean}" não reconhecida. Digite simular("ajuda") para ver as opções disponíveis.`);
    return 'Falha: simulação não permitida.';
}

function handleClearCacheCommand() {
    try {
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    if (name.includes('yisrael') || name.includes('app-shell')) {
                        caches.delete(name);
                    }
                });
            });
        }
        console.log('%c[Manutenção] Cache local removido com sucesso.', 'color: #10b981; font-weight: 600;');
        return 'Cache do Yisrael Date limpo com sucesso.';
    } catch (e) {
        console.warn('Não foi possível limpar o cache automaticamente.');
        return 'Falha na limpeza do cache.';
    }
}

/**
 * Ponto de entrada de execução de comandos (Anti-Hacking Engine)
 */
export function executeConsoleCommand(inputStr) {
    if (typeof inputStr !== 'string') {
        console.warn('Uso: run("/<comando> [argumento]"). Digite ajuda para consultar a lista.');
        return;
    }

    const trimmed = inputStr.trim();
    if (!trimmed) {
        return printHelpMenu();
    }

    const normalized = trimmed.replace(/^\/+/, '').trim();
    const parts = normalized.split(/\s+/);
    const commandName = (parts[0] || '').toLowerCase();
    const args = parts.slice(1);

    if (commandName === '__proto__' || commandName === 'constructor' || commandName === 'prototype') {
        console.warn('Acesso bloqueado por salvaguardas de segurança.');
        return 'Operação não permitida.';
    }

    const handler = SAFE_COMMAND_REGISTRY[commandName];
    if (typeof handler === 'function') {
        try {
            return handler(args.join(' '), args);
        } catch (err) {
            console.error('[Console] Falha na execução do comando seguro:', err.message);
            return 'Erro interno seguro.';
        }
    } else {
        console.warn(`Comando "/${commandName}" não reconhecido. Digite ajuda para ver a lista de comandos disponíveis.`);
        return `Comando desconhecido: ${commandName}`;
    }
}

/**
 * Comando central do console para simulação de celebrações bíblicas.
 * Altera todo o site (leituras, data hebraica, zmanim, descanso) até executar party().
 * Exemplos: party('kippur'), party("terua", 2), party('pesach'), party()
 */
export function party(name, opt = 1) {
    if (!name || name === true || name === 'reset' || name === 'restaurar' || name === 'off' || name === 'real') {
        resetSimulation();
        return 'Site restaurado para o tempo real.';
    }

    const clean = String(name).toLowerCase().trim();
    if (clean === 'help' || clean === 'ajuda' || clean === '?' || clean === 'festas' || clean === 'lista') {
        printHelpMenu();
        return 'Guia de celebrações apresentado.';
    }

    simulateFestival(clean, opt);
    return `Celebração ativada: ${clean}. Digite party() para restaurar ao tempo real.`;
}

party.kippur = () => party('kippur');
party.terua = (day = 1) => party('terua', day);
party.teruah = (day = 1) => party('teruah', day);
party.roshhashana = (day = 1) => party('roshhashana', day);
party.pesach = () => party('pesach');
party.pessach = () => party('pesach');
party.sukkot = () => party('sukkot');
party.sucot = () => party('sukkot');
party.shavuot = () => party('shavuot');
party.shemini = () => party('sheminiatzeret');
party.sheminiatzeret = () => party('sheminiatzeret');
party.shabbat = () => party('shabbat');
party.cholhamoed = () => party('cholhamoed');
party.reset = () => party();
party.restaurar = () => party();
party.ajuda = () => printHelpMenu();
party.help = () => printHelpMenu();
party.toString = () => "party('festa', dia?) | Ex: party('kippur'), party('terua', 2), party('pesach'). Para restaurar: party()";

/**
 * Utilitário para criar getters limpos para comandos do console no DevTools (sem vazar código de funções)
 */
function makeCleanGetter(actionFn) {
    return {
        get() {
            actionFn();
            return undefined;
        },
        configurable: true
    };
}

/**
 * Inicializa os ouvintes e atalhos no console global do navegador (window)
 */
export function initConsoleControl(updateDashboardCb = null) {
    if (typeof window === 'undefined') return;

    updateDashboardCallback = updateDashboardCb;

    window.run = executeConsoleCommand;
    window.cmd = executeConsoleCommand;

    // Interface principal e ergonómica solicitada pelo utilizador
    window.party = party;
    window.festa = party;
    window.festas = party;
    window.simular = party;
    window.simulate = party;
    window.restaurar = () => party();
    window.reset = () => party();

    // Nomes diretos de celebrações no console
    window.kippur = () => party('kippur');
    window.yomkippur = () => party('yomkippur');
    window.terua = (d = 1) => party('terua', d);
    window.teruah = (d = 1) => party('teruah', d);
    window.roshhashana = (d = 1) => party('roshhashana', d);
    window.pesach = () => party('pesach');
    window.sukkot = () => party('sukkot');
    window.shavuot = () => party('shavuot');
    window.shemini = () => party('sheminiatzeret');
    window.cholhamoed = () => party('cholhamoed');
    window.shabbat = () => party('shabbat');

    // Getters limpos e amigáveis para ajuda sem vazar código
    try {
        const ajudaGetter = makeCleanGetter(() => printHelpMenu());
        Object.defineProperty(window, 'ajuda', ajudaGetter);
        Object.defineProperty(window, 'help', ajudaGetter);
    } catch (e) { }

    // Suporte amigável para /ajuda/ e /help/ como RegExp no console
    try {
        const origRegExpToString = RegExp.prototype.toString;
        RegExp.prototype.toString = function() {
            if (this.source === 'ajuda' || this.source === 'help') {
                printHelpMenu();
                return '[Console] Catálogo de celebrações apresentado acima.';
            }
            return origRegExpToString.call(this);
        };
    } catch (e) { }

    printWelcomeBanner();
}
