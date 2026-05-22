// Auto-migração idempotente das colunas de Controle de Turma em curso_turmas.
// Mesmo padrão de lib/coluna-senha-turma.ts: o app aplica a própria mudança
// de schema no banco de produção, sem passo manual.
//
// Colunas garantidas:
//   - acessoInicio / acessoFim  → janela de acesso ao app pelos participantes
//   - participantes (JSONB)     → lista de e-mails dos inscritos

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureColunasControleTurma(): Promise<void> {
  if (verificadoNestaInstancia) return;
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'curso_turmas'`
  );
  const tem = (nome: string) => cols.some((c) => c.column_name === nome);

  if (!tem("acessoInicio")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "curso_turmas" ADD COLUMN "acessoInicio" TIMESTAMP(3)`
    );
  }
  if (!tem("acessoFim")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "curso_turmas" ADD COLUMN "acessoFim" TIMESTAMP(3)`
    );
  }
  if (!tem("participantes")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "curso_turmas" ADD COLUMN "participantes" JSONB`
    );
  }

  verificadoNestaInstancia = true;
}
