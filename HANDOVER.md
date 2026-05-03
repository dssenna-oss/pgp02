# Handover — PGP (LGPD)

> **Última sessão:** 2026-05-03 (longa, várias features) · **Branch atual:** `claude/great-rhodes-8a9681` (worktree)
>
> **Migração Neon:** ✅ aplicada (todas as 11 tabelas/colunas novas existem em prod).
> **Push pra `main`:** liberado — pode commitar e fazer push sem medo.

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
| 6 | **Detalhamento de Riscos** — classificação Alto/Médio/Baixo + plano de mitigação por risco. Schema já tem campos vazios (`severityLevel`, `mitigationPlan`, `legalBasisRef`). Badge "Detalhar (em breve)" já está na UI esperando. | próximo |
| 7 | **Visão de Riscos consolidada** (dashboard com gráficos) | depois |
| 8 | **Exportação Excel consolidada** (3 abas igual modelo) | depois |
| 9 | **GAP Analysis** (riscos macro da organização) — preenche a 2ª aba do `/dashboard/riscos` que hoje é placeholder | depois |
| 10 | Diagnóstico de Privacidade (consolidador) | depois |
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

1. **Commitar e fazer push da sessão 2026-05-03** — várias features novas pra subir
2. **Rotacionar senha do Neon** (segurança após compartilhamento em chat)
3. **Revogar PAT temporário do GitHub** se ainda estiver ativo

---

## 🔥 Resumo executivo

Sessão grande, várias features entregues:
- ✅ Análise de Riscos completa (Checkpoint 5)
- ✅ Tarefas pessoais (caderno individual)
- ✅ Fórum e Mensagens (comunicação na org)
- ✅ Bases Legais consolidada (visão DPO)
- ✅ Mini-apps embutidos na Fase 3
- ✅ Auditoria mobile completa
- ✅ Migração Neon aplicada

Pronto pra push em `main`.
