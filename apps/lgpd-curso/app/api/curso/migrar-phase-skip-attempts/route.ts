// GET/POST /api/curso/migrar-phase-skip-attempts
// Migração idempotente: cria a tabela "phase_skip_attempts" se não existir.
// Roda sem perigo várias vezes — usa CREATE TABLE IF NOT EXISTS.
// Admin-only.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function aplicar() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "phase_skip_attempts" (
      "id" TEXT NOT NULL,
      "grupoId" TEXT NOT NULL,
      "requestedById" TEXT,
      "requestedByName" TEXT,
      "faseTentada" TEXT NOT NULL,
      "acaoTentada" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "acknowledgedAt" TIMESTAMP(3),
      CONSTRAINT "phase_skip_attempts_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "phase_skip_attempts_grupoId_status_idx"
      ON "phase_skip_attempts"("grupoId", "status")
  `);

  const fkExiste = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
    SELECT COUNT(*)::bigint AS count
      FROM information_schema.table_constraints
     WHERE constraint_name = 'phase_skip_attempts_grupoId_fkey'
       AND table_name = 'phase_skip_attempts'
  `);
  if (fkExiste[0]?.count === 0n) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "phase_skip_attempts"
        ADD CONSTRAINT "phase_skip_attempts_grupoId_fkey"
        FOREIGN KEY ("grupoId") REFERENCES "curso_grupos"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'phase_skip_attempts'`
  );

  return { colunas: cols.map((c) => c.column_name) };
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
    console.error("[migrar-phase-skip-attempts] erro:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export const POST = GET;
