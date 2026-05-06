export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadPsiAuth,
  psiToDTO,
  canApprovePsi,
  PSI_FULL_INCLUDE,
} from "@/lib/psi-helpers";
import { ensureCompanySlug } from "@/lib/policies-helpers";

/**
 * POST /api/psi/[id]/approve
 *
 * Aprova a PSI. Cria snapshot em `PsiVersion` e atualiza
 * `publishedContent` + `publishedAt` + `publishedVersionNum` na Psi.
 *
 * Transição: RASCUNHO/EM_REVISAO → APROVADO. Também re-aprova uma
 * APROVADA (cria v2, v3, ...) quando o `data` divergiu.
 *
 * Quem pode: apenas DPO.
 *
 * Body opcional:
 *   - changeLog (string) — nota descrevendo o que mudou nesta versão.
 *
 * Tudo numa transação pra garantir consistência (Psi + PsiVersion).
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
    select: {
      id: true,
      status: true,
      data: true,
      publishedVersionNum: true,
    },
  });
  if (!psi) {
    return NextResponse.json({ error: "PSI não encontrada" }, { status: 404 });
  }

  if (!canApprovePsi(user, psi)) {
    return NextResponse.json(
      {
        error:
          "Apenas DPO pode aprovar; PSIs arquivadas precisam ser desarquivadas antes.",
      },
      { status: 403 }
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

  const nextVersionNum = (psi.publishedVersionNum ?? 0) + 1;
  const now = new Date();

  // Garante que a empresa tem slug (necessário pra gerar URL pública)
  await ensureCompanySlug(user.companyId);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.psiVersion.create({
      data: {
        psiId: params.id,
        version: nextVersionNum,
        content: psi.data as any,
        changeLog,
        approvedAt: now,
        approvedById: user.id,
      },
    });
    return tx.psi.update({
      where: { id: params.id },
      data: {
        status: "APROVADO",
        approvedById: user.id,
        approvedAt: now,
        publishedContent: psi.data as any,
        publishedAt: now,
        publishedVersionNum: nextVersionNum,
        rejectionNote: null,
      },
      include: PSI_FULL_INCLUDE,
    });
  });

  return NextResponse.json({ psi: psiToDTO(updated) });
}
