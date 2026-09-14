import { state } from '../state.js';
import { closeModalSafely } from './modals.js';
import { ICONS } from './icons.js';
import { getSelectedLocation, JERUSALEM_COORDS } from '../services/locationService.js';
import { getPersistentSetting } from '../utils/persistence.js';
import { openInfoModal } from './modals/infoModal.js';

export function openZmanimModal() {
    const cardTitle = document.getElementById('solar-hero-city-title')?.textContent?.trim() || "Sha'ah Zmanit";
    const html = generateZmanimTableHTML();
    openInfoModal(cardTitle, html);
}

export function closeZmanimModal() {
    const modal = document.getElementById('info-modal');
    if (modal) closeModalSafely(modal);
}

let isZmanimModalInitialized = false;

export function initZmanimModal() {
    if (isZmanimModalInitialized || typeof document === 'undefined') return;
    isZmanimModalInitialized = true;
}

function fmt(isoStr) {
    if (!isoStr) return '--h --m';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '--h --m';
    return `${String(d.getHours()).padStart(2, '0')}h ${String(d.getMinutes()).padStart(2, '0')}m`;
}

export function renderZmanimTable() {
    const html = generateZmanimTableHTML();
    const infoModal = document.getElementById('info-modal');
    if (infoModal && infoModal.style.display === 'flex') {
        const backBtn = document.getElementById('back-info-btn');
        const isAtRoot = !backBtn || backBtn.style.display === 'none';
        const titleEl = document.getElementById('info-modal-title');
        const cardTitle = document.getElementById('solar-hero-city-title')?.textContent?.trim() || "Sha'ah Zmanit";
        if (isAtRoot && titleEl && titleEl.textContent === cardTitle) {
            const bodyEl = document.getElementById('info-modal-body');
            if (bodyEl) bodyEl.innerHTML = html;
        }
    }
}

export function generateZmanimTableHTML() {
    const z = state.currentZmanim || {};
    const zTom = state.tomorrowZmanim || {};
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

    function toMs(val) {
        if (!val) return null;
        if (typeof val === 'number') return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d.getTime();
    }

    // ═══════════════════════════════════════════════════════
    // TABELA COMPLETA DE ZMANIM HALÁCHICOS (CICLO DINÂMICO 24H)
    // ═══════════════════════════════════════════════════════

    const rawItems = [
        { label: 'Chatzot Layla', desc: 'Meia Noite', key: 'chatzotNight', val: z.chatzotNight, icon: ICONS.moon },
        { label: 'Alot Shachar', desc: 'Primeira Luz', key: 'alotHaShachar', val: z.alotHaShachar, icon: ICONS.cloudSun },
        { label: 'Alot HaTanya', desc: 'Alot Tanya', key: 'alosBaalHatanya', val: z.alosBaalHatanya, icon: ICONS.cloudSun },
        { label: 'Tempo Misheyakir', desc: 'Talit Tefilin', key: 'misheyakir', val: z.misheyakir, icon: ICONS.handsPraying },
        { label: 'Misheyakir Machmir', desc: 'Misheyakir Estrito', key: 'misheyakirMachmir', val: z.misheyakirMachmir, icon: ICONS.handsPraying },
        { label: 'Hanetz Civil', desc: 'Alvorecer Civil', key: 'dawn', val: z.dawn, icon: ICONS.sunrise },
        { label: 'Netz Chamah', desc: 'Nascer Solar', key: 'sunrise', val: z.sunrise, icon: ICONS.sun, highlight: true },
        { label: 'Shemá MGA', desc: 'Shemá MGA', key: 'sofZmanShmaMGA', val: z.sofZmanShmaMGA, icon: ICONS.clock },
        { label: 'Shemá HaTanya', desc: 'Shemá Tanya', key: 'sofZmanShmaBaalHatanya', val: z.sofZmanShmaBaalHatanya, icon: ICONS.clock },
        { label: 'Shemá GRA', desc: 'Shemá GRA', key: 'sofZmanShma', val: z.sofZmanShma, icon: ICONS.clock, highlight: true },
        { label: 'Tefilah MGA', desc: 'Tefilah MGA', key: 'sofZmanTfillaMGA', val: z.sofZmanTfillaMGA, icon: ICONS.hourglass },
        { label: 'Tefilah HaTanya', desc: 'Tefilah Tanya', key: 'sofZmanTfilaBaalHatanya', val: z.sofZmanTfilaBaalHatanya, icon: ICONS.hourglass },
        { label: 'Sof Tefilah', desc: 'Tefilah GRA', key: 'sofZmanTfilla', val: z.sofZmanTfilla, icon: ICONS.hourglass, highlight: true },
        { label: 'Chatzot Yom', desc: 'Meio Dia', key: 'chatzot', val: z.chatzot, icon: ICONS.compass, highlight: true },
        { label: 'Mincha Gedolah', desc: 'Primeira Minchá', key: 'minchaGedola', val: z.minchaGedola, icon: ICONS.bell },
        { label: 'Gedolah HaTanya', desc: 'Gedolah Tanya', key: 'minchaGedolaBaalHatanya', val: z.minchaGedolaBaalHatanya, icon: ICONS.bell },
        { label: 'Mincha Ketanah', desc: 'Segunda Minchá', key: 'minchaKetana', val: z.minchaKetana, icon: ICONS.cloudSun },
        { label: 'Ketanah HaTanya', desc: 'Ketanah Tanya', key: 'minchaKetanaBaalHatanya', val: z.minchaKetanaBaalHatanya, icon: ICONS.cloudSun },
        { label: 'Plag Mincha', desc: 'Plag Minchá', key: 'plagHaMincha', val: z.plagHaMincha, icon: ICONS.cloudMoon },
        { label: 'Plag HaTanya', desc: 'Plag Tanya', key: 'plagHaminchaBaalHatanya', val: z.plagHaminchaBaalHatanya, icon: ICONS.cloudMoon },
        { label: 'Shkiah Solar', desc: 'Sol Poente', key: 'sunset', val: z.sunset, icon: ICONS.cloudMoon, highlight: true },
        { label: 'Bein Hashmashot', desc: 'Entre Sóis', key: 'beinHaShmashos', val: z.beinHaShmashos, icon: ICONS.cloudMoon },
        { label: 'Tzeit HaTanya', desc: 'Estrelas Tanya', key: 'tzaisBaalHatanya', val: z.tzaisBaalHatanya, icon: ICONS.star },
        { label: 'Tzeit Kochavim', desc: 'Três Estrelas', key: 'tzeit7083deg', val: z.tzeit7083deg, icon: ICONS.star },
        { label: 'Tzeit 8.5°', desc: 'Estrelas Rigorosas', key: 'tzeit85deg', val: z.tzeit85deg, icon: ICONS.star, highlight: !isSaturday },
        { label: 'Tzeit 42', desc: 'Tzeit 42min', key: 'tzeit42min', val: z.tzeit42min, icon: ICONS.moon },
        { label: 'Tzeit 50', desc: 'Tzeit 50min', key: 'tzeit50min', val: z.tzeit50min, icon: ICONS.moon },
        { label: 'Rabbeinu Tam', desc: 'Tzeit 72min', key: 'tzeit72min', val: z.tzeit72min, icon: ICONS.moon }
    ];

    if (showCandles) {
        rawItems.push({ label: 'Hadlakat Nerot', desc: candleDesc, key: 'candleLighting', val: candleTimeVal, icon: ICONS.candles, highlight: true, isSpecialDay: true });
    }
    if (isSaturday) {
        rawItems.push({ label: 'Havdalá Shabat', desc: 'Saída Shabat', key: 'havdalah', val: havdalahTimeVal, icon: ICONS.star, highlight: true, isSpecialDay: true });
    }

    const nowMs = Date.now();
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

    // Regra temporal haláchica:
    // Se a hora atual tiver 2h a mais do que o zman, empurra fisicamente para a frente (amanhã / fim da lista)
    // e muda a hora exibida para a da próxima ocorrência.
    const processedItems = [];
    rawItems.forEach(item => {
        let baseMs = toMs(item.val);
        if (!baseMs) return;

        let rawMs = baseMs;
        let isPushedForward = false;

        if ((nowMs - baseMs) >= TWO_HOURS_MS) {
            isPushedForward = true;
            let nextMs = null;

            if (item.isSpecialDay) {
                nextMs = baseMs + 7 * 24 * 60 * 60 * 1000;
            } else {
                if (zTom && item.key && zTom[item.key]) {
                    nextMs = toMs(zTom[item.key]);
                }
                if (!nextMs) {
                    nextMs = baseMs + 24 * 60 * 60 * 1000;
                }
            }
            rawMs = nextMs;
        }

        const formattedTime = fmt(new Date(rawMs).toISOString());
        if (formattedTime === '--h --m' || formattedTime === '--:--') return;

        processedItems.push({
            ...item,
            rawMs,
            time: formattedTime,
            isTomorrow: isPushedForward
        });
    });

    // Ordenação cronológica contínua do ciclo de 24 horas:
    // Os itens vigentes/próximos surgem no topo e os que passaram há mais de 2h ficam no fim da lista
    processedItems.sort((a, b) => (a.rawMs || 0) - (b.rawMs || 0));

    let currentZmanItem = null;
    let closestPastDiff = Infinity;
    processedItems.forEach(item => {
        if (item.rawMs && item.rawMs <= nowMs) {
            const diff = nowMs - item.rawMs;
            if (diff < closestPastDiff) {
                closestPastDiff = diff;
                currentZmanItem = item;
            }
        }
    });
    if (!currentZmanItem && processedItems.length > 0) {
        currentZmanItem = processedItems[0];
    }

    const ZMANIM_KNOWLEDGE = {
        'Chatzot Layla': {
            paragraphs: [
                'Ponto médio exato da noite haláchica, correspondente à metade matemática do intervalo entre o pôr do sol, Shkiah, e o nascer do sol, Netz Chamah. Divide a noite em duas metades perfeitamente iguais de seis horas temporais cada.',
                'Tradicionalmente associado à vigília da meia-noite, Tikkun Chatzot, momento de recolhimento espiritual e misericórdia celestial no qual se recitam salmos e se estuda a Torá com fervor, conforme Tehilim 119:62.',
                'Este momento litúrgico é calculado astronomicamente com base no meridiano local e no ciclo solar diário, assinalando a transição entre as vigílias noturnas.'
            ],
            prayer: {
                hebrew: 'חֲצוֹת לַיְלָה אָקוּם לְהוֹדוֹת לָךְ עַל מִשְׁפְּטֵי צִדְקֶךָ׃ חָבֵר אָנִי לְכָל־אֲשֶׁר יְרֵאוּךָ וּלְשֹׁמְרֵי פִּקּוּדֶיךָ׃ חַסְדְּךָ יְהוָה מָלְאָה הָאָרֶץ, חֻקֶּיךָ לַמְּדֵנִי׃',
                translit: 'Chatzot layla akum lehodot lach al mishpetei tzidkecha. Chaver ani lechol asher yere\'ucha uleshomrei pikudeicha. Chasdecha Adonai mal\'ah ha\'aretz, chukeicha lamdeini.',
                translation: 'À meia-noite levanto-me para Te dar graças pelas Tuas justas ordenanças. Companheiro sou de todos os que Te temem e dos que guardam os Teus preceitos. Da Tua benevolência, ó Eterno, está cheia a terra; ensina-me os Teus estatutos.'
            }
        },
        'Alot Shachar': {
            paragraphs: [
                'Primeira luz da alvorada no firmamento, quando o centro do disco solar se encontra 16,1° abaixo da linha do horizonte astronómico. Marca o início formal do dia bíblico para a maioria dos mandamentos e preceitos da Torá.',
                'Define o início canónico e rigoroso de todos os jejuns públicos do calendário de Israel, com exceção de Yom Kippur e Tisha B\'Av, a partir do qual é proibido comer ou beber.',
                'Momento primordial de despertar e renovação espiritual, no qual a luz desponta no horizonte e se inicia a preparação para os deveres litúrgicos da manhã.'
            ],
            prayer: {
                hebrew: 'מוֹדֶה אֲנִי לְפָנֶיךָ מֶלֶךְ חַי וְקַיָּם, שֶׁהֶחֱזַרְתָּ בִּי נִשְׁמָתִי בְּחֶמְלָה, רַבָּה אֱמוּנָתֶךָ׃',
                translit: 'Modeh ani lefanecha Melech chai vekayam, shehechezarta bi nishmati bechemla, raba emunatecha.',
                translation: 'Agradeço perante Ti, ó Rei vivo e eterno, por teres devolvido em mim a minha alma com compaixão; imensa é a Tua fidelidade.'
            }
        },
        'Alot HaTanya': {
            paragraphs: [
                'Primeira luz da alvorada calculada segundo a metodologia estrita do Baal HaTanya, Rabi Shneur Zalman de Liadi no Shulchan Aruch HaRav.',
                'Baseia-se no tempo constante de deslocamento solar equivalente a 72 minutos sazonais antes do nascer do sol, estabelecendo um referencial uniforme e rigoroso.',
                'Adotado nas comunidades de tradição chassídica para determinar a entrada do alvorecer e o início das primeiras obrigações do dia.'
            ],
            prayer: {
                hebrew: 'בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר יָצַר אֶת הָאָדָם בְּחָכְמָה, וּבָרָא בוֹ נְקָבִים נְקָבִים, חֲלוּלִים חֲלוּלִים. גָּלוּי וְיָדוּעַ לִפְנֵי כִסֵּא כְבוֹדֶךָ, שֶׁאִם יִפָּתֵחַ אֶחָד מֵהֶם, אוֹ יִסָּתֵם אֶחָד מֵהֶם, אִי אֶפְשָׁר לְהִתְקַיֵּם וְלַעֲמוֹד לְפָנֶיךָ אֲפִילּוּ שָׁעָה אֶחָת. בָּרוּךְ אַתָּה יְהֹוָה, רוֹפֵא כָל בָּשָׂר וּמַפְלִיא לַעֲשׂוֹת׃',
                translit: 'Baruch Atah Adonai Eloheinu Melech HaOlam, asher yatzar et ha\'adam bechochmah, uvara vo nekavim nekavim, chalulim chalulim. Galui veyadua lifnei chisei chevodecha, she\'im yipateach echad mehem, o yisatem echad mehem, i efshar lehitkayem vela\'amod lefanecha afilu sha\'ah achat. Baruch Atah Adonai, rofei chol basar umafli la\'asot.',
                translation: 'Bendito és Tu, Eterno nosso Deus, Rei do Universo, que formaste o ser humano com sabedoria e criaste nele órgãos e cavidades vitais. É revelado e sabido perante o Teu glorioso Trono que se um deles se abrir ou se fechar indevidamente, não seria possível subsistir e estar perante Ti nem sequer por uma hora. Bendito és Tu, Eterno, que curas toda a carne e realizas maravilhas.'
            }
        },
        'Tempo Misheyakir': {
            paragraphs: [
                'Momento em que a luz da manhã atinge intensidade suficiente para distinguir entre um fio de lã azul celeste, techelet, e um fio branco a uma distância de 4 côvados, cerca de dois metros.',
                'É o instante inicial a partir do qual a Halachá autoriza colocar o Talit e atar os Tefilin com a pronunciação das bênçãos sagradas, permitindo o início formal da oração matinal.',
                'Critério visual clássico estabelecido na Mishnah e codificado no Shulchan Aruch para garantir discernimento e reverência no cumprimento dos mandamentos.'
            ],
            prayer: {
                hebrew: 'בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֺתָיו וְצִוָּנוּ לְהִתְעַטֵּף בַּצִּיצִית׃',
                translit: 'Baruch Atah Adonai Eloheinu Melech HaOlam, asher kideshanu bemitzvotav vetzivanu lehitatêf batzitzit.',
                translation: 'Bendito és Tu, Eterno nosso Deus, Rei do Universo, que nos santificaste com os Teus mandamentos e nos ordenaste envolver-nos nos tzitzit.'
            }
        },
        'Misheyakir Machmir': {
            paragraphs: [
                'Padrão haláchico mais exigente e rigoroso de Misheyakir, com depressão solar entre 10,2° e 11,0° abaixo do horizonte.',
                'Adotado por autoridades e congregações que aguardam uma claridade solar plena e indubitável antes de atar os Tefilin e iniciar a oração matinal de Shacharit.',
                'Assegura a eliminação de qualquer dúvida quanto à iluminação do dia em conformidade com as regras mais estritas dos codificadores.'
            ],
            prayer: {
                hebrew: 'אֱלֹהַי, נְשָׁמָה שֶׁנָּתַתָּ בִּי טְהוֹרָה הִיא. אַתָּה בְרָאתָהּ, אַתָּה יְצַרְתָּהּ, אַתָּה נְפַחְתָּהּ בִּי, וְאַתָּה מְשַׁמְּרָהּ בְּקִרְבִּי, וְאַתָּה עָתִיד לִטְּלָהּ מִמֶּנִּי, וּלְהַחֲזִירָהּ בִּי לֶעָתִיד לָבוֹא. כָּל זְמַן שֶׁהַנְּשָׁמָה בְּקִרְבִּי מוֹדֶה אֲנִי לְפָנֶיךָ, יְהֹוָה אֱלֹהַי וֵאלֹהֵי אֲבוֹתַי, רִבּוֹן כָּל הַמַּעֲשִׂים, אֲדוֹן כָּל הַנְּשָׁמוֹת. בָּרוּךְ אַתָּה יְהֹוָה, הַמַּחֲזִיר נְשָׁמוֹת לִפְגָרִים מֵתִים׃',
                translit: 'Elohai, neshamah shenatata bi tehorah hi. Atah veratah, Atah yetzartah, Atah nefachtah bi, ve\'Atah meshamrah bekirbi, ve\'Atah atid litlah mimeni, ulehachazirah bi le\'atid lavo. Kol zman shehaneshamah bekirbi modeh ani lefaneicha, Adonai Elohai v\'Elohei avotai, Ribon kol hama\'asim, Adon kol haneshamot. Baruch Atah Adonai, hamachazir neshamot lifgarim metim.',
                translation: 'Meu Deus, a alma que puseste em mim é pura. Tu a criaste, Tu a formaste, Tu a insuflaste em mim, e Tu a guardas no meu interior. Enquanto a alma estiver dentro de mim, dou-Te graças, Eterno meu Deus e Deus dos meus antepassados, Soberano de todas as obras, Senhor de todas as almas. Bendito és Tu, Eterno, que devolves as almas aos corpos despertos.'
            }
        },
        'Hanetz Civil': {
            paragraphs: [
                'Alvorecer astronómico civil, instante no qual o centro do disco solar atinge precisamente 6° abaixo da linha do horizonte.',
                'Na ordem sinagogal, este momento assinala habitualmente a abertura dos Pesukei deZimra, os Salmos de Louvor matinais que antecedem as orações centrais do dia.',
                'Representa a transição luminosa clara na atmosfera que prepara a congregação para o nascer do sol.'
            ],
            prayer: {
                hebrew: 'בָּרוּךְ שֶׁאָמַר וְהָיָה הָעוֹלָם, בָּרוּךְ הוּא. בָּרוּךְ עוֹשֵׂה בְרֵאשִׁית, בָּרוּךְ אוֹמֵר וְעוֹשֶׂה, בָּרוּךְ גּוֹזֵר וּמְקַיֵּם, בָּרוּךְ מְרַחֵם עַל הָאָרֶץ, בָּרוּךְ מְרַחֵם עַל הַבְּרִיּוֹת, בָּרוּךְ מְשַׁלֵּם שָׂכָר טוֹב לִירֵאָיו, בָּרוּךְ חַי לָעַד וְקַיָּם לָנֶצַח, בָּרוּךְ פּוֹדֶה וּמַצִּיל, בָּרוּךְ שְׁמוֹ. בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, מֶלֶךְ מְהֻלָּל בַּתִּשְׁבָּחוֹת׃',
                translit: 'Baruch she\'amar vehayah ha\'olam, baruch Hu. Baruch oseih vereishit, baruch omer ve\'oseh, baruch gozer umkayem, baruch merachem al ha\'aretz, baruch merachem al habriyot, baruch meshalem sachar tov lirei\'av, baruch chai la\'ad vekayam lanetzach, baruch podeh umatzil, baruch shemo. Baruch Atah Adonai Eloheinu Melech HaOlam, Melech mehulal batishbachot.',
                translation: 'Bendito Aquele que falou e o mundo passou a existir, bendito seja Ele. Bendito o Criador da Criação, bendito Aquele que diz e realiza, bendito Aquele que decreta e cumpre, bendito Aquele que tem compaixão sobre a terra, bendito Aquele que tem misericórdia sobre as criaturas, bendito Aquele que recompensa os que O reverenciam, bendito o que vive para sempre e existe eternamente, bendito o que redime e salva, bendito é o Seu Nome. Bendito és Tu, Eterno nosso Deus, Rei do Universo, Rei louvado com louvores.'
            }
        },
        'Netz Chamah': {
            paragraphs: [
                'O nascer solar propriamente dito, momento em que o topo do disco solar surge na linha visível do horizonte.',
                'É considerado o momento supremo e mais meritório da liturgia judaica, costume dos Vasikin, para iniciar a recitação da Amidá, unindo a redenção ao primeiro brilho da luz matinal.',
                'Constitui o marco canónico a partir do qual se contam as horas proporcionais, Sha\'ot Zmaniyot, do dia segundo o Gaon de Vilna e o Shulchan Aruch.'
            ],
            prayer: {
                hebrew: 'בָּרוּךְ אַתָּה יְהֹוָה, גָּאַל יִשְׂרָאֵל׃ אֲדֹנָי, שְׂפָתַי תִּפְתָּח, וּפִי יַגִּיד תְּהִלָּתֶךָ׃ בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, אֱלֹהֵי אַבְרָהָם, אֱלֹהֵי יִצְחָק וֵאלֹהֵי יַעֲקֹב, הָאֵל הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא׃',
                translit: 'Baruch Atah Adonai, Ga\'al Yisrael. Adonai sefatai tiftach, ufi yagid tehilatecha. Baruch Atah Adonai Eloheinu v\'Elohei avoteinu, Elohei Avraham, Elohei Yitzchak v\'Elohei Ya\'akov, Ha\'El haGadol haGibor vehaNora.',
                translation: 'Bendito és Tu, Eterno, que redimiste Israel. Senhor, abre os meus lábios, e a minha boca proclamará o Teu louvor. Bendito és Tu, Eterno nosso Deus e Deus dos nossos pais, Deus de Abraão, Deus de Isaque e Deus de Jacob, o Deus grande, poderoso e temível.'
            }
        },
        'Shemá MGA': {
            paragraphs: [
                'Limite máximo matinal para cumprir o mandamento bíblico da proclamação do Shemá segundo o Magen Avraham, Rabi Avraham Gombiner.',
                'Este cálculo conta três horas sazonais a partir de Alot Shachar, o alvorecer, até Tzeit HaKochavim, a saída das estrelas. Por incluir o alvorecer, resulta num horário mais antecipado e rigoroso.',
                'Quem recita o Shemá antes deste término assegura o cumprimento do preceito diário com máxima salvaguarda haláchica.'
            ],
            prayer: {
                hebrew: 'שְׁמַע יִשְׂרָאֵל יְהֹוָה אֱלֹהֵינוּ יְהֹוָה אֶחָד׃ בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד׃',
                translit: 'Shemá Yisrael, Adonai Eloheinu, Adonai Echad. Baruch shem kevod malchuto le\'olam va\'ed.',
                translation: 'Ouve, ó Israel: o Eterno é nosso Deus, o Eterno é Um. Bendito seja o Nome da glória do Seu reino para todo o sempre.'
            }
        },
        'Shemá HaTanya': {
            paragraphs: [
                'Término do tempo prescrito para a leitura do Shemá matinal conforme o cálculo do Shulchan Aruch HaRav, o Baal HaTanya.',
                'Aplica o critério de três horas sazonais ajustadas pela convenção astronómica adotada por Rabi Shneur Zalman de Liadi.',
                'Referencial seguido no rito chassídico para garantir que a aceitação do jugo da soberania celestial ocorra rigorosamente no seu tempo prescrito.'
            ],
            prayer: {
                hebrew: 'וְאָהַבְתָּ אֵת יְהֹוָה אֱלֹהֶיךָ בְּכָל־לְבָבְךָ וּבְכָל־נַפְשְׁךָ וּבְכָל־מְאֹדֶךָ׃ וְהָיוּ הַדְּבָרִים הָאֵלֶּה אֲשֶׁר אָנֹכִי מְצַוְּךָ הַיּוֹם עַל־לְבָבֶךָ׃ וְשִׁנַּנְתָּם לְבָנֶיךָ וְדִבַּרְתָּ בָּם, בְּשִׁבְתְּךָ בְּבֵיתֶךָ וּבְלֶכְתְּךָ בַדֶּרֶךְ וּבְשָׁכְבְּךָ וּבְקוּמֶךָ׃ וּקְשַׁרְתָּם לְאוֹת עַל־יָדֶךָ, וְהָיוּ לְטֹטָפֹת בֵּין עֵינֶיךָ׃ וּכְתַבְתָּם עַל־מְזֻזוֹת בֵּיתֶךָ וּבִשְׁעָרֶיךָ׃',
                translit: 'Ve\'ahavta et Adonai Eloheicha, bechol levavcha uvchol nafshecha uvchol me\'odecha. Vehayu hadevarim ha\'eleh asher Anochi metzavcha hayom al levavecha. Veshinantam levaneicha vedibarta bam, beshivtecha beveitecha uvlechtecha vaderech uvshochbecha uvkumecha. Ukshartam le\'ot al yadecha, vehayu letotafot bein eineicha. Uchtavtam al mezuzot beitecha uvish\'areicha.',
                translation: 'Amarás o Eterno, teu Deus, com todo o teu coração, com toda a tua alma e com todas as tuas forças. E estas palavras que hoje te ordeno estarão no teu coração. Tu as ensinarás diligentemente aos teus filhos e delas falarás quando estiveres sentado em tua casa, ao andares pelo caminho, ao deitares-te e ao levantares-te. E as atarás por sinal na tua mão, e serão por frontais entre os teus olhos. E as escreverás nos umbrais da tua casa e nas tuas portas.'
            }
        },
        'Shemá GRA': {
            paragraphs: [
                'Limite canónico principal para a proclamação bíblica do Shemá segundo o Gaon de Vilna, GRA, e a maioria das comunidades de Israel.',
                'Conta exatamente três horas proporcionais, Sha\'ot Zmaniyot, desde Netz Chamah, o nascer do sol, até Shkiah, o pôr do sol, dividindo o período de luz visível em doze partes iguais.',
                'Decorrido este horário, o texto do Shemá ainda deve ser recitado como estudo da Torá, mas sem o cumprimento do mandamento da proclamação no seu horário determinado.'
            ],
            prayer: {
                hebrew: 'שְׁמַע יִשְׂרָאֵל יְהֹוָה אֱלֹהֵינוּ יְהֹוָה אֶחָד׃ בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד׃',
                translit: 'Shemá Yisrael, Adonai Eloheinu, Adonai Echad. Baruch shem kevod malchuto le\'olam va\'ed.',
                translation: 'Ouve, ó Israel: o Eterno é nosso Deus, o Eterno é Um. Bendito seja o Nome da glória do Seu reino para todo o sempre.'
            }
        },
        'Tefilah MGA': {
            paragraphs: [
                'Horário limite matinal para a oração da Amidá, Shacharit, segundo a metodologia do Magen Avraham.',
                'Totaliza quatro horas sazonais contadas a partir de Alot Shachar, fornecendo um marco antecipado para a conclusão das preces centrais da manhã.',
                'Adotado como padrão de precaução para garantir a elevação da prece dentro do tempo haláchico próprio.'
            ],
            prayer: {
                hebrew: 'שִׂים שָׁלוֹם טוֹבָה וּבְרָכָה, חֵן וָחֶסֶד וְרַחֲמִים, עָלֵינוּ וְעַל כָּל יִשְׂרָאֵל עַמֶּךָ. בָּרְכֵנוּ אָבִינוּ כֻּלָּנוּ כְּאֶחָד בְּאוֹר פָּנֶיךָ, כִּי בְאוֹר פָּנֶיךָ נָתַתָּ לָּנוּ יְהֹוָה אֱלֹהֵינוּ תּוֹרַת חַיִּים וְאַהֲבַת חֶסֶד, וּצְדָקָה וּבְרָכָה וְרַחֲמִים וְחַיִּים וְשָׁלוֹם. וְטוֹב בְּעֵינֶיךָ לְבָרֵךְ אֶת עַמְּךָ יִשְׂרָאֵל בְּכָל עֵת וּבְכָל שָׁעָה בִּשְׁלוֹמֶךָ. בָּרוּךְ אַתָּה יְהֹוָה, הַמְבָרֵךְ אֶת עַמּוֹ יִשְׂרָאֵל בַּשָּׁלוֹם׃',
                translit: 'Sim shalom tovah uverachah, chen vachessed verachamim, aleinu ve\'al kol Yisrael amecha. Barcheinu Avinu kulanu ke\'echad be\'or paneicha, ki ve\'or paneicha natata lanu Adonai Eloheinu Torat chayim ve\'ahavat chessed, utzedakah uverachah verachamim vechayim veshalom. Vetov be\'eineicha levarech et amecha Yisrael bechol et uvchol sha\'ah bishlomecha. Baruch Atah Adonai, hamvarech et amo Yisrael bashalom.',
                translation: 'Concede a paz, o bem e a bênção, a graça, a benevolência e a misericórdia a nós e a todo o Teu povo Israel. Abençoa-nos, nosso Pai, a todos nós juntos com a luz do Teu rosto, pois com a luz do Teu rosto deste-nos, Eterno nosso Deus, uma Torá de vida e amor pela bondade, justiça, bênção, misericórdia, vida e paz. E seja bom aos Teus olhos abençoar o Teu povo Israel em todo o tempo e em cada hora com a Tua paz. Bendito és Tu, Eterno, que abençoas o Teu povo Israel com a paz.'
            }
        },
        'Tefilah HaTanya': {
            paragraphs: [
                'Horário limite para a oração matinal da Amidá determinado conforme as regras do Shulchan Aruch HaRav.',
                'Completa as quatro primeiras horas sazonais do dia segundo o sistema de tempo proporcional instituído pelo Baal HaTanya.',
                'Orienta a prática litúrgica das comunidades que seguem a tradição de Liadi.'
            ],
            prayer: {
                hebrew: 'מוֹדִים אֲנַחְנוּ לָךְ, שָׁאַתָּה הוּא יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ לְעוֹלָם וָעֶד, צוּר חַיֵּינוּ, מָגֵן יִשְׁעֵנוּ, אַתָּה הוּא לְדוֹר וָדוֹר. נוֹדֶה לְּךָ וּנְסַפֵּר תְּהִלָּתֶךָ עַל חַיֵּינוּ הַמְּסוּרִים בְּיָדֶךָ, וְעַל נִשְׁמוֹתֵינוּ הַפְּקוּדוֹת לָךְ, וְעַל נִסֶּיךָ שֶׁבְּכָל יוֹם עִמָּנוּ, וְעַל נִפְלְאוֹתֶיךָ וְטוֹבוֹתֶיךָ שֶׁבְּכָל עֵת, עֶרֶב וָבֹקֶר וְצָהֳרָיִם. הַטּוֹב כִּי לֹא כָלוּ רַחֲמֶיךָ, וְהַמְרַחֵם כִּי לֹא תַמּוּ חֲסָדֶיךָ, מֵעוֹלָם קִוִּינוּ לָךְ׃',
                translit: 'Modim anachnu lach, sha\'Atah Hu Adonai Eloheinu v\'Elohei avoteinu le\'olam va\'ed, Tzur chayeinu, Magen yisheinu, Atah Hu ledor vador. Nodeh lecha unesaper tehilatecha al chayeinu hamsurim beyadecha, ve\'al nishmoteinu hapekudot lach, ve\'al nisseicha sheb\'chol yom imanu, ve\'al nifle\'oteicha vetovoteicha sheb\'chol et, erev vavoker vetzohorayim. Hatov ki lo chalu rachameicha, vehamrachem ki lo tamu chasadeicha, me\'olam kivinu lach.',
                translation: 'Nós Te agradecemos, pois Tu és o Eterno nosso Deus e Deus dos nossos antepassados para todo o sempre, Rocha da nossa vida e Escudo da nossa salvação, de geração em geração. Agradeceremos a Ti e proclamaremos o Teu louvor pela nossa vida entregue em Tuas mãos, pelas nossas almas confiadas a Ti, pelos Teus milagres que estão connosco todos os dias, e pelas Tuas maravilhas e bondades a todo o momento, à tarde, pela manhã e ao meio-dia. Tu és bom, pois a Tua misericórdia nunca se esgota, e Tu és compassivo, pois a Tua benevolência nunca cessa; desde sempre esperamos em Ti.'
            }
        },
        'Sof Tefilah': {
            paragraphs: [
                'Limite canónico rigoroso para a oração da Amidá matinal segundo o Gaon de Vilna, GRA, e o Shulchan Aruch.',
                'Completa as quatro primeiras horas sazonais contadas a partir do nascer do sol, Netz Chamah. Após este horário e até ao meio-dia, Chatzot, a oração ainda pode ser recitada, mas sem o mérito específico da oração no seu tempo oportuno.',
                'Marca o encerramento do período nobre concedido aos fiéis para a apresentação das súplicas da manhã perante o Criador.'
            ],
            prayer: {
                hebrew: 'קָדוֹשׁ, קָדוֹשׁ, קָדוֹשׁ יְהֹוָה צְבָאוֹת, מְלֹא כָל־הָאָרֶץ כְּבוֹדוֹ׃ בָּרוּךְ כְּבוֹד־יְהוָה מִמְּקוֹמוֹ׃ יִמְלֹךְ יְהוָה לְעוֹלָם, אֱלֹהַיִךְ צִיּוֹן לְדֹר וָדֹר, הַלְלוּיָהּ׃',
                translit: 'Kadosh, Kadosh, Kadosh Adonai Tzeva\'ot, melo chol ha\'aretz kevodo. Baruch kevod Adonai mimekomo. Yimloch Adonai le\'olam, Elohayich Tzion ledor vador, Halleluyah.',
                translation: 'Santo, Santo, Santo é o Eterno dos Exércitos; toda a terra está cheia da Sua glória. Bendita seja a glória do Eterno desde a Sua morada. O Eterno reinará eternamente; o teu Deus, ó Sião, de geração em geração. Aleluia.'
            }
        },
        'Chatzot Yom': {
            paragraphs: [
                'Meio-dia astronómico e haláchico, momento em que o sol cruza exatamente o meridiano local da cidade.',
                'Divide as doze horas de luz solar do dia em duas metades perfeitamente iguais de seis horas proporcionais cada.',
                'Assinala o término definitivo do prazo suplementar de Shacharit e prepara a abertura do período da tarde para a oração de Minchá.'
            ],
            prayer: {
                hebrew: 'שִׁיר לַמַּעֲלוֹת: אֶשָּׂא עֵינַי אֶל־הֶהָרִים, מֵאַיִן יָבֹא עֶזְרִי׃ עֶזְרִי מֵעִם יְהֹוָה, עֹשֵׂה שָׁמַיִם וָאָרֶץ׃ אַל־יִתֵּן לַמּוֹט רַגְלֶךָ, אַל־יָנוּם שֹׁמְרֶךָ׃ הִנֵּה לֹא־יָנוּם וְלֹא יִישָׁן, שׁוֹמֵר יִשְׂרָאֵל׃ יְהֹוָה שֹׁמְרֶךָ, יְהֹוָה צִלְּךָ עַל־יַד יְמִינֶךָ׃ יוֹמָם הַשֶּׁמֶשׁ לֹא־יַכֶּכָּה, וְיָרֵחַ בַּלָּיְלָה׃ יְהֹוָה יִשְׁמָרְךָ מִכָּל־רָע, יִשְׁמֹר אֶת־נַפְשֶׁךָ׃ יְהֹוָה יִשְׁמָר־צֵאתְךָ וּבוֹאֶךָ, מֵעַתָּה וְעַד־עוֹלָם׃',
                translit: 'Shir lama\'alot: essa einai el heharim, me\'ayin yavo ezri. Ezri me\'im Adonai, oseh shamayim va\'aretz. Al yiten lamot raglecha, al yanum shomrecha. Hinei lo yanum velo yishan, Shomer Yisrael. Adonai shomrecha, Adonai tzilcha al yad yeminecha. Yomam hashemesh lo yakeka, veyareach balayla. Adonai yishmorcha mikol ra, yishmor et nafshecha. Adonai yishmor tzeitcha uvo\'echa, me\'atah ve\'ad olam.',
                translation: 'Cântico das subidas: Elevo os meus olhos para os montes: de onde virá o meu socorro? O meu socorro vem do Eterno, o Criador dos céus e da terra. Ele não permitirá que o teu pé vacile; Aquele que te guarda não tosquenejará. Eis que não tosqueneja nem dorme o Guarda de Israel. O Eterno é quem te guarda; o Eterno é a tua sombra à tua mão direita. De dia o sol não te ferirá, nem a lua de noite. O Eterno te guardará de todo o mal; Ele guardará a tua alma. O Eterno guardará a tua saída e a tua entrada, desde agora e para sempre.'
            }
        },
        'Mincha Gedolah': {
            paragraphs: [
                'Início do período da tarde em que a Halachá autoriza a recitação da oração de Minchá.',
                'Corresponde a meia hora sazonal após o meio-dia, equivalente a 6,5 horas sazonais do dia, instante em que no Templo Sagrado de Jerusalém se iniciavam os preparativos do sacrifício vespertino perpétuo, o Tamid.',
                'Permite o cumprimento válido de Minchá para quem necessita orar cedo antes de prosseguir com afazeres ou viagens.'
            ],
            prayer: {
                hebrew: 'אַשְׁרֵי יוֹשְׁבֵי בֵיתֶךָ, עוֹד יְהַלְלוּךָ סֶּלָה׃ אַשְׁרֵי הָעָם שֶׁכָּכָה לּוֹ, אַשְׁרֵי הָעָם שֶׁיְהֹוָה אֱלֹהָיו׃ תְּהִלָּה לְדָוִד: אֲרוֹמִמְךָ אֱלוֹהַי הַמֶּלֶךְ, וַאֲבָרְכָה שִׁמְךָ לְעוֹלָם וָעֶד׃ בְּכָל־יוֹם אֲבָרְכֶךָּ, וַאֲהַלְלָה שִׁמְךָ לְעוֹלָם וָעֶד׃',
                translit: 'Ashrei yoshvei veitecha, od yehalelucha selah. Ashrei ha\'am shekacha lo, ashrei ha\'am she\'Adonai Elohav. Tehilah leDavid: aromimcha Elohai HaMelech, va\'avarcha shimcha le\'olam va\'ed. Bechol yom avarcheka, va\'ahalelah shimcha le\'olam va\'ed.',
                translation: 'Felizes os que habitam na Tua casa; eles continuarão a louvar-Te para sempre. Feliz o povo para quem as coisas são assim; bem-aventurado o povo cujo Deus é o Eterno. Louvor de David: Exaltar-Te-ei, meu Deus e meu Rei, e bendirei o Teu Nome para todo o sempre. A cada dia Te bendirei e louvarei o Teu Nome eternamente.'
            }
        },
        'Gedolah HaTanya': {
            paragraphs: [
                'Início do período de Mincha Gedolah calculado conforme os critérios do Baal HaTanya no Shulchan Aruch HaRav.',
                'Estabelece o marco temporal proporcional de 6,5 horas a partir da alvorada para o início das orações vespertinas.',
                'Utilizado nas congregações chassídicas como referencial seguro para a abertura da liturgia da tarde.'
            ],
            prayer: {
                hebrew: 'צַדִּיק יְהוָה בְּכָל־דְּרָכָיו, וְחָסִיד בְּכָל־מַעֲשָׂיו׃ קָרוֹב יְהוָה לְכָל־קֹרְאָיו, לְכֹל אֲשֶׁר יִקְרָאֻהוּ בֶאֱמֶת׃ רְצוֹן־יְרֵאָיו יַעֲשֶׂה, וְאֶת־שַׁוְעָתָם יִשְׁמַע וְיוֹשִׁיעֵם׃ שׁוֹמֵר יְהוָה אֶת־כָּל־אֹהֲבָיו, וְאֵת כָּל־הָרְשָׁעִים יַשְׁמִיד׃ תְּהִלַּת יְהוָה יְדַבֶּר־פִּי, וִיבָרֵךְ כָּל־בָּשָׂר שֵׁם קָדְשׁוֹ לְעוֹלָם וָעֶד׃',
                translit: 'Tzadik Adonai bechol drachav, vechasid bechol ma\'asav. Karov Adonai lechol kor\'av, lechol asher yikra\'uhu ve\'emet. Retzon yere\'av ya\'aseh, ve\'et shav\'atam yishma veyoshieim. Shomer Adonai et kol ohavav, ve\'et kol haresha\'im yashmid. Tehilat Adonai yedaber pi, vivarech kol basar shem kodsho le\'olam va\'ed.',
                translation: 'Justo é o Eterno em todos os Seus caminhos, e benevolente em todas as Suas obras. Perto está o Eterno de todos os que O invocam, de todos os que O invocam com sinceridade e verdade. Ele cumpre a vontade dos que O reverenciam, ouve o seu clamor e os salva. O Eterno guarda todos os que O amam, mas extirpará todos os ímpios. A minha boca proclamará o louvor do Eterno, e bendiga toda a criatura o Seu santo Nome para todo o sempre.'
            }
        },
        'Mincha Ketanah': {
            paragraphs: [
                'Momento preferencial e mais sublime para a oração vespertina de Minchá, com início após 9,5 horas sazonais diurnas, duas horas e meia sazonais antes do pôr do sol.',
                'É o horário de maior excelência e convergência entre as autoridades haláchicas, correspondendo ao momento no qual o sacrifício da tarde era efetivamente consumado no Altar.',
                'Recomendado pelos Sábios como o intervalo mais propício para o recolhimento e a aceitação das preces vespertinas.'
            ],
            prayer: {
                hebrew: 'יְהוָה קְרָאתִיךָ חוּשָׁה לִּי, הַאֲזִינָה קוֹלִי בְּקָרְאִי־לָךְ׃ תִּכּוֹן תְּפִלָּתִי קְטֹרֶת לְפָנֶיךָ, מַשְׂאַת כַּפַּי מִנְחַת־עָרֶב׃ שִׁיתָה יְהוָה שָׁמְרָה לְפִי, נִצְּרָה עַל־דַּל שְׂפָתָי׃',
                translit: 'Adonai keratiche cha chushah li, ha\'azinah koli bekori lach. Tikon tefilati ketoret lefanecha, mas\'at kapai minchat arev. Shitah Adonai shamrah lefi, nitzrah al dal sefatai.',
                translation: 'Senhor, a Ti clamo, apressa-Te em socorrer-me; inclina os Teus ouvidos à minha voz quando clamo por Ti. Seja a minha oração aceita perante Ti como o incenso aromático, e o erguer das minhas mãos como a oferenda da tarde. Põe, ó Eterno, uma guarda à minha boca; vigia a porta dos meus lábios.'
            }
        },
        'Ketanah HaTanya': {
            paragraphs: [
                'Início de Mincha Ketanah calculado segundo as regras temporais e proporcionais do Shulchan Aruch HaRav.',
                'Determina o instante ideal para a oração de Minchá dentro da metodologia do Baal HaTanya, a 2,5 horas sazonais do término do dia.',
                'Garante o alinhamento estrito das orações com as fases astronómicas da tarde.'
            ],
            prayer: {
                hebrew: 'בָּרוּךְ יְהֹוָה לְעוֹלָם, אָמֵן וְאָמֵן׃ בָּרוּךְ יְהֹוָה מִצִּיּוֹן שֹׁכֵן יְרוּשָׁלָ‍ִם, הַלְלוּיָהּ׃ בָּרוּךְ יְהֹוָה אֱלֹהִים אֱלֹהֵי יִשְׂרָאֵל, עֹשֵׂה נִפְלָאוֹת לְבַדּוֹ׃ וּבָרוּךְ שֵׁם כְּבוֹדוֹ לְעוֹלָם, וְיִמָּלֵא כְבוֹדוֹ אֶת־כֹּל הָאָרֶץ, אָמֵן וְאָמֵן׃',
                translit: 'Baruch Adonai le\'olam, amen ve\'amen. Baruch Adonai miTzion shochen Yerushalayim, Halleluyah. Baruch Adonai Elohim Elohei Yisrael, oseh nifla\'ot levado. Uvaruch shem kevodo le\'olam, veyimalei chevodo et kol ha\'aretz, amen ve\'amen.',
                translation: 'Bendito seja o Eterno para todo o sempre, amém e amém. Bendito seja o Eterno desde Sião, que habita em Jerusalém, Aleluia. Bendito seja o Eterno Deus, o Deus de Israel, que é o único que opera maravilhas. E bendito seja o Nome da Sua glória eternamente, e encha-se toda a terra da Sua glória, amém e amém.'
            }
        },
        'Plag Mincha': {
            paragraphs: [
                'Ponto haláchico situado a uma hora e um quarto, 1,25 horas sazonais, antes do pôr do sol, completando 10,75 horas sazonais do dia.',
                'Segundo a opinião de Rabi Yehudá no Talmud, Berachot 26b, o período de Minchá encerra-se em Plag HaMincha e a partir dele já se inicia o tempo da noite, autorizando a antecipação de Maariv e a receção solene do Shabat e Yom Tov.',
                'Constitui um dos marcos mais importantes para o ritmo litúrgico da transição entre a tarde e a noite.'
            ],
            prayer: {
                hebrew: 'מִזְמוֹר שִׁיר לְיוֹם הַשַּׁבָּת׃ טוֹב לְהֹדוֹת לַיהוָה, וּלְזַמֵּר לְשִׁמְךָ עֶלְיוֹן׃ לְהַגִּיד בַּבֹּקֶר חַסְדֶּךָ, וֶאֱמוּנָתְךָ בַּלֵּילוֹת׃ עֲלֵי־עָשׂוֹר וַעֲלֵי־נָבֶל, עֲלֵי הִגָּיוֹן בְּכִנּוֹר׃ כִּי שִׂמַּחְתַּנִי יְהוָה בְּפָעֳלֶךָ, בְּמַעֲשֵׂי יָדֶיךָ אֲרַנֵּן׃ מַה־גָּדְלוּ מַעֲשֶׂיךָ יְהוָה, מְאֹד עָמְקוּ מַחְשְׁבֹתֶיךָ׃',
                translit: 'Mizmor shir leyom haShabbat: Tov lehodot l\'Adonai, ulezamer leshimcha Elyon. Lehagid baboker chasdecha, ve\'emunatcha baleilot. Alei asor va\'alei navel, alei higayon bechinor. Ki simachtani Adonai befo\'olecha, bema\'asei yadeicha aranen. Mah gadlu ma\'aseicha Adonai, me\'od amku machshevoteicha.',
                translation: 'Salmo e cântico para o dia de Shabat: Bom é render graças ao Eterno e cantar louvores ao Teu Nome, ó Altíssimo. Anunciar de manhã a Tua benevolência e a Tua fidelidade durante as noites, com instrumentos de dez cordas, com o saltério e com a harmonia da harpa. Pois Tu, ó Eterno, me alegraste com as Tuas obras; exultarei nas realizações das Tuas mãos. Quão grandes são as Tuas obras, ó Eterno; quão profundos são os Teus desígnios.'
            }
        },
        'Plag HaMincha': {
            paragraphs: [
                'Ponto haláchico situado a uma hora e um quarto, 1,25 horas sazonais, antes do pôr do sol, completando 10,75 horas sazonais do dia.',
                'Segundo a opinião de Rabi Yehudá no Talmud, Berachot 26b, o período de Minchá encerra-se em Plag HaMincha e a partir dele já se inicia o tempo da noite, autorizando a antecipação de Maariv e a receção solene do Shabat e Yom Tov.',
                'Constitui um dos marcos mais importantes para o ritmo litúrgico da transição entre a tarde e a noite.'
            ],
            prayer: {
                hebrew: 'מִזְמוֹר שִׁיר לְיוֹם הַשַּׁבָּת׃ טוֹב לְהֹדוֹת לַיהוָה, וּלְזַמֵּר לְשִׁמְךָ עֶלְיוֹן׃ לְהַגִּיד בַּבֹּקֶר חַסְדֶּךָ, וֶאֱמוּנָתְךָ בַּלֵּילוֹת׃ עֲלֵי־עָשׂוֹר וַעֲלֵי־נָבֶל, עֲלֵי הִגָּיוֹן בְּכִנּוֹר׃ כִּי שִׂמַּחְתַּנִי יְהוָה בְּפָעֳלֶךָ, בְּמַעֲשֵׂי יָדֶיךָ אֲרַנֵּן׃ מַה־גָּדְלוּ מַעֲשֶׂיךָ יְהוָה, מְאֹד עָמְקוּ מַחְשְׁבֹתֶיךָ׃',
                translit: 'Mizmor shir leyom haShabbat: Tov lehodot l\'Adonai, ulezamer leshimcha Elyon. Lehagid baboker chasdecha, ve\'emunatcha baleilot. Alei asor va\'alei navel, alei higayon bechinor. Ki simachtani Adonai befo\'olecha, bema\'asei yadeicha aranen. Mah gadlu ma\'aseicha Adonai, me\'od amku machshevoteicha.',
                translation: 'Salmo e cântico para o dia de Shabat: Bom é render graças ao Eterno e cantar louvores ao Teu Nome, ó Altíssimo. Anunciar de manhã a Tua benevolência e a Tua fidelidade durante as noites, com instrumentos de dez cordas, com o saltério e com a harmonia da harpa. Pois Tu, ó Eterno, me alegraste com as Tuas obras; exultarei nas realizações das Tuas mãos. Quão grandes são as Tuas obras, ó Eterno; quão profundos são os Teus desígnios.'
            }
        },
        'Plag HaTanya': {
            paragraphs: [
                'Plag HaMincha calculado pela metodologia de horas proporcionais do Baal HaTanya, Rabi Shneur Zalman de Liadi no Shulchan Aruch HaRav.',
                'Corresponde a 1,25 horas sazonais antes do crepúsculo conforme a convenção astronómica chassídica, definindo o término de Minchá e o início do período preparatório noturno.',
                'Utilizado para a receção antecipada do Shabat e das festividades solenes com total segurança haláchica.'
            ],
            prayer: {
                hebrew: 'בּוֹאִי בְשָׁלוֹם עֲטֶרֶת בַּעְלָהּ, גַּם בְּשִׂמְחָה וּבְצָהֳלָה, תּוֹךְ אֱמוּנֵי עַם סְגֻלָּה, בּוֹאִי כַלָּה, בּוֹאִי כַלָּה׃ בּוֹאִי כַלָּה שַׁבָּת מַלְכְּתָא׃',
                translit: 'Bo\'i veshalom ateret ba\'alah, gam besimchah uvetzahalah, toch emunei am segulah, bo\'i chalah, bo\'i chalah! Bo\'i chalah Shabbat Malketa!',
                translation: 'Vem em paz, coroa do teu esposo, com júbilo e regozijo, no meio dos fiéis do povo escolhido: Vem, ó noiva! Vem, ó noiva! Vem, ó noiva, Rainha do Shabat!'
            }
        },
        'Shkiah Solar': {
            paragraphs: [
                'O momento exato em que a borda superior do disco solar desaparece totalmente abaixo da linha do horizonte astronómico.',
                'Marca o término do dia bíblico e abre a fase crepuscular de transição, Bein Hashmashot. É o prazo final impreterível para a recitação de Minchá de cada dia.',
                'Na sexta-feira e vésperas de Yom Tov, com a Shkiah cessa todo e qualquer trabalho profano em todo o mundo judaico.'
            ],
            prayer: {
                hebrew: 'יְהִי שֵׁם יְהֹוָה מְבֹרָךְ, מֵעַתָּה וְעַד־עוֹלָם׃ מִמִּזְרַח־שֶׁמֶשׁ עַד־מְבוֹאוֹ, מְהֻלָּל שֵׁם יְהֹוָה׃ רָם עַל־כָּל־גּוֹיִם יְהוָה, עַל הַשָּׁמַיִם כְּבוֹדוֹ׃ מִי כַּיהוָה אֱלֹהֵינוּ, הַמַּגְבִּיהִי לָשָׁבֶת, הַמַּשְׁפִּילִי לִרְאוֹת, בַּשָּׁמַיִם וּבָאָרֶץ׃',
                translit: 'Yehi shem Adonai mevorach, me\'atah ve\'ad olam. Mimizrach shemesh ad mevo\'o, mehulal shem Adonai. Ram al kol goyim Adonai, al hashamayim kevodo. Mi k\'Adonai Eloheinu, hamagbihi lashevet, hamashpili lir\'ot, bashamayim uva\'aretz.',
                translation: 'Bendito seja o Nome do Eterno, desde agora e para todo o sempre. Do nascente do sol até o seu poente, seja louvado o Nome do Eterno. O Eterno está exaltado sobre todas as nações, a Sua glória acima dos céus. Quem é como o Eterno nosso Deus, que Se assenta nas alturas e Se inclina para contemplar os céus e a terra.'
            }
        },
        'Bein Hashmashot': {
            paragraphs: [
                'Período crepuscular solene entre o pôr do sol, Shkiah, e a saída das estrelas, Tzeit HaKochavim.',
                'Considerado na Halachá como tempo de dúvida entre o dia e a noite, aplicando-se preventivamente todas as proibições estritas do Shabat e Yom Tov desde o seu início.',
                'Momento sagrado de transição no qual a Criação passa da luz visível do dia para o recolhimento celestial da noite.'
            ],
            prayer: {
                hebrew: 'הַשְׁכִּיבֵנוּ יְהֹוָה אֱלֹהֵינוּ לְשָׁלוֹם, וְהַעֲמִידֵנוּ מַלְכֵּנוּ לְחַיִּים, וּפְרוֹשׂ עָלֵינוּ סֻכַּת שְׁלוֹמֶךָ, וְתַקְּנֵנוּ בְּעֵצָה טוֹבָה מִלְּפָנֶיךָ, וְהוֹשִׁיעֵנוּ לְמַעַן שְׁמֶךָ, וְהָגֵן בַּעֲדֵנוּ, וְהָסֵר מֵעָלֵינוּ אוֹיֵב, דֶּבֶר, וְחֶרֶב, וְרָעָב, וְיָגוֹן, וְהָסֵר שָׂטָן מִלְּפָנֵינוּ וּמֵאַחֲרֵינוּ, וּבְצֵל כְּנָפֶיךָ תַּסְתִּירֵנוּ, כִּי אֵל שׁוֹמְרֵנוּ וּמַצִּילֵנוּ אָתָּה, כִּי אֵל מֶלֶךְ חַנּוּן וְרַחוּם אָתָּה. וּשְׁמוֹר צֵאתֵנוּ וּבוֹאֵנוּ לְחַיִּים וּלְשָׁלוֹם מֵעַתָּה וְעַד עוֹלָם. בָּרוּךְ אַתָּה יְהֹוָה, הַפּוֹרֵשׂ סֻכַּת שָׁלוֹם עָלֵינוּ וְעַל כָּל עַמּוֹ יִשְׂרָאֵל וְעַל יְרוּשָׁלָיִם׃',
                translit: 'Hashkiveinu Adonai Eloheinu leshalom, veha\'amideinu malkeinu lechayim, ufros aleinu sukat shelomecha, vetakneinu be\'eitzah tovah milefaneicha, vehoshieinu lema\'an shemecha, vehagen ba\'adeinu, vehaser me\'aleinu oyev, dever, vecherev, vera\'av, veyagon, vehaser satan milefaneinu ume\'achoreinu, uvetzel kenafecha tastireinu, ki El shomreinu vematzileinu Atah, ki El Melech chanun verachum Atah. Ushmor tzeiteinu uvo\'einu lechayim uleshalom me\'atah ve\'ad olam. Baruch Atah Adonai, haporeis sukat shalom aleinu ve\'al kol amo Yisrael ve\'al Yerushalayim.',
                translation: 'Faz-nos deitar, ó Eterno nosso Deus, em paz, e ergue-nos, ó nosso Rei, para a vida, e estende sobre nós a tenda da Tua paz. Guia-nos com bons conselhos da Tua presença e salva-nos por amor do Teu Nome. Defende-nos e afasta de nós o inimigo, a peste, a espada, a fome e a angústia. Remove o obstáculo da nossa frente e de trás de nós, e abriga-nos sob a sombra das Tuas asas, pois Tu és o Deus que nos guarda e liberta, e Tu és um Deus e Rei gracioso e misericordioso. Guarda a nossa saída e a nossa entrada para a vida e para a paz, desde agora e para todo o sempre. Bendito és Tu, Eterno, que estendes o abrigo da paz sobre nós, sobre todo o Teu povo Israel e sobre Jerusalém.'
            }
        },
        'Tzeit HaTanya': {
            paragraphs: [
                'Saída das estrelas e entrada definitiva da noite segundo a decisão haláchica do Baal HaTanya no Shulchan Aruch HaRav.',
                'Assinala o início do novo dia hebraico para todas as obrigações noturnas, incluindo a recitação com bênçãos do Shemá de Arvit e a contagem do Omer.',
                'Calculado com base no intervalo de tempo sazonal correspondente ao término do crepúsculo na tradição chassídica.'
            ],
            prayer: {
                hebrew: 'בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר בִּדְבָרוֹ מַעֲרִיב עֲרָבִים, בְּחָכְמָה פּוֹתֵחַ שְׁעָרִים, וּבִתְבוּנָה מְשַׁנֶּה עִתִּים, וּמַחֲלִיף אֶת הַזְּמַנִּים, וּמְסַדֵּר אֶת הַכּוֹכָבִים בְּמִשְׁמְרוֹתֵיהֶם בָּרָקִיעַ כִּרְצוֹנוֹ. בּוֹרֵא יוֹם וָלַיְלָה, גּוֹלֵל אוֹר מִפְּנֵי חֹשֶׁךְ וְחֹשֶׁךְ מִפְּנֵי אוֹר, וּמַעֲבִיר יוֹם וּמֵבִיא לַיְלָה, וּמַבְדִּיל בֵּין יוֹם וּבֵין לָיְלָה, יְהֹוָה צְבָאוֹת שְׁמוֹ. אֵל חַי וְקַיָּם, תָּמִיד יִמְלוֹךְ עָלֵינוּ לְעוֹלָם וָעֶד. בָּרוּךְ אַתָּה יְהֹוָה, הַמַּעֲרִיב עֲרָבִים׃',
                translit: 'Baruch Atah Adonai Eloheinu Melech HaOlam, asher bidvaro ma\'ariv aravim, bechochmah pote\'ach she\'arim, uvitvunah meshaneh itim, umachalif et hazmanim, umsader et hakochavim bemishmeroteihem barakia kirtzono. Borei yom valayla, golel or mipnei choshech vechoshech mipnei or, uma\'avir yom umevi layla, umavdil bein yom uvein layla, Adonai Tzeva\'ot shemo. El chai vekayam, tamid yimloch aleinu le\'olam va\'ed. Baruch Atah Adonai, hama\'ariv aravim.',
                translation: 'Bendito és Tu, Eterno nosso Deus, Rei do Universo, que pela Tua palavra trazes a noite, com sabedoria abres as portas celestes, com entendimento transformas os tempos, varias as estações e ordenas as estrelas nas suas vigílias no firmamento segundo a Tua vontade. Criador do dia e da noite, que afastas a luz perante as trevas e as trevas perante a luz, que fazes passar o dia e trazes a noite, e separas entre o dia e a noite; Eterno dos Exércitos é o Teu Nome. Deus vivo e eterno, reinará sempre sobre nós para todo o sempre. Bendito és Tu, Eterno, que trazes as noites.'
            }
        },
        'Tzeit Kochavim': {
            paragraphs: [
                'Surgimento no firmamento de três estrelas de magnitude média, com depressão solar de 7,083° abaixo da linha do horizonte.',
                'Marca o início canónico inequívoco da noite para todos os mandamentos da Torá, abrindo o novo dia civil e litúrgico no calendário hebraico.',
                'Momento em que se inicia a obrigação plena da oração noturna de Maariv e o cumprimento das mitzvot vigentes à noite.'
            ],
            prayer: {
                hebrew: 'בְּשֵׁם יְהֹוָה אֱלֹהֵי יִשְׂרָאֵל: מִימִינִי מִיכָאֵל, וּמִשְּׂמֹאלִי גַּבְרִיאֵל, וּמִלְּפָנַי אוֹרִיאֵל, וּמֵאַחֲרַי רְפָאֵל, וְעַל רֹאשִׁי שְׁכִינַת אֵל׃',
                translit: 'Beshem Adonai Elohei Yisrael: miyimini Michael, umismoli Gavriel, umilefanai Uriel, ume\'achorai Rafael, ve\'al roshi Shechinat El.',
                translation: 'Em Nome do Eterno, Deus de Israel: à minha direita Michael, à minha esquerda Gabriel, à minha frente Uriel, atrás de mim Rafael, e sobre a minha cabeça a Presença Divina, Shechiná.'
            }
        },
        'Tzeit 8.5°': {
            paragraphs: [
                'Padrão haláchico rigoroso de saída das estrelas, quando o centro do sol se encontra 8,5° abaixo do horizonte astronómico.',
                'Adotado universalmente por congregações e autoridades contemporâneas para o encerramento seguro do Shabat e festividades bíblicas sem risco de profanação.',
                'Garante o cumprimento integral do mandamento de Tosefet Shabbat, o acréscimo de tempo de santidade à saída do dia sagrado.'
            ],
            prayer: {
                hebrew: 'יֹשֵׁב בְּסֵתֶר עֶלְיוֹן, בְּצֵל שַׁדַּי יִתְלוֹנָן׃ אֹמַר לַיהוָה מַחְסִי וּמְצוּדָתִי, אֱלֹהַי אֶבְטַח־בּוֹ׃ כִּי הוּא יַצִּילְךָ מִפַּח יָקוּשׁ, מִדֶּבֶר הַוּוֹת׃ בְּאֶבְרָתוֹ יָסֶךְ לָךְ וְתַחַת־כְּנָפָיו תֶּחְסֶה, צִנָּה וְסֹחֵרָה אֲמִתּוֹ׃',
                translit: 'Yoshev beseter Elyon, betzel Shaddai yitlonan. Omar l\'Adonai machsi umtzudati, Elohai evtach bo. Ki Hu yatzilcha mipach yakush, midever havot. Be\'evrato yasech lach vetachat kenafav techseh, tzinah vesocherah amito.',
                translation: 'Aquele que habita no esconderijo do Altíssimo, à sombra do Omnipotente descansará. Digo ao Eterno: Ele é o meu refúgio e a minha fortaleza; o meu Deus, em quem confio. Pois Ele te livrará do laço do caçador e da peste perniciosa. Ele te cobrirá com as Suas penas, e sob as Suas asas encontrarás refúgio; a Sua verdade é escudo e broquel.'
            }
        },
        'Tzeit 42': {
            paragraphs: [
                'Saída das estrelas calculada pela passagem de 42 minutos fixos contados a partir do pôr do sol, Shkiah.',
                'Critério tradicional amplamente seguido em congregações sefarditas para a conclusão do dia civil e o início dos serviços noturnos.',
                'Assegura uma regra prática e constante para a observância comunitária.'
            ],
            prayer: {
                hebrew: 'בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עֹשֵׂה מַעֲשֵׂה בְרֵאשִׁית, שֶׁכֹּחוֹ וּגְבוּרָתוֹ מָלֵא עוֹלָם׃',
                translit: 'Baruch Atah Adonai Eloheinu Melech HaOlam, oseh ma\'aseh vereishit, shekocho ugvurato malei olam.',
                translation: 'Bendito és Tu, Eterno nosso Deus, Rei do Universo, Autor de toda a obra da criação, cujo poder e soberania preenchem o mundo inteiro.'
            }
        },
        'Tzeit 50': {
            paragraphs: [
                'Prazo estrito de 50 minutos solares após o pôr do sol, adotado como salvaguarda protetora em dias de jejum e conclusões litúrgicas.',
                'Garante que nenhuma estrela visível deixe de se manifestar no céu antes do término formal dos deveres sagrados.',
                'Padrão de cuidado e zelo comum em várias tradições comunitárias de Israel.'
            ],
            prayer: {
                hebrew: 'אָנָּא, בְּכֹחַ גְּדֻלַּת יְמִינְךָ תַּתִּיר צְרוּרָה. קַבֵּל רִנַּת עַמְּךָ, שַׂגְּבֵנוּ, טַהֲרֵנוּ, נוֹרָא. נָא גִבּוֹר, דּוֹרְשֵׁי יִחוּדְךָ כְּבָבַת שָׁמְרֵם. בָּרְכֵם, טַהֲרֵם, רַחֲמֵי צִדְקָתְךָ תָּמִיד גָּמְלֵם. חֲסִין קָדוֹשׁ, בְּרוֹב טוּבְךָ נַהֵל עֲדָתֶךָ. יָחִיד גֵּאֶה, לְעַמְּךָ פְּנֵה, זוֹכְרֵי קְדֻשָּׁתֶךָ. שַׁוְעָתֵנוּ קַבֵּל וּשְׁמַע צַעֲקָתֵנוּ, יוֹדֵעַ תַּעֲלוּמוֹת. בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד׃',
                translit: 'Ana, bechoach gedulat yemincha tatir tzrurah. Kabel rinat amecha, sagveinu, tahareinu, Nora. Na gibor, dorshei yichudcha kevavat shomrem. Barchem, taharem, rachamei tzidkat\'cha tamid gomlem. Chasin kadosh, berov tuvcha nahel adatecha. Yachid ge\'eh, le\'amcha pneh, zochrei kedushatecha. Shav\'ateinu kabel ushma tza\'akateinu, yode\'a ta\'alumot. Baruch shem kevod malchuto le\'olam va\'ed.',
                translation: 'Rogamos-Te: com a grandeza da Tua destra desata os nossos grilhões. Acolhe o cântico do Teu povo, exalta-nos e purifica-nos, ó Temível. Por favor, ó Poderoso, guarda como a pupila dos olhos aqueles que proclamam a Tua unidade. Abençoa-os, purifica-os e concede-lhes sempre a Tua justa misericórdia. Santo e Invencível, conduz a Tua congregação com a Tua abundante bondade. Único e Exaltado, volta-Te para o Teu povo que recorda a Tua santidade. Aceita as nossas súplicas e ouve o nosso clamor, Tu que conheces todos os mistérios. Bendito seja o Nome da glória do Seu reino para todo o sempre.'
            }
        },
        'Rabbeinu Tam': {
            paragraphs: [
                'Horário de saída da noite segundo a célebre decisão haláchica de Rabbeinu Tam, Rabi Yaakov ben Meir, neto de Rashi.',
                'Calculado com base no tempo de marcha de quatro milot, 72 minutos proporcionais ou sazonais após o pôr do sol, quando a escuridão noturna cobre completamente a terra.',
                'Considerado o padrão máximo de rigor, chumrah, para a conclusão do Shabat e Yom Tov, adotado por quem procura observar a Lei no mais elevado grau de exigência.'
            ],
            prayer: {
                hebrew: 'אַשְׁרֵי כָּל־יְרֵא יְהוָה, הַהֹלֵךְ בִּדְרָכָיו׃ יְגִיעַ כַּפֶּיךָ כִּי תֹאכֵל, אַשְׁרֶיךָ וְטוֹב לָךְ׃ אֶשְׁתְּךָ כְּגֶפֶן פֹּרִיָּה בְּיַרְכְּתֵי בֵיתֶךָ, בָּנֶיךָ כִּשְׁתִלֵי זֵיתִים סָבִיב לְשֻׁלְחָנֶךָ׃ הִנֵּה כִי־כֵן יְבֹרַךְ גָּבֶר, יְרֵא יְהוָה׃ יְבָרֶכְךָ יְהוָה מִצִּיּוֹן, וּרְאֵה בְּטוּב יְרוּשָׁלָ‍ִם כֹּל יְמֵי חַיֶּיךָ׃ וּרְאֵה־בָנִים לְבָנֶיךָ, שָׁלוֹם עַל־יִשְׂרָאֵל׃',
                translit: 'Ashrei kol yere Adonai, haholech bidrachav. Yegia kapeicha ki tochel, ashreicha vetov lach. Eshtecha kegefen poriyah beyarketei veitecha, baneicha kishtilei zeitim saviv leshulchanecha. Hinei chi chen yevorach gaver, yere Adonai. Yevarechecha Adonai miTzion, ure\'eh betov Yerushalayim kol yemei chayeicha. Ure\'eh vanim levaneicha, shalom al Yisrael.',
                translation: 'Feliz todo aquele que teme ao Eterno e anda nos Seus caminhos! Do trabalho das tuas mãos comerás, feliz serás e tudo te irá bem. A tua esposa será como videira frutífera no interior da tua casa; os teus filhos como rebentos de oliveira ao redor da tua mesa. Eis como será abençoado o homem que teme ao Eterno. O Eterno te abençoe desde Sião, para que vejas a prosperidade de Jerusalém todos os dias da tua vida, e vejas os filhos dos teus filhos. Paz sobre Israel!'
            }
        },
        'Hadlakat Nerot': {
            paragraphs: [
                'Acendimento solene das luzes sagradas que inauguram o Shabat ou Yom Tov, realizado habitualmente 18 minutos ou conforme o costume da comunidade antes do pôr do sol.',
                'Traz paz espiritual, serenidade e harmonia no lar, Shalom Bait, sendo uma das mitzvot mais queridas confiadas às filhas e famílias de Israel.',
                'Assinala o início da santificação do dia e o recolhimento pacífico perante o Eterno.'
            ],
            prayer: {
                hebrew: 'בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֺתָיו וְצִוָּנוּ לְהַדְלִיק נֵר שֶׁל שַׁבָּת קֹדֶשׁ׃',
                translit: 'Baruch Atah Adonai Eloheinu Melech HaOlam, asher kideshanu bemitzvotav vetzivanu lehadlik ner shel Shabbat Kodesh.',
                translation: 'Bendito és Tu, Eterno nosso Deus, Rei do Universo, que nos santificaste com os Teus mandamentos e nos ordenaste acender a vela do santo Shabat.'
            }
        },
        'Havdalá Shabat': {
            paragraphs: [
                'Cerimónia canónica de despedida do Shabat ou Yom Tov sobre uma taça de vinho, especiarias aromáticas e vela de fogo trançada.',
                'Assinala a separação solene, a Havdalá, entre o sagrado e o comum, entre a luz do dia santo e os seis dias de atividade da nova semana.',
                'Celebrada com cânticos de esperança e votos recíprocos de paz, saúde e boa semana, Shavua Tov.'
            ],
            prayer: {
                hebrew: 'בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַמַּבְדִּיל בֵּין קֹדֶשׁ לְחֹל, בֵּין אוֹר לְחֹשֶׁךְ, בֵּין יִשְׂרָאֵל לָעַמִּים, בֵּין יוֹם הַשְּׁבִיעִי לְשֵׁשֶׁת יְמֵי הַמַּעֲשֶׂה. בָּרוּךְ אַתָּה יְהֹוָה, הַמַּבְדִּיל בֵּין קֹדֶשׁ לְחֹל׃',
                translit: 'Baruch Atah Adonai Eloheinu Melech HaOlam, hamavdil bein kodesh lechol, bein or lechoshech, bein Yisrael la\'amim, bein yom hashevii lesheshet yemei hama\'aseh. Baruch Atah Adonai, hamavdil bein kodesh lechol.',
                translation: 'Bendito és Tu, Eterno nosso Deus, Rei do Universo, que fazes separação entre o sagrado e o comum, entre a luz e as trevas, entre Israel e os povos, entre o sétimo dia e os seis dias de trabalho. Bendito és Tu, Eterno, que fazes distinção entre o sagrado e o comum.'
            }
        }
    };

    const createZmanDescriptionHTML = (label, desc, time, isTomorrow) => {
        const itemData = ZMANIM_KNOWLEDGE[label] || ZMANIM_KNOWLEDGE[label.replace('Plag Mincha', 'Plag HaMincha')] || {
            paragraphs: [
                `${label} - ${desc} é um dos momentos sagrados do ciclo litúrgico diário calculado com precisão astronómica para ${locName}.`,
                `Momento litúrgico calculado com base no ciclo solar diário e nas determinações haláchicas vigentes para ${locName}.`
            ],
            prayer: null
        };
        const paragraphs = itemData.paragraphs || (Array.isArray(itemData) ? itemData : []);
        const prayer = itemData.prayer;

        return `
            <div class="levels-container" style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                ${paragraphs.map(description => `
                    <div class="info-modal-card">
                        <div class="info-modal-value" style="font-weight: 400; font-size: var(--font-size-sm); line-height: 1.6; text-align: left; white-space: normal;">
                            ${description}
                        </div>
                    </div>
                `).join('')}
                ${prayer ? `
                    <div class="info-modal-card" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px;">
                        <div class="info-modal-value" style="font-size: 1.1em; line-height: 1.5; text-align: right; width: 100%;" dir="rtl">
                            <span class="hebrew-text">${prayer.hebrew}</span>
                        </div>
                        <div class="info-modal-value" style="font-size: var(--font-size-xs); font-style: italic; color: var(--text-muted); text-align: left;">
                            ${prayer.translit}
                        </div>
                        <div class="info-modal-value" style="font-size: var(--font-size-sm); line-height: 1.6; text-align: left;">
                            ${prayer.translation}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    };

    return `
        <div class="calendar-modal-content" style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
            <ul class="legend-list" style="padding: 0; margin: 0; list-style: none; display: flex; flex-direction: column; gap: 8px;">
                ${processedItems.map(item => {
                    const desc = formatTwoWords(item.desc);
                    const infoHtml = createZmanDescriptionHTML(item.label, desc, item.time, item.isTomorrow);
                    const safeInfoHtml = infoHtml.replace(/"/g, '&quot;');
                    const safeLabel = item.label.replace(/"/g, '&quot;');
                    const descText = item.time;

                    return `
                        <li class="settings-card event-card glass-panel info-trigger"
                            data-info-title="${safeLabel}"
                            data-info-html="${safeInfoHtml}"
                            tabindex="0"
                            role="button"
                            aria-label="${safeLabel}"
                            style="cursor: pointer;">
                            <div class="settings-card-left">
                                <i class="${item.icon} settings-icon"></i>
                                <div class="settings-card-text">
                                    <span class="settings-card-title">${item.label}</span>
                                    <span class="settings-card-desc">${descText}</span>
                                </div>
                            </div>
                            <div class="card-arrow-action" aria-hidden="true">
                                <i class="fa-solid fa-arrow-right"></i>
                            </div>
                        </li>
                    `;
                }).join('')}
            </ul>
        </div>
    `;
}

