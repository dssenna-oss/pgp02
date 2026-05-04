export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadRipdAuth,
  ripdToDTO,
  canRejectRipd,
} from "@/lib/ripd-helpers";

const FULL_INCLUDE = {
  inventory: { select: { id: true, serviceName: true, status: true } },
  approvedBy: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  _count: { select: { versions: true } },
} as const;

/**
 * POST /api/ripd/[id]/reject
 *
 * Devolve o RIPD pro criador ajustar.
 * Transição: EM_REVISAO → RASCUNHO + grava `rejectionNote` (motivo).
 *
 * Quem pode: apenas DPO. Apenas em status EM_REVISAO.
 *
 * Body:
 *   - rejectionNote (obrigatório, 5–1000 chars) — motivo da devolução.
 */
export async function POST(
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

  if (!canRejectRipd(user, ripd)) {
    return NextResponse.json(
      { error: "Apenas DPO pode rejeitar, e somente em revisão." },
      { status: 403 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const note = String(body?.rejectionNote ?? "").trim();
  if (note.length < 5) {
    return NextResponse.json(
      { error: "Motivo da rejeição deve ter pelo menos 5 caracteres" },
      { status: 400 }
    );
  }

  const updated = await prisma.ripd.update({
    where: { id: params.id },
    data: {
      status: "RASCUNHO",
      rejectionNote: note.slice(0, 1000),
    },
    include: FULL_INCLUDE,
  });

  return NextResponse.json({ ripd: ripdToDTO(updated) });
}
