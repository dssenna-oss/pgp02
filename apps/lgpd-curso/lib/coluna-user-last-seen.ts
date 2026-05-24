// Auto-migração idempotente da coluna `lastSeenAt` em users.
// Mesmo padrão das outras colunas auto-migradas (coluna-senha-turma,
// colunas-controle-turma, colunas-quiz, etc.) — o app aplica a própria
// mudança de schema no banco de produção, sem passo manual.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureColunaLastSeenAt(): Promise<void> {
  if (verificadoNestaInstancia) return;
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`
  );
  if (!cols.some((c) => c.column_name === "lastSeenAt")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "users" ADD COLUMN "lastSeenAt" TIMESTAMP`
    );
  }
  verificadoNestaInstancia = true;
}
