export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { buildDiagnostico } from "@/lib/diagnostico-scoring";
import {
  computePgpMaturity,
  type MaturityInput,
} from "@/lib/maturidade-pgp";

/**
 * GET /api/maturidade-pgp
 *
 * Consolidador do Painel de Maturidade do PGP (Checkpoint 15 / Opção 1).
 * Puxa dados de TODAS as fases do programa em paralelo, calcula o
 * Diagnóstico (reusa engine do Checkpoint 10), aplica os pesos de
 * maturidade e devolve o resultado pronto pra UI.
 *
 * Acesso: apenas DPO. Resposta sempre "ao vivo" (force-dynamic).
 */
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user?.companyId) {
    return NextResponse.json(
      { error: "Empresa não encontrada" },
      { status: 404 },
    );
  }
  if (!isDPO(user.role)) {
    return NextResponse.json(
      { error: "Apenas DPO acessa o Painel de Maturidade do PGP" },
      { status: 403 },
    );
  }
  const companyId = user.companyId;

  // 1) Carregar TUDO em paralelo
  const [
    inventoriesAll,
    risks,
    gapAnswers,
    actions,
    policies,
    ripds,
    operators,
    teamUsers,
    company,
  ] = await Promise.all([
    prisma.dataInventory.findMany({
      where: { companyId },
      select: {
        id: true,
        serviceName: true,
        setor: true,
        status: true,
        dataCategory: true,
        legalBasis: true,
        legalBasisSensitive: true,
        legalBasisComments: true,
      },
    }),
    prisma.processRisk.findMany({
      where: { companyId },
      select: {
        id: true,
        riskCode: true,
        status: true,
        severityLevel: true,
        mitigationPlan: true,
        dataInventoryId: true,
      },
    }),
    prisma.gapAnswer.findMany({
      where: { companyId },
      select: {
        controlCode: true,
        aderencia: true,
        mapeamento: true,
        pontoMelhoria: true,
      },
    }),
    prisma.actionPlan.findMany({
      where: { companyId },
      select: {
        status: true,
        dueDate: true,
      },
    }),
    prisma.policy.findMany({
      where: { companyId },
      select: { type: true, status: true },
    }),
    prisma.ripd.findMany({
      where: { companyId },
      select: { status: true },
    }),
    prisma.operator.findMany({
      where: { companyId },
      select: {
        contractStatus: true,
        contractRiskClass: true,
        lgpdComplianceStatus: true,
      },
    }),
    prisma.user.findMany({
      where: { companyId },
      select: { role: true },
    }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { dpoName: true, dpoEmail: true },
    }),
  ]);

  // 2) Calcular Diagnóstico (reusa engine do Checkpoint 10)
  let diagnosticoScore: number | null = null;
  try {
    const inventoryNameById: Record<string, string> = {};
    for (const i of inventoriesAll) inventoryNameById[i.id] = i.serviceName;
    const aprovadosCount = inventoriesAll.filter((i) => i.status === "APROVADO").length;
    const diag = buildDiagnostico({
      inventories: inventoriesAll.map((i) => ({
        id: i.id,
        serviceName: i.serviceName,
        setor: i.setor,
        status: i.status,
        dataCategory: i.dataCategory,
        legalBasis: i.legalBasis,
        legalBasisSensitive: i.legalBasisSensitive,
        legalBasisComments: i.legalBasisComments,
      })),
      risks: risks.map((r) => ({
        id: r.id,
        riskCode: r.riskCode,
        status: r.status,
        severityLevel: r.severityLevel,
        mitigationPlan: r.mitigationPlan,
        dataInventoryId: r.dataInventoryId,
      })),
      gapAnswers: gapAnswers.map((g) => ({
        controlCode: g.controlCode,
        aderencia: g.aderencia,
        mapeamento: g.mapeamento,
        pontoMelhoria: g.pontoMelhoria,
      })),
      approvedCount: aprovadosCount,
      inventoryNameById,
    });
    diagnosticoScore = diag.score.overall;
  } catch {
    // Se o diagnóstico falhar (dados inconsistentes), score fica null
    diagnosticoScore = null;
  }

  // 3) Agregar entradas pra engine de maturidade
  const now = Date.now();
  const planoStats = {
    total: actions.length,
    emAberto: actions.filter((a) => a.status === "A_FAZER" || a.status === "EM_ANDAMENTO").length,
    concluidas: actions.filter((a) => a.status === "CONCLUIDA").length,
    atrasadas: actions.filter(
      (a) =>
        (a.status === "A_FAZER" || a.status === "EM_ANDAMENTO") &&
        a.dueDate != null &&
        a.dueDate.getTime() < now,
    ).length,
    vencendo7d: actions.filter((a) => {
      if (a.status !== "A_FAZER" && a.status !== "EM_ANDAMENTO") return false;
      if (!a.dueDate) return false;
      const t = a.dueDate.getTime();
      return t >= now && t - now <= 7 * 24 * 60 * 60 * 1000;
    }).length,
  };

  const aprovadosInv = inventoriesAll.filter((i) => i.status === "APROVADO");
  const processosAnalisados = aprovadosInv.filter((inv) =>
    risks.some((r) => r.dataInventoryId === inv.id),
  ).length;

  const riscosAlto = risks.filter((r) => (r.severityLevel ?? "").includes("ALTO")).length;
  const riscosMedio = risks.filter((r) => (r.severityLevel ?? "").includes("MEDIO")).length;
  const riscosBaixo = risks.filter((r) => (r.severityLevel ?? "").includes("BAIXO")).length;

  const totalGap = 119; // catálogo fixo (lib/gap-catalog.ts)
  const gapStats = {
    totalControles: totalGap,
    respondidos: gapAnswers.length,
    aderentes: gapAnswers.filter((g) => g.aderencia === "ADERENTE").length,
    parciais: gapAnswers.filter((g) => g.aderencia === "PARCIAL").length,
    naoAderentes: gapAnswers.filter((g) => g.aderencia === "NAO_ADERENTE").length,
  };

  const politicasStats = {
    total: policies.length,
    publicadas: policies.filter((p) => p.status === "PUBLICADA").length,
    rascunhos: policies.filter((p) => p.status === "RASCUNHO").length,
    hasPoliticaPgp: policies.some(
      (p) => p.type === "POLITICA_PGP" && p.status === "PUBLICADA",
    ),
  };

  const ripdStats = {
    total: ripds.length,
    aprovados: ripds.filter((r) => r.status === "APROVADO").length,
    emRevisao: ripds.filter((r) => r.status === "EM_REVISAO").length,
    rascunhos: ripds.filter((r) => r.status === "RASCUNHO").length,
  };

  const terceirosStats = {
    total: operators.length,
    adequados: operators.filter((o) => o.lgpdComplianceStatus === "ADEQUADO").length,
    emAdequacao: operators.filter((o) => o.lgpdComplianceStatus === "EM_ADEQUACAO").length,
    naoAvaliados: operators.filter((o) => o.lgpdComplianceStatus === "NAO_AVALIADO").length,
    riscoAlto: operators.filter((o) => o.contractRiskClass === "ALTO").length,
    semContrato: operators.filter(
      (o) => o.contractStatus === "SEM_CONTRATO" || o.contractStatus === "VENCIDO",
    ).length,
  };

  const equipeStats = {
    totalUsuarios: teamUsers.length,
    dpos: teamUsers.filter((u) => isDPO(u.role)).length,
    contribuidores: teamUsers.filter((u) => u.role === "CONTRIBUIDOR").length,
    hasDpoCadastrado: !!(company?.dpoName && company?.dpoEmail),
  };

  const input: MaturityInput = {
    diagnosticoScore,
    inventario: {
      total: inventoriesAll.length,
      aprovados: aprovadosInv.length,
      rascunhos: inventoriesAll.filter((i) => i.status === "RASCUNHO").length,
      submetidos: inventoriesAll.filter((i) => i.status === "SUBMETIDO").length,
    },
    riscos: {
      totalProcessos: aprovadosInv.length,
      processosAnalisados,
      riscosAlto,
      riscosMedio,
      riscosBaixo,
      riscosIdentificadosSemMitigacao: risks.filter(
        (r) => r.status === "IDENTIFICADO" && !r.mitigationPlan,
      ).length,
    },
    gap: gapStats,
    plano: planoStats,
    politicas: politicasStats,
    ripd: ripdStats,
    terceiros: terceirosStats,
    equipe: equipeStats,
  };

  const result = computePgpMaturity(input);
  return NextResponse.json({ ...result, input });
}
