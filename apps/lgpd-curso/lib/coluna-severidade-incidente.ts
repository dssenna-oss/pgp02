// Auto-migração idempotente da coluna severidadeFatores em incidents.
// Mesmo padrão de lib/coluna-senha-turma.ts.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureColunaSeveridadeFatores(): Promise<void> {
  if (verificadoNestaInstancia) return;
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'incidents'`
  );
  if (!cols.some((c) => c.column_name === "severidadeFatores")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "incidents" ADD COLUMN "severidadeFatores" JSONB`
    );
  }
  verificadoNestaInstancia = true;
}
