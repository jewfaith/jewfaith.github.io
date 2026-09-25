/**
 * ABOUTCONTENT.JS - MANIFESTO, ORIGEM, METODOLOGIA E PROPÓSITO DO YISRAEL DATE
 * 
 * Documenta com rigor a metodologia astronómica, matemática e haláchica:
 * - Algoritmos solares de Zmanim (Shkiá, Alot HaShachar, Tzeit HaKochavim).
 * - Origem do calendário hebraico (Ciclo Metónico de 19 anos, 4 Dechiyot do Rambam).
 * - Critérios haláchicos adotados (Método do Gra / Rambam vs. Magen Avraham, Shabat e velas).
 */

export const ABOUT_PROJECT_TITLE = 'Sobre Nós';
export const ABOUT_PROJECT_SUBTITLE = 'Origem e Propósito';

export const ABOUT_PROJECT_PARAGRAPHS = [
    'O Yisrael Date é uma plataforma independente concebida para integrar o calendário bíblico, os horários astronómicos haláchicos e as escrituras sagradas de Israel num ambiente unificado, sóbrio e de consulta imediata.',
    'A arquitetura do sistema reúne a conversão de datas hebraicas, a determinação precisa do pôr do sol em cada localidade e a identificação contínua das festividades, superando a dispersão histórica entre tabelas e calendários isolados.',
    'A plataforma consagra uma rigorosa distinção canónica entre os mandamentos perpétuos instituídos na Torá Escrita e as celebrações ou jejuns estabelecidos pela tradição rabínica, contextualizando cada solenidade sob a sua respetiva fundamentação histórica e espiritual.',
    'Os horários litúrgicos e as horas proporcionais haláchicas são calculados dinamicamente a partir das coordenadas geográficas reais de cada localidade, determinando com exatidão a alvorada, o nascer do sol, o meio-dia, o crepúsculo vespertino e a saída das estrelas.',
    'O acervo integrado faculta o acompanhamento contínuo da Parashá semanal da Torá, os textos proféticos da Haftará, os escritos sagrados de Ketuvim e leituras rotativas de literatura tradicional judaica em língua portuguesa através da biblioteca Sefaria.',
    'Em estrita observância às leis de santidade do Shabat e dos dias de Yom Tov, a plataforma suspende de forma automática qualquer módulo financeiro ou mecanismo de apoio voluntário durante a vigência do tempo sagrado.',
    'O projeto rege-se pelos compromissos perenes de gratuidade universal, ausência de anúncios comerciais, inexistência de comércio eletrónico e salvaguarda absoluta da intimidade dos utilizadores, operando sem cookies de rastreio e sem recolha de dados pessoais.',
    'A conceção, arquitetura de software e desenvolvimento da aplicação constituem obra autoral independente de Mikhael, dedicada à preservação dos ciclos sagrados e ao estudo universal dos ensinamentos de Israel.'
];

export const ABOUT_METHODOLOGY_TITLE = 'Metodologia Canónica';
export const ABOUT_METHODOLOGY_SUBTITLE = 'Cálculos Explicados';

export const ABOUT_METHODOLOGY_PARAGRAPHS = [
    'A metodologia dos horários litúrgicos baseia-se em modelos astronómicos de precisão solar calculados a partir da latitude, longitude e altitude da localidade ativa.',
    'O cálculo solar afere a declinação solar e a equação do tempo em cada fração horária para determinar com rigor o alvorecer astronómico a dezasseis graus e meio abaixo do horizonte.',
    'O nascimento do sol e o ocaso vespertino correspondem ao instante geométrico em que a borda solar superior tangencia o horizonte visual corrigido para a refração atmosférica padrão.',
    'A hora proporcional haláchica Shaah Zmanit é calculada segundo o método canónico do Gra e do Rambam, que divide a extensão exata entre o nascer e o pôr do sol em doze partes iguais.',
    'Para períodos de transição crepuscular, o sistema providencia igualmente a mensuração alternativa segundo o método de Magen Avraham com base no alvorecer matutino e na saída de três estrelas.',
    'O encerramento do Shabat e a saída das festividades são fixados pelo momento exato em que três estrelas de magnitude média tornam-se visíveis no firmamento celeste.',
    'A intercalação do calendário hebraico fundamenta-se no ciclo metónico de dezanove anos solares que acomoda harmoniosamente duzentos e trinta e cinco meses lunares.',
    'Os anos embolismicos de treze meses ocorrem nos anos três, seis, oito, onze, catorze, dezassete e dezanove do ciclo metónico com a inclusão de Adar Rishon e Adar Sheni.',
    'A determinação do primeiro dia do ano obedece às quatro regras fundamentais de adiamento consignadas pelo Rambam no tratado Hilchot Kiddush HaChodesh da Mishnê Torá.',
    'A primeira regra impede que Rosh Hashaná ocorra em domingo, quarta ou sexta-feira para evitar a sobreposição proibitiva entre Yom Kippur e o Shabat sagrado.',
    'A segunda regra adia a celebração caso a conjunção do Molad ocorra ao meio-dia solar ou após esse limiar astronómico.',
    'A terceira e quarta regras aplicam compensações lunares estritas para preservar a extensão anual e a sincronização perfeita com a estação da primavera bíblica.'
];

export function getAboutProjectHtml() {
    return `
        <div class="levels-container compliance-modal-stack">
            ${ABOUT_PROJECT_PARAGRAPHS.map(p => `
                <div class="info-modal-card">
                    <div class="info-modal-value">
                        ${p}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

export function getAboutMethodologyHtml() {
    return `
        <div class="levels-container compliance-modal-stack">
            ${ABOUT_METHODOLOGY_PARAGRAPHS.map(p => `
                <div class="info-modal-card">
                    <div class="info-modal-value">
                        ${p}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}
