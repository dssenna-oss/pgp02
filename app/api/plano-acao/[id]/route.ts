export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadActionPlanAuth,
  actionToDTO,
  VALID_PRIORITIES,
  VALID_STATUSES,
  ACTION_STATUS,
} from "@/lib/action-plan-helpers";
import { trackLastAction, statusIsClosedCleanly } from "@/lib/track-last-action";

/**
 * GET /api/plano-acao/[id]      → 1 ação
 * PATCH /api/plano-acao/[id]    → atualiza campos
 * DELETE /api/plano-acao/[id]   → DPO-only
 *
 * PATCH: Contribuidor pode editar SUAS próprias ações (apenas status e
 * notes). DPO pode editar qualquer campo de qualquer ação da org.
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await loadActionPlanAuth(/* requireDPO */ false);
  if ("error" in r) return r.error;
  const { user } = r;

  if (!user.isDPO) {
    return NextResponse.json(
      { error: "Apenas DPO acessa o Plano de Ação" },
      { status: 403 },
    );
  }
  const { id } = await params;

  const a = await prisma.actionPlan.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!a) {
    return NextResponse.json({ error: "Ação não encontrada" }, { status: 404 });
  }
  // Contribuidor: só pode ver as próprias
  if (!user.isDPO && a.assigneeId !== user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }
  return NextResponse.json({ action: actionToDTO(a) });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await loadActionPlanAuth(/* requireDPO */ false);
  if ("error" in r) return r.error;
  const { user } = r;

  if (!user.isDPO) {
    return NextResponse.json(
      { error: "Apenas DPO acessa o Plano de Ação" },
      { status: 403 },
    );
  }
  const { id } = await params;

  const existing = await prisma.actionPlan.findFirst({
    where: { id, companyId: user.companyId },
    select: { id: true, assigneeId: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Ação não encontrada" }, { status: 404 });
  }

  // Contribuidor só edita as próprias E só status + notes
  const isOwner = existing.assigneeId === user.id;
  const canFullEdit = user.isDPO;
  const canRestrictedEdit = isOwner;
  if (!canFullEdit && !canRestrictedEdit) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const data: any = {};

  if (canFullEdit) {
    if (body.title !== undefined) {
      const t = String(body.title).trim();
      if (!t) {
        return NextResponse.json(
          { error: "Título não pode ficar vazio" },
          { status: 400 },
        );
      }
      data.title = t.slice(0, 200);
    }
    if (body.description !== undefined) {
      data.description = body.description
        ? String(body.description).slice(0, 5000)
        : null;
    }
    if (body.priority !== undefined) {
      if (!VALID_PRIORITIES.has(body.priority)) {
        return NextResponse.json(
          { error: `Prioridade inválida: ${body.priority}` },
          { status: 400 },
        );
      }
      data.priority = body.priority;
    }
    if (body.assigneeId !== undefined) {
      if (body.assigneeId) {
        const u = await prisma.user.findFirst({
          where: { id: body.assigneeId, companyId: user.companyId },
          select: { id: true },
        });
        if (!u) {
          return NextResponse.json(
            { error: "Responsável não encontrado nesta organização" },
            { status: 400 },
          );
        }
      }
      data.assigneeId = body.assigneeId ?? null;
    }
    if (body.dueDate !== undefined) {
      if (body.dueDate === null) {
        data.dueDate = null;
      } else {
        const d = new Date(String(body.dueDate));
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json(
            { error: "Data de prazo inválida" },
            { status: 400 },
          );
        }
        data.dueDate = d;
      }
    }
  }

  // Status: tanto DPO quanto owner podem mudar
  if (body.status !== undefined) {
    if (!VALID_STATUSES.has(body.status)) {
      return NextResponse.json(
        { error: `Status inválido: ${body.status}` },
        { status: 400 },
      );
    }
    data.status = body.status;
    // Marca completedAt na transição pra CONCLUIDA, limpa se sair
    if (body.status === ACTION_STATUS.CONCLUIDA) {
      if (existing.status !== ACTION_STATUS.CONCLUIDA) {
        data.completedAt = new Date();
      }
    } else {
      data.completedAt = null;
    }
  }

  // Notes: tanto DPO quanto owner
  if (body.notes !== undefined) {
    data.notes = body.notes ? String(body.notes).slice(0, 5000) : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Nenhum campo válido pra atualizar" },
      { status: 400 },
    );
  }

  const updated = await prisma.actionPlan.update({
    where: { id },
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  // CP27 Fatia 3 — registra "Continue de onde parou"
  await trackLastAction({
    userId: user.id,
    refType: "PLANO_ACAO",
    refId: updated.id,
    route: `/dashboard/plano-acao`,
    label: `Ação "${updated.title}"`,
    completeness: null,
    closedCleanly: statusIsClosedCleanly(updated.status, "PLANO_ACAO"),
  });

  return NextResponse.json({ action: actionToDTO(updated) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await loadActionPlanAuth(/* requireDPO */ true);
  if ("error" in r) return r.error;
  const { user } = r;

  if (!user.isDPO) {
    return NextResponse.json(
      { error: "Apenas DPO acessa o Plano de Ação" },
      { status: 403 },
    );
  }
  const { id } = await params;

  const existing = await prisma.actionPlan.findFirst({
    where: { id, companyId: user.companyId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Ação não encontrada" }, { status: 404 });
  }
  await prisma.actionPlan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
