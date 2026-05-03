# Mapeamento: Form do Inventário ↔ Excel modelo (v2 — corrigido)

Análise feita em 2026-05-03 a partir de:
- `16.2 - Data Mapping (modelo) com riscos.xlsx` (versão completa, 84 colunas)
- Transcrição `16.2 - LGPD PRO.docx`
- `lib/inventario-form-schema.ts` (58 perguntas em 7 seções)

---

## Estrutura do Excel — visão geral

| Aba | Tamanho | Função |
|---|---|---|
| **INVENTÁRIO** | 84 colunas (A–CF) | Mapa de processos. 1 linha = 1 atividade de tratamento |
| **RISCOS** | 8 colunas (A–H), até 664 linhas | 1 linha = 1 risco específico identificado, com Impacto, Probabilidade, Categoria e Plano de Ação |
| **TAB. VISÃO DE RISCOS** | 6 colunas | Dashboard que conta automaticamente (via `COUNTIFS`) os riscos por tipo e classificação Baixo/Médio/Alto |

### Estrutura da aba INVENTÁRIO

A planilha tem **4 linhas-meta** antes dos dados:

| Linha | Conteúdo |
|---|---|
| L1 | "OBSERVAÇÕES GERAIS" — dicas de preenchimento por coluna (linha amarela) |
| L2 | "OBSERVAÇÕES SOBRE OS RISCOS" — explica que tipo de risco cada coluna mira |
| L3 | Vazia |
| L4 | **Headers reais** das colunas |
| L5+ | 1 linha por processo de tratamento |

> A consultora mencionou no vídeo: "tem que apagar essas duas linhas antes de mandar para o cliente, são só comentários internos."

---

## Os 5 blocos de colunas da aba INVENTÁRIO

### Bloco 1 — Inventário (A até BA, ~52 colunas)

Os dados do mapeamento em si. **Aqui é onde a maioria das respostas do wizard será injetada.**

### Bloco 2 — Lista de tipos de risco (BC até BP, 14 colunas)

Repete os labels dos 13 tipos de risco + TOTAL. **No exemplo da v2, está vazio.** Parece ser um bloco-legado mantido como referência/legenda. Não é onde o consultor preenche.

### Bloco 3 — Separador (BQ)

Coluna vazia visual.

### Bloco 4 — Identificação de riscos (BR até CE) ⭐

**É AQUI que a Análise de Riscos acontece**, ligada às outras 2 abas.

Cada coluna = 1 tipo de risco. Consultor preenche:
- `x` = Sim, este risco existe pra este processo
- (vazio) = Não
- Texto curto descritivo = Sim, com detalhe (ex: BV "Estados Unidos" pra transferência internacional)

| Excel | Tipo de Risco |
|---|---|
| BR | Ausência de legitimação |
| BS | Dados de Crianças e Adolescentes |
| BT | Possível utilização excessiva |
| BU | Falta de transparência |
| BV | Transferência internacional |
| BW | Compartilhamento com terceiro |
| BX | Armazenagem por prazo indeterminado |
| BY | Utilização para finalidade diversa |
| BZ | Compartilhamento com empresas do grupo |
| CA | Compra de base de dados |
| CB | Decisão Automatizada |
| CC | Profilling |
| CD | Background check |
| CE | TOTAL (fórmula soma os "x") |

### Bloco 5 — Final (CF)

Coluna vazia / extras.

---

## Workflow completo (do form ao dashboard)

```
WIZARD (58 perguntas)
       ↓ auto-preenche
INVENTÁRIO L5+ (linhas A-BA por processo)
       ↓ consultor analisa cada linha
INVENTÁRIO BR-CD (marca "x" pra cada risco identificado)
       ↓ consultor detalha cada risco
RISCOS (1 linha por risco específico, com Impacto/Probabilidade/Plano de Ação)
       ↓ fórmulas COUNTIFS automáticas
TAB. VISÃO DE RISCOS (dashboard final: contagem Baixo/Médio/Alto por tipo)
```

A aba RISCOS tem fórmulas:
- **Coluna E (Valor)** = `Impacto × Probabilidade`
- **Coluna F (Tipo)** = `IFS(Valor=9,"Alto"; Valor=6,"Alto"; Valor=4,"Médio"; ...)`

A aba TAB. VISÃO DE RISCOS conta riscos por tipo + classificação:
- Cada célula = `COUNTIFS(RISCOS!$G:$G, ...)` agrupando os riscos detalhados por tipo

---

## 4 categorias do mapeamento (Bloco 1, A-BA)

### Categoria 1 — Auto-preenchidas pelo wizard (~38 colunas)

| Excel | Header | Origem (form) | Notas |
|---|---|---|---|
| A | # ID | gerado | sequencial por processo |
| B | Nome da área/departamento | `respondent_department` | |
| C | Nome e contato do respondente | `respondent_name` + `respondent_email` | concatenar |
| D | Categoria de dados pessoais | derivada de Sec 3 | listar nomes das categorias com ≥1 valor marcado |
| E | Lista de dados pessoais por categoria | derivada de Sec 3 | concatenar opções marcadas |
| F+G | Dados sensíveis (Sim/Não. Quais?) | `data_sensitive_yn` + `data_sensitive_list` | |
| H | Finalidade do tratamento (sucinta) | `process_purpose` | resumir 1ª frase ou síntese |
| I | Descrição detalhada do processo | `process_purpose` | texto completo |
| N | Categoria do Titular | `use_subjects` | |
| O | Coleta direta/indireta | `collect_source` | derivar |
| P | Política de Privacidade apresentada? | `collect_policy_shown` | |
| R | Solicita consentimento? | `collect_consent` | |
| T | Acesso a dados desnecessários? | `use_unnecessary_access` | |
| V | Como o dado é coletado | `collect_source_desc` | |
| W | Recebe dados de outra empresa? | `use_received_external` + `use_received_external_desc` | |
| AA | Compartilha com áreas internas? | `share_targets` (parcial) | |
| AB | Compartilha com terceiros? | `share_targets` + `share_with_whom` + `share_purpose` + `share_data` | combinar 4 perguntas |
| AC | Como é feito o compartilhamento? | `share_medium` | |
| AE | Compartilha com outros países? | `share_international` + `share_international_countries` | |
| AG | Titular sabe dos compartilhamentos? | `share_subject_aware` | |
| AI | Armazenamento lógico (sistemas) | `store_location` | parte digital |
| AJ | Armazenamento impresso | `store_paper_secure` + `store_paper_external` + `store_paper_external_desc` | combinar |
| AL | Local único, sem redundância? | `store_local_backup` | (campo invertido) |
| AO+AP | Tempo de retenção | `store_retention` + `store_extra_retention_reason` | |
| AQ | Decisão automatizada? | `use_automated_decision` + `use_automated_decision_desc` | |
| AR | Finalidade diversa? | `use_diff_purpose` + `use_diff_purpose_desc` | |
| AS | Revisão periódica? | `store_periodic_review` | |

### Categoria 2 — Em branco para preenchimento posterior (jurídico, 6 colunas)

| Excel | Header | Quem preenche |
|---|---|---|
| J | Previsão Legal | jurídico (após pesquisa) |
| K | Base Legal — Dados Sensíveis | jurídico (sugestão LGPD) |
| L | Base Legal — Dados Comuns | jurídico |
| M | Comentários sobre as Bases Legais | jurídico |
| AN | Como o dado é destruído? | operacional |
| BA | Observação | livre — consultor |

### Categoria 3 — Segurança da Informação / TI (7 colunas)

A consultora no vídeo: "esses últimos campos antes escuros são de segurança da informação. Eu, do jurídico, coleto a informação, mas a análise é com TI/SI."

Ainda assim, **as perguntas dessa região têm correspondência parcial no form**:

| Excel | Header | Cobertura no form |
|---|---|---|
| AT | Sistemas próprios ou terceiros | parcial (não tem direto) |
| AU | Localização geográfica dos sistemas | **não cobre** |
| AV | Detalhar medidas (caso afirmativo) | parcial via `store_mobile_measures` |
| AW | TI faz backup local | parcial via `store_local_backup` |
| AX | Acesso a redes sociais/WiFi pública | **não cobre** |
| AY | Medidas de segurança? | **não cobre** |
| AZ | Quais medidas de segurança? | parcial via `share_security` |

### Categoria 4 — Análise de Riscos (BR–CD, 13 colunas + 1 total)

**Próxima fase.** Consultor marca "x" (ou texto descritivo) por linha de processo. Esses x's depois geram entradas detalhadas na aba RISCOS.

---

## Lacunas — perguntas do form sem coluna direta no Excel

| Form field | Por quê | Sugestão |
|---|---|---|
| `respondent_role` | sem coluna pra cargo | concatenar em C ou descartar |
| `process_volume` | sem coluna pra volume de titulares | escrever em `BA Observação` |
| Subcategorias da Sec 3 (`data_filiation`, `data_education`, etc.) | Excel agrega tudo em D+E | ✓ tudo derivado |
| `data_children_consent`, `data_teens` | sem coluna específica | alimentam BS (risco crianças) + escrever em `BA` |
| `data_mobile`, `data_health`, `data_financial` | sem coluna específica | alimentam D+E + risco específico em BR-CD |
| `share_with_whom`, `share_purpose`, `share_data` | parcialmente em AB | consolidar em AB |
| `store_format` | parcial em AI/AJ | combinar |
| `store_paper_external_desc` | parcial em AJ | concat em AJ |
| `store_mobile_protected`, `store_mobile_measures` | parcial em AV/AZ | combinar |
| `collect_background_check` | sem coluna | alimenta BD (criança) ou CD (background check) na Análise de Riscos |

---

## Observações da L1 (linha amarela) — riqueza pra capturar no help

A L1 do Excel tem dicas de consultoria que podem **substituir/enriquecer** os textos gerados pelo Gemini no `help.why` das 58 perguntas. Exemplos chave:

- **F (Sensíveis):** "Atenção se todos os dados pessoais que constam neste item são realmente sensíveis. Muitas vezes constam dados financeiros, background check e outros [que não são]."
- **H (Finalidade):** "Aqui a finalidade deve ser bem explicada para que seja fácil a sugestão de base legal."
- **W (Recebe de outra empresa):** "É necessário garantir que no contrato da outra empresa com seus funcionários seja mencionado que seus dados serão compartilhados..."
- **Y (Comprado de outra empresa):** "Essa é uma prática comum e dificilmente amparada pela LGPD. Existe risco de não ser legítima essa coleta..."

E a L2 conecta cada coluna ao tipo de risco BR-CD — vai ser útil quando construirmos a Análise de Riscos.

---

## Perguntas pra você confirmar antes de implementar

1. **Forma da exportação** — 1 planilha por processo (cada wizard preenchido vira 1 planilha) ou 1 planilha consolidada por organização (cada wizard preenchido vira 1 row)?
2. **Colunas AT–AZ (Segurança)** — preencher com o que conseguir do form (parcial) ou deixar em branco pra TI completar?
3. **Bloco BC-BP** — ignorar (deixar vazio na exportação) ou copiar os labels só por consistência visual?
4. **Replicar L1+L2** — copiar as observações gerais e de risco no template gerado, ou exportar planilha "limpa"?
5. **Aproveitar L1 do Excel** pra enriquecer os 58 popovers de help — fazer agora, antes do mapeamento final?
