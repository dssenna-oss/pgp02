// Auto-migração idempotente da tabela `curso_atividade_respostas`.
// Modalidade C — Onda 2 ("Modo Atividade"). Mesmo padrão das outras migrações
// automáticas do app: o app aplica a própria mudança de schema no banco de
// produção, sem passo manual.
//
// Tabela criada:
//   curso_atividade_respostas — resposta de um participante logado (crachá:
//   papel + grupo) a uma atividade leve. UNIQUE(userId, atividadeId) permite
//   upsert (reenviar sobrescreve). FK pra curso_turmas com ON DELETE CASCADE.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureTabelaAtividadesC(): Promise<void> {
  if (verificadoNestaInstancia) return;

  const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
    `SELECT table_name FROM information_schema.tables WHERE table_name = 'curso_atividade_respostas'`,
  );
  const existe = tables.length > 0;

  if (!existe) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "curso_atividade_respostas" (
        "id" TEXT NOT NULL,
        "turmaId" TEXT NOT NULL,
        "companyId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "papel" TEXT,
        "atividadeId" TEXT NOT NULL,
        "resposta" JSONB NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "curso_atividade_respostas_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX "curso_atividade_respostas_userId_atividadeId_key"
      ON "curso_atividade_respostas"("userId", "atividadeId")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "curso_atividade_respostas_turmaId_atividadeId_idx"
      ON "curso_atividade_respostas"("turmaId", "atividadeId")
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "curso_atividade_respostas"
      ADD CONSTRAINT "curso_atividade_respostas_turmaId_fkey"
      FOREIGN KEY ("turmaId") REFERENCES "curso_turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  verificadoNestaInstancia = true;
}
