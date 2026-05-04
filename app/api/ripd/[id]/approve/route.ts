export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadRipdAuth,
  ripdToDTO,
  canApproveRipd,
} from "@/lib/ripd-helpers";

const FULL_INCLUDE = {
  inventory: { select: { id: true, serviceName: true, status: true } },
  approvedBy: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  _count: { select: { versions: true } },
} as const;

/**
 * POST /api/ripd/[id]/approve
 *
 * Aprova o RIPD. Cria um snapshot em `RipdVersion` e atualiza
 * `publishedContent` + `publishedAt` + `publishedVersionNum` no Ripd.
 *
 * Transição: RASCUNHO ou EM_REVISAO → APROVADO.
 *
 * Quem pode: apenas DPO (qualquer nível).
 *
 * Body opcional:
 *   - changeLog (string) — nota descrevendo o que mudou nesta versão.
 *
 * Tudo numa transação pra garantir consistência (Ripd + RipdVersion).
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
    select: {
      id: true,
      status: true,
      data: true,
      publishedVersionNum: true,
    },
  });
  if (!ripd) {
    return NextResponse.json({ error: "RIPD não encontrado" }, { status: 404 });
  }

  if (!canApproveRipd(user, ripd)) {
    return NextResponse.json(
      { error: "Apenas DPO pode aprovar; status atual deve ser rascunho ou em revisão." },
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

  const nextVersionNum = (ripd.publishedVersionNum ?? 0) + 1;
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    await tx.ripdVersion.create({
      data: {
        ripdId: params.id,
        version: nextVersionNum,
        content: ripd.data as any,
        changeLog,
        approvedAt: now,
        approvedById: user.id,
      },
    });
    return tx.ripd.update({
      where: { id: params.id },
      data: {
        status: "APROVADO",
        approvedById: user.id,
        approvedAt: now,
        publishedContent: ripd.data as any,
        publishedAt: now,
        publishedVersionNum: nextVersionNum,
        rejectionNote: null,
      },
      include: FULL_INCLUDE,
    });
  });

  return NextResponse.json({ ripd: ripdToDTO(updated) });
}
