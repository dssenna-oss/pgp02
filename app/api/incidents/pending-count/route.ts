export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadIncidentAuth,
  incidentAccessFilter,
  computeAnpdDeadline,
  requiresAnpdCommunication,
} from "@/lib/incidentes-helpers";

/**
 * GET /api/incidents/pending-count
 *
 * Endpoint leve pra alimentar o badge da sidebar (Checkpoint 16 / F4).
 * Devolve a contagem de incidentes em prazo crítico:
 *
 *   - Severidade ALTO ou MEDIO
 *   - Sem `anpdNotifiedAt`
 *   - Não está em FALSO_POSITIVO
 *   - Prazo regressivo de 72h em estado WARN (≤24h) ou CRITICAL (vencido)
 *
 * Aplica filtro de visibilidade (DPO=tudo / Contribuidor=próprios).
 * Devolve só `{ count: number }`.
 */
export async function GET(_req: NextRequest) {
  const r = await loadIncidentAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const incidents = await prisma.incident.findMany({
    where: incidentAccessFilter(user),
    select: {
      severity: true,
      status: true,
      detectedAt: true,
      anpdNotifiedAt: true,
    },
  });

  let count = 0;
  for (const i of incidents) {
    if (!requiresAnpdCommunication(i.severity)) continue;
    if (i.anpdNotifiedAt != null) continue;
    if (i.status === "FALSO_POSITIVO") continue;
    const deadline = computeAnpdDeadline(i.detectedAt, null);
    if (deadline && (deadline.level === "WARN" || deadline.level === "CRITICAL")) {
      count += 1;
    }
  }

  return NextResponse.json({ count });
}
