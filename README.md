# Yisrael Date • Calendário Bíblico & Horários Haláchicos

> **Aplicação web progressiva (PWA) de alta precisão dedicada ao estudo da Torá, cálculo de Zmanim astronómicos e observância dos Tempos Sagrados bíblicos.**

---

## 📖 Visão Geral

O **Yisrael Date** é uma plataforma independente concebida para fornecer cálculos astronómicos e haláchicos de alta precisão, preservando a fidelidade textual aos mandamentos da Torá (*Vayikra / Levítico 23*) e a distinção clara entre ordenanças bíblicas (*Base Toraica*) e tradições históricas posteriores (*Leis Tradicionais*).

Construído sob a filosofia **Offline-First**, o sistema opera com total autonomia e fiabilidade, garantindo acesso contínuo aos horários de oração, festas solenes e leituras sagradas mesmo em locais sem ligação à internet.

---

## ✨ Funcionalidades Principais

### 1. Nova Aba "Hoje" (Conteúdo Essencial Above the Fold)
* **Hero Card do Dia**:
  * **Data Hebraica & Gregoriana**: Exibição da data bíblica correspondente e data civil em destaque.
  * **Saudação Dinâmica**: Saudações hebraicas em tempo real de acordo com a hora haláchica (*Boker Tov*, *Tzoharayim Tovim*, *Laila Tov*, *Shabbat Shalom*, *Chag Sameach*).
  * **Horários Litúrgicos Rápidos**: Mini-barra com *Sha'ah Zmanit* calculada e botão de ação direta para abrir a tabela de Zmanim completa.
  * **Seletor Rápido de Cidade**: Localização ativa com alteração instantânea.
* **Parashá Semanal**: Acesso direto à leitura da semana com resumo e notas textuais.
* **Estudo Sagrado Unificado**: Bloco consolidado com abas segmentadas para alternar entre *Torá*, *Haftará*, *Ketuvim* e *Literatura Judaica (Sefaria)* sem sobrecarregar a rolagem da página.

### 2. Calendário Mensal Interativo
* **Navegação Mensal Fluida**: Transição entre meses anteriores e posteriores com botão de retorno imediato a **Hoje**.
* **Correlação Diária Dupla**: Cada célula do calendário apresenta o dia gregoriano e a respetiva data hebraica.
* **Badges Visuais e Marcadores**:
  * **Hoje**: Destaque com anel de acento visual.
  * **Shabat**: Identificação dourada aos sábados.
  * **Festas Bíblicas**: Marcador ciano para os *Moadei YHWH* da Torá.
  * **Festas Rabínicas & Jejuns**: Marcador púrpura para comemorações tradicionais.
  * **Rosh Chodesh**: Marcador de lua nova.
* **Modal de Detalhes do Dia**: Toque em qualquer dia para ver a data completa, eventos comemorativos, parashá correspondente e horários haláchicos.
* **Catálogo Canónico**: Listagens completas de Festas Bíblicas da Torá e Festas Rabínicas organizadas abaixo da grelha mensal.

### 3. Horários Haláchicos Astronómicos (Zmanim)
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

### 4. Ciclo Festivo Bíblico da Torá
* **Festas Solenes Bíblicas (*Moadei YHWH*)**:
  * *Yom Shabbat* (Sétimo Dia Sagrado)
  * *Yom Pessach* & *Chag Matzot* (1º e 7º dia solenes)
  * *Yom Shavuot* (Festa das Semanas)
  * *Yom Teruah* (Memorial com Toque de Shofar)
  * *Yom Kippur* (Dia da Expiação)
  * *Chag Sukkot* (1º dia solene de convocação santa)
  * *Shemini Atzeret* (Oitavo Dia de Reunião Solene)

### 5. Observância Sagrada Automatizada
* **Observância Sagrada**: Bloqueio automático de botões de apoio e comércio durante o tempo sagrado de Shabat e das festas solenes da Torá até à conclusão (*Havdalá / Motzei*).

### 6. Motor de Telemetria Google HEART & Testes A/B
* Medição de UX com respeito à privacidade:
  * **Engagement**: Tempo ativo de sessão via batimentos de coração a intervalos regulares.
  * **Retention**: Medição de retorno diário (DAU) e frequência de visitas.
  * **Task Success**: Rastreio de conclusão de tarefas essenciais (consulta de zmanim, leitura de parashá, navegação no calendário).
  * **Adoption**: Adoção das novas secções.
  * **A/B Testing**: Atribuição e persistência de variante A/B para otimização contínua da experiência.