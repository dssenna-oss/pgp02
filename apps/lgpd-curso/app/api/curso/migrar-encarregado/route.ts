// GET/POST /api/curso/migrar-encarregado
// Migração idempotente: adiciona 5 colunas em companies pra cadastro do
// Encarregado e Substituto.
// Admin-only.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COLUNAS_DESEJADAS: Array<{ nome: string; addSql: string }> = [
  { nome: "dpoTelefone",          addSql: `ALTER TABLE "companies" ADD COLUMN "dpoTelefone" TEXT` },
  { nome: "dpoEndereco",          addSql: `ALTER TABLE "companies" ADD COLUMN "dpoEndereco" TEXT` },
  { nome: "dpoSubstitutoNome",    addSql: `ALTER TABLE "companies" ADD COLUMN "dpoSubstitutoNome" TEXT` },
  { nome: "dpoSubstitutoEmail",   addSql: `ALTER TABLE "companies" ADD COLUMN "dpoSubstitutoEmail" TEXT` },
  { nome: "dpoSubstitutoTelefone",addSql: `ALTER TABLE "companies" ADD COLUMN "dpoSubstitutoTelefone" TEXT` },
];

async function aplicar() {
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'companies'`
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
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'companies'`
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
    console.error("[migrar-encarregado] erro:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export const POST = GET;
