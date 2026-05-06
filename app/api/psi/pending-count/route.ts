export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadPsiAuth } from "@/lib/psi-helpers";

/**
 * GET /api/psi/pending-count
 *
 * Endpoint leve pra alimentar o badge da sidebar via polling.
 *
 *   - DPO: PSIs em EM_REVISAO (fila de aprovação)
 *   - Contribuidor: PSIs próprias em RASCUNHO com `rejectionNote`
 *     (devolvidas pra ajustes)
 */
export async function GET(_request: NextRequest) {
  const r = await loadPsiAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  let count = 0;
  if (user.isDPO) {
    count = await prisma.psi.count({
      where: { companyId: user.companyId, status: "EM_REVISAO" },
    });
  } else {
    count = await prisma.psi.count({
      where: {
        companyId: user.companyId,
        createdById: user.id,
        status: "RASCUNHO",
        rejectionNote: { not: null },
      },
    });
  }

  return NextResponse.json({ count });
}
