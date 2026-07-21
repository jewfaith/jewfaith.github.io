# 📅 Yisrael Date

Aplicaçāo web moderna e minimalista para consulta do mês hebraico, leitura da Parashá semanal (Torá, Haftará e Tehilim) e festividades judaicas em tempo real.

O **Yisrael Date** foi concebido como um Progressive Web App (PWA) de alto desempenho, focado em entregar informações precisas de forma instantânea, com leitor de escrituras integrado, suporte offline e geolocalização inteligente.

---

## ✨ Funcionalidades Reais

- **📍 Localização Vigente**: Deteção automática de localização e pesquisa preditiva global de cidades (Nominatim / OpenStreetMap).
- **📅 Data Hebraica**: Conversão precisa de datas gregorianas para hebraicas, exibindo o mês atual com a lista de festividades pertencentes exclusivamente ao mês ativo.
- **📜 Parashat Hashavua**: Exibição da porção semanal da Torá com resumo e contextualização bíblica.
- **📖 Lei Escrita (Torá)**: Leitor de escrituras integrado para consulta dos versículos da Torá da semana (Bolls Life API).
- **🪶 Profetas (Haftará)**: Leitor de escrituras integrado para consulta dos versículos dos Profetas.
- **✒️ Escrito Sagrado (Tehilim / Ketuvim)**: Leitor de escrituras integrado para consulta diária dos Salmos.
- **🌟 Próximos Eventos & Festas**: Próximas festividades judaicas com contagem decrescente em tempo real e explicações detalhadas em modal (Torá, Neviim, Ketuvim, Talmud, Sod).
- **🌓 Tema Astronômico (Dia / Noite)**: Ajuste inteligente do tema visual com base nas coordenadas de latitude/longitude e no horário do pôr do sol local.
- **📱 PWA & Suporte Offline**: Service Worker com cache estratégico de recursos e utilitário de purga de memória (`purge()`) na consola.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 & CSS3**: Estrutura semântica com variáveis CSS dinâmicas para temas e modais com dimensões uniformes (500px).
- **Vanilla JavaScript (ES Modules)**: Arquitetura modular sem frameworks pesados (UI, Estado, Domínio, API).
- **APIs de Integração**:
  - [Hebcal API](https://www.hebcal.com) — Calendário hebraico, festividades e conversões de datas.
  - [Bolls Life API](https://bolls.life) — Obtenção dos textos bíblicos (traduções NVT e OL).
  - [Nominatim OpenStreetMap](https://nominatim.openstreetmap.org) — Pesquisa preditiva e geocodificação de cidades.
- **Fontes & Ícones**: Google Fonts (Poppins) e FontAwesome v6.

---

## 📁 Estrutura do Código

```bash
├── .agents/              # Regras de desenvolvimento do repositório (AGENTS.md)
├── js/                   # Módulos JavaScript Vanilla
│   ├── api/              # Comunicação com APIs externas (Hebcal, Nominatim, GeoIP)
│   ├── domain/           # Regras de domínio haláchicas, constantes e parashot
│   ├── ui/               # Interface de utilizador (Dashboard, Modais, Tema, Ícones, Timers)
│   ├── utils/            # Utilitários de matemática e desduplicação
│   ├── main.js           # Ponto de entrada e controlador da aplicação
│   └── state.js          # Estado global reativo da aplicação
├── index.html            # Estrutura HTML semântica e modais
├── style.css             # Folha de estilos centralizada e variáveis de tema
├── manifest.json         # Manifesto PWA
├── sw.js                 # Service Worker de cache offline
└── icon.png              # Ícone oficial da aplicação
```

---

## 🔒 Consola & Purga de Memória

A aplicação inclui um utilitário integrado de limpeza de cache acessível pela consola do browser:

```javascript
purge()
```
Executar este comando limpa o `localStorage`, `sessionStorage`, caches do Service Worker e recarrega a aplicação limpa.

---

## 🛡️ Termos de Uso e Licença

- **🟢 Consulta e Uso**: Livre e gratuito para consulta de datas hebraicas, leituras bíblicas e festividades.
- **🔴 Licença de Código**: É expressamente proibido copiar, clonar ou reutilizar o código-fonte para projetos comerciais ou derivados de terceiros sem autorização prévia por escrito.
