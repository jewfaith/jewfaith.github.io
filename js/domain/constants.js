export const BOOK_MAP = {
    'Genesis': 'Bereshit',
    'Exodus': 'Shemot',
    'Leviticus': 'Vayikra',
    'Numbers': 'Bamidbar',
    'Deuteronomy': 'Devarim',
    'Joshua': 'Yehoshua',
    'Judges': 'Shoftim',
    'II Samuel': 'II Shmuel',
    'I Samuel': 'I Shmuel',
    '2 Samuel': 'II Shmuel',
    '1 Samuel': 'I Shmuel',
    'II Kings': 'II Melachim',
    'I Kings': 'I Melachim',
    '2 Kings': 'II Melachim',
    '1 Kings': 'I Melachim',
    'Isaiah': 'Yeshayahu',
    'Jeremiah': 'Yirmiyahu',
    'Ezekiel': 'Yechezkel',
    'Hosea': 'Hoshea',
    'Joel': 'Yoel',
    'Amos': 'Amos',
    'Obadiah': 'Ovadia',
    'Jonah': 'Yona',
    'Micah': 'Micha',
    'Nahum': 'Nachum',
    'Habakkuk': 'Chavakuk',
    'Zephaniah': 'Tzefania',
    'Haggai': 'Chagai',
    'Zechariah': 'Zecharia',
    'Malachi': 'Malachi',
    'Psalms': 'Tehilim',
    'Proverbs': 'Mishlei',
    'Job': 'Iyov',
    'Song of Solomon': 'Shir HaShirim',
    'Song of Songs': 'Shir HaShirim',
    'Ruth': 'Ruth',
    'Lamentations': 'Eichah',
    'Ecclesiastes': 'Kohelet',
    'Esther': 'Esther',
    'Daniel': 'Daniel',
    'Ezra': 'Ezra',
    'Nehemiah': 'Nechemia',
    'II Chronicles': 'II Divrei Hayamim',
    'I Chronicles': 'I Divrei Hayamim',
    '2 Chronicles': 'II Divrei Hayamim',
    '1 Chronicles': 'I Divrei Hayamim',
    'Chronicles': 'Divrei Hayamim'
};

export const HEBREW_MONTHS_PT = {
    "Nisan": "Aviv",
    "Iyyar": "Ziv",
    "Sivan": "Sivan",
    "Tammuz": "Tamuz",
    "Av": "Av",
    "Elul": "Elul",
    "Tishrei": "Etanim",
    "Cheshvan": "Bul",
    "Kislev": "Kislev",
    "Tevet": "Tevet",
    "Sh'vat": "Shevat",
    "Shvat": "Shevat",
    "Adar I": "Adar I",
    "Adar II": "Adar II",
    "Adar": "Adar"
};

export const FESTIVAL_RANGES = {
    'Rosh Chodashim': '1 Aviv',
    'Yom Pessach': '14 Aviv',
    'Chag Matzot': '15 - 21 Aviv',
    'Pessach Sheni': '14 Ziv',
    'Yom Shavuot': '6 Sivan',
    'Yom Teruah': '1 Etanim',
    'Yom Kippur': '10 Etanim',
    'Chag Sukkot': '15 - 21 Etanim',
    'Shemini Atzeret': '22 Etanim',
    'Simchat Torah': '22 Etanim',
    'Chag Hanukkah': '25 Kislev - 2 Tevet',
    'Yom Purim': '14 Adar',
    'Ta\'anit Esther': '13 Adar',
    'Tzom Tammuz': '17 Tamuz',
    'Tisha B\'Av': '9 Av',
    'Tzom Gedaliah': '3 Etanim',
    'Tzom Tevet': '10 Tevet'
};

/**
 * Função de normalização para ignorar acentos, espaços duplos e maiúsculas
 */
export function normalizeFestivalKey(key) {
    if (!key) return '';
    return key
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ''); // Mantém apenas letras e números
}

/**
 * Mapeamento de apelidos e variações de nomes para as chaves principais
 */
export const FESTIVAL_ALIASES = {
    'Shabbat': 'Yom Shabbat',
    'Passover': 'Yom Pessach',
    'Pesach': 'Yom Pessach',
    'Matzot': 'Chag Matzot',
    'Unleavened Bread': 'Chag Matzot',
    'Shavuot': 'Yom Shavuot',
    'Pentecost': 'Yom Shavuot',
    'Rosh Hashanah': 'Yom Teruah',
    'Rosh Hashana': 'Yom Teruah',
    'Yom Teru\'ah': 'Yom Teruah',
    'Kippur': 'Yom Kippur',
    'Sukkot': 'Chag Sukkot',
    'Tabernacles': 'Chag Sukkot',
    'Hanukkah': 'Chag Chanukah',
    'Chanukah': 'Chag Chanukah',
    'Purim': 'Yom Purim',
    'Fast of Esther': 'Ta\'anit Esther',
    'Fast of Tammuz': 'Tzom Tammuz',
    '17 of Tammuz': 'Tzom Tammuz',
    'Fast of Gedaliah': 'Tzom Gedaliah',
    'Fast of Tevet': 'Tzom Tevet',
    '10 of Tevet': 'Tzom Tevet'
};

export function getFestivalDateRangeText(eventName, rawHdate) {
    if (eventName && FESTIVAL_RANGES[eventName]) {
        return FESTIVAL_RANGES[eventName];
    }
    if (rawHdate) {
        const parts = rawHdate.split(' ');
        if (parts.length >= 2) {
            const day = parts[0];
            const monthRaw = parts.slice(1, -1).join(' ') || parts[1];
            const monthPT = HEBREW_MONTHS_PT[monthRaw] || monthRaw;
            return `${day} ${monthPT}`;
        }
    }
    return '';
}

export const FESTIVAL_CATS = [
    'pesach', 'matzot', 'shavuot', 'roshhashana', 'yomkippur',
    'sukkot', 'sheminiatzeret', 'simchattorah'
];

export const FESTIVAL_TORAH_READINGS = {
    'pesach': ['Shemot 12:21-51'],
    'matzot': [
        'Shemot 12:21-51',
        'Vayikra 22:26-23:44',
        'Bamidbar 28:19-25',
        'Bamidbar 28:19-25',
        'Bamidbar 28:19-25',
        'Bamidbar 28:19-25',
        'Shemot 13:17-15:26',
        'Devarim 15:19 - 16:17'
    ],
    'shavuot': [
        'Shemot 19:1-20:23',
        'Devarim 15:19 - 16:17'
    ],
    'roshhashana': [
        'Bereshit 21:1-34',
        'Bereshit 22:1-24'
    ],
    'yomkippur': ['Vayikra 16:1-34'],
    'sukkot': [
        'Vayikra 22:26-23:44',
        'Vayikra 22:26-23:44',
        'Bamidbar 29:17-22',
        'Bamidbar 29:20-25',
        'Bamidbar 29:23-28',
        'Bamidbar 29:26-31',
        'Bamidbar 29:26-34',
    ],
    'sheminiatzeret': [
        'Devarim 14:22 - 16:17',
        'Devarim 33:1 - 34:12'
    ],
};

export const FESTIVAL_HAFTARA_READINGS = {
    'pesach': ['Yehoshua 5:2 - 6:1'],
    'matzot': [
        'Yehoshua 5:2 - 6:1',
        'II Melachim 23:1-9,21-25',
        'Yechezkel 37:1-14',
        'Yechezkel 37:1-14',
        'Yechezkel 37:1-14',
        'Yechezkel 37:1-14',
        'II Shmuel 22:1-51',
        'Yeshayahu 10:32 - 12:6',
    ],
    'shavuot': [
        'Yechezkel 1:1-28, 3:12',
        'Chavakuk 2:20 - 3:19'
    ],
    'roshhashana': [
        'I Shmuel 1:1-2:10',
        'Yirmiyahu 31:1-19'
    ],
    'yomkippur': ['Yeshayahu 57:14-58:14'],
    'sukkot': [
        'Zecharia 14:1-21',
        'I Melachim 8:2-21',
        'Yechezkel 38:18-39:7',
        'Yechezkel 38:18-39:7',
        'Yechezkel 38:18-39:7',
        'Yechezkel 38:18-39:7',
        'Yechezkel 38:18-39:7',
    ],
    'sheminiatzeret': [
        'I Melachim 8:54-66',
        'Yehoshua 1:1-18'
    ],
};

export const KETUVIM_BOOKS = [
    { name: 'Tehilim', chapters: 150, weight: 41 },
    { name: 'Mishlei', chapters: 31, weight: 9 },
    { name: 'Iyov', chapters: 42, weight: 12 },
    { name: 'Shir HaShirim', chapters: 8, weight: 2 },
    { name: 'Ruth', chapters: 4, weight: 1 },
    { name: 'Eichah', chapters: 5, weight: 1 },
    { name: 'Kohelet', chapters: 12, weight: 3 },
    { name: 'Esther', chapters: 10, weight: 3 },
    { name: 'Daniel', chapters: 12, weight: 3 },
    { name: 'Ezra', chapters: 10, weight: 3 },
    { name: 'Nechemia', chapters: 13, weight: 4 },
    { name: 'Divrei Hayamim', chapters: 65, weight: 18 }
];
export const KETUVIM_TOTAL_WEIGHT = KETUVIM_BOOKS.reduce((sum, b) => sum + b.weight, 0);

export const FESTIVAL_TEHILIM = {
    shabbat: ['Tehilim 23', 'Tehilim 92', 'Tehilim 104', 'Tehilim 93'],
    pesach: ['Tehilim 78', 'Tehilim 105', 'Tehilim 107', 'Tehilim 113', 'Tehilim 114', 'Tehilim 115', 'Tehilim 116', 'Tehilim 117', 'Tehilim 118', 'Tehilim 136'],
    matzot: ['Tehilim 66', 'Tehilim 77', 'Tehilim 105', 'Tehilim 106', 'Tehilim 114', 'Tehilim 115', 'Tehilim 116', 'Tehilim 117', 'Tehilim 118'],
    shavuot: ['Tehilim 19', 'Tehilim 68', 'Tehilim 119'],
    roshchodesh: ['Tehilim 81', 'Tehilim 104', 'Tehilim 121', 'Tehilim 150'],
    roshhashana: ['Tehilim 24', 'Tehilim 27', 'Tehilim 47', 'Tehilim 81', 'Tehilim 93', 'Tehilim 98', 'Tehilim 130'],
    yomkippur: ['Tehilim 25', 'Tehilim 32', 'Tehilim 51', 'Tehilim 86', 'Tehilim 103', 'Tehilim 130'],
    sukkot: ['Tehilim 27', 'Tehilim 42', 'Tehilim 43', 'Tehilim 84', 'Tehilim 113', 'Tehilim 114', 'Tehilim 115', 'Tehilim 116', 'Tehilim 117', 'Tehilim 118'],
    sheminiatzeret: ['Tehilim 8', 'Tehilim 19', 'Tehilim 104', 'Tehilim 119']
};

export const FESTIVAL_TEHILIM_NUMBERS = [
    ...new Set(
        Object.values(FESTIVAL_TEHILIM)
            .flat()
            .map(name => Number(name.replace('Tehilim ', '')))
            .filter(Number.isInteger)
    )
];

const FESTIVAL_TEHILIM_EXCLUDED_NUMBERS = new Set(
    FESTIVAL_TEHILIM_NUMBERS
        .flatMap(number => [number - 1, number, number + 1])
        .filter(number => number >= 1 && number <= 150)
);

export const AVAILABLE_TEHILIM = Array.from({ length: 150 }, (_, i) => i + 1)
    .filter(chapter => !FESTIVAL_TEHILIM_EXCLUDED_NUMBERS.has(chapter));

export const FESTIVAL_DESCRIPTIONS = {

    'Yom Shabbat': [
        'É um mandamento da Torá que estabelece o sétimo dia como um tempo separado para descanso, santidade e proximidade com D\'us, constituindo também um sinal especial entre D\'us e Israel.',
        'Torá ordena que o sétimo dia seja santificado e que o trabalho comum seja interrompido. Shemot 31:12-17 apresenta o Shabbat como um sinal entre D\'us e Israel, mostrando que a sua observância possui uma importância especial dentro da aliança.',
        'Os Neviim apresentam o Shabbat como uma expressão de fidelidade a D\'us. Yeshayahu 56:2-7 promete bênção àqueles que guardam o Shabbat, enquanto Yeshayahu 58:13-14 descreve o dia como uma ocasião para honrar e encontrar prazer na presença de D\'us.',
        'Nos Ketuvim, o Shabbat aparece ligado ao louvor e à santidade. Tehillim 92 é apresentado como um cântico para o Shabbat, enquanto Nechemyah 13:15-22 descreve os esforços para impedir que o dia fosse tratado como um dia comum.',
        'A tradição rabínica desenvolveu detalhadamente as leis do Shabbat. A Mishnah Shabbat 7:2 apresenta as principais categorias de trabalho proibido, enquanto o Talmud Shabbat 73a-75b discute os seus limites e aplicações.',
        'Na tradição do Sod, o Shabbat é associado a uma dimensão elevada de santidade, descanso e proximidade com a presença divina. O Zohar II, 88a-89a descreve o Shabbat como um momento de união e descanso espiritual.'
    ],

    'Pessach Sheni': [
        'É um mandamento da Torá que estabelece uma segunda oportunidade para cumprir o Pessach quando alguém esteve impedido de participar na celebração original.',
        'Torá estabelece Pessach Sheni como uma oportunidade para cumprir o mandamento de Pessach depois da data original. Bamidbar 9:9-12 determina que aqueles que estavam impedidos de participar no primeiro Pessach poderiam celebrá-lo no décimo quarto dia do segundo mês.',
        'Não existe uma referência direta a Pessach Sheni nos Neviim. No entanto, a ideia de retorno depois de um período de afastamento aparece frequentemente na mensagem profética. Yeshayahu 55:6-7 chama aqueles que se afastaram a regressar para D\'us.',
        'Os Ketuvim apresentam várias situações em que uma pessoa procura novamente a proximidade de D\'us depois de uma situação de afastamento. Tehillim 51:12-14 expressa esse desejo de restauração e renovação espiritual.',
        'A tradição rabínica discute quem deve celebrar Pessach Sheni e quais circunstâncias justificam a sua celebração. O Talmud Pesachim 93a-95a analisa estas situações e compara Pessach Sheni com o Pessach celebrado no primeiro mês.',
        'Na tradição do Sod, Pessach Sheni pode ser entendido como uma imagem de segunda oportunidade e retificação. A pessoa que não conseguiu cumprir algo no momento original ainda pode encontrar um caminho de retorno e correção, ideia desenvolvida na literatura mística e associada ao processo de teshuvah.'
    ],

    'Yom Pessach': [
        'É uma festa da Torá que recorda a libertação de Israel da escravidão no Egito e está ligada ao sacrifício de Pessach e à memória da saída do Egito.',
        'Torá ordena que o sacrifício de Pessach seja realizado no décimo quarto dia do primeiro mês. Shemot 12:5-14 descreve o cordeiro, o sangue colocado nas portas e a refeição realizada naquela noite, enquanto Vayikra 23:5 confirma a data da celebração.',
        'Os Neviim recordam repetidamente o Êxodo como uma das maiores demonstrações da fidelidade de D\'us para com Israel. Yirmeyahu 16:14-15 utiliza a saída do Egito como referência para uma futura redenção, mostrando a importância permanente desse acontecimento.',
        'Nos Ketuvim, a saída do Egito é recordada através de cânticos e relatos históricos. Tehillim 78:12-16 descreve os milagres realizados no Egito e no deserto, enquanto Tehillim 114 apresenta a saída de Israel como um acontecimento extraordinário diante da presença de D\'us.',
        'A tradição rabínica desenvolveu extensamente as leis relacionadas com Pessach. A Mishnah Pesachim 5:5-10 descreve o serviço do sacrifício, enquanto Pesachim 58a-61b discute vários detalhes relacionados com a sua preparação e realização.',
        'Na tradição do Sod, o Êxodo representa mais do que a libertação física de uma nação. O Zohar II, 40b-41a interpreta a saída do Egito como uma passagem da escravidão para a liberdade espiritual e como o início de uma transformação na relação entre D\'us e Israel.'
    ],

    'Chag Matzot': [
        'É uma festa da Torá dedicada à memória da saída de Israel do Egito, marcada pela remoção do chametz e pelo consumo de matzah durante sete dias.',
        'Torá ordena que durante sete dias não exista chametz nas casas e que a matzah seja comida. Shemot 13:3-7 relaciona esta prática com a saída do Egito, enquanto Vayikra 23:6-8 estabelece os primeiros e últimos dias como ocasiões sagradas.',
        'Os Neviim utilizam o Êxodo como uma das principais provas da relação entre D\'us e Israel. Hoshea 11:1 recorda que D\'us chamou o Seu filho para fora do Egito, enquanto Yirmeyahu 16:14-15 utiliza essa libertação como referência para uma futura redenção.',
        'Nos Ketuvim, a saída do Egito é recordada como um acontecimento fundamental da história de Israel. Tehillim 105:36-43 descreve a libertação do povo e a sua condução pelo deserto, enquanto Tehillim 114 celebra a saída do Egito perante a presença de D\'us.',
        'A tradição rabínica desenvolveu detalhadamente as leis de chametz e matzah. A Mishnah Pesachim 2:1-7 discute a proibição do chametz, enquanto Pesachim 35a-38b analisa os requisitos para que a matzah possa cumprir o mandamento.',
        'Na tradição do Sod, a matzah é associada à simplicidade e à humildade, enquanto o chametz pode representar aquilo que cresce e se expande. O Zohar II, 182a-183b relaciona a remoção do chametz com uma forma de purificação e libertação espiritual.'
    ],

    'Yom Shavuot': [
        'É uma festa da Torá que encerra a contagem das sete semanas e está ligada às primícias, à colheita e à alegria perante D\'us. A associação com a entrega da Torá no Sinai pertence à tradição posterior.',
        'Torá ordena contar sete semanas completas e depois celebrar uma convocação santa. Vayikra 23:15-21 estabelece a festa e as suas ofertas, enquanto Devarim 16:9-12 relaciona Shavuot com a alegria, as primícias e a memória da escravidão no Egito.',
        'Os Neviim desenvolvem o tema da aliança e da fidelidade à vontade de D\'us. Yirmeyahu 31:31-33 fala de uma futura aliança em que a Torá estará colocada no interior do povo, aproximando-se do significado que a tradição atribuiu posteriormente a Shavuot.',
        'O Livro de Ruth está tradicionalmente associado a Shavuot. A história acontece durante a época da colheita e mostra Ruth, uma mulher de Moav, a unir-se ao povo de Israel e ao D\'us de Israel, como descrito em Ruth 1:16-17.',
        'A tradição rabínica associa Shavuot à entrega da Torá no Sinai. O Talmud Shabbat 86b-88a discute a data da revelação e descreve acontecimentos relacionados com a experiência de Israel perante o Sinai.',
        'Na tradição do Sod, Shavuot representa a passagem entre a libertação e a revelação. O Zohar II, 98a apresenta a festa como um momento de ligação entre Israel, a Torá e a presença divina.'
    ],

    'Yom Teruah': [
        'É uma festa da Torá marcada por descanso, convocação santa e teruah no primeiro dia do sétimo mês. A designação posterior de Rosh Hashanah pertence à tradição desenvolvida posteriormente.',
        'Torá determina que o primeiro dia do sétimo mês seja um dia de descanso e convocação santa. Bamidbar 29:1-6 acrescenta as ofertas específicas desse dia e descreve-o como um dia de teruah.',
        'Nos Neviim, o shofar aparece como instrumento de alerta e convocação. Yechezkel 33:3-6 descreve o toque do shofar como um aviso perante o perigo, enquanto Yoel 2:1 utiliza o seu som para chamar o povo à atenção diante do dia de D\'us.',
        'Nos Ketuvim, o shofar aparece associado ao louvor e à manifestação do poder divino. Tehillim 47:5-6 relaciona o seu som com a ascensão e a realeza de D\'us, enquanto Tehillim 81:4-5 associa o toque do shofar ao calendário de Israel.',
        'A tradição rabínica desenvolveu detalhadamente as leis do shofar. A Mishnah Rosh Hashanah 3:1-8 discute o instrumento e os sons utilizados, enquanto Rosh Hashanah 26b-34b analisa a forma correta de cumprir a obrigação.',
        'Na tradição do Sod, o som do shofar representa um despertar espiritual. O Zohar III, 18a-19b associa o toque do shofar ao despertar da consciência e ao retorno da pessoa perante D\'us.'
    ],

    'Yom Kippur': [
        'É uma festa da Torá dedicada à expiação perante D\'us, marcada por descanso completo, aflição da alma e uma observância especial de santidade.',
        'Torá determina que Yom Kippur seja observado no décimo dia do sétimo mês. O povo deve interromper o trabalho e afligir a alma, enquanto Vayikra 16 descreve o serviço de expiação realizado pelo Sumo Sacerdote no Mishkan e, posteriormente, no Templo.',
        'Os Neviim ensinam que o jejum deve ser acompanhado por uma transformação real da vida. Yeshayahu 58:3-9 critica um jejum sem justiça e mostra que D\'us procura também libertação dos oprimidos, generosidade e mudança de comportamento.',
        'Nos Ketuvim, a confissão e o arrependimento aparecem como formas de procurar novamente a proximidade de D\'us. Tehillim 51:3-12 apresenta David reconhecendo o seu pecado e pedindo purificação interior.',
        'A tradição rabínica desenvolveu detalhadamente as leis de Yom Kippur. A Mishnah Yoma 1:1-9 descreve a preparação do Sumo Sacerdote, enquanto Yoma 73b-88a discute o jejum, as proibições do dia, o arrependimento e a expiação.',
        'Na tradição do Sod, Yom Kippur representa um momento de purificação profunda e retorno espiritual. O Zohar III, 100b-103a descreve a importância espiritual do dia e a sua relação com a purificação de Israel.'
    ],

    'Chag Sukkot': [
        'É uma festa da Torá marcada pela alegria perante D\'us e pela memória da proteção de Israel durante a passagem pelo deserto, sendo também conhecida pela habitação em sukkot durante sete dias.',
        'Torá ordena que Israel habite em sukkot durante sete dias e se alegre perante D\'us. Também estabelece o uso das quatro espécies durante a celebração. Vayikra 23:39-43 relaciona a festa tanto com a alegria como com a memória da proteção de D\'us no deserto.',
        'Os Neviim utilizam imagens de abrigo, proteção e restauração que ajudam a compreender o simbolismo de Sukkot. Amos 9:11 fala da restauração da sukkah de David, enquanto Zecharyah 14:16-19 apresenta Sukkot numa visão futura envolvendo as nações.',
        'Nos Ketuvim, a proteção de D\'us aparece repetidamente como motivo de confiança. Tehillim 27:5 fala de D\'us escondendo a pessoa no Seu abrigo, enquanto Tehillim 121:5-8 descreve D\'us como aquele que guarda o Seu povo.',
        'A tradição rabínica desenvolveu as leis da sukkah e das quatro espécies. A Mishnah Sukkah 1:1-11 discute a estrutura da sukkah, enquanto Sukkah 2a-28b analisa as condições necessárias para cumprir o mandamento.',
        'Na tradição do Sod, a sukkah é associada à proteção da presença divina. O Zohar III, 100b-103a desenvolve a ideia de que a sukkah representa uma proteção espiritual que envolve aqueles que entram nela durante a festa.'
    ],

    'Shemini Atzeret': [
        'É uma festa da Torá que ocorre no oitavo dia após Sukkot e constitui uma convocação santa própria, distinta dos sete dias anteriores da festa.',
        'Torá determina que o oitavo dia seja uma assembleia santa e um dia de descanso. Bamidbar 29:35-38 descreve as ofertas próprias deste dia, enquanto Vayikra 23:36 o apresenta como uma convocação santa adicional depois de Sukkot.',
        'Os Neviim apresentam a reunião de Israel perante D\'us como expressão de unidade e restauração. Yechezkel 37:21-28 fala da reunião dos descendentes de Israel e da sua futura unidade perante D\'us.',
        'Nos Ketuvim, a reunião perante D\'us aparece ligada ao louvor e à alegria. Tehillim 122:1-4 descreve a alegria de subir para Jerusalém e estar reunido entre o povo de D\'us.',
        'A tradição rabínica distingue Shemini Atzeret de Sukkot em várias questões legais. Sukkah 55b-56a discute a relação entre os dois períodos e apresenta diferenças específicas relativas às ofertas e às obrigações do dia.',
        'Na tradição do Sod, Shemini Atzeret representa uma permanência especial depois da experiência de Sukkot. O Zohar III, 104b apresenta o oitavo dia como um momento de proximidade particular entre D\'us e o Seu povo.'
    ],

    'Sefirat Omer': [
        'É um mandamento da Torá que consiste na contagem de sete semanas entre Pessach e Shavuot, estabelecendo um período de preparação e ligação entre as duas celebrações.',
        'Torá ordena contar sete semanas completas a partir da apresentação do Omer. Depois da contagem, Israel celebra Shavuot e apresenta novas ofertas perante D\'us. Vayikra 23:15-21 e Devarim 16:9-12 estabelecem esta ligação entre a contagem e a festa.',
        'Os Neviim não descrevem diretamente a prática posterior de contar cada dia do Omer. No entanto, apresentam frequentemente a espera e a preparação como partes importantes da relação entre Israel e D\'us. Yirmeyahu 31:31-33 fala de uma futura renovação da aliança.',
        'Nos Ketuvim, a espera perante D\'us aparece como uma experiência de confiança e preparação. Tehillim 130:5-6 descreve a alma esperando por D\'us e pela Sua palavra, criando um paralelo espiritual com o período de contagem.',
        'A tradição rabínica discute a obrigação de contar o Omer e os detalhes da contagem diária. Menachot 65b-66a analisa a prática e as diferentes interpretações sobre a natureza da obrigação.',
        'Na tradição do Sod, os dias da contagem podem ser vistos como etapas de refinamento interior. O Zohar III, 97b associa este período à preparação espiritual para receber uma dimensão mais elevada de revelação.'
    ],

    'Rosh Chodashim': [
        'É uma designação estabelecida pela Torá para o princípio dos meses, identificando Aviv como o primeiro mês do ano bíblico e estabelecendo a sua posição na organização dos tempos determinados por D\'us.',
        'Torá declara em Shemot 12:2 que este mês será o princípio dos meses e o primeiro dos meses do ano. Assim, Aviv é estabelecido como o primeiro mês na ordem do calendário bíblico, ligado diretamente à libertação de Israel do Egito.',
        'Nos Neviim, a contagem dos meses continua integrada à vida de Israel e à observância dos tempos determinados por D\'us. A ordem estabelecida em Aviv permanece como referência do calendário sagrado e da aliança.',
        'Nos Ketuvim, os meses aparecem associados aos ciclos de Israel, às suas celebrações e à organização do tempo. A instituição de Aviv como primeiro mês recorda a libertação do Egito e a nova ordem estabelecida para o povo.',
        'O tratado de Rosh Hashanah 1:1 distingue diferentes inícios de ano segundo a sua finalidade. Nisan, correspondente a Aviv, é considerado o início do ano para os reis e para a ordem das festas de peregrinação.',
        'Na dimensão do Sod, o primeiro mês representa a renovação do ciclo e o despertar de uma nova ordem. Aviv está associado à passagem da servidão para a liberdade e ao início de um novo ciclo espiritual para Israel.'
    ],

    'Rosh Chodesh': [
        'É um mandamento da Torá celebrado estritamente como 1 único dia no primeiro dia de cada novo mês hebraico, marcando a renovação da lua e a organização do calendário sagrado de Israel.',
        'Torá determina que o início de cada mês seja santificado no primeiro dia. Shemot 12:1-2 e Bamidbar 28:11-15 estabelecem que no princípio de cada mês se apresente celebração perante D\'us, constituindo sempre um único dia sagrado de renovação.',
        'Os Neviim mencionam Rosh Chodesh juntamente com o Shabbat e as ocasiões sagradas. Yeshayahu 66:23 descreve um futuro em que toda a humanidade virá perante D\'us em cada novo mês e em cada Shabbat.',
        'Nos Ketuvim, Rosh Chodesh aparece relacionado com o culto do Templo. I Divrei Hayamim 23:31 inclui os novos meses entre as ocasiões sagradas, enquanto Tehillim 81:4-5 relaciona o novo mês com o calendário de Israel.',
        'A tradição talmúdica debateu a determinação visual da lua nova e a adição de um segundo dia de incerteza na diáspora, mas a base bíblica permanece no primeiro dia de cada mês.',
        'Na tradição do Sod, a lua nova no primeiro dia simboliza o renascimento contínuo da alma e a capacidade humana de se renovar perante a luz do Criador.'
    ],


    'Simchat Torah': [
        'É uma tradição rabínica dedicada à celebração da Torá através da conclusão do ciclo de leitura e do seu reinício imediato, expressando a continuidade do estudo e da transmissão da Torá.',
        'Torá ordena que as suas palavras sejam ensinadas, lembradas e transmitidas às gerações. Devarim 31:10-13 também estabelece uma leitura pública da Torá perante homens, mulheres e crianças, fornecendo a base para a importância posterior da leitura comunitária.',
        'Os Neviim chamam Israel repetidamente a ouvir e obedecer à palavra de D\'us. Yeshayahu 1:10 e Yirmeyahu 7:23 mostram que ouvir a palavra divina não é apenas uma atividade intelectual, mas deve resultar numa vida de fidelidade.',
        'Nos Ketuvim, a Torá é apresentada como fonte de sabedoria e orientação. Tehillim 119:97-105 expressa o amor pela Torá e descreve os mandamentos como uma luz que orienta o caminho da pessoa.',
        'A tradição rabínica desenvolveu diferentes ciclos de leitura pública da Torá. Megillah 31a apresenta a organização das leituras e tornou-se uma das fontes fundamentais para compreender o sistema litúrgico posterior.',
        'Na tradição do Sod, terminar a leitura da Torá e começar imediatamente outra vez representa a ideia de que a revelação nunca se esgota. O Zohar III, 73a relaciona a Torá com uma fonte contínua de vida e conhecimento.'
    ],

    'Chag Chanukah': [
        'É uma festa rabínica que recorda a vitória dos Hasmoneus, a recuperação de Jerusalém e a rededicação do Templo, estando também associada na tradição rabínica ao milagre das luzes.',
        'Torá não estabelece Hanukkah como uma festa. No entanto, a importância da dedicação do santuário e da preservação da sua santidade aparece na Torá. Shemot 25:8 estabelece o princípio de construir um lugar santo para a presença divina, enquanto Bamidbar 7:1-11 descreve a dedicação do Mishkan.',
        'Hanukkah ocorreu depois do período dos Neviim e não existe uma referência direta à festa nos livros proféticos. Os temas de restauração do Templo e de renovação do serviço aparecem, porém, em Chaggai 1:7-14 e Zecharyah 4:1-6.',
        'A história de Hanukkah não pertence ao conjunto tradicional dos Ketuvim da Tanakh. Os acontecimentos são preservados nos livros de 1 e 2 Macabeus, que descrevem a revolta dos Hasmoneus, a recuperação de Jerusalém e a rededicação do Templo.',
        'A tradição rabínica estabeleceu Hanukkah e a prática de acender luzes durante oito noites. Shabbat 21b explica que os Sábios instituíram a festa para recordar a vitória e o milagre do óleo, enquanto Shabbat 21b-23b desenvolve as principais leis do acendimento.',
        'Na tradição do Sod, as luzes de Hanukkah representam a manifestação da luz espiritual em meio à escuridão. O Zohar II, 166b utiliza a linguagem da luz para representar a presença e a influência da santidade no mundo.'
    ],

    'Yom Purim': [
        'É uma festa rabínica que recorda a salvação de Israel perante a ameaça de Haman durante o período persa e celebra a transformação de uma situação de destruição anunciada numa ocasião de alegria.',
        'Purim não é uma festa estabelecida pela Torá, pois os acontecimentos ocorreram muito depois do período da Torá. No entanto, a importância de recordar os acontecimentos e transmiti-los às gerações está presente em Devarim 4:9 e Shemot 13:8-9.',
        'Os acontecimentos de Purim são posteriores ao período dos Neviim e não são narrados diretamente nos livros proféticos. Os temas de preservação de Israel, ameaça nacional e restauração, porém, aparecem em profecias como Yirmeyahu 30:7-11.',
        'O Livro de Esther é a principal fonte de Purim. Esther 3:8-13 descreve o plano de Haman, Esther 7:1-10 apresenta a sua intervenção perante o rei e Esther 9:20-28 descreve a transformação da ameaça em dias de celebração.',
        'A tradição rabínica desenvolveu as principais práticas de Purim, incluindo a leitura da Megillah, o envio de alimentos, a ajuda aos pobres e a refeição festiva. Megillah 7a-8b discute estas obrigações e a forma como devem ser cumpridas.',
        'Na tradição do Sod, Purim é associado à providência divina escondida. A ausência do nome explícito de D\'us na Megillah tornou-se uma base para refletir sobre uma ação divina que pode existir mesmo quando não é imediatamente visível. Esta ideia aparece desenvolvida na literatura do Zohar.'
    ],

    'Ta\'anit Esther': [
        'É um jejum rabínico realizado antes de Purim e associado ao jejum realizado por Esther e pelo povo de Israel antes da sua intervenção perante o rei.',
        'Torá estabelece diretamente o jejum de Yom Kippur, mas não estabelece Ta\'anit Esther. O princípio de procurar D\'us através de jejum, humildade e arrependimento aparece, porém, em vários textos bíblicos, como Devarim 9:18.',
        'Os Neviim apresentam o jejum como uma prática que deve estar ligada à mudança interior. Yoel 2:12-13 chama Israel a regressar a D\'us com jejum, choro e arrependimento, mostrando que o objetivo não é apenas deixar de comer.',
        'O Livro de Esther apresenta diretamente o jejum realizado antes da intervenção de Esther. Em Esther 4:15-16, Esther pede que os israelitas jejuem durante três dias enquanto ela se prepara para entrar perante o rei.',
        'A tradição rabínica desenvolveu Ta\'anit Esther como um jejum relacionado com Purim. Ta\'anit 12a discute os princípios dos jejuns comunitários, enquanto a tradição haláchica posterior determina a sua observância antes de Purim.',
        'Na tradição do Sod, o jejum pode ser entendido como uma forma de diminuir temporariamente a atenção às necessidades físicas e concentrá-la na súplica e na dependência de D\'us. A tradição mística relaciona o jejum com processos de purificação interior.'
    ],

    'Tzom Tamuz': [
        'É um jejum rabínico que inicia o período tradicional de luto que conduz a Tisha B\'Av e recorda acontecimentos associados à ruptura e às calamidades que atingiram Israel.',
        'Torá não estabelece o décimo sétimo de Tamuz como dia de jejum. No entanto, Devarim 30:1-3 apresenta o retorno a D\'us depois da calamidade como uma possibilidade, enquanto Vayikra 26:27-33 descreve as consequências da infidelidade à aliança.',
        'Os Neviim descrevem a queda de Jerusalém e relacionam a destruição com a infidelidade de Israel. Yirmeyahu 39:1-3 descreve o cerco e a ruptura da cidade, mostrando o início do colapso que conduziu à destruição.',
        'Os Ketuvim preservam relatos da queda de Jerusalém e da destruição do Templo. II Melachim 25:1-7 descreve o cerco, a ruptura das muralhas e a fuga do exército de Judá.',
        'O Talmud Ta\'anit 28b enumera cinco acontecimentos tradicionalmente associados ao décimo sétimo de Tamuz, incluindo a quebra das primeiras tábuas, a interrupção do sacrifício diário e a ruptura das muralhas de Jerusalém.',
        'Na tradição do Sod, o período iniciado por Tzom Tamuz representa um tempo de luto e reflexão sobre a ruptura. O Zohar II, 184a utiliza a linguagem da destruição e restauração para desenvolver uma dimensão espiritual desse período.'
    ],

    'Tisha B\'Av': [
        'É um jejum rabínico dedicado principalmente ao luto pela destruição dos Templos de Jerusalém e pela memória de outras calamidades sofridas por Israel ao longo da sua história.',
        'Tisha B\'Av não é estabelecido diretamente pela Torá. No entanto, Devarim 30:1-3 descreve a possibilidade de retorno a D\'us depois de uma calamidade, enquanto Vayikra 26:40-45 apresenta a confissão e o arrependimento como caminhos para a restauração da aliança.',
        'Os Neviim relacionam a destruição de Jerusalém com idolatria, injustiça e abandono da aliança. Yirmeyahu 7:9-14 critica essas práticas e explica por que o Templo não poderia servir de proteção enquanto o povo continuasse a agir contra os mandamentos.',
        'O Livro de Lamentações é central para o espírito de Tisha B\'Av. Eichah 1:1-5 descreve a destruição e a solidão de Jerusalém, enquanto Eichah 3:21-24 introduz esperança na misericórdia de D\'us mesmo no meio da dor.',
        'A tradição rabínica estabeleceu Tisha B\'Av como um dia de jejum e luto pela destruição. Ta\'anit 29a-30b discute a destruição dos Templos, as práticas de luto e os acontecimentos associados à data.',
        'Na tradição do Sod, Tisha B\'Av representa uma ruptura profunda entre Israel, Jerusalém e a presença divina. O Zohar II, 152a-153b utiliza a linguagem da destruição e da restauração para mostrar que o luto também pode conduzir ao desejo de reconstrução.'
    ],

    'Tzom Gedaliah': [
        'É um jejum rabínico que recorda a morte de Gedaliah ben Achikam após a destruição do Primeiro Templo e a consequente instabilidade e dispersão entre os sobreviventes de Israel.',
        'Torá não estabelece Tzom Gedaliah como dia de jejum. A tradição posterior utiliza o jejum para preservar a memória da tragédia e refletir sobre as consequências da violência e da divisão. Devarim 30:1-3 apresenta o retorno a D\'us como resposta possível depois da calamidade.',
        'Yirmeyahu descreve detalhadamente a nomeação de Gedaliah e o seu assassinato. Yirmeyahu 40:5-16 apresenta Gedaliah como líder dos sobreviventes, enquanto Yirmeyahu 41:1-18 descreve o assassinato e as consequências que se seguiram.',
        'II Melachim 25:22-26 relata que o rei da Babilónia colocou Gedaliah como governador sobre os sobreviventes de Judá. A sua morte provocou medo entre o povo e contribuiu para uma nova dispersão da população.',
        'A tradição rabínica estabeleceu o jejum de Gedaliah como um dos jejuns relacionados com a destruição de Jerusalém. Rosh Hashanah 18b discute os jejuns e apresenta a morte de Gedaliah como um acontecimento de grande importância para a comunidade que permaneceu em Judá.',
        'Na tradição do Sod, a morte de Gedaliah pode representar a perda de uma oportunidade de reconstrução depois da destruição. A comunidade tinha uma possibilidade de reorganização, mas a violência interna voltou a provocar dispersão. Esta dimensão de ruptura é desenvolvida na literatura mística.'
    ],

    'Tzom Tevet': [
        'É um jejum rabínico que recorda o início do cerco de Jerusalém pela Babilónia e o começo do processo que conduziu à queda da cidade e à destruição do Primeiro Templo.',
        'Torá não estabelece o décimo de Tevet como dia de jejum. Vayikra 26:27-33 e Devarim 28:47-52, porém, descrevem as consequências que poderiam surgir quando Israel abandonasse a aliança e deixasse de seguir os mandamentos.',
        'Yechezkel recebeu uma mensagem de D\'us precisamente no dia em que o cerco começou. Yechezkel 24:1-14 utiliza esse acontecimento para anunciar a gravidade do julgamento que estava a aproximar-se sobre Jerusalém.',
        'II Melachim 25:1-7 descreve o cerco de Jerusalém, a fome que se seguiu, a ruptura das muralhas e a captura da cidade. Estes acontecimentos formam o contexto histórico recordado posteriormente pelo jejum.',
        'A tradição rabínica inclui o décimo de Tevet entre os jejuns instituídos para recordar a destruição de Jerusalém. Rosh Hashanah 18b apresenta estes jejuns como dias de memória e reflexão perante as calamidades que atingiram Israel.',
        'Na tradição do Sod, o cerco pode ser entendido como uma imagem de uma ruptura que começa antes de a destruição se tornar visível. O Zohar II, 184a relaciona a destruição e a restauração com processos espirituais mais profundos.'
    ],

    'Leil Selichot': [
        'É uma prática litúrgica rabínica de preparação para os dias de arrependimento, dedicada à recitação de Selichot, súplicas, confissão e pedidos de misericórdia a D\'us. Não é uma festa nem um mandamento estabelecido pela Torá.',
        'Torá não estabelece uma noite chamada Leil Selichot nem ordena a sua celebração. Contudo, a prática de arrependimento, confissão e retorno a D\'us encontra fundamento na Torá, especialmente em Vayikra 26:40-42, Bamidbar 5:6-7 e Devarim 30:1-3, que falam da confissão da iniquidade, do retorno e da restauração.',
        'Os Neviim apelam repetidamente ao arrependimento e ao retorno a D\'us. Yoel 2:12-17 convoca Israel ao retorno de todo o coração, com jejum, choro e lamentação, enquanto Yoel 2:13-14 enfatiza a misericórdia de D\'us. Yeshayahu 55:6-7 também chama o ímpio a abandonar o seu caminho e retornar a D\'us.',
        'Os Ketuvim apresentam numerosos exemplos de confissão, arrependimento e súplica. Tehillim 51 é especialmente associado ao arrependimento e ao pedido de purificação, enquanto Tehillim 130 expressa um clamor profundo a D\'us por misericórdia e perdão.',
        'A forma litúrgica de Leil Selichot não é estabelecida pela Torá nem como uma noite específica pelo Talmud. A tradição rabínica, porém, desenvolveu costumes de recitar Selichot como preparação para Rosh Hashanah e Yom Kippur. Rosh Hashanah 17b destaca as treze qualidades de misericórdia reveladas a Moshe em Shemot 34:6-7, que se tornaram centrais na liturgia das Selichot. O costume de recitar Selichot em diferentes períodos antes de Yom Kippur desenvolveu-se posteriormente nas comunidades de Israel.',
        'Na tradição do Sod, a noite de Selichot é entendida como um momento de despertar espiritual, teshuvah e preparação interior para os dias de julgamento. A recitação das treze qualidades de misericórdia é associada à abertura dos canais de rachamim e à busca de purificação espiritual. A literatura cabalística, especialmente o Zohar e as tradições posteriores de Kabbalah, desenvolve o significado espiritual da teshuvah, da confissão e da recitação das middot de rachamim.'
    ],

    'Shushan Purim': [
        'É uma celebração rabínica observada no décimo quinto dia de Adar, especialmente associada às cidades que eram cercadas por muralhas desde os dias de Yehoshua bin Nun, recordando a vitória de Israel sobre os seus inimigos no contexto de Purim.',
        'Torá não estabelece Shushan Purim. Contudo, a Torá apresenta princípios de memória, celebração e transmissão dos acontecimentos às gerações, como em Shemot 13:8-9 e Devarim 4:9.',
        'Não existe uma referência direta a Shushan Purim nos Neviim. Os acontecimentos de Purim ocorreram posteriormente ao período profético. Os Neviim, porém, apresentam repetidamente a preservação de Israel perante os seus inimigos.',
        'O Livro de Esther é a principal fonte de Shushan Purim. Esther 9:18-22 distingue a celebração dos judeus de Shushan da celebração dos restantes judeus e estabelece o décimo quinto dia como dia de alegria e festa.',
        'A tradição rabínica estabelece a diferença entre Purim e Shushan Purim. Megillah 2a-2b explica que cidades cercadas por muralhas desde os dias de Yehoshua celebram no décimo quinto dia de Adar, enquanto as restantes celebram no décimo quarto.',
        'Na tradição do Sod, Shushan Purim pode ser entendido como uma dimensão adicional da revelação da providência divina na história. A distinção entre o décimo quarto e o décimo quinto dia é associada na literatura mística a diferentes níveis de manifestação e plenitude.'
    ],

    'Purim Katan': [
        'É uma designação rabínica para os dias de Purim observados em Adar I durante um ano bissexto, quando Purim propriamente dito é celebrado em Adar II. É um período de alegria sem a maioria das obrigações de Purim.',
        'Torá não estabelece Purim Katan nem determina a intercalação de Adar I e Adar II para a celebração de Purim. A instituição de Purim pertence ao período posterior à Torá.',
        'Não existe referência direta a Purim Katan nos Neviim. Os acontecimentos de Purim ocorreram posteriormente ao período dos Neviim.',
        'O Livro de Esther estabelece Purim no mês de Adar, mas não apresenta o conceito posterior de Purim Katan. Esther 9:20-28 descreve a instituição da celebração de Purim.',
        'A tradição rabínica distingue Adar I de Adar II durante um ano bissexto. Megillah 6b estabelece que Purim é celebrado no segundo Adar, enquanto Megillah 6b-7a discute as diferenças entre Adar I e Adar II e a questão de Purim Katan.',
        'Na tradição do Sod, Purim Katan pode ser entendido como uma antecipação da alegria e da redenção que se manifestam plenamente em Adar II. A tradição mística associa Adar à transformação da adversidade em alegria e à manifestação da providência divina.'
    ],

    'Lag BaOmer': [
        'É uma data rabínica observada no trigésimo terceiro dia da contagem do Omer. É tradicionalmente associada à interrupção de uma praga que atingiu os discípulos de Rabbi Akiva e, na tradição posterior, à memória de Rabbi Shimon bar Yochai.',
        'Torá ordena a contagem do Omer desde o início da colheita até Shavuot, em Vayikra 23:15-16 e Devarim 16:9. Torá, porém, não estabelece o trigésimo terceiro dia como uma celebração ou dia festivo chamado Lag BaOmer.',
        'Não existe referência direta a Lag BaOmer nos Neviim. A data e as tradições associadas a ela desenvolveram-se posteriormente ao período dos Neviim.',
        'Não existe referência direta a Lag BaOmer nos Ketuvim. A base bíblica relacionada à data encontra-se na própria contagem do Omer estabelecida na Torá, enquanto Lag BaOmer como data específica pertence à tradição posterior.',
        'O Talmud não menciona explicitamente o nome Lag BaOmer. Yevamot 62b relata que os discípulos de Rabbi Akiva morreram durante o período entre Pessach e Shavuot e que a morte cessou em um momento posterior. A associação específica do trigésimo terceiro dia com Lag BaOmer desenvolveu-se na tradição rabínica posterior.',
        'Na tradição do Sod, Lag BaOmer é associado especialmente à revelação dos ensinamentos de Rabbi Shimon bar Yochai e à dimensão mística da Torá. A tradição cabalística relaciona o dia à revelação espiritual, à luz interior da Torá e à alegria em meio ao período de contagem do Omer.'
    ],


};

export function getFestivalDescription(festivalName) {
    if (!festivalName) return null;

    const cleanRaw = festivalName.replace(/[()\/]/g, '').trim();
    const searchKey = normalizeFestivalKey(cleanRaw);

    if (!searchKey) return null;

    // 1. Match exato por alias
    const aliasMatch = Object.entries(FESTIVAL_ALIASES).find(
        ([alias]) => normalizeFestivalKey(alias) === searchKey
    );
    if (aliasMatch) {
        return FESTIVAL_DESCRIPTIONS[aliasMatch[1]] || null;
    }

    // 2. Match exato por chave em FESTIVAL_DESCRIPTIONS
    for (const [key, value] of Object.entries(FESTIVAL_DESCRIPTIONS)) {
        if (normalizeFestivalKey(key) === searchKey) {
            return value;
        }
    }

    // 3. Match parcial contra os aliases, depois contra as chaves diretas
    const partialAliasMatch = Object.entries(FESTIVAL_ALIASES).find(
        ([alias]) => {
            const normAlias = normalizeFestivalKey(alias);
            return searchKey.includes(normAlias) || normAlias.includes(searchKey);
        }
    );
    if (partialAliasMatch) {
        return FESTIVAL_DESCRIPTIONS[partialAliasMatch[1]] || null;
    }

    const partialKeyMatch = Object.entries(FESTIVAL_DESCRIPTIONS).find(
        ([key]) => {
            const normKey = normalizeFestivalKey(key);
            return searchKey.includes(normKey) || normKey.includes(searchKey);
        }
    );
    if (partialKeyMatch) {
        return partialKeyMatch[1];
    }

    // 4. Sem nenhum match — devolve null
    return null;
}