export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadCapacitacaoAuth,
  canManageCapacitacao,
  EIXO_LABELS,
} from "@/lib/capacitacao-helpers";
import { CAPACITACAO_TASK_CATALOG } from "@/lib/capacitacao-tasks-catalog";

/**
 * POST /api/capacitacao/import-tasks
 *
 * Importa o catálogo de 18 tarefas de sensibilização pra `/dashboard/tarefas`
 * do DPO logado. Idempotente — não cria duplicatas se as tarefas já existem
 * (dedup por título exato + dono).
 *
 * Cada tarefa criada recebe:
 *   - userId = DPO logado
 *   - companyId = empresa do DPO
 *   - markers JSON com ["Capacitação", "<eixo>"]
 *   - description: contexto operacional + base legal
 */
export async function POST() {
  const r = await loadCapacitacaoAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  if (!canManageCapacitacao(user.role)) {
    return NextResponse.json(
      { error: "Apenas DPOs podem importar o checklist" },
      { status: 403 },
    );
  }

  // Lista os títulos já existentes (do mesmo dono) pra evitar duplicar
  const existing = await prisma.task.findMany({
    where: { userId: user.id, companyId: user.companyId },
    select: { title: true },
  });
  const existingTitles = new Set(existing.map((t) => t.title));

  let created = 0;
  let skipped = 0;
  const createdTitles: string[] = [];

  for (const tpl of CAPACITACAO_TASK_CATALOG) {
    if (existingTitles.has(tpl.title)) {
      skipped++;
      continue;
    }
    const eixoLabel = EIXO_LABELS[tpl.eixo];
    const markers = JSON.stringify(["Capacitação", eixoLabel]);
    await prisma.task.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        title: tpl.title,
        description: tpl.description,
        status: "A_FAZER",
        priority: "MEDIA",
        markers,
      },
    });
    created++;
    createdTitles.push(tpl.title);
  }

  return NextResponse.json({
    created,
    skipped,
    total: CAPACITACAO_TASK_CATALOG.length,
    createdTitles,
  });
}
