export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO, INVENTORY_STATUS } from "@/lib/auth-helpers";

/**
 * GET /api/inventario/pending-count
 *
 * Endpoint leve pra alimentar o badge da sidebar via polling.
 *
 *   - DPO: Inventários da org em SUBMETIDO ou EM_REVISAO (fila de aprovação)
 *   - Contribuidor: Inventários próprios em DEVOLVIDO (precisam ajuste)
 */
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, companyId: true },
  });
  if (!user?.companyId) {
    return NextResponse.json({ count: 0 });
  }

  let count = 0;
  if (isDPO(user.role)) {
    count = await prisma.dataInventory.count({
      where: {
        companyId: user.companyId,
        status: { in: [INVENTORY_STATUS.SUBMETIDO, INVENTORY_STATUS.EM_REVISAO] },
      },
    });
  } else {
    count = await prisma.dataInventory.count({
      where: {
        companyId: user.companyId,
        createdById: user.id,
        status: INVENTORY_STATUS.DEVOLVIDO,
      },
    });
  }

  return NextResponse.json({ count });
}
