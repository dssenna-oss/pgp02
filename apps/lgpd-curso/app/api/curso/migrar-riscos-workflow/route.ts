// GET/POST /api/curso/migrar-riscos-workflow
// Migração one-shot: adiciona colunas de workflow Contribuidor→DPO em ProcessRisk.
// Idempotente — checa se já aplicou antes de rodar.
// Admin-only por segurança.
//
// Primeira coisa que faz: descobre o nome REAL da tabela de riscos no schema
// (pode ser ProcessRisk, process_risk, processrisk, etc.).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function descobrirNomeTabela() {
  const tabelas = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name ILIKE '%risk%'
  `;
  return tabelas.map((t) => t.table_name);
}

async function listarTodasTabelas() {
  const tabelas = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  return tabelas.map((t) => t.table_name);
}

async function listarColunas(tabela: string) {
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
    tabela
  );
  return cols.map((c) => c.column_name);
}

async function aplicar(nomeTabela: string) {
  // Checa se já existe a coluna feedbackDpo — marcador da migração aplicada
  const cols = await listarColunas(nomeTabela);
  if (cols.includes("feedbackDpo") || cols.includes("feedback_dpo")) {
    return { status: "ja_aplicada", colunas: cols };
  }

  // Aplica usando o nome real da tabela
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "${nomeTabela}"
      ALTER COLUMN "status" SET DEFAULT 'RASCUNHO',
      ADD COLUMN "feedbackDpo" TEXT,
      ADD COLUMN "createdById" TEXT,
      ADD COLUMN "reviewedById" TEXT,
      ADD COLUMN "submittedAt" TIMESTAMP(3),
      ADD COLUMN "reviewedAt" TIMESTAMP(3)
  `);
  const updated = await prisma.$executeRawUnsafe(`
    UPDATE "${nomeTabela}" SET "status" = 'APROVADO' WHERE "status" = 'ATIVO'
  `);
  return { status: "aplicada_agora", riscos_legacy_migrados: updated, tabela: nomeTabela };
}

async function executar() {
  const candidatas = await descobrirNomeTabela();

  if (candidatas.length === 0) {
    // Nenhuma tabela com "risk" — diagnostico completo
    const todas = await listarTodasTabelas();
    return {
      status: "tabela_nao_encontrada",
      tabelas_disponiveis: todas,
      hint: "Nenhuma tabela com 'risk' no nome. Veja a lista completa pra identificar.",
    };
  }

  if (candidatas.length > 1) {
    return {
      status: "multiplas_candidatas",
      candidatas,
      hint: "Mais de uma tabela com 'risk' no nome. Decida manualmente qual usar.",
    };
  }

  const nome = candidatas[0];
  return await aplicar(nome);
}

export async function GET() {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
  try {
    const result = await executar();
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
