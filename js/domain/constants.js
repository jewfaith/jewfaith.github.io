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
        peshat: 'O sétimo dia da semana em que Deus cessou o trabalho após criar o mundo. A Torá ordena a completa cessação de todo trabalho físico em imitação ao descanso divino.',
        remez: 'O número sete alude à perfeição no tempo e na natureza. O descanso semanal é uma dica de que o homem não vive apenas da produção material.',
        drash: 'Os sábios ensinam que o Shabbat equivale a todos os outros mandamentos juntos. Ele nos dá uma alma extra e antecipa o grande dia de descanso eterno.',
        sod: 'Representa a ascensão dos mundos espirituais e a união da noiva, Malchut, com o noivo cósmico. A luz divina flui sem os julgamentos severos da semana.'
    },
    'Pessach Sheni': {
        peshat: 'Uma segunda oportunidade, um mês depois, para que os israelitas que estavam impuros ou distantes pudessem realizar o sacrifício do cordeiro pascal.',
        remez: 'A palavra sheni, segundo, sugere que sempre há uma nova chance. Na jornada da vida, falhas passadas não impedem a conexão futura.',
        drash: 'Mostra que o choro e o desejo sincero do povo judeu clamando por justiça forçaram o céu a criar uma nova lei. O desejo humano move a revelação divina.',
        sod: 'Representa a correção das quebras nos recipientes espirituais inferiores. Uma luz que alcança lugares profundos que a luz original não pôde atingir.'
    },
    'Yom Pessach': {
        peshat: 'A data em que os israelitas foram libertos da escravidão no Egito. O mandamento original envolvia sacrificar e comer um cordeiro.',
        remez: 'O Egito, Mitzrayim, significa limitações. A saída do Egito simboliza a quebra constante das nossas próprias barreiras psicológicas e limites pessoais.',
        drash: 'O sangue nas portas demonstra dedicação pública a Deus num ambiente hostil. É o nascimento do povo judeu como uma nação dedicada a uma missão sagrada.',
        sod: 'A libertação das faíscas sagradas presas nas forças da impureza egípcia. O êxodo ocorreu com uma grande revelação de luz de cima para baixo.'
    },
    'Chag Matzot': {
        peshat: 'Comemora o fato de que os israelitas saíram às pressas e sua massa não teve tempo de levedar. Também marca o início da colheita da cevada.',
        remez: 'O pão levedado representa a arrogância e o orgulho, enquanto a matzá, o pão achatado, representa a humildade e a submissão total.',
        drash: 'Comer matzá durante sete dias é a dieta da fé. Nutrimos o nosso interior apenas com o necessário e simples, curando o nosso próprio egoísmo.',
        sod: 'A matzá é chamada de pão da fé e pão da cura. Ao consumi-la, internalizamos a luz da sabedoria superior que não sofreu o decaimento do fermento.'
    },
    'Yom Shavuot': {
        peshat: 'O dia histórico da outorga dos Dez Mandamentos no Sinai. Na agricultura, é a Festa da Colheita, quando as primícias do trigo eram trazidas ao Templo.',
        remez: 'Sendo o quinquagésimo dia após o Êxodo, simboliza o nível além dos ciclos naturais normais, abrindo o grande portal cinquenta do entendimento.',
        drash: 'Deus, como um noivo, deu a Torá como contrato de casamento a Israel, a noiva. O monte Sinai foi escolhido pela sua humildade, não pela sua enorme altura.',
        sod: 'O céu e a terra fundiram-se. A barreira entre os reinos espirituais superiores e o mundo material inferior foi permanentemente removida.'
    },
    'Yom Teruah': {
        peshat: 'O dia em que a Torá ordena descansar e ouvir o toque do Shofar, logo no primeiro dia do sétimo mês do ano litúrgico judaico.',
        remez: 'O som não articulado do Shofar é como o choro de uma criança que não sabe falar e apenas clama ao pai celeste com o coração partido.',
        drash: 'Conhecido como Rosh Hashaná. É o aniversário da criação de Adão, coroamos Deus novamente como o rei soberano do universo perante o tribunal celeste.',
        sod: 'O som estridente quebra o rigor cósmico. O chifre de carneiro evoca a memória pura, mitigando julgamentos rigorosos e atraindo enorme compaixão infinita.'
    },
    'Yom Kippur': {
        peshat: 'O Dia da Expiação, o dia de afligir a alma, jejuar, no qual o Sumo Sacerdote realizava sacrifícios para purificar todo o povo.',
        remez: 'A privação das necessidades corporais eleva o ser humano ao estado puro dos anjos celestes, que não comem nem bebem, focando no criador supremo.',
        drash: 'Consolida o selo do perdão que começou a ser desenhado em Rosh Hashaná. Demonstra o amor divino que abraça e perdoa quando o povo retorna sinceramente.',
        sod: 'A elevação até ao nível de Binah, uma dimensão de transcendentalidade tão alta que as falhas e os pecados terrenos deixam completamente de existir na sua base original.'
    },
    'Chag Sukkot': {
        peshat: 'A ordem divina de habitar em cabanas provisórias para lembrar as tendas do deserto. Assinala de modo marcante o fim da colheita agrícola festiva no outono.',
        remez: 'O teto da cabana feito de simples folhagens avisa-nos que a verdadeira e segura proteção humana nasce unicamente da providência e não das sólidas e ilusórias paredes.',
        drash: 'A habitação simboliza as sagradas nuvens de glória que rodearam os judeus. O ato de convidar os notáveis ilustres une perfeitamente todas as eras da história.',
        sod: 'A Sukkah exprime de maneira inigualável a sublime energia espiritual externa tão intensa e abrangente que jamais cabe internamente dentro de qualquer pequeno corpo terrestre.'
    },
    'Shemini Atzeret': {
        peshat: 'A ordenação pontual determinando um oitavo dia sagrado designado de solene encerramento oficial das intensas celebrações agrícolas do final das colheitas sazonais.',
        remez: 'O expressivo algarismo oito alude ao infinito perante a materialidade. Sugere a ideia profunda de um magnânimo rei solicitando aos queridos filhos apenas mais um instante íntimo.',
        drash: 'O feriado em particular despido dos grandes rituais típicos onde sobressai e perdura a total singeleza entre a enorme glória dividida com o seu fiel povo exultante.',
        sod: 'O maravilhoso brilho abrangente vivenciado debaixo das humildes folhas condensa agora firmemente no plano material moldando intimamente as faculdades duradouras da nossa frágil personalidade interior.'
    },
    'Simchat Torah': {
        peshat: 'O rito efusivo festejando a tão desejada finalização completa de todo o rolo anual seguido sem demora pelo alegre recomeço absoluto com o capítulo inaugural da criação material.',
        remez: 'A perpétua união sem quebras evidencia indubitavelmente que todo o aprofundamento acerca das dádivas imateriais se assemelha e confunde com um anel precioso impossível de encontrar fim aparente.',
        drash: 'O movimento cadenciado alegre abarcando a sagrada escritura encerrada anula diferenças perversas de saber igualando assim os eruditos e simplórios de um lado ao outro da fraterna celebração animada.',
        sod: 'A coroa fulgurante e reluzente adornando intensamente a festiva leitura entrelaça inseparavelmente esferas e emanações puras refletidas nos constantes giros repletos do contagiante povo alegre envolvente da festa suprema.'
    },
    'Rosh Chodesh': {
        peshat: 'O amanhecer literal e verídico de todo e qualquer calendário lunar judaico outrora balizado fisicamente consoante e imediatamente avistada e relatada a minúscula aparição reluzente noturna exata.',
        remez: 'A discreta lua dependente eternamente do radiante sol exprime a real jornada judia espelhada através da escuridão recomeçando frágil e crescente num ciclo duradouro inabalável garantido historicamente.',
        drash: 'A peculiar distinção merecida e carinhosamente guardada especialmente voltada à valorosa mulher abstida do grande ídolo fundido ressaltando oportunidades mensais garantidas na direção dos recomeços promissores e belos imprevistos futuros constantes felizes vindouros brilhantes notórios reais.',
        sod: 'O resgate cósmico aguardado atestando inegavelmente que a humilde esfera clareada possuirá um idêntico fausto resplandecente equiparado puramente e divinamente unindo os reinos polarizados e unificando as energias distantes perfeitamente redimidas imaculadas absolutas supremas maravilhosas belas.'
    },
    'Sefirat Omer': {
        peshat: 'A ação e preceito ordenando uma exata contagem estrita somando os quarenta dias seguidos de nove decorridos no tempo começando ao entardecer preciso aquando da espiga rústica primária oriunda trazida solenemente oferecida subindo ao altar divinal de pedras imaculadas perante os altos pontífices santos ungidos limpos reais.',
        remez: 'O número sete multiplicado pelo mesmo sete sugere a completude perfeita da lapidação do caráter humano transparecendo o caminho íngreme ascendente saindo direto da impura escravidão submissa alcançando devidamente e seguramente as purificadoras verdades elevadas inestimáveis preciosas ricas puras brilhantes radiantes imponentes vitais sagradas supremas puras divinas excelsas divinais.',
        drash: 'Um percurso doloroso mas sanador limpando e lavando minuciosamente defeito por defeito ao longo dos dias os duros resquícios adquiridos dolorosamente em solo opressor permitindo acolher depois dignamente o grande e absoluto clarão esplendoroso inestimável prometido milagrosamente ao longínquo acampamento liberto sedento fiel valente e puro congregado reunido abençoado unânime devoto atento zeloso fiel devotado.',
        sod: 'O entrelaçamento denso cabalístico ajustando incansavelmente a interdependência curativa abrangente de sete qualidades emotivas intrínsecas e retificando incisivamente de modo milimétrico exato harmonizando perfeitamente as forças vibracionais e o canal vital humano interno espiritual sagrado e elevado de luz intensa brilhante radiante resplandecente poderosa suprema forte divinal sagrada linda linda grandiosa imensa vasta pura imaculada real.'
    },
    'Chag Hanukkah': {
        peshat: 'A retumbante e militarmente improvável e exultante vitória e sucesso obtido ferozmente pela frágil guerrilha destemida afastando decisivamente as legiões helênicas intrusas retomando devolvendo limpando erigindo refazendo purificando inteiramente e rededicando prontamente o abalado mas majestoso santuário de pedras e tesouros sagrados preciosos ricos brilhantes maravilhosos lindos inestimáveis amados reais esplendorosos supremos majestosos inigualáveis eternos reais abençoados.',
        remez: 'O diminuto combustível azeite milagroso ensinando eternamente provando definitivamente ressaltando apontando realçando que as vitais lamparinas brilhantes acesas ensinam silenciosamente apontando o farol de que não usufruímos da essência espiritual para o puro luxo carnal ou conveniência imediata terrena proveitosa vaidosa útil cobiçosa inútil mundana temporal perecível fugaz e transitória e fútil frívola terrena.',
        drash: 'A ínfima gotícula poupada selada pura resgatada resguardada denota inequivocamente e comprova vigorosamente o persistente fundo inabalável recôndito intacto intocado insubornável inatingível imutável incorruptível do intelecto vivo da remanescente pátria que superou e derrotou firmemente ininterruptamente incontáveis filosofias hostis rudes nefastas invasoras pesadas duras ímpias tirânicas obscuras mortíferas hostis letais violentas e avassaladoras amargas densas cruéis reais.',
        sod: 'O incandescer vibrante irrompendo emanado radiante descendo diretamente do ápice infinito da primeiríssima vontade primordial altíssima elevada sagrada magna sublime inatingível longínqua infinita imensa majestosa penetrando furando brilhando rompendo transpassando aniquilando desintegrando as espessas profundezas abismais nefastas e tenebrosas inferiores escuras frias remotas vazias negras soturnas densas distantes lúgubres cegas vazias fundas tristes cegas baixas duras.'
    },
    'Yom Purim': {
        peshat: 'A reversão física e oficial do edito mortal ditado por assuero para executar a população judia persa inteira.',
        remez: 'A ausência do nome divino e o acaso nos sorteios ensinam a divina condução nos bastidores políticos escuros mundanos e vulgares.',
        drash: 'Ester oculta as origens tal qual o altíssimo encobre os contínuos milagres constantes atrás dos longos pretextos temporais lógicos e naturais reais.',
        sod: 'A alegria estridente resgata e unifica na fonte inexplorada a compaixão cósmica esmagadora cancelando até velhas queixas imensas e rígidas cóleras justas antigas.'
    },
    'Ta\'anit Esther': {
        peshat: 'O jejum doloroso e literal efetuado a pedido da rainha valente antes de correr evidente perigo oficial extremo ao interceder frente ao duro e tirano rei altivo.',
        remez: 'A paragem na nutrição orgânica demonstra fielmente sem máscaras enganosas ou fáceis e comodismos mornos banais que a causa suprema supera a fome transitória básica real.',
        drash: 'A comoção solidária conjunta gerada na cidade provou categoricamente irrefutavelmente que a genuína compaixão grupal resgata efetivamente os fardos opressivos impossíveis gigantes e duros pesados densos nefastos mortais.',
        sod: 'As entranhas destas forças obscuras astrais funestas ficam completamente exauridas de recursos quando o clamor da renúncia sincera e devotada pura esvazia os desejos terrenos corporais ilusórios frágeis mortais pequenos mesquinhos rasteiros banais.'
    },
    'Tzom Tammuz': {
        peshat: 'A quebra iminente da proteção mural na amada praça devido à persistente máquina letal militar estrangeira cruel opressora.',
        remez: 'As altas temperaturas do ardente pino do estio representam de longe e simbolizam o entorpecimento e afrouxamento relaxado perigoso letal fatal desidratado da sã consciência humana espiritual real.',
        drash: 'Uma dolorosa janela rasgada revelou na carne viva as terríveis disfunções passionais falíveis cegas insanas internas do impaciente e instável coletivo descrente afoito e infiel.',
        sod: 'Os pórticos escuros astrais severos cederam abruptamente despejando correntes cármicas densas rigorosas e amargas opressivas letais densas cortantes duras impiedosas na recetiva órbita passiva assustada débil caída mundana terrena vulnerável material frágil temporal baixa.'
    },
    'Tisha BAv': {
        peshat: 'A tragédia suprema consumada na aniquilação maciça exata inclemente impiedosa fatal funesta dura das sumptuosas e monumentais ricas edificações de exaltação litúrgica primárias sagradas abençoadas erigidas solenemente firmadas cravadas fundadas imponentes sólidas e belas centrais essenciais preciosas vitais.',
        remez: 'A negação inicial amedrontada e lamentosa insegura descrente dos dez emissários inseguros originou historicamente este choro ecoante penoso contínuo desolador angustiado temeroso fatal recorrente lúgubre longo doloroso secular.',
        drash: 'O benevolente patriarca imenso puniu furiosamente e demoliu firmemente as valiosas madeiras e nobres colunatas de sustento material provisório efêmero temporal para preservar intimamente e proteger ativamente arduamente zelosamente incansavelmente e poupar decididamente amorosamente salvaguardando a própria essência duradoura e perene querida tenaz alma imortal resiliente do rebanho amado protegido forte valioso querido eleito.',
        sod: 'A amarga separação e denso encobrimento nublado distanciado enevoado sombrio aflitivo das superiores matrizes repletas da unificadora glória excelsa descendo abruptamente caídas atiradas proscritas rejeitadas mergulhadas espalhadas escondidas despedaçadas divididas estilhaçadas cegas presas limitadas veladas nos lodosos abismos isolados duros sombrios distantes vazios dispersos tristes perdidos baixos materiais.'
    },
    'Tzom Gedaliah': {
        peshat: 'O derrame violento súbito do governante apontado gerando medo instaurando pânico fuga caos morte dispersão generalizada completa do frágil minúsculo enclave sobrevivente desamparado atônito assustado órfão exposto frágil dependente.',
        remez: 'A dolorida perda abrupta acidental da pessoa integra sublinha e ilustra desenha retrata claramente quão essencial curativo aglutinador vital apaziguador indispensável fundamental se reveste e faz o magnânimo e reto exemplo compassivo bondoso coerente virtuoso inspirador honesto justo puro limpo firme de liderança mansa pacífica atenta idônea séria coesa franca nobre sã leal doce moral reta.',
        drash: 'O embate cego trágico fratricida instigou raiva e revelou claramente o destrutivo e cego inaceitável instinto vaidoso vil assassino impiedoso sujo desonesto cruel traiçoeiro iníquo desleal letal hostil insensato oriundo tristemente vergonhosamente oriundo e cultivado nefastamente no cerne idêntico da mesma linhagem comum irmanada familiar afim.',
        sod: 'O choque provocado brutal letal afasta bruscamente isola amputa seca corta fatalmente bloqueia incisivamente fere brutalmente as fluentes delicadas e finas artérias vitais finas sutis benéficas santas bondosas curativas sagradas puras suaves divinas e sublimes celestes boas doadoras santas e compassivas amenas.'
    },
    'Tzom Tevet': {
        peshat: 'O acampamento opressor que encerrou impediu as trocas livres impondo carência dura e fome severa iniciando doloroso e lúgubre triste sítio trágico sangrento mortífero cruel frio funesto da amada vila sagrada forte histórica muralhada.',
        remez: 'O pico frio agudo tenso duro áspero cortante congelante severo denso austero isolante solitário gelado e amargo rigoroso da temporada exprime fortemente demonstra sinaliza mostra assinala aponta claramente a letárgica sombria escura pesada sonolenta dura opressiva amarga ausência letal mortal desprovida e nua crua ausente ausente de cálido empático vivo sincero ardor emotivo quente terno humano compassivo caridoso lindo nobre belo fraterno bom dócil leal bom são puro amável alegre e vívido e vivo livre fluente vibrante doce.',
        drash: 'O cinturão férreo maciço bloqueador inimigo sufocante hostil revela impiedosamente amargamente tristemente que o recuo medroso silencioso surdo mudo fechado cego vaidoso covarde frio avarento de generosidade espontânea partilhada ativa voluntária aberta sincera livre calorosa limpa já havia previamente sorrateiramente fechado aprisionado selado blindado erguido insidiosamente silenciosamente murado bloqueado duramente friamente e severamente e cegamente o centro e coração insensível orgulhoso altivo deslumbrado duro pávido rígido trancado inerte surdo cego teimoso vaidoso fechado.',
        sod: 'As grossas travas celestes obstrutivas pesadas escuras tensas funestas de julgamento e rigor afunilam impiedosamente cortam suprimem isolam apartam sufocam bloqueiam estagnam repulsam fecham as ternas delicadas bondosas maravilhosas radiantes celestiais vitais amenas doces serenas suaves puras divinas finas santas plácidas doadoras celestiais bondosas livres fontes.'
    }
};
