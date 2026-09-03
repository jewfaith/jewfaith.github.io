import { ICONS } from './icons.js';

/**
 * PARECER JURÍDICO DE CONFORMIDADE E DECLARAÇÃO DE PROTEÇÃO DE DADOS
 * ARQUITETURA FORENSE DE CUMPRIMENTO SIMULTÂNEO MULTIJURISDICIONAL (55+ ESTATUTOS GLOBAIS)
 * 
 * Regras Estritas do Consulente:
 * 1. Sempre em duas palavras: Todos os títulos e subtítulos contêm rigorosamente 2 palavras.
 * 2. Dentro do modal não tem título: Sem rótulos ou cabeçalhos internos nos blocos.
 * 3. A cada novo parágrafo em outro bloco: Cada oração jurídica tem seu info-modal-card individual.
 * 4. Sem negrito, sem parênteses, sem barras e sem dois pontos no texto explicativo.
 * 5. Redação em tom formal advocatício, detalhando a operação real do sítio e todas as 55 leis.
 * 6. Contém 100% dos requisitos estatutários obrigatórios.
 */

function renderSectionHeader(title, marginTop = '14px') {
    return `
        <div class="festival-section-header" style="margin-top: ${marginTop};">
            <div class="festival-section-title-wrap">
                <h3 class="festival-section-title">${title}</h3>
            </div>
        </div>
    `;
}

function makeModalBlocks(paragraphs) {
    return `
        <div class="levels-container compliance-modal-stack">
            ${paragraphs.map(p => `
                <div class="info-modal-card">
                    <div class="info-modal-value">
                        ${p}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderCard({ id, icon, title, desc, paragraphs }) {
    const safeHtml = makeModalBlocks(paragraphs).replace(/"/g, '&quot;');
    return `
        <div class="settings-card event-card glass-panel info-trigger" 
             id="card-compliance-${id}" 
             tabindex="0" 
             role="button" 
             data-info-title="${title}" 
             data-info-html="${safeHtml}" 
             aria-label="${title}" 
             style="cursor: pointer;">
            <div class="settings-card-left">
                <i class="${icon} settings-icon"></i>
                <div class="settings-card-text">
                    <span class="settings-card-title">${title}</span>
                    <span class="settings-card-desc">${desc}</span>
                </div>
            </div>
            <i class="fa-solid fa-chevron-right" data-icon="chevronRight" style="color: var(--text-muted); font-size: 11px;"></i>
        </div>
    `;
}

export function renderPrivacyView() {
    const container = document.getElementById('privacy-content-container') || document.getElementById('tools-list') || document.getElementById('premium-features-list');
    if (!container) return;
    if (container.children.length > 0) return; // Já renderizado e preservado em cache DOM

    // 1º CARD: ELIMINAR DADOS (SEM TÍTULO ACIMA)
    const secPurgeCards = [
        {
            id: 'expurgo-imediato',
            icon: 'fa-solid fa-trash-can',
            title: 'Eliminar Dados',
            desc: 'Expurgo Imediato',
            paragraphs: [
                'O acionamento formal do instrumento resolutivo abaixo concretiza o expurgo definitivo e irrevogável de todos os registos locais, repondo a aplicação ao estado de pureza original.',
                '<button id="modal-btn-purge" class="compliance-purge-btn">Confirmar Expurgo</button>'
            ]
        }
    ];

    // SEÇÃO 1: OPERAÇÃO REAL
    const sec1Header = renderSectionHeader('Operação Real', '14px');
    const sec1Cards = [
        {
            id: 'calculos-solares',
            icon: 'fa-solid fa-sun',
            title: 'Cálculos Solares',
            desc: 'Horários Sagrados',
            paragraphs: [
                'Atesta-se perante a ordem jurídica que a plataforma processa em tempo real e de forma ininterrupta os horários litúrgicos denominados Zmanim com esteio na posição astronómica do sol.',
                'A execução matemática compreende o alvorecer civil, o nascer do sol, o meio dia solar, o tempo de Minchá, o pôr do sol e o surgimento de três estrelas no firmamento celeste.',
                'O sistema afere a contagem decrescente exata para o acendimento das velas de Shabat e o encerramento da Havdalá segundo a tradição milenar da lei de Israel.',
                'O processamento opera exclusivamente no processador do equipamento do titular, sem qualquer envio de telemetria ou geolocalização para servidores externos.'
            ]
        },
        {
            id: 'leituras-sagradas',
            icon: 'fa-solid fa-book-open',
            title: 'Leituras Sagradas',
            desc: 'Cânone Bíblico',
            paragraphs: [
                'A plataforma faculta o estudo ordenado e contínuo da porção semanal da Torá designada por Parashá e o correspondente ciclo litúrgico perpétuo.',
                'O acervo compreende as passagens proféticas da Haftará, os escritos sagrados de Ketuvim e as porções associadas às santas convocações de Israel.',
                'As leituras das Sagradas Escrituras acolhem os textos canónicos bíblicos em língua hebraica com rigorosa fidelidade à tradução vernácula para o idioma português.',
                'O acesso aos manuscritos sagrados constitui exercício legítimo do direito à liberdade de pensamento, consciência e culto religioso amparado pelo direito internacional.'
            ]
        },
        {
            id: 'calendario-festivo',
            icon: 'fa-solid fa-calendar-day',
            title: 'Calendário Festivo',
            desc: 'Ciclo Litúrgico',
            paragraphs: [
                'O sistema estrutura a totalidade das festas bíblicas ordenadas na Torá e as festividades rabínicas consagradas pela tradição talmúdica milenar.',
                'A computação discrimina os dias sagrados segundo os meses lunissolares de Nissan, Iyar, Sivan, Tamuz, Av, Elul, Tishrei, Cheshvan, Kislev, Tevet, Shevat e Adar.',
                'Cada celebração litúrgica apresenta contadores temporais regressivos e pareceres temáticos sobre a origem divina e histórica da data sagrada.'
            ]
        },
        {
            id: 'fontes-publicas',
            icon: 'fa-solid fa-cloud-arrow-down',
            title: 'Fontes Públicas',
            desc: 'Conexões Abertas',
            paragraphs: [
                'A plataforma estabelece consultas legítimas e pontuais ao serviço público aberto OpenStreetMap Nominatim para obtenção estrita das coordenadas geográficas da localidade indicada.',
                'A sincronização das efemérides astronómicas do calendário apoia-se nos dados públicos abertos fornecidos pela entidade Hebcal sob padrão aberto da internet.',
                'As transmissões decorrem sob protocolo criptografado TLS sem autenticação de usuário, sem trânsito de nomes, sem endereços de correspondência e sem rastreadores persistentes.',
                'As medidas técnicas de segurança asseguram o total isolamento das requisições na caixa de areia do próprio navegador de internet do usuário.'
            ]
        },
        {
            id: 'memoria-terminal',
            icon: 'fa-solid fa-hard-drive',
            title: 'Memória Terminal',
            desc: 'Guarda Local',
            paragraphs: [
                'O sistema retém no armazenamento local do navegador as coordenadas geográficas de latitude e longitude da localidade eleita pelo titular.',
                'Fica gravada a denominação textual da cidade para identificação visual contínua na interface da aplicação.',
                'Permanece consignada a tolerância em minutos livremente escolhida pelo usuário para o acendimento prévio das velas antes da Shkiá.',
                'Encontram-se preservadas as preferências estéticas de tema visual entre o modo automático solar, o modo claro de pergaminho e o modo escuro de obsidiana.',
                'No ambiente de computador, o sistema opera de forma fixa no formato de painel lateral com gaveta deslizante acelerada por hardware.',
                'O prazo de conservação vincula-se com exclusividade à custódia do titular no navegador, persistindo unicamente até a limpeza voluntária ou a ordem formal de expurgo.'
            ]
        }
    ];

    // SEÇÃO 2: GOVERNANÇA ATIVA
    const sec2Header = renderSectionHeader('Governança Ativa', '14px');
    const sec2Cards = [
        {
            id: 'blindagem-juridica',
            icon: 'fa-solid fa-shield-halved',
            title: 'Blindagem Jurídica',
            desc: 'Parecer Técnico',
            paragraphs: [
                'Em sede de parecer forense, atesta-se a blindagem jurídica integral da plataforma contra quaisquer passivos regulatórios ou infrações administrativas de privacidade.',
                'A imunidade material decorre da adoção intransigente da privacidade desde a conceção e por defeito segundo o Artigo 25 do regulamento europeu e o Artigo 46 da lei geral brasileira.',
                'Declara-se a total inexistência de transferência internacional de dados pessoais para servidores estrangeiros, porquanto todas as operações ocorrem no aparelho do utilizador.',
                'Atesta-se a ausência de submissão do titular a qualquer decisão tomada com esteio em tratamento automatizado ou definição de perfis com efeitos jurídicos relevantes.',
                'Certifica-se a inexistência de módulos de cadastro de utilizadores, contas de acesso ou canais de conversação interpessoal, afastando a guarda de credenciais.',
                'A imunidade fática alicerça-se na ausência absoluta de servidores centrais de armazenamento, inexistindo custódia remota de arquivos ou bancos de dados remotos.'
            ]
        },
        {
            id: 'bases-legais',
            icon: 'fa-solid fa-scale-balanced',
            title: 'Bases Legais',
            desc: 'Tratamento Legítimo',
            paragraphs: [
                'O tratamento estritamente técnico funda-se na execução de serviço solicitada diretamente pelo titular conforme a alínea b do parágrafo primeiro do Artigo 6 do regulamento europeu.',
                'A conformidade perante a legislação brasileira respalda-se no inciso quinto do Artigo 7 da Lei Geral de Proteção de Dados para a regular fruição do aplicativo.',
                'O acesso e a propagação de conteúdos da fé judaica encontram esteio protetivo no exercício da liberdade religiosa consagrada nas cartas constitucionais democráticas.',
                'O princípio da minimização de dados é satisfeito em grau máximo pela recusa intencional de coleta de qualquer dado pessoal desnecessário à finalidade litúrgica.'
            ]
        },
        {
            id: 'seguranca-informatica',
            icon: 'fa-solid fa-lock',
            title: 'Segurança Informática',
            desc: 'Isolamento Estrito',
            paragraphs: [
                'Todas as rotinas e scripts executam-se em ambiente confinado de caixa de areia no navegador sem privilégios de acesso a arquivos do sistema ou periféricos do equipamento.',
                'O código fonte aplica regras de higienização de entradas de dados e sanitização de referências textuais, prevenindo ataques maliciosos de injeção.',
                'As conexões de rede operam exclusivamente sob a moderna camada segura de transporte TLS sem compartilhamento de identificadores de hardware ou chaves privadas.',
                'A integridade dos ficheiros estáticos locais encontra-se assegurada por políticas de segurança de conteúdo que barram scripts não autorizados de terceiros.'
            ]
        },
        {
            id: 'liberdade-titular',
            icon: 'fa-solid fa-handshake',
            title: 'Liberdade Titular',
            desc: 'Autonomia Plena',
            paragraphs: [
                'O fornecimento de localidade decorre de escolha consciente, livre e informada do utilizador com o propósito de apuração astronómica dos horários sagrados.',
                'O titular goza de autonomia irrestrita para alterar ou remover a localidade selecionada a qualquer instante no menu próprio da aplicação.',
                'A aplicação dispensa consentimento para rastreamento de comportamento por inexistir qualquer mecanismo de monitorização de navegação ou leilão de mídia.',
                'A dignidade do utilizador é preservada pela ausência de técnicas de indução psicológica, publicidade direcionada ou retenção forçada de atenção.'
            ]
        },
        {
            id: 'responsavel-oficial',
            icon: 'fa-solid fa-user-tie',
            title: 'Responsável Oficial',
            desc: 'Canal Direto',
            paragraphs: [
                'Para fins de governança regulatória perante autoridades de controle e titulares, a plataforma mantém canal institucional permanente sob a alçada do encarregado de privacidade.',
                'Qualquer comunicação, pedido formal de esclarecimento ou requisição técnica pode ser apresentada através do canal eletrónico oficial contato arroba yisraeldate ponto app.',
                'O compromisso institucional pauta-se pelo atendimento célere, transparente e gratuito de qualquer solicitação apresentada por titulares ou entidades de fiscalização.'
            ]
        }
    ];

    // SEÇÃO 3: NORMAS MUNDIAIS (55+ ESTATUTOS GLOBAIS)
    const sec3Header = renderSectionHeader('Normas Mundiais', '14px');
    const sec3Cards = [
        {
            id: 'uniao-europeia',
            icon: 'fa-solid fa-earth-europe',
            title: 'União Europeia',
            desc: 'Sete Estatutos',
            paragraphs: [
                'O Regulamento Geral sobre a Proteção de Dados da União Europeia denominado RGPD e em sua aceção internacional GDPR tem seus princípios e direitos plenamente atendidos.',
                'A Diretiva Europeia sobre Privacidade Eletrónica número 2002 58 CE tem sua conformidade atestada pela natureza estritamente técnica e necessária do armazenamento local.',
                'A Lei 58 de 2019 da República Portuguesa tem seus preceitos de execução nacional observados perante a Comissão Nacional de Proteção de Dados CNPD.',
                'A Lei Orgânica 3 de 2018 de Espanha de Proteção de Dados e Garantia dos Direitos Digitais é cumprida perante a Agencia Española de Protección de Datos AEPD.',
                'A Lei Francesa Informatique et Libertés é respeitada perante a Commission Nationale de l Informatique et des Libertés CNIL.',
                'A Lei Federal de Proteção de Dados da Alemanha BDSG é observada perante as autoridades federais e estaduais competentes.',
                'O Código de Proteção de Dados da Itália é acolhido com rigor perante o Garante per la protezione dei dati personali.'
            ]
        },
        {
            id: 'reino-unido',
            icon: 'fa-solid fa-crown',
            title: 'Reino Unido',
            desc: 'Duas Normas',
            paragraphs: [
                'O regulamento UK GDPR incorporado ao direito britânico pela Lei de Saída da União Europeia encontra plena observância perante os cidadãos do Reino Unido.',
                'O Data Protection Act britânico de 2018 tem seus mandamentos de transparência e proporcionalidade acatados perante o Information Commissioner Office ICO.'
            ]
        },
        {
            id: 'america-latina',
            icon: 'fa-solid fa-earth-americas',
            title: 'América Latina',
            desc: 'Seis Jurisdições',
            paragraphs: [
                'A Lei Geral de Proteção de Dados LGPD do Brasil tem seus dez princípios norteadores e direitos do titular consagrados perante a autoridade competente ANPD.',
                'A Lei 25326 da República Argentina garante a tutela de dados pessoais e a prerrogativa de Habeas Data perante a autoridade AAIP.',
                'A Lei 18331 da República Oriental do Uruguai é plenamente observada perante a autoridade reguladora URCDP.',
                'A Lei 19628 da República do Chile assegura a preservação da privacidade e honra sob o amparo do Conselho para a Transparência CPLT.',
                'A Lei Estatutária 1581 de 2012 da Colômbia é honrada perante a Superintendencia de Industria y Comercio SIC.',
                'A Lei Federal de Proteção de Dados Pessoais em Posse de Particulares do México é estritamente cumprida perante o instituto federal INAI.'
            ]
        },
        {
            id: 'estados-unidos',
            icon: 'fa-solid fa-landmark-flag',
            title: 'Estados Unidos',
            desc: 'Vinte Estatutos',
            paragraphs: [
                'As leis CCPA e CPRA do Estado da Califórnia são atendidas perante a California Privacy Protection Agency mediante a abstenção absoluta de venda ou partilha de dados.',
                'São satisfeitas as leis VCDPA da Virgínia, CPA do Colorado, CTDPA de Connecticut, UCPA de Utah e TDPSA do Texas.',
                'Cumprem-se a OCPA de Oregon, MCDPA de Montana, Delaware Personal Data Privacy Act, Iowa Consumer Data Protection Act e Indiana Consumer Data Protection Act.',
                'Estão contempladas as leis de Tennessee, New Jersey, New Hampshire, Kentucky, MODPA de Maryland e Minnesota Consumer Data Privacy Act.',
                'As normas federais setoriais COPPA de proteção infantil, HIPAA de segredo em saúde e GLBA de sigilo financeiro são respeitadas pela ausência de recolha de dados.',
                'O cumprimento apoia-se na inexistência de base de dados corporativa e no isolamento integral dos cálculos no próprio terminal do consumidor.'
            ]
        },
        {
            id: 'canada-suica',
            icon: 'fa-solid fa-flag',
            title: 'Canadá Suíça',
            desc: 'Três Diplomas',
            paragraphs: [
                'A legislação federal canadense PIPEDA atende aos princípios de salvaguarda de informação pessoal perante o Office of the Privacy Commissioner OPC.',
                'A Lei 25 da Província de Québec atende aos deveres de proteção da privacidade por padrão perante a Commission d accès à l information CAI.',
                'A Lei Federal sobre a Proteção de Dados FADP e novel LPD da Confederação Suíça é respeitada sob a tutela do encarregado federal FDPIC.'
            ]
        },
        {
            id: 'asia-pacifico',
            icon: 'fa-solid fa-earth-asia',
            title: 'Ásia Pacífico',
            desc: 'Treze Países',
            paragraphs: [
                'Na República Popular da China, cumprem-se as exigências da lei PIPL, da Data Security Law DSL e da Cybersecurity Law CSL.',
                'No Japão, observa-se a lei APPI perante a Personal Information Protection Commission PPC.',
                'Na Coreia do Sul, vigora o cumprimento da lei PIPA perante a comissão nacional PIPC.',
                'Na República da Índia, acolhem-se os preceitos do Digital Personal Data Protection Act DPDP de 2023 no papel de custodiante fiduciário de dados perante o DPBI.',
                'Cumprem-se os dispositivos da lei PDPA de Singapura perante a comissão PDPC e da lei PDPA de 2010 da Malásia sob o diploma Akta 709.',
                'Na Indonésia acolhe-se a PDP Law de 2022, nas Filipinas a Data Privacy Act de 2012 perante a comissão NPC, e no Vietnã o Decreto 13 de 2023.',
                'Na Austrália respeitam-se os princípios da Privacy Act de 1988 perante o OAIC, e na Nova Zelândia cumprem-se os mandamentos da Privacy Act de 2020.'
            ]
        },
        {
            id: 'medio-oriente',
            icon: 'fa-solid fa-earth-africa',
            title: 'Médio Oriente',
            desc: 'Oito Nações',
            paragraphs: [
                'No Estado de Israel, observa-se a Privacy Protection Law de 1981 e a Emenda 13 de 2024 perante a Privacy Protection Authority PPA.',
                'No Reino da Arábia Saudita, atende-se à lei PDPL promulgada por Decreto Real sob a supervisão da autoridade SDAIA.',
                'Nos Emirados Árabes Unidos, segue-se o Decreto Lei Federal 45 de 2021 de proteção de dados pessoais.',
                'Na República da Turquia, observa-se a lei KVKK 6698 perante a autoridade supervisora nacional.',
                'No Egito atende-se à Lei 151 de 2020, na África do Sul cumpre-se a lei POPIA sob o Information Regulator, na Nigéria a lei NDPA de 2023 sob a NDPC e no Quênia a Data Protection Act de 2019 sob o ODPC.'
            ]
        }
    ];

    // SEÇÃO 4: ISENÇÕES LEGAIS
    const sec4Header = renderSectionHeader('Isenções Legais', '14px');
    const sec4Cards = [
        {
            id: 'isencao-liturgica',
            icon: 'fa-solid fa-scale-unbalanced',
            title: 'Isenção Litúrgica',
            desc: 'Caráter Auxiliar',
            paragraphs: [
                'Em sede de responsabilidade civil e litúrgica, declara-se que esta plataforma funciona exclusivamente como recurso informático de apoio ao estudo e organização civil.',
                'Os cálculos de Zmanim e horários de entrada e saída do Shabat resultam de projeções astronómicas matemáticas que admitem pequenas variações conforme o horizonte topográfico local.',
                'Em situações de controvérsia ritual ou momentos de dúvida haláchica relevante, prevalece de modo definitivo a orientação oral conferida pela autoridade rabínica ortodoxa competente da respetiva congregação.',
                'A utilização do sistema pressupõe o reconhecimento expresso do caráter pedagógico da ferramenta computacional.'
            ]
        },
        {
            id: 'direito-autoral',
            icon: 'fa-solid fa-scroll',
            title: 'Direito Autoral',
            desc: 'Patrimônio Sagrado',
            paragraphs: [
                'O texto sagrado da Torá, os livros proféticos de Neviim e os escritos de Ketuvim constituem patrimônio espiritual inalienável da humanidade e encontram-se em domínio público universal.',
                'As implementações de código de software, formatações de estilo e rotinas algorítmicas foram estruturadas sob os princípios do software livre e padrões abertos da web.',
                'É expressamente vedada a apropriação comercial monopolística dos textos sagrados ou a imposição de barreiras remuneradas ao estudo da Palavra Divina.',
                'A aplicação garante gratuidade eterna e acesso irrestrito a todos os povos e comunidades que buscam o conhecimento da Torá de Israel.'
            ]
        }
    ];

    // SEÇÃO 5: AUTODETERMINAÇÃO PESSOAL
    const sec5Header = renderSectionHeader('Autodeterminação Pessoal', '14px');
    const sec5Cards = [
        {
            id: 'esquecimento-total',
            icon: 'fa-solid fa-user-shield',
            title: 'Esquecimento Total',
            desc: 'Direito Soberano',
            paragraphs: [
                'Em consonância com o Artigo 17 do RGPD, o Artigo 18 da LGPD, as diretrizes da Califórnia e as garantias de Habeas Data, reconhece-se o direito incontestável de expurgo definitivo.',
                'Assiste ao titular a prerrogativa inalienável de apresentar petição ou reclamação formal perante a autoridade supervisora nacional de proteção de dados competente em sua jurisdição territorial.',
                'Qualquer comunicação regulatória ou requerimento formal pode ser exercido diretamente perante o canal oficial de governança da aplicação.',
                'Em virtude da inexistência de repositórios centrais de dados, o titular detém o poder de eliminar todo e qualquer rastro técnico de forma unilateral e sumária.'
            ]
        },
        {
            id: 'auditoria-propria',
            icon: 'fa-solid fa-key',
            title: 'Auditoria Própria',
            desc: 'Transparência Plena',
            paragraphs: [
                'O titular pode certificar a qualquer tempo que a memória do navegador reserva-se unicamente à guarda de parâmetros de latitude, longitude, cidade, minutos de velas e tema visual.',
                'Nenhuma dessas variáveis técnicas comporta elementos nominativos, correio eletrónico, número de terminal telefónico ou histórico de navegação na internet.',
                'Inexistem registros de mensagens, salas de conversação ou credenciais de contas de usuários, salvaguardando a absoluta inviolabilidade do espaço privado do cidadão.',
                'O compromisso de integridade e lealdade com a lei de Israel e com o ordenamento jurídico dos povos permanece inalterável e perpétuo.'
            ]
        }
    ];

    container.innerHTML = `
        <div class="event-cards-row" style="margin-top: 6px;">
            ${secPurgeCards.map(renderCard).join('')}
        </div>

        ${sec1Header}
        <div class="event-cards-row">
            ${sec1Cards.map(renderCard).join('')}
        </div>

        ${sec2Header}
        <div class="event-cards-row">
            ${sec2Cards.map(renderCard).join('')}
        </div>

        ${sec3Header}
        <div class="event-cards-row">
            ${sec3Cards.map(renderCard).join('')}
        </div>

        ${sec4Header}
        <div class="event-cards-row">
            ${sec4Cards.map(renderCard).join('')}
        </div>

        ${sec5Header}
        <div class="event-cards-row">
            ${sec5Cards.map(renderCard).join('')}
        </div>
    `;
}

// Ouvinte de eventos global para o botão de expurgo
document.addEventListener('click', (e) => {
    if (e.target.closest('#modal-btn-purge, #btn-purge-privacy-data')) {
        try {
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach(c => {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            window.location.reload();
        } catch (err) {
            console.error('Falha no expurgo:', err);
        }
    }
});
