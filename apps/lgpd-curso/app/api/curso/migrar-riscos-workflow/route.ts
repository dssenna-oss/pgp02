// GET/POST /api/curso/migrar-riscos-workflow
// Migração idempotente: adiciona colunas faltantes em "process_risks".
// Cobre 2 ondas:
//   Onda 1 (workflow Contribuidor→DPO): feedbackDpo, createdById, reviewedById,
//                                       submittedAt, reviewedAt
//   Onda 2 (tramitação multi-setor):    tramitadoPara, tramitacaoNota, tramitadoEm
// Roda sem perigo várias vezes — só adiciona o que falta.
// Admin-only.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TABELA = "process_risks";

// Lista de (nome_coluna, sql_alter_to_add). Idempotente: aplica só as ausentes.
const COLUNAS_DESEJADAS: Array<{ nome: string; addSql: string }> = [
  { nome: "feedbackDpo",    addSql: `ALTER TABLE "${TABELA}" ADD COLUMN "feedbackDpo" TEXT` },
  { nome: "createdById",    addSql: `ALTER TABLE "${TABELA}" ADD COLUMN "createdById" TEXT` },
  { nome: "reviewedById",   addSql: `ALTER TABLE "${TABELA}" ADD COLUMN "reviewedById" TEXT` },
  { nome: "submittedAt",    addSql: `ALTER TABLE "${TABELA}" ADD COLUMN "submittedAt" TIMESTAMP(3)` },
  { nome: "reviewedAt",     addSql: `ALTER TABLE "${TABELA}" ADD COLUMN "reviewedAt" TIMESTAMP(3)` },
  { nome: "tramitadoPara",  addSql: `ALTER TABLE "${TABELA}" ADD COLUMN "tramitadoPara" TEXT` },
  { nome: "tramitacaoNota", addSql: `ALTER TABLE "${TABELA}" ADD COLUMN "tramitacaoNota" TEXT` },
  { nome: "tramitadoEm",    addSql: `ALTER TABLE "${TABELA}" ADD COLUMN "tramitadoEm" TIMESTAMP(3)` },
];

async function aplicar() {
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
    TABELA
  );
  const nomesExistentes = new Set(cols.map((c) => c.column_name));

  const faltantes = COLUNAS_DESEJADAS.filter((c) => !nomesExistentes.has(c.nome));
  const aplicadas: string[] = [];

  // Sempre garante o default 'RASCUNHO' (idempotente — SET DEFAULT em col já com mesmo default é no-op)
  await prisma.$executeRawUnsafe(`ALTER TABLE "${TABELA}" ALTER COLUMN "status" SET DEFAULT 'RASCUNHO'`);

  for (const c of faltantes) {
    await prisma.$executeRawUnsafe(c.addSql);
    aplicadas.push(c.nome);
  }

  // Migra riscos legacy "ATIVO" → "APROVADO" (idempotente — só afeta o que ainda for ATIVO)
  const updated = await prisma.$executeRawUnsafe(
    `UPDATE "${TABELA}" SET "status" = 'APROVADO' WHERE "status" = 'ATIVO'`
  );

  const colsDepois = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
    TABELA
  );

  return {
    status: aplicadas.length > 0 ? "aplicada_agora" : "ja_completa",
    colunas_aplicadas_agora: aplicadas,
    riscos_legacy_migrados: updated,
    colunas_finais: colsDepois.map((c) => c.column_name),
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
    console.error("[migrar-riscos-workflow] erro:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export const POST = GET;
