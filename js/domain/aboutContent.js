/**
 * ABOUTCONTENT.JS - MANIFESTO, ORIGEM E PROPÓSITO DO YISRAEL DATE
 * 
 * Contém o texto canónico de apresentação do projeto, detalhando a motivação,
 * a distinção bíblica vs. rabínica, o cálculo astronómico local e os princípios
 * de transparência e gratuidade universal.
 */

export const ABOUT_PROJECT_TITLE = 'Sobre o Yisrael Date';
export const ABOUT_PROJECT_SUBTITLE = 'Origem e Propósito';

export function getAboutProjectHtml() {
    return `
        <div class="about-manifesto-container">
            <!-- Cabeçalho do Manifesto -->
            <div class="about-hero-header">
                <div class="about-badge-pill">
                    <i class="fa-solid fa-compass"></i>
                    <span>Propósito & Identidade</span>
                </div>
                <h3 class="about-hero-title">O Tempo Sagrado Unificado</h3>
                <p class="about-hero-intro">
                    Uma plataforma límpida e rigorosa concebida para reunir o calendário bíblico, os horários astronómicos de cada localidade e as escrituras sagradas de Israel num único ecossistema sereno.
                </p>
            </div>

            <!-- Bloco 1: A Centralização do Calendário -->
            <div class="about-section-card">
                <div class="about-section-header">
                    <div class="about-icon-circle">
                        <i class="fa-solid fa-compass"></i>
                    </div>
                    <h4>A Centralização da Informação</h4>
                </div>
                <p>
                    Durante muito tempo, acompanhar o ciclo bíblico exigia consultar múltiplos canais dispersos, desde a data hebraica e os horários solares até às festividades e leituras sagradas. O Yisrael Date integra todas estas dimensões num só lugar, proporcionando uma consulta imediata, límpida e harmoniosa no dia a dia.
                </p>
            </div>

            <!-- Bloco 2: A Distinção entre Torá e Tradição -->
            <div class="about-section-card">
                <div class="about-section-header">
                    <div class="about-icon-circle">
                        <i class="fa-solid fa-scroll"></i>
                    </div>
                    <h4>Torá Escrita e Tradição Histórica</h4>
                </div>
                <p>
                    A plataforma estabelece uma distinção clara entre os mandamentos perpétuos instituídos diretamente no texto da Torá e as celebrações decorrentes de deliberações e costumes rabínicos posteriores. Ambas as dimensões são preservadas e respeitadas com rigor, apresentadas sob categorias bem delimitadas para que nunca haja confusão entre a Lei Escrita e a Tradição Oral.
                </p>
            </div>

            <!-- Bloco 3: O Tempo Vivo e a Localização -->
            <div class="about-section-card">
                <div class="about-section-header">
                    <div class="about-icon-circle">
                        <i class="fa-solid fa-sun"></i>
                    </div>
                    <h4>O Tempo Vivo e Astronómico</h4>
                </div>
                <p>
                    No ritmo bíblico da Criação, o tempo é determinado pelo curso da luz solar, incluindo a alvorada, o meio-dia, o pôr do sol e o despontar das estrelas. Os tempos sagrados não seguem convenções horárias abstratas, mas momentos vivos calculados a partir das coordenadas geográficas reais de cada comunidade no mundo.
                </p>
            </div>

            <!-- Bloco 4: Leituras e Literatura Sagrada -->
            <div class="about-section-card">
                <div class="about-section-header">
                    <div class="about-icon-circle">
                        <i class="fa-solid fa-book-open"></i>
                    </div>
                    <h4>Leituras e Literatura Sagrada</h4>
                </div>
                <p>
                    Acesso integrado às leituras semanais da Parashá da Torá, às porções proféticas da Haftará, aos textos sapienciais dos Ketuvim e a passagens clássicas da rica literatura tradicional de Israel através do acervo canónico Sefaria.
                </p>
            </div>

            <!-- Bloco 5: Fidelidade Canónica (Destaque) -->
            <div class="about-section-card highlight-card">
                <div class="about-section-header">
                    <div class="about-icon-circle highlight-icon">
                        <i class="fa-solid fa-scale-balanced"></i>
                    </div>
                    <h4>Fidelidade Canónica e Transparência</h4>
                </div>
                <p>
                    O propósito essencial do Yisrael Date é permitir que qualquer pessoa compreenda com serenidade em que período sagrado se encontra, conheça os horários precisos da sua região e tenha acesso direto aos ensinamentos milenares de Israel de forma transparente, fluida e fidedigna.
                </p>
            </div>

            <!-- Bloco 6: Princípio Orientador (Citação) -->
            <div class="about-quote-box">
                <div class="about-quote-header">
                    <i class="fa-solid fa-quote-left"></i>
                    <span>Princípio Orientador</span>
                </div>
                <p class="about-quote-text">
                    «Conhecer o tempo sagrado a partir da luz solar de cada dia, vivenciando os ciclos da Torá com fidelidade, clareza e sem dispersão.»
                </p>
                <span class="about-quote-author">Visão Central do Yisrael Date</span>
            </div>

            <!-- Conclusão, Autoria & Termos -->
            <div class="about-conclusion-footer">
                <div class="about-author-badge">
                    <i class="fa-solid fa-code-commit" style="color: var(--accent-color);"></i>
                    <span>Autoria independente de <strong>Mikhael</strong></span>
                </div>
                <p>
                    Disponibilizado de forma livre, universal e gratuita, dedicado à preservação dos ciclos bíblicos e ao estudo contínuo da Torá de Israel.
                </p>
                <div class="about-legal-footer-links">
                    <button type="button" class="about-legal-btn" data-tab="privacy">
                        <i class="fa-solid fa-scale-balanced" style="color: var(--accent-color);"></i>
                        <span>Consultar Termos & Privacidade Global</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}
