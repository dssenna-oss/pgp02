# Handover — PGP (LGPD)

> **Última sessão:** 2026-05-02 · **Último commit:** `6fe45b7` · **Branch:** `main` (sincronizado com `origin/main`).

App em **produção:** https://lgpd-pgp.vercel.app
Repo: https://github.com/dssenna-oss/pgp02 (público)

---

## ✅ Funcionando

- Frontend Next.js + Postgres (Neon) + auto-deploy via push em `main`
- Login: `clubedoservidor@protonmail.com` / `741963PgP@*#$`
- Conteúdos didáticos, e-books de fase, documentos de fase (71 arquivos em `public/phase-documents/`, ~85 MB)
- Logo da empresa via base64 no DB (sem S3)
- Uploads de novos documentos via Vercel Blob (público)
- Vídeos de capa: YouTube embed (não há binários no repo)
- Chatbot **independente da Abacus** rodando Gemini 2.5 Flash (`@google/genai`)
- RAG com pgvector no Neon: **687 chunks** indexados (preliminar, fase-1, fase-2, fase-3, global)

---

## ⏳ Pendências

### 1. Indexar fases 4-7 + Entendendo PGP (RAG)
A quota gratuita Gemini (1.000 embeds/dia) acabou. Re-rodar amanhã:

```powershell
cd E:\_________PGP
$env:DATABASE_URL="postgresql://neondb_owner:npg_Se1HYgvrba3E@ep-mute-hill-ams507ms-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=60&pool_timeout=30"
npx tsx --require dotenv/config scripts/index-knowledge-base.ts
```

Idempotente — só processa o que falta. Resultado fica em `document_chunks` no Neon.
Pode conferir com:
```powershell
npx tsx --require dotenv/config scripts/rag-stats.ts
```

### 2. Revogar Personal Access Token do GitHub
PAT `pgp-push-temp` foi usado durante a sessão pra pushes. **Revogar** em:
https://github.com/settings/tokens

### 3. Reativar logo (opcional)
Logo da empresa foi limpado no Neon como medida defensiva. Pra subir de novo:
- Settings → Logo da Empresa → Upload (qualquer imagem ≤ 2 MB)

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
| `scripts/index-knowledge-base.ts` | Indexador idempotente PDF/DOCX/XLSX → chunks vetorizados |
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
5. **Gemini quota** — 1.000 embeds/dia no free tier. Indexar em batch grande estoura; rodar de novo no dia seguinte ou ativar billing.

---

## 💡 Próximos passos sugeridos (escolha do user)

- Estender módulo de Inventário do app pra ter os 21 campos do `mapa-processos.html`
- Criar importador de XLSX → `data_inventories` (popula a partir da planilha modelo)
- Configurar AWS S3 ou aumentar Vercel Blob (caso queira mais espaço pra uploads)
- Abrir billing no Gemini pra terminar a indexação na hora
