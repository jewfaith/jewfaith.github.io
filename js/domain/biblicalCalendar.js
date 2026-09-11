/**
 * BIBLICALCALENDAR.JS - CÁLCULO E FORMATAÇÃO DAS DATAS DA TANAKH
 * 
 * Regras Canónicas:
 * 1. Nomenclatura dos meses prioritariamente pela Tanakh:
 *    - Mês 1: Aviv (Ex 13:4)
 *    - Mês 2: Ziv (1 Reis 6:1)
 *    - Mês 7: do 7º mês ou Eitanim (1 Reis 8:2)
 *    - Mês 8: Bul (1 Reis 6:38)
 *    - Demais meses: designação bíblica ordinal correspondente (do 3º mês, do 4º mês, etc.).
 * 2. Formato compacto obrigatório:
 *    - 1 dia: 14 Aviv, 6 do 3º mês, 10 do 7º mês
 *    - Vários dias mesmo mês: 15-21 Aviv, 15-21 do 7º mês
 *    - Vários dias meses diferentes: 25 do 9º mês - 2 do 10º mês
 * 3. Sem ano, sem texto supérfluo, cálculo exato para anos comuns e bissextos (embolísmicos).
 */

/**
 * Determina se um ano judaico é bissexto (embolísmico, 13 meses)
 * pelo ciclo metónico de 19 anos.
 */
export function isHebrewLeapYear(hYear) {
    const y = Number(hYear) || 5786;
    return ((7 * y + 1) % 19) < 7;
}

/**
 * Calcula a duração total em dias de um ano hebraico específico
 * segundo as regras haláchicas consolidadas pelo Rambam (Kiddush HaChodesh).
 */
export function getHebrewYearLength(hYear) {
    const y = Number(hYear) || 5786;

    function roshHashanahDay(yr) {
        const m = Math.floor((235 * yr - 234) / 19);
        const parts = 31524 + m * 765433;
        let day = Math.floor(parts / 25920);
        const time = parts % 25920;
        let dow = (day % 7) + 1; // 1: Dom, 2: Seg, ..., 7: Sáb

        if (time >= 19440) {
            day++;
            dow = (dow % 7) + 1;
        }

        const isLeap = isHebrewLeapYear(yr);
        if (dow === 1 || dow === 4 || dow === 6) {
            day++;
            dow = (dow % 7) + 1;
        } else if (!isLeap && dow === 3 && time >= (9 * 1080 + 204) && time < 19440) {
            day += 2;
            dow = ((dow + 1) % 7) + 1;
        } else if (isHebrewLeapYear(yr - 1) && dow === 2 && time >= (15 * 1080 + 589) && time < 19440) {
            day++;
            dow = (dow % 7) + 1;
        }

        if (dow === 1 || dow === 4 || dow === 6) {
            day++;
            dow = (dow % 7) + 1;
        }

        return day;
    }

    const d1 = roshHashanahDay(y);
    const d2 = roshHashanahDay(y + 1);
    return d2 - d1;
}

/**
 * Retorna o número de dias de um mês bíblico específico (1 a 13)
 * num determinado ano judaico.
 */
export function getHebrewMonthLength(monthIndex, hYear = 5786) {
    const yLen = getHebrewYearLength(hYear);
    const isLeap = isHebrewLeapYear(hYear);

    switch (monthIndex) {
        case 1: return 30; // Aviv (Nisan)
        case 2: return 29; // Ziv (Iyyar)
        case 3: return 30; // 3º mês (Sivan)
        case 4: return 29; // 4º mês (Tamuz)
        case 5: return 30; // 5º mês (Av)
        case 6: return 29; // 6º mês (Elul)
        case 7: return 30; // 7º mês / Eitanim (Tishrei)
        case 8: return (yLen === 355 || yLen === 385) ? 30 : 29; // Bul / Cheshvan
        case 9: return (yLen === 353 || yLen === 383) ? 29 : 30; // 9º mês / Kislev
        case 10: return 29; // 10º mês (Tevet)
        case 11: return 30; // 11º mês (Shevat)
        case 12: return isLeap ? 30 : 29; // 12º mês (Adar I em bissexto, Adar em comum)
        case 13: return 29; // 13º mês (Adar II em bissexto)
        default: return 30;
    }
}

/**
 * Retorna o nome bíblico ou a designação ordinal canónica de um mês da Tanakh.
 * @param {number} monthIndex - Índice de 1 a 13 (1 = Aviv)
 * @param {object} options
 * @param {boolean} options.inDateContext - Se true, formata 'do 3º mês'; se false, '3º mês'
 * @param {boolean} options.useNamedEitanim - Se true para o mês 7, retorna 'Eitanim'
 */
export function getBiblicalMonthLabel(monthIndex, { inDateContext = true, useNamedEitanim = false } = {}) {
    switch (monthIndex) {
        case 1: return 'Aviv';
        case 2: return 'Ziv';
        case 3: return 'Sivan';
        case 4: return 'Tamuz';
        case 5: return 'Av';
        case 6: return 'Elul';
        case 7: return 'Etanim';
        case 8: return 'Bul';
        case 9: return 'Kislev';
        case 10: return 'Tevet';
        case 11: return 'Shevat';
        case 12: return 'Adar I';
        case 13: return 'Adar II';
        default: return `${monthIndex}º mês`;
    }
}

/**
 * Converte qualquer nome tradicional/babilónico de mês para o índice bíblico correspondente (1 a 13).
 */
export function hebrewMonthNameToBiblicalIndex(name, isLeap = false) {
    if (!name) return null;
    const nm = String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (nm.includes('nisan') || nm.includes('aviv')) return 1;
    if (nm.includes('iyyar') || nm.includes('iyar') || nm.includes('ziv')) return 2;
    if (nm.includes('sivan')) return 3;
    if (nm.includes('tamuz') || nm.includes('tammuz')) return 4;
    if (nm.includes('av')) return 5;
    if (nm.includes('elul')) return 6;
    if (nm.includes('tishrei') || nm.includes('tishri') || nm.includes('etanim') || nm.includes('eitanim')) return 7;
    if (nm.includes('cheshvan') || nm.includes('marcheshvan') || nm.includes('bul')) return 8;
    if (nm.includes('kislev')) return 9;
    if (nm.includes('tevet')) return 10;
    if (nm.includes('shvat') || nm.includes('shevat')) return 11;
    if (nm.includes('adar1') || nm.includes('adari')) return 12;
    if (nm.includes('adar2') || nm.includes('adarii')) return 13;
    if (nm.includes('adar')) return isLeap ? 13 : 12;
    return null;
}

/**
 * Formata um intervalo de datas bíblicas no formato compacto canónico X–Y de [mês].
 * Exemplos:
 * 14 de Aviv
 * 15–21 de Aviv
 * 6 de Sivan
 * 15–21 de Etanim
 * 25 de Kislev – 2 de Tevet
 */
export function formatBiblicalDateRange(startDay, startMonthIdx, endDay, endMonthIdx, { useNamedEitanim = false } = {}) {
    if (startMonthIdx === endMonthIdx) {
        const mLabel = getBiblicalMonthLabel(startMonthIdx, { inDateContext: true, useNamedEitanim });
        if (startDay === endDay) {
            return `${startDay} ${mLabel}`;
        }
        return `${startDay}–${endDay} ${mLabel}`;
    }
    const mLabel1 = getBiblicalMonthLabel(startMonthIdx, { inDateContext: true, useNamedEitanim });
    const mLabel2 = getBiblicalMonthLabel(endMonthIdx, { inDateContext: true, useNamedEitanim });
    return `${startDay} ${mLabel1} – ${endDay} ${mLabel2}`;
}

/**
 * Retorna a data bíblica compacta e exata para qualquer festa da Torá ou celebração rabínica.
 * @param {string} festivalKeyOrName - Chave ou nome da festa
 * @param {object} options
 * @param {number} options.hebrewYear - Ano judaico corrente
 * @param {boolean} options.isIsrael - Se a localização é a Terra de Israel
 * @param {string} options.rawHdate - String de data hebraica opcional para efemérides móveis
 */
export function getFestivalBiblicalDate(festivalKeyOrName, { hebrewYear = 5786, isIsrael = true, rawHdate = null } = {}) {
    if (!festivalKeyOrName) return 'Data Sagrada';
    const key = String(festivalKeyOrName).toLowerCase().replace(/[^a-z0-9]/g, '');
    const isLeap = isHebrewLeapYear(hebrewYear);

    // 1. Shabat semanal
    if (key.includes('shabbat') && !key.includes('shekalim') && !key.includes('zachor') &&
        !key.includes('parah') && !key.includes('hachodesh') && !key.includes('chodesh') &&
        !key.includes('hagadol') && !key.includes('gadol') && !key.includes('shirah') &&
        !key.includes('chazon') && !key.includes('nachamu') && !key.includes('shuva')) {
        return 'Sétimo dia';
    }

    // 2. Festas da Torá - Duração estrita ordenada pela Torá
    if (key === 'roshchodashim') {
        return '1 Aviv';
    }
    if (key === 'roshchodesh') {
        return '1 Cada Mês';
    }
    if (key === 'yompessach') {
        return '14 Aviv';
    }
    if (key === 'chagmatzot' || key === 'matzot') {
        return '15–21 Aviv'; // 7 dias como ordena a Torá (Êx 12:15, Lev 23:6)
    }
    if (key === 'pessach' || key === 'pesach') {
        return '14 Aviv';
    }
    if (key === 'pessachsheni' || key === 'pesachsheni') {
        return '14 Ziv';
    }
    if (key === 'yomshavuot' || key === 'shavuot') {
        return '6 Sivan'; // 1 dia solene como ordena a Torá (Lev 23:16-21)
    }
    if (key === 'yomteruah') {
        return '1 Etanim'; // 1 dia solene como ordena a Torá (Lev 23:24)
    }
    if (key === 'yomkippur') {
        return '10 Etanim'; // 1 dia solene como ordena a Torá (Lev 23:27)
    }
    if (key === 'chagsukkot' || key === 'sukkot') {
        return '15–21 Etanim'; // 7 dias como ordena a Torá (Lev 23:34)
    }
    if (key === 'sheminiatzeret') {
        return '22 Etanim'; // 1 dia solene como ordena a Torá (Lev 23:36)
    }

    // 3. Festas e Datas Rabínicas
    if (key === 'roshhashana' || key === 'roshhashanah') {
        return '1–2 Etanim';
    }
    if (key === 'tzomgedaliah') {
        return '3 Etanim';
    }
    if (key === 'hoshanarabbah') {
        return '21 Etanim';
    }
    if (key === 'simchattorah') {
        return isIsrael ? '22 Etanim' : '23 Etanim';
    }
    if (key === 'chagchanukah' || key === 'chanukah' || key === 'hanukkah') {
        const kislevLen = getHebrewMonthLength(9, hebrewYear);
        const endDay = kislevLen === 30 ? 2 : 3;
        return `25 Kislev – ${endDay} Tevet`;
    }
    if (key === 'tzomtevet' || key === 'asaratbevet' || key === 'asarabtevet') {
        return '10 Tevet';
    }
    if (key === 'tubishvat' || key === 'tubishevat') {
        return '15 Shevat';
    }
    if (key === 'taanitesther') {
        return isLeap ? '13 Adar II' : '13 Adar';
    }
    if (key === 'purimkatan') {
        return '14 Adar I';
    }
    if (key === 'shushanpurimkatan') {
        return '15 Adar I';
    }
    if (key === 'yompurim' || key === 'purim') {
        return isLeap ? '14 Adar II' : '14 Adar';
    }
    if (key === 'shushanpurim') {
        return isLeap ? '15 Adar II' : '15 Adar';
    }
    if (key === 'lagbaomer') {
        return '18 Ziv';
    }
    if (key === 'tzomtamuz' || key === 'tzomtammuz') {
        return '17 Tamuz';
    }
    if (key === 'tishabav') {
        return '9 Av';
    }
    if (key === 'tubav') {
        return '15 Av';
    }
    if (key === 'roshlabehemot') {
        return '1 Elul';
    }
    if (key === 'chodeshelul') {
        return '1–29 Elul';
    }

    // 4. Se houver data explícita fornecida pelo Hebcal (ex: Shabbat Shekalim, etc.)
    if (rawHdate) {
        const parts = String(rawHdate).trim().split(/\s+/);
        if (parts.length >= 2) {
            const dayNum = parseInt(parts[0], 10);
            const rawM = parts[1];
            const mIdx = hebrewMonthNameToBiblicalIndex(rawM, isLeap);
            if (!isNaN(dayNum) && mIdx) {
                return `${dayNum} ${getBiblicalMonthLabel(mIdx, { inDateContext: true })}`;
            }
        }
    }

    return 'Tradição de Israel';
}

/**
 * Converte um objeto de data hebraica ({ hd: 15, hm: 'Nisan' }) para string bíblica compacta.
 * Exemplo: { hd: 15, hm: 'Nisan' } -> '15 Aviv'
 * Exemplo: { hd: 6, hm: 'Sivan' } -> '6 do 3º mês'
 */
export function formatHdateObjectToBiblical(hdateObj, { inDateContext = true } = {}) {
    if (!hdateObj || typeof hdateObj.hd === 'undefined' || !hdateObj.hm) {
        return 'Data Sagrada';
    }
    const day = hdateObj.hd;
    const isLeap = isHebrewLeapYear(hdateObj.hy || 5786);
    const mIdx = hebrewMonthNameToBiblicalIndex(hdateObj.hm, isLeap);
    if (!mIdx) return `${day} ${hdateObj.hm}`;
    const mLabel = getBiblicalMonthLabel(mIdx, { inDateContext });
    return `${day} ${mLabel}`;
}
