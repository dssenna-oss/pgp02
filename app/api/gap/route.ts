export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadGapDPO,
  buildGapStats,
  answerToDTO,
  type GapAnswerDTO,
  type GapStats,
} from "@/lib/gap-helpers";
import { buildGapSuggestions, type GapSuggestion } from "@/lib/gap-suggest";

/**
 * GET /api/gap
 *
 * Carrega o estado COMPLETO do GAP Analysis pra a organização do DPO logado:
 *   - Todas as respostas existentes (`GapAnswer`)
 *   - Stats agregados (% por status, por aderência, por domínio)
 *   - Sugestões automáticas (decisão 5b) — derivadas do Inventário
 *
 * As sugestões NÃO são aplicadas automaticamente no banco aqui — vêm como
 * uma estrutura paralela (`suggestions`) e a UI decide se quer aceitar
 * (chama PATCH /api/gap/answer/[code] com `applySuggestion: true`).
 *
 * Query params (opcionais):
 *   - withSuggestions=0  → desliga o cálculo das sugestões (mais rápido)
 *
 * Resposta:
 *   {
 *     answers: GapAnswerDTO[],
 *     stats: GapStats,
 *     suggestions: { [controlCode]: GapSuggestion } | null
 *   }
 */
export async function GET(request: NextRequest) {
  const r = await loadGapDPO();
  if ("error" in r) return r.error;
  const { user } = r;

  const sp = request.nextUrl.searchParams;
  const wantSuggestions = sp.get("withSuggestions") !== "0";

  // Respostas existentes
  const answers = await prisma.gapAnswer.findMany({
    where: { companyId: user.companyId },
    include: {
      answeredBy: { select: { name: true, email: true } },
    },
    orderBy: { controlCode: "asc" },
  });

  const answerDTOs: GapAnswerDTO[] = answers.map(answerToDTO);
  const stats: GapStats = buildGapStats(answers);

  let suggestions: Record<string, GapSuggestion> | null = null;
  if (wantSuggestions) {
    const [approvedProcesses, company] = await Promise.all([
      prisma.dataInventory.findMany({
        where: { companyId: user.companyId, status: "APROVADO" },
        select: {
          id: true,
          serviceName: true,
          setor: true,
          dataCategory: true,
          legalBasis: true,
          legalBasisSensitive: true,
          formAnswers: true,
        },
      }),
      prisma.company.findUnique({
        where: { id: user.companyId },
        select: { dpoName: true, dpoEmail: true, dpoPhone: true },
      }),
    ]);

    const map = buildGapSuggestions({
      approvedProcesses,
      company: company ?? { dpoName: null, dpoEmail: null, dpoPhone: null },
    });

    // Filtra: só incluir sugestão pra controles que ainda NÃO TÊM
    // resposta no banco — qualquer resposta. Isso evita:
    //   1. Sobrescrever resposta humana (autoSuggested=false)
    //   2. Re-mostrar sugestão depois que o DPO clicou em "Aceitar
    //      todas em massa" (decisão C4) — aceitar criou GapAnswer
    //      com autoSuggested=true; banner deve sumir até refresh.
    const codesComResposta = new Set(answerDTOs.map((a) => a.controlCode));

    suggestions = {};
    for (const [code, sug] of map.entries()) {
      if (!codesComResposta.has(code)) suggestions[code] = sug;
    }
  }

  return NextResponse.json({ answers: answerDTOs, stats, suggestions });
}
