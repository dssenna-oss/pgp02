// Auto-migração idempotente das tabelas do Fórum da turma (suporte pós-curso).
// Mesmo padrão das outras migrações automáticas: o app cria as próprias tabelas
// no banco de produção, sem passo manual.
//
// Tabelas criadas:
//   forum_threads   — tópicos/perguntas da turma (campos de autor desnormalizados)
//   forum_mensagens — respostas dentro de um tópico (FK CASCADE pro thread)
//   forum_reacoes   — voto 👍 "útil"; alvo polimórfico (THREAD|MENSAGEM)

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureTabelasForum(): Promise<void> {
  if (verificadoNestaInstancia) return;

  const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_name IN ('forum_threads', 'forum_mensagens', 'forum_reacoes')`,
  );
  const existentes = new Set(tables.map((t) => t.table_name));

  if (!existentes.has("forum_threads")) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "forum_threads" (
        "id" TEXT NOT NULL,
        "turmaId" TEXT NOT NULL,
        "autorId" TEXT,
        "autorNome" TEXT NOT NULL,
        "autorPapel" TEXT,
        "autorGrupoNumero" INTEGER,
        "autorOrgao" TEXT,
        "autorEhFacilitador" BOOLEAN NOT NULL DEFAULT false,
        "titulo" TEXT NOT NULL,
        "corpo" TEXT NOT NULL,
        "resolvido" BOOLEAN NOT NULL DEFAULT false,
        "fixado" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "forum_threads_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX "forum_threads_turmaId_idx" ON "forum_threads"("turmaId")`,
    );
  }

  if (!existentes.has("forum_mensagens")) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "forum_mensagens" (
        "id" TEXT NOT NULL,
        "threadId" TEXT NOT NULL,
        "autorId" TEXT,
        "autorNome" TEXT NOT NULL,
        "autorPapel" TEXT,
        "autorGrupoNumero" INTEGER,
        "autorOrgao" TEXT,
        "autorEhFacilitador" BOOLEAN NOT NULL DEFAULT false,
        "corpo" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "forum_mensagens_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX "forum_mensagens_threadId_idx" ON "forum_mensagens"("threadId")`,
    );
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "forum_mensagens"
      ADD CONSTRAINT "forum_mensagens_threadId_fkey"
      FOREIGN KEY ("threadId") REFERENCES "forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  if (!existentes.has("forum_reacoes")) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "forum_reacoes" (
        "id" TEXT NOT NULL,
        "alvoTipo" TEXT NOT NULL,
        "alvoId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "forum_reacoes_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX "forum_reacoes_userId_alvoTipo_alvoId_key"
      ON "forum_reacoes"("userId", "alvoTipo", "alvoId")
    `);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX "forum_reacoes_alvoTipo_alvoId_idx" ON "forum_reacoes"("alvoTipo", "alvoId")`,
    );
  }

  verificadoNestaInstancia = true;
}
