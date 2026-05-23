// Auto-migração idempotente da tabela `quiz_responses` (Quiz Diagnóstico).
// Mesmo padrão das outras migrações automáticas do app — o app aplica a
// própria mudança de schema no banco de produção, sem passo manual.
//
// Tabela criada:
//   quiz_responses — respostas anônimas do Quiz Diagnóstico de cada
//   participante. Sem user_id, apenas turmaId + uuid local (gerado no
//   localStorage do cliente). UNIQUE(turmaId, uuid) impede contar 2x do
//   mesmo dispositivo.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureTabelaQuiz(): Promise<void> {
  if (verificadoNestaInstancia) return;

  // Tabela existe?
  const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
    `SELECT table_name FROM information_schema.tables WHERE table_name = 'quiz_responses'`,
  );
  const existe = tables.length > 0;

  if (!existe) {
    // CREATE TABLE — mesmo schema do model Prisma. As FKs e índices também.
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "quiz_responses" (
        "id" TEXT NOT NULL,
        "turmaId" TEXT NOT NULL,
        "uuid" TEXT NOT NULL,
        "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "finishedAt" TIMESTAMP(3),
        "respostas" JSONB NOT NULL DEFAULT '[]',
        "scoreTotal" INTEGER NOT NULL DEFAULT 0,
        "scorePorCategoria" JSONB NOT NULL DEFAULT '{}',
        CONSTRAINT "quiz_responses_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX "quiz_responses_turmaId_uuid_key"
      ON "quiz_responses"("turmaId", "uuid")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "quiz_responses_turmaId_finishedAt_idx"
      ON "quiz_responses"("turmaId", "finishedAt")
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "quiz_responses"
      ADD CONSTRAINT "quiz_responses_turmaId_fkey"
      FOREIGN KEY ("turmaId") REFERENCES "curso_turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  verificadoNestaInstancia = true;
}
