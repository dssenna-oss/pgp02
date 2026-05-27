// Auto-migração idempotente da coluna `dpoJustificativaEscolha` em companies.
// Usada na Fase 1 (Designação do Encarregado) — campo opcional que entra no
// Ato de Nomeação DOCX gerado.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureColunaDpoJustificativa(): Promise<void> {
  if (verificadoNestaInstancia) return;
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'companies'`
  );
  if (!cols.some((c) => c.column_name === "dpoJustificativaEscolha")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "companies" ADD COLUMN "dpoJustificativaEscolha" TEXT`
    );
  }
  verificadoNestaInstancia = true;
}
