// GET/POST /api/curso/migrar-slug-turmas
// Solução D — Slug por turma (isolamento total).
//
// Migração idempotente:
//   1. Adiciona colunas `slug` (String) e `proximoCurso` (Boolean) em curso_turmas.
//   2. Pra cada turma com slug vazio: gera slug a partir do nome.
//   3. Renomeia emails dos users vinculados àquela turma:
//      `dpo.g1@curso.lgpd` → `dpo.g1.{slug}@curso.lgpd`
//
// Admin-only. Pode rodar várias vezes — idempotente.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { slugifyTurma } from "@/lib/slugify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function aplicar() {
  // 1. Garante que as colunas existem
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'curso_turmas'`
  );
  const nomes = new Set(cols.map((c) => c.column_name));
  const colunasAdicionadas: string[] = [];

  if (!nomes.has("slug")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "curso_turmas" ADD COLUMN "slug" TEXT NOT NULL DEFAULT ''`
    );
    colunasAdicionadas.push("slug");
  }
  if (!nomes.has("proximoCurso")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "curso_turmas" ADD COLUMN "proximoCurso" BOOLEAN NOT NULL DEFAULT false`
    );
    colunasAdicionadas.push("proximoCurso");
  }

  // 2. Backfill: gera slug pras turmas que ainda têm slug vazio
  const turmasSemSlug = await prisma.cursoTurma.findMany({
    where: { slug: "" },
    select: {
      id: true, nome: true,
      grupos: { select: { companyId: true } },
    },
  });

  const renomeacoes: Array<{ turma: string; slug: string; emailsAtualizados: number }> = [];

  for (const t of turmasSemSlug) {
    const slug = slugifyTurma(t.nome);
    if (!slug) continue;

    // Pega todos os users das companies dessa turma
    const companyIds = t.grupos.map((g) => g.companyId);
    if (companyIds.length === 0) {
      // Turma sem grupos — só atualiza slug
      await prisma.cursoTurma.update({ where: { id: t.id }, data: { slug } });
      renomeacoes.push({ turma: t.nome, slug, emailsAtualizados: 0 });
      continue;
    }

    const users = await prisma.user.findMany({
      where: { companyId: { in: companyIds } },
      select: { id: true, email: true },
    });

    // Renomeia emails: padrão antigo `{prefix}.gN@curso.lgpd` → `{prefix}.gN.{slug}@curso.lgpd`.
    // Se o email já tem o slug (idempotente), pula.
    let atualizados = 0;
    for (const u of users) {
      if (u.email.endsWith(`.${slug}@curso.lgpd`)) continue; // já renomeado
      const novoEmail = u.email.replace(/@curso\.lgpd$/, `.${slug}@curso.lgpd`);
      if (novoEmail === u.email) continue;
      try {
        await prisma.user.update({ where: { id: u.id }, data: { email: novoEmail } });
        atualizados++;
      } catch (e: any) {
        console.error(`[migrar-slug] falha renomeando ${u.email}:`, e?.message);
      }
    }

    // Atualiza slug da turma
    await prisma.cursoTurma.update({ where: { id: t.id }, data: { slug } });
    renomeacoes.push({ turma: t.nome, slug, emailsAtualizados: atualizados });
  }

  return {
    status: colunasAdicionadas.length > 0 || renomeacoes.length > 0 ? "aplicada_agora" : "ja_completa",
    colunasAdicionadas,
    renomeacoes,
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
    console.error("[migrar-slug-turmas] erro:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export const POST = GET;
