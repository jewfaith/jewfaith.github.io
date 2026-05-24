# 🌟 Israel Dashboard - Calendário Litúrgico Adaptativo

Um dashboard web premium, dinâmico e responsivo projetado para exibir leituras da Torá (Parashá), leituras de Haftará, salmos/escritos (Ketuvim) e contagens regressivas para festividades judaicas em tempo real. O sistema adapta-se automaticamente à localização do usuário, alternando a liturgia e as regras de feriados dependendo de ele estar em **Israel** ou na **Diáspora**.

---

## ✨ Principais Funcionalidades

### 1. 🌍 Geolocalização Inteligente e Consenso de Fuso Horário
* **Detecção Automática:** O sistema executa consultas em paralelo a múltiplos provedores de geolocalização de alta fidelidade para capturar as coordenadas de latitude e longitude do usuário.
* **Algoritmo de Consenso:** Utiliza uma fórmula de centroide de mínima distância para filtrar discrepâncias (como VPNs ou rotas CDN artificiais), garantindo a maior estabilidade e precisão geográfica possível.
* **Detecção de Israel:** Verifica o fuso horário oficial (`Asia/Jerusalem`) e faz a geolocalização reversa (buscando o código de país `'il'`) para alternar de forma dinâmica o parâmetro de Israel (`i=on` ou `i=off`) nas requisições da API Hebcal.

### 🌅 2. Sincronização Dinâmica pelo Pôr do Sol (Zmanim)
* O dashboard calcula o horário exato do pôr do sol local em tempo real todos os dias usando a API de Zmanim do Hebcal para as coordenadas geográficas exatas do usuário.
* Ao atingir o pôr do sol, o calendário avança automaticamente as datas litúrgicas para o dia seguinte de forma contínua, sem necessidade de recarregar a página manualmente.

### 📜 3. Regras Litúrgicas Inteligentes (Israel vs. Diáspora)
O sistema adapta os títulos das seções centrais e subtítulos conforme o calendário litúrgico haláchico:
* **Semanas Comuns:** Exibe o nome da Parashá semanal do ciclo anual (ex: *Bereshit*) e o subtítulo de localização como `Local Vigente`.
* **Chol HaMoed (Dias Intermediários de Festas):** O título central muda automaticamente para **`Chol HaMoed`** com o subtítulo **`Leitura Especial`**.
* **Yom Tov (Dias de Festas da Torá):** O título do painel exibe **`Kriat HaMoed`**, o subtítulo exibe **`Leitura Especial`**, e o subtítulo do local mostra **`Local Vigente (Israel)`** ou **`Local Vigente (Chutz)`** dependendo do país detectado.
* **Yom Tov Sheni (Dias Extras na Diáspora):** Nos dias adicionais celebrados apenas fora de Israel (quando a festividade já encerrou em Israel segundo a Torá — ex: 8º dia de Pessach, 2º dia de Shavuot e 2º dia de Shemini Atzeret/Simchat Torah), o título principal muda exatamente para **`Chutz laAretz`**, com o subtítulo **`Leitura Especial`**, e o rodapé de localização exibe exatamente **`Local Vigente (Chutz laAretz)`**.

### 🗓️ 4. Filtro Estrito de 21 Grandes Festividades Tradicionais
Apenas as maiores festividades históricas, tradicionais e jejuns definidos no sistema são permitidos no feed de eventos futuros. Outros feriados menores ou modernos não mapeados são rigorosamente filtrados para manter a interface limpa e focada.

### 🧪 5. Ferramenta de Simulação Integrada
Desenvolvido para facilitar o teste visual de diferentes layouts litúrgicos instantaneamente através do console de ferramentas do desenvolvedor (F12) do navegador.

---

## 🎨 Design & Estética Premium
* **Aparência Visual:** Interface construída com base em conceitos modernos de *Glassmorphism* (efeito de vidro jateado fosco) e painéis translúcidos com bordas suaves e gradientes vibrantes no fundo.
* **Tipografia Moderna:** Utiliza a fonte **Poppins** (do Google Fonts) e ícones vetorizados estilizados do **FontAwesome** para cada categoria de evento.
* **Micro-animações:** Transições suaves em estados de carregamento, contagens regressivas reativas que atualizam a cada 10 milissegundos e remoção dinâmica de cartões quando uma festividade expira.

---

## 📂 Estrutura de Arquivos

* `index.html` - Estrutura semântica HTML5 com elementos e IDs únicos para os blocos de dados.
* `style.css` - Sistema de estilo vanilla com variáveis CSS, layout flexível/grid responsivo, efeitos de desfoque de fundo e gradientes HSL adaptados.
* `script.js` - Toda a lógica em Javascript puro (Vanilla JS): requisições HTTP assíncronas paralelas, Zmanim, consenso de geolocalização, regras litúrgicas adaptativas, normalização de caracteres e o simulador de ambiente.
