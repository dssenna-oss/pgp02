// Auto-migração idempotente da coluna telaoComando em curso_turmas.
// Telão Comandado (Modalidade C): o facilitador toca no CELULAR e o telão do
// notebook (página /telao-vivo/<slug>) troca sozinho, via polling — sem
// websocket (padrão Vercel). Esta coluna guarda o comando atual:
//   "placar" | "quiz" | "atividade:<id>" (id inclui "termometro") | null
// null = tela de espera. Mesmo padrão das outras colunas auto-migradas.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureColunaTelaoComando(): Promise<void> {
  if (verificadoNestaInstancia) return;
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'curso_turmas'`
  );
  const existentes = new Set(cols.map((c) => c.column_name));
  if (!existentes.has("telaoComando")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "curso_turmas" ADD COLUMN "telaoComando" TEXT`
    );
  }
  verificadoNestaInstancia = true;
}
