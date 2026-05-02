# Handover — PGP (LGPD)

> **Última sessão:** 2026-05-02 (continuação) · **Branch:** `claude/nice-mclean-d12b88` (worktree).

App em **produção:** https://lgpd-pgp.vercel.app
Repo: https://github.com/dssenna-oss/pgp02 (público)

---

## ✅ Funcionando

- Frontend Next.js + Postgres (Neon) + auto-deploy via push em `main`
- Login: `clubedoservidor@protonmail.com` / `741963PgP@*#$`
- Conteúdos didáticos, e-books de fase, documentos de fase (71 arquivos em `public/phase-documents/`, ~85 MB) + 20 arquivos no Vercel Blob (fase-6/7)
- Logo da empresa via base64 no DB (sem S3)
- Uploads de novos documentos via Vercel Blob (público)
- Vídeos de capa: YouTube embed (não há binários no repo)
- Chatbot **independente da Abacus** rodando Gemini 2.5 Flash (`@google/genai`)
- **Gemini API em paid tier** (billing linkado a "conta de teste do Cloud" — sem cartão, mas com créditos trial)
- **RAG com pgvector no Neon: 2.642 chunks** indexados em **86 sources** — **100% dos `phase_documents` cobertos** (todas as fases: preliminar, fase-1 a fase-7, entendendo-pgp, global)
- **Indexador suporta Vercel Blob**: arquivos com `cloud_storage_path` HTTPS são baixados via fetch

---

## ⏳ Pendências

### 1. Revogar Personal Access Token do GitHub
PAT `pgp-push-temp` foi usado durante a sessão anterior pra pushes. **Revogar** em:
https://github.com/settings/tokens

### 2. Reativar logo (opcional)
Logo da empresa foi limpado no Neon como medida defensiva. Pra subir de novo:
- Settings → Logo da Empresa → Upload (qualquer imagem ≤ 2 MB)

<!-- (Pendência de docs não indexáveis foi resolvida em 2026-05-02:
     usuário converteu os 3 .doc → .pdf e rodou OCR no PDF da Cartilha
     LGPD. Indexação 100% completa, todos 86 sources contíguos.) -->

---

## 🛠️ Como retomar o dev local (próxima sessão)

```powershell
# 1. Iniciar Postgres portátil (caso não esteja rodando)
& "E:\postgres\pgsql2\pgsql\bin\pg_ctl.exe" -D E:\postgres\data -l E:\postgres\logs\server.log start

# 2. Iniciar dev server
cd E:\_________PGP
npm run dev
```

Local roda em http://localhost:3000 — login mesmas credenciais.

> Local **não tem pgvector**, então o RAG fica desligado em dev (chatbot funciona, só sem grounding nos PDFs). Em produção tudo está completo.

---

## 🔐 Credenciais & secrets em uso

Arquivos `.env` (gitignored, **não vão pro repo**):

| Variável | Onde está | Uso |
|---|---|---|
| `DATABASE_URL` | `.env` (local) e Vercel | Postgres |
| `NEXTAUTH_SECRET` | idem | JWT |
| `NEXTAUTH_URL` | idem | Auth callback |
| `GOOGLE_API_KEY` | idem | Gemini LLM + embeddings |
| `BLOB_READ_WRITE_TOKEN` | só Vercel (auto-injetado) | Upload de docs |
| `SEED_ADMIN_EMAIL` / `_PASSWORD` | só `.env` local | seed do admin |

Não há AWS/S3 configurado — `lib/s3.ts` agora usa Vercel Blob por padrão. Código S3 legado fica de fallback se um dia precisar.

---

## 📦 Arquitetura — pontos importantes

| Onde | O quê |
|---|---|
| `lib/llm.ts` | Wrapper Gemini (streaming + non-streaming). Trocar de provedor é mexer só aqui. |
| `lib/embeddings.ts` | Embeddings Gemini 768-dim + helpers pra pgvector |
| `lib/s3.ts` | Storage abstraído. `getFileUrl` aceita URL HTTPS, path `/...` ou chave S3 legada. |
| `lib/auth.ts` | NextAuth. Strip de `logoUrl` no JWT (cuidado: não voltar a colocar — incha cookie). |
| `app/api/chat/route.ts` | Chat com retrieval RAG silencioso (degrada em dev sem pgvector) |
| `prisma/schema.prisma` | `extensions = [vector]` + model `DocumentChunk` |
| `scripts/index-knowledge-base.ts` | Indexador idempotente PDF/DOCX/XLSX → chunks vetorizados (suporta arquivo local + URL Vercel Blob) |
| `scripts/find-partial-sources.ts` | Diagnóstico: lista sources com gap no chunkIndex (cobertura quebrada) e docs do `phase_documents` sem chunks |
| `scripts/clean-partial-sources.ts` | Apaga chunks de sources parciais (recovery após indexação corrompida) |
| `scripts/rag-stats.ts` | Stats rápidas do RAG (total / com embedding / por fase) |
| `scripts/import-abacus-export.ts` | Importador one-off do JSON da Abacus (não rodar de novo) |
| `scripts/update-admin.ts` | Renomear admin / rotacionar senha (env vars) |
| `public/phase-documents/` | 71 arquivos importados da Abacus (commitados) |
| `public/forms/mapa-processos.html` | Form HTML standalone derivado do XLSX da Fase 3 |

---

## ⚠️ Armadilhas conhecidas

1. **Cookie 494 REQUEST_HEADER_TOO_LARGE** — só acontece se algo pesado entrar no JWT. NUNCA colocar `logoUrl`, `embedding` ou conteúdo de doc na sessão.
2. **Postgres local sem pgvector** — `prisma db push` falha ao tentar criar `document_chunks` localmente. Push só pra Neon.
3. **PAT do GitHub** — credenciais cacheadas no Windows são de outra conta (`automatizeaihoje-ui`). Pra pushar precisa de PAT explícito ou rodar do PowerShell com Credential Manager.
4. **Pdf-parse** — o pacote npm `pdf-parse` tem bug de side-effect no entry point. **Não usar.** Usamos `pdfjs-dist` (Mozilla) em `scripts/index-knowledge-base.ts`.
5. **Re-rodar indexador é seguro** — `index-knowledge-base.ts` agora pula sources que já têm chunks (verificação explícita por `count > 0`). Pra reindexar um documento do zero, deletar manualmente seus chunks: `DELETE FROM document_chunks WHERE source = '...'`.
6. **Null bytes em PDF/DOCX** — extratores às vezes injetam `\x00` no texto, e Postgres rejeita em colunas TEXT. O indexador sanitiza com `text.replace(/\x00/g, "")`. Se algum extractor novo for adicionado, lembrar de aplicar a mesma limpeza.
7. **TaskStop não mata processo filho no MSYS/Git Bash (Windows)** — ao parar um background bash via TaskStop, o `node` filho continua rodando. Pra matar de verdade: `ps -ef | grep tsx` → `kill -9 <PID>`.

---

## 💡 Próximos passos sugeridos (escolha do user)

- Configurar AWS S3 ou aumentar Vercel Blob (caso queira mais espaço pra uploads)

---

## 🚧 Feature em andamento — Mini-apps de governança LGPD

Início da implementação em 2026-05-02. **Mini-app #2 (Inventário/form base) 100% concluído.** Próximo: #3 Análise de Riscos.

### Decisões de design já tomadas

1. **Rename "Empresa" → "Organização"** — só UI labels (signup `app/signup/page.tsx:149`, dashboard, etc.). **NÃO** renomear o modelo Prisma `Company` (é refator separado, pesado e arriscado).
2. **Storage do form base no `DataInventory`** — adicionar coluna `formAnswers Json?` ao modelo. Os 10 campos String existentes continuam como "resumo" derivado do JSON. Migration mínima.
3. **Granularidade**: 1 registro `DataInventory` = 1 processo de tratamento (cada respondente preenche o form várias vezes, uma por processo).
4. **Identificação do respondente**: pré-preencher Nome + Email com dados do user logado (NextAuth session); user só preenche Cargo + Departamento.
5. **Onboarding**: textos introdutórios do form (Instruções / Atenção / Glossário LGPD) viram a 1ª tela do wizard.

### Form base — fonte de verdade

Google Form: https://docs.google.com/forms/d/e/1FAIpQLSfvASokeVLEBQH1bmsQxterGmiYsmmIWyFDPA3niojVBs8gwA/viewform

Estrutura parseada (12 seções, ~69 itens, ~50 perguntas reais):
- **Sec 1**: Identificação do Respondente (4 campos)
- **Sec 2**: Processos sob responsabilidade (3 campos)
- **Sec 3**: Tipificação dos Dados (17 grupos checkbox — Nomes, Características, Filiação, Identificação Oficial, Residencial, Escolaridade, Profissional, Financeira, Jurídica, Crianças, Adolescentes, Preferências, Dispositivos Móveis, Saúde, Sensíveis Art.5º LGPD)
- **Sec 4**: Uso dos Dados (9 campos — finalidade, decisão automatizada, marketing)
- **Sec 5**: Coleta (5 campos — origem, política, consentimento, antecedentes)
- **Sec 6**: Transferência e Compartilhamento (9 campos — internos, terceiros, gov, internacional)
- **Sec 7**: Armazenamento, Retenção, Descarte (12 campos — formato, segurança física, retenção, backup)

### Ordem de implementação dos 13 mini-apps

| # | Mini-app | Output | Notas |
|---|---|---|---|
| 1 | Rename UI "Empresa" → "Organização" | UI | trivial, desbloqueia |
| 2 | **Form Base = Inventário de Dados** (wizard 12 telas) | Excel | coração — alimenta todos abaixo |
| 3 | Análise de Riscos | Excel | deriva do Inventário |
| 4 | GAP Analysis | Excel | |
| 5 | Diagnóstico de Privacidade (consolida 1-4) | Word | nova seção, conteúdo do user |
| 6 | Plano de Ação | Excel | deriva do GAP |
| 7 | Política de Privacidade interna + Aviso externo | Word | par |
| 8 | Termos de Uso + Aviso de Cookies | Word | |
| 9 | Política de Segurança da Informação | Word | usa Sec 7 do form |
| 10 | Adequação de Contratos | Word | usa Sec 6 |
| 11 | Plano de Incidentes (código Abacus) | Word | user vai importar |
| 12 | RIPD (código Abacus) | Word | user vai importar |
| 13 | Modelo PGP (Entendendo PGP) | Word | descritivo |

### Libs faltantes pra geração

- `docx` (gerar Word)
- `pdf-lib` ou `puppeteer` (gerar PDF, se necessário)
- `exceljs` (gerar Excel formatado — `xlsx` já está instalado mas o atual basta pra exportação simples)

### Hardening pendente (cookie 494)

User reportou 494 REQUEST_HEADER_TOO_LARGE no celular Android Chrome (regular). Causa: cookie de sessão antigo, criado antes do strip de `logoUrl`. Fix imediato: limpar dados do site no browser. Hardening: stripar `company` inteira do JWT, manter só `id`/`role`/`companyId`, fetch via novo `GET /api/company/me`. Não urgente — só preventivo. Estimar 1 sessão.

---

## 🛠️ Estado atual da implementação do Inventário (form base)

### ✅ Mini-app #2 (Inventário) — TODOS os 7 checkpoints concluídos

| # | Checkpoint | Arquivos chave |
|---|---|---|
| Pré | Rename "Empresa" → "Organização" no signup | `app/signup/page.tsx` (label + placeholder) |
| 1 | Migration: `formAnswers Json?` + `isDraft Boolean` em `DataInventory` | `prisma/schema.prisma` (push em Neon e em local via SQL bruto pois pgvector indisponível local) |
| 2 | Schema do form 100% literal ao Google Form (auditor: 0 divergências) | `lib/inventario-form-schema.ts` (~870 linhas) — 58 perguntas em 7 seções + onboarding |
| 3 | Wizard skeleton: navegação, drafts, onboarding com ícones | `app/dashboard/inventario/novo/page.tsx`, `components/inventario/inventario-wizard.tsx` |
| 4 | `<FormFieldRenderer>` (4 tipos) + `<SectionStep>` + integração Sec 1 (autoFill, validação required, dependsOn) | `components/inventario/form-field-renderer.tsx`, `components/inventario/section-step.tsx` |
| 5 | Sec 2 + Sec 3 com **accordion** (`collapseFields`) — cada grupo colapsável + ícone status | (mesmos arquivos) |
| 6 | Sec 4-7 (renderer universal cobre tudo); dependsOn condicional validado | (mesmos arquivos) |
| 7 | Auto-derive 10 campos legados + tela de Revisão visualmente rica + integração com lista + remoção do form simples + rota `/[id]/editar` (hidrata draft) | `lib/inventario-derive.ts`, `components/inventario/inventario-content.tsx`, `app/dashboard/inventario/[id]/editar/page.tsx`, **deletado** `inventario-form-modal.tsx` |

### ✅ Tela de Revisão e Conclusão (10 melhorias visuais aplicadas)

1. Ícones temáticos por seção (User/FileText/Database/Activity/Inbox/Share2/Server)
2. Negrito nas perguntas com ícone HelpCircle (azul) ou AlertTriangle (amarelo se atenção)
3. Multi-choice como chips/badges
4. Badge de completude por seção (verde "Completo" / âmbar "X de Y")
5. Card-resumo no topo com stats agregados
6. Sticky CTA no rodapé (Imprimir / Salvar / Concluir)
7. Divisores visuais entre seções (border-l-4 colorido)
8. **Botão Imprimir → PDF completo** com TODAS as 58 perguntas (mesmo as não respondidas), visual idêntico à Revisão (ver `components/inventario/printable-inventory.tsx`)
9. TOC lateral sticky com clique-pra-rolar
10. Highlight amarelo em respostas críticas (transferência internacional, dados sensíveis, decisão automatizada, marketing, papéis externos)

### 🐞 Bugs/notas encontrados durante implementação (importante pros próximos mini-apps)

1. **React StrictMode em dev invoca setters funcionais 2x** — `setStepIndex(i => i + 1)` causa pulo duplo. Use **valor literal**: `setStepIndex(stepIndex + 1)`. Padrão pra todos os próximos componentes.
2. **Worktrees Git não compartilham `.env`** (gitignored). Na 1ª vez do worktree: `cp ../../../.env ./.env`.
3. **`prisma db push` falha local** por causa do pgvector. Workaround pra colunas novas: aplicar via SQL bruto direto no Postgres local. No Neon `prisma db push` funciona normal.
4. **Migração de tipo single→multi quebra drafts antigos** — campos que mudam de `single-choice` pra `multi-choice` em schema têm valores string salvos antes; `<MultiChoiceField>` espera array. Já existe `normalizeMultiValue()` defensivo em `form-field-renderer.tsx`. Padrão pra futuras mudanças de tipo.
5. **Hydration mismatch com `new Date()`** — server render vs client têm timestamps diferentes. Sempre fazer datas client-only via `useState`+`useEffect`.
6. **CSS de print `header { display: none }`** esconde também `<header>` em componentes próprios! Use `<div>` em vez de `<header>`/`<footer>` em conteúdo printable. Bloco `@media print` em `app/globals.css` cuida do resto.

### 📋 Como retomar tecnicamente

```powershell
# 1. Inicia Postgres local (se ainda não está):
& "E:\postgres\pgsql2\pgsql\bin\pg_ctl.exe" -D E:\postgres\data -l E:\postgres\logs\server.log start

# 2. Worktree atual (onde estão as mudanças da feature, ainda não commitadas):
cd E:\_________PGP\.claude\worktrees\nice-mclean-d12b88

# 3. Garantir .env (se for primeira vez):
test-path .env || cp ../../../.env .env

# 4. Iniciar dev:
npm run dev

# 5. Acessar:
# http://localhost:3000/dashboard/inventario/novo
# Login: clubedoservidor@protonmail.com / 741963PgP@*#$
```

Há **2 commits pendentes de push** pra `main`:
- `00be94d` — RAG full indexing + Blob support (do dia anterior)
- (atual descommitado) — rename signup + checkpoints 1-3 do Inventário

Push falhou por auth dual-account no Windows Credential Manager (`automatizeaihoje-ui` vs `dssenna-oss`). User vai resolver fora da sessão.
