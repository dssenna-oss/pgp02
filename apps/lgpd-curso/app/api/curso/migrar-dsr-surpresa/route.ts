// GET/POST /api/curso/migrar-dsr-surpresa
// Migração idempotente: adiciona 2 colunas em dsr_requests pra suportar
// a Missão 4a Surpresa (DSRs disparados pelo facilitador + ação do DPO
// rastreada pra pontuação pedagógica).
// Admin-only.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COLUNAS_DESEJADAS: Array<{ nome: string; addSql: string }> = [
  { nome: "disparoFacilitador", addSql: `ALTER TABLE "dsr_requests" ADD COLUMN "disparoFacilitador" BOOLEAN NOT NULL DEFAULT FALSE` },
  { nome: "gameAction",         addSql: `ALTER TABLE "dsr_requests" ADD COLUMN "gameAction" TEXT` },
];

async function aplicar() {
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'dsr_requests'`
  );
  const nomes = new Set(cols.map((c) => c.column_name));
  const aplicadas: string[] = [];

  for (const c of COLUNAS_DESEJADAS) {
    if (!nomes.has(c.nome)) {
      await prisma.$executeRawUnsafe(c.addSql);
      aplicadas.push(c.nome);
    }
  }

  const colsFinais = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'dsr_requests'`
  );

  return {
    status: aplicadas.length > 0 ? "aplicada_agora" : "ja_completa",
    aplicadas,
    colunas_finais: colsFinais.map((c) => c.column_name),
  };
}

export async function GET() {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
  try {
    const result = await aplicar();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error("[migrar-dsr-surpresa] erro:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export const POST = GET;
