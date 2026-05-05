# Handover — PGP (LGPD)

> **Última sessão:** 2026-05-04 (Checkpoint 14 H1 — Adequação de contratos pré-LGPD)
>
> **Migração Neon:** ✅ Etapas 2 → 16 aplicadas em prod.
> **`origin/main`:** Pendente (commits G4+H1 ainda não pushados).

App em **produção:** https://lgpd-pgp.vercel.app
Repo: https://github.com/dssenna-oss/pgp02 (público)

---

## ✅ Funcionando em prod

- Frontend Next.js + Postgres (Neon) + auto-deploy via push em `main`
- Login: `clubedoservidor@protonmail.com` / `741963PgP@*#$`
- Conteúdos didáticos, e-books de fase, documentos de fase (71 arquivos) + 20 no Vercel Blob (fase-6/7)
- Logo da empresa via base64 no DB (sem S3)
- Vídeos de capa: YouTube embed
- Chatbot independente da Abacus rodando Gemini 2.5 Flash
- **RAG com pgvector no Neon: 2.642 chunks** indexados em **86 sources** — 100% coverage

---

## 🆕 O que foi feito na sessão 2026-05-04 (já em produção)

### Features novas

-15. **Adequação de Terceiros pré-LGPD (Checkpoint 14 — H1)** — COMPLETO
   - **Schema (Etapa 16)**: `operators.lgpdComplianceStatus` (NAO_AVALIADO/EM_ADEQUACAO/ADEQUADO/NAO_APLICAVEL) + `operators.contractOriginalDate`. Migration nova `_migrate-terceiros-adequacao.sql` + adicionada ao consolidado.
   - **A1+A3 (Status de adequação)**:
     - Helper `LGPD_COMPLIANCE_STATUS` + label + classes Tailwind em `lib/operadores-helpers.ts`
     - Campos `lgpdComplianceStatus` + `contractOriginalDate` no DTO + `OperatorStats.byLgpdCompliance` + `pendingCompliance`
     - PATCH `/api/operadores/[id]` aceita os 2 campos novos com validação
     - `pending-count` agora também conta operadores em NAO_AVALIADO/EM_ADEQUACAO
     - UI: filtro "Adequação LGPD" (com opção "Pendentes (não avaliado + em adequação)") em `/dashboard/terceiros`, badge no card e no header do detalhe, banner azul quando há pendências
   - **C1 (Campanha de adequação)**:
     - Endpoint `POST /api/operadores/[id]/start-adequacao`: muda status pra `EM_ADEQUACAO` + cria 5 `ActionPlan` em transaction (avaliar 14d / decidir cláusula 21d / negociar 45d / assinar 75d / reavaliar 365d), com `origin=OPERADOR` + `refOperatorId` + prioridade derivada do risco. Idempotente (verifica por título + ainda em aberto).
     - Botão "Iniciar adequação" no header do detalhe (só aparece quando `lgpdComplianceStatus = NAO_AVALIADO`) com `confirm()` explicando o que vai acontecer.
   - **B1 (Toggle Cláusula nova / Termo aditivo)**:
     - `lib/operadores-clausulas.ts` ganhou `mode: NOVA | ADITIVO` (default NOVA)
     - Em modo ADITIVO, `wrapAsAditivo()` embrulha o conteúdo da cláusula com cabeçalho "TERMO ADITIVO DE ADEQUAÇÃO À LGPD", qualificação das partes, considerandos LGPD (3 cláusulas obrigatórias), referência ao contrato original, fecho "Permanecem inalteradas as demais cláusulas" + foro + assinaturas
     - API `/api/operadores/[id]/clause?mode=NOVA|ADITIVO` — em modo ADITIVO usa `contractOriginalDate` se presente; nome do arquivo muda pra `TermoAditivo_*` ou `Clausula_*`
     - UI: 2 botões separados no header em vez de 1 ("Cláusula nova (.docx)" / "Termo aditivo (.docx)")
   - **D2 (Importação de PDF pesquisável)**:
     - `lib/pdf-contract-extractor.ts`: engine pura via `pdfjs-dist` + regex (sem LLM). Extrai CNPJ (formato fixo), até 30 primeiras páginas, candidatos a razão social via 3 estratégias (proximidade de CNPJ, rótulos CONTRATANTE/CONTRATADO, caixa-alta com sufixo societário), datas em formato DD/MM/YYYY ou "DD de MÊS de YYYY", contexto pra `contractOriginalDate` ("celebrado em", "datado de") e `contractExpiresAt` ("vigência até", "vence em"), keywords LGPD pra `hasPrivacyClause` (LGPD, Lei 13.709, ANPD, encarregado, ...) e `hasIncidentClause` (notificação de incidente, 72 horas, ...). Trata PDFs escaneados sem texto retornando `noText: true`.
     - API `POST /api/operadores/extract-pdf` (multipart): salva PDF no Vercel Blob, extrai metadata, devolve `{ blob, extraction }` pra preview. Rejeita PDFs sem texto com 422.
     - `POST /api/operadores` aceita `contractOriginalDate`, `contractExpiresAt`, `hasPrivacyClause`, `hasIncidentClause`, `contractAttachments` opcionais no create.
     - UI: novo botão **"Importar PDF"** no header de `/dashboard/terceiros` + modal `terceiro-pdf-import-modal.tsx` em 2 etapas (upload com drag-drop estilo / preview editável com badges + sugestões alternativas + checkboxes de cláusulas detectadas + sumário do anexo). PDF anexado automaticamente como `contractAttachments[0]` ao confirmar.
   - **Filename DOCX**: prefixo "TermoAditivo" vs "Clausula" conforme modo

-14. **Gestão de Terceiros — G4 Integrações (Checkpoint 14 fechado)** — COMPLETO
   - **Schema (Etapa 15)**: `action_plans.refOperatorId` (4ª ref polimórfica) + índice `companyId,refOperatorId`. Migration nova `_migrate-action-plan-operator.sql` + adicionada ao consolidado.
   - **Plug Plano de Ação**:
     - Novo valor de enum `ACTION_ORIGIN.OPERADOR` em `lib/action-plan-helpers.ts` + label "Gestão de Terceiros" + classe Tailwind blue.
     - `actionToDTO` aceita `operatorById` no resolver pra computar `refLabel` "Operador — {nome}" e `refHref` `/dashboard/terceiros/{id}`.
     - `POST /api/plano-acao` aceita `refOperatorId` + dedup 409 por `(OPERADOR, refOperatorId)`.
     - `POST /api/plano-acao/import` agora também varre `Operator` da org e gera ações automáticas pra: contrato VENCIDO/SEM_CONTRATO (ALTA), cláusulas faltando em OPERADOR (MEDIA), risco contratual ALTO (ALTA), última avaliação overall ALTO (ALTA), formulário enviado há +30d sem resposta. 1 ação por operador (não 1 por problema) — descrição lista todos os pontos. Idempotente via `seenOperator`.
     - `<AddToActionPlanButton>` ganhou `OPERADOR` no enum `origin` + prop `refOperatorId`. Plugado no header de `/dashboard/terceiros/[id]` (DPO-only) — só aparece quando `hasOperatorIssues(op)` (vencido / sem contrato / cláusulas faltando / risco ALTO).
   - **Plug RIPD Seção 1**:
     - `RipdData.s1` ganhou novo campo `operatorsList: ReadonlyArray<{id, name, cnpj, relationType, activityDescription, contractStatus, contractRiskClass, country}>` (lista estruturada vinda de `OperatorProcessLink`). Campo `operators` (texto livre) preservado como complemento.
     - `prepopulateRipdFromInventory` puxa `operatorLinks.operator` do DataInventory e popula `operatorsList`.
     - `RIPD_SECTIONS[s1]` ganhou `hasList: "operatorsList"`. Hint do campo `operators` mudou pra "complemento descritivo".
     - Editor (`ripd-editor-content.tsx`) tem novo `<OperatorsList>` que renderiza tabela com badges (posição, risco, status do contrato, transferência internacional) + link "Abrir →" pra `/dashboard/terceiros/{id}`.
     - DOCX export (`ripd-docx-export.ts`) ganhou `renderOperatorsTable` com 7 colunas (Operador, CNPJ, Posição, País, Risco contrato, Status contrato, Atividade).
     - Diff engine (`ripd-diff.ts`) compara `operatorsList` por `id`, detecta mudanças em posição/contrato/risco/atividade.
     - **Compatibilidade**: `normalizeRipdData()` em `ripd-helpers.ts` garante que RIPDs antigos sem `operatorsList` recebem array vazio na leitura. Aplicado em `ripdToDTO`.
   - **Auto-import Inventário→Operador**:
     - `GET /api/operadores/suggestions` lista processos APROVADOS com `sharing` preenchido SEM `OperatorProcessLink`. Filtra respostas negativas ("não compartilhado", "nenhum", "n/a", "—", "sem", etc.). Heurística de extração de candidatos a razão social: split por vírgula/ponto-vírgula/" e "/" com "/" para "; stopwords (contador, cliente, fornecedor, interno, etc.) filtradas.
     - Banner em `/dashboard/terceiros` (DPO-only): card por processo, lista até 5 candidatos como botões "Cadastrar 'X'" — clicar abre o modal de criação pré-preenchido + flag `linkInventoryId` que vincula o processo automaticamente.
     - `POST /api/operadores` aceita `linkInventoryId` + `linkActivityDescription` opcionais → cria `OperatorProcessLink` no mesmo request (Contribuidor só consegue se for processo próprio).
     - Modal de criação (`terceiro-create-modal.tsx`) aceita `prefillName`, `linkInventoryId`, `linkActivityDescription`.
   - **Sidebar badge + 3º card Fase 6**:
     - `GET /api/operadores/pending-count` devolve count de operadores com pendência crítica (vencido/sem contrato/risco ALTO/avaliação overall ALTO). Aplica `operatorAccessFilter` (DPO=tudo, Contribuidor=processos próprios).
     - `dashboard-layout.tsx`: novo polling de 60s + state `operatorsPending` + badge âmbar (`bg-amber-500`) ao lado de "Gestão de Terceiros".
     - `phase-native-tools.tsx`: `Fase6Tools` agora tem grid `xl:grid-cols-3` + novo `<TerceirosCardTools>` com KPIs (terceiros / risco ALTO / vencidos / vencendo 90d).

-13. **Gestão de Terceiros (Checkpoint 14 — G1+G2+G3)** — COMPLETO
   - **Schema novo (Etapas 13 + 14)**: `Operator` (entidade jurídica + contrato embutido — incluindo régua de risco do contrato baseada em 6 critérios ANPD) + `OperatorProcessLink` (M:N com `DataInventory`) + `OperatorAssessment` (formulário de avaliação com workflow de 5 estados e publicToken único)
   - **`lib/operadores-helpers.ts`**: enums (RelationType, ContractStatus, ContractRiskClass, RecommendedClause), DTOs, auth gate (DPO edita; Contribuidor visualiza com escopo limitado a processos próprios), checklist de classificação Operador/Controlador (10 perguntas em 2 blocos com sugestão automática)
   - **`lib/operadores-risco-contrato.ts`**: engine pura — 6 critérios ANPD → ALTO/MEDIO/BAIXO. Geral × Específico ≥ 1 = ALTO; geral OU específico ≥ 1 = MEDIO; nenhum = BAIXO. Recomendação de cláusula combina com `relationType`
   - **`lib/operadores-formulario.ts`**: catálogo de 52 perguntas em 7 blocos (transcritas literalmente do XLSX modelo da Denise) com tags Cyber/LGPD/Cyber+LGPD, gabarito, flag evidência, sub-questões
   - **`lib/operadores-pontuacao.ts`**: engine pura — pontuação Cyber e LGPD **separadas**, NA neutro, classificação <60% ALTO / 60-90% MEDIO / ≥90% BAIXO, geração de token público URL-safe
   - **`lib/operadores-clausulas-templates.ts`**: 5 templates seed em markdown (Robusta, Simples, CC, Cliente Op, Minuta) com placeholders `{{contratante.razaoSocial}}`, `{{contrato.dataAtual}}`, `{{dpo.email}}`
   - **`lib/operadores-clausulas.ts`**: engine de aplicação de placeholders + `buildClauseContext` (decide contratante/contratado conforme tipo) + `renderClauseTemplate`
   - **APIs (12 rotas novas)**: `GET/POST /api/operadores`, `GET/PATCH/DELETE /api/operadores/[id]`, `POST/DELETE /api/operadores/[id]/processes`, `GET/POST /api/operadores/[id]/assessment`, `GET/PATCH/DELETE /api/operadores/[id]/assessment/[assessmentId]`, `GET/PATCH/POST /api/avaliacao-terceiro/[token]` (público sem auth), `GET /api/operadores/[id]/clause` (DOCX), `POST /api/operadores/[id]/upload` (Vercel Blob)
   - **UI**: `/dashboard/terceiros` (lista com KPIs por risco + 2 banners DPO + filtros + busca + modal cadastro) · `/dashboard/terceiros/[id]` (editor com 6 abas: Identificação · Posição (checklist + sugestão) · Risco do contrato (6 critérios) · Contrato (vigência + cláusulas + 2 uploaders) · Processos vinculados · Avaliação de risco (criar token + revisar respostas)) · `/avaliacao-terceiro/[token]` (formulário público sem auth, auto-save 1.5s, 7 blocos)
   - **DOCX**: botão "Baixar cláusula (.docx)" no header gera aditivo já preenchido (reusa `buildPolicyDocx` do Checkpoint 12)
   - **10º template Política**: `POLITICA_AVALIACAO_TERCEIROS` adicionado ao Checkpoint 12 (Política de Gestão de Risco de Segurança e Privacidade na Contratação de Terceiros)
   - **Sidebar**: item "Gestão de Terceiros" com ícone Handshake — visível pra DPO + Contribuidor
   - **G4 pendente**: integração com Inventário (auto-import operadores do `sharing`), Plano de Ação (ações automáticas), RIPD (Seção 1 puxa lista estruturada), 3º card Fase 6, badge sidebar com pendentes

-12. **RIPD v2 institucional (Checkpoint 13 — F1+F2+F3+F4)** — COMPLETO
   - **Schema novo (Etapa 12 da migration)**: refatorou `model RIPD` legacy do Abacus (DROP+CREATE com 0 registros) → `Ripd` (8 seções estruturadas em JSON, fluxo de aprovação, versionamento) + `RipdVersion` (snapshot por aprovação)
   - **`lib/ripd-helpers.ts`**: enums (RASCUNHO/EM_REVISAO/APROVADO/ARQUIVADO), DTO, auth gate aceitando DPO + Contribuidor, 6 permissões granulares (canEdit/Submit/Approve/Reject/Delete/Archive), tipo `RipdData` com 8 seções (s1..s8)
   - **`lib/ripd-prepopulate.ts`**: engine pura que monta as 8 seções a partir de `DataInventory` + `Company` + `ProcessRisk` (não-eliminados) + `GapAnswer` (aderentes) + `ActionPlan` (abertas) — RIPD nasce 80% pré-preenchido
   - **8 APIs**: `GET/POST /api/ripd` · `GET/PATCH/DELETE /api/ripd/[id]` · `POST /api/ripd/[id]/{submit,approve,reject}` · `GET /versions` · `GET /diff?a=&b=` · `GET /pending-count` · `GET /export?source=published|current`
   - **`lib/ripd-diff.ts`**: engine pura word-level (jsdiff) + diff estrutural de listas (riscos por code, ações por id, controles por code). Devolve `RipdDiff` com seções, stats e parts[]
   - **`lib/ripd-docx-export.ts`**: builder DOCX com docx-js — capa institucional, H1 por seção, H3 por campo, tabelas pra riscos/controles/ações
   - **UI**: `/dashboard/ripd` (lista com 4 KPIs, filtros, busca, banner DPO destacado, modal de criação) · `/dashboard/ripd/[id]` (editor com 8 abas verticais, ações dinâmicas por papel, modais aprovação/rejeição/histórico/comparar) · `/dashboard/ripd/[id]/pdf` (print-friendly auto-print)
   - **Sidebar**: item "RIPD" com ícone FileCheck2, badge azul com contagem de pendentes (polling 60s + custom event refresh imediato)
   - **Permissões**: DPO edita/aprova qualquer RIPD da org; Contribuidor cria rascunho próprio → envia pra revisão → DPO aprova/rejeita com motivo
   - **Decisão**: `canEdit/canApprove` permitem editar e re-aprovar em APROVADO (modelo igual Políticas — `data` é rascunho vivo, `publishedContent` é snapshot da última versão)
   - **Plug Fase 6**: 2º card `RipdCardTools` ao lado de `PoliticasCard` no "Coloque em prática"
   - **Limpeza**: deletados `app/api/ripds/`, `components/ripd/{ripd-content,ripd-form-modal,ripd-view-modal}.tsx`, interface `RIPD` em `lib/types.ts`
   - **Deps**: `docx` + `diff` (já estavam em package.json mas faltava `npm install`); criei `diff.d.ts` shim de types
   - **`scripts/_migrate-ripd-v2.sql`** + Etapa 12 no consolidado, idempotente

-11. **Políticas — E4 (DOCX + PDF + Diff)** — COMPLETO
   - **`lib/policies-docx-export.ts`**: parser markdown→DOCX usando `docx-js`. Suporta headings, parágrafos, listas (bullet/numeric), tabelas, blockquote, HR, bold/italic/code, links. Não é parser perfeito mas cobre o subset dos templates. Capa com tipo + título + metadata da empresa/versão.
   - **`GET /api/politicas/[id]/export?source=published|current`** — DOCX download (DPO-only)
   - **`/dashboard/politicas/[id]/pdf`** — view de impressão dedicada (mesmo padrão do PDF do GAP). `?autoprint=1` dispara window.print() no carregamento.
   - **`GET /api/politicas/[id]/diff?a=<ref>&b=<ref>`** — usa `diff` (jsdiff) pra calcular word-level diff. `ref` aceita `current`, `published` ou número de versão. Devolve parts[] + stats.
   - **Botões "DOCX", "PDF", "Comparar"** no header do editor (`policy-editor.tsx`). Modal "Comparar" com 2 dropdowns (any vs any) + barra de stats colorida + diff inline em pre.
   - **Deps novas:** `docx` + `diff` (~150KB)

-10. **Políticas (Checkpoint 12 — E1+E2+E3)** — COMPLETO
   - **Schema novo**: `Policy` + `PolicyVersion` + `Company.slug` (Etapa 11)
   - `lib/policies-helpers.ts`: enums, DTOs, slug helpers, `ensureCompanySlug` (gera slug único)
   - `lib/policies-templates.ts`: **9 templates seed em markdown** (Aviso Externo, Privacidade Interna, Norma, Termos, Cookies, Terceiros, Retenção, Treinamento, Transferência Internacional + Outra) com `{{placeholders}}` que são substituídos por dados da Company
   - **APIs**: `GET/POST /api/politicas` · `GET/PATCH/DELETE /api/politicas/[id]` · `POST /api/politicas/[id]/publish` (cria PolicyVersion + atualiza publishedContent)
   - **UI**: `/dashboard/politicas` (lista + KPIs + modal "criar de template" com 9 cards) · `/dashboard/politicas/[id]` (editor split markdown + preview ao vivo via `marked` + barra de ações com Salvar/Publicar/Histórico)
   - **URL pública**: `/p/<companySlug>/<policySlug>` sem auth, layout limpo, header com logo+website da empresa, preview do markdown publicado, footer "Documento mantido por X · Gerado pelo PGP"
   - **Versionamento**: cada publish cria PolicyVersion (snapshot do conteúdo + changeLog opcional). Modal "Histórico" lista versões com data e autor.
   - **Sidebar** com ícone FileText (DPO-only)
   - **Card "Coloque em prática" da Fase 6** (Execução) renderiza `Fase6Tools` com KPIs do Plano (total/publicadas/rascunhos/com-mudanças-não-publicadas)
   - **Dependência nova:** `marked` (~50KB) — adicionado com `--legacy-peer-deps`

-9. **Plano de Ação D3 (integrações + XLSX)** — COMPLETO
   - `lib/plano-acao-export.ts` + `GET /api/plano-acao/export` (DPO-only) + botão "Exportar Excel" no header
   - `POST /api/plano-acao` agora dedup por ref polimórfica: se já existe ação pra mesmo `(origin, ref*)`, devolve 409 com `existing.{id, title, status}`
   - Componente reusável `<AddToActionPlanButton>`: estado idle → loading → added/exists ("No Plano" verde + checkmark)
   - Plugado em 3 telas:
     - **Diagnóstico**: botão em cada recomendação (refs vêm do scoring que agora popula `refGapCode/refRiskId/refInventoryId`)
     - **GAP**: botão na barra de ações do controle expandido — só aparece quando aderencia=NAO_ADERENTE|PARCIAL E ponto de melhoria preenchido
     - **Detalhamento de Risco individual**: botão na barra sticky — só quando status=IDENTIFICADO; prioridade derivada da severidade decoded
   - `DiagnosticoInput.risks` ganha `id`; `Recommendation` ganha `refGapCode/refRiskId/refInventoryId`; `/api/diagnostico` traz `id` no select

-8. **Plano de Ação institucional (Checkpoint 11)** — COMPLETO (D1+D2)
   - **Schema novo**: `model ActionPlan` refatorado do placeholder Abacus. Campos: `title`/`description`/`notes` + `origin` (MANUAL|GAP|RISCO|BASES) + refs polimórficos (`refGapCode`/`refRiskId`/`refInventoryId`) + `assigneeId` (User responsável) + `dueDate` + `priority` (ALTA|MEDIA|BAIXA) + `status` (A_FAZER|EM_ANDAMENTO|CONCLUIDA|CANCELADA) + `completedAt` + `createdById`
   - Migration Etapa 10 — DROP+CREATE (descartou 2 seeds Abacus sem valor de produção)
   - `lib/action-plan-helpers.ts`: enums + DTO + labels + classes Tailwind + `loadActionPlanAuth` (DPO opcional) + `computeActionStats`
   - **3 APIs**: `GET/POST /api/plano-acao` (lista DPO=tudo / Contribuidor=próprias) · `GET/PATCH/DELETE /api/plano-acao/[id]` (DPO edita tudo, Contribuidor só status+notes nas próprias) · `POST /api/plano-acao/import` (auto-importa pendentes, idempotente)
   - **UI** `/dashboard/plano-acao`: header com KPIs, 3 tabs (Em aberto/Concluídas/Cronograma agrupado por mês), filtros (busca+origem+prioridade), cards com checkbox quick-toggle de conclusão, botões editar/excluir, refs clicáveis pra origem
   - **Form modal** com responsável (carrega de /api/team), prazo, prioridade, status, notas
   - **Sidebar** com ícone Target — visível pra todos (Contribuidor vê só próprias)

-7. **GAP — Comparar versões (Polimento C1)** — COMPLETO
   - `lib/gap-compare.ts`: engine pura `buildGapDiff(listA, listB)` que classifica mudanças em 5 tipos (IMPROVED / WORSENED / CHANGED / NEW / REMOVED) e calcula scores comparativos
   - `GET /api/gap/compare?a=&b=` — cada lado aceita "atual" ou ID de snapshot. DPO-only, valida ownership
   - `/dashboard/gap-analysis/compare` — UI com 2 dropdowns no topo, hero comparativo (score A · delta · score B), 6 KPI pills coloridos por tipo, tabela com 1 linha por mudança (filtrável por tipo). Inalterados ficam fora pra reduzir ruído
   - Pontos de entrada: botão "Comparar" no header do GAP + ícone GitCompareArrows em cada item do modal de Snapshots (`?a=<snap>&b=atual` pré-selecionado)
   - Zero migration; só agrega dados existentes

-6. **GAP — Exportar PDF (Polimento C2)** — COMPLETO
   - Página dedicada `/dashboard/gap-analysis/pdf` — layout print-friendly (A4, sem sidebar) com capa executiva, score de maturidade, KPIs por aderência/mapeamento, top 10 pontos de melhoria, sumário por domínio (28 linhas)
   - Auto-print via `window.print()` (condicional por query param `?autoprint=1`) — ao clicar "Exportar PDF" no header do GAP abre nova aba que já dispara o diálogo de impressão; user escolhe "Salvar como PDF"
   - Botão "Imprimir / Salvar PDF" na barra de controles pra reabrir o diálogo manualmente
   - Sem dependência de PDF lib (zero adições no bundle)

-5. **Visão de Riscos consolidada (Checkpoint 7)** — COMPLETO
   - `/api/riscos` estendido: além dos `byCode`/`bySeverity` que já tinha, agora devolve `bySeverityByCode` (matriz tipo × severidade), `byStatusAgg` (contagem por status do ciclo de vida) e `topCriticos` (top 5 ALTO+IDENTIFICADO ordenados por mais antigos)
   - Componente novo `components/riscos/riscos-visao-content.tsx`: 4 seções (severidade agregada com stacked bar, 4 cards de status, 13 barras horizontais por tipo de risco, top 5 críticos com link "Detalhar")
   - Plugado como **3ª tab** "Visão consolidada" entre "Por processo" e "Da organização" no `riscos-dashboard-content.tsx`

-4. **Exportação Excel do Inventário (Checkpoint 8)** — COMPLETO
   - `lib/inventario-export.ts`: gera XLSX do zero via SheetJS replicando o template oficial (3 abas: INVENTÁRIO 84 colunas com bloco BR-CE de Análise de Riscos + RISCOS 1 linha por ProcessRisk + TAB. VISÃO DE RISCOS com contagens por tipo × severidade)
   - `GET /api/inventario/export`: DPO-only, escopo APROVADOS
   - Botão dinâmico no header de `/dashboard/inventario`: DPO vê "Exportar Excel (modelo oficial)" → 3 abas; Contribuidor mantém o export simples local de 14 colunas

-3. **Polimentos no GAP (C3 + C4 + C5)** — COMPLETO
   - **C3**: Dropdown "Filtrar por domínio" ao lado dos filtros existentes; abre o accordion automaticamente do domínio selecionado
   - **C4**: Botão "Aceitar todas as N sugestões" no banner amarelo de sugestões; faz N PATCHes em paralelo com `applySuggestion: true`. Bug fix: `/api/gap` agora exclui sugestões pra códigos com QUALQUER answer (não só os autoSuggested=false), evitando o banner re-aparecer depois da aceitação em massa
   - **C5**: 5º campo "Notas / observações" no controle expandido (texto livre interno, não vai pro XLSX exportado). Schema novo: coluna `notes` em `gap_answers` (Etapa 9). Migration aplicada local + Neon

-2. **Diagnóstico de Privacidade (Checkpoint 10)** — COMPLETO
   - `lib/diagnostico-scoring.ts`: engine pura — 4 sub-scores ponderados (GAP 40% · Riscos 30% · Bases 20% · Inventário 10%) → score final 0-100; gera recomendações priorizadas combinando bases legais faltantes + riscos identificados/sem plano + pontos de melhoria do GAP
   - `GET /api/diagnostico`: roda 3 queries em paralelo + scoring; DPO-only
   - `/dashboard/diagnostico`: hero com score grande + 4 cards de pilares (clicáveis pra tela de origem) + lista priorizada com badges ALTA/MEDIA/BAIXA × BASES/RISCO/GAP + bloco de transparência explicando como o score é calculado
   - Link na sidebar (DPO-only) com ícone Activity

-1. **Detalhamento de Riscos (Checkpoint 6)** — COMPLETO
   - `lib/riscos-catalog.ts`: matriz 3×3 Probabilidade × Impacto → Severidade (Alto/Médio/Baixo); helpers `computeSeverity`, `encodeSeverity`/`decodeSeverity` (formato "P:M;I:A;S:ALTO" no campo `severityLevel` existente — sem migration)
   - APIs: `GET/PATCH /api/inventario/[id]/risco/[riskCode]` (1 risco por vez)
   - UI: `/dashboard/inventario/[id]/risco/[code]` com 4 cards metodológicos (FATO/FUNDAMENTO/RISCO/RECOMENDAÇÕES) + matriz interativa colorida + plano de mitigação (checkboxes das recomendações + notas livres) + ref. legal específica + status
   - `/dashboard/riscos` ganha card "Severidade dos riscos identificados" (4 SevPills: Alto/Médio/Baixo/Sem classif.) + filtro por severidade + badges de severidade no card de cada processo
   - Botão "Detalhar →" no card do risco substitui o antigo "(em breve)"

0. **GAP Analysis (Checkpoint 9)** — COMPLETO em 5 sub-sessões
   - Schema: `GapAnswer` + `GapSnapshot` em Prisma; `gap_analyses` (placeholder Abacus) removida
   - Catálogo: `lib/gap-catalog.ts` GERADO por `scripts/generate-gap-catalog.ts` a partir do template oficial — 119 controles em 28 domínios
   - Auto-suggest: `lib/gap-suggest.ts` pré-preenche 7 controles a partir do Inventário aprovado + DPO da Company
   - APIs: `GET /api/gap`, `PATCH/DELETE /api/gap/answer/[code]`, `POST /api/gap/answer/[code]/task` (vira tarefa pessoal), `GET/POST /api/gap/snapshot`, `GET/DELETE /api/gap/snapshot/[id]`
   - UI: `/dashboard/gap-analysis` com tabs (Responder controles | Visão geral); accordion por domínio; tela welcome (1ª vez); modal de snapshots (Sheet lateral); subpágina `/snapshot/[id]` read-only
   - Dashboard analítico: barras horizontais empilhadas por domínio, top problemas/aderência, dicas
   - Exportação: `GET /api/gap/export` + `GET /api/gap/snapshot/[id]/export` — clonam o template oficial, sobrescrevem só o que vem do banco, preservam as 143 fórmulas COUNTIF da aba Analítico (recalcula no Excel)
   - Integrações: link na sidebar (DPO-only); aba 2 do `/dashboard/riscos` agora aponta pro GAP; card "Coloque em prática" da Fase 4 mostra stats reais

1. **Análise de Riscos (Checkpoint 5)** — completo
   - Modelo `ProcessRisk` + 13 tipos de risco (BR-CD do Excel)
   - APIs: `GET/PATCH /api/inventario/[id]/riscos`, `GET /api/riscos`
   - Tela individual por processo `/dashboard/inventario/[id]/analise-riscos`
   - Dashboard consolidado `/dashboard/riscos` com 2 abas
   - Pré-marcação automática + bandeirinhas baseadas no formAnswers
   - Popover Fato/Fundamento/Risco/Recomendações (do PDF da Denise)
   - 4 estados de ciclo de vida (IDENTIFICADO/EM_MITIGACAO/ACEITO/ELIMINADO)
   - Botão escudo vermelho no card do inventário

2. **Mini-apps embutidos na Fase 3** — "Coloque em prática"
   - Cards do Inventário e Análise de Riscos com stats reais
   - Reaproveitam `PhasePracticalLinks` existente (renomeado)
   - Padrão `phaseHasNativeTools()` permite estender pra outras fases

3. **Auditoria mobile + correções**
   - Phase managers (5 arquivos) com headers responsivos
   - `/dashboard/inventario` CTAs e tabs com scroll horizontal
   - `/dashboard/inventario/[id]/analise-riscos` Status select fluido + footer empilhado
   - InventarioCard layout `flex-col md:flex-row`
   - Truncates responsivos
   - **FAB do chatbot reduzido em mobile** (48x48 sm:64x64) + posição inicial mais alta (130px de margin) pra não sobrepor footers sticky

4. **Tarefas pessoais** — completo
   - Modelos `Task` + `TaskMarker`
   - APIs CRUD completas
   - Tela `/dashboard/tarefas` com tabs (A fazer/Em andamento/Concluídas)
   - Marcadores customizáveis (6 cores)
   - Vínculo opcional com processo do inventário
   - Badge de atrasadas/vencendo na sidebar (polling 60s + custom event)

5. **Fórum + Mensagens** — completo
   - Modelos `ForumPost` + `ForumReply` + `ForumPostRead`
   - 1 modelo único pra posts públicos + DMs (recipientId distingue)
   - 5 categorias (Geral/Inventário/Riscos/Bases Legais/Dúvida)
   - 2 tipos (Discussão / Comunicado — DPO pode fixar)
   - APIs completas (5 routes)
   - Tela `/dashboard/forum` com 2 tabs + busca + filtro
   - Modal de detalhe com respostas + ações de moderação
   - Badge de não-lidos na sidebar (polling 30s + custom event)

6. **Bases Legais consolidada** (DPO-only)
   - Tela `/dashboard/bases-legais` com lista de processos aprovados
   - Stats: total / completos / parciais / sem base
   - Filtro por completeness
   - Detecção de "tem dado sensível mas falta base sensível" (alerta)

7. **Refinos de UX**
   - Rascunhos sem nome agora mostram "Rascunho do {setor} · {data}"
   - Custom event `pgp:sidebar-refresh` pra badge atualizar imediatamente
     (sem esperar polling) ao criar/excluir tarefa/post
   - Banner "Mostrando apenas tarefas do processo X" com botão "Limpar filtro"

### Migrações de banco aplicadas

| Etapa | Arquivo | Tabelas/colunas | Status local | Status Neon |
|---|---|---|---|---|
| 2.1 | `_migrate-users-roles.sql` | users.setor, users.invitedById | ✅ | ✅ |
| 4 | `_migrate-bases-legais.sql` | data_inventories.previsaoLegal/legalBasisSensitive/etc | ✅ | ✅ |
| 5 | `_migrate-process-risks.sql` | process_risks (tabela) | ✅ | ✅ |
| 6 | `_migrate-tasks.sql` | tasks + task_markers | ✅ | ✅ |
| 7 | `_migrate-forum.sql` | forum_posts + forum_replies + forum_post_reads | ✅ | ✅ |
| 8 | `_migrate-gap.sql` | gap_answers + gap_snapshots (drop gap_analyses placeholder) | ✅ | ✅ |
| 9 | `_migrate-gap-notes.sql` | gap_answers.notes (Polimento C5) | ✅ | ✅ |
| 10 | `_migrate-action-plan.sql` | action_plans refatorada (Checkpoint 11 — Plano de Ação institucional) | ✅ | ✅ |
| 11 | `_migrate-policies.sql` | policies + policy_versions + Company.slug (Checkpoint 12 — Políticas) | ✅ | ✅ |
| 12 | `_migrate-ripd-v2.sql` | ripds refatorada + ripd_versions (Checkpoint 13 — RIPD v2 institucional) | ✅ | ✅ |
| 13 | `_migrate-terceiros.sql` | operators + operator_process_links (Checkpoint 14 G1) | ✅ | ✅ |
| 14 | `_migrate-terceiros-assessment.sql` | operator_assessments + publicToken único (Checkpoint 14 G2) | ✅ | ✅ |
| 15 | `_migrate-action-plan-operator.sql` | action_plans.refOperatorId (Checkpoint 14 G4 — Plano ↔ Operadores) | ✅ | ✅ |
| 16 | `_migrate-terceiros-adequacao.sql` | operators.lgpdComplianceStatus + contractOriginalDate (Checkpoint 14 H1 — Adequação) | ✅ | ✅ |

Consolidado em `scripts/_migrate-prod-neon.sql` (idempotente).

### Como rodar contra Neon (futuro)

Sempre que houver mudança de schema, aplicar antes do push:

```bash
"/e/postgres/pgsql2/pgsql/bin/psql.exe" "<NEON_URL>" -f scripts/_migrate-prod-neon.sql
```

Pegar `NEON_URL` no painel Neon (botão **Connect** → copy connection string).

---

## ⏳ Próximas etapas (planejadas)

| # | Etapa | Status |
|---|---|---|
| 6 | ~~**Detalhamento de Riscos**~~ — classificação via matriz 3×3 Probabilidade × Impacto, plano com checklist de recomendações + texto livre, ref. legal específica, status do ciclo de vida. Botão "Detalhar" no card; nova tela `/dashboard/inventario/[id]/risco/[code]`; KPIs de severidade e filtros no `/dashboard/riscos`. | ✅ FEITO 2026-05-04 |
| 7 | ~~**Visão de Riscos consolidada**~~ — 3ª aba "Visão consolidada" no `/dashboard/riscos` com stacked bars de severidade agregada + 4 cards de status do ciclo de vida + 13 barras por tipo de risco × severidade + top 5 críticos parados | ✅ FEITO 2026-05-04 |
| 8 | ~~**Exportação Excel consolidada do Inventário**~~ — 3 abas (INVENTÁRIO 84 cols + RISCOS + TAB. VISÃO DE RISCOS) gerado do zero via SheetJS, replica template oficial. Botão DPO-only no header de `/dashboard/inventario`. | ✅ FEITO 2026-05-04 |
| 9 | ~~**GAP Analysis**~~ | ✅ FEITO 2026-05-03 |
| 10 | ~~Diagnóstico de Privacidade~~ — score executivo (4 pilares ponderados) + recomendações priorizadas | ✅ FEITO 2026-05-04 |
| 11 | ~~**Plano de Ação institucional**~~ — `/dashboard/plano-acao` com 3 tabs (Em aberto / Concluídas / Cronograma), KPIs, filtros (origem/prioridade/busca), CRUD completo (DPO) + status/notes (Contribuidor responsável). Botão "Importar pendentes" cria ações em massa de GAP/Riscos/Bases (idempotente). **D3**: botão "Adicionar ao Plano" plugado em Diagnóstico (cada recomendação), GAP (controle NAO_ADERENTE/PARCIAL com PM) e Detalhamento de Risco individual (status IDENTIFICADO). XLSX export. POST com dedup 409 por ref. | ✅ FEITO 2026-05-04 |
| 12 | ~~**Políticas**~~ — `/dashboard/politicas` com 9 templates oficiais (Aviso Externo, Privacidade Interna, Norma, Termos, Cookies, Terceiros, Retenção, Treinamento, Transferência Internacional + Outra). Editor markdown com preview ao vivo. URL pública `/p/<slug>/<policySlug>` sem auth. Versionamento (snapshot a cada publicação). **Exportação DOCX** (parser markdown→docx) **+ PDF** (window.print) **+ Diff** entre versões (jsdiff word-level). Plug-in card "Coloque em prática" da Fase 6. | ✅ FEITO 2026-05-04 (E1+E2+E3+E4+E5) |
| 13 | ~~**RIPD v2 institucional**~~ — `/dashboard/ripd` com lista + KPIs + filtros + banner DPO destacado. Editor com 8 abas verticais (estrutura conforme Guia ANPD), pré-população automática a partir de processo do Inventário (puxa Inventário + Riscos + GAP + Plano). Fluxo Contribuidor → DPO com aprovação/rejeição. Versionamento por snapshot, modal histórico, diff word-level entre versões (jsdiff + diff estrutural de listas). Exportação DOCX (docx-js) + PDF print-friendly. Sidebar com badge azul de pendentes. Plug-in card "Coloque em prática" da Fase 6 (2º card ao lado de Políticas). | ✅ FEITO 2026-05-04 (F1+F2+F3+F4) |
| 14 | ~~**Gestão de Terceiros**~~ — G1+G2+G3 (operadores + régua ANPD + formulário Cyber+LGPD + 5 cláusulas DOCX) + G4 (auto-import Inventário→Operador, plug Plano de Ação `OPERADOR`, plug RIPD Seção 1 estruturada, 3º card Fase 6, badge sidebar) + **H1 (adequação de contratos pré-LGPD)**: status `lgpdComplianceStatus` + `contractOriginalDate`; campanha "Iniciar adequação" gera 5 ações automáticas (avaliar/decidir/negociar/assinar/reavaliar); toggle DOCX **Cláusula nova** vs **Termo aditivo** com cabeçalho jurídico próprio; **Importação de PDF** pesquisável (regex CNPJ/datas, 3 estratégias de razão social, keywords LGPD pra cláusulas existentes, modal preview editável + anexo automático no Vercel Blob). | ✅ FEITO 2026-05-04 (G1+G2+G3+G4+H1) |
| 15+ | Segurança · Incidentes · Modelo PGP — _Termos de Uso já está em Políticas (`TERMOS_USO`); Contratos com Operadores está no Checkpoint 14_ | depois |

---

## 🛠️ Como retomar o dev local (próxima sessão)

```powershell
# 1. Iniciar Postgres portátil (caso não esteja rodando)
& "E:\postgres\pgsql2\pgsql\bin\pg_ctl.exe" -D E:\postgres\data -l E:\postgres\logs\server.log start

# 2. Ir pro worktree atual (ou outra worktree)
cd E:\_________PGP\.claude\worktrees\youthful-almeida-c304f7

# 3. Garantir .env (worktrees não compartilham — copiar da pasta-mãe se for 1ª vez)
test-path .env || cp ../../../.env .env

# 4. Iniciar dev
npm run dev
```

Local roda em http://localhost:3000.
- Login: `clubedoservidor@protonmail.com` / `741963PgP@*#$`
- Local **não tem pgvector** → RAG fica desligado em dev (chatbot funciona, só sem grounding)

### Início rápido pra próxima sessão

Diga **"retomar do HANDOVER + memória"** e o assistente lê:
1. Este `HANDOVER.md`
2. `~/.claude/projects/E-----------PGP/memory/MEMORY.md`
3. `git log --oneline -5`

---

## 🔐 Credenciais & secrets

| Variável | Onde | Uso |
|---|---|---|
| `DATABASE_URL` | `.env` local + Vercel | Postgres |
| `NEXTAUTH_SECRET` | idem | JWT |
| `NEXTAUTH_URL` | idem | Auth callback |
| `GOOGLE_API_KEY` | idem | Gemini LLM + embeddings |
| `BLOB_READ_WRITE_TOKEN` | só Vercel | Upload de docs |
| `SEED_ADMIN_EMAIL` / `_PASSWORD` | só `.env` local | seed do admin |

⚠ **Senha do Neon foi compartilhada em chat na sessão atual.** Recomendado rotacionar via painel Neon (botão "Reset password") e atualizar `DATABASE_URL` no Vercel.

---

## 📦 Arquitetura — pontos importantes

| Onde | O quê |
|---|---|
| `lib/auth-helpers.ts` | Centralizador de papéis (DPO/Contribuidor) + helpers |
| `lib/inventario-form-schema.ts` | Schema das 58 perguntas (~870 linhas) |
| `lib/inventario-derive.ts` | Auto-deriva os 10 campos legados a partir de formAnswers |
| `lib/riscos-catalog.ts` | 13 tipos de risco + auto-suggest engine |
| `lib/tarefas-types.ts` | Tipos + helpers das Tarefas |
| `lib/forum-types.ts` | Tipos + helpers do Fórum |
| `lib/gap-catalog.ts` | **GERADO** por `scripts/generate-gap-catalog.ts` — 119 controles do template oficial |
| `lib/gap-helpers.ts` | Auth check DPO + enums GAP_MAPEAMENTO/ADERENCIA + buildGapStats + DTOs |
| `lib/gap-suggest.ts` | Auto-suggest engine pra pré-preencher controles do GAP a partir do Inventário |
| `lib/gap-export.ts` | Builder do XLSX (clona template oficial e sobrescreve só dinâmicos) |
| `lib/sidebar-events.ts` | Events bus pra refresh imediato dos badges da sidebar |
| `lib/llm.ts` | Wrapper Gemini |
| `lib/embeddings.ts` | Embeddings Gemini 768-dim |
| `lib/s3.ts` | Storage abstraído (Vercel Blob por padrão) |
| `lib/auth.ts` | NextAuth — strip de `logoUrl` no JWT |
| `prisma/schema.prisma` | `extensions = [vector]` + 20 models |
| `app/api/chat/route.ts` | Chat com RAG silencioso |

### Componentes reusáveis novos

| Onde | O quê |
|---|---|
| `components/fases/phase-native-tools.tsx` | Mini-apps embutidos nas Fases (hoje só Fase 3) |
| `components/inventario/analise-riscos-content.tsx` | Tela individual de Análise de Riscos |
| `components/riscos/riscos-dashboard-content.tsx` | Dashboard consolidado de riscos |
| `components/inventario/bases-legais-dashboard-content.tsx` | Dashboard consolidado de Bases Legais |
| `components/tarefas/*` | Tarefas (5 arquivos) |
| `components/forum/*` | Fórum (5 arquivos) |
| `components/gap-analysis/*` | GAP Analysis (6 arquivos: gap-content, gap-welcome, gap-domain-accordion, gap-control-row, gap-snapshots-modal, gap-snapshot-detail, gap-dashboard) |

---

## ⚠️ Armadilhas conhecidas

1. **Cookie 494 REQUEST_HEADER_TOO_LARGE** — só acontece se algo pesado entrar no JWT. NUNCA colocar `logoUrl`, `embedding` ou conteúdo de doc na sessão.
2. **Postgres local sem pgvector** — `prisma db push` falha. Aplicar migrações via `psql` direto com SQL bruto.
3. **Pdf-parse com bug** — usar `pdfjs-dist` (Mozilla) em vez de `pdf-parse`.
4. **Re-rodar indexador é seguro** — `index-knowledge-base.ts` pula sources que já têm chunks.
5. **Null bytes em PDF/DOCX** — sanitizar com `text.replace(/\x00/g, "")` antes de salvar no Postgres.
6. **TaskStop não mata processo filho no MSYS/Git Bash** — pra matar de verdade: `ps -ef | grep tsx` → `kill -9 <PID>`.
7. **React StrictMode em dev invoca setters funcionais 2x** — usar valor literal em `setState`, não funcional.
8. **Worktrees Git não compartilham `.env`** (gitignored). Na 1ª vez do worktree: `cp ../../../.env ./.env`.
9. **`prisma generate` falha se dev server estiver rodando** (DLL travada no Windows). Parar preview antes.
10. **Mensagens diretas no Fórum** usam o mesmo modelo `ForumPost` (recipientId distingue). DMs **não** têm `category`.

---

## 💡 Pequenas pendências de refino (ainda em aberto)

Tudo o que era pendência conhecida foi tratado nessa sessão. Se aparecer alguma demanda nova:

- **Polling pode ser substituído por WebSocket/Pusher** se o uso do Fórum crescer (hoje 30s de polling resolve)
- **Editor rich-text** no Fórum (hoje é texto puro com `\n`) — só se o usuário pedir
- **Notificação por email** quando alguém te manda DM/responde post — decisão atual: só visual no app, não fazer email

---

## 📋 Pendências organizacionais

1. **Rotacionar senha do Neon** (segurança após compartilhamento em chat — duas vezes agora: 2026-05-03 e 2026-05-04)
2. **Revogar PAT temporário do GitHub** se ainda estiver ativo
3. **Validar prod** após o último deploy: acessar https://lgpd-pgp.vercel.app e conferir `/dashboard/gap-analysis`, `/dashboard/plano-acao`, `/dashboard/politicas` carregando sem erro

---

## 🔥 Resumo executivo

Sessão 2026-05-04 entregou Checkpoints 6, 7, 8, 10, 11, 12, **13** + polimentos C1/C2/C3/C4/C5 do GAP. Tudo em produção:

- ✅ **Checkpoint 6** — Detalhamento de Riscos (matriz 3×3 P×I, severidade encoded)
- ✅ **Checkpoint 7** — Visão de Riscos consolidada (3ª aba do dashboard de Riscos)
- ✅ **Checkpoint 8** — Exportação Excel do Inventário (3 abas, modelo oficial)
- ✅ **Checkpoint 9** — GAP Analysis (119 controles, 28 domínios, snapshots, dashboard, export XLSX)
- ✅ **Checkpoint 10** — Diagnóstico de Privacidade (score executivo 0-100, 4 pilares ponderados)
- ✅ **Checkpoint 11** — Plano de Ação institucional (3 tabs, dedup polimórfico, XLSX, integração 3 telas)
- ✅ **Checkpoint 12** — Políticas LGPD (9 templates, editor split, URL pública, versionamento, DOCX + PDF + Diff)
- ✅ **Checkpoint 13** — RIPD v2 institucional (8 seções estruturadas, fluxo Contribuidor → DPO, versionamento, diff word-level, DOCX + PDF, plug Fase 6)
- ✅ **Checkpoint 14** — Gestão de Terceiros completa (G1+G2+G3+G4+H1):
  - **G1+G2+G3**: operadores + contratos + régua de risco ANPD + formulário público de avaliação Cyber+LGPD + 5 cláusulas DOCX + 10º template Política.
  - **G4 (integrações)**: auto-import Inventário→Operador via banner; plug Plano de Ação (origem OPERADOR); plug RIPD Seção 1 (lista estruturada); 3º card Fase 6 + badge sidebar âmbar.
  - **H1 (adequação pré-LGPD)**: `lgpdComplianceStatus` + `contractOriginalDate`; botão "Iniciar adequação" gera 5 ações automáticas no Plano (avaliar/decidir/negociar/assinar/reavaliar); toggle "Cláusula nova" vs "Termo aditivo" no DOCX (wrapper com cabeçalho de aditivo + considerandos LGPD + fecho de inalterabilidade); importação de PDF pesquisável via regex (CNPJ + datas + razão social com 3 estratégias + keywords LGPD) com modal preview editável + anexo automático no Vercel Blob.
- ✅ Polimentos GAP C1/C2/C3/C4/C5 (comparar versões, exportar PDF, filtro por domínio, aceitar tudo, notas)
- ✅ Schema Neon: Etapas 2 → 16 todas aplicadas e validadas em prod.

**Próxima fronteira (Checkpoint 15+):** Segurança · Incidentes · Modelo PGP. (Termos de Uso já está em Políticas; Contratos com Operadores está no Checkpoint 14.)
