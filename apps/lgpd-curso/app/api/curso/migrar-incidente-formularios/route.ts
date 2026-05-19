// GET/POST /api/curso/migrar-incidente-formularios
// Migração idempotente: adiciona 2 colunas JSONB em incidents pra suportar
// os formulários estruturados (Comunicação ANPD + Carta Titulares) na
// Missão 5. Admin-only.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COLUNAS_DESEJADAS: Array<{ nome: string; addSql: string }> = [
  { nome: "formularioAnpd",      addSql: `ALTER TABLE "incidents" ADD COLUMN "formularioAnpd" JSONB` },
  { nome: "formularioTitulares", addSql: `ALTER TABLE "incidents" ADD COLUMN "formularioTitulares" JSONB` },
];

async function aplicar() {
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'incidents'`
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
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'incidents'`
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
    console.error("[migrar-incidente-formularios] erro:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export const POST = GET;
