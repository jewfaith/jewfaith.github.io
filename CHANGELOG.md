# Changelog • Yisrael Date

Todas as alterações notáveis neste projeto serão documentadas neste ficheiro.
O formato é baseado no padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [3.3.1] - 2026-09-19

### 📖 Literatura Judaica — Rotação ao Pôr do Sol
- **Rotação sincronizada com o dia haláchico**: A literatura judaica (card Sefaria) agora muda apenas ao pôr do sol (Shekiyah), respeitando a transição do dia judaico conforme a Torá.
- Removido o ciclo de 8 horas que causava 3 mudanças diárias sem base haláchica.
- `getUnifiedLiteratureReading()` e `getDailyReadingForCategory()` agora usam `getHalachicDayNumber()` para calcular o índice de rotação.
- O `sunsetTime` é propagado em todas as chamadas (dashboardView, sefariaModal).

## [3.3.0] - 2026-09-19

### 🕊️ Comando Unificado `party(...)` e Purificação Radical do Console DevTools
- **Purificação Radical de Ruído no Console**:
  - Removido o catálogo denso e poluído de comandos utilitários (`aba`, `tema`, `local`, `festas`, `limparCache`, `estado`, etc.) da inicialização do DevTools.
  - O cabeçalho inicial agora apresenta exclusivamente o simulador de celebrações com guia direto e exemplos limpos.
- **Comando Litúrgico Central `party(...)`**:
  - Implementada a interface `party(nome, dia?)` como padrão universal de simulação no console:
    - `party("kippur")` → Simula Yom Kippur integralmente (leituras bíblicas, Torá em Vayikra 16, Haftará em Yeshayahu 57, repouso sagrado e zmanim).
    - `party("terua", 2)` ou `party("terua")` → Simula Yom Teruah (1º dia bíblico da Torá ou 2º dia da tradição rabínica com Bereshit 22).
    - `party("pesach")` → Simula Yom Pessach (15 de Nisan com Shemot 12).
    - `party("sukkot")` → Simula Chag Sukkot (15 de Tishrei com Vayikra 22-23).
    - `party("shavuot")` → Simula Yom Shavuot (6 de Sivan com Shemot 19-20).
    - `party("shemini")` → Simula Shemini Atzeret (22 de Tishrei com Devarim 14-16).
    - `party("shabbat")` → Simula Yom Shabbat (Parashat Ha'azinu e cessação de trabalho).
    - `party("cholhamoed")` → Simula Chol HaMoed.
  - **Restauração em Tempo Real com `party()`**:
    - Executar `party()` sem argumentos encerra imediatamente qualquer simulação ativa e restaura 100% da aplicação para a data gregoriana, data hebraica, parashá da semana e zmanim reais de hoje.
  - **Atalhos e Propriedades Diretas**:
    - Adicionados métodos ergonómicos na própria função `party`: `party.kippur()`, `party.terua(2)`, `party.pesach()`, `party.sukkot()`, `party.shavuot()`, `party.shemini()`, `party.shabbat()`, `party.reset()`, `party.help()`.
    - Disponibilizadas funções globais diretas (`kippur()`, `terua(2)`, `pesach()`, etc.).
- **Atualização de Cache**: Versão do Service Worker elevada para `yisrael-date-v3.3.0`.