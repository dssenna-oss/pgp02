/**
 * Engine de scoring do Diagnóstico de Privacidade (Checkpoint 10).
 *
 * Calcula 4 sub-scores (Inventário · Bases Legais · Riscos · GAP) e
 * combina num score agregado por média ponderada. Também gera uma
 * lista priorizada de recomendações (combinando GAP + Riscos + Bases
 * legais).
 *
 * Função pura: recebe dados já carregados pelo caller (a rota
 * `/api/diagnostico` faz as queries Prisma e passa pra cá). Sem
 * chamadas a banco aqui.
 */

import { decodeSeverity, type RiskSeverity } from "@/lib/riscos-catalog";
import { GAP_TOTAL } from "@/lib/gap-catalog";

// ============================================================
// Inputs (carregados pela API consolidadora)
// ============================================================

export interface DiagnosticoInput {
  /** Snapshot de todos os processos da org. */
  inventories: ReadonlyArray<{
    id: string;
    serviceName: string;
    setor: string | null;
    status: string;
    dataCategory: string | null;
    legalBasis: string | null;
    legalBasisSensitive: string | null;
    legalBasisComments: string | null;
  }>;
  /** Riscos identificados em processos APROVADOS. */
  risks: ReadonlyArray<{
    dataInventoryId: string;
    riskCode: string;
    status: string;
    severityLevel: string | null;
    mitigationPlan: string | null;
  }>;
  /** Respostas do GAP. */
  gapAnswers: ReadonlyArray<{
    controlCode: string;
    aderencia: string | null;
    mapeamento: string | null;
    pontoMelhoria: string | null;
  }>;
  /** Total de processos aprovados (cacheado pra não recalcular). */
  approvedCount: number;
  /** Map id → serviceName pra usar nas recomendações */
  inventoryNameById: Record<string, string>;
}

// ============================================================
// Outputs
// ============================================================

export type SubScoreKey = "INVENTARIO" | "BASES" | "RISCOS" | "GAP";

export interface SubScore {
  key: SubScoreKey;
  label: string;
  /** 0-100, ou null se não dá pra calcular ainda. */
  value: number | null;
  /** Texto curto explicando o numerador/denominador (ex: "12/15 aprovados"). */
  detail: string;
  /** Texto curto sobre o que esse score representa, pra direção entender. */
  hint: string;
  /** Peso na composição do score final (0-1). */
  weight: number;
}

export interface DiagnosticoScore {
  /** Score final 0-100 (média ponderada dos sub-scores não-nulos). */
  overall: number | null;
  /** Os 4 sub-scores. */
  sub: Record<SubScoreKey, SubScore>;
  /** Maturidade textual do score geral. */
  maturityLabel: string;
}

export type RecommendationPriority = "ALTA" | "MEDIA" | "BAIXA";
export type RecommendationSource = "RISCO" | "GAP" | "BASES";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  source: RecommendationSource;
  /** Link interno pra resolver (clica e vai pra tela certa). */
  href: string;
  /** Contexto curto (nome do processo / domínio do GAP / etc). */
  context: string | null;
}

export interface DiagnosticoOutput {
  score: DiagnosticoScore;
  recommendations: Recommendation[];
  /** Quando os dados foram coletados — pra mostrar na UI. */
  generatedAt: string;
  /** Estatísticas brutas usadas (debug + UI secundária). */
  raw: {
    totalProcessos: number;
    aprovados: number;
    submetidos: number;
    rascunhos: number;
    devolvidos: number;
    riscosTotal: number;
    riscosAlto: number;
    riscosSemMitigacao: number;
    gapRespondidos: number;
    gapAderente: number;
    gapParcial: number;
    gapNaoAderente: number;
    basesCompletas: number;
    basesIncompletas: number;
  };
}

// ============================================================
// Pesos default (somam 1.0)
// ============================================================

const WEIGHTS: Record<SubScoreKey, number> = {
  INVENTARIO: 0.10, // Porta de entrada — só precisa estar feito
  BASES: 0.20,      // Compliance básico
  RISCOS: 0.30,     // Operacional — riscos sob controle
  GAP: 0.40,        // Mais granular e representativo da maturidade
};

// ============================================================
// Helpers
// ============================================================

function basesAreComplete(inv: DiagnosticoInput["inventories"][number]): boolean {
  const hasComum = !!(inv.legalBasis && inv.legalBasis.trim() && inv.legalBasis !== "[Em preenchimento]");
  if (!hasComum) return false;
  // Se categoria menciona sensível, exige base sensível também
  const isSensitive = /sens[íi]ve/i.test(inv.dataCategory ?? "");
  if (isSensitive) {
    return !!(inv.legalBasisSensitive && inv.legalBasisSensitive.trim());
  }
  return true;
}

function maturityFromScore(score: number | null): string {
  if (score == null) return "Sem dados suficientes ainda";
  if (score >= 90) return "Excelente";
  if (score >= 75) return "Boa";
  if (score >= 50) return "Em desenvolvimento";
  if (score >= 25) return "Inicial";
  return "Crítico";
}

// ============================================================
// Sub-score: Inventário
// ============================================================

function computeInventarioScore(input: DiagnosticoInput): SubScore {
  const total = input.inventories.length;
  const aprovados = input.approvedCount;
  if (total === 0) {
    return {
      key: "INVENTARIO",
      label: "Inventário",
      value: null,
      detail: "0 processos cadastrados",
      hint: "Mapeie os processos de tratamento da organização. É o ponto de partida obrigatório.",
      weight: WEIGHTS.INVENTARIO,
    };
  }
  const value = Math.round((aprovados / total) * 100);
  return {
    key: "INVENTARIO",
    label: "Inventário",
    value,
    detail: `${aprovados} / ${total} aprovado(s)`,
    hint: "Quanto dos processos cadastrados já passou pela aprovação do DPO.",
    weight: WEIGHTS.INVENTARIO,
  };
}

// ============================================================
// Sub-score: Bases Legais
// ============================================================

function computeBasesScore(input: DiagnosticoInput): SubScore {
  const aprovados = input.inventories.filter((i) => i.status === "APROVADO");
  if (aprovados.length === 0) {
    return {
      key: "BASES",
      label: "Bases Legais",
      value: null,
      detail: "Nenhum processo aprovado ainda",
      hint: "Score começa a contar quando houver pelo menos 1 processo aprovado.",
      weight: WEIGHTS.BASES,
    };
  }
  const completas = aprovados.filter(basesAreComplete).length;
  const value = Math.round((completas / aprovados.length) * 100);
  return {
    key: "BASES",
    label: "Bases Legais",
    value,
    detail: `${completas} / ${aprovados.length} processo(s) com base completa`,
    hint: "Processos aprovados que têm base legal preenchida (e base sensível, quando aplicável).",
    weight: WEIGHTS.BASES,
  };
}

// ============================================================
// Sub-score: Riscos
// ============================================================

function computeRiscosScore(input: DiagnosticoInput): SubScore {
  const total = input.risks.length;
  if (total === 0) {
    if (input.approvedCount === 0) {
      return {
        key: "RISCOS",
        label: "Riscos",
        value: null,
        detail: "Sem processos aprovados pra analisar",
        hint: "Análise de Riscos só roda em processos aprovados. Aprove um pra começar.",
        weight: WEIGHTS.RISCOS,
      };
    }
    return {
      key: "RISCOS",
      label: "Riscos",
      value: 100,
      detail: "Nenhum risco identificado",
      hint: "Todos os processos aprovados foram avaliados e nenhum risco foi marcado.",
      weight: WEIGHTS.RISCOS,
    };
  }
  // Score = % riscos "sob controle" (em mitigação, aceito, eliminado)
  // vs identificados parados.
  const sobControle = input.risks.filter(
    (r) =>
      r.status === "EM_MITIGACAO" ||
      r.status === "ACEITO" ||
      r.status === "ELIMINADO",
  ).length;
  const value = Math.round((sobControle / total) * 100);
  return {
    key: "RISCOS",
    label: "Riscos",
    value,
    detail: `${sobControle} / ${total} sob controle`,
    hint: "Riscos com status 'Em mitigação', 'Aceito' ou 'Eliminado'. Identificados parados pesam negativamente.",
    weight: WEIGHTS.RISCOS,
  };
}

// ============================================================
// Sub-score: GAP
// ============================================================

function computeGapScore(input: DiagnosticoInput): SubScore {
  // Considera SÓ controles com aderência preenchida (NA exclui)
  const respondidos = input.gapAnswers.filter(
    (a) => a.aderencia && a.aderencia !== "NA",
  );
  if (respondidos.length === 0) {
    return {
      key: "GAP",
      label: "GAP Analysis",
      value: null,
      detail: "Nenhum controle respondido",
      hint: `O GAP tem ${GAP_TOTAL} controles. Quando você responder os primeiros, o score começa a aparecer aqui.`,
      weight: WEIGHTS.GAP,
    };
  }
  // Pesos: ADERENTE=1.0, PARCIAL=0.5, NAO_ADERENTE=0
  let weighted = 0;
  for (const a of respondidos) {
    if (a.aderencia === "ADERENTE") weighted += 1.0;
    else if (a.aderencia === "PARCIAL") weighted += 0.5;
  }
  const value = Math.round((weighted / respondidos.length) * 100);
  return {
    key: "GAP",
    label: "GAP Analysis",
    value,
    detail: `${respondidos.length} / ${GAP_TOTAL} controles avaliados`,
    hint: "Aderente = 100%, Parcial = 50%, Não aderente = 0%. N/A não conta. Score sobe à medida que você responde.",
    weight: WEIGHTS.GAP,
  };
}

// ============================================================
// Score final
// ============================================================

function computeOverallScore(sub: Record<SubScoreKey, SubScore>): number | null {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const key of Object.keys(sub) as SubScoreKey[]) {
    const s = sub[key];
    if (s.value == null) continue;
    weightedSum += s.value * s.weight;
    totalWeight += s.weight;
  }
  if (totalWeight === 0) return null;
  return Math.round(weightedSum / totalWeight);
}

// ============================================================
// Recomendações priorizadas
// ============================================================

function buildRecommendations(input: DiagnosticoInput): Recommendation[] {
  const recs: Recommendation[] = [];

  // 1) Bases legais incompletas em processos APROVADOS — urgência ALTA
  for (const inv of input.inventories) {
    if (inv.status !== "APROVADO") continue;
    if (basesAreComplete(inv)) continue;
    const isSensitive = /sens[íi]ve/i.test(inv.dataCategory ?? "");
    const missing =
      !inv.legalBasis || !inv.legalBasis.trim() || inv.legalBasis === "[Em preenchimento]"
        ? "base legal comum"
        : "base legal sensível";
    recs.push({
      id: `bases-${inv.id}`,
      title: `Definir ${missing} para "${inv.serviceName}"`,
      description: isSensitive
        ? "Processo aprovado declara dados sensíveis mas não tem a base legal exigida pelo Art. 11 da LGPD preenchida."
        : "Processo aprovado sem a base legal preenchida (Art. 7º). Compliance básico ausente.",
      priority: "ALTA",
      source: "BASES",
      href: `/dashboard/inventario/${inv.id}/bases-legais`,
      context: inv.setor ?? null,
    });
  }

  // 2) Riscos IDENTIFICADO de severidade ALTO — urgência ALTA
  // 3) Riscos IDENTIFICADO de outras severidades — urgência MEDIA
  // 4) Riscos EM_MITIGACAO sem plano de mitigação preenchido — urgência MEDIA
  for (const risk of input.risks) {
    const sev = decodeSeverity(risk.severityLevel)?.severity ?? null;
    const procName = input.inventoryNameById[risk.dataInventoryId] ?? "Processo";
    if (risk.status === "IDENTIFICADO") {
      const priority: RecommendationPriority = sev === "ALTO" ? "ALTA" : "MEDIA";
      recs.push({
        id: `risco-${risk.dataInventoryId}-${risk.riskCode}`,
        title: `Tratar risco "${risk.riskCode}" em "${procName}"`,
        description: sev
          ? `Risco classificado como ${sev === "ALTO" ? "alto" : sev === "MEDIO" ? "médio" : "baixo"} ainda sem mitigação iniciada.`
          : "Risco identificado sem severidade classificada nem plano de mitigação. Detalhe a matriz Probabilidade × Impacto.",
        priority,
        source: "RISCO",
        href: `/dashboard/inventario/${risk.dataInventoryId}/risco/${risk.riskCode}`,
        context: null,
      });
    } else if (risk.status === "EM_MITIGACAO" && !risk.mitigationPlan) {
      recs.push({
        id: `risco-plan-${risk.dataInventoryId}-${risk.riskCode}`,
        title: `Documentar plano de mitigação do risco "${risk.riskCode}" em "${procName}"`,
        description:
          "Risco está marcado como 'Em mitigação' mas não tem plano documentado. Sem plano, é difícil acompanhar evolução.",
        priority: "MEDIA",
        source: "RISCO",
        href: `/dashboard/inventario/${risk.dataInventoryId}/risco/${risk.riskCode}`,
        context: null,
      });
    }
  }

  // 5) Pontos de Melhoria do GAP em controles NAO_ADERENTE — urgência ALTA
  // 6) Pontos de Melhoria do GAP em controles PARCIAL — urgência MEDIA
  for (const a of input.gapAnswers) {
    if (!a.pontoMelhoria || !a.pontoMelhoria.trim()) continue;
    if (a.aderencia === "NAO_ADERENTE") {
      recs.push({
        id: `gap-${a.controlCode}`,
        title: `GAP #${a.controlCode}: ${truncate(a.pontoMelhoria, 60)}`,
        description: "Controle marcado como 'Não aderente' com Ponto de Melhoria definido.",
        priority: "ALTA",
        source: "GAP",
        href: `/dashboard/gap-analysis`,
        context: null,
      });
    } else if (a.aderencia === "PARCIAL") {
      recs.push({
        id: `gap-${a.controlCode}`,
        title: `GAP #${a.controlCode}: ${truncate(a.pontoMelhoria, 60)}`,
        description: "Controle parcialmente aderente — fechar a lacuna pra atingir 100%.",
        priority: "MEDIA",
        source: "GAP",
        href: `/dashboard/gap-analysis`,
        context: null,
      });
    }
  }

  // Ordenação: ALTA > MEDIA > BAIXA, e dentro de cada nível mantém ordem
  // estável (BASES → RISCO → GAP) — garante prioridade pra compliance
  // básico e mitigação ativa.
  const priorityOrder: Record<RecommendationPriority, number> = {
    ALTA: 0,
    MEDIA: 1,
    BAIXA: 2,
  };
  const sourceOrder: Record<RecommendationSource, number> = {
    BASES: 0,
    RISCO: 1,
    GAP: 2,
  };
  recs.sort((a, b) => {
    const dp = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (dp !== 0) return dp;
    return sourceOrder[a.source] - sourceOrder[b.source];
  });

  return recs;
}

function truncate(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

// ============================================================
// Função pública
// ============================================================

export function buildDiagnostico(input: DiagnosticoInput): DiagnosticoOutput {
  const sub: Record<SubScoreKey, SubScore> = {
    INVENTARIO: computeInventarioScore(input),
    BASES: computeBasesScore(input),
    RISCOS: computeRiscosScore(input),
    GAP: computeGapScore(input),
  };
  const overall = computeOverallScore(sub);
  const score: DiagnosticoScore = {
    overall,
    sub,
    maturityLabel: maturityFromScore(overall),
  };

  const recommendations = buildRecommendations(input);

  // Stats brutas pra UI secundária
  const aprovados = input.inventories.filter((i) => i.status === "APROVADO").length;
  const raw: DiagnosticoOutput["raw"] = {
    totalProcessos: input.inventories.length,
    aprovados,
    submetidos: input.inventories.filter((i) => i.status === "SUBMETIDO").length,
    rascunhos: input.inventories.filter((i) => i.status === "RASCUNHO").length,
    devolvidos: input.inventories.filter((i) => i.status === "DEVOLVIDO").length,
    riscosTotal: input.risks.length,
    riscosAlto: input.risks.filter(
      (r) => decodeSeverity(r.severityLevel)?.severity === ("ALTO" satisfies RiskSeverity),
    ).length,
    riscosSemMitigacao: input.risks.filter((r) => r.status === "IDENTIFICADO").length,
    gapRespondidos: input.gapAnswers.filter((a) => a.aderencia).length,
    gapAderente: input.gapAnswers.filter((a) => a.aderencia === "ADERENTE").length,
    gapParcial: input.gapAnswers.filter((a) => a.aderencia === "PARCIAL").length,
    gapNaoAderente: input.gapAnswers.filter((a) => a.aderencia === "NAO_ADERENTE").length,
    basesCompletas: input.inventories.filter(
      (i) => i.status === "APROVADO" && basesAreComplete(i),
    ).length,
    basesIncompletas: input.inventories.filter(
      (i) => i.status === "APROVADO" && !basesAreComplete(i),
    ).length,
  };

  return {
    score,
    recommendations,
    generatedAt: new Date().toISOString(),
    raw,
  };
}

// ============================================================
// Helpers de UI (label + classe Tailwind por score)
// ============================================================

export function scoreColor(score: number | null): {
  text: string;
  bg: string;
  border: string;
  bar: string;
} {
  if (score == null) {
    return {
      text: "text-gray-500 dark:text-gray-400",
      bg: "bg-gray-50 dark:bg-gray-900",
      border: "border-gray-200 dark:border-gray-800",
      bar: "bg-gray-300 dark:bg-gray-700",
    };
  }
  if (score >= 75) {
    return {
      text: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
      border: "border-emerald-300 dark:border-emerald-800",
      bar: "bg-emerald-500",
    };
  }
  if (score >= 50) {
    return {
      text: "text-blue-700 dark:text-blue-300",
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-300 dark:border-blue-800",
      bar: "bg-blue-500",
    };
  }
  if (score >= 25) {
    return {
      text: "text-amber-800 dark:text-amber-300",
      bg: "bg-amber-50 dark:bg-amber-950/20",
      border: "border-amber-300 dark:border-amber-800",
      bar: "bg-amber-500",
    };
  }
  return {
    text: "text-red-700 dark:text-red-300",
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-300 dark:border-red-800",
    bar: "bg-red-500",
  };
}

export const SUB_SCORE_ORDER: SubScoreKey[] = [
  "INVENTARIO",
  "BASES",
  "RISCOS",
  "GAP",
];

export function priorityBadgeClass(p: RecommendationPriority): string {
  switch (p) {
    case "ALTA":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
    case "MEDIA":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "BAIXA":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
  }
}

export function sourceBadgeClass(s: RecommendationSource): string {
  switch (s) {
    case "BASES":
      return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800";
    case "RISCO":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800";
    case "GAP":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800";
  }
}

export function sourceLabel(s: RecommendationSource): string {
  switch (s) {
    case "BASES":
      return "Bases Legais";
    case "RISCO":
      return "Risco";
    case "GAP":
      return "GAP";
  }
}
