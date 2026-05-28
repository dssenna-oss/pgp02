// Auto-migração idempotente da coluna forumAberto em curso_turmas.
// Fórum da turma (suporte pós-curso): quando true, o login do participante
// deixa de ser bloqueado pela data limite (acessoFim). Mesmo padrão das outras
// colunas auto-migradas.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureColunaForumAberto(): Promise<void> {
  if (verificadoNestaInstancia) return;
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'curso_turmas'`
  );
  const existentes = new Set(cols.map((c) => c.column_name));
  if (!existentes.has("forumAberto")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "curso_turmas" ADD COLUMN "forumAberto" BOOLEAN NOT NULL DEFAULT false`
    );
  }
  verificadoNestaInstancia = true;
}
