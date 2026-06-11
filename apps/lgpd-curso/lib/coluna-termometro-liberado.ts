// Auto-migração idempotente da coluna termometroLiberado em curso_turmas.
// Largada conjunta do Termômetro Institucional: false = travado (estado
// inicial). O facilitador libera no Painel de Condução (Momento 3 e Momento
// 14) — todos preenchem juntos. Mesmo padrão de lib/coluna-quiz-liberado.ts.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureColunaTermometroLiberado(): Promise<void> {
  if (verificadoNestaInstancia) return;
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'curso_turmas'`
  );
  const existentes = new Set(cols.map((c) => c.column_name));
  if (!existentes.has("termometroLiberado")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "curso_turmas" ADD COLUMN "termometroLiberado" BOOLEAN NOT NULL DEFAULT false`
    );
  }
  verificadoNestaInstancia = true;
}
