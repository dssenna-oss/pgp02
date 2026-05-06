export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadLiaAuth } from "@/lib/lia-helpers";

/**
 * GET /api/lia/pending-count
 *
 * Endpoint leve pra alimentar o badge da sidebar via polling.
 *
 *   - DPO: LIAs em EM_REVISAO (fila de aprovação)
 *   - Contribuidor: LIAs próprias em RASCUNHO com `rejectionNote`
 *     (devolvidas pra ajustes)
 */
export async function GET(_request: NextRequest) {
  const r = await loadLiaAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  let count = 0;
  if (user.isDPO) {
    count = await prisma.lia.count({
      where: { companyId: user.companyId, status: "EM_REVISAO" },
    });
  } else {
    count = await prisma.lia.count({
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
