// GET/POST /api/curso/migrar-riscos-workflow
// Migração one-shot: adiciona colunas de workflow Contribuidor→DPO em process_risks.
// (Nome da tabela = "process_risks" — descoberto via diagnostic prévio.)
// Idempotente — checa se já aplicou antes de rodar.
// Admin-only por segurança.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TABELA = "process_risks";

async function aplicar() {
  // Checa se já existe a coluna feedbackDpo — marcador da migração aplicada
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
    TABELA
  );
  const nomesCol = cols.map((c) => c.column_name);
  if (nomesCol.includes("feedbackDpo")) {
    return { status: "ja_aplicada", colunas: nomesCol };
  }

  // Aplica
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "${TABELA}"
      ALTER COLUMN "status" SET DEFAULT 'RASCUNHO',
      ADD COLUMN "feedbackDpo" TEXT,
      ADD COLUMN "createdById" TEXT,
      ADD COLUMN "reviewedById" TEXT,
      ADD COLUMN "submittedAt" TIMESTAMP(3),
      ADD COLUMN "reviewedAt" TIMESTAMP(3)
  `);
  const updated = await prisma.$executeRawUnsafe(`
    UPDATE "${TABELA}" SET "status" = 'APROVADO' WHERE "status" = 'ATIVO'
  `);

  // Confirma colunas após aplicar
  const colsDepois = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
    TABELA
  );

  return {
    status: "aplicada_agora",
    riscos_legacy_migrados: updated,
    colunas_apos_migracao: colsDepois.map((c) => c.column_name),
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
    return NextResponse.json({
      ok: false,
      error: e.message,
      hint: "Veja logs do Vercel pra detalhes",
    }, { status: 500 });
  }
}

export const POST = GET;
