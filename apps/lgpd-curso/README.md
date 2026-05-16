# PGP Treinamento — app do curso presencial LGPD (Modalidade A)

Next.js standalone, irmão do app de produção em `../../app/`. Compartilha o repositório mas não compartilha código — **cópia consciente**.

## Setup local (~10 min)

### 1 — Pré-requisitos manuais

Antes da primeira execução, faça (não dá pra automatizar):

**a) Neon — criar branch `curso`**
- Acesse https://console.neon.tech → projeto → **Branches** → **"+ New branch"**
- Nome: `curso`. Origem: `main`. Custo: zero (copy-on-write).
- Copie a connection string.

**b) Vercel — criar projeto `lgpd-curso`** (só pra deploy futuro)
- Acesse https://vercel.com/new
- Importe o repo
- **Root Directory:** `apps/lgpd-curso`
- Não faça deploy ainda.

**c) Env vars** — crie `.env.local` neste diretório:
```bash
cp .env.example .env.local
# Edite e preencha:
#   DATABASE_URL    — connection string da branch Neon "curso"
#   NEXTAUTH_SECRET — gere via:  openssl rand -base64 32
#   NEXTAUTH_URL    — http://localhost:3100
```

### 2 — Instalar e rodar

```bash
cd apps/lgpd-curso
npm install
npm run db:push     # aplica o schema na branch Neon "curso"
npm run db:seed     # cria o usuário admin facilitador
npm run dev         # roda em http://localhost:3100
```

### 3 — Primeiro login

- URL: http://localhost:3100/login
- Email: `facilitador@curso.lgpd` (ou o que você definiu em `ADMIN_EMAIL`)
- Senha: `Curso2026!` (ou o que você definiu em `ADMIN_PASSWORD`)

Com login admin, você vê na sidebar a seção **Facilitador** com:
- **Painel do Facilitador** — placeholder (será construído na S5)
- **Criar turma** — placeholder (será construído na S3)

## Status atual

**S1 (Setup arquitetural)** ✅ Concluído nesta sessão:
- Estrutura Next.js criada
- Schema Prisma enxuto (15 models — 8 mini-apps + multi-tenant + CursoTurma/CursoGrupo)
- NextAuth Credentials configurado
- Layout autenticado com sidebar enxuta (8 mini-apps + admin)
- Banner permanente "AMBIENTE DE TREINAMENTO"
- Login + dashboard funcionais
- Placeholders pros 8 mini-apps + admin/facilitador

**Pendente:**
- **S2** — copiar os 8 mini-apps do app de produção (Inventário · Riscos · GAP · RIPD · Terceiros · DSR · Aviso · Incidentes)
- **S3** — endpoint `/api/curso/criar-turma` + seeds em Vegas + grupos de 10 (5 logins + 5 observadores)
- **S4** — materiais impressos (reuso da Modalidade B em `../../Jogo Vegas/`)
- **S5** — painel facilitador ao vivo (opcional V1)

## Arquitetura

| Camada | Conteúdo |
|---|---|
| `app/` | Páginas Next.js 14 App Router |
| `app/api/auth/[...nextauth]/` | Rota NextAuth |
| `app/dashboard/*` | 8 mini-apps + home (autenticado) |
| `app/admin/*` | Tela admin (criar turma) |
| `app/facilitador/*` | Painel ao vivo |
| `components/` | Componentes compartilhados (sidebar, brand, banner, placeholders) |
| `lib/auth.ts` | Config NextAuth |
| `lib/prisma.ts` | Singleton Prisma |
| `prisma/schema.prisma` | Schema enxuto |
| `prisma/seed.ts` | Seed do admin inicial |
| `middleware.ts` | Guard de autenticação |

## Branding

- Cor: paleta `training-*` (amarelo, banner permanente) + `brand-*` (azul institucional)
- Logo: `Shield` com selo "TR" sobreposto = `<Brand />`
- Footer: "Curso prático de LGPD · Versão de treinamento · Não substitui o app de produção"
- App de prod (`lgpd-pgp.vercel.app`) **continua intocado**

## Decisões cravadas

- **Cidade fictícia padrão:** Vegas (alinhado com Modalidade B)
- **Tamanho do grupo:** 10 pessoas (5 com login + 5 observadores sem login)
- **8 mini-apps obrigatórios** em camada única (não há "bônus camada 2")
- **Ordem na sidebar:** Inventário → Riscos → GAP → RIPD → Terceiros → DSR → Aviso → Incidentes
- **Porta dev:** 3100 (evita conflito com app de prod em 3000)
- **Sessão NextAuth:** 4h (mais que a aula prática)
