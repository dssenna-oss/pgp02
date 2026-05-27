// Auto-migração idempotente das 3 colunas JSON da Fase Preliminar em companies:
// termometroInicio, termometroFim, cartaAltaGestao. Mesmo padrão das outras
// colunas auto-migradas — sem passo manual no banco.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureColunasFasePreliminar(): Promise<void> {
  if (verificadoNestaInstancia) return;
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'companies'`
  );
  const existentes = new Set(cols.map((c) => c.column_name));
  if (!existentes.has("termometroInicio")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "companies" ADD COLUMN "termometroInicio" JSONB`
    );
  }
  if (!existentes.has("termometroFim")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "companies" ADD COLUMN "termometroFim" JSONB`
    );
  }
  if (!existentes.has("cartaAltaGestao")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "companies" ADD COLUMN "cartaAltaGestao" JSONB`
    );
  }
  verificadoNestaInstancia = true;
}
