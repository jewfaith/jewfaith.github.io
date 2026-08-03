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
    'Malachi': 'Malachi'
};

export const FESTIVAL_CATS = [
    'pesach', 'matzot', 'shavuot', 'roshhashana', 'yomkippur',
    'sukkot', 'sheminiatzeret', 'simchattorah'
];

export const FESTIVAL_TORAH_READINGS = {
    'pesach': ['Shemot 12:21-51'],       // 14 Nissan - korban Pessach
    'matzot': [
        'Shemot 12:21-51',        // Dia 1 - 15 Nissan
        'Vayikra 22:26-23:44',    // Dia 2 - 16 Nissan
        'Bamidbar 28:19-25',      // Dia 3 - Chol HaMoed 1
        'Bamidbar 28:19-25',      // Dia 4 - Chol HaMoed 2
        'Bamidbar 28:19-25',      // Dia 5 - Chol HaMoed 3
        'Bamidbar 28:19-25',      // Dia 6 - Chol HaMoed 4
        'Shemot 13:17-15:26',     // Dia 7 - Shvi\\'i shel Pessach
        'Devarim 15:19 - 16:17'   // Dia 8 - Acharon shel Pessach
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
        'Vayikra 22:26-23:44',    // Dia 1
        'Vayikra 22:26-23:44',    // Dia 2
        'Bamidbar 29:17-22',      // Dia 3 - Chol HaMoed 1
        'Bamidbar 29:20-25',      // Dia 4 - Chol HaMoed 2
        'Bamidbar 29:23-28',      // Dia 5 - Chol HaMoed 3
        'Bamidbar 29:26-31',      // Dia 6 - Chol HaMoed 4
        'Bamidbar 29:26-34',      // Dia 7 - Hoshana Raba
    ],
    'sheminiatzeret': [
        'Devarim 14:22 - 16:17',
        'Devarim 33:1 - 34:12'
    ],
};

export const FESTIVAL_HAFTARA_READINGS = {
    'pesach': ['Yehoshua 5:2 - 6:1'],    // 14 Nissan
    'matzot': [
        'Yehoshua 5:2 - 6:1',          // Dia 1 - 15 Nissan
        'II Melachim 23:1-9,21-25',    // Dia 2 - 16 Nissan
        'Yechezkel 37:1-14',            // Dia 3 - Chol HaMoed 1
        'Yechezkel 37:1-14',            // Dia 4 - Chol HaMoed 2
        'Yechezkel 37:1-14',            // Dia 5 - Chol HaMoed 3
        'Yechezkel 37:1-14',            // Dia 6 - Chol HaMoed 4
        'II Shmuel 22:1-51',            // Dia 7 - Shvi\\'i shel Pessach
        'Yeshayahu 10:32 - 12:6',       // Dia 8 - Acharon shel Pessach
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
        'Zecharia 14:1-21',             // Dia 1
        'I Melachim 8:2-21',            // Dia 2
        'Yechezkel 38:18-39:7',       // Dia 3 - Chol HaMoed 1
        'Yechezkel 38:18-39:7',       // Dia 4 - Chol HaMoed 2
        'Yechezkel 38:18-39:7',       // Dia 5 - Chol HaMoed 3
        'Yechezkel 38:18-39:7',       // Dia 6 - Chol HaMoed 4
        'Yechezkel 38:18-39:7',       // Dia 7 - Hoshana Raba
    ],
    'sheminiatzeret': [
        'I Melachim 8:54-66',
        'Yehoshua 1:1-18'
    ],
};

export const KETUVIM_BOOKS = [
    { name: 'Tehilim', chapters: 150, weight: 67 },
    { name: 'Mishlei', chapters: 31, weight: 15 },
    { name: 'Iyov', chapters: 42, weight: 5 },
    { name: 'Kohelet', chapters: 12, weight: 4 },
    { name: 'Ruth', chapters: 4, weight: 2 },
    { name: 'Esther', chapters: 10, weight: 2 },
    { name: 'Daniel', chapters: 12, weight: 3 },
    { name: 'Ezra', chapters: 10, weight: 1 },
    { name: 'Nechemia', chapters: 13, weight: 1 }
];
export const KETUVIM_TOTAL_WEIGHT = KETUVIM_BOOKS.reduce((sum, b) => sum + b.weight, 0);

export const FESTIVAL_TEHILIM = {
    shabbat: ['Tehilim 23', 'Tehilim 92', 'Mishlei 31', 'Tehilim 104', 'Mishlei 3', 'Tehilim 121', 'Mishlei 4', 'Tehilim 93', 'Mishlei 8', 'Daniel 2'],
    pesach: ['Tehilim 78', 'Tehilim 105', 'Tehilim 107', 'Tehilim 113', 'Tehilim 114', 'Tehilim 115', 'Tehilim 116', 'Tehilim 117', 'Tehilim 118', 'Tehilim 136'],
    matzot: ['Tehilim 66', 'Tehilim 77', 'Tehilim 105', 'Tehilim 106', 'Tehilim 114', 'Tehilim 115', 'Tehilim 116', 'Tehilim 117', 'Tehilim 118', 'Tehilim 136'],
    shavuot: ['Tehilim 19', 'Tehilim 42', 'Tehilim 43', 'Tehilim 68', 'Tehilim 119', 'Tehilim 147', 'Tehilim 148', 'Tehilim 149', 'Tehilim 150', 'Mishlei 8'],
    roshhashana: ['Tehilim 24', 'Tehilim 27', 'Tehilim 47', 'Tehilim 81', 'Tehilim 93', 'Tehilim 98', 'Tehilim 130', 'Tehilim 150', 'Mishlei 1', 'Mishlei 2'],
    yomkippur: ['Tehilim 25', 'Tehilim 32', 'Tehilim 51', 'Tehilim 86', 'Tehilim 103', 'Tehilim 130', 'Tehilim 139', 'Mishlei 1', 'Mishlei 3', 'Mishlei 4'],
    sukkot: ['Tehilim 27', 'Tehilim 42', 'Tehilim 43', 'Tehilim 84', 'Tehilim 113', 'Tehilim 114', 'Tehilim 115', 'Tehilim 116', 'Tehilim 117', 'Tehilim 118'],
    sheminiatzeret: ['Tehilim 8', 'Tehilim 19', 'Tehilim 104', 'Tehilim 119', 'Tehilim 147', 'Tehilim 148', 'Tehilim 149', 'Tehilim 150', 'Mishlei 3', 'Mishlei 8']
};

export const FESTIVAL_DESCRIPTIONS = {
    'Yom Shabbat': {
        info: 'Mandamento da Torah. Yom Shabbat é o sétimo dia da semana, separado para descanso, santidade e proximidade com Deus. A Torah apresenta este dia como parte da ordem da criação e como um sinal especial entre Deus e Yisrael. Em Bereshit 2:2-3, o sétimo dia é separado e abençoado, enquanto Shemot 20:8-11 e Devarim 5:12-15 ordenam a sua observância.',
        torah: 'A Torah ordena que o sétimo dia seja santificado e que o trabalho comum seja interrompido. Shemot 31:12-17 apresenta o Shabbat como um sinal entre Deus e Yisrael, mostrando que a sua observância possui uma importância especial dentro da aliança.',
        neviim: 'Os Neviim apresentam o Shabbat como uma expressão de fidelidade a Deus. Yeshayahu 56:2-7 promete bênção àqueles que guardam o Shabbat, enquanto Yeshayahu 58:13-14 descreve o dia como uma ocasião para honrar e encontrar prazer na presença de Deus.',
        ketuvim: 'Nos Ketuvim, o Shabbat aparece ligado ao louvor e à santidade. Tehillim 92 é apresentado como um cântico para o Shabbat, enquanto Nechemyah 13:15-22 descreve os esforços para impedir que o dia fosse tratado como um dia comum.',
        talmud: 'A tradição rabínica desenvolveu detalhadamente as leis do Shabbat. A Mishnah Shabbat 7:2 apresenta as principais categorias de trabalho proibido, enquanto o Talmud Shabbat 73a-75b discute os seus limites e aplicações.',
        sod: 'Na tradição do Sod, o Shabbat é associado a uma dimensão elevada de santidade, descanso e proximidade com a presença divina. O Zohar II, 88a-89a descreve o Shabbat como um momento de união e descanso espiritual.'
    },

    'Pessach Sheni': {
        info: 'Mandamento da Torah. Pessach Sheni acontece no décimo quarto dia de Iyar e oferece uma segunda oportunidade para aqueles que não puderam celebrar Pessach no momento determinado. A Torah apresenta esta possibilidade depois de algumas pessoas não conseguirem participar da celebração devido à impureza ritual ou à distância. Este episódio é narrado em Bamidbar 9:1-14.',
        torah: 'A Torah estabelece Pessach Sheni como uma oportunidade para cumprir o mandamento de Pessach depois da data original. Bamidbar 9:9-12 determina que aqueles que estavam impedidos de participar no primeiro Pessach poderiam celebrá-lo no décimo quarto dia do segundo mês.',
        neviim: 'Não existe uma referência direta a Pessach Sheni nos Neviim. No entanto, a ideia de retorno depois de um período de afastamento aparece frequentemente na mensagem profética. Yeshayahu 55:6-7 chama aqueles que se afastaram a regressar para Deus.',
        ketuvim: 'Os Ketuvim apresentam várias situações em que uma pessoa procura novamente a proximidade de Deus depois de uma situação de afastamento. Tehillim 51:12-14 expressa esse desejo de restauração e renovação espiritual.',
        talmud: 'A tradição rabínica discute quem deve celebrar Pessach Sheni e quais circunstâncias justificam a sua celebração. O Talmud Pesachim 93a-95a analisa estas situações e compara Pessach Sheni com o Pessach celebrado no primeiro mês.',
        sod: 'Na tradição do Sod, Pessach Sheni pode ser entendido como uma imagem de segunda oportunidade e retificação. A pessoa que não conseguiu cumprir algo no momento original ainda pode encontrar um caminho de retorno e correção, ideia desenvolvida na literatura mística e associada ao processo de teshuvah.'
    },

    'Yom Pessach': {
        info: 'Festa da Torah. Yom Pessach recorda a noite em que Deus libertou Yisrael da escravidão no Egito. O centro da celebração é o sacrifício de Pessach, estabelecido pela Torah no décimo quarto dia do primeiro mês. Shemot 12:1-14 apresenta o acontecimento e estabelece a sua memória para as gerações seguintes.',
        torah: 'A Torah ordena que o sacrifício de Pessach seja realizado no décimo quarto dia do primeiro mês. Shemot 12:5-14 descreve o cordeiro, o sangue colocado nas portas e a refeição realizada naquela noite, enquanto Vayikra 23:5 confirma a data da celebração.',
        neviim: 'Os Neviim recordam repetidamente o Êxodo como uma das maiores demonstrações da fidelidade de Deus para com Yisrael. Yirmeyahu 16:14-15 utiliza a saída do Egito como referência para uma futura redenção, mostrando a importância permanente desse acontecimento.',
        ketuvim: 'Nos Ketuvim, a saída do Egito é recordada através de cânticos e relatos históricos. Tehillim 78:12-16 descreve os milagres realizados no Egito e no deserto, enquanto Tehillim 114 apresenta a saída de Yisrael como um acontecimento extraordinário diante da presença de Deus.',
        talmud: 'A tradição rabínica desenvolveu extensamente as leis relacionadas com Pessach. A Mishnah Pesachim 5:5-10 descreve o serviço do sacrifício, enquanto Pesachim 58a-61b discute vários detalhes relacionados com a sua preparação e realização.',
        sod: 'Na tradição do Sod, o Êxodo representa mais do que a libertação física de uma nação. O Zohar II, 40b-41a interpreta a saída do Egito como uma passagem da escravidão para a liberdade espiritual e como o início de uma transformação na relação entre Deus e Yisrael.'
    },

    'Chag Matzot': {
        info: 'Festa da Torah. Chag Matzot é a Festa dos Pães Ázimos e dura sete dias. Durante este período, a Torah ordena que o chametz seja removido das casas e que a matzah seja comida. A festa recorda a saída de Yisrael do Egito e a rapidez com que o povo deixou a escravidão. Shemot 12:15-20 estabelece diretamente estas obrigações.',
        torah: 'A Torah ordena que durante sete dias não exista chametz nas casas e que a matzah seja comida. Shemot 13:3-7 relaciona esta prática com a saída do Egito, enquanto Vayikra 23:6-8 estabelece os primeiros e últimos dias como ocasiões sagradas.',
        neviim: 'Os Neviim utilizam o Êxodo como uma das principais provas da relação entre Deus e Yisrael. Hoshea 11:1 recorda que Deus chamou o Seu filho para fora do Egito, enquanto Yirmeyahu 16:14-15 utiliza essa libertação como referência para uma futura redenção.',
        ketuvim: 'Nos Ketuvim, a saída do Egito é recordada como um acontecimento fundamental da história de Yisrael. Tehillim 105:36-43 descreve a libertação do povo e a sua condução pelo deserto, enquanto Tehillim 114 celebra a saída do Egito perante a presença de Deus.',
        talmud: 'A tradição rabínica desenvolveu detalhadamente as leis de chametz e matzah. A Mishnah Pesachim 2:1-7 discute a proibição do chametz, enquanto Pesachim 35a-38b analisa os requisitos para que a matzah possa cumprir o mandamento.',
        sod: 'Na tradição do Sod, a matzah é associada à simplicidade e à humildade, enquanto o chametz pode representar aquilo que cresce e se expande. O Zohar II, 182a-183b relaciona a remoção do chametz com uma forma de purificação e libertação espiritual.'
    },

    'Yom Shavuot': {
        info: 'Festa da Torah. Yom Shavuot é a Festa das Semanas e encerra a contagem de sete semanas iniciada depois de Pessach. A Torah relaciona a festa às primícias da colheita e à alegria perante Deus. A associação de Shavuot com a entrega da Torah no Sinai pertence à tradição judaica posterior, baseada na proximidade temporal entre o Êxodo e a chegada ao Sinai.',
        torah: 'A Torah ordena contar sete semanas completas e depois celebrar uma convocação santa. Vayikra 23:15-21 estabelece a festa e as suas ofertas, enquanto Devarim 16:9-12 relaciona Shavuot com a alegria, as primícias e a memória da escravidão no Egito.',
        neviim: 'Os Neviim desenvolvem o tema da aliança e da fidelidade à vontade de Deus. Yirmeyahu 31:31-33 fala de uma futura aliança em que a Torah estará colocada no interior do povo, aproximando-se do significado que a tradição atribuiu posteriormente a Shavuot.',
        ketuvim: 'O Livro de Ruth está tradicionalmente associado a Shavuot. A história acontece durante a época da colheita e mostra Ruth, uma mulher de Moav, a unir-se ao povo de Yisrael e ao Deus de Yisrael, como descrito em Ruth 1:16-17.',
        talmud: 'A tradição rabínica associa Shavuot à entrega da Torah no Sinai. O Talmud Shabbat 86b-88a discute a data da revelação e descreve acontecimentos relacionados com a experiência de Yisrael perante o Sinai.',
        sod: 'Na tradição do Sod, Shavuot representa a passagem entre a libertação e a revelação. O Zohar II, 98a apresenta a festa como um momento de ligação entre Yisrael, a Torah e a presença divina.'
    },

    'Yom Teruah': {
        info: 'Festa da Torah. Yom Teruah acontece no primeiro dia do sétimo mês e é marcado por descanso, convocação santa e teruah. A Torah não utiliza aqui o nome posterior de Rosh Hashanah, mas descreve o dia como uma ocasião de memória e toque de teruah. Vayikra 23:23-25 estabelece diretamente estas características.',
        torah: 'A Torah determina que o primeiro dia do sétimo mês seja um dia de descanso e convocação santa. Bamidbar 29:1-6 acrescenta as ofertas específicas desse dia e descreve-o como um dia de teruah.',
        neviim: 'Nos Neviim, o shofar aparece como instrumento de alerta e convocação. Yechezkel 33:3-6 descreve o toque do shofar como um aviso perante o perigo, enquanto Yoel 2:1 utiliza o seu som para chamar o povo à atenção diante do dia de Deus.',
        ketuvim: 'Nos Ketuvim, o shofar aparece associado ao louvor e à manifestação do poder divino. Tehillim 47:5-6 relaciona o seu som com a ascensão e a realeza de Deus, enquanto Tehillim 81:4-5 associa o toque do shofar ao calendário de Yisrael.',
        talmud: 'A tradição rabínica desenvolveu detalhadamente as leis do shofar. A Mishnah Rosh Hashanah 3:1-8 discute o instrumento e os sons utilizados, enquanto Rosh Hashanah 26b-34b analisa a forma correta de cumprir a obrigação.',
        sod: 'Na tradição do Sod, o som do shofar representa um despertar espiritual. O Zohar III, 18a-19b associa o toque do shofar ao despertar da consciência e ao retorno da pessoa perante Deus.'
    },

    'Yom Kippur': {
        info: 'Festa da Torah. Yom Kippur é o Dia da Expiação e ocupa um lugar central no calendário da Torah. É um dia de descanso completo, aflição da alma e expiação perante Deus. Vayikra 16:29-34 e 23:26-32 estabelecem diretamente as obrigações deste dia.',
        torah: 'A Torah determina que Yom Kippur seja observado no décimo dia do sétimo mês. O povo deve interromper o trabalho e afligir a alma, enquanto Vayikra 16 descreve o serviço de expiação realizado pelo Sumo Sacerdote no Mishkan e, posteriormente, no Templo.',
        neviim: 'Os Neviim ensinam que o jejum deve ser acompanhado por uma transformação real da vida. Yeshayahu 58:3-9 critica um jejum sem justiça e mostra que Deus procura também libertação dos oprimidos, generosidade e mudança de comportamento.',
        ketuvim: 'Nos Ketuvim, a confissão e o arrependimento aparecem como formas de procurar novamente a proximidade de Deus. Tehillim 51:3-12 apresenta David reconhecendo o seu pecado e pedindo purificação interior.',
        talmud: 'A tradição rabínica desenvolveu detalhadamente as leis de Yom Kippur. A Mishnah Yoma 1:1-9 descreve a preparação do Sumo Sacerdote, enquanto Yoma 73b-88a discute o jejum, as proibições do dia, o arrependimento e a expiação.',
        sod: 'Na tradição do Sod, Yom Kippur representa um momento de purificação profunda e retorno espiritual. O Zohar III, 100b-103a descreve a importância espiritual do dia e a sua relação com a purificação de Yisrael.'
    },

    'Chag Sukkot': {
        info: 'Festa da Torah. Chag Sukkot é celebrado durante sete dias e combina a alegria da colheita com a memória da passagem de Yisrael pelo deserto. A Torah ordena que o povo habite em sukkot para recordar que Deus fez Yisrael habitar em cabanas depois da saída do Egito. Vayikra 23:33-43 apresenta diretamente esta celebração.',
        torah: 'A Torah ordena que Yisrael habite em sukkot durante sete dias e se alegre perante Deus. Também estabelece o uso das quatro espécies durante a celebração. Vayikra 23:39-43 relaciona a festa tanto com a alegria como com a memória da proteção de Deus no deserto.',
        neviim: 'Os Neviim utilizam imagens de abrigo, proteção e restauração que ajudam a compreender o simbolismo de Sukkot. Amos 9:11 fala da restauração da sukkah de David, enquanto Zecharyah 14:16-19 apresenta Sukkot numa visão futura envolvendo as nações.',
        ketuvim: 'Nos Ketuvim, a proteção de Deus aparece repetidamente como motivo de confiança. Tehillim 27:5 fala de Deus escondendo a pessoa no Seu abrigo, enquanto Tehillim 121:5-8 descreve Deus como aquele que guarda o Seu povo.',
        talmud: 'A tradição rabínica desenvolveu as leis da sukkah e das quatro espécies. A Mishnah Sukkah 1:1-11 discute a estrutura da sukkah, enquanto Sukkah 2a-28b analisa as condições necessárias para cumprir o mandamento.',
        sod: 'Na tradição do Sod, a sukkah é associada à proteção da presença divina. O Zohar III, 100b-103a desenvolve a ideia de que a sukkah representa uma proteção espiritual que envolve aqueles que entram nela durante a festa.'
    },

    'Shemini Atzeret': {
        info: 'Festa da Torah. Shemini Atzeret é o oitavo dia que segue os sete dias de Sukkot. Apesar de estar ligado ao período de Sukkot, a Torah apresenta este dia como uma convocação santa própria. Bamidbar 29:35-38 estabelece as suas ofertas específicas e mostra que possui uma identidade distinta.',
        torah: 'A Torah determina que o oitavo dia seja uma assembleia santa e um dia de descanso. Bamidbar 29:35-38 descreve as ofertas próprias deste dia, enquanto Vayikra 23:36 o apresenta como uma convocação santa adicional depois de Sukkot.',
        neviim: 'Os Neviim apresentam a reunião de Yisrael perante Deus como expressão de unidade e restauração. Yechezkel 37:21-28 fala da reunião dos descendentes de Yisrael e da sua futura unidade perante Deus.',
        ketuvim: 'Nos Ketuvim, a reunião perante Deus aparece ligada ao louvor e à alegria. Tehillim 122:1-4 descreve a alegria de subir para Jerusalém e estar reunido entre o povo de Deus.',
        talmud: 'A tradição rabínica distingue Shemini Atzeret de Sukkot em várias questões legais. Sukkah 55b-56a discute a relação entre os dois períodos e apresenta diferenças específicas relativas às ofertas e às obrigações do dia.',
        sod: 'Na tradição do Sod, Shemini Atzeret representa uma permanência especial depois da experiência de Sukkot. O Zohar III, 104b apresenta o oitavo dia como um momento de proximidade particular entre Deus e o Seu povo.'
    },

    'Simchat Torah': {
        info: 'Tradição rabínica. Simchat Torah não é uma festa estabelecida diretamente pela Torah. A celebração desenvolveu-se em torno da conclusão do ciclo anual de leitura da Torah e do seu reinício imediato, transformando o estudo da Torah numa celebração de continuidade. A prática está relacionada com a tradição de leitura pública discutida em Megillah 31a.',
        torah: 'A Torah ordena que as suas palavras sejam ensinadas, lembradas e transmitidas às gerações. Devarim 31:10-13 também estabelece uma leitura pública da Torah perante homens, mulheres e crianças, fornecendo a base para a importância posterior da leitura comunitária.',
        neviim: 'Os Neviim chamam Yisrael repetidamente a ouvir e obedecer à palavra de Deus. Yeshayahu 1:10 e Yirmeyahu 7:23 mostram que ouvir a palavra divina não é apenas uma atividade intelectual, mas deve resultar numa vida de fidelidade.',
        ketuvim: 'Nos Ketuvim, a Torah é apresentada como fonte de sabedoria e orientação. Tehillim 119:97-105 expressa o amor pela Torah e descreve os mandamentos como uma luz que orienta o caminho da pessoa.',
        talmud: 'A tradição rabínica desenvolveu diferentes ciclos de leitura pública da Torah. Megillah 31a apresenta a organização das leituras e tornou-se uma das fontes fundamentais para compreender o sistema litúrgico posterior.',
        sod: 'Na tradição do Sod, terminar a leitura da Torah e começar imediatamente outra vez representa a ideia de que a revelação nunca se esgota. O Zohar III, 73a relaciona a Torah com uma fonte contínua de vida e conhecimento.'
    },

    'Sefirat Omer': {
        info: 'Mandamento da Torah. Sefirat Omer é a contagem de sete semanas entre Pessach e Shavuot. Este período cria uma ligação entre a libertação do Egito e a chegada à celebração das semanas. A Torah estabelece esta contagem em Vayikra 23:15-16.',
        torah: 'A Torah ordena contar sete semanas completas a partir da apresentação do Omer. Depois da contagem, Yisrael celebra Shavuot e apresenta novas ofertas perante Deus. Vayikra 23:15-21 e Devarim 16:9-12 estabelecem esta ligação entre a contagem e a festa.',
        neviim: 'Os Neviim não descrevem diretamente a prática posterior de contar cada dia do Omer. No entanto, apresentam frequentemente a espera e a preparação como partes importantes da relação entre Yisrael e Deus. Yirmeyahu 31:31-33 fala de uma futura renovação da aliança.',
        ketuvim: 'Nos Ketuvim, a espera perante Deus aparece como uma experiência de confiança e preparação. Tehillim 130:5-6 descreve a alma esperando por Deus e pela Sua palavra, criando um paralelo espiritual com o período de contagem.',
        talmud: 'A tradição rabínica discute a obrigação de contar o Omer e os detalhes da contagem diária. Menachot 65b-66a analisa a prática e as diferentes interpretações sobre a natureza da obrigação.',
        sod: 'Na tradição do Sod, os dias da contagem podem ser vistos como etapas de refinamento interior. O Zohar III, 97b associa este período à preparação espiritual para receber uma dimensão mais elevada de revelação.'
    },

    'Chag Hanukkah': {
        info: 'Festa rabínica. Hanukkah não é uma das festas estabelecidas pela Torah. A celebração foi instituída posteriormente para recordar a vitória dos Hasmoneus, a recuperação de Jerusalém e a rededicação do Templo. A tradição rabínica também relaciona a festa ao milagre do óleo que permaneceu aceso durante oito dias, como relatado em Shabbat 21b.',
        torah: 'A Torah não estabelece Hanukkah como uma festa. No entanto, a importância da dedicação do santuário e da preservação da sua santidade aparece na Torah. Shemot 25:8 estabelece o princípio de construir um lugar santo para a presença divina, enquanto Bamidbar 7:1-11 descreve a dedicação do Mishkan.',
        neviim: 'Hanukkah ocorreu depois do período dos Neviim e não existe uma referência direta à festa nos livros proféticos. Os temas de restauração do Templo e de renovação do serviço aparecem, porém, em Chaggai 1:7-14 e Zecharyah 4:1-6.',
        ketuvim: 'A história de Hanukkah não pertence ao conjunto tradicional dos Ketuvim da Tanakh. Os acontecimentos são preservados nos livros de 1 e 2 Macabeus, que descrevem a revolta dos Hasmoneus, a recuperação de Jerusalém e a rededicação do Templo.',
        talmud: 'A tradição rabínica estabeleceu Hanukkah e a prática de acender luzes durante oito noites. Shabbat 21b explica que os Sábios instituíram a festa para recordar a vitória e o milagre do óleo, enquanto Shabbat 21b-23b desenvolve as principais leis do acendimento.',
        sod: 'Na tradição do Sod, as luzes de Hanukkah representam a manifestação da luz espiritual em meio à escuridão. O Zohar II, 166b utiliza a linguagem da luz para representar a presença e a influência da santidade no mundo.'
    },

    'Yom Purim': {
        info: 'Festa rabínica. Purim recorda a salvação do povo de Yisrael do Império Persa perante o plano de Haman. A Megillah conta como Esther e Mordechai participaram da reversão da ameaça e como os dias que deveriam representar destruição se transformaram em dias de alegria. Esther 9:20-28 apresenta a instituição da celebração.',
        torah: 'Purim não é uma festa estabelecida pela Torah, pois os acontecimentos ocorreram muito depois do período da Torah. No entanto, a importância de recordar os acontecimentos e transmiti-los às gerações está presente em Devarim 4:9 e Shemot 13:8-9.',
        neviim: 'Os acontecimentos de Purim são posteriores ao período dos Neviim e não são narrados diretamente nos livros proféticos. Os temas de preservação de Yisrael, ameaça nacional e restauração, porém, aparecem em profecias como Yirmeyahu 30:7-11.',
        ketuvim: 'O Livro de Esther é a principal fonte de Purim. Esther 3:8-13 descreve o plano de Haman, Esther 7:1-10 apresenta a sua intervenção perante o rei e Esther 9:20-28 descreve a transformação da ameaça em dias de celebração.',
        talmud: 'A tradição rabínica desenvolveu as principais práticas de Purim, incluindo a leitura da Megillah, o envio de alimentos, a ajuda aos pobres e a refeição festiva. Megillah 7a-8b discute estas obrigações e a forma como devem ser cumpridas.',
        sod: 'Na tradição do Sod, Purim é associado à providência divina escondida. A ausência do nome explícito de Deus na Megillah tornou-se uma base para refletir sobre uma ação divina que pode existir mesmo quando não é imediatamente visível. Esta ideia aparece desenvolvida na literatura do Zohar.'
    },

    'Rosh Chodesh': {
        info: 'Mandamento da Torah. Rosh Chodesh marca o início de cada novo mês e possui uma importância fundamental para o calendário de Yisrael. A Torah começa a organização do calendário precisamente através da determinação dos meses. Shemot 12:1-2 estabelece esta responsabilidade para Yisrael.',
        torah: 'A Torah estabelece o primeiro mês e dá a Yisrael a responsabilidade de organizar o calendário segundo os meses. Shemot 12:1-2 coloca esta determinação no contexto da preparação para Pessach, enquanto Bamidbar 28:11-15 estabelece ofertas específicas para cada novo mês.',
        neviim: 'Os Neviim mencionam Rosh Chodesh juntamente com Shabbat e outras ocasiões sagradas. Yeshayahu 66:23 descreve um futuro em que toda a humanidade virá perante Deus em cada novo mês e em cada Shabbat.',
        ketuvim: 'Nos Ketuvim, Rosh Chodesh aparece relacionado com o culto do Templo. Divrei Hayamim I 23:31 inclui os novos meses entre as ocasiões em que eram apresentadas ofertas, enquanto Tehillim 81:4-5 relaciona o novo mês com o calendário de Yisrael.',
        talmud: 'A tradição rabínica desenvolveu as leis relacionadas com a determinação do novo mês. Rosh Hashanah 20a-25b discute o testemunho sobre a lua nova, a autoridade do tribunal e o processo utilizado para determinar o início do mês.',
        sod: 'Na tradição do Sod, a lua é frequentemente utilizada como símbolo de renovação. O Zohar I, 19b relaciona os ciclos da lua com diferentes dimensões espirituais e com a ideia de receber novamente a luz.'
    },

    'Ta\'anit Esther': {
        info: 'Jejum rabínico. Ta’anit Esther é observado antes de Purim e está relacionado com o jejum realizado por Esther e pelos israelitas antes de ela entrar perante o rei. Esther 4:15-16 descreve diretamente esse jejum. A transformação desse episódio num jejum anual pertence à tradição posterior.',
        torah: 'A Torah estabelece diretamente o jejum de Yom Kippur, mas não estabelece Ta’anit Esther. O princípio de procurar Deus através de jejum, humildade e arrependimento aparece, porém, em vários textos bíblicos, como Devarim 9:18.',
        neviim: 'Os Neviim apresentam o jejum como uma prática que deve estar ligada à mudança interior. Yoel 2:12-13 chama Yisrael a regressar a Deus com jejum, choro e arrependimento, mostrando que o objetivo não é apenas deixar de comer.',
        ketuvim: 'O Livro de Esther apresenta diretamente o jejum realizado antes da intervenção de Esther. Em Esther 4:15-16, Esther pede que os israelitas jejuem durante três dias enquanto ela se prepara para entrar perante o rei.',
        talmud: 'A tradição rabínica desenvolveu Ta’anit Esther como um jejum relacionado com Purim. Ta’anit 12a discute os princípios dos jejuns comunitários, enquanto a tradição haláchica posterior determina a sua observância antes de Purim.',
        sod: 'Na tradição do Sod, o jejum pode ser entendido como uma forma de diminuir temporariamente a atenção às necessidades físicas e concentrá-la na súplica e na dependência de Deus. A tradição mística relaciona o jejum com processos de purificação interior.'
    },

    'Tzom Tammuz': {
        info: 'Jejum rabínico. Tzom Tammuz é observado no décimo sétimo dia de Tammuz e inicia o período tradicional de luto que conduz a Tisha BAv. A tradição rabínica associa este dia a várias calamidades, incluindo a quebra das muralhas de Jerusalém antes da destruição do Segundo Templo. A Mishnah Ta’anit 4:6 apresenta estas tradições.',
        torah: 'A Torah não estabelece o décimo sétimo de Tammuz como dia de jejum. No entanto, Devarim 30:1-3 apresenta o retorno a Deus depois da calamidade como uma possibilidade, enquanto Vayikra 26:27-33 descreve as consequências da infidelidade à aliança.',
        neviim: 'Os Neviim descrevem a queda de Jerusalém e relacionam a destruição com a infidelidade de Yisrael. Yirmeyahu 39:1-3 descreve o cerco e a ruptura da cidade, mostrando o início do colapso que conduziu à destruição.',
        ketuvim: 'Os Ketuvim preservam relatos da queda de Jerusalém e da destruição do Templo. Melachim II 25:1-7 descreve o cerco, a ruptura das muralhas e a fuga do exército de Judá.',
        talmud: 'O Talmud Ta’anit 28b enumera cinco acontecimentos tradicionalmente associados ao décimo sétimo de Tammuz, incluindo a quebra das primeiras tábuas, a interrupção do sacrifício diário e a ruptura das muralhas de Jerusalém.',
        sod: 'Na tradição do Sod, o período iniciado por Tzom Tammuz representa um tempo de luto e reflexão sobre a ruptura. O Zohar II, 184a utiliza a linguagem da destruição e restauração para desenvolver uma dimensão espiritual desse período.'
    },

    'Tisha BAv': {
        info: 'Jejum rabínico. Tisha BAv é o principal dia de luto pela destruição dos Templos de Jerusalém. A tradição rabínica associa a data também a outras calamidades que atingiram Yisrael. A Mishnah Ta’anit 4:6 estabelece a ligação entre Tisha BAv e os acontecimentos trágicos associados a este dia.',
        torah: 'Tisha BAv não é estabelecido diretamente pela Torah. No entanto, Devarim 30:1-3 descreve a possibilidade de retorno a Deus depois de uma calamidade, enquanto Vayikra 26:40-45 apresenta a confissão e o arrependimento como caminhos para a restauração da aliança.',
        neviim: 'Os Neviim relacionam a destruição de Jerusalém com idolatria, injustiça e abandono da aliança. Yirmeyahu 7:9-14 critica essas práticas e explica por que o Templo não poderia servir de proteção enquanto o povo continuasse a agir contra os mandamentos.',
        ketuvim: 'O Livro de Lamentações é central para o espírito de Tisha BAv. Eichah 1:1-5 descreve a destruição e a solidão de Jerusalém, enquanto Eichah 3:21-24 introduz esperança na misericórdia de Deus mesmo no meio da dor.',
        talmud: 'A tradição rabínica estabeleceu Tisha BAv como um dia de jejum e luto pela destruição. Ta’anit 29a-30b discute a destruição dos Templos, as práticas de luto e os acontecimentos associados à data.',
        sod: 'Na tradição do Sod, Tisha BAv representa uma ruptura profunda entre Yisrael, Jerusalém e a presença divina. O Zohar II, 152a-153b utiliza a linguagem da destruição e da restauração para mostrar que o luto também pode conduzir ao desejo de reconstrução.'
    },

    'Tzom Gedaliah': {
        info: 'Jejum rabínico. Tzom Gedaliah é observado no terceiro dia de Tishrei e recorda o assassinato de Gedaliah ben Achikam depois da destruição do Primeiro Templo. A sua morte provocou uma nova crise entre os sobreviventes de Judá e levou muitos deles a abandonar a terra. O acontecimento é narrado em Melachim II 25:22-26 e Yirmeyahu 40-41.',
        torah: 'A Torah não estabelece Tzom Gedaliah como dia de jejum. A tradição posterior utiliza o jejum para preservar a memória da tragédia e refletir sobre as consequências da violência e da divisão. Devarim 30:1-3 apresenta o retorno a Deus como resposta possível depois da calamidade.',
        neviim: 'Yirmeyahu descreve detalhadamente a nomeação de Gedaliah e o seu assassinato. Yirmeyahu 40:5-16 apresenta Gedaliah como líder dos sobreviventes, enquanto Yirmeyahu 41:1-18 descreve o assassinato e as consequências que se seguiram.',
        ketuvim: 'Melachim II 25:22-26 relata que o rei da Babilónia colocou Gedaliah como governador sobre os sobreviventes de Judá. A sua morte provocou medo entre o povo e contribuiu para uma nova dispersão da população.',
        talmud: 'A tradição rabínica estabeleceu o jejum de Gedaliah como um dos jejuns relacionados com a destruição de Jerusalém. Rosh Hashanah 18b discute os jejuns e apresenta a morte de Gedaliah como um acontecimento de grande importância para a comunidade que permaneceu em Judá.',
        sod: 'Na tradição do Sod, a morte de Gedaliah pode representar a perda de uma oportunidade de reconstrução depois da destruição. A comunidade tinha uma possibilidade de reorganização, mas a violência interna voltou a provocar dispersão. Esta dimensão de ruptura é desenvolvida na literatura mística.'
    },

    'Tzom Tevet': {
        info: 'Jejum rabínico. Tzom Tevet é observado no décimo dia de Tevet e recorda o início do cerco de Jerusalém pelo exército da Babilónia. O cerco marcou o começo do processo que terminou com a queda da cidade e a destruição do Primeiro Templo. Melachim II 25:1 e Yechezkel 24:1-2 registam o início desse acontecimento.',
        torah: 'A Torah não estabelece o décimo de Tevet como dia de jejum. Vayikra 26:27-33 e Devarim 28:47-52, porém, descrevem as consequências que poderiam surgir quando Yisrael abandonasse a aliança e deixasse de seguir os mandamentos.',
        neviim: 'Yechezkel recebeu uma mensagem de Deus precisamente no dia em que o cerco começou. Yechezkel 24:1-14 utiliza esse acontecimento para anunciar a gravidade do julgamento que estava a aproximar-se sobre Jerusalém.',
        ketuvim: 'Melachim II 25:1-7 descreve o cerco de Jerusalém, a fome que se seguiu, a ruptura das muralhas e a captura da cidade. Estes acontecimentos formam o contexto histórico recordado posteriormente pelo jejum.',
        talmud: 'A tradição rabínica inclui o décimo de Tevet entre os jejuns instituídos para recordar a destruição de Jerusalém. Rosh Hashanah 18b apresenta estes jejuns como dias de memória e reflexão perante as calamidades que atingiram Yisrael.',
        sod: 'Na tradição do Sod, o cerco pode ser entendido como uma imagem de uma ruptura que começa antes de a destruição se tornar visível. O Zohar II, 184a relaciona a destruição e a restauração com processos espirituais mais profundos.'
    }
};

function normalizeFestivalKey(str) {
    if (!str) return '';
    return str
        .replace(/^Parashat\s+/i, '')
        .replace(/[()\/]/g, '')
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

const FESTIVAL_ALIASES = {
    'pesach sheni': 'Pessach Sheni',
    'pesach': 'Yom Pessach',
    'matzot': 'Chag Matzot',
    'shavuot': 'Yom Shavuot',
    'rosh hashana': 'Yom Teruah',
    'yom kippur': 'Yom Kippur',
    'sukkot': 'Chag Sukkot',
    'shmini atzeret': 'Shemini Atzeret',
    'simchat torah': 'Simchat Torah',
    'rosh chodesh': 'Rosh Chodesh',
    'sefirat omer': 'Sefirat Omer',
    'la omer': 'Sefirat Omer',
    'chag hanukkah': 'Chag Hanukkah'
};

export function getFestivalDescription(festivalName) {
    if (!festivalName) return null;

    const cleanRaw = festivalName.replace(/[()\/]/g, '').trim();
    const searchKey = normalizeFestivalKey(cleanRaw);

    const aliasMatch = Object.entries(FESTIVAL_ALIASES).find(([alias]) => normalizeFestivalKey(alias) === searchKey);
    if (aliasMatch) {
        return FESTIVAL_DESCRIPTIONS[aliasMatch[1]] || null;
    }

    for (const [key, value] of Object.entries(FESTIVAL_DESCRIPTIONS)) {
        if (normalizeFestivalKey(key) === searchKey) {
            return value;
        }
    }

    if (searchKey.includes('hanukkah')) {
        return FESTIVAL_DESCRIPTIONS['Chag Hanukkah'] || null;
    }

    if (searchKey.includes('omer')) {
        return FESTIVAL_DESCRIPTIONS['Sefirat Omer'] || null;
    }

    return FESTIVAL_DESCRIPTIONS[cleanRaw] || null;
}
