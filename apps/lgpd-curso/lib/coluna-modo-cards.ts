// Auto-migração idempotente da coluna modoCards em curso_turmas.
// Modalidade C: quando true, as fases de produção ficam em modo leitura pra
// todos os participantes (atividade nos cards físicos). Mesmo padrão das
// outras colunas auto-migradas.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureColunaModoCards(): Promise<void> {
  if (verificadoNestaInstancia) return;
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'curso_turmas'`
  );
  const existentes = new Set(cols.map((c) => c.column_name));
  if (!existentes.has("modoCards")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "curso_turmas" ADD COLUMN "modoCards" BOOLEAN NOT NULL DEFAULT false`
    );
  }
  verificadoNestaInstancia = true;
}
