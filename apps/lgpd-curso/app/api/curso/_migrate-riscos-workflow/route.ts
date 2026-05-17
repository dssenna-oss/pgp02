// GET/POST /api/curso/_migrate-riscos-workflow
// Migração one-shot: adiciona colunas de workflow Contribuidor→DPO em ProcessRisk.
// Idempotente — checa se já aplicou antes de rodar.
// Admin-only por segurança.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function aplicar() {
  // Checa se já existe a coluna feedbackDpo — marcador da migração aplicada
  const cols = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'ProcessRisk' AND column_name = 'feedbackDpo'
  `;
  if (cols.length > 0) {
    return { status: "ja_aplicada", colunas_existentes: true };
  }

  // Aplica em 2 statements (mais robusto que ALTER multi)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ProcessRisk"
      ALTER COLUMN "status" SET DEFAULT 'RASCUNHO',
      ADD COLUMN "feedbackDpo" TEXT,
      ADD COLUMN "createdById" TEXT,
      ADD COLUMN "reviewedById" TEXT,
      ADD COLUMN "submittedAt" TIMESTAMP(3),
      ADD COLUMN "reviewedAt" TIMESTAMP(3)
  `);
  const updated = await prisma.$executeRawUnsafe(`
    UPDATE "ProcessRisk" SET "status" = 'APROVADO' WHERE "status" = 'ATIVO'
  `);
  return { status: "aplicada_agora", riscos_legacy_migrados: updated };
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
    console.error("[_migrate-riscos-workflow] erro:", e);
    return NextResponse.json({
      ok: false,
      error: e.message,
      hint: "Veja logs do Vercel pra detalhes",
    }, { status: 500 });
  }
}

// Aceita POST também (mais semanticamente correto pra escrita)
export const POST = GET;
