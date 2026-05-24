# 🌟 Israel Dashboard - Calendário Adaptativo

Um painel web dinâmico e elegante que exibe informações litúrgicas judaicas em tempo real, incluindo a Parashá da semana, leituras da Torá, Haftará, Salmos (Ketuvim) e contagens regressivas para feriados.

O grande diferencial deste projeto é a sua **inteligência de localização**: ele detecta automaticamente onde o usuário está e adapta os títulos e as leituras caso ele esteja em **Israel** ou na **Diáspora (Chutz laAretz)**.

---

## 🚀 Principais Recursos

* **Geolocalização Automática:** Identifica a localização aproximada do usuário para carregar os dados corretos da região.
* **Transição pelo Pôr do Sol (Zmanim):** Avança o calendário litúrgico para o dia seguinte de forma automática ao anoitecer local.
* **Títulos Adaptativos:**
  * **Semanas Normais:** Exibe a Parashá da semana.
  * **Chol HaMoed:** Altera o título para *Chol HaMoed* e indica leituras especiais.
  * **Yom Tov:** Exibe *Kriat HaMoed* e ajusta os subtítulos conforme a localização.
  * **Dias Extras da Diáspora (Yom Tov Sheni):** Exibe exatamente *Chutz laAretz* com leituras exclusivas para quem está fora de Israel.
* **Filtro de Feriados Tradicionais:** Exibe contagens regressivas apenas para grandes datas históricas e jejuns do calendário judaico.
* **Console de Testes:** Permite que desenvolvedores simulem estados do painel no console do navegador (F12) digitando comandos simples como `simularLayout('yomtov', 'Chutz')`.

---

## 🛠️ Tecnologias Utilizadas

* **HTML5** (Estrutura)
* **CSS3 Vanilla** (Estilo com design moderno em *Glassmorphism*)
* **Javascript Puro (ES6)** (Consumo assíncrono das APIs do Hebcal e OpenStreetMap)

---

## 💻 Como Rodar o Projeto

1. Baixe ou clone este repositório.
2. Abra o arquivo `index.html` em qualquer navegador.
3. Certifique-se de estar conectado à internet para carregar as informações litúrgicas em tempo real e os ícones decorativos.
