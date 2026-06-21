<div align="center">
  <h1>🕎 Yisrael Date</h1>
  <p><strong>Um Dashboard Moderno e Leve para o Calendário Judaico</strong></p>
</div>

<p align="center">
  O <b>Yisrael Date</b> é um aplicativo web progressivo (PWA) construído com foco em velocidade, leveza e precisão haláchica. Ele acompanha automaticamente o calendário hebraico, porções semanais da Torá e oferece contagem regressiva para as próximas festividades judaicas, tudo sincronizado com os horários astronômicos (Zmanim) da sua localização atual.
</p>

---

## ✨ Principais Funcionalidades

- **📍 Geolocalização Inteligente:** Detecta a sua localização atual automaticamente ou permite busca manual com auto-completar para adaptar as datas e feriados de acordo com a sua cidade (distinguindo entre Israel e a Diáspora).
- **🌙 Sincronização com o Pôr do Sol (Shkiah):** A data hebraica vira exatamente no pôr do sol local e não à meia-noite, honrando milênios de tradição judaica.
- **📖 Leituras Diárias e Semanais:** Descubra instantaneamente a Parashá da semana, Haftará, e leitura associada aos Ketuvim (Escritos Sagrados).
- **⏳ Contagem Regressiva Viva:** Acompanhe exatamente o tempo restante para as próximas 4 festividades principais de forma limpa e dinâmica.
- **⚡ Suporte Offline (PWA):** Instale diretamente no seu celular (Android ou iOS). Os dados são guardados em cache, permitindo consultas instantâneas até mesmo sem internet (Modo Offline).
- **🔋 Zero Frescura:** Feito em Vanilla JS puro, CSS moderno e HTML. Consome pouquíssima bateria e não requer servidores ou frameworks pesados para rodar.

## 🚀 Como Executar

O projeto foi refatorado utilizando **Clean Architecture** e **ES Modules** para otimização máxima. Devido à segurança dos navegadores (CORS em módulos locais), ele requer um servidor local.

1. Faça o clone ou o download do projeto.
2. Utilize um servidor local leve na pasta do projeto. 
   - Se usa VSCode, instale a extensão *Live Server* e clique em "Go Live".
   - Se tem Python, rode no terminal: `python -m http.server`.
   - Se tem Node, rode: `npx serve`.
3. Abra o endereço (geralmente `http://localhost:5500` ou `8000`) no seu navegador.

## 🛠 Tecnologias e APIs Utilizadas

- **HTML5, CSS3, JavaScript Vanilla:** Para a melhor performance e fluidez possíveis.
- **[Hebcal API](https://www.hebcal.com):** A espinha dorsal do projeto. Fornece o calendário hebraico completo, horários de acendimento das velas e cálculos de Zmanim.
- **[Nominatim (OpenStreetMap) API](https://nominatim.org/):** Usada para geocodificação reversa, traduzindo coordenadas de GPS em nomes de cidades de forma amigável.

## 📜 Licença

O projeto é de código aberto. Sinta-se à vontade para modificar, distribuir e usar em seus próprios projetos ou comunidades!
