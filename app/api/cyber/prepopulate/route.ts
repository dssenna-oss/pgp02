export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadCyberAuth } from "@/lib/cyber-helpers";
import {
  buildPrepopulateSuggestions,
  filterUnansweredSuggestions,
  validateSuggestions,
  type PrepopulateInput,
} from "@/lib/cyber-prepopulate";

/**
 * GET /api/cyber/prepopulate — calcula e devolve sugestões SEM aplicar.
 * POST /api/cyber/prepopulate — aplica as sugestões em batch (cria
 * CyberAnswer pra cada controle ainda não respondido).
 */
export async function GET(_request: NextRequest) {
  const r = await loadCyberAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const data = await loadInput(user.companyId);
  const allSuggestions = validateSuggestions(buildPrepopulateSuggestions(data));

  // Filtra os já respondidos
  const existing = await prisma.cyberAnswer.findMany({
    where: { companyId: user.companyId },
    select: { controlCode: true },
  });
  const answeredCodes = new Set(existing.map((e) => e.controlCode));
  const filtered = filterUnansweredSuggestions(allSuggestions, answeredCodes);

  return NextResponse.json({
    suggestions: filtered,
    summary: {
      total: filtered.length,
      bySource: filtered.reduce(
        (acc, s) => {
          acc[s.evidenceFrom] = (acc[s.evidenceFrom] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      alreadyAnswered: answeredCodes.size,
    },
  });
}

export async function POST(_request: NextRequest) {
  const r = await loadCyberAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const data = await loadInput(user.companyId);
  const allSuggestions = validateSuggestions(buildPrepopulateSuggestions(data));

  const existing = await prisma.cyberAnswer.findMany({
    where: { companyId: user.companyId },
    select: { controlCode: true },
  });
  const answeredCodes = new Set(existing.map((e) => e.controlCode));
  const filtered = filterUnansweredSuggestions(allSuggestions, answeredCodes);

  if (filtered.length === 0) {
    return NextResponse.json({
      created: 0,
      skipped: existing.length,
      message: "Nenhuma sugestão nova — todos os controles candidatos já foram respondidos.",
    });
  }

  // createMany com skipDuplicates pra ser seguro contra concorrência
  const result = await prisma.cyberAnswer.createMany({
    data: filtered.map((s) => ({
      companyId: user.companyId,
      controlCode: s.controlCode,
      aderencia: s.suggestedAderencia,
      evidence: s.evidence,
      evidenceFrom: s.evidenceFrom,
      answeredById: user.id,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({
    created: result.count,
    skipped: existing.length,
    appliedSuggestions: filtered.map((s) => ({
      controlCode: s.controlCode,
      suggestedAderencia: s.suggestedAderencia,
      evidenceFrom: s.evidenceFrom,
    })),
  });
}

/**
 * Carrega os dados de entrada consolidados pros 4 checkpoints fonte.
 * Faz 4 queries em paralelo. Falha gracefully (vazio) se algum CP
 * ainda não tem dado.
 */
async function loadInput(companyId: string): Promise<PrepopulateInput> {
  const [gapAnswers, capacitacao, incidents, operators] = await Promise.all([
    prisma.gapAnswer.findMany({
      where: { companyId, aderencia: "ADERENTE" },
      select: { controlCode: true },
    }),
    prisma.capacitacaoEvento.findMany({
      where: { companyId },
      select: { status: true, eixo: true },
    }),
    prisma.incident.findMany({
      where: { companyId },
      select: {
        status: true,
        anpdNotifiedAt: true,
        subjectsNotifiedAt: true,
      },
    }),
    prisma.operator.findMany({
      where: { companyId },
      select: {
        contractStatus: true,
        hasPrivacyClause: true,
        hasIncidentClause: true,
        assessments: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { status: true },
        },
      },
    }),
  ]);

  return {
    gap: {
      aderentesCount: gapAnswers.length,
      aderentesCodes: gapAnswers.map((g) => g.controlCode),
    },
    capacitacao: {
      totalEvents: capacitacao.length,
      realizedCount: capacitacao.filter((c) => c.status === "REALIZADO").length,
      onboardingCovered: capacitacao.some((c) => c.eixo === "ONBOARDING"),
    },
    incidentes: {
      total: incidents.length,
      hasAnpdNotification: incidents.some((i) => i.anpdNotifiedAt != null),
      hasSubjectNotification: incidents.some((i) => i.subjectsNotifiedAt != null),
      hasClosedIncident: incidents.some(
        (i) => i.status === "ENCERRADO" || i.status === "FALSO_POSITIVO"
      ),
    },
    terceiros: {
      total: operators.length,
      assessedCount: operators.filter((o) => o.assessments[0]?.status === "RESPONDIDO").length,
      withContractCount: operators.filter(
        (o) =>
          o.contractStatus !== "SEM_CONTRATO" &&
          o.contractStatus !== "VENCIDO" &&
          (o.hasPrivacyClause || o.hasIncidentClause)
      ).length,
    },
  };
}
