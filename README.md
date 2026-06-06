# 🕎 Yisrael Date - Calendário Hebraico

Um aplicativo web super leve e rápido para acompanhar o calendário judaico. Ele mostra exatamente a porção da Torá (Parashá) da semana e faz a contagem regressiva para os próximos feriados, sempre de acordo com a sua cidade e os horários astronômicos locais (Zmanim).

---

## ✨ O que ele faz de melhor?

- **Localização Automática:** Descobre onde você está e adapta os feriados e leituras automaticamente (sabendo diferenciar se você está morando em Israel ou no resto do mundo).
- **Sem Frescuras:** Não precisa de internet rápida. Ele abre instantaneamente salvando os dados do último uso enquanto puxa as informações novas de forma invisível.
- **Modo Noturno (Pôr do Sol):** A data vira exatamente no Pôr do Sol da sua cidade, e não à meia-noite, seguindo a tradição milenar judaica.
- **Instalável (PWA):** Pode ser adicionado à tela inicial do seu celular (Android ou iPhone) como se fosse um aplicativo da loja.

---

## 🚀 Como Usar

O aplicativo é focado na simplicidade. Não exige instalação de servidores complicados:

1. Baixe esta pasta.
2. Dê um duplo-clique no arquivo `index.html` e ele abrirá no seu navegador favorito.
3. Se quiser trocar de cidade manualmente, basta clicar no bloco com o nome do seu país/cidade.

---

## 🛠️ O que tem por baixo do capô?

O aplicativo foi criado puramente com **HTML**, **CSS** e **Javascript** básicos, sem frameworks pesados. É uma obra feita à mão para garantir que gaste quase zero de bateria e rode rápido em qualquer dispositivo.

**APIs (os servidores que usamos):**
* **Hebcal:** Fornece a data hebraica e a hora do sol.
* **OpenStreetMap:** Traduz a sua latitude e longitude para o nome da sua cidade atual.
