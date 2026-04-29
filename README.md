# 🛡️ PGP - Programa de Governança em Privacidade

Sistema web completo para gestão de conformidade com a **LGPD** (Lei Geral de Proteção de Dados Pessoais - Lei nº 13.709/2018).

## 📋 Visão Geral

O PGP System é uma plataforma que auxilia organizações a implementar e manter um Programa de Governança em Privacidade, seguindo as melhores práticas e requisitos da LGPD. O sistema guia o usuário através de **7 fases** do programa, oferecendo ferramentas para:

- **Inventário de Dados Pessoais** - Mapeamento completo dos dados tratados
- **Análise de Riscos** - Avaliação e classificação de riscos à privacidade
- **GAP Analysis** - Identificação de lacunas em conformidade
- **Plano de Ação** - Planejamento de medidas corretivas
- **RIPD** - Relatório de Impacto à Proteção de Dados
- **Gestão de Incidentes** - Registro e acompanhamento de incidentes
- **Gestão de Documentos** - Geração e organização de documentos de conformidade
- **Chatbot com IA** - Assistente inteligente para dúvidas sobre LGPD

## 🛠️ Stack Tecnológica

| Tecnologia | Versão | Uso |
|---|---|---|
| **Next.js** | 14.2.x | Framework React full-stack (App Router) |
| **React** | 18.x | Biblioteca de UI |
| **TypeScript** | 5.x | Tipagem estática |
| **Tailwind CSS** | 3.x | Estilização utilitária |
| **Prisma ORM** | 5.x | Acesso ao banco de dados |
| **PostgreSQL** | 14+ | Banco de dados relacional |
| **NextAuth.js** | 4.x | Autenticação (email/senha) |
| **Framer Motion** | - | Animações de UI |
| **shadcn/ui** | - | Componentes de interface |
| **Lucide React** | - | Ícones |

## 📁 Estrutura do Projeto

```
app/
├── app/                    # App Router (páginas e APIs)
│   ├── api/                # Rotas de API (REST)
│   │   ├── auth/           # Autenticação (NextAuth)
│   │   ├── chat/           # Chatbot com IA
│   │   ├── inventario/     # CRUD inventário de dados
│   │   ├── risk-assessments/ # Análise de riscos
│   │   ├── gap-analyses/   # GAP analysis
│   │   ├── action-plans/   # Planos de ação
│   │   ├── ripds/          # RIPD
│   │   ├── incidents/      # Gestão de incidentes
│   │   ├── documents/      # Documentos
│   │   ├── phase-documents/ # Documentos por fase
│   │   ├── phase-ebooks/   # E-books por fase
│   │   ├── phase-info/     # Informações das fases
│   │   └── dashboard/      # Estatísticas do dashboard
│   ├── dashboard/          # Páginas autenticadas
│   │   ├── fase-1/ a fase-7/ # Fases do programa
│   │   ├── inventario/     # Inventário de dados
│   │   ├── analise-riscos/ # Análise de riscos
│   │   ├── gap-analysis/   # GAP analysis
│   │   ├── plano-acao/     # Planos de ação
│   │   ├── ripd/           # RIPD
│   │   ├── incidentes/     # Incidentes
│   │   ├── documentos/     # Documentos
│   │   └── configuracoes/  # Configurações
│   ├── login/              # Página de login
│   ├── signup/             # Página de cadastro
│   ├── privacy/            # Política de privacidade
│   ├── terms/              # Termos de uso
│   ├── layout.tsx          # Layout raiz
│   ├── page.tsx            # Landing page
│   └── globals.css         # Estilos globais
├── components/             # Componentes React
│   ├── dashboard/          # Componentes do dashboard
│   ├── fases/              # Componentes das fases
│   ├── ui/                 # Componentes shadcn/ui
│   └── ...                 # Outros componentes
├── lib/                    # Utilitários e configurações
│   ├── db.ts               # Cliente Prisma
│   ├── auth.ts             # Configuração NextAuth
│   └── utils.ts            # Funções utilitárias
├── prisma/                 # Schema e migrações do banco
│   ├── schema.prisma       # Schema do banco de dados
│   └── migrations/         # Migrações do Prisma
├── public/                 # Arquivos estáticos
├── scripts/                # Scripts auxiliares (seed, etc.)
├── .env.example            # Exemplo de variáveis de ambiente
├── next.config.js          # Configuração do Next.js
├── tailwind.config.ts      # Configuração do Tailwind CSS
├── tsconfig.json           # Configuração do TypeScript
└── package.json            # Dependências e scripts
```

## 🚀 Instalação e Execução Local

### Pré-requisitos

- **Node.js** >= 18.x (recomendado: 22.x)
- **PostgreSQL** >= 14
- **Yarn** (gerenciador de pacotes)

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd pgp_governanca_privacidade/app
   ```

2. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas credenciais
   ```

3. **Instale as dependências:**
   ```bash
   yarn install
   ```

4. **Configure o banco de dados:**
   ```bash
   # Gere o cliente Prisma
   yarn prisma generate

   # Execute as migrações
   yarn prisma migrate deploy

   # (Opcional) Popule dados iniciais
   yarn prisma db seed
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   yarn dev
   ```

6. **Acesse a aplicação:**
   ```
   http://localhost:3000
   ```

### Build para produção

```bash
yarn build
yarn start
```

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Onde obter |
|---|---|---|
| `DATABASE_URL` | URL de conexão PostgreSQL | Seu servidor PostgreSQL local ou serviço cloud (Supabase, Neon, Railway, etc.) |
| `NEXTAUTH_SECRET` | Secret para tokens JWT | Gere com: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL base da aplicação | `http://localhost:3000` em dev |
| `ABACUSAI_API_KEY` | API key da Abacus AI | [Abacus AI Platform](https://abacus.ai) - necessário para o chatbot com IA |
| `AWS_BUCKET_NAME` | Nome do bucket S3 | Console AWS S3 - necessário para upload de arquivos |
| `AWS_REGION` | Região AWS | Console AWS |
| `AWS_FOLDER_PREFIX` | Prefixo de pasta no S3 | Definido por você (ex: `pgp/`) |
| `AWS_PROFILE` | Perfil AWS CLI | Configuração local AWS CLI (opcional) |

## 📄 Licença

Este projeto é propriedário. Todos os direitos reservados.

## 👤 Contato

**DPO (Encarregado):** Durval Senna da Silva  
**E-mail:** clubedoservidor@protonmail.com
