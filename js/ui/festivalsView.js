import { ICONS } from './icons.js';
import { FESTIVAL_DESCRIPTIONS, FESTIVAL_NAME_MAPPINGS, HEBREW_MONTHS_PT } from '../domain/constants.js';
import { state } from '../state.js';

export function getFestivalIcon(name, isBiblical = false) {
    const nm = (name || '').toLowerCase();
    if (nm.includes('shabbat')) return ICONS.candles;

    if (isBiblical) {
        if (nm.includes('pessach') || nm.includes('pesach')) return ICONS.wineGlass;
        if (nm.includes('matzot')) return ICONS.breadSlice;
        if (nm.includes('shavuot')) return ICONS.seedling;
        if (nm.includes('teruah')) return ICONS.bullhorn;
        if (nm.includes('kippur')) return ICONS.handsPraying;
        if (nm.includes('sukkot')) return ICONS.campground;
        if (nm.includes('atzeret')) return ICONS.peopleGroup;
        if (nm.includes('rosh chodashim') || nm.includes('rosh chodesh')) return ICONS.moon;
        if (nm.includes('sheny') || nm.includes('sheni')) return ICONS.rotateRight;
    }

    // Toda a festa rabínica só tem a Magen David (Estrela de David), exceto os Shabbat especiais
    return ICONS.starOfDavid;
}

import { formatTwoWordTitle } from '../domain/formatters.js';
import { getSelectedLocation } from '../services/locationService.js';
export { formatTwoWordTitle };

export function isIsraelLocation() {
    try {
        const loc = getSelectedLocation();
        if (loc) {
            if (loc.isIsrael !== undefined) {
                return !!loc.isIsrael;
            }
            if (loc.tz === 'Asia/Jerusalem') {
                return true;
            }
            const lat = Number(loc.lat);
            const lon = Number(loc.lon);
            if (!isNaN(lat) && !isNaN(lon)) {
                return lat >= 29.4 && lat <= 33.4 && lon >= 34.2 && lon <= 35.9;
            }
        }
    } catch (e) { }

    if (state.userLocation?.isIsrael !== undefined) {
        return !!state.userLocation.isIsrael;
    }
    if (state.userLocation?.tz === 'Asia/Jerusalem') {
        return true;
    }
    const lat = Number(state.userLocation?.lat);
    const lon = Number(state.userLocation?.lon);
    if (!isNaN(lat) && !isNaN(lon)) {
        if (lat >= 29.4 && lat <= 33.4 && lon >= 34.2 && lon <= 35.9) {
            return true;
        }
    }
    return false;
}

export const TORAH_MANDATES = {
    'Rosh Chodashim': {
        verse: 'Shemot 12 2',
        text: 'Este mês vos será o princípio dos meses será o primeiro dos meses do ano.',
        hebrewDate: '1 Aviv',
        torahCommand: 'A Torá determina que o mês de Aviv na primavera seja o cabeça dos meses e o início formal da contagem de todas as festas bíblicas.',
        getHalachaLocation: () => 'Vigente em 1 Aviv em Israel e na Diáspora como a renovação canónica do calendário do povo libertado.'
    },
    'Rosh Chodesh': {
        verse: 'Bamidbar 28 11',
        text: 'E nos princípios dos vossos meses oferecereis holocausto ao Eterno.',
        hebrewDate: '1 Cada Mês',
        torahCommand: 'A Torá determina que no início de cada mês haja proclamação com toques de trombeta sobre as ofertas em lembrança perpétua perante o Criador.',
        getHalachaLocation: () => 'Celebrado no primeiro dia de cada mês lunar bíblico com orações e santificação temporal.'
    },
    'Yom Shabbat': {
        verse: 'Shemot 20 8 e Vayikra 23 3',
        text: 'Seis dias se trabalhará mas o sétimo dia é o sábado do descanso solene santa convocação.',
        hebrewDate: 'Sétimo Dia Semanal',
        torahCommand: 'A Torá prescreve descanso sagrado perpétuo e a cessação de todo o trabalho comum a cada sétimo dia em memória da Criação e do Êxodo.',
        getHalachaLocation: () => 'Vigente perpetuamente a cada sétimo dia tanto na Terra de Israel como na Diáspora.'
    },
    'Yom Pessach': {
        verse: 'Vayikra 23 5',
        text: 'No mês primeiro aos catorze do mês pela tarde é a Páscoa do Eterno.',
        hebrewDate: '14 Aviv',
        torahCommand: 'A Torá determina que no dia catorze de Aviv ao pôr do sol seja celebrado o sacrifício pascal da libertação.',
        getHalachaLocation: () => 'Observado na tarde de 14 Aviv fazendo a transição para a Festa dos Pães Ázimos.'
    },
    'Chag Matzot': {
        verse: 'Vayikra 23 6',
        text: 'E aos quinze dias deste mês é a festa dos pães ázimos do Eterno sete dias comereis pães ázimos.',
        hebrewDate: '15–21 Aviv',
        torahCommand: 'A Torá ordena comer pães ázimos e retirar todo o fermento durante exatamente sete dias (15–21 Aviv, do primeiro ao sétimo dia) com santa convocação no primeiro e no sétimo dia.',
        getHalachaLocation: () => 'A festa bíblica dura rigorosamente os 7 dias prescritos na Torá (15–21 Aviv), sendo o primeiro e o sétimo dias de descanso sagrado.'
    },
    'Pessach Sheni': {
        verse: 'Bamidbar 9 11',
        text: 'No segundo mês aos catorze dias à tarde a celebrarão com pães ázimos e ervas amargas.',
        hebrewDate: '14 Ziv',
        torahCommand: 'A Torá institui uma data sagrada reparadora no dia 14 de Ziv para quem esteve impuro ou em viagem distante na primeira Páscoa.',
        getHalachaLocation: () => 'Observado no dia 14 Ziv em Israel e na Diáspora com o consumo cerimonial de matzah.'
    },
    'Yom Shavuot': {
        verse: 'Vayikra 23 16 e 21',
        text: 'Contareis cinquenta dias até ao dia seguinte ao sétimo sábado e proclamareis santa convocação.',
        hebrewDate: '6 Sivan',
        torahCommand: 'A Torá determina contar cinquenta dias após a Páscoa trazendo as primícias da colheita e celebrando a entrega dos mandamentos num único dia solene em 6 de Sivan.',
        getHalachaLocation: () => 'A festa bíblica dura rigorosamente 1 dia solene em 6 Sivan, como a Torá manda expressamente.'
    },
    'Yom Teruah': {
        verse: 'Vayikra 23 24',
        text: 'No sétimo mês no primeiro dia do mês tereis descanso solene memorial com toque de trombetas santa convocação.',
        hebrewDate: '1 Etanim',
        torahCommand: 'A Torá prescreve descanso absoluto e o toque das trombetas e do Shofar no primeiro dia do sétimo mês bíblico.',
        getHalachaLocation: () => 'Observado em 1 Etanim como o memorial solene prescrito pela Torá.'
    },
    'Yom Kippur': {
        verse: 'Vayikra 23 27',
        text: 'Mas aos dez dias deste sétimo mês será o dia da expiação tereis santa convocação e afligireis as vossas almas.',
        hebrewDate: '10 Etanim',
        torahCommand: 'A Torá ordena o jejum completo de vinte e cinco horas e a cessação absoluta de trabalho para expiação de todos os pecados.',
        getHalachaLocation: () => 'Observado exatamente no dia 10 Etanim tanto na Terra de Israel como fora de Israel sem alteração de dias.'
    },
    'Chag Sukkot': {
        verse: 'Vayikra 23 34 e 42',
        text: 'Aos quinze dias deste mês sétimo será a festa dos tabernáculos ao Eterno por sete dias em cabanas habitareis.',
        hebrewDate: '15–21 Etanim',
        torahCommand: 'A Torá ordena habitar em cabanas por exatamente sete dias (15–21 Etanim, do primeiro ao sétimo dia) e reunir as quatro espécies para regozijo diante do Criador.',
        getHalachaLocation: () => 'A festa bíblica das cabanas decorre por exatamente 7 dias (15–21 Etanim), sendo o primeiro dia santa convocação.'
    },
    'Shemini Atzeret': {
        verse: 'Vayikra 23 36',
        text: 'Ao oitavo dia tereis santa convocação é reunião solene nenhum trabalho servil fareis.',
        hebrewDate: '22 Etanim',
        torahCommand: 'A Torá ordena uma assembleia solene de recolhimento no oitavo dia (22 de Etanim), imediatamente a seguir aos sete dias de Sucót.',
        getHalachaLocation: () => 'Shemini Atzeret é rigorosamente celebrado no dia 22 Etanim, como a Torá determina expressamente.'
    }
};

export function getAutomaticFestivals() {
    const isIsrael = isIsraelLocation();

    // Apenas celebrações bíblicas com data fixa no calendário hebraico
    const BIBLICAL_ORDER = [
        'Rosh Chodashim',
        'Yom Pessach',
        'Chag Matzot',
        'Pessach Sheni',
        'Yom Shavuot',
        'Yom Teruah',
        'Yom Kippur',
        'Chag Sukkot',
        'Shemini Atzeret'
    ];

    const BIBLICAL_SET = new Set([
        ...BIBLICAL_ORDER
    ]);

    const BIBLICAL_DATES = {
        'Rosh Chodashim': '1 Aviv',
        'Yom Pessach': '14 Aviv',
        'Chag Matzot': '15–21 Aviv',
        'Pessach Sheni': '14 Ziv',
        'Yom Shavuot': '6 Sivan',
        'Yom Teruah': '1 Etanim',
        'Yom Kippur': '10 Etanim',
        'Chag Sukkot': '15–21 Etanim',
        'Shemini Atzeret': '22 Etanim'
    };

    // Apenas celebrações rabínicas com data fixa no calendário hebraico
    const CANONICAL_RABBINIC = [
        'Rosh Hashana',
        'Tzom Gedaliah',
        'Hoshana Rabbah',
        'Simchat Torah',
        'Chag Chanukah',
        'Tzom Tevet',
        'Tu BiShvat',
        "Ta'anit Esther",
        'Yom Purim',
        'Shushan Purim',
        'Purim Katan',
        'Lag BaOmer',
        'Tzom Tamuz',
        "Tisha B'Av",
        "Tu B'Av",
        'Rosh LaBehemot'
    ];

    const RABBINIC_DATES = {
        'Rosh Hashana': '1–2 Etanim',
        'Rosh Hashanah': '1–2 Etanim',
        'Tzom Gedaliah': '3 Etanim',
        'Hoshana Rabbah': '21 Etanim',
        'Simchat Torah': isIsrael ? '22 Etanim' : '23 Etanim',
        'Chag Chanukah': '25 Kislev – 2 Tevet',
        'Chag Hanukkah': '25 Kislev – 2 Tevet',
        'Chanukah': '25 Kislev – 2 Tevet',
        'Hanukkah': '25 Kislev – 2 Tevet',
        'Tzom Tevet': '10 Tevet',
        'Tu BiShvat': '15 Shevat',
        "Ta'anit Esther": '13 Adar',
        'Yom Purim': '14 Adar',
        'Shushan Purim': '15 Adar',
        'Purim Katan': '14 Adar I',
        'Lag BaOmer': '18 Ziv',
        'Tzom Tamuz': '17 Tamuz',
        "Tisha B'Av": '9 Av',
        "Tu B'Av": '15 Av',
        'Rosh LaBehemot': '1 Elul'
    };

    const NON_FIXED_EXCLUSIONS = new Set([
        'Yom Shabbat',
        'Rosh Chodesh',
        'Shabbat Shuva',
        'Shabbat Shekalim',
        'Shabbat Zachor',
        'Shabbat Parah',
        'Shabbat Chodesh',
        'Shabbat Gadol',
        'Shabbat Shirah',
        'Shabbat Chazon',
        'Shabbat Nachamu',
        'Chodesh Elul',
        'Leil Selichot'
    ]);

    const rabbinicList = [];
    const seenRabbinic = new Set();

    for (const rKey of CANONICAL_RABBINIC) {
        const title = formatTwoWordTitle(rKey);
        if (!seenRabbinic.has(title) && !NON_FIXED_EXCLUSIONS.has(title)) {
            seenRabbinic.add(title);
            const dateDesc = RABBINIC_DATES[title] || RABBINIC_DATES[rKey] || 'Tradição Israel';
            rabbinicList.push({
                id: title.toLowerCase().replace(/[^a-z0-9]/g, ''),
                key: rKey,
                title: title,
                date: dateDesc,
                icon: getFestivalIcon(title, false)
            });
        }
    }

    const biblicalList = BIBLICAL_ORDER.map(bKey => ({
        id: bKey.toLowerCase().replace(/[^a-z0-9]/g, ''),
        key: bKey,
        title: bKey,
        date: BIBLICAL_DATES[bKey] || 'Base Toraica',
        icon: getFestivalIcon(bKey, true)
    }));

    return {
        biblicalList,
        rabbinicList
    };
}

function buildFestivalModalHTML(festival) {
    const rawData = FESTIVAL_DESCRIPTIONS[festival.key] ||
        FESTIVAL_DESCRIPTIONS[festival.title] ||
        FESTIVAL_DESCRIPTIONS[FESTIVAL_NAME_MAPPINGS?.[festival.key]] ||
        FESTIVAL_DESCRIPTIONS[FESTIVAL_NAME_MAPPINGS?.[festival.title]] ||
        FESTIVAL_DESCRIPTIONS[festival.key.replace("'", "")] ||
        FESTIVAL_DESCRIPTIONS[festival.key.replace("Hanukkah", "Chanukah")] ||
        FESTIVAL_DESCRIPTIONS[festival.key.replace("Tammuz", "Tamuz")];
    let bodyHTML = '';

    if (Array.isArray(rawData)) {
        bodyHTML = `
            <div class="levels-container" style="display: flex; flex-direction: column; gap: 8px;">
                ${rawData.map((paragraph, index) => `
                    <div class="info-modal-card" style="display: flex; flex-direction: column; align-items: flex-start; ${index === rawData.length - 1 ? '' : 'border-bottom: 1px solid var(--card-border-color); padding-bottom: 8px;'}">
                        <div class="info-modal-value" style="font-weight: 400; font-size: var(--font-size-sm); line-height: 1.6; text-align: left;">
                            ${paragraph}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        const desc = (typeof rawData === 'string' ? rawData : null) || festival.desc || 'Esta é uma celebração sagrada da tradição de Israel.';
        bodyHTML = `
            <div class="levels-container" style="display: flex; flex-direction: column; gap: 8px;">
                <div class="info-modal-card">
                    <div class="info-modal-value" style="font-size: var(--font-size-sm); line-height: 1.6; text-align: left;">
                        ${desc}
                    </div>
                </div>
            </div>
        `;
    }

    return bodyHTML;
}

let lastRenderedFestivalsKey = null;

export function renderFestivalsView(force = false) {
    const tanakhContainer = document.getElementById('tanakh-festivals-list');
    const rabbinicContainer = document.getElementById('rabbinic-festivals-list');
    if (!tanakhContainer && !rabbinicContainer) return;

    const isIsrael = state.userLocation?.isIsrael ?? true;
    const currentKey = `${isIsrael}`;

    const hasSkeletons = !!(tanakhContainer?.querySelector('.skeleton-card') || rabbinicContainer?.querySelector('.skeleton-card'));

    if (!force && !hasSkeletons && lastRenderedFestivalsKey === currentKey && tanakhContainer?.children.length > 0) {
        return;
    }
    lastRenderedFestivalsKey = currentKey;

    const { biblicalList, rabbinicList } = getAutomaticFestivals();

    const renderCard = (f) => {
        const modalHTML = buildFestivalModalHTML(f);
        const cardTitle = formatTwoWordTitle(f.title);
        const cardDate = ensureTwoWords(f.date);
        return `
            <div class="settings-card event-card glass-panel info-trigger" 
                 tabindex="0" 
                 role="button" 
                 data-info-title="${cardTitle}" 
                 data-info-html="${modalHTML.replace(/"/g, '&quot;')}"
                 aria-label="${cardTitle}"
                 style="cursor: pointer;">
                <div class="settings-card-left">
                    <i class="${f.icon} settings-icon"></i>
                    <div class="settings-card-text">
                        <span class="settings-card-title">${cardTitle}</span>
                        <span class="settings-card-desc">${cardDate}</span>
                    </div>
                </div>
                <div class="card-arrow-action" aria-hidden="true">
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            </div>
        `;
    };

    if (tanakhContainer) {
        tanakhContainer.innerHTML = biblicalList.map(f => renderCard(f)).join('');
    }

    if (rabbinicContainer) {
        rabbinicContainer.style.display = '';
        rabbinicContainer.innerHTML = rabbinicList.map(f => renderCard(f)).join('');
    }
}

export function ensureTwoWords(str, fallback = 'Sagrado') {
    if (!str) return `Evento ${fallback}`;
    let clean = String(str).trim();
    clean = clean.replace(/(\d+)\s*(?:-|–|—|a|à|e)\s*(\d+)/g, '$1–$2');
    return clean || `Evento ${fallback}`;
}

