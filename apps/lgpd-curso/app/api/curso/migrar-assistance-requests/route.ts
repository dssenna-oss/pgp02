// GET/POST /api/curso/migrar-assistance-requests
// Migração idempotente: cria a tabela "assistance_requests" se não existir.
// Roda sem perigo várias vezes — usa CREATE TABLE IF NOT EXISTS.
// Admin-only.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function aplicar() {
  // Cria a tabela se não existir
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "assistance_requests" (
      "id" TEXT NOT NULL,
      "grupoId" TEXT NOT NULL,
      "requestedById" TEXT,
      "requestedByName" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "attendedAt" TIMESTAMP(3),
      "resolvedAt" TIMESTAMP(3),
      CONSTRAINT "assistance_requests_pkey" PRIMARY KEY ("id")
    )
  `);

  // Index pra polling rápido por grupo+status
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "assistance_requests_grupoId_status_idx"
      ON "assistance_requests"("grupoId", "status")
  `);

  // FK pro curso_grupos (idempotente — só adiciona se não existe)
  const fkExiste = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
    SELECT COUNT(*)::bigint AS count
      FROM information_schema.table_constraints
     WHERE constraint_name = 'assistance_requests_grupoId_fkey'
       AND table_name = 'assistance_requests'
  `);
  if (fkExiste[0]?.count === 0n) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "assistance_requests"
        ADD CONSTRAINT "assistance_requests_grupoId_fkey"
        FOREIGN KEY ("grupoId") REFERENCES "curso_grupos"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'assistance_requests'`
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
    console.error("[migrar-assistance-requests] erro:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export const POST = GET;
