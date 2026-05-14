export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadOperatorAuth,
  operatorAccessFilter,
} from "@/lib/operadores-helpers";

/**
 * GET /api/operadores/pending-count
 *
 * Endpoint leve pra alimentar o badge da sidebar (Checkpoint 14 G4 + H1).
 * Devolve a contagem de operadores que pedem atenção do usuário:
 *
 *   - Contrato VENCIDO ou contractExpiresAt no passado
 *   - SEM_CONTRATO
 *   - Risco contratual ALTO
 *   - Última avaliação com overallRiskClass = ALTO
 *   - lgpdComplianceStatus = NAO_AVALIADO ou EM_ADEQUACAO (campanha
 *     de adequação ativa pra contratos pré-LGPD)
 *
 * Aplica o mesmo filtro de visibilidade da listagem (DPO=tudo /
 * Contribuidor=processos próprios). Devolve só `{ count: number }`.
 */
export async function GET(_req: NextRequest) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const ops = await prisma.operator.findMany({
    where: operatorAccessFilter(user),
    select: {
      contractStatus: true,
      contractExpiresAt: true,
      contractRiskClass: true,
      lgpdComplianceStatus: true,
      assessments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { overallRiskClass: true },
      },
    },
  });

  const now = Date.now();
  let count = 0;
  for (const o of ops) {
    const expired =
      o.contractStatus === "VENCIDO" ||
      (o.contractExpiresAt && o.contractExpiresAt.getTime() < now);
    const noContract = o.contractStatus === "SEM_CONTRATO";
    const altoRisco = o.contractRiskClass === "ALTO";
    const altoAvaliacao = o.assessments[0]?.overallRiskClass === "ALTO";
    const pendingCompliance =
      o.lgpdComplianceStatus === "NAO_AVALIADO" ||
      o.lgpdComplianceStatus === "EM_ADEQUACAO";
    if (
      expired ||
      noContract ||
      altoRisco ||
      altoAvaliacao ||
      pendingCompliance
    )
      count += 1;
  }

  return NextResponse.json({ count });
}
