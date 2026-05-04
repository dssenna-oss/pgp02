export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadRipdAuth,
  ripdToDTO,
  canSubmitRipd,
} from "@/lib/ripd-helpers";

const FULL_INCLUDE = {
  inventory: { select: { id: true, serviceName: true, status: true } },
  approvedBy: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  _count: { select: { versions: true } },
} as const;

/**
 * POST /api/ripd/[id]/submit
 *
 * Envia o RIPD pra revisão do DPO.
 * Transição: RASCUNHO → EM_REVISAO.
 *
 * Quem pode: apenas o criador (qualquer papel) e somente em status
 * RASCUNHO. DPO normalmente aprova direto via /approve, mas pode
 * também enviar pra revisão de outro DPO (mesma regra).
 *
 * Limpa `rejectionNote` na transição.
 */
export async function POST(
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

  if (!canSubmitRipd(user, ripd)) {
    return NextResponse.json(
      {
        error:
          "Apenas o criador pode enviar pra revisão, e somente em rascunho.",
      },
      { status: 403 }
    );
  }

  const updated = await prisma.ripd.update({
    where: { id: params.id },
    data: {
      status: "EM_REVISAO",
      rejectionNote: null,
    },
    include: FULL_INCLUDE,
  });

  return NextResponse.json({ ripd: ripdToDTO(updated) });
}
