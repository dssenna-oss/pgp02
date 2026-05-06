export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadLiaAuth,
  liaToDTO,
  canSubmitLia,
  liaIsBlocked,
  normalizeLiaData,
  LIA_FULL_INCLUDE,
} from "@/lib/lia-helpers";

/**
 * POST /api/lia/[id]/submit
 *
 * Envia a LIA pra revisão do DPO.
 * Transição: RASCUNHO → EM_REVISAO. Limpa rejectionNote.
 *
 * Bloqueio adicional específico de LIA: se as 2 verificações
 * estruturais (dados sensíveis / criança-adolescente) ainda não foram
 * respondidas, recusa o envio. Se vieram marcadas como "sim", também
 * recusa — o tratamento não pode usar Art. 7º IX.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadLiaAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const lia = await prisma.lia.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true, status: true, createdById: true, data: true },
  });
  if (!lia) {
    return NextResponse.json({ error: "LIA não encontrada" }, { status: 404 });
  }

  if (!canSubmitLia(user, lia)) {
    return NextResponse.json(
      {
        error:
          "Apenas o criador pode enviar pra revisão, e somente em rascunho.",
      },
      { status: 403 }
    );
  }

  const data = normalizeLiaData(lia.data);
  if (data.s2.dadosSensiveis === null || data.s2.criancaAdolescente === null) {
    return NextResponse.json(
      {
        error:
          "Antes de enviar, responda as duas verificações estruturais da Etapa 2 (dados sensíveis + crianças/adolescentes).",
      },
      { status: 400 }
    );
  }
  if (liaIsBlocked(data)) {
    return NextResponse.json(
      {
        error:
          "Esta LIA está bloqueada estruturalmente: dados sensíveis ou de crianças/adolescentes não permitem usar Art. 7º IX. Mude a base legal antes de submeter.",
      },
      { status: 400 }
    );
  }

  const updated = await prisma.lia.update({
    where: { id: params.id },
    data: { status: "EM_REVISAO", rejectionNote: null },
    include: LIA_FULL_INCLUDE,
  });

  return NextResponse.json({ lia: liaToDTO(updated) });
}
