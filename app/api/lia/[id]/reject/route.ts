export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadLiaAuth,
  liaToDTO,
  canRejectLia,
  LIA_FULL_INCLUDE,
} from "@/lib/lia-helpers";

/**
 * POST /api/lia/[id]/reject
 *
 * Rejeita uma LIA em revisão. Volta pra RASCUNHO com `rejectionNote`
 * preenchida (motivo visível pro criador no editor).
 *
 * Transição: EM_REVISAO → RASCUNHO.
 *
 * Quem pode: apenas DPO.
 *
 * Body obrigatório:
 *   - reason (string) — motivo da rejeição (mínimo 5 chars).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadLiaAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const lia = await prisma.lia.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true, status: true },
  });
  if (!lia) {
    return NextResponse.json({ error: "LIA não encontrada" }, { status: 404 });
  }

  if (!canRejectLia(user, lia)) {
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

  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 5) {
    return NextResponse.json(
      { error: "Motivo da rejeição é obrigatório (mínimo 5 caracteres)" },
      { status: 400 }
    );
  }

  const updated = await prisma.lia.update({
    where: { id: params.id },
    data: {
      status: "RASCUNHO",
      rejectionNote: reason.slice(0, 500),
    },
    include: LIA_FULL_INCLUDE,
  });

  return NextResponse.json({ lia: liaToDTO(updated) });
}
