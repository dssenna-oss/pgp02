// GET/POST /api/curso/migrar-pri
// Migração idempotente: cria 2 tabelas novas pra Plano de Resposta a
// Incidentes (PRI): pri_membros_equipe + pri_raci. Admin-only.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TABELAS_DESEJADAS: Array<{ nome: string; createSql: string }> = [
  {
    nome: "pri_membros_equipe",
    createSql: `
      CREATE TABLE "pri_membros_equipe" (
        "id" TEXT NOT NULL,
        "companyId" TEXT NOT NULL,
        "nome" TEXT NOT NULL,
        "papel" TEXT NOT NULL,
        "contato24h" TEXT,
        "email" TEXT,
        "cobertura" TEXT,
        "observacao" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "pri_membros_equipe_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "pri_membros_equipe_companyId_fkey" FOREIGN KEY ("companyId")
          REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE INDEX "pri_membros_equipe_companyId_idx" ON "pri_membros_equipe"("companyId");
    `,
  },
  {
    nome: "pri_raci",
    createSql: `
      CREATE TABLE "pri_raci" (
        "id" TEXT NOT NULL,
        "companyId" TEXT NOT NULL,
        "etapaNist" TEXT NOT NULL,
        "papel" TEXT NOT NULL,
        "tipo" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "pri_raci_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "pri_raci_companyId_fkey" FOREIGN KEY ("companyId")
          REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE UNIQUE INDEX "pri_raci_companyId_etapaNist_papel_tipo_key"
        ON "pri_raci"("companyId", "etapaNist", "papel", "tipo");
      CREATE INDEX "pri_raci_companyId_idx" ON "pri_raci"("companyId");
    `,
  },
];

async function aplicar() {
  const tabelasExistentes = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  );
  const nomes = new Set(tabelasExistentes.map((t) => t.table_name));
  const aplicadas: string[] = [];

  for (const t of TABELAS_DESEJADAS) {
    if (!nomes.has(t.nome)) {
      // executeRawUnsafe não aceita múltiplos statements numa string em PG.
      // Dividimos por ";" e executamos um a um.
      const stmts = t.createSql.split(";").map((s) => s.trim()).filter(Boolean);
      for (const stmt of stmts) {
        await prisma.$executeRawUnsafe(stmt);
      }
      aplicadas.push(t.nome);
    }
  }

  const finais = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'pri_%'`
  );

  return {
    status: aplicadas.length > 0 ? "aplicada_agora" : "ja_completa",
    aplicadas,
    tabelas_pri_existentes: finais.map((t) => t.table_name),
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
    console.error("[migrar-pri] erro:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export const POST = GET;
