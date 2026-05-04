export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadActionPlanAuth } from "@/lib/action-plan-helpers";
import {
  buildPlanoAcaoXLSX,
  suggestPlanoAcaoFilename,
  type ExportAction,
} from "@/lib/plano-acao-export";
import { GAP_CONTROLS } from "@/lib/gap-catalog";

/**
 * GET /api/plano-acao/export
 *
 * Exporta XLSX consolidado do Plano de Ação (DPO-only). 1 linha por
 * ação, ordenada por status (A_FAZER → CANCELADA) e depois prazo.
 */
export async function GET(_request: NextRequest) {
  try {
    const r = await loadActionPlanAuth(/* requireDPO */ true);
    if ("error" in r) return r.error;
    const { user } = r;

    const [company, actions, inventories] = await Promise.all([
      prisma.company.findUnique({
        where: { id: user.companyId },
        select: { companyName: true },
      }),
      prisma.actionPlan.findMany({
        where: { companyId: user.companyId },
        include: {
          assignee: { select: { name: true, email: true } },
          createdBy: { select: { name: true, email: true } },
        },
        orderBy: [{ status: "asc" }, { priority: "asc" }, { dueDate: "asc" }],
      }),
      prisma.dataInventory.findMany({
        where: { companyId: user.companyId },
        select: { id: true, serviceName: true },
      }),
    ]);

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const inventoryNameById: Record<string, string> = {};
    for (const i of inventories) inventoryNameById[i.id] = i.serviceName;
    const gapDomainByCode: Record<string, string> = {};
    for (const c of GAP_CONTROLS) gapDomainByCode[c.code] = c.domain;

    const exportActions: ExportAction[] = actions.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      notes: a.notes,
      origin: a.origin,
      refGapCode: a.refGapCode,
      refRiskId: a.refRiskId,
      refInventoryId: a.refInventoryId,
      assignee: a.assignee,
      dueDate: a.dueDate,
      priority: a.priority,
      status: a.status,
      completedAt: a.completedAt,
      createdBy: a.createdBy,
      createdAt: a.createdAt,
    }));

    const buf = buildPlanoAcaoXLSX({
      companyName: company.companyName,
      actions: exportActions,
      inventoryNameById,
      gapDomainByCode,
    });
    const filename = suggestPlanoAcaoFilename(company.companyName);

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[/api/plano-acao/export] erro:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 },
    );
  }
}
