/**
 * Relatório Executivo de Conformidade LGPD (R3, 2026-05-10).
 *
 * Engine que agrega TODOS os dados da postura LGPD da org num só
 * objeto pra renderizar PDF executivo de 7 páginas.
 *
 * Reusa buildDiagnostico() pro score 0-100 e calcula um nível de
 * maturidade simplificado baseado no score (não duplica a lógica
 * complexa do Painel de Maturidade que tem 5 pilares ponderados —
 * pra esse documento agregado um nível qualitativo direto basta).
 *
 * Acesso: DPO-only.
 */

import { prisma } from "@/lib/db";
import { buildDiagnostico, type DiagnosticoOutput } from "@/lib/diagnostico-scoring";
import { getProximasEtapas, type ProximaEtapa } from "@/lib/proximas-etapas-helpers";
import {
  RISCOS_BY_CODE,
  RISK_CATEGORY_LABEL,
  RISK_CATEGORY_BY_CODE,
  type RiskCode,
} from "@/lib/riscos-catalog";

// ============================================================
// Tipos
// ============================================================

export type MaturityLevel =
  | "INICIANTE"
  | "EM_DESENVOLVIMENTO"
  | "INTERMEDIARIO"
  | "AVANCADO"
  | "EXEMPLAR";

export interface MaturityInfo {
  level: MaturityLevel;
  label: string;
  description: string;
  /** 0-100 (mesmo do diagnóstico). */
  score: number | null;
  color: "red" | "amber" | "blue" | "emerald" | "violet";
}

export interface RelatorioExecutivo {
  // Capa
  generatedAt: Date;
  companyName: string;
  companyLogoUrl: string | null;
  dpoName: string | null;
  dpoEmail: string | null;
  period: string;

  // Score + Maturidade simplificada
  diagnostico: DiagnosticoOutput;
  maturidade: MaturityInfo;

  // KPIs operacionais agregados
  kpis: KpiBlock;

  // Onde a org acumula risco
  topRiscos: TopRisco[];
  riscosByCode: Record<string, number>;

  // Próximas etapas (top 10)
  proximasEtapas: ProximaEtapa[];

  // Pendências críticas (problemas estruturais agora)
  pendencias: PendenciasCriticas;

  // B5 — Alertas de prazo regulatório (itens com prazo conhecido)
  alertasPrazo: AlertasPrazo;

  // B1 — Capacitação detalhada
  capacitacaoDetalhada: CapacitacaoDetalhada;

  // Histórico (snapshots GAP, se houver)
  historico: { snapshots: Array<{ date: string; score: number }> } | null;

  // Texto auto-gerado de conclusão
  conclusao: string;
}

export interface KpiBlock {
  inventario: { total: number; approved: number; inReview: number; draft: number };
  riscos: {
    total: number;
    identificado: number;
    emMitigacao: number;
    aceito: number;
    eliminado: number;
    altoCount: number;
    medioCount: number;
    baixoCount: number;
  };
  gap: {
    totalControls: number;
    answered: number;
    aderente: number;
    parcial: number;
    naoAderente: number;
    naoSeAplica: number;
  };
  plano: {
    total: number;
    concluidas: number;
    atrasadas: number;
    prioritariasAlta: number;
  };
  politicas: { published: number; draft: number };
  ripds: { approved: number; inReview: number };
  lia: { approved: number; total: number };
  operadores: {
    total: number;
    adequados: number;
    emAdequacao: number;
    naoAvaliados: number;
    highRisk: number;
  };
  incidentes: { open: number; closed: number; anpdOverdue: number };
  capacitacao: { events: number; eixosCovered: number };
}

export interface TopRisco {
  code: string;
  label: string;
  count: number;
  category: string;
}

export interface PendenciasCriticas {
  riscosAltoSemMitigacao: Array<{
    processId: string;
    processName: string;
    code: string;
    label: string;
  }>;
  processosSemBaseLegal: Array<{ id: string; name: string }>;
  incidentesAbertosLongos: Array<{ id: string; title: string; daysOpen: number }>;
  operadoresAltoRiscoNaoAdequados: Array<{ id: string; name: string }>;
}

/**
 * B5 — Alertas de prazo regulatório.
 * Itens que requerem ação não-imediata mas com prazo conhecido.
 * Diferente de PendenciasCriticas (problemas estruturais agora).
 */
export interface AlertasPrazo {
  ripdsSemRevisaoLonga: Array<{
    id: string;
    title: string;
    daysSinceUpdate: number;
  }>;
  politicasVencendo: Array<{
    id: string;
    title: string;
    daysSincePublish: number;
  }>;
  capacitacoesPlanejadasAtrasadas: Array<{
    id: string;
    title: string;
    eixo: string;
    daysOverdue: number;
  }>;
  contratosOperadorVencendo: Array<{
    id: string;
    name: string;
    daysToExpire: number;
  }>;
}

/**
 * B1 — Detalhamento da Capacitação por eixo + público.
 * Compliance Art. 52 §1º VIII LGPD — programa contínuo de educação.
 */
export interface CapacitacaoDetalhada {
  totalEventos: number;
  realizados: number;
  planejados: number;
  cancelados: number;
  porEixo: Record<string, { total: number; realizados: number }>;
  porPublico: Record<string, number>;
  proximosEventos: Array<{
    id: string;
    title: string;
    eixo: string;
    audience: string;
    scheduledAt: string;
  }>;
}

// ============================================================
// Engine
// ============================================================

interface BuildArgs {
  companyId: string;
  userId: string;
  isDPO: boolean;
  generatedAt?: Date;
}

export async function buildRelatorioExecutivo(
  args: BuildArgs,
): Promise<RelatorioExecutivo> {
  const generatedAt = args.generatedAt ?? new Date();

  // ---------- Carrega dados em paralelo ----------
  const [
    company,
    inventories,
    risks,
    gapAnswers,
    actionPlans,
    policies,
    ripds,
    lias,
    operators,
    incidents,
    capacitacaoEvents,
    gapSnapshots,
  ] = await Promise.all([
    prisma.company.findUnique({
      where: { id: args.companyId },
      select: {
        companyName: true,
        logoUrl: true,
        dpoName: true,
        dpoEmail: true,
      },
    }),
    prisma.dataInventory.findMany({
      where: { companyId: args.companyId },
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
      where: { companyId: args.companyId },
      select: {
        id: true,
        dataInventoryId: true,
        riskCode: true,
        status: true,
        severityLevel: true,
        mitigationPlan: true,
      },
    }),
    prisma.gapAnswer.findMany({
      where: { companyId: args.companyId },
      select: {
        controlCode: true,
        aderencia: true,
        mapeamento: true,
        pontoMelhoria: true,
      },
    }),
    prisma.actionPlan.findMany({
      where: { companyId: args.companyId },
      select: { id: true, status: true, priority: true, dueDate: true },
    }),
    prisma.policy.findMany({
      where: { companyId: args.companyId },
      select: {
        id: true,
        status: true,
        publishedAt: true,
        type: true,
      },
    }),
    prisma.ripd.findMany({
      where: { companyId: args.companyId },
      select: {
        id: true,
        status: true,
        title: true,
        approvedAt: true,
        updatedAt: true,
      },
    }),
    prisma.lia.findMany({
      where: { companyId: args.companyId },
      select: { id: true, status: true },
    }),
    prisma.operator.findMany({
      where: { companyId: args.companyId },
      select: {
        id: true,
        name: true,
        contractRiskClass: true,
        lgpdComplianceStatus: true,
        contractExpiresAt: true,
      },
    }),
    prisma.incident.findMany({
      where: { companyId: args.companyId },
      select: {
        id: true,
        title: true,
        status: true,
        detectedAt: true,
        anpdNotifiedAt: true,
        closedAt: true,
      },
    }),
    prisma.capacitacaoEvento.findMany({
      where: { companyId: args.companyId },
      select: {
        id: true,
        title: true,
        eixo: true,
        audience: true,
        status: true,
        scheduledAt: true,
        completedAt: true,
      },
    }),
    prisma.gapSnapshot.findMany({
      where: { companyId: args.companyId },
      select: { id: true, createdAt: true, payload: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // ---------- Diagnóstico (score 0-100) ----------
  const approvedCount = inventories.filter((i) => i.status === "APROVADO").length;
  const inventoryNameById: Record<string, string> = {};
  for (const i of inventories) inventoryNameById[i.id] = i.serviceName;

  const diagnostico = buildDiagnostico({
    inventories,
    risks,
    gapAnswers,
    approvedCount,
    inventoryNameById,
  });

  const score = diagnostico.score.overall;

  // ---------- Maturidade simplificada ----------
  const maturidade = computeMaturityFromScore(score);

  // ---------- Próximas etapas (top 10) ----------
  // getProximasEtapas espera UserCtx — precisamos buscar a role do user
  const userCtx = await prisma.user.findUnique({
    where: { id: args.userId },
    select: { id: true, companyId: true, role: true },
  });
  const proximasEtapas = userCtx
    ? (await getProximasEtapas(userCtx as any)).slice(0, 10)
    : [];

  // ---------- KPIs ----------
  const kpis = buildKpiBlock({
    inventories,
    risks,
    gapAnswers,
    actionPlans,
    policies,
    ripds,
    lias,
    operators,
    incidents,
    capacitacaoEvents,
  });

  // ---------- Top riscos por código ----------
  const riscosByCode: Record<string, number> = {};
  for (const r of risks) {
    riscosByCode[r.riskCode] = (riscosByCode[r.riskCode] ?? 0) + 1;
  }
  const topRiscos: TopRisco[] = Object.entries(riscosByCode)
    .map(([code, count]) => {
      const def = RISCOS_BY_CODE[code as RiskCode];
      return {
        code,
        label: def?.shortLabel ?? code,
        count,
        category: def
          ? RISK_CATEGORY_LABEL[RISK_CATEGORY_BY_CODE[code as RiskCode]]
          : "—",
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ---------- Pendências críticas ----------
  const pendencias = buildPendenciasCriticas({
    inventories,
    risks,
    incidents,
    operators,
  });

  // ---------- B5 — Alertas de prazo regulatório ----------
  const alertasPrazo = buildAlertasPrazo({
    ripds,
    policies,
    capacitacaoEvents,
    operators,
  });

  // ---------- B1 — Capacitação detalhada ----------
  const capacitacaoDetalhada = buildCapacitacaoDetalhada(capacitacaoEvents);

  // ---------- Histórico ----------
  // GapSnapshot tem `payload` JSON — extrai score.overall se houver
  const historico =
    gapSnapshots.length > 0
      ? {
          snapshots: gapSnapshots
            .map((s) => {
              const payload = s.payload as any;
              const snapScore =
                payload?.score?.overall ??
                payload?.diagnostico?.score?.overall ??
                null;
              return {
                date: s.createdAt.toISOString(),
                score: typeof snapScore === "number" ? snapScore : 0,
              };
            })
            .filter((s) => s.score > 0),
        }
      : null;

  // ---------- Conclusão auto-gerada ----------
  const conclusao = generateConclusionText({
    diagnostico,
    maturidade,
    kpis,
    pendencias,
    topRiscos,
  });

  // ---------- Período ----------
  const month = generatedAt.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const period = month.charAt(0).toUpperCase() + month.slice(1);

  return {
    generatedAt,
    companyName: company?.companyName ?? "Organização",
    companyLogoUrl: company?.logoUrl ?? null,
    dpoName: company?.dpoName ?? null,
    dpoEmail: company?.dpoEmail ?? null,
    period,
    diagnostico,
    maturidade,
    kpis,
    topRiscos,
    riscosByCode,
    proximasEtapas,
    pendencias,
    alertasPrazo,
    capacitacaoDetalhada,
    historico: historico && historico.snapshots.length > 0 ? historico : null,
    conclusao,
  };
}

// ============================================================
// Maturidade simplificada (5 níveis a partir do score 0-100)
// ============================================================

function computeMaturityFromScore(score: number | null): MaturityInfo {
  if (score === null) {
    return {
      level: "INICIANTE",
      label: "Iniciante",
      description:
        "Dados insuficientes pra calcular maturidade — comece preenchendo o Inventário e respondendo o GAP Analysis.",
      score: null,
      color: "red",
    };
  }
  if (score < 25) {
    return {
      level: "INICIANTE",
      label: "Iniciante",
      description:
        "Programa em fase inicial. Foco prioritário: estruturar Inventário, definir bases legais e mapear riscos críticos.",
      score,
      color: "red",
    };
  }
  if (score < 45) {
    return {
      level: "EM_DESENVOLVIMENTO",
      label: "Em Desenvolvimento",
      description:
        "Programa ganhando forma. Continuar mapeamento, iniciar Plano de Ação e publicar primeiras políticas.",
      score,
      color: "amber",
    };
  }
  if (score < 65) {
    return {
      level: "INTERMEDIARIO",
      label: "Intermediário",
      description:
        "Bases estabelecidas. Foco em mitigar riscos identificados, fechar lacunas do GAP e ampliar capacitação.",
      score,
      color: "blue",
    };
  }
  if (score < 85) {
    return {
      level: "AVANCADO",
      label: "Avançado",
      description:
        "Programa maduro com pilares fortes. Foco em refinamento, monitoramento contínuo e melhoria.",
      score,
      color: "emerald",
    };
  }
  return {
    level: "EXEMPLAR",
    label: "Exemplar",
    description:
      "Programa de referência. Manter cadência de monitoramento e aprimoramento contínuo.",
    score,
    color: "violet",
  };
}

// ============================================================
// KPI Block builder
// ============================================================

interface KpiInputs {
  inventories: ReadonlyArray<{ status: string }>;
  risks: ReadonlyArray<{ status: string; severityLevel: string | null }>;
  gapAnswers: ReadonlyArray<{ aderencia: string | null }>;
  actionPlans: ReadonlyArray<{
    status: string;
    priority: string;
    dueDate: Date | null;
  }>;
  policies: ReadonlyArray<{ status: string }>;
  ripds: ReadonlyArray<{ status: string }>;
  lias: ReadonlyArray<{ status: string }>;
  operators: ReadonlyArray<{
    contractRiskClass: string | null;
    lgpdComplianceStatus: string | null;
  }>;
  incidents: ReadonlyArray<{
    status: string;
    detectedAt: Date;
    anpdNotifiedAt: Date | null;
    closedAt: Date | null;
  }>;
  capacitacaoEvents: ReadonlyArray<{ eixo: string }>;
}

function buildKpiBlock(d: KpiInputs): KpiBlock {
  const inv = {
    total: d.inventories.length,
    approved: d.inventories.filter((i) => i.status === "APROVADO").length,
    inReview: d.inventories.filter(
      (i) => i.status === "EM_REVISAO" || i.status === "SUBMETIDO",
    ).length,
    draft: d.inventories.filter(
      (i) => i.status === "RASCUNHO" || i.status === "DEVOLVIDO",
    ).length,
  };

  const ri = {
    total: d.risks.length,
    identificado: d.risks.filter((r) => r.status === "IDENTIFICADO").length,
    emMitigacao: d.risks.filter((r) => r.status === "EM_MITIGACAO").length,
    aceito: d.risks.filter((r) => r.status === "ACEITO").length,
    eliminado: d.risks.filter((r) => r.status === "ELIMINADO").length,
    altoCount: d.risks.filter((r) =>
      (r.severityLevel ?? "").includes("ALTO"),
    ).length,
    medioCount: d.risks.filter((r) =>
      (r.severityLevel ?? "").includes("MEDIO"),
    ).length,
    baixoCount: d.risks.filter((r) =>
      (r.severityLevel ?? "").includes("BAIXO"),
    ).length,
  };

  const gp = {
    totalControls: 119,
    answered: d.gapAnswers.length,
    aderente: d.gapAnswers.filter((g) => g.aderencia === "ADERENTE").length,
    parcial: d.gapAnswers.filter((g) => g.aderencia === "PARCIAL").length,
    naoAderente: d.gapAnswers.filter((g) => g.aderencia === "NAO_ADERENTE")
      .length,
    naoSeAplica: d.gapAnswers.filter((g) => g.aderencia === "NAO_SE_APLICA")
      .length,
  };

  const now = Date.now();
  const pl = {
    total: d.actionPlans.length,
    concluidas: d.actionPlans.filter((a) => a.status === "CONCLUIDA").length,
    atrasadas: d.actionPlans.filter(
      (a) =>
        a.status !== "CONCLUIDA" &&
        a.dueDate &&
        a.dueDate.getTime() < now,
    ).length,
    prioritariasAlta: d.actionPlans.filter(
      (a) => a.priority === "ALTA" && a.status !== "CONCLUIDA",
    ).length,
  };

  const po = {
    published: d.policies.filter((p) => p.status === "PUBLICADA").length,
    draft: d.policies.filter((p) => p.status === "RASCUNHO").length,
  };

  const rp = {
    approved: d.ripds.filter((r) => r.status === "APROVADO").length,
    inReview: d.ripds.filter((r) => r.status === "EM_REVISAO").length,
  };

  const li = {
    approved: d.lias.filter((l) => l.status === "APROVADO").length,
    total: d.lias.length,
  };

  const op = {
    total: d.operators.length,
    adequados: d.operators.filter(
      (o) => o.lgpdComplianceStatus === "ADEQUADO",
    ).length,
    emAdequacao: d.operators.filter(
      (o) => o.lgpdComplianceStatus === "EM_ADEQUACAO",
    ).length,
    naoAvaliados: d.operators.filter(
      (o) =>
        o.lgpdComplianceStatus === "NAO_AVALIADO" ||
        o.lgpdComplianceStatus === null,
    ).length,
    highRisk: d.operators.filter((o) => o.contractRiskClass === "ALTO").length,
  };

  const incOpen = d.incidents.filter(
    (i) => i.status !== "ENCERRADO" && i.status !== "FALSO_POSITIVO",
  );
  const ic = {
    open: incOpen.length,
    closed: d.incidents.filter((i) => i.closedAt !== null).length,
    anpdOverdue: incOpen.filter((i) => {
      if (i.anpdNotifiedAt) return false;
      const elapsed = now - i.detectedAt.getTime();
      return elapsed > 72 * 3_600_000;
    }).length,
  };

  const eixosSet = new Set(d.capacitacaoEvents.map((e) => e.eixo));
  const ca = {
    events: d.capacitacaoEvents.length,
    eixosCovered: eixosSet.size,
  };

  return {
    inventario: inv,
    riscos: ri,
    gap: gp,
    plano: pl,
    politicas: po,
    ripds: rp,
    lia: li,
    operadores: op,
    incidentes: ic,
    capacitacao: ca,
  };
}

// ============================================================
// Pendências críticas
// ============================================================

interface PendInputs {
  inventories: ReadonlyArray<{
    id: string;
    serviceName: string;
    status: string;
    legalBasis: string | null;
  }>;
  risks: ReadonlyArray<{
    dataInventoryId: string;
    riskCode: string;
    status: string;
    severityLevel: string | null;
    mitigationPlan: string | null;
  }>;
  incidents: ReadonlyArray<{
    id: string;
    title: string;
    status: string;
    detectedAt: Date;
    closedAt: Date | null;
  }>;
  operators: ReadonlyArray<{
    id: string;
    name: string;
    contractRiskClass: string | null;
    lgpdComplianceStatus: string | null;
  }>;
}

function buildPendenciasCriticas(d: PendInputs): PendenciasCriticas {
  const nameById: Record<string, string> = {};
  for (const i of d.inventories) nameById[i.id] = i.serviceName;

  const riscosAltoSemMitigacao = d.risks
    .filter((r) => {
      const isAlto = (r.severityLevel ?? "").includes("ALTO");
      const semMitigacao =
        r.status === "IDENTIFICADO" ||
        !r.mitigationPlan ||
        r.mitigationPlan.trim().length === 0;
      return isAlto && semMitigacao;
    })
    .slice(0, 8)
    .map((r) => {
      const def = RISCOS_BY_CODE[r.riskCode as RiskCode];
      return {
        processId: r.dataInventoryId,
        processName: nameById[r.dataInventoryId] ?? "—",
        code: r.riskCode,
        label: def?.shortLabel ?? r.riskCode,
      };
    });

  const processosSemBaseLegal = d.inventories
    .filter(
      (i) =>
        i.status === "APROVADO" &&
        (i.legalBasis === null || i.legalBasis.trim().length === 0),
    )
    .slice(0, 8)
    .map((i) => ({ id: i.id, name: i.serviceName }));

  const now = Date.now();
  const incidentesAbertosLongos = d.incidents
    .filter(
      (i) =>
        i.status !== "ENCERRADO" &&
        i.status !== "FALSO_POSITIVO" &&
        !i.closedAt,
    )
    .map((i) => {
      const days = Math.floor((now - i.detectedAt.getTime()) / 86_400_000);
      return { id: i.id, title: i.title, daysOpen: days };
    })
    .filter((i) => i.daysOpen > 30)
    .slice(0, 8);

  const operadoresAltoRiscoNaoAdequados = d.operators
    .filter(
      (o) =>
        o.contractRiskClass === "ALTO" &&
        o.lgpdComplianceStatus !== "ADEQUADO",
    )
    .slice(0, 8)
    .map((o) => ({ id: o.id, name: o.name }));

  return {
    riscosAltoSemMitigacao,
    processosSemBaseLegal,
    incidentesAbertosLongos,
    operadoresAltoRiscoNaoAdequados,
  };
}

// ============================================================
// Conclusão auto-gerada
// ============================================================

function generateConclusionText(args: {
  diagnostico: DiagnosticoOutput;
  maturidade: MaturityInfo;
  kpis: KpiBlock;
  pendencias: PendenciasCriticas;
  topRiscos: TopRisco[];
}): string {
  const { diagnostico, maturidade, kpis, pendencias, topRiscos } = args;
  const score = diagnostico.score.overall ?? 0;
  const level = maturidade.label;

  let tom: string;
  if (score >= 70) tom = "consistente";
  else if (score >= 50) tom = "em consolidação";
  else if (score >= 30) tom = "em construção";
  else tom = "incipiente";

  const pontosFortes = Object.values(diagnostico.score.sub)
    .filter((p) => p.value !== null && (p.value ?? 0) >= 60)
    .map((p) => p.label);

  const totalPendencias =
    pendencias.riscosAltoSemMitigacao.length +
    pendencias.processosSemBaseLegal.length +
    pendencias.incidentesAbertosLongos.length +
    pendencias.operadoresAltoRiscoNaoAdequados.length;

  const partes: string[] = [];

  partes.push(
    `A organização tem score de conformidade de **${score}/100**, classificada no nível de maturidade **${level}** (postura ${tom}).`,
  );

  if (pontosFortes.length > 0) {
    partes.push(
      `Pilares mais fortes: ${pontosFortes.slice(0, 2).join(" e ")}.`,
    );
  }

  partes.push(
    `Em volume operacional, a organização possui **${kpis.inventario.approved} processos aprovados** no Inventário, **${kpis.riscos.total} riscos identificados** (sendo ${kpis.riscos.altoCount} de severidade ALTA), e **${kpis.plano.total} ações** no Plano de Ação (${kpis.plano.concluidas} concluídas).`,
  );

  if (topRiscos.length > 0) {
    const topNomes = topRiscos
      .slice(0, 3)
      .map((r) => r.label)
      .join(", ");
    partes.push(`Os riscos mais frequentes são: ${topNomes}.`);
  }

  if (totalPendencias > 0) {
    const blocos: string[] = [];
    if (pendencias.riscosAltoSemMitigacao.length > 0) {
      blocos.push(
        `${pendencias.riscosAltoSemMitigacao.length} risco(s) ALTO sem mitigação`,
      );
    }
    if (pendencias.processosSemBaseLegal.length > 0) {
      blocos.push(
        `${pendencias.processosSemBaseLegal.length} processo(s) aprovado(s) sem base legal`,
      );
    }
    if (pendencias.incidentesAbertosLongos.length > 0) {
      blocos.push(
        `${pendencias.incidentesAbertosLongos.length} incidente(s) em aberto há mais de 30 dias`,
      );
    }
    if (pendencias.operadoresAltoRiscoNaoAdequados.length > 0) {
      blocos.push(
        `${pendencias.operadoresAltoRiscoNaoAdequados.length} operador(es) de alto risco não adequado(s)`,
      );
    }
    partes.push(
      `Pendências críticas que requerem atenção: ${blocos.join("; ")}.`,
    );
  } else {
    partes.push(`Nenhuma pendência crítica detectada nas dimensões avaliadas.`);
  }

  if (kpis.incidentes.anpdOverdue > 0) {
    partes.push(
      `⚠️ **Atenção:** existe(m) ${kpis.incidentes.anpdOverdue} incidente(s) com prazo de notificação à ANPD vencido (Art. 48 §1º LGPD).`,
    );
  }

  partes.push(
    `Recomenda-se priorizar as próximas etapas listadas neste relatório, em especial as classificadas como prioridade ALTA, e revisar o Plano de Ação trimestralmente.`,
  );

  return partes.join("\n\n");
}

// ============================================================
// B5 — Alertas de prazo regulatório
// ============================================================

interface AlertasInputs {
  ripds: ReadonlyArray<{
    id: string;
    title: string;
    status: string;
    approvedAt: Date | null;
    updatedAt: Date;
  }>;
  policies: ReadonlyArray<{
    id: string;
    status: string;
    publishedAt: Date | null;
    type: string;
  }>;
  capacitacaoEvents: ReadonlyArray<{
    id: string;
    title: string;
    eixo: string;
    status: string;
    scheduledAt: Date | null;
  }>;
  operators: ReadonlyArray<{
    id: string;
    name: string;
    contractExpiresAt: Date | null;
  }>;
}

const POLICY_TYPE_LABEL: Record<string, string> = {
  POLITICA_PRIVACIDADE_INTERNO: "Política Interna",
  POLITICA_PRIVACIDADE_EXTERNO: "Aviso de Privacidade",
  POLITICA_COOKIES: "Política de Cookies",
  TERMO_USO: "Termo de Uso",
  POLITICA_PGP: "Política do PGP",
};

function buildAlertasPrazo(d: AlertasInputs): AlertasPrazo {
  const now = Date.now();
  const ms_per_day = 86_400_000;

  // RIPDs aprovados há > 90 dias sem update (sinaliza falta de revisão)
  const ripdsSemRevisaoLonga = d.ripds
    .filter((r) => r.status === "APROVADO")
    .map((r) => {
      const ref = r.updatedAt.getTime();
      const days = Math.floor((now - ref) / ms_per_day);
      return { id: r.id, title: r.title, daysSinceUpdate: days };
    })
    .filter((r) => r.daysSinceUpdate > 90)
    .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate)
    .slice(0, 8);

  // Políticas publicadas há > 365 dias (sugere revisão anual)
  const politicasVencendo = d.policies
    .filter((p) => p.status === "PUBLICADA" && p.publishedAt)
    .map((p) => {
      const days = Math.floor(
        (now - (p.publishedAt as Date).getTime()) / ms_per_day,
      );
      return {
        id: p.id,
        title: POLICY_TYPE_LABEL[p.type] ?? p.type,
        daysSincePublish: days,
      };
    })
    .filter((p) => p.daysSincePublish > 365)
    .sort((a, b) => b.daysSincePublish - a.daysSincePublish)
    .slice(0, 5);

  // Capacitações PLANEJADAS com scheduledAt no passado e ainda não realizadas
  const capacitacoesPlanejadasAtrasadas = d.capacitacaoEvents
    .filter(
      (e) =>
        e.status === "PLANEJADO" &&
        e.scheduledAt &&
        e.scheduledAt.getTime() < now,
    )
    .map((e) => {
      const days = Math.floor(
        (now - (e.scheduledAt as Date).getTime()) / ms_per_day,
      );
      return {
        id: e.id,
        title: e.title,
        eixo: e.eixo,
        daysOverdue: days,
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, 8);

  // Contratos de Operadores expirando nos próximos 90 dias
  const contratosOperadorVencendo = d.operators
    .filter((o) => o.contractExpiresAt)
    .map((o) => {
      const days = Math.floor(
        ((o.contractExpiresAt as Date).getTime() - now) / ms_per_day,
      );
      return { id: o.id, name: o.name, daysToExpire: days };
    })
    .filter((o) => o.daysToExpire >= 0 && o.daysToExpire <= 90)
    .sort((a, b) => a.daysToExpire - b.daysToExpire)
    .slice(0, 8);

  return {
    ripdsSemRevisaoLonga,
    politicasVencendo,
    capacitacoesPlanejadasAtrasadas,
    contratosOperadorVencendo,
  };
}

// ============================================================
// B1 — Capacitação detalhada
// ============================================================

const EIXO_LABELS: Record<string, string> = {
  ONBOARDING: "Onboarding",
  PILULAS: "Pílulas",
  PRATICA: "Prática",
  DEPARTAMENTAL: "Departamental",
  MONITORAMENTO: "Monitoramento",
};

function buildCapacitacaoDetalhada(
  events: ReadonlyArray<{
    id: string;
    title: string;
    eixo: string;
    audience: string;
    status: string;
    scheduledAt: Date | null;
    completedAt: Date | null;
  }>,
): CapacitacaoDetalhada {
  const total = events.length;
  const realizados = events.filter((e) => e.status === "REALIZADO").length;
  const planejados = events.filter((e) => e.status === "PLANEJADO").length;
  const cancelados = events.filter((e) => e.status === "CANCELADO").length;

  // Por eixo
  const porEixo: Record<string, { total: number; realizados: number }> = {};
  for (const eixo of Object.keys(EIXO_LABELS)) {
    porEixo[eixo] = { total: 0, realizados: 0 };
  }
  for (const e of events) {
    if (!porEixo[e.eixo]) {
      porEixo[e.eixo] = { total: 0, realizados: 0 };
    }
    porEixo[e.eixo].total += 1;
    if (e.status === "REALIZADO") porEixo[e.eixo].realizados += 1;
  }

  // Por público (count)
  const porPublico: Record<string, number> = {};
  for (const e of events) {
    porPublico[e.audience] = (porPublico[e.audience] ?? 0) + 1;
  }

  // Próximos 90 dias — eventos planejados com scheduledAt futuro
  const now = Date.now();
  const horizon = now + 90 * 86_400_000;
  const proximosEventos = events
    .filter(
      (e) =>
        e.status === "PLANEJADO" &&
        e.scheduledAt &&
        e.scheduledAt.getTime() >= now &&
        e.scheduledAt.getTime() <= horizon,
    )
    .sort((a, b) => {
      const aT = a.scheduledAt?.getTime() ?? 0;
      const bT = b.scheduledAt?.getTime() ?? 0;
      return aT - bT;
    })
    .slice(0, 8)
    .map((e) => ({
      id: e.id,
      title: e.title,
      eixo: e.eixo,
      audience: e.audience,
      scheduledAt: (e.scheduledAt as Date).toISOString(),
    }));

  return {
    totalEventos: total,
    realizados,
    planejados,
    cancelados,
    porEixo,
    porPublico,
    proximosEventos,
  };
}

// ============================================================
// Helpers públicos pra UI usar (labels)
// ============================================================

export function eixoLabel(eixo: string): string {
  return EIXO_LABELS[eixo] ?? eixo;
}

const AUDIENCE_LABELS: Record<string, string> = {
  GERAL: "Geral",
  RH_MARKETING: "RH/Marketing",
  TI_SEGURANCA: "TI/Segurança",
  EXTERNOS: "Externos",
  DIRETORIA: "Diretoria",
  ATENDIMENTO: "Atendimento",
  NOVOS_COLABORADORES: "Novos colaboradores",
};

export function audienceLabel(audience: string): string {
  return AUDIENCE_LABELS[audience] ?? audience;
}
