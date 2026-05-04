# Handover — PGP (LGPD)

> **Última sessão:** 2026-05-03 (Checkpoint 9 — GAP Analysis completo) · **Branch atual:** `claude/heuristic-grothendieck-ec0317` (worktree)
>
> **Migração Neon:** ✅ aplicada até a Etapa 7. Etapa 8 (GAP) **falta aplicar** no Neon antes do push.
> **Push pra `main`:** depois de aplicar Etapa 8 no Neon — comando no fim deste arquivo.

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

## 🆕 O que foi feito na sessão 2026-05-03 (não-pushado)

### Features novas

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
| 7 | **Visão de Riscos consolidada** (dashboard com gráficos) | depois |
| 8 | ~~**Exportação Excel consolidada do Inventário**~~ — 3 abas (INVENTÁRIO 84 cols + RISCOS + TAB. VISÃO DE RISCOS) gerado do zero via SheetJS, replica template oficial. Botão DPO-only no header de `/dashboard/inventario`. | ✅ FEITO 2026-05-04 |
| 9 | ~~**GAP Analysis**~~ | ✅ FEITO 2026-05-03 |
| 10 | ~~Diagnóstico de Privacidade~~ — score executivo (4 pilares ponderados) + recomendações priorizadas | ✅ FEITO 2026-05-04 |
| 11+ | Plano de Ação · Políticas · Termos · Segurança · Contratos · Incidentes · RIPD · Modelo PGP | depois |

---

## 🛠️ Como retomar o dev local (próxima sessão)

```powershell
# 1. Iniciar Postgres portátil (caso não esteja rodando)
& "E:\postgres\pgsql2\pgsql\bin\pg_ctl.exe" -D E:\postgres\data -l E:\postgres\logs\server.log start

# 2. Ir pro worktree atual
cd E:\_________PGP\.claude\worktrees\great-rhodes-8a9681

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

1. **Aplicar Etapa 8 (GAP) no Neon** ANTES do push pra `main`:
   ```bash
   "/e/postgres/pgsql2/pgsql/bin/psql.exe" "<NEON_URL>" -f scripts/_migrate-prod-neon.sql
   ```
   (O consolidado já inclui as Etapas 1-8 e é idempotente — rodar de novo não dói.)
2. **Commitar e fazer push da sessão 2026-05-03** — Checkpoint 9 completo + features anteriores
3. **Rotacionar senha do Neon** (segurança após compartilhamento em chat)
4. **Revogar PAT temporário do GitHub** se ainda estiver ativo

---

## 🔥 Resumo executivo

Sessão gigante, várias features entregues:
- ✅ **GAP Analysis (Checkpoint 9)** completo — schema + APIs + UI com tabs/dashboard + exportação Excel oficial + integração Fase 4 + sidebar
- ✅ Análise de Riscos completa (Checkpoint 5)
- ✅ Tarefas pessoais (caderno individual)
- ✅ Fórum e Mensagens (comunicação na org)
- ✅ Bases Legais consolidada (visão DPO)
- ✅ Mini-apps embutidos na Fase 3 + Fase 4
- ✅ Auditoria mobile completa
- ✅ Migração Neon aplicada (Etapas 1-7) + ⚠ Etapa 8 (GAP) FALTA aplicar

**Antes de fazer push pra `main`:** rodar `_migrate-prod-neon.sql` no Neon (idempotente).
