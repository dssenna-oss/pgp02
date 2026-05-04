export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadActionPlanAuth,
  actionToDTO,
  computeActionStats,
  VALID_ORIGINS,
  VALID_PRIORITIES,
  VALID_STATUSES,
  ACTION_STATUS,
  ACTION_PRIORITY,
} from "@/lib/action-plan-helpers";
import { GAP_CONTROLS } from "@/lib/gap-catalog";

/**
 * GET /api/plano-acao
 *
 * Lista o Plano de Ação da org. DPO vê tudo; Contribuidor vê só as
 * ações onde é responsável (assigneeId = self).
 *
 * Devolve { items, stats } onde stats é agregado dos itens visíveis.
 */
export async function GET(_request: NextRequest) {
  const r = await loadActionPlanAuth(/* requireDPO */ false);
  if ("error" in r) return r.error;
  const { user } = r;

  const where: any = { companyId: user.companyId };
  // Contribuidor: só ações próprias
  if (!user.isDPO) where.assigneeId = user.id;

  const [actions, inventories] = await Promise.all([
    prisma.actionPlan.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { status: "asc" }, // A_FAZER (alfabético) vem primeiro
        { priority: "asc" }, // ALTA vem primeiro alfabeticamente
        { dueDate: "asc" },
      ],
    }),
    // Map id → serviceName pra UI mostrar nome do processo na ref
    prisma.dataInventory.findMany({
      where: { companyId: user.companyId },
      select: { id: true, serviceName: true },
    }),
  ]);

  // Resolver de labels pra refs polimórficas
  const inventoryById: Record<string, string> = {};
  for (const i of inventories) inventoryById[i.id] = i.serviceName;
  const gapDomainByCode: Record<string, string> = {};
  for (const c of GAP_CONTROLS) {
    gapDomainByCode[c.code] = c.domain;
  }

  const items = actions.map((a) =>
    actionToDTO(a, { gapDomainByCode, inventoryById }),
  );
  const stats = computeActionStats(actions);

  return NextResponse.json({ items, stats });
}

/**
 * POST /api/plano-acao
 *
 * Cria uma nova ação manual (DPO-only). Body:
 *   - title (obrigatório)
 *   - description, notes (opcionais)
 *   - origin (default MANUAL — quando vier de outras telas pode ser
 *     GAP/RISCO/BASES com refs preenchidos)
 *   - refGapCode | refRiskId | refInventoryId (conforme origin)
 *   - assigneeId (User da org)
 *   - dueDate (ISO string)
 *   - priority (ALTA|MEDIA|BAIXA — default MEDIA)
 *   - status (A_FAZER|EM_ANDAMENTO|CONCLUIDA|CANCELADA — default A_FAZER)
 */
export async function POST(request: NextRequest) {
  const r = await loadActionPlanAuth(/* requireDPO */ true);
  if ("error" in r) return r.error;
  const { user } = r;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json(
      { error: "Título é obrigatório" },
      { status: 400 },
    );
  }
  if (title.length > 200) {
    return NextResponse.json(
      { error: "Título muito longo (máx 200 caracteres)" },
      { status: 400 },
    );
  }

  const origin = body.origin ?? "MANUAL";
  if (!VALID_ORIGINS.has(origin)) {
    return NextResponse.json(
      { error: `Origem inválida: ${origin}` },
      { status: 400 },
    );
  }
  const priority = body.priority ?? ACTION_PRIORITY.MEDIA;
  if (!VALID_PRIORITIES.has(priority)) {
    return NextResponse.json(
      { error: `Prioridade inválida: ${priority}` },
      { status: 400 },
    );
  }
  const status = body.status ?? ACTION_STATUS.A_FAZER;
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json(
      { error: `Status inválido: ${status}` },
      { status: 400 },
    );
  }

  // Validar assigneeId pertence à mesma org (se passado)
  if (body.assigneeId) {
    const assignee = await prisma.user.findFirst({
      where: { id: body.assigneeId, companyId: user.companyId },
      select: { id: true },
    });
    if (!assignee) {
      return NextResponse.json(
        { error: "Responsável não encontrado nesta organização" },
        { status: 400 },
      );
    }
  }

  const dueDate =
    body.dueDate && typeof body.dueDate === "string"
      ? new Date(body.dueDate)
      : null;
  if (dueDate && Number.isNaN(dueDate.getTime())) {
    return NextResponse.json(
      { error: "Data de prazo inválida" },
      { status: 400 },
    );
  }

  const created = await prisma.actionPlan.create({
    data: {
      companyId: user.companyId,
      title,
      description: body.description ? String(body.description).slice(0, 5000) : null,
      notes: body.notes ? String(body.notes).slice(0, 5000) : null,
      origin,
      refGapCode: body.refGapCode ? String(body.refGapCode) : null,
      refRiskId: body.refRiskId ? String(body.refRiskId) : null,
      refInventoryId: body.refInventoryId ? String(body.refInventoryId) : null,
      assigneeId: body.assigneeId ?? null,
      dueDate,
      priority,
      status,
      completedAt: status === ACTION_STATUS.CONCLUIDA ? new Date() : null,
      createdById: user.id,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ action: actionToDTO(created) });
}
