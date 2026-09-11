/**
 * EVENTMAPPER.JS - NORMALIZAÇÃO DE EVENTOS LITÚRGICOS HEBCAL
 * 
 * Converte eventos da API Hebcal em entidades de domínio padronizadas,
 * classificando-as rigorosamente entre eventos bíblicos da Torá (isBiblical)
 * e eventos tradicionais rabínicos (isTraditional), com ajustes haláchicos
 * de pôr do sol e véspera.
 */

import { HEBREW_MONTHS_PT } from './constants.js';

export const BIBLICAL_MAPPING = {
    'Parashat': { name: 'Parashat' },
    'Pesach Sheni': { name: 'Pessach Sheni' },
    'Pesach': { name: 'Yom Pessach' },
    'Matzot': { name: 'Chag Matzot' },
    'Shavuot': { name: 'Yom Shavuot' },
    'Rosh Hashana': { name: 'Yom Teruah' },
    'Yom Kippur': { name: 'Yom Kippur' },
    'Sukkot': { name: 'Chag Sukkot' },
    'Shmini Atzeret': { name: 'Shemini Atzeret' },
    'Shemini Atzeret': { name: 'Shemini Atzeret' },
    'Rosh Chodesh': { name: 'Rosh Chodesh' },
    'Omer': { name: 'Sefirat Omer' }
};

export const TRADITIONAL_MAPPING = {
    // Purim e dias associados
    'Shushan Purim Katan': 'shushanpurimkatan',
    'Purim Katan': 'purimkatan',
    'Shushan Purim': 'shushanpurim',
    'Purim': 'purim',
    'Ta\'anit Esther': 'taanitesther',
    'Taanit Esther': 'taanitesther',
    'Fast of Esther': 'taanitesther',

    // Chanukah
    'Chanukah': 'chanukah',
    'Hanukkah': 'chanukah',

    // Festas e Datas do Calendário Rabínico
    'Rosh Hashana LaBehemot': 'roshhashanalabehemot',
    'Rosh Hashana': 'roshhashana',
    'Rosh Hashanah': 'roshhashana',
    'Simchat Torah': 'simchattorah',
    'Simchas Torah': 'simchattorah',
    'Hoshana Raba': 'hoshanarabbah',
    'Hoshana Rabbah': 'hoshanarabbah',
    'Tu BiShvat': 'tubishvat',
    'Tu B\'Shevat': 'tubishvat',
    'Tu B\'Av': 'tubaav',
    'Lag BaOmer': 'lagbaomer',
    'Lag B\'Omer': 'lagbaomer',
    'Leil Selichot': 'leilselichot',

    // Quatro Jejuns Rabínicos
    'Tzom Gedaliah': 'tzomgedaliah',
    'Fast of Gedaliah': 'tzomgedaliah',
    'Asara B\'Tevet': 'tzomtevet',
    'Tzom Tevet': 'tzomtevet',
    'Fast of Tevet': 'tzomtevet',
    '10 of Tevet': 'tzomtevet',
    'Tzom Tammuz': 'tzomtammuz',
    '17 of Tammuz': 'tzomtammuz',
    'Fast of Tammuz': 'tzomtammuz',
    'Tish\'a B\'Av': 'tishabav',
    'Tisha B\'Av': 'tishabav',
    'Fast of Av': 'tishabav',

    // Shabbatot Especiais
    'Shabbat Shekalim': 'shabbatshekalim',
    'Shabbat Zachor': 'shabbatzachor',
    'Shabbat Parah': 'shabbatparah',
    'Shabbat HaChodesh': 'shabbathachodesh',
    'Shabbat HaGadol': 'shabbathagadol',
    'Shabbat Shirah': 'shabbatshirah',
    'Shabbat Chazon': 'shabbatchazon',
    'Shabbat Nachamu': 'shabbatnahamu',
    'Shabbat Shuva': 'shabbatshuvah',
    'Shabbat Shuvah': 'shabbatshuvah'
};

const VALID_CATEGORIES = ['holiday', 'parashat', 'fast', 'omer', 'roshchodesh'];
const MINOR_FASTS = ['asarabtevet', 'tzomtammuz', 'tzomgedaliah', "ta'anit esther", "ta'anitesther"];

/**
 * Converte itens brutos da API Hebcal em eventos normalizados com validação haláchica.
 */
export function normalizeHebcalEvents(items, sunsetTime = 0) {
    if (!Array.isArray(items)) return [];

    const defaultSunsetH = sunsetTime ? new Date(sunsetTime).getHours() : 18;
    const defaultSunsetM = sunsetTime ? new Date(sunsetTime).getMinutes() : 0;

    const filteredItems = items.filter(item => VALID_CATEGORIES.includes(item.category));

    return filteredItems.flatMap(item => {
        const parts = item.date.split('T')[0].split('-');
        let dateObj = new Date();

        if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            const titleLower = item.title.toLowerCase().replace(/\s+/g, '');
            const isMinorFast = item.category === 'fast' && MINOR_FASTS.some(f => titleLower.includes(f));

            let dayOffset = 0;
            if (item.category === 'parashat' || item.category === 'omer') {
                dayOffset = -1;
            } else if (item.category === 'holiday' || item.category === 'roshchodesh') {
                dayOffset = item.title.includes('Erev') ? 0 : -1;
            } else if (item.category === 'fast') {
                dayOffset = isMinorFast ? 0 : -1;
            }
            dateObj = new Date(y, m, d + dayOffset, defaultSunsetH, defaultSunsetM, 0);
        }

        const cleanTitle = item.title.replace(/[\u2018\u2019]/g, "'");

        // Vésperas (Erev) não são dias festivos independentes no calendário, exceto Erev Pesach (que corresponde a Yom Pessach, 14 de Aviv)
        if (cleanTitle.startsWith('Erev ') && !cleanTitle.includes('Pesach')) {
            return [];
        }

        let itemName = item.title;
        let isBiblical = false;
        let isTraditional = false;
        let customCategory = item.category;

        for (const key in BIBLICAL_MAPPING) {
            if (cleanTitle.includes(key)) {
                if (key === 'Sukkot' && cleanTitle.includes('Erev')) {
                    continue;
                }
                if (key === 'Yom Kippur' && cleanTitle.includes('Erev')) {
                    continue;
                }
                if (key === 'Shavuot' && (cleanTitle.includes('II') || cleanTitle.includes('Erev'))) {
                    continue;
                }
                if (key === 'Rosh Hashana' && (cleanTitle.includes('LaBehemot') || cleanTitle.includes('LaIlanot'))) {
                    continue;
                }
                // As festas da Torá só duram os dias que a Torá manda (Chag Matzot dura estritamente 7 dias, excluindo o 8º dia da Diáspora)
                if (key === 'Pesach' && (cleanTitle.includes('Day 8') || cleanTitle.includes('VIII') || cleanTitle.includes('Pesach 8'))) {
                    continue;
                }

                if (key === 'Rosh Hashana') {
                    if (cleanTitle.includes('II')) {
                        return [
                            { name: 'Rosh Hashana', time: dateObj.getTime(), category: 'roshhashana', rawCategory: item.category, isBiblical: false, isTraditional: true, raw: item }
                        ];
                    }
                    const rawHdate = item.hdate || '1 Tishrei';
                    const rawMonthPart = rawHdate.split(' ').slice(1, -1).join(' ') || 'Tishrei';
                    const canonicalMonth = HEBREW_MONTHS_PT[rawMonthPart] || rawMonthPart;
                    return [
                        { name: 'Yom Teruah', time: dateObj.getTime(), category: 'yomteruah', rawCategory: item.category, isBiblical: true, isTraditional: false, raw: item },
                        { name: 'Rosh Chodesh', time: dateObj.getTime(), category: 'roshchodesh', rawCategory: 'roshchodesh', isBiblical: true, isTraditional: false, raw: { ...item, title: `Rosh Chodesh ${canonicalMonth}`, category: 'roshchodesh', hdate: rawHdate } },
                        { name: 'Rosh Hashana', time: dateObj.getTime(), category: 'roshhashana', rawCategory: item.category, isBiblical: false, isTraditional: true, raw: item }
                    ];
                }

                itemName = BIBLICAL_MAPPING[key].name;
                isBiblical = true;
                customCategory = key.toLowerCase().replace(/ /g, '');

                if (key === 'Parashat') {
                    itemName = 'Yom Shabbat';
                    customCategory = 'parashat';
                } else if (key.includes('Atzeret')) {
                    itemName = 'Shemini Atzeret';
                    customCategory = 'sheminiatzeret';
                } else if (key === 'Rosh Chodesh') {
                    if (item.hdate && !item.hdate.startsWith('1 ')) return [];
                    const isAviv = item.hdate && (item.hdate.includes('Nisan') || item.hdate.includes('Aviv'));
                    itemName = isAviv ? 'Rosh Chodashim' : 'Rosh Chodesh';
                    customCategory = 'roshchodesh';
                } else if (key === 'Pesach') {
                    customCategory = cleanTitle.includes('Erev') ? 'pesach' : 'matzot';
                    itemName = cleanTitle.includes('Erev') ? 'Yom Pessach' : 'Chag Matzot';
                } else if (key === 'Omer') {
                    const match = cleanTitle.match(/\d+/);
                    if (match) itemName = `${match[0]} laOmer`;
                }
                break;
            }
        }

        if (!isBiblical) {
            for (const tKey in TRADITIONAL_MAPPING) {
                if (cleanTitle.includes(tKey)) {
                    if ((tKey === 'Chanukah' || tKey === 'Hanukkah') && !(cleanTitle.includes('1 Candle') || cleanTitle.includes('8th Day') || cleanTitle === 'Chanukah' || cleanTitle === 'Hanukkah')) {
                        return [];
                    }
                    let mappedName = tKey;
                    if (tKey === 'Chanukah' || tKey === 'Hanukkah') mappedName = 'Chag Chanukah';
                    else if (tKey === 'Rosh Hashana LaBehemot') mappedName = 'Rosh LaBehemot';
                    else if (tKey === 'Purim' && !cleanTitle.includes('Katan') && !cleanTitle.includes('Shushan')) mappedName = 'Yom Purim';
                    else if (tKey === 'Shushan Purim Katan') mappedName = 'Shushan Purim';
                    else if (tKey.startsWith('Rosh Hashana')) mappedName = 'Rosh Hashana';
                    else if (tKey === 'Ta\'anit Esther' || tKey === 'Taanit Esther' || tKey === 'Fast of Esther') mappedName = 'Ta\'anit Esther';
                    else if (tKey === 'Tzom Tammuz' || tKey === '17 of Tammuz' || tKey === 'Fast of Tammuz') mappedName = 'Tzom Tammuz';
                    else if (tKey === 'Asara B\'Tevet' || tKey === 'Tzom Tevet' || tKey === '10 of Tevet' || tKey === 'Fast of Tevet') mappedName = 'Tzom Tevet';
                    else if (tKey.includes('Tish') || tKey === 'Fast of Av') mappedName = "Tisha B'Av";
                    else if (tKey === 'Tzom Gedaliah' || tKey === 'Fast of Gedaliah') mappedName = 'Tzom Gedaliah';
                    else if (tKey.includes('Hoshana')) mappedName = 'Hoshana Rabbah';
                    else if (tKey.includes('Shuva')) mappedName = 'Shabbat Shuvah';
                    else if (tKey.includes('Simchat') || tKey.includes('Simchas')) mappedName = 'Simchat Torah';
                    else if (tKey.includes('Tu BiShvat') || tKey.includes('Tu B\'Shevat')) mappedName = 'Tu BiShvat';
                    else if (tKey.includes('Tu B\'Av')) mappedName = 'Tu B\'Av';
                    else if (tKey.includes('Lag B')) mappedName = 'Lag BaOmer';

                    itemName = mappedName;
                    isTraditional = true;
                    customCategory = TRADITIONAL_MAPPING[tKey];
                    break;
                }
            }
        }

        if (!isBiblical && !isTraditional) return [];

        return [{
            name: itemName,
            time: dateObj.getTime(),
            category: customCategory,
            rawCategory: item.category,
            isBiblical,
            isTraditional,
            raw: item
        }];
    });
}
