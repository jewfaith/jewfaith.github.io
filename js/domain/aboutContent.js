/**
 * ABOUTCONTENT.JS - MANIFESTO, ORIGEM E PROPÓSITO DO YISRAEL DATE
 * 
 * Contém o texto canónico de apresentação do projeto, detalhando a motivação,
 * a distinção bíblica vs. rabínica, o cálculo astronómico local e os princípios
 * de transparência e gratuidade universal.
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
