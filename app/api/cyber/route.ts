export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadCyberAuth,
  cyberAnswerToDTO,
  computeCyberScore,
  computeCyberStats,
} from "@/lib/cyber-helpers";
import { CYBER_CONTROLS, CYBER_CATEGORIES } from "@/lib/cyber-catalog";

/**
 * GET /api/cyber
 *
 * Devolve estado completo da Maturidade Cibernética da empresa:
 *   - catálogo completo (80 controles + 23 categorias + 5 funções)
 *   - respostas existentes (CyberAnswer por controle)
 *   - score consolidado (overall + por função + nível qualitativo)
 *   - stats (delegadas / bloqueadas / pré-populadas)
 *
 * DPO-only.
 */
export async function GET(_request: NextRequest) {
  const r = await loadCyberAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const answers = await prisma.cyberAnswer.findMany({
    where: { companyId: user.companyId },
    include: {
      delegatedTo: { select: { id: true, name: true, email: true } },
      answeredBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { controlCode: "asc" },
  });

  const score = computeCyberScore(answers);
  const stats = computeCyberStats(
    answers.map((a) => ({
      controlCode: a.controlCode,
      aderencia: a.aderencia,
      evidenceFrom: a.evidenceFrom,
    }))
  );

  return NextResponse.json({
    catalog: {
      controls: CYBER_CONTROLS,
      categories: CYBER_CATEGORIES,
    },
    answers: answers.map(cyberAnswerToDTO),
    score,
    stats,
  });
}
