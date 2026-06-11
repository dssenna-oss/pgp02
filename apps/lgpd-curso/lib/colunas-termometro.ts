// Auto-migração idempotente da tabela `termometro_respostas`.
// Termômetro INDIVIDUAL (Fase Preliminar). Mesmo padrão das outras migrações
// automáticas do app: o app aplica a própria mudança de schema no banco de
// produção, sem passo manual.
//
// Tabela criada:
//   termometro_respostas — auto-diagnóstico de um participante logado, no
//   INÍCIO e no FIM do curso, em 2 blocos com scores separados (0-100 cada):
//   `scorePessoal` (quanto EU conheço a LGPD) e `score` (em que etapa da
//   jornada o MEU órgão real está — 7 perguntas espelhando as Fases do PGP).
//   UNIQUE(userId, momento) permite upsert (refazer sobrescreve). FK pra
//   curso_turmas com ON DELETE CASCADE (reset/arquivar turma limpa junto).
//
// Por que tabela separada e não colunas em `users`: User é o model mais lido
// do app (login, heartbeat a cada 30s, painel). Adicionar coluna nova nele
// quebraria todo `prisma.user.update/findX` sem `select` até a migração rodar
// (lição PR #203 / feedback_prisma_user_select). Tabela à parte é additiva:
// nenhuma query existente muda.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureTabelaTermometro(): Promise<void> {
  if (verificadoNestaInstancia) return;

  const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
    `SELECT table_name FROM information_schema.tables WHERE table_name = 'termometro_respostas'`,
  );
  const existe = tables.length > 0;

  if (!existe) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "termometro_respostas" (
        "id" TEXT NOT NULL,
        "turmaId" TEXT NOT NULL,
        "companyId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "papel" TEXT,
        "momento" TEXT NOT NULL,
        "dimensoes" JSONB NOT NULL DEFAULT '[]',
        "score" INTEGER NOT NULL DEFAULT 0,
        "scorePessoal" INTEGER NOT NULL DEFAULT 0,
        "finalizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "termometro_respostas_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX "termometro_respostas_userId_momento_key"
      ON "termometro_respostas"("userId", "momento")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "termometro_respostas_turmaId_momento_idx"
      ON "termometro_respostas"("turmaId", "momento")
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "termometro_respostas"
      ADD CONSTRAINT "termometro_respostas_turmaId_fkey"
      FOREIGN KEY ("turmaId") REFERENCES "curso_turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
  } else {
    // Tabela criada por versão anterior do app (sem o bloco pessoal) —
    // garante a coluna scorePessoal.
    const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'termometro_respostas'`,
    );
    const existentes = new Set(cols.map((c) => c.column_name));
    if (!existentes.has("scorePessoal")) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "termometro_respostas" ADD COLUMN "scorePessoal" INTEGER NOT NULL DEFAULT 0`,
      );
    }
  }

  verificadoNestaInstancia = true;
}
