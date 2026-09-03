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

export function formatTwoWordTitle(name) {
    if (!name) return 'Festa Sagrada';
    let clean = name.trim();

    if (clean.includes('Shekalim')) return 'Shabbat Shekalim';
    if (clean.includes('Zachor')) return 'Shabbat Zachor';
    if (clean.includes('Parah')) return 'Shabbat Parah';
    if (clean.includes('Chodesh') && clean.includes('Shabbat')) return 'Shabbat Chodesh';
    if (clean.includes('Gadol') && clean.includes('Shabbat')) return 'Shabbat Gadol';
    if (clean.includes('Shirah')) return 'Shabbat Shirah';
    if (clean.includes('Chazon')) return 'Shabbat Chazon';
    if (clean.includes('Nachamu')) return 'Shabbat Nachamu';
    if (clean.includes('Shuva') || clean.includes('Shuvah')) return 'Shabbat Shuva';
    if (clean.includes('Shabbat') || clean.includes('Shabbos')) return 'Yom Shabbat';
    if (clean.includes('Teruah')) return 'Yom Teruah';
    if (clean.includes('Kippur')) return 'Yom Kippur';
    if (clean.includes('Sukkot')) return 'Chag Sukkot';
    if (clean.includes('Atzeret')) return 'Shemini Atzeret';
    if (clean.includes('Simchat') || clean.includes('Simchas')) return 'Simchat Torah';
    if (clean.includes('Chanukah') || clean.includes('Hanukkah')) return 'Chag Chanukah';
    if (clean.includes('BiShvat') || clean.includes('Shevat')) return 'Tu BiShvat';
    if (clean.includes('Shushan Purim')) return 'Shushan Purim';
    if (clean.includes('Purim Katan')) return 'Purim Katan';
    if (clean.includes('Purim')) return 'Yom Purim';
    if (clean.includes('Pessach Sheni') || clean.includes('Pesach Sheni')) return 'Pessach Sheni';
    if (clean.includes('Pessach') || clean.includes('Pesach')) return 'Yom Pessach';
    if (clean.includes('Matzot')) return 'Chag Matzot';
    if (clean.includes('Shavuot')) return 'Yom Shavuot';
    if (clean.includes('Lag B')) return 'Lag BaOmer';
    if (clean.includes('Tammuz') || clean.includes('Tamuz')) return 'Tzom Tamuz';
    if (clean.includes('Tisha') || clean.includes("Tish'a")) return "Tisha B'Av";
    if (clean.includes('Tu B')) return "Tu B'Av";
    if (clean.includes('Gedaliah')) return 'Tzom Gedaliah';
    if (clean.includes('Tevet')) return 'Tzom Tevet';
    if (clean.includes('Esther')) return "Ta'anit Esther";
    if (clean.includes('Rosh Hashana') || clean.includes('Rosh Hashanah')) return 'Rosh Hashana';
    if (clean.includes('Rosh Chodashim')) return 'Rosh Chodashim';
    if (clean.includes('Rosh Chodesh')) return 'Rosh Chodesh';
    if (clean.includes('Behemot')) return 'Rosh LaBehemot';
    if (clean.includes('Elul')) return 'Chodesh Elul';
    if (clean.includes('Selichot')) return 'Leil Selichot';
    if (clean.includes('Hoshana')) return 'Hoshana Rabbah';

    const words = clean.split(/\s+/);
    if (words.length === 2) return clean;
    if (words.length > 2) return `${words[0]} ${words[1]}`;
    return `${words[0]} Sagrado`;
}

export function isIsraelLocation() {
    try {
        const exactLocRaw = localStorage.getItem('exactLocation');
        if (exactLocRaw) {
            const loc = JSON.parse(exactLocRaw);
            if (loc?.isIsrael !== undefined) {
                return !!loc.isIsrael;
            }
            if (loc?.tz === 'Asia/Jerusalem') {
                return true;
            }
            const lat = Number(loc.lat);
            const lon = Number(loc.lon);
            if (!isNaN(lat) && !isNaN(lon)) {
                if (lat >= 29.4 && lat <= 33.4 && lon >= 34.2 && lon <= 35.9) {
                    return true;
                }
                return false;
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
        hebrewDate: '1 de Aviv',
        torahCommand: 'A Torá determina que o mês de Aviv na primavera seja o cabeça dos meses e o início formal da contagem de todas as festas bíblicas.',
        getHalachaLocation: () => 'Vigente em 1 de Aviv em Israel e na Diáspora como a renovação canónica do calendário do povo libertado.'
    },
    'Rosh Chodesh': {
        verse: 'Bamidbar 28 11',
        text: 'E nos princípios dos vossos meses oferecereis holocausto ao Eterno.',
        hebrewDate: '1 de Cada Mês',
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
        hebrewDate: '14 de Aviv',
        torahCommand: 'A Torá determina que no dia catorze de Aviv ao pôr do sol seja celebrado o sacrifício pascal da libertação.',
        getHalachaLocation: () => 'Observado na tarde de 14 de Aviv fazendo a transição para a Festa dos Pães Ázimos.'
    },
    'Chag Matzot': {
        verse: 'Vayikra 23 6',
        text: 'E aos quinze dias deste mês é a festa dos pães ázimos do Eterno sete dias comereis pães ázimos.',
        hebrewDate: (isIsrael) => isIsrael ? '15 a 21 de Aviv' : '15 a 22 de Aviv',
        torahCommand: 'A Torá ordena comer pães ázimos e retirar todo o fermento durante os sete dias com santa convocação no primeiro e no sétimo dia.',
        getHalachaLocation: (isIsrael) => isIsrael 
            ? 'Na Terra de Israel a celebração dura exatamente 7 dias do dia 15 ao dia 21 de Aviv sendo o primeiro e o sétimo dias santos de descanso como a Torá prescreve expressamente.' 
            : 'Fora de Israel na Diáspora são celebrados 8 dias do dia 15 ao dia 22 de Aviv sendo os dois primeiros e os dois últimos dias santos de descanso pelo segundo dia festivo.'
    },
    'Pessach Sheni': {
        verse: 'Bamidbar 9 11',
        text: 'No segundo mês aos catorze dias à tarde a celebrarão com pães ázimos e ervas amargas.',
        hebrewDate: '14 de Ziv',
        torahCommand: 'A Torá institui uma data sagrada reparadora no dia 14 de Ziv para quem esteve impuro ou em viagem distante na primeira Páscoa.',
        getHalachaLocation: () => 'Observado no dia 14 de Ziv em Israel e na Diáspora com o consumo cerimonial de matzah.'
    },
    'Yom Shavuot': {
        verse: 'Vayikra 23 16 e 21',
        text: 'Contareis cinquenta dias até ao dia seguinte ao sétimo sábado e proclamareis santa convocação.',
        hebrewDate: (isIsrael) => isIsrael ? '6 de Sivan' : '6 e 7 de Sivan',
        torahCommand: 'A Torá determina contar cinquenta dias após a Páscoa trazendo as primícias da colheita e celebrando a entrega dos mandamentos.',
        getHalachaLocation: (isIsrael) => isIsrael 
            ? 'Na Terra de Israel é celebrado num único dia solene em 6 de Sivan como determina a Torá.' 
            : 'Fora de Israel na Diáspora é celebrado em 2 dias santos nos dias 6 e 7 de Sivan.'
    },
    'Yom Teruah': {
        verse: 'Vayikra 23 24',
        text: 'No sétimo mês no primeiro dia do mês tereis descanso solene memorial com toque de trombetas santa convocação.',
        hebrewDate: '1 de Etanim',
        torahCommand: 'A Torá prescreve descanso absoluto e o toque das trombetas e do Shofar no primeiro dia do sétimo mês bíblico.',
        getHalachaLocation: () => 'Observado em 1 de Etanim e tradicionalmente no segundo dia de Etanim tanto em Israel como na Diáspora.'
    },
    'Yom Kippur': {
        verse: 'Vayikra 23 27',
        text: 'Mas aos dez dias deste sétimo mês será o dia da expiação tereis santa convocação e afligireis as vossas almas.',
        hebrewDate: '10 de Etanim',
        torahCommand: 'A Torá ordena o jejum completo de vinte e cinco horas e a cessação absoluta de trabalho para expiação de todos os pecados.',
        getHalachaLocation: () => 'Observado exatamente no dia 10 de Etanim tanto na Terra de Israel como fora de Israel sem alteração de dias.'
    },
    'Chag Sukkot': {
        verse: 'Vayikra 23 34 e 42',
        text: 'Aos quinze dias deste mês sétimo será a festa dos tabernáculos ao Eterno por sete dias em cabanas habitareis.',
        hebrewDate: (isIsrael) => isIsrael ? '15 a 21 de Etanim' : '15 a 22 de Etanim',
        torahCommand: 'A Torá ordena habitar em cabanas por sete dias e reunir as quatro espécies para regozijo diante do Criador.',
        getHalachaLocation: (isIsrael) => isIsrael 
            ? 'Na Terra de Israel a Festa das Cabanas decorre por exatamente 7 dias de 15 a 21 de Etanim sendo o primeiro dia santa convocação.' 
            : 'Fora de Israel na Diáspora decorre de 15 a 22 de Etanim com os dois primeiros dias observados como santa convocação festiva.'
    },
    'Shemini Atzeret': {
        verse: 'Vayikra 23 36',
        text: 'Ao oitavo dia tereis santa convocação é reunião solene nenhum trabalho servil fareis.',
        hebrewDate: '22 de Etanim',
        torahCommand: 'A Torá ordena uma assembleia solene de recolhimento no oitavo dia imediatamente a seguir aos sete dias de Sucót.',
        getHalachaLocation: (isIsrael) => isIsrael 
            ? 'Na Terra de Israel celebra-se no dia 22 de Etanim onde Shemini Atzeret e a conclusão da Torá Simchat Torah ocorrem juntas no mesmo dia.' 
            : 'Fora de Israel na Diáspora Shemini Atzeret celebra-se no dia 22 de Etanim e Simchat Torah celebra-se como festa separada no dia 23 de Etanim.'
    }
};

export function getAutomaticFestivals() {
    const isIsrael = isIsraelLocation();

    const BIBLICAL_ORDER = [
        'Yom Shabbat',
        'Rosh Chodashim',
        'Rosh Chodesh',
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
        ...BIBLICAL_ORDER,
        'Rosh Chodesh',
        'Rosh Chodashim'
    ]);

    const BIBLICAL_DATES = {
        'Yom Shabbat': 'Sétimo Dia Semanal',
        'Rosh Chodashim': '1 de Aviv',
        'Rosh Chodesh': '1 de Cada Mês',
        'Yom Pessach': '14 de Aviv',
        'Chag Matzot': isIsrael ? '15 a 21 de Aviv' : '15 a 22 de Aviv',
        'Pessach Sheni': '14 de Ziv',
        'Yom Shavuot': isIsrael ? '6 de Sivan' : '6 e 7 de Sivan',
        'Yom Teruah': '1 de Etanim',
        'Yom Kippur': '10 de Etanim',
        'Chag Sukkot': isIsrael ? '15 a 21 de Etanim' : '15 a 22 de Etanim',
        'Shemini Atzeret': '22 de Etanim'
    };

    const RABBINIC_DATES = {
        'Rosh Hashana': '1 e 2 de Etanim',
        'Rosh Hashanah': '1 e 2 de Etanim',
        'Simchat Torah': isIsrael ? '22 de Etanim' : '23 de Etanim',
        'Hoshana Rabbah': '21 de Etanim',
        'Tzom Gedaliah': '3 de Etanim',
        'Shabbat Shuva': 'Shabbat de Teshuvá',
        'Chag Chanukah': '25 Kislev a 2 Tevet',
        'Tzom Tevet': '10 de Tevet',
        'Tu BiShvat': '15 de Shevat',
        'Shabbat Shekalim': 'Antes de Adar',
        'Shabbat Zachor': 'Antes de Purim',
        "Ta'anit Esther": '13 de Adar',
        'Yom Purim': '14 de Adar',
        'Shushan Purim': '15 de Adar',
        'Purim Katan': '14 de Adar I',
        'Shabbat Parah': 'Após o Purim',
        'Shabbat Chodesh': 'Antes de Aviv',
        'Shabbat Gadol': 'Antes de Pessach',
        'Lag BaOmer': '18 de Ziv',
        'Shabbat Shirah': 'Shabbat Beshalach',
        'Tzom Tamuz': '17 de Tamuz',
        'Shabbat Chazon': 'Antes de Av',
        "Tisha B'Av": '9 de Av',
        'Shabbat Nachamu': 'Após o Av',
        "Tu B'Av": '15 de Av',
        'Rosh LaBehemot': '1 de Elul',
        'Chodesh Elul': 'Mês de Elul',
        'Leil Selichot': 'Antes de Etanim'
    };

    const CANONICAL_RABBINIC = [
        'Rosh Hashana',
        'Tzom Gedaliah',
        'Shabbat Shuva',
        'Simchat Torah',
        'Hoshana Rabbah',
        'Chag Chanukah',
        'Tzom Tevet',
        'Tu BiShvat',
        'Shabbat Shekalim',
        'Shabbat Zachor',
        "Ta'anit Esther",
        'Yom Purim',
        'Shushan Purim',
        'Purim Katan',
        'Shabbat Parah',
        'Shabbat Chodesh',
        'Shabbat Gadol',
        'Lag BaOmer',
        'Shabbat Shirah',
        'Tzom Tamuz',
        'Shabbat Chazon',
        "Tisha B'Av",
        'Shabbat Nachamu',
        "Tu B'Av",
        'Rosh LaBehemot',
        'Chodesh Elul',
        'Leil Selichot'
    ];

    const rabbinicList = [];
    const seenRabbinic = new Set();

    if (Array.isArray(state.unifiedEvents) && state.unifiedEvents.length > 0) {
        for (const evt of state.unifiedEvents) {
            if (!evt || !evt.name) continue;
            if (evt.category === 'parashat' || evt.category === 'omer') continue;
            if (evt.name.includes('laOmer')) continue;

            const title = formatTwoWordTitle(evt.name);
            if (BIBLICAL_SET.has(title) || 
                title.toLowerCase().includes('rosh chodesh') || 
                title.toLowerCase().includes('rosh chodashim') || 
                title.toLowerCase().includes('shabbat')) {
                continue;
            }

            if (!seenRabbinic.has(title)) {
                seenRabbinic.add(title);
                let dateDesc = RABBINIC_DATES[title];
                if (!dateDesc && evt.raw?.hdate) {
                    const parts = evt.raw.hdate.split(' ');
                    if (parts.length >= 2) {
                        const rawM = parts[1];
                        const m = HEBREW_MONTHS_PT[rawM] || rawM;
                        dateDesc = `${parts[0]} de ${m}`;
                    }
                }
                if (!dateDesc) dateDesc = 'Tradição de Israel';

                rabbinicList.push({
                    id: title.toLowerCase().replace(/[^a-z0-9]/g, ''),
                    key: title,
                    title: title,
                    date: dateDesc,
                    icon: getFestivalIcon(title, false)
                });
            }
        }
    }

    for (const rKey of CANONICAL_RABBINIC) {
        const title = formatTwoWordTitle(rKey);
        if (!seenRabbinic.has(title)) {
            seenRabbinic.add(title);
            const dateDesc = RABBINIC_DATES[title] || RABBINIC_DATES[rKey] || 'Tradição de Israel';
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

    if (!force && lastRenderedFestivalsKey === currentKey && tanakhContainer?.children.length > 0) {
        return;
    }
    lastRenderedFestivalsKey = currentKey;

    const { biblicalList, rabbinicList } = getAutomaticFestivals();

    const renderCard = (f) => {
        const modalHTML = buildFestivalModalHTML(f);
        return `
            <div class="settings-card event-card glass-panel info-trigger" 
                 tabindex="0" 
                 role="button" 
                 data-info-title="${f.title}" 
                 data-info-html="${modalHTML.replace(/"/g, '&quot;')}"
                 aria-label="${f.title}"
                 style="cursor: pointer;">
                <div class="settings-card-left">
                    <i class="${f.icon} settings-icon"></i>
                    <div class="settings-card-text">
                        <span class="settings-card-title">${f.title}</span>
                        <span class="settings-card-desc">${f.date}</span>
                    </div>
                </div>
                <i class="${ICONS.chevronRight}" data-icon="chevronRight" style="color: var(--text-muted); font-size: 11px;"></i>
            </div>
        `;
    };

    if (tanakhContainer) {
        tanakhContainer.innerHTML = biblicalList.map(renderCard).join('');
    }

    if (rabbinicContainer) {
        rabbinicContainer.style.display = '';
        rabbinicContainer.innerHTML = rabbinicList.map(renderCard).join('');
    }
}
