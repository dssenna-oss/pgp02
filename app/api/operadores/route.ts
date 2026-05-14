export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadOperatorAuth,
  operatorAccessFilter,
  operatorToDTO,
  computeOperatorStats,
  canEditOperator,
  deriveContractStatus,
  VALID_RELATION_TYPES,
} from "@/lib/operadores-helpers";

const FULL_INCLUDE = {
  responsible: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  processLinks: {
    include: {
      dataInventory: {
        select: { id: true, serviceName: true, status: true },
      },
    },
  },
} as const;

/**
 * GET /api/operadores
 *
 * Lista operadores da org. Filtragem por papel:
 *   - DPO: todos
 *   - Contribuidor: somente operadores vinculados a processos próprios
 *
 * Aplica deriveContractStatus() em cada item antes de devolver — DPO vê
 * status "VENCENDO_90D" sem precisar batch-update.
 */
export async function GET(_request: NextRequest) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  if (!user.isDPO) {
    return NextResponse.json(
      { error: "Apenas DPO acessa Operadores" },
      { status: 403 },
    );
  }


  const ops = await prisma.operator.findMany({
    where: operatorAccessFilter(user),
    include: FULL_INCLUDE,
    orderBy: [{ contractRiskClass: "asc" }, { name: "asc" }],
  });

  // Override status com base em expiresAt (cálculo dinâmico)
  const items = ops.map((o) => {
    const dto = operatorToDTO(o);
    return {
      ...dto,
      contractStatus: deriveContractStatus(o.contractStatus, o.contractExpiresAt),
    };
  });

  const stats = computeOperatorStats(
    items.map((i) => ({
      relationType: i.relationType,
      contractRiskClass: i.contractRiskClass,
      contractStatus: i.contractStatus,
      lgpdComplianceStatus: i.lgpdComplianceStatus,
    }))
  );

  return NextResponse.json({ items, stats });
}

/**
 * POST /api/operadores
 *
 * Cria novo operador (DPO-only). Body mínimo: { name }.
 * Restante é preenchido depois pelo encarregado via tela de detalhe.
 */
export async function POST(request: NextRequest) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  if (!user.isDPO) {
    return NextResponse.json(
      { error: "Apenas DPO acessa Operadores" },
      { status: 403 },
    );
  }


  if (!canEditOperator(user)) {
    return NextResponse.json(
      { error: "Apenas DPO pode cadastrar operadores" },
      { status: 403 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json(
      { error: "Razão social é obrigatória" },
      { status: 400 }
    );
  }
  if (name.length > 200) {
    return NextResponse.json(
      { error: "Razão social tem no máximo 200 caracteres" },
      { status: 400 }
    );
  }

  const relationType =
    body?.relationType && VALID_RELATION_TYPES.has(body.relationType)
      ? body.relationType
      : "INDEFINIDO";

  // Campos opcionais aceitos no create (Checkpoint 14 H1 — D2: import
  // de PDF pré-preenche dados extraídos por regex).
  const extras: Record<string, unknown> = {};
  if (body?.contractOriginalDate) {
    const d = new Date(body.contractOriginalDate);
    if (!Number.isNaN(d.getTime())) extras.contractOriginalDate = d;
  }
  if (body?.contractExpiresAt) {
    const d = new Date(body.contractExpiresAt);
    if (!Number.isNaN(d.getTime())) extras.contractExpiresAt = d;
  }
  if (typeof body?.hasPrivacyClause === "boolean") {
    extras.hasPrivacyClause = body.hasPrivacyClause;
  }
  if (typeof body?.hasIncidentClause === "boolean") {
    extras.hasIncidentClause = body.hasIncidentClause;
  }
  if (Array.isArray(body?.contractAttachments)) {
    extras.contractAttachments = body.contractAttachments;
  }

  const created = await prisma.operator.create({
    data: {
      companyId: user.companyId,
      name: name.slice(0, 200),
      tradeName: body?.tradeName ? String(body.tradeName).slice(0, 200) : null,
      cnpj: body?.cnpj ? String(body.cnpj).slice(0, 30) : null,
      operatorType: body?.operatorType
        ? String(body.operatorType).slice(0, 30)
        : null,
      relationType,
      createdById: user.id,
      ...extras,
    },
    include: FULL_INCLUDE,
  });

  // Vínculo inicial com processo do Inventário (Checkpoint 14 G4 —
  // auto-import a partir da sugestão "Cadastrar como Operador").
  // O DPO/Contribuidor só consegue passar `linkInventoryId` se tiver
  // acesso ao processo (validamos abaixo).
  if (body?.linkInventoryId) {
    const invId = String(body.linkInventoryId);
    const inv = await prisma.dataInventory.findFirst({
      where: { id: invId, companyId: user.companyId },
      select: { id: true, createdById: true },
    });
    if (inv) {
      // Contribuidor só pode vincular processos próprios
      const allowed = user.isDPO || inv.createdById === user.id;
      if (allowed) {
        await prisma.operatorProcessLink.create({
          data: {
            operatorId: created.id,
            dataInventoryId: invId,
            activityDescription: body.linkActivityDescription
              ? String(body.linkActivityDescription).slice(0, 1000)
              : null,
          },
        });
      }
    }
  }

  // Re-buscar com processLinks atualizados pra UI mostrar o vínculo
  const final = await prisma.operator.findUnique({
    where: { id: created.id },
    include: FULL_INCLUDE,
  });

  return NextResponse.json(
    { operator: final ? operatorToDTO(final) : operatorToDTO(created) },
    { status: 201 },
  );
}
