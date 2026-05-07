export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadRipdAuth,
  ripdToDTO,
  canEditRipd,
  canDeleteRipd,
  canArchiveRipd,
  ripdAccessFilter,
  type RipdData,
} from "@/lib/ripd-helpers";
import { trackLastAction, statusToCompleteness, statusIsClosedCleanly } from "@/lib/track-last-action";

const FULL_INCLUDE = {
  inventory: { select: { id: true, serviceName: true, status: true } },
  approvedBy: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  _count: { select: { versions: true } },
} as const;

/**
 * GET /api/ripd/[id]
 *
 * Devolve o RIPD completo. Aplica filtro de visibilidade:
 *   - DPO: qualquer RIPD da empresa
 *   - Contribuidor: apenas os próprios
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadRipdAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const ripd = await prisma.ripd.findFirst({
    where: { id: params.id, ...ripdAccessFilter(user) },
    include: FULL_INCLUDE,
  });
  if (!ripd) {
    return NextResponse.json({ error: "RIPD não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ripd: ripdToDTO(ripd) });
}

/**
 * PATCH /api/ripd/[id]
 *
 * Atualiza campos editáveis: title, data (RipdData), inventoryId,
 * status (apenas pra ARQUIVAR — APROVADO → ARQUIVADO; outras
 * transições passam por /submit, /approve, /reject).
 *
 * Regras (canEditRipd):
 *   - DPO: edita qualquer status diferente de APROVADO/ARQUIVADO
 *   - Contribuidor: só RIPDs próprios em RASCUNHO
 *   - Arquivamento (status="ARQUIVADO"): apenas DPO em RIPDs APROVADOS
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadRipdAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const ripd = await prisma.ripd.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true, status: true, createdById: true },
  });
  if (!ripd) {
    return NextResponse.json({ error: "RIPD não encontrado" }, { status: 404 });
  }
  // Contribuidor só edita os próprios
  if (!user.isDPO && ripd.createdById !== user.id) {
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
    if (!canArchiveRipd(user, ripd)) {
      return NextResponse.json(
        { error: "Apenas DPO pode arquivar RIPD aprovado" },
        { status: 403 }
      );
    }
    updates.status = "ARQUIVADO";
  } else {
    // Edição normal — checa permissão
    if (!canEditRipd(user, ripd)) {
      return NextResponse.json(
        {
          error:
            "Não pode editar este RIPD no status atual. Aprovados/arquivados são imutáveis; rascunhos só pelo criador ou DPO.",
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
      // Validação leve: tem que ter `v` e as 8 seções
      const d = body.data as Partial<RipdData>;
      if (d.v !== 1) {
        return NextResponse.json(
          { error: "Versão de schema do data inválida (esperado v=1)" },
          { status: 400 }
        );
      }
      const required: ReadonlyArray<keyof RipdData> = [
        "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8",
      ];
      for (const k of required) {
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
        // Garante que o inventário pertence à mesma company
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
    return NextResponse.json(
      { error: "Nada pra atualizar" },
      { status: 400 }
    );
  }

  const updated = await prisma.ripd.update({
    where: { id: params.id },
    data: updates,
    include: FULL_INCLUDE,
  });

  // CP27 Fatia 3 — registra "Continue de onde parou"
  await trackLastAction({
    userId: user.id,
    refType: "RIPD",
    refId: updated.id,
    route: `/dashboard/ripd/${updated.id}`,
    label: `RIPD "${updated.title}"`,
    completeness: statusToCompleteness(updated.status, "RIPD"),
    closedCleanly: statusIsClosedCleanly(updated.status, "RIPD"),
  });

  return NextResponse.json({ ripd: ripdToDTO(updated) });
}

/**
 * DELETE /api/ripd/[id]
 *
 * Exclui o RIPD (cascade remove RipdVersion).
 * Regras (canDeleteRipd):
 *   - DPO: qualquer RIPD da empresa
 *   - Contribuidor: só os próprios em RASCUNHO
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadRipdAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const ripd = await prisma.ripd.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true, status: true, createdById: true },
  });
  if (!ripd) {
    return NextResponse.json({ error: "RIPD não encontrado" }, { status: 404 });
  }

  if (!canDeleteRipd(user, ripd)) {
    return NextResponse.json(
      { error: "Sem permissão pra excluir este RIPD" },
      { status: 403 }
    );
  }

  await prisma.ripd.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
