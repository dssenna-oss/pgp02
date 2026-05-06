export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadPsiAuth,
  psiToDTO,
  canRejectPsi,
  PSI_FULL_INCLUDE,
} from "@/lib/psi-helpers";

/**
 * POST /api/psi/[id]/reject
 *
 * Rejeita uma PSI em revisão. Volta pra RASCUNHO com `rejectionNote`
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
  const r = await loadPsiAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const psi = await prisma.psi.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true, status: true },
  });
  if (!psi) {
    return NextResponse.json({ error: "PSI não encontrada" }, { status: 404 });
  }

  if (!canRejectPsi(user, psi)) {
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

  const updated = await prisma.psi.update({
    where: { id: params.id },
    data: {
      status: "RASCUNHO",
      rejectionNote: reason.slice(0, 500),
    },
    include: PSI_FULL_INCLUDE,
  });

  return NextResponse.json({ psi: psiToDTO(updated) });
}
