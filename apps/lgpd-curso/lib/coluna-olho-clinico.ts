// Auto-migração idempotente da coluna olhoClinicoQuiz em companies.
// JSON com as respostas do quiz "Caça às Pegadinhas" do grupo.
// Mesmo padrão das outras colunas auto-migradas (Fase Preliminar, Fase 2, etc).

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureColunaOlhoClinico(): Promise<void> {
  if (verificadoNestaInstancia) return;
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'companies'`
  );
  const existentes = new Set(cols.map((c) => c.column_name));
  if (!existentes.has("olhoClinicoQuiz")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "companies" ADD COLUMN "olhoClinicoQuiz" JSONB`
    );
  }
  verificadoNestaInstancia = true;
}
