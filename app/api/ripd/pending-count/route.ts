export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadRipdAuth } from "@/lib/ripd-helpers";

/**
 * GET /api/ripd/pending-count
 *
 * Endpoint leve pra alimentar o badge da sidebar via polling (30s).
 * Devolve a contagem de RIPDs em estados "que pedem ação do usuário":
 *
 *   - DPO: RIPDs em EM_REVISAO (precisam aprovação)
 *   - Contribuidor: RIPDs próprios em RASCUNHO com `rejectionNote`
 *     (foram devolvidos pra ajustes)
 *
 * Devolve só `{ count: number }` — sem listar IDs (mais leve no
 * polling). UI usa pra mostrar dot/badge na sidebar.
 */
export async function GET(_request: NextRequest) {
  const r = await loadRipdAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  let count = 0;
  if (user.isDPO) {
    count = await prisma.ripd.count({
      where: { companyId: user.companyId, status: "EM_REVISAO" },
    });
  } else {
    count = await prisma.ripd.count({
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
