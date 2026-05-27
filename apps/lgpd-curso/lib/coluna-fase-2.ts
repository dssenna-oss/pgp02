// Auto-migração idempotente das 2 colunas JSON da Fase 2 em companies:
// setoresDiscutidos, priorizacaoProcessos. Mesmo padrão das outras colunas
// auto-migradas — sem passo manual no banco.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureColunasFase2(): Promise<void> {
  if (verificadoNestaInstancia) return;
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'companies'`
  );
  const existentes = new Set(cols.map((c) => c.column_name));
  if (!existentes.has("setoresDiscutidos")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "companies" ADD COLUMN "setoresDiscutidos" JSONB`
    );
  }
  if (!existentes.has("priorizacaoProcessos")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "companies" ADD COLUMN "priorizacaoProcessos" JSONB`
    );
  }
  verificadoNestaInstancia = true;
}
