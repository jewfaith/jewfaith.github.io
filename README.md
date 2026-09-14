# Yisrael Date • Calendário Bíblico & Horários Haláchicos

> **Aplicação web progressiva (PWA) de alta precisão dedicada ao estudo da Torá, cálculo de Zmanim astronómicos e observância dos Tempos Sagrados bíblicos.**

---

## 📖 Visão Geral

O **Yisrael Date** é uma plataforma independente desenvolvida para fornecer cálculos astronómicos e haláchicos de alta precisão, preservando a fidelidade textual aos mandamentos da Torá (*Vayikra / Levítico 23*) e a distinção clara entre ordenanças bíblicas (*Base Toraica*) e tradições históricas posteriores (*Leis Tradicionais*).

Construído sob a filosofia **Offline-First**, o sistema opera com total autonomia e fiabilidade, garantindo acesso contínuo aos horários de oração, festas solenes e leituras sagradas mesmo em locais sem ligação à internet.

---

## ✨ Funcionalidades Principais

### 1. Horários Haláchicos Astronómicos (Zmanim)
* **Cálculo Solar Dinâmico**: Determinação em tempo real de todas as horas haláchicas proporcionais (*Sha'ot Zmaniot*):
  * *Alot HaShachar* (Alvorada)
  * *Netz HaChamah* (Nascer do Sol)
  * *Sof Zman Kriat Shema* (Magen Avraham e Gra)
  * *Sof Zman Tefilah*
  * *Chatzot HaYom* (Meio-dia Solar)
  * *Minchah Gedolah* e *Minchah Ketanah*
  * *Plag HaMinchah*
  * *Shekiyah* (Pôr do Sol)
  * *Tzeit HaKochavim* (Saída das Estrelas / Havdalá)
* **Arco Solar Interativo**: Visualização gráfica da trajetória solar ao longo do dia, indicando o progresso da luz diurna e transições celestes.

### 2. Ciclo Festivo Bíblico da Torá
* **Festas Solenes Bíblicas (*Moadei YHWH*)**:
  * *Yom Shabbat* (Sétimo Dia Sagrado)
  * *Yom Pessach* & *Chag Matzot* (1º e 7º dia solenes)
  * *Yom Shavuot* (Festa das Semanas)
  * *Yom Teruah* (Memorial com Toque de Shofar)
  * *Yom Kippur* (Dia da Expiação)
  * *Chag Sukkot* (1º dia solene de convocação santa)
  * *Shemini Atzeret* (Oitavo Dia de Reunião Solene)
* **Distinção Textual Rigorosa**: Classificação transparente entre os mandamentos de cessação de trabalho (*Issur Melachá*) da Torá e festividades rabínicas ou dias intermediários (*Chol HaMoed*).

### 3. Observância Sagrada Automatizada
* **Janela Haláchica de Resguardo**: Bloqueio e suspensão automática de transações, doações e interações comerciais durante o tempo sagrado, iniciando **2 horas antes** da festa solene (*Erev Yom Tov*) e estendendo-se até **2 horas após** a sua conclusão (*Motzei Yom Tov*).

### 4. Bússola de Orientação (Mizrach)
* Orientação em tempo real via sensores geomagnéticos do dispositivo (ou cálculo de grande círculo geodésico) apontando para o Monte do Templo em Jerusalém (*Har HaBayit*).

### 5. Estudo e Ciclo Litúrgico
* Visualização da *Parashat HaShavua* com leituras da Torá, Haftarah e referências completas.
* Guia detalhado de bênçãos (*Berachot*) e orações tradicionais com texto hebraico, transliteração fonética e tradução.

---

## 🔒 Privacidade & Ética

* **Sem Rastreio de Dados Pessoais**: Sem registo obrigatório, sem recolha de dados sensíveis ou informações privadas.
* **Sem Publicidade Comercial**: Interface limpa, sóbria e sem anúncios intrusivos.
* **Total Conformidade**: Conceção alinhada com as diretrizes RGPD e LGPD.

---

## 🛠️ Arquitetura Técnica

A aplicação foi concebida com arquitetura modular leve em **Vanilla JavaScript moderno (ES Modules)**, rejeitando *frameworks* pesados para garantir carregamento instantâneo (0ms de bloqueio) e máxima longevidade:

```
├── index.html              # Estrutura principal da aplicação e App Shell
├── style.css               # Design Tokens, Apple Spatial Glass & Temas
├── sw.js                   # Service Worker (Estratégia Stale-While-Revalidate)
├── manifest.json           # Manifesto PWA para instalação nativa
└── js/
    ├── main.js             # Ponto de entrada e orquestração da aplicação
    ├── state.js            # Gestão de estado reativo unificado
    ├── api/                # Clientes de dados externos e cálculos astronómicos
    ├── domain/             # Lógica de negócio haláchica, datas e festas bíblicas
    ├── services/           # Serviços de geolocalização e persistência
    ├── ui/                 # Componentes visuais, modais e controladores de vista
    └── utils/              # Ferramentas auxiliares, formatadores e simuladores
```

### Tecnologias Utilizadas:
* **JavaScript (ES2022+)**: Modular, assíncrono e tipado semanticamente.
* **CSS3 Moderno**: Apple Spatial Glassmorphism, variáveis CSS completas (*Design Tokens*), layout responsivo para smartphones, tablets e desktop (macOS Studio Layout).
* **Service Worker & Cache API**: Armazenamento em cache de todos os recursos da interface para funcionamento sem internet.

---

## 🚀 Como Executar Localmente

Como a aplicação é estática e modular (ES Modules), requer apenas um servidor HTTP local simples para execução:

### Opção 1: Via Python (Recomendado)
```bash
# Na pasta raiz do projeto:
python -m http.server 8000
```
Abra o navegador em: `http://localhost:8000`

### Opção 2: Via Node.js (npx serve)
```bash
# Na pasta raiz do projeto:
npx serve .
```

### Opção 3: Extensão Live Server (VS Code)
* Abra a pasta do projeto no VS Code.
* Clique com o botão direito em `index.html` e selecione **"Open with Live Server"**.

---

## 📄 Direitos e Autoria

* **Conceção, Arquitetura e Engenharia**: Mikhael
* **Todos os direitos reservados** © 2026.
