import { getAboutProjectHtml, getAboutMethodologyHtml } from '../domain/aboutContent.js';

/**
 * PRIVACYVIEW.JS - GUIA DO PROJETO, METODOLOGIA, LITURGIA E INFORMAÇÃO LEGAL
 *
 * Reúne apenas o que é autêntico, útil e aplicável à plataforma Yisrael Date:
 * 1. Sobre o Projeto e Metodologia Canónica dos Cálculos Solares e Bíblicos.
 * 2. Diretrizes Litúrgicas: Aviso Haláchico, Autoridade Rabínica e Guarda Sagrada.
 * 3. Informação Legal Essencial: Termos de Uso, Privacidade Total e Direitos Autorais.
 */

function renderSectionHeader(title) {
    return `
        <div class="festival-section-header">
            <div class="festival-section-title-wrap">
                <h2 class="festival-section-title">${title}</h2>
            </div>
        </div>
    `;
}

function makeModalBlocks(paragraphs) {
    return `
        <div class="levels-container compliance-modal-stack">
            ${paragraphs.map((p, idx) => `
                <div class="info-modal-card compliance-modal-card ${idx === paragraphs.length - 1 ? 'no-border' : ''}">
                    <div class="info-modal-value compliance-modal-val">
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
             aria-label="${title} • ${desc}">
            <div class="settings-card-left">
                <i class="${icon} settings-icon"></i>
                <div class="settings-card-text">
                    <span class="settings-card-title">${title}</span>
                    <span class="settings-card-desc">${desc}</span>
                </div>
            </div>
            <div class="card-arrow-action" aria-hidden="true">
                <i class="fa-solid fa-arrow-right"></i>
            </div>
        </div>
    `;
}

export function renderPrivacyView(force = false) {
    const container = document.getElementById('privacy-content-container') || document.getElementById('tools-list') || document.getElementById('premium-features-list');
    if (!container) return;
    if (!force && container.children.length > 0) return;

    // SECÇÃO: LITURGIA E OBSERVÂNCIA
    const secLiturgiaHeader = renderSectionHeader('Liturgia');
    const secLiturgiaCards = [
        {
            id: 'aviso-halachico',
            icon: 'fa-solid fa-scale-unbalanced',
            title: 'Aviso Haláchico',
            desc: 'Precisão Astronómica',
            paragraphs: [
                'Os horários astronómicos apresentados na plataforma baseiam-se em equações solares de alta precisão para a latitude e longitude selecionadas.',
                'A topografia real, a elevação em relação ao nível do mar, a visibilidade do horizonte e as condições atmosféricas locais podem produzir ligeiras variações no instante visual do nascer e do pôr do sol.',
                'Recomenda-se observar sempre uma margem prudencial de segurança antes do pôr do sol para o acendimento das velas e início do descanso sagrado.'
            ]
        },
        {
            id: 'autoridade-rabinica',
            icon: 'fa-solid fa-synagogue',
            title: 'Autoridade Rabínica',
            desc: 'Orientação Local',
            paragraphs: [
                'A plataforma atua como instrumento de apoio ao estudo diário e planeamento litúrgico, não substituindo o costume estabelecido por cada congregação.',
                'Em matérias de decisão ritual prática, horários de entrada e saída do Shabat, início de jejuns ou questões de observância, prevalece sempre a orientação da autoridade rabínica da comunidade local.'
            ]
        },
        {
            id: 'guarda-sagrada',
            icon: 'fa-solid fa-fire-flame-curved',
            title: 'Guarda Sagrada',
            desc: 'Respeito Litúrgico',
            paragraphs: [
                'Em honra à santidade do Shabat semanal e dos dias sagrados da Torá, todos os módulos de apoio voluntário externo são automaticamente desativados durante os períodos de descanso sagrado.',
                'O propósito da aplicação é facilitar a preparação prévia e o acompanhamento das leituras bíblicas em conformidade com os mandamentos.'
            ]
        }
    ];

    // SECÇÃO: LEGAL, PRIVACIDADE E CRÉDITOS
    const secLegalHeader = renderSectionHeader('Legal');
    const secLegalCards = [
        {
            id: 'termos-uso',
            icon: 'fa-solid fa-file-contract',
            title: 'Termos Gerais',
            desc: 'Acesso Gratuito',
            paragraphs: [
                'O Yisrael Date é disponibilizado de forma gratuita, aberta e sem anúncios comerciais para consulta individual, familiar e comunitária em qualquer parte do mundo.',
                'As ferramentas e textos são facultados para fins educativos, litúrgicos e de estudo das Sagradas Escrituras, sendo vedada a reprodução ilícita ou exploração comercial por terceiros.'
            ]
        },
        {
            id: 'privacidade-total',
            icon: 'fa-solid fa-shield-halved',
            title: 'Privacidade Total',
            desc: 'Zero Rastreamento',
            paragraphs: [
                'A aplicação opera integralmente no navegador do próprio dispositivo, sem recolha de dados pessoais, sem criação de contas e sem utilização de cookies de rastreamento.',
                'Apenas a cidade escolhida para os cálculos solares e a preferência de tema visual são guardadas localmente no próprio aparelho para comodidade de uso.'
            ]
        },
        {
            id: 'direitos-autorais',
            icon: 'fa-solid fa-scroll',
            title: 'Direitos Autorais',
            desc: 'Fontes e Créditos',
            paragraphs: [
                'A conceção, arquitetura de software, algoritmos astronómicos e design visual do Yisrael Date constituem criação autoral de Mikhael.',
                'Os textos bíblicos e estudos integram o património sagrado de Israel, utilizando com reconhecimento as bases abertas de Sefaria, Bolls Life, Hebcal e OpenStreetMap.'
            ]
        }
    ];

    const aboutModalHtml = getAboutProjectHtml().replace(/"/g, '&quot;');
    const methodologyModalHtml = getAboutMethodologyHtml().replace(/"/g, '&quot;');

    container.innerHTML = `
        <div class="event-cards-row">
            <div class="settings-card event-card glass-panel info-trigger" 
                 id="card-about-manifesto" 
                 tabindex="0" 
                 role="button" 
                 data-info-title="Sobre Nós" 
                 data-info-html="${aboutModalHtml}" 
                 aria-label="Sobre Nós • Missão Editorial">
                <div class="settings-card-left">
                    <i class="fa-solid fa-compass settings-icon"></i>
                    <div class="settings-card-text">
                        <span class="settings-card-title">Sobre Nós</span>
                        <span class="settings-card-desc">Missão Editorial</span>
                    </div>
                </div>
                <div class="card-arrow-action" aria-hidden="true">
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            </div>
            <div class="settings-card event-card glass-panel info-trigger" 
                 id="card-about-methodology" 
                 tabindex="0" 
                 role="button" 
                 data-info-title="Metodologia Canónica" 
                 data-info-html="${methodologyModalHtml}" 
                 aria-label="Metodologia Canónica • Cálculos Solares">
                <div class="settings-card-left">
                    <i class="fa-solid fa-calculator settings-icon"></i>
                    <div class="settings-card-text">
                        <span class="settings-card-title">Metodologia Canónica</span>
                        <span class="settings-card-desc">Cálculos Solares</span>
                    </div>
                </div>
                <div class="card-arrow-action" aria-hidden="true">
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            </div>
        </div>

        ${secLiturgiaHeader}
        <div class="event-cards-row">
            ${secLiturgiaCards.map(renderCard).join('')}
        </div>

        ${secLegalHeader}
        <div class="event-cards-row">
            ${secLegalCards.map(renderCard).join('')}
        </div>
    `;
}
