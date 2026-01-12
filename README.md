# ✡️ Or HaZman - Luz do Tempo

<div align="center">

![Or HaZman](https://img.shields.io/badge/Or%20HaZman-Luz%20do%20Tempo-gold?style=for-the-badge&logo=star-of-david&logoColor=white)
![Status](https://img.shields.io/badge/Status-Ativo-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Dashboard Judaico Premium** • Zmanim • Shabbat • Parashá • Feriados

[🌐 Demo ao Vivo](#) • [📖 Documentação](#-funcionalidades) • [🐛 Reportar Bug](../../issues)

</div>

---

## 🕯️ Sobre o Projeto

**Or HaZman** (אור הזמן - "Luz do Tempo") é um dashboard judaico completo e elegante, projetado para fornecer informações precisas sobre horários halachicos (Zmanim), Shabbat, feriados e muito mais.

### ✨ Destaques

- 🎨 **Design Premium** - Interface moderna com tema "Midnight Gold" e glassmorphism
- 📱 **100% Responsivo** - Funciona perfeitamente em qualquer dispositivo
- 🌍 **Geolocalização** - Detecta sua localização automaticamente via GPS
- ⚡ **Performance** - Zero frameworks, 100% vanilla JavaScript
- 🔒 **Privacidade** - Nenhum dado é armazenado em servidores

---

## 🚀 Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| 📍 **Localização** | GPS automático ou pesquisa manual de cidades |
| 🕐 **Zmanim** | Horários de pôr do sol, velas e mais |
| 🕯️ **Shabbat** | Entrada (-20m) e Saída (+20m) ajustadas automaticamente |
| 📅 **Data Hebraica** | Dia, mês e ano no calendário judaico |
| 📜 **Dupla Parashá** | Suporta parashot duplas (Vayakhel-Pekudei) com leituras unificadas |
| 🎉 **Feriados** | Prioridade Haláquica (Torá > Tradição) e calendário de Israel (1 dia) |
| 📋 **Cópia Rápida** | Copie qualquer informação clicando no ícone dos cards |
| 🎨 **UI Premium** | Interface "Midnight Gold" estática e estável (Sem Zoom/Motion) |

---

## 🛠️ Tecnologias

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

</div>

### APIs Utilizadas

- **[Hebcal API](https://www.hebcal.com/home/developer-apis)** - Zmanim, datas hebraicas, feriados e parashá
- **[Nominatim (OpenStreetMap)](https://nominatim.openstreetmap.org/)** - Geocodificação de cidades
- **[BigDataCloud](https://www.bigdatacloud.com/)** - Geocodificação reversa para GPS

---

## 📦 Instalação

### GitHub Pages (Recomendado)

1. **Fork** este repositório
2. Vá em **Settings** → **Pages**
3. Em **Source**, selecione `main` branch
4. Pronto! Acesse em `https://seu-usuario.github.io/seu-repo`

### Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/or-hazman.git

# Abra o arquivo index.html no seu navegador
# Recomendado usar um servidor local (Live Server no VS Code, etc)
```

> **Nota:** Por usar APIs externas, algumas podem exigir que a origem seja segura (HTTPS) ou localhost para geolocalização funcionar corretamente.

---

## 📁 Estrutura do Projeto

```
or-hazman/
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos, temas e animações
├── js/
│   ├── app.js          # Lógica principal, requisições e UI
│   └── i18n.js         # Internacionalização (PT)
└── README.md           # Documentação
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um **Fork** do projeto
2. Criar uma **Branch** (`git checkout -b feature/NovaFeature`)
3. Fazer **Commit** (`git commit -m 'Add: nova feature'`)
4. Fazer **Push** (`git push origin feature/NovaFeature`)
5. Abrir um **Pull Request**

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

<div align="center">

**Desenvolvido com kavanah (intenção) ✡️**

*"A Torá é árvore de vida para quem a ela se apega"*

---

⭐ Se este projeto te ajudou, considere dar uma estrela!

</div>
