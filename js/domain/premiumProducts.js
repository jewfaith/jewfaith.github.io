/**
 * PREMIUMPRODUCTS.JS - CATÁLOGO DE PRODUTOS E CONTEÚDOS DIGITAIS PREMIUM
 * 
 * Estrutura de dados modular para produtos digitais pagos no Yisrael Date,
 * geridos e entregues externamente via Payhip.
 * 
 * Campos por produto:
 * - id: Identificador único em kebab-case
 * - name: Nome oficial do produto
 * - desc: Descrição clara e concisa
 * - category: Categoria pertencente ('calendarios' | 'guias' | 'estudo' | 'recursos')
 * - icon: Classe FontAwesome para o ícone
 * - status: 'disponivel' | 'em_breve' | 'indisponivel'
 * - kofiUrl: URL oficial do Ko-fi
 * - features: Lista de pontos fortes do conteúdo digital
 */

export const PREMIUM_CONFIG = {
    kofiStoreUrl: 'https://ko-fi.com/O0D721T8VH/shop',
    kofiUrl: 'https://ko-fi.com/O0D721T8VH',
    payhipStoreUrl: 'https://ko-fi.com/O0D721T8VH/shop'
};

export const PREMIUM_SUBSCRIPTION = {
    id: 'yisrael-date-premium-annual',
    badge: 'Acesso Completo',
    name: 'Subscrição Anual',
    subtitle: 'Acesso Anual',
    description: 'A subscrição dá acesso a todos os conteúdos digitais e materiais de estudo ao longo do ano.',
    highlights: [
        'Acesso a todos os calendários anuais em PDF de alta resolução',
        'Guias aprofundados das Festas bíblicas da Torá',
        'Percursos de estudo temáticos e materiais de reflexão',
        'Todos os materiais imprimíveis e novos lançamentos digitais'
    ],
    ctaText: 'Subscrever Agora',
    kofiUrl: 'https://ko-fi.com/O0D721T8VH/tiers',
    embedUrl: 'https://ko-fi.com/O0D721T8VH/tiers/?widget=true&embed=true',
    payhipUrl: 'https://ko-fi.com/O0D721T8VH/tiers',
    status: 'disponivel'
};

export const PREMIUM_CATEGORIES = [
    {
        id: 'todos',
        name: 'Todos',
        icon: 'fa-solid fa-border-all',
        description: 'Todos os produtos e conteúdos digitais disponíveis.'
    },
    {
        id: 'calendarios',
        name: 'Calendários',
        icon: 'fa-solid fa-calendar-days',
        description: 'Calendários anuais em PDF, para impressão e de estudo com efemérides bíblicas e Zmanim de alta precisão.'
    },
    {
        id: 'guias',
        name: 'Guias',
        icon: 'fa-solid fa-book-bookmark',
        description: 'Guias das Festas da Torá, materiais de preparação litúrgica e manuais temáticos.'
    },
    {
        id: 'estudo',
        name: 'Estudo',
        icon: 'fa-solid fa-graduation-cap',
        description: 'Percursos de estudo organizados por etapas, materiais de reflexão e conteúdos aprofundados.'
    },
    {
        id: 'recursos',
        name: 'Recursos',
        icon: 'fa-solid fa-file-pdf',
        description: 'PDFs vetoriais, tabelas imprimíveis e outros conteúdos digitais práticos.'
    }
];

export const PREMIUM_PRODUCTS = [
    {
        id: 'cal-tora-5787',
        name: 'Calendário 5787',
        desc: 'Calendário anual completo em PDF com o ciclo sagrado das Festas da Torá e horários astronómicos de alta precisão.',
        category: 'calendarios',
        icon: 'fa-solid fa-calendar-days',
        status: 'disponivel',
        kofiUrl: 'https://ko-fi.com/O0D721T8VH/shop',
        embedUrl: 'https://ko-fi.com/O0D721T8VH/shop/?widget=true&embed=true',
        payhipUrl: 'https://ko-fi.com/O0D721T8VH/shop',
        features: [
            'Formato PDF vetorial de alta definição',
            'Otimizado para visualização digital e impressão em A4',
            'Todos os 12 meses do ano com Parashiot e Moadim'
        ]
    },
    {
        id: 'guia-festas-tora',
        name: 'Guia Festas',
        desc: 'Material aprofundado para acompanhar as principais Festas segundo a Lei Escrita de Vayikra 23.',
        category: 'guias',
        icon: 'fa-solid fa-book-bookmark',
        status: 'disponivel',
        kofiUrl: 'https://ko-fi.com/O0D721T8VH/shop',
        embedUrl: 'https://ko-fi.com/O0D721T8VH/shop/?widget=true&embed=true',
        payhipUrl: 'https://ko-fi.com/O0D721T8VH/shop',
        features: [
            'Estudo exegético de cada festa ordenada na Torá',
            'Orientações bíblicas de observância e leituras',
            'Contexto histórico e significado de cada convocação'
        ]
    },
    {
        id: 'percurso-teshuva',
        name: 'Percurso Teshuvá',
        desc: 'Material de estudo organizado por etapas para reflexão, exame de consciência e retorno espiritual.',
        category: 'estudo',
        icon: 'fa-solid fa-stairs',
        status: 'disponivel',
        kofiUrl: 'https://ko-fi.com/O0D721T8VH/shop',
        embedUrl: 'https://ko-fi.com/O0D721T8VH/shop/?widget=true&embed=true',
        payhipUrl: 'https://ko-fi.com/O0D721T8VH/shop',
        features: [
            'Roteiro estruturado de estudo passo a passo',
            'Textos bíblicos e proféticos comentados',
            'Espaço para anotações e reflexão pessoal'
        ]
    },
    {
        id: 'cal-impressao-poster',
        name: 'Calendário Impressão',
        desc: 'Edição gráfica especial em alta resolução concebida especificamente para impressão em formato poster ou parede.',
        category: 'calendarios',
        icon: 'fa-solid fa-print',
        status: 'em_breve',
        kofiUrl: 'https://ko-fi.com/O0D721T8VH/shop',
        embedUrl: 'https://ko-fi.com/O0D721T8VH/shop/?widget=true&embed=true',
        payhipUrl: 'https://ko-fi.com/O0D721T8VH/shop',
        features: [
            'Desenvolvido para formatos A3 e A4',
            'Design minimalista com tipografia de alta legibilidade',
            'Espaço diário para anotações pessoais'
        ]
    },
    {
        id: 'guia-preparacao-pessach',
        name: 'Guia Pessach',
        desc: 'Manual temático com as instruções da Torá para a preparação dos Pães Ázimos e remoção de fermento.',
        category: 'guias',
        icon: 'fa-solid fa-bread-slice',
        status: 'em_breve',
        kofiUrl: 'https://ko-fi.com/O0D721T8VH/shop',
        embedUrl: 'https://ko-fi.com/O0D721T8VH/shop/?widget=true&embed=true',
        payhipUrl: 'https://ko-fi.com/O0D721T8VH/shop',
        features: [
            'Instruções bíblicas de Shemot e Vayikra',
            'Cronograma prático para os sete dias sagrados',
            'Guia de leituras diárias da libertação'
        ]
    },
    {
        id: 'materiais-mussar',
        name: 'Caderno Mussar',
        desc: 'Coleção temática de ensinamentos de aperfeiçoamento de caráter e ética interior iluminados pela Lei Escrita.',
        category: 'estudo',
        icon: 'fa-solid fa-heart',
        status: 'em_breve',
        kofiUrl: 'https://ko-fi.com/O0D721T8VH/shop',
        embedUrl: 'https://ko-fi.com/O0D721T8VH/shop/?widget=true&embed=true',
        payhipUrl: 'https://ko-fi.com/O0D721T8VH/shop',
        features: [
            'Exercícios práticos de retidão e integridade',
            'Meditações baseadas no livro de Provérbios',
            'Formato pronto para estudo individual diário'
        ]
    },
    {
        id: 'pack-tabelas-pdf',
        name: 'Recursos Imprimíveis',
        desc: 'Conjunto de fichas de estudo, tabelas sintéticas de Zmanim e diagramas explicativos do calendário sagrado.',
        category: 'recursos',
        icon: 'fa-solid fa-file-pdf',
        status: 'em_breve',
        kofiUrl: 'https://ko-fi.com/O0D721T8VH/shop',
        embedUrl: 'https://ko-fi.com/O0D721T8VH/shop/?widget=true&embed=true',
        payhipUrl: 'https://ko-fi.com/O0D721T8VH/shop',
        features: [
            'Fichas de resumo rápido em PDF vetorial',
            'Tabela das santas convocações de Levítico 23',
            'Fácil de imprimir em casa em folhas A4'
        ]
    }
];

export function getProductsByCategory(categoryId = 'todos') {
    if (!categoryId || categoryId === 'todos') {
        return PREMIUM_PRODUCTS;
    }
    return PREMIUM_PRODUCTS.filter(p => p.category === categoryId);
}

export function getProductById(productId) {
    return PREMIUM_PRODUCTS.find(p => p.id === productId) || null;
}
