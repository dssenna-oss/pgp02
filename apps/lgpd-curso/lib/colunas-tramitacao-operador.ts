// Auto-migração idempotente das colunas de tramitação multi-setor em operators.
// Mesmo padrão de lib/coluna-senha-turma.ts: o app aplica a própria mudança
// de schema no banco de produção, sem passo manual.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

const COLUNAS: { nome: string; tipo: string }[] = [
  { nome: "tramitadoPara", tipo: "TEXT" },
  { nome: "tramitacaoNota", tipo: "TEXT" },
  { nome: "tramitadoEm", tipo: "TIMESTAMP(3)" },
  { nome: "tramitacaoParecer", tipo: "TEXT" },
];

export async function ensureColunasTramitacaoOperador(): Promise<void> {
  if (verificadoNestaInstancia) return;
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'operators'`
  );
  const existentes = new Set(cols.map((c) => c.column_name));
  for (const col of COLUNAS) {
    if (!existentes.has(col.nome)) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "operators" ADD COLUMN "${col.nome}" ${col.tipo}`
      );
    }
  }
  verificadoNestaInstancia = true;
}
