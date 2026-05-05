export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadOperatorAuth,
  canEditOperator,
  operatorToDTO,
  deriveContractStatus,
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
 * POST /api/operadores/[id]/processes
 *
 * Vincula um processo do Inventário ao operador. Apenas DPO.
 *
 * Body: { dataInventoryId, activityDescription? }
 *
 * Idempotente: se já existe vínculo, devolve 409 com o link existente.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  if (!canEditOperator(user)) {
    return NextResponse.json(
      { error: "Apenas DPO pode vincular processos" },
      { status: 403 }
    );
  }

  const op = await prisma.operator.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true },
  });
  if (!op) {
    return NextResponse.json(
      { error: "Operador não encontrado" },
      { status: 404 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const dataInventoryId = String(body?.dataInventoryId ?? "").trim();
  if (!dataInventoryId) {
    return NextResponse.json(
      { error: "dataInventoryId é obrigatório" },
      { status: 400 }
    );
  }

  // Garante que o processo pertence à mesma company
  const inv = await prisma.dataInventory.findFirst({
    where: { id: dataInventoryId, companyId: user.companyId },
    select: { id: true },
  });
  if (!inv) {
    return NextResponse.json(
      { error: "Processo do Inventário não encontrado nesta empresa" },
      { status: 404 }
    );
  }

  // Idempotência: 409 se já existe
  const existing = await prisma.operatorProcessLink.findFirst({
    where: { operatorId: params.id, dataInventoryId },
  });
  if (existing) {
    return NextResponse.json(
      {
        error: "Processo já está vinculado a este operador",
        existing: { id: existing.id },
      },
      { status: 409 }
    );
  }

  const desc = body?.activityDescription
    ? String(body.activityDescription).slice(0, 1000)
    : null;

  await prisma.operatorProcessLink.create({
    data: {
      operatorId: params.id,
      dataInventoryId,
      activityDescription: desc,
    },
  });

  // Devolve o operador atualizado pra UI poder substituir o estado
  const updated = await prisma.operator.findFirst({
    where: { id: params.id },
    include: FULL_INCLUDE,
  });
  if (!updated) {
    return NextResponse.json(
      { error: "Operador desapareceu durante atualização" },
      { status: 500 }
    );
  }
  const dto = operatorToDTO(updated);
  return NextResponse.json(
    {
      operator: {
        ...dto,
        contractStatus: deriveContractStatus(
          updated.contractStatus,
          updated.contractExpiresAt
        ),
      },
    },
    { status: 201 }
  );
}

/**
 * DELETE /api/operadores/[id]/processes?linkId=<id>
 *
 * Desvincula um processo do operador. Apenas DPO.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  if (!canEditOperator(user)) {
    return NextResponse.json(
      { error: "Apenas DPO pode desvincular processos" },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const linkId = url.searchParams.get("linkId");
  if (!linkId) {
    return NextResponse.json(
      { error: "Parâmetro `linkId` obrigatório" },
      { status: 400 }
    );
  }

  // Garante que o link pertence ao operador certo + company certa
  const link = await prisma.operatorProcessLink.findFirst({
    where: {
      id: linkId,
      operatorId: params.id,
      operator: { companyId: user.companyId },
    },
    select: { id: true },
  });
  if (!link) {
    return NextResponse.json(
      { error: "Vínculo não encontrado" },
      { status: 404 }
    );
  }

  await prisma.operatorProcessLink.delete({ where: { id: linkId } });
  return NextResponse.json({ ok: true });
}
