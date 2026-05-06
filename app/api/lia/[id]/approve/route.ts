export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadLiaAuth,
  liaToDTO,
  canApproveLia,
  liaIsBlocked,
  normalizeLiaData,
  LIA_FULL_INCLUDE,
} from "@/lib/lia-helpers";

/**
 * POST /api/lia/[id]/approve
 *
 * Aprova a LIA. Cria snapshot em `LiaVersion` e atualiza
 * `publishedContent` + `publishedAt` + `publishedVersionNum` na Lia.
 *
 * Transição: RASCUNHO/EM_REVISAO → APROVADO. Pode também re-aprovar
 * uma APROVADA (cria v2, v3, ...) quando o `data` divergiu.
 *
 * Quem pode: apenas DPO (qualquer nível).
 *
 * Bloqueia se a LIA tem bloqueio estrutural (dados sensíveis ou
 * crianças/adolescentes) — nesses casos a base legal está errada e
 * aprovar seria contraditório com o teste.
 *
 * Body opcional:
 *   - changeLog (string) — nota descrevendo o que mudou nesta versão.
 *
 * Tudo numa transação pra garantir consistência (Lia + LiaVersion).
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
    select: {
      id: true,
      status: true,
      data: true,
      publishedVersionNum: true,
    },
  });
  if (!lia) {
    return NextResponse.json({ error: "LIA não encontrada" }, { status: 404 });
  }

  if (!canApproveLia(user, lia)) {
    return NextResponse.json(
      {
        error:
          "Apenas DPO pode aprovar; LIAs arquivadas precisam ser desarquivadas antes.",
      },
      { status: 403 }
    );
  }

  // Trava lógica: não aprovar se há bloqueio estrutural — Art. 11/14 LGPD.
  const data = normalizeLiaData(lia.data);
  if (liaIsBlocked(data)) {
    return NextResponse.json(
      {
        error:
          "LIA bloqueada estruturalmente: dados sensíveis ou de crianças/adolescentes não admitem Art. 7º IX. Mude a base legal antes de aprovar.",
      },
      { status: 400 }
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const changeLog =
    typeof body.changeLog === "string" ? body.changeLog.trim().slice(0, 500) : null;

  const nextVersionNum = (lia.publishedVersionNum ?? 0) + 1;
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    await tx.liaVersion.create({
      data: {
        liaId: params.id,
        version: nextVersionNum,
        content: lia.data as any,
        changeLog,
        approvedAt: now,
        approvedById: user.id,
      },
    });
    return tx.lia.update({
      where: { id: params.id },
      data: {
        status: "APROVADO",
        approvedById: user.id,
        approvedAt: now,
        publishedContent: lia.data as any,
        publishedAt: now,
        publishedVersionNum: nextVersionNum,
        rejectionNote: null,
      },
      include: LIA_FULL_INCLUDE,
    });
  });

  return NextResponse.json({ lia: liaToDTO(updated) });
}
