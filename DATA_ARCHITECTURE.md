# Arquitetura de Dados e Otimização de Requests • Yisrael Date

Este documento descreve a arquitetura de obtenção, processamento, integridade e caching de dados da plataforma **Yisrael Date**.

---

## 1. Visão Geral da Arquitetura

A plataforma opera segundo o princípio de **estatização máxima com dinamismo estritamente necessário**:

```
                       [ APIs Externas ]
              (Hebcal, Sefaria, Bolls.life, Umami)
                               ↓
                   [ GitHub Actions Workflow ]
                 (.github/workflows/update-data.yml)
                               ↓
              [ Validação, Parsing e Sanitização ]
                    (scripts/update-data.mjs)
                               ↓
                  [ Camada de Dados Estáticos ]
                             (data/)
                               ↓
                   [ Service Worker & Cache ]
                               ↓
                     [ Frontend / Cliente ]
                               ↓
               + Contexto Local do Visitante (Dinâmico)
                  (Coordenadas, Fuso Horário, Zmanim)
```

---

## 2. Classificação das Fontes de Dados

| Fonte | Dados | Endpoint | Natureza | Estratégia de Obtenção | Frequência |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hebcal Calendar** | Ciclo de Parashot, Moadim, Jejuns e Rosh Chodesh | `/hebcal` (Diáspora e Israel) | `DAILY / PERIODIC` | Centralizado via GitHub Actions → `data/calendar-*.json` | Diária (02:00 UTC) |
| **Hebcal Converter** | Conversão de data gregoriana para hebraica | `/converter` | `UNNECESSARY` | **Eliminado:** Substituído por cálculo matemático autónomo Rambam no frontend (`biblicalCalendar.js`) | Instantâneo (0ms, offline) |
| **Hebcal Zmanim** | Horários astronómicos e ângulos solares | `/zmanim` | `USER_DEPENDENT` | Dinâmico no frontend adaptado às coordenadas reais do visitante com fallback offline (`halacha.js`) | Sob demanda / transição solar |
| **Sefaria** | Catálogo de obras em língua portuguesa | `/api/texts/translations/pt` | `DAILY / PERIODIC` | Centralizado via GitHub Actions → `data/sefaria-pt-catalog.json` | Diária (02:00 UTC) |
| **Sefaria** | Leitura de trecho aleatório | `/api/v3/texts/{REF}` | `USER_DEPENDENT` | Dinâmico sob clique explícito do utilizador | Sob demanda |
| **Bolls.life** | Leituras semanais da Torá e Haftará | `/get-chapter/NVT/{book}/{ch}` | `DAILY / PERIODIC` | Pré-carregado via GitHub Actions → `data/parashat-readings.json` | Diária (02:00 UTC) |
| **Bolls.life** | Capítulos avulsos não-sazonais | `/get-chapter/...` | `USER_DEPENDENT` | Dinâmico com cache persistente em `localStorage` | Sob demanda |
| **Umami Cloud** | Estatísticas de alcance global e países | `/api/websites/{id}/stats` | `DAILY / PERIODIC` | Centralizado via GitHub Actions com Secret → `data/umami.json` | Diária (02:00 UTC) |
| **Geolocalização** | Coordenadas, fuso horário e cidade | GPS / IP / Timezone | `USER_DEPENDENT` | Fuso horário local (0ms) + IP não-bloqueante + GPS sob clique | Sob demanda |

---

## 3. Estrutura dos Ficheiros Estáticos (`data/`)

```
data/
├── calendar-diaspora.json   # Calendário litúrgico de 2 anos para a Diáspora (366 eventos)
├── calendar-israel.json     # Calendário litúrgico de 2 anos para Israel (376 eventos)
├── sefaria-pt-catalog.json  # Catálogo filtrado e deduplicado de 68 obras em português
├── parashat-readings.json   # Leituras completas da Parashá e Moadim da estação ativa
├── umami.json               # Métricas agregadas de visitantes, páginas e países
└── manifest.json            # Manifesto com timestamp de geração e contagens
```

---

## 4. Salvaguardas de Integridade e Resiliência (Zero Data Loss)

O script gerador `scripts/update-data.mjs` obedece a regras estritas:

1. **Validação Pré-Gravação:**
   - Resposta HTTP com código 200 OK.
   - Formato JSON válido e estrutura de objeto/array esperada.
   - Limiares mínimos de plausibilidade (ex: calendário com pelo menos 100 itens; catálogo Sefaria com pelo menos 5 obras).

2. **Preservação em Falha:**
   - Se uma API externa falhar, expirar timeout ou sofrer rate-limit, o ficheiro existente anterior é **integralmente preservado**.
   - **Nunca** grava valores `null`, arrays vazios ou dados corrompidos.
   - A falha de uma fonte não impede a atualização bem-sucedida das restantes.

3. **Fallback no Cliente:**
   - O frontend tenta sempre carregar o ficheiro estático local primeiro.
   - Em caso de falha de rede ou ficheiro em falta, recorre de forma transparente à API remota ou aos motores matemáticos locais de contingência.

---

## 5. Segurança de Credenciais

- Nenhuma chave de API ou credencial está exposta no código-fonte, nos ficheiros HTML, JS ou JSON públicos.
- O acesso à API do Umami é opcional e configurado exclusivamente através de **GitHub Actions Secrets** (`UMAMI_API_KEY`).
- Se o secret não estiver configurado, o workflow gera um ficheiro de contingência neutro sem interromper a publicação do site.

---

## 6. Automação e Fluxo do GitHub Actions

O workflow `.github/workflows/update-data.yml`:
- Corre automaticamente todos os dias às **02:00 UTC**.
- Pode ser acionado manualmente em qualquer momento através do separador **Actions → Sincronização Central da Camada de Dados → Run workflow**.
- Compara se existiram modificações reais na pasta `data/`. Se não houver alterações, nenhum commit desnecessário é gerado.
