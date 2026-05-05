/**
 * Engine de pontuação do Formulário de Avaliação de Terceiros
 * (Checkpoint 14 / G2).
 *
 * Calcula scores Cyber e LGPD SEPARADOS a partir das respostas do
 * terceiro. Inspirado nos critérios da Denise no XLSX modelo:
 *   - Cada resposta correta = 1 ponto
 *   - "NA" não conta no score nem no max (item neutro)
 *   - % por dimensão = score / max ponderado
 *
 * Classificação (igual XLSX):
 *   - <60%      → ALTO (vermelho — alto risco de contratar)
 *   - 60–<90%   → MEDIO (amarelo)
 *   - ≥90%      → BAIXO (verde — terceiro maduro)
 *
 * Engine pura — testável sem DB.
 */

import {
  FORM_QUESTIONS,
  getScorableQuestions,
  getMaxScore,
  type FormResponses,
  type FormAnswer,
} from "@/lib/operadores-formulario";

export type AssessmentRiskClass = "ALTO" | "MEDIO" | "BAIXO";

export interface DimensionScore {
  /** Pontos obtidos (0..max). NA ignorado. */
  score: number;
  /** Total possível considerando NA descartado. */
  max: number;
  /** Total teórico (do catálogo, sem NA). */
  maxAbsolute: number;
  /** % = score / max, arredondado a 1 casa decimal. 0 se max=0. */
  percentage: number;
  riskClass: AssessmentRiskClass;
  /** Quantas perguntas o terceiro ainda não respondeu. */
  unanswered: number;
  /** Quantas marcou NA. */
  notApplicable: number;
}

export interface AssessmentScoreResult {
  cyber: DimensionScore;
  lgpd: DimensionScore;
  /** Score combinado (média ponderada das 2 dimensões). */
  overall: DimensionScore;
  /** Total de perguntas no catálogo (excluindo parents). */
  totalQuestions: number;
  /** % de completude — quantas respostas (S/N/NA) o terceiro deu. */
  completeness: number;
}

// ============================================================
// Cálculo
// ============================================================

export function classifyRiskByPercentage(pct: number): AssessmentRiskClass {
  if (pct < 60) return "ALTO";
  if (pct < 90) return "MEDIO";
  return "BAIXO";
}

function isCyberQuestion(tag: string | null): boolean {
  return tag === "CYBER" || tag === "CYBER_LGPD";
}

function isLgpdQuestion(tag: string | null): boolean {
  return tag === "LGPD" || tag === "CYBER_LGPD";
}

export function computeAssessmentScore(
  responses: FormResponses
): AssessmentScoreResult {
  const scorable = getScorableQuestions();
  const totalQuestions = scorable.length;

  let answered = 0;
  let cyberScore = 0;
  let cyberAdjustedMax = getMaxScore("CYBER");
  let cyberNA = 0;
  let cyberUnanswered = 0;

  let lgpdScore = 0;
  let lgpdAdjustedMax = getMaxScore("LGPD");
  let lgpdNA = 0;
  let lgpdUnanswered = 0;

  for (const q of scorable) {
    const r = responses[q.id];
    const isCyber = isCyberQuestion(q.tag);
    const isLgpd = isLgpdQuestion(q.tag);

    if (!r || !r.answer) {
      // Não respondida: conta como erro implícito até ser respondida.
      // Mas pra UI, exibimos como "unanswered".
      if (isCyber) cyberUnanswered += 1;
      if (isLgpd) lgpdUnanswered += 1;
      continue;
    }

    answered += 1;

    if (r.answer === "NA") {
      // NA não conta nem no score nem no max
      if (isCyber) {
        cyberNA += 1;
        cyberAdjustedMax -= 1;
      }
      if (isLgpd) {
        lgpdNA += 1;
        lgpdAdjustedMax -= 1;
      }
      continue;
    }

    // S ou N — compara com gabarito
    const correct = q.expectedAnswer === r.answer;
    if (correct) {
      if (isCyber) cyberScore += 1;
      if (isLgpd) lgpdScore += 1;
    }
  }

  const cyberPct = cyberAdjustedMax > 0 ? (cyberScore / cyberAdjustedMax) * 100 : 0;
  const lgpdPct = lgpdAdjustedMax > 0 ? (lgpdScore / lgpdAdjustedMax) * 100 : 0;

  // Overall: soma simples dos pontos sobre soma dos max
  const overallScore = cyberScore + lgpdScore;
  const overallMax = cyberAdjustedMax + lgpdAdjustedMax;
  const overallPct = overallMax > 0 ? (overallScore / overallMax) * 100 : 0;

  return {
    cyber: {
      score: cyberScore,
      max: cyberAdjustedMax,
      maxAbsolute: getMaxScore("CYBER"),
      percentage: round1(cyberPct),
      riskClass: classifyRiskByPercentage(cyberPct),
      unanswered: cyberUnanswered,
      notApplicable: cyberNA,
    },
    lgpd: {
      score: lgpdScore,
      max: lgpdAdjustedMax,
      maxAbsolute: getMaxScore("LGPD"),
      percentage: round1(lgpdPct),
      riskClass: classifyRiskByPercentage(lgpdPct),
      unanswered: lgpdUnanswered,
      notApplicable: lgpdNA,
    },
    overall: {
      score: overallScore,
      max: overallMax,
      maxAbsolute: getMaxScore("CYBER") + getMaxScore("LGPD"),
      percentage: round1(overallPct),
      riskClass: classifyRiskByPercentage(overallPct),
      unanswered: cyberUnanswered + lgpdUnanswered,
      notApplicable: cyberNA + lgpdNA,
    },
    totalQuestions,
    completeness: round1(
      totalQuestions > 0 ? (answered / totalQuestions) * 100 : 0
    ),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ============================================================
// Labels (UI)
// ============================================================

export function assessmentRiskLabel(c: AssessmentRiskClass): string {
  switch (c) {
    case "ALTO":  return "Alto risco";
    case "MEDIO": return "Médio risco";
    case "BAIXO": return "Baixo risco";
    default:      return "—";
  }
}

export function assessmentRiskBadgeClass(c: AssessmentRiskClass): string {
  switch (c) {
    case "ALTO":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
    case "MEDIO":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "BAIXO":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

// ============================================================
// Status do assessment (workflow)
// ============================================================

export const ASSESSMENT_STATUS = {
  /** DPO criou; ainda não enviou pro terceiro. */
  PENDENTE: "PENDENTE",
  /** Link público gerado, terceiro recebeu (preenchimento em andamento). */
  AGUARDANDO_TERCEIRO: "AGUARDANDO_TERCEIRO",
  /** Terceiro submeteu — DPO precisa revisar respostas. */
  RESPONDIDO: "RESPONDIDO",
  /** DPO revisou e finalizou (assessment "fechado"). */
  REVISADO: "REVISADO",
  /** DPO cancelou (token revogado). */
  CANCELADO: "CANCELADO",
} as const;
export type AssessmentStatus =
  (typeof ASSESSMENT_STATUS)[keyof typeof ASSESSMENT_STATUS];

export const VALID_ASSESSMENT_STATUSES = new Set(
  Object.values(ASSESSMENT_STATUS)
);

export function assessmentStatusLabel(s: string | null | undefined): string {
  switch (s) {
    case "PENDENTE":              return "Aguardando envio";
    case "AGUARDANDO_TERCEIRO":   return "Com o terceiro";
    case "RESPONDIDO":            return "Aguardando revisão";
    case "REVISADO":              return "Concluído";
    case "CANCELADO":             return "Cancelado";
    default:                      return "—";
  }
}

export function assessmentStatusBadgeClass(
  s: string | null | undefined
): string {
  switch (s) {
    case "PENDENTE":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "AGUARDANDO_TERCEIRO":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "RESPONDIDO":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "REVISADO":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    case "CANCELADO":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

// ============================================================
// Token público (geração)
// ============================================================

/**
 * Gera token criptográfico aleatório pra link público de avaliação.
 * Usa crypto.randomUUID se disponível, com fallback simples.
 */
export function generateAssessmentToken(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID().replace(/-/g, "");
  }
  // Fallback (não-prod):
  return Array.from({ length: 4 }, () =>
    Math.random().toString(36).slice(2)
  )
    .join("")
    .slice(0, 32);
}
