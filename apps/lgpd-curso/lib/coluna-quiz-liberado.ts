// Auto-migração idempotente da coluna quizLiberado em curso_turmas.
// Trava de largada do Quiz Diagnóstico: false = travado (estado inicial).
// O facilitador libera no Painel de Condução (Momento 2) ou no painel do Quiz
// — todos começam juntos. Mesmo padrão das outras colunas auto-migradas.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureColunaQuizLiberado(): Promise<void> {
  if (verificadoNestaInstancia) return;
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'curso_turmas'`
  );
  const existentes = new Set(cols.map((c) => c.column_name));
  if (!existentes.has("quizLiberado")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "curso_turmas" ADD COLUMN "quizLiberado" BOOLEAN NOT NULL DEFAULT false`
    );
  }
  verificadoNestaInstancia = true;
}
