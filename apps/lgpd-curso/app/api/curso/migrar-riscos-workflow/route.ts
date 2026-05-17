// GET/POST /api/curso/migrar-riscos-workflow
// VERSÃO DIAGNÓSTICA — retorna info do schema sem alterar nada.
// Quando soubermos o nome real da tabela, volta a versão que aplica.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const diagnostico: any = {};

  try {
    // 1. Qual schema atual?
    const currentSchema = await prisma.$queryRaw<{ current_schema: string }[]>`SELECT current_schema()`;
    diagnostico.current_schema = currentSchema[0]?.current_schema;

    // 2. Qual search_path?
    const searchPath = await prisma.$queryRaw<{ search_path: string }[]>`SHOW search_path`;
    diagnostico.search_path = searchPath[0]?.search_path;

    // 3. Todos os schemas (não-sistema)
    const schemas = await prisma.$queryRaw<{ schema_name: string }[]>`
      SELECT schema_name FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog','pg_toast','information_schema')
      ORDER BY schema_name
    `;
    diagnostico.schemas = schemas.map((s) => s.schema_name);

    // 4. Todas as tabelas em todos os schemas (não-sistema)
    const todas = await prisma.$queryRaw<{ table_schema: string; table_name: string }[]>`
      SELECT table_schema, table_name FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog','pg_toast','information_schema')
      ORDER BY table_schema, table_name
    `;
    diagnostico.tabelas_total = todas.length;
    diagnostico.tabelas = todas.map((t) => `${t.table_schema}.${t.table_name}`);

    // 5. Filtrar as que têm 'risk' no nome
    diagnostico.com_risk_no_nome = diagnostico.tabelas.filter((t: string) => /risk/i.test(t));

    return NextResponse.json({ ok: true, diagnostico });
  } catch (e: any) {
    console.error("[migrar-riscos-workflow] erro:", e);
    return NextResponse.json({
      ok: false,
      error: e.message,
      diagnostico_parcial: diagnostico,
    }, { status: 500 });
  }
}

export const POST = GET;
