export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadPsiAuth,
  psiToDTO,
  canSubmitPsi,
  psiCompleteness,
  normalizePsiData,
  PSI_FULL_INCLUDE,
} from "@/lib/psi-helpers";

/**
 * POST /api/psi/[id]/submit
 *
 * Envia a PSI pra revisão do DPO.
 * Transição: RASCUNHO → EM_REVISAO. Limpa rejectionNote.
 *
 * Recusa o envio se a completude geral está abaixo de 50% — a PSI
 * tem 7 seções e mandar metade vazio pra DPO não faz sentido.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadPsiAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const psi = await prisma.psi.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true, status: true, createdById: true, data: true },
  });
  if (!psi) {
    return NextResponse.json({ error: "PSI não encontrada" }, { status: 404 });
  }

  if (!canSubmitPsi(user, psi)) {
    return NextResponse.json(
      {
        error:
          "Apenas o criador pode enviar pra revisão, e somente em rascunho.",
      },
      { status: 403 }
    );
  }

  const data = normalizePsiData(psi.data);
  const completeness = psiCompleteness(data);
  if (completeness.overall < 0.5) {
    return NextResponse.json(
      {
        error:
          "PSI muito incompleta pra revisão (completude geral abaixo de 50%). Preencha mais seções antes de submeter.",
      },
      { status: 400 }
    );
  }

  const updated = await prisma.psi.update({
    where: { id: params.id },
    data: { status: "EM_REVISAO", rejectionNote: null },
    include: PSI_FULL_INCLUDE,
  });

  return NextResponse.json({ psi: psiToDTO(updated) });
}
