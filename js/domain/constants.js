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
    'pesach': ['Shemot 12:21-51'],       // 14 Nissan – korban Pessach
    'matzot': [
        'Shemot 12:21-51',        // Dia 1 – 15 Nissan
        'Vayikra 22:26-23:44',    // Dia 2 – 16 Nissan
        'Bamidbar 28:19-25',      // Dia 3 – Chol HaMoed 1
        'Bamidbar 28:19-25',      // Dia 4 – Chol HaMoed 2
        'Bamidbar 28:19-25',      // Dia 5 – Chol HaMoed 3
        'Bamidbar 28:19-25',      // Dia 6 – Chol HaMoed 4
        'Shemot 13:17-15:26',     // Dia 7 – Shvi\\'i shel Pessach
        'Devarim 15:19 - 16:17'   // Dia 8 – Acharon shel Pessach
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
        'Bamidbar 29:17-22',      // Dia 3 – Chol HaMoed 1
        'Bamidbar 29:20-25',      // Dia 4 – Chol HaMoed 2
        'Bamidbar 29:23-28',      // Dia 5 – Chol HaMoed 3
        'Bamidbar 29:26-31',      // Dia 6 – Chol HaMoed 4
        'Bamidbar 29:26-34',      // Dia 7 – Hoshana Raba
    ],
    'sheminiatzeret': [
        'Devarim 14:22 - 16:17',
        'Devarim 33:1 - 34:12'
    ],
};

export const FESTIVAL_HAFTARA_READINGS = {
    'pesach': ['Yehoshua 5:2 - 6:1'],    // 14 Nissan
    'matzot': [
        'Yehoshua 5:2 - 6:1',          // Dia 1 – 15 Nissan
        'II Melachim 23:1-9,21-25',    // Dia 2 – 16 Nissan
        'Yechezkel 37:1-14',            // Dia 3 – Chol HaMoed 1
        'Yechezkel 37:1-14',            // Dia 4 – Chol HaMoed 2
        'Yechezkel 37:1-14',            // Dia 5 – Chol HaMoed 3
        'Yechezkel 37:1-14',            // Dia 6 – Chol HaMoed 4
        'II Shmuel 22:1-51',            // Dia 7 – Shvi\\'i shel Pessach
        'Yeshayahu 10:32 - 12:6',       // Dia 8 – Acharon shel Pessach
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
        'Yechezkel 38:18-39:7',       // Dia 3 – Chol HaMoed 1
        'Yechezkel 38:18-39:7',       // Dia 4 – Chol HaMoed 2
        'Yechezkel 38:18-39:7',       // Dia 5 – Chol HaMoed 3
        'Yechezkel 38:18-39:7',       // Dia 6 – Chol HaMoed 4
        'Yechezkel 38:18-39:7',       // Dia 7 – Hoshana Raba
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
        torah: 'Em Shemot 20, institui-se o descanso absoluto no sétimo dia, recordando a criação e a saída da escravidão como sinal eterno.',
        neviim: 'A mensagem transmitida em Yeshayahu 58 enfatiza que o repouso deve ser um dia de deleite, alertando o povo a afastar-se de interesses comerciais.',
        ketuvim: 'Exaltando as obras divinas através de Tehilim 92, representa-se o cântico para o dia de repouso como um vislumbre poético de paz completa.',
        talmud: 'A Masechet Shabbat 118b ensina que se todos guardassem dois dias de descanso perfeitamente, a redenção final chegaria imediatamente ao mundo.',
        sod: 'Na secção Yitro 88a do Zohar, revela-se a ascensão dos mundos espirituais e a união da luz cósmica, livre dos julgamentos da semana.'
    },
    'Pessach Sheni': {
        torah: 'Citado em Bamidbar 9, concede-se uma segunda oportunidade num mês seguinte para os israelitas impuros ou distantes oferecerem o sacrifício.',
        neviim: 'A constante mensagem de Yirmiyahu 8 ecoa intensamente, mostrando que o arrependimento sincero gera sempre novas oportunidades de retorno.',
        ketuvim: 'Nos salmos de Tehilim 25, reflete-se o clamor humano que alcança os céus, semelhante a quem busca ansiosamente não ser excluído das bênçãos.',
        talmud: 'Com base na Masechet Psachim 93a, transmite-se uma lição de esperança provando que nunca é tarde demais para quem estava num caminho distante.',
        sod: 'Na obra Pri Etz Chaim 15, simboliza-se a correção dos recipientes espirituais inferiores, alcançando lugares profundos que a luz original não conseguiu atingir.'
    },
    'Yom Pessach': {
        torah: 'Descrevendo a noite da libertação em Shemot 12, institui-se a abstenção de fermento como memorial perpétuo da grande saída.',
        neviim: 'Em Yehoshua 5, a transição da provisão do deserto para os frutos da terra é celebrada no primeiro memorial na terra prometida.',
        ketuvim: 'Através de Tehilim 114, os cânticos transformam o evento histórico num hino de louvor que exalta os grandes milagres e a divisão do mar.',
        talmud: 'O dever de cada pessoa se ver a si mesma como se tivesse saído pessoalmente daquela terra é uma obrigação estrita definida na Masechet Psachim 116b.',
        sod: 'No nível mais profundo explicado no Zohar Bo 40a, a festividade representa a libertação das faíscas sagradas presas nas forças da impureza.'
    },
    'Chag Matzot': {
        torah: 'A ordem estabelecida em Shemot 12 para comer pão ázimo durante sete dias lembra a pressa na saída, onde a massa não teve tempo de levedar, ensinando a humildade.',
        neviim: 'Reforçando a observância das festas em Yechezkel 45, utiliza-se a eliminação do fermento para ecoar a purificação exigida contra o orgulho.',
        ketuvim: 'Em Shir Hashirim 2, o amor primaveril entre o Criador e o povo é refletido, simbolizando a libertação como uma relação fiel.',
        talmud: 'Segundo a Masechet Brachot 17a, a diferença entre o fermento e a matzá reside no "ar" do orgulho, simbolizando o ego que deve ser completamente anulado.',
        sod: 'O pão ázimo é compreendido no Zohar Emor 95b como o pão da cura e da fé, cuja ingestão internaliza a sabedoria superior que escapou ao decaimento.'
    },
    'Yom Shavuot': {
        torah: 'Marcando os cinquenta dias desde a libertação em Vayikra 23, institui-se a festa das semanas, assinalando historicamente a grandiosa outorga da lei.',
        neviim: 'As visões celestiais descritas em Yechezkel 1 conectam a impressionante revelação no monte com as grandiosas visões da glória divina.',
        ketuvim: 'Lida durante a festa, a história de Megillat Ruth 4 ilustra a escolha voluntária de abraçar a fé, espelhando a aceitação na grande revelação.',
        talmud: 'Uma tradição da Masechet Sota 5a assegura que o monte Sinai foi escolhido por ser o mais humilde, demonstrando onde a verdadeira sabedoria reside.',
        sod: 'Ocorre, consoante a visão do Zohar Yitro 78b, a fusão entre o céu e a terra, removendo permanentemente a barreira espessa entre os reinos superiores e o mundo inferior.'
    },
    'Yom Teruah': {
        torah: 'Um dia de descanso no primeiro dia do sétimo mês é prescrito em Vayikra 23, sendo assinalado com o toque sonoro como convocação solene.',
        neviim: 'O som de alerta é associado no relato de Yirmiyahu 4 ao aviso iminente do dia do julgamento e ao chamado urgente ao arrependimento.',
        ketuvim: 'Solidificando o reconhecimento da realeza divina em Tehilim 47, descreve-se o Altíssimo a ascender ao trono ao som do toque do shofar.',
        talmud: 'Destacando a ordem na Masechet Rosh Hashana 16a, indica-se que o chifre curvo lembra a necessidade de curvar o coração em submissão.',
        sod: 'Na obra Pri Etz Chaim 21, o som estridente atrai uma enorme compaixão infinita e quebra as barreiras do rigor cósmico, mitigando julgamentos severos.'
    },
    'Yom Kippur': {
        torah: 'Detalhando um rigoroso jejum e a purificação em Vayikra 16, relata-se o envio do bode para o deserto para expiar as falhas da congregação.',
        neviim: 'Em Yeshayahu 58, avisa-se que o jejum verdadeiro implica quebrar correntes da opressão, partilhar pão e praticar a justiça inabalável.',
        ketuvim: 'Ilustrando que a misericórdia alcança quem se arrepende em Yona 3, mostra-se como a compaixão divina opera face ao perdão.',
        talmud: 'Apesar de o dia perdoar certas falhas, a Masechet Yoma 85b é clara ao exigir que ofensas contra o próximo necessitam de um pedido de perdão direto.',
        sod: 'Atingindo uma dimensão elevada descrita no Zohar Acharei Mot 67a, as falhas terrenas perdem completamente a sua força e deixam de existir na sua raiz.'
    },
    'Chag Sukkot': {
        torah: 'A obrigação prescrita em Vayikra 23 de habitar em cabanas temporárias recorda as moradias frágeis no deserto, celebrando também a recolha das colheitas.',
        neviim: 'Apontando para a união global em Zecharia 14, indica-se que no futuro todas as nações da terra subirão pacificamente para celebrar esta festa.',
        ketuvim: 'Contrastando com a alegria na presença divina, o texto de Kohelet 1 lembra-nos constantemente da transitoriedade da vida material.',
        talmud: 'O ensinamento da Masechet Suka 2a sobre a cabana demonstra que a habitação fixa humana é ilusória, provindo a verdadeira segurança do alto.',
        sod: 'A energia espiritual sublime revela-se no Zohar Emor 103a através da luz circundante Makif do feriado, que é tão intensa que não consegue ser contida internamente.'
    },
    'Shemini Atzeret': {
        torah: 'Com o acréscimo de um oitavo dia de assembleia em Bamidbar 29, estabelece-se um feriado solene que encerra as grandes celebrações.',
        neviim: 'A culminar a dedicação original do Santuário relatada em I Melachim 8, este oitavo dia enviou o povo às suas tendas com profunda alegria.',
        ketuvim: 'As preces pelas águas e o cântico de alegria em Tehilim 104 refletem a profunda dependência humana da providência detalhada nesta época.',
        talmud: 'Comparando a um banquete na Masechet Suka 55b, ilustra-se um rei que pede aos mais próximos para ficarem mais um dia apenas num encontro íntimo.',
        sod: 'Moldando firmemente a personalidade em Pri Etz Chaim 24, o brilho intenso vivenciado no exterior recolhe-se finalmente para o plano material interior.'
    },
    'Simchat Torah': {
        torah: 'Ao concluir a leitura em Devarim 34 e reiniciar o princípio, estabelece-se um ciclo de sabedoria perpétuo e ininterrupto na festividade.',
        neviim: 'A promessa divina entregue em Yehoshua 1 garante que a lei não se apartará da boca do líder, exortando à meditação diurna e noturna.',
        ketuvim: 'Exaltando a doçura e a perfeição dos mandamentos em Tehilim 19, descreve-se a retidão que alegra e ilumina os olhos de quem a estuda.',
        talmud: 'O estabelecimento do calendário de leituras anuais na Masechet Megilla 31a assegura que nenhuma parte do texto sagrado caia no esquecimento.',
        sod: 'Na conceção mística do Zohar Bereshit 1a, as letras não são simples símbolos, mas antes as próprias fundações que geram e sustentam continuamente o universo.'
    },
    'Sefirat Omer': {
        torah: 'A ordem contínua expressa em Vayikra 23 para contar sete semanas a partir da oferenda dos feixes serve como uma ponte de antecipação purificadora.',
        neviim: 'A promessa de um coração renovado em Yechezkel 36 reflete a purificação interior gradual durante estes quarenta e nove dias essenciais de preparação.',
        ketuvim: 'O cântico da colheita em Tehilim 67, composto por quarenta e nove palavras, é utilizado diariamente para alinhar a bênção sobre os frutos da terra e a ascensão espiritual.',
        talmud: 'As complexidades logísticas da contagem e o rigor associado ao sacrifício de cevada estão exaustivamente explorados nas discussões de Masechet Menachot 65b.',
        sod: 'Na cabala do Zohar Emor 97a, cada dia refina uma combinação diferente das emoções, culminando numa transformação completa do caráter humano na quinquagésima luz.'
    },
    'Chag Hanukkah': {
        torah: 'As ofertas dos líderes de Israel descritas em Bamidbar 7 inspiram o conceito de rededicação diária e purificação constante do santuário.',
        neviim: 'A visão do candelabro de ouro em Zecharia 4 reforça a promessa de que não é por força nem por violência, mas pelo espírito divino que a vitória chega.',
        ketuvim: 'O cântico entoado para a dedicação da casa em Tehilim 30 celebra a transformação do choro noturno numa manhã repleta de alegria duradoura.',
        talmud: 'A essência do milagre não reside na guerra, mas sim no pequeno cântaro de azeite que durou oito dias, conforme relata a Masechet Shabbat 21b.',
        sod: 'No plano oculto detalhado em Pri Etz Chaim 26, acender as luzes nos dias mais escuros do ano puxa a luminosidade infinita para dentro dos recantos mais sombrios da realidade.'
    },
    'Yom Purim': {
        torah: 'O confronto implacável contra Amaleque relatado em Shemot 17 alerta o povo de que a força da dúvida e do ataque injustificado deve ser apagada de geração em geração.',
        neviim: 'A ordem transmitida a Saul em I Shmuel 15 para erradicar o mal estabelece o precedente histórico para o conflito final que se desenrola no palácio persa.',
        ketuvim: 'As inversões dramáticas documentadas em Megillat Esther 9 comprovam que a salvação opera nos bastidores, transformando um decreto de morte em dias de banquete e alegria.',
        talmud: 'A obrigação estipulada na Masechet Megilla 7a encoraja a alegria até ao ponto de não se conseguir distinguir entre o vilão que amaldiçoou e o herói que abençoou.',
        sod: 'Profundamente enraizado no Zohar Truma 140b, o disfarce e as máscaras representam o Criador escondido na natureza, operando milagres através dos eventos mais triviais.'
    },
    'Rosh Chodesh': {
        torah: 'O início de cada mês é assinalado em Bamidbar 28 com sacrifícios específicos e o toque das trombetas, marcando a contagem do tempo a partir da renovação lunar.',
        neviim: 'A profecia de Yeshayahu 66 prevê um futuro onde toda a carne virá prostrar-se mensalmente, estabelecendo este dia como uma celebração perene de renovação.',
        ketuvim: 'Louvando o Criador pela precisão do universo em Tehilim 104, destaca-se que a lua foi feita para as estações, ordenando o ciclo das marés e do tempo humano.',
        talmud: 'O rigoroso processo de testemunhar a lua nova é debatido na Masechet Chulin 60b, enfatizando a parceria entre a autoridade terrena e o calendário celeste.',
        sod: 'Na sabedoria do Zohar Pinchas 248a, a lua que não tem luz própria reflete a posição da humanidade de receber e amplificar a luz infinita no mundo inferior.'
    },
    'Ta\'anit Esther': {
        torah: 'A quebra do pacto após o incidente do bezerro de ouro em Shemot 32 ensina como o jejum e a oração intensa podem anular decretos celestiais severos.',
        neviim: 'O apelo arrebatador em Yeshayahu 55 incentiva todos a buscar a proximidade divina enquanto ela está disponível, ecoando a convocação urgente para o arrependimento.',
        ketuvim: 'A heroína determina em Megillat Esther 4 que o seu povo deve jejuar por três dias sem comer nem beber, unindo a nação antes da sua intervenção arriscada.',
        talmud: 'O jejum não é para sofrimento vão, mas segundo a Masechet Megilla 2a serve para despertar os corações e incitar ao arrependimento frente à crise iminente.',
        sod: 'Desvendado no Zohar Truma 141a, a abstinência purifica o recipiente material, permitindo que as orações da nação subam diretamente sem qualquer interferência.'
    },
    'Tzom Tammuz': {
        torah: 'A descida com as primeiras tábuas termina em destroços perante a rebelião em Shemot 32, ensinando as graves consequências da rutura e da idolatria num momento frágil.',
        neviim: 'A queda trágica das muralhas que protegem o santuário é documentada em Yirmiyahu 52, abrindo caminho para a desolação completa da cidade sagrada.',
        ketuvim: 'As lágrimas derramadas pelos cativos em Tehilim 137 espelham a saudade da terra prometida logo no momento em que as proteções originais caíram.',
        talmud: 'A Masechet Ta\'anit 28b enumera cinco grandes tragédias ocorridas neste dia, sublinhando a vulnerabilidade que surge quando a união interna do povo se quebra.',
        sod: 'As fendas criadas neste período na visão de Pri Etz Chaim 29 representam a infiltração de energias caóticas no domínio sagrado que requerem um esforço rigoroso de reparação.'
    },
    'Tisha BAv': {
        torah: 'O pecado dos espias culminando no choro injustificado do povo em Bamidbar 14 fixou este dia como um tempo de lamento duradouro pelas gerações futuras.',
        neviim: 'As profecias devastadoras proferidas em Yirmiyahu 9 choram amargamente sobre as ruínas, descrevendo o fogo devorador e a dispersão dolorosa.',
        ketuvim: 'O livro de Eicha 1 é a expressão máxima do desespero e do luto solitário, retratando a cidade outrora populosa agora vazia e desolada como uma viúva.',
        talmud: 'Na análise contundente da Masechet Ta\'anit 29a, o exílio ocorreu devido ao ódio gratuito e à divisão infundada entre irmãos, que destruiu a morada terrena do Criador.',
        sod: 'As cinzas da destruição referidas no Zohar Truma 142b escondem o paradoxo supremo, pois ensina-se que exatamente no pico da escuridão deste dia nasce o potencial do redentor.'
    },
    'Tzom Gedaliah': {
        torah: 'O desrespeito pela autoridade justa e pela liderança nomeada ecoa em Bamidbar 16 a anarquia ancestral que corrói os fundamentos da responsabilidade comunitária.',
        neviim: 'O assassinato traiçoeiro do governador e o desespero final dos sobreviventes na terra são vividamente contados em Yirmiyahu 41, apagando a última chama de autonomia.',
        ketuvim: 'O clamor contra os lábios mentirosos e a traição constante no seio da comunidade encontram reflexo nos lamentos ascensoriais de Tehilim 120.',
        talmud: 'Ao comparar o assassinato de uma pessoa justa à queima do santuário, a Masechet Rosh Hashana 18b alerta para as consequências mortais da violência política interna.',
        sod: 'O declínio que a morte do governante representa na obra Pri Etz Chaim 30 manifesta a ocultação final da luz providencial, mergulhando a congregação no escuro do exílio absoluto.'
    },
    'Tzom Tevet': {
        torah: 'O desastre coletivo gerado por graves desvios recorda em Devarim 28 as duras punições repreensivas perante as falhas severas da nação.',
        neviim: 'A agonia avassaladora da capital começou inquestionavelmente no exato dia focado em Yechezkel 24, quando as muralhas foram isoladas e o cerco foi montado.',
        ketuvim: 'Ensinando de forma extrema o desumano custo da obstinação contínua e as privações severas da dura fome, os lamentos agudos ecoam alto por Tehilim 74.',
        talmud: 'Sendo um jejum de extrema gravidade, a Masechet Rosh Hashana 18b decreta que a privação neste dia não seria adiada nem que calhasse no dia de repouso semanal.',
        sod: 'Afunilando denso rigor impiedoso do céu, a compilação Bnei Yissaschar 15 expõe que enormes e intransponíveis barreiras travaram então perfeitamente as fontes luminosas.'
    }
};
