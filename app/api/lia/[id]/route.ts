export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadLiaAuth,
  liaToDTO,
  canEditLia,
  canDeleteLia,
  canArchiveLia,
  liaAccessFilter,
  LIA_FULL_INCLUDE,
  type LiaData,
} from "@/lib/lia-helpers";
import { trackLastAction, statusToCompleteness, statusIsClosedCleanly } from "@/lib/track-last-action";

/**
 * GET /api/lia/[id]
 *
 * Devolve a LIA completa. Aplica filtro de visibilidade:
 *   - DPO: qualquer LIA da empresa
 *   - Contribuidor: apenas as próprias
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadLiaAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const lia = await prisma.lia.findFirst({
    where: { id: params.id, ...liaAccessFilter(user) },
    include: LIA_FULL_INCLUDE,
  });
  if (!lia) {
    return NextResponse.json({ error: "LIA não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ lia: liaToDTO(lia) });
}

/**
 * PATCH /api/lia/[id]
 *
 * Atualiza campos editáveis: title, data (LiaData), inventoryId,
 * status (apenas pra ARQUIVAR — APROVADO → ARQUIVADO; outras
 * transições passam por /submit, /approve, /reject).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadLiaAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const lia = await prisma.lia.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true, status: true, createdById: true },
  });
  if (!lia) {
    return NextResponse.json({ error: "LIA não encontrada" }, { status: 404 });
  }
  if (!user.isDPO && lia.createdById !== user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  // Arquivamento (DPO em APROVADO)
  if (body.status === "ARQUIVADO") {
    if (!canArchiveLia(user, lia)) {
      return NextResponse.json(
        { error: "Apenas DPO pode arquivar LIA aprovada" },
        { status: 403 }
      );
    }
    updates.status = "ARQUIVADO";
  } else {
    if (!canEditLia(user, lia)) {
      return NextResponse.json(
        {
          error:
            "Não pode editar esta LIA no status atual. Arquivadas são imutáveis; rascunhos só pelo criador ou DPO.",
        },
        { status: 403 }
      );
    }
    if (typeof body.title === "string") {
      const t = body.title.trim();
      if (!t) {
        return NextResponse.json(
          { error: "Título não pode ficar vazio" },
          { status: 400 }
        );
      }
      updates.title = t.slice(0, 200);
    }
    if (body.data && typeof body.data === "object") {
      const d = body.data as Partial<LiaData>;
      if (d.v !== 1) {
        return NextResponse.json(
          { error: "Versão de schema do data inválida (esperado v=1)" },
          { status: 400 }
        );
      }
      for (const k of ["s1", "s2", "s3"] as const) {
        if (!(k in d)) {
          return NextResponse.json(
            { error: `Seção ${k} ausente no data` },
            { status: 400 }
          );
        }
      }
      updates.data = body.data;
    }
    if ("inventoryId" in body) {
      const inv = body.inventoryId;
      if (inv === null) {
        updates.inventoryId = null;
      } else if (typeof inv === "string" && inv.trim()) {
        const exists = await prisma.dataInventory.findFirst({
          where: { id: inv, companyId: user.companyId },
          select: { id: true },
        });
        if (!exists) {
          return NextResponse.json(
            { error: "Processo do inventário não encontrado nesta empresa" },
            { status: 404 }
          );
        }
        updates.inventoryId = inv;
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 });
  }

  const updated = await prisma.lia.update({
    where: { id: params.id },
    data: updates,
    include: LIA_FULL_INCLUDE,
  });

  // CP27 Fatia 3 — registra "Continue de onde parou"
  await trackLastAction({
    userId: user.id,
    refType: "LIA",
    refId: updated.id,
    route: `/dashboard/lia/${updated.id}`,
    label: `LIA "${updated.title}"`,
    completeness: statusToCompleteness(updated.status, "LIA"),
    closedCleanly: statusIsClosedCleanly(updated.status, "LIA"),
  });

  return NextResponse.json({ lia: liaToDTO(updated) });
}

/**
 * DELETE /api/lia/[id]
 *
 * Exclui a LIA (cascade remove LiaVersion).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadLiaAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const lia = await prisma.lia.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true, status: true, createdById: true },
  });
  if (!lia) {
    return NextResponse.json({ error: "LIA não encontrada" }, { status: 404 });
  }

  if (!canDeleteLia(user, lia)) {
    return NextResponse.json(
      { error: "Sem permissão pra excluir esta LIA" },
      { status: 403 }
    );
  }

  await prisma.lia.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
