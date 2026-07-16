# 📅 Yisrael Date

Acesse datas hebraicas, horários haláchicos (Zmanim), leitura semanal da Torá (Parashat Hashavua) e feriados judaicos em tempo real. Uma aplicação web moderna, gratuita e elegante para otimizar sua rotina espiritual e diária.

O **Yisrael Date** foi concebido como um Progressive Web App (PWA) de alto desempenho, focado em entregar informações precisas e ricas de forma instantânea, possuindo suporte offline e geolocalização inteligente.

---

## ✨ Funcionalidades Principais

- **📅 Calendário Hebraico Dinâmico**: Conversão precisa de datas gregorianas para hebraicas em tempo real, adaptando-se automaticamente ao pôr do sol local.
- **🌅 Horários Haláchicos (Zmanim)**: Exibição completa de horários diários essenciais calculados geograficamente (Alot HaShachar, Tzitzit, Kriat Shema, Tefilah, Chatzot, Mincha, Plag HaMincha, Pôr do Sol, etc.) via integrações robustas.
- **📜 Leitura Semanal da Torá (Parashat Hashavua)**: Exibe a porção semanal da Torá, Haftará e Ketuvim correspondente.
- **📖 Leitor de Escrituras Integrado**: Permite a leitura textual direta de porções da Torá e outros livros em um modal elegante, sem sair do aplicativo (conectado à API do Bolls Life).
- **🌍 Geolocalização Inteligente & Busca**: Detecção automática de localização usando GeoIP e geocodificação reversa via OpenStreetMap (Nominatim). Também inclui um sistema de busca manual preditiva para qualquer cidade global.
- **🌓 Tema Astronômico Automatizado**: Ajuste inteligente de tema (Claro/Escuro) estimado com base nas coordenadas de latitude/longitude e horários locais de nascer e pôr do sol.
- **📱 Experiência PWA Premium**: Suporte completo a Service Worker com cache estratégico de APIs e recursos estáticos para funcionamento rápido e offline.
- **🎨 Design Ultra Moderno (Glassmorphism)**: Interface fluida e responsiva com elementos translúcidos, animações suaves e skeleton loaders para carregamentos sem sobressaltos.

---

## 🛠️ Tecnologias Utilizadas

A aplicação foi desenvolvida seguindo a filosofia de desenvolvimento Vanilla, garantindo leveza absoluta, segurança e facilidade de deploy:

- **HTML5 & CSS3**: Utilização de variáveis CSS dinâmicas para o motor de temas, layout com Flexbox/Grid e efeitos visuais modernos de Glassmorphism.
- **Vanilla JavaScript (ES Modules)**: Modularização limpa para separação de responsabilidades (API, UI, Estado, Domínio).
- **APIs de Integração**:
  - [Hebcal API](https://www.hebcal.com) para cálculo de calendários, festividades, zmanim e conversões.
  - [Bolls Life API](https://bolls.life) para recuperação dinâmica dos textos bíblicos.
  - [Nominatim OpenStreetMap](https://nominatim.openstreetmap.org) para geocodificação de cidades.
  - Múltiplos provedores de GeoIP redundantes (GeoJS, ipwho.is, ip.sb, ipinfo.io, etc.) para garantir o funcionamento da autolocalização instantânea.
- **Fontes & Ícones**: Google Fonts (Poppins & Cardo) e FontAwesome v6.

---

## 📁 Estrutura do Projeto

O código do projeto está organizado de maneira modular e limpa sob os seguintes componentes:

```bash
├── .github/              # Configurações e workflows do GitHub
├── js/                   # Códigos lógicos estruturados
│   ├── api/              # Comunicação com APIs externas
│   │   ├── geolocation.js # Gerenciamento de GeoIP e GPS
│   │   └── hebcal.js      # Integração com as APIs da Hebcal e Nominatim
│   ├── domain/           # Constantes e regras de domínio haláchicas
│   │   ├── constants.js   # Mapeamentos e strings de tradução
│   │   └── halacha.js     # Regras e utilitários específicos da lei judaica
│   ├── ui/               # Componentes e manipulação de interface visual
│   │   ├── dashboard.js   # Atualização de cartões, skeletons e renderização
│   │   ├── icons.js       # Gerenciamento dinâmico de ícones da interface
│   │   ├── modals.js      # Popups de leitura de escrituras e busca de cidades
│   │   ├── theme.js       # Motor de alteração automática de temas claro/escuro
│   │   └── timers.js      # Controladores de contagem regressiva e transições temporais
│   ├── utils/            # Funções utilitárias puras
│   │   └── math.js        # Utilitários de conversões e cálculos
│   ├── main.js           # Ponto de entrada do app e inicialização do Service Worker
│   └── state.js          # Gerenciamento de estado em tempo real da aplicação
├── index.html            # Estrutura semântica principal e templates de modais
├── style.css             # Folha de estilo centralizada com variáveis e temas
├── manifest.json         # Manifesto PWA com definições de ícones e comportamentos
├── sw.js                 # Service Worker (Estratégia de Cache e funcionamento Offline)
└── icon.png              # Logotipo / Ícone oficial do PWA
```

### Links Úteis dos Arquivos no Workspace:
- Ponto de Entrada: [index.html](file:///c:/Users/AMD/Downloads/jewfaith.github.io-main/index.html)
- Folha de Estilos: [style.css](file:///c:/Users/AMD/Downloads/jewfaith.github.io-main/style.css)
- Script de Inicialização: [js/main.js](file:///c:/Users/AMD/Downloads/jewfaith.github.io-main/js/main.js)
- Controlador de Cache: [sw.js](file:///c:/Users/AMD/Downloads/jewfaith.github.io-main/sw.js)
- Manifesto PWA: [manifest.json](file:///c:/Users/AMD/Downloads/jewfaith.github.io-main/manifest.json)

---

## 🔒 Segurança e Otimização

A aplicação implementa diretrizes de segurança robustas através de uma política de **Content Security Policy (CSP)** declarada na tag `<meta>` do [index.html](file:///c:/Users/AMD/Downloads/jewfaith.github.io-main/index.html). Esta política restringe os domínios de conexão apenas às APIs confiáveis necessárias, minimizando riscos de injeções de script (XSS).

Também há pre-conexão de DNS (`dns-prefetch` e `preconnect`) para as APIs do `hebcal.com` e `nominatim.openstreetmap.org`, otimizando a latência de rede no primeiro carregamento.

---

## 🛡️ Termos de Uso e Licença

Este projeto é desenvolvido e mantido de forma proprietária com termos de uso específicos:

- **🟢 Consulta e Uso Informativo**: O uso do site público é totalmente livre e gratuito para qualquer pessoa que queira consultar horários, calendário hebraico, leituras ou se informar.
- **🤝 Contribuições**: Colaborações para o aprimoramento do projeto (correção de bugs, tradução, sugestões) são muito bem-vindas! Você pode abrir **Issues** ou enviar **Pull Requests** diretamente neste repositório.
- **🔴 Restrição de Código (Projetos Pessoais/Comerciais)**: É expressamente **proibido** copiar, clonar, fazer fork, redistribuir ou utilizar qualquer parte do código-fonte deste projeto para criar projetos pessoais, comerciais ou projetos derivados de terceiros sem a autorização prévia por escrito do proprietário.


