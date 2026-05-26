// Auto-migração idempotente da coluna `quizDuracaoMinutos` em curso_turmas.
// Mesmo padrão das outras colunas auto-migradas — sem passo manual no banco.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureColunaQuizDuracao(): Promise<void> {
  if (verificadoNestaInstancia) return;
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'curso_turmas'`
  );
  if (!cols.some((c) => c.column_name === "quizDuracaoMinutos")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "curso_turmas" ADD COLUMN "quizDuracaoMinutos" INTEGER`
    );
  }
  verificadoNestaInstancia = true;
}
