// Auto-migração idempotente da coluna `senhaExibicao` em curso_turmas.
// Mesmo padrão de /api/curso/migrar-slug-turmas: o app aplica a própria
// mudança de schema no banco de produção, sem passo manual.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureColunaSenhaExibicao(): Promise<void> {
  if (verificadoNestaInstancia) return;
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'curso_turmas'`
  );
  if (!cols.some((c) => c.column_name === "senhaExibicao")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "curso_turmas" ADD COLUMN "senhaExibicao" TEXT`
    );
  }
  verificadoNestaInstancia = true;
}
