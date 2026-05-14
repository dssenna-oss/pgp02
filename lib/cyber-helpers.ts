/**
 * Helpers da Maturidade Cibernética (Checkpoint 22).
 *
 * Auth gate, DTO, enums (5 tipos de aderência), score engine ponderado
 * por função NIST, stats consolidadas.
 *
 * Visibilidade: igual ao GAP — apenas DPO acessa por padrão.
 * Pra delegação à TI, o controle vai pro user delegado mas a aprovação
 * final continua sendo do DPO.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import {
  CYBER_CONTROLS,
  type CyberControl,
  type CyberFunction,
} from "./cyber-catalog";

// ============================================================
// Enums (Aderência + EvidenceFrom)
// ============================================================

/** 5 valores possíveis pra resposta de cada controle. */
export const CYBER_ADERENCIA = {
  ADERENTE: "ADERENTE",
  PARCIAL: "PARCIAL",
  NAO_ADERENTE: "NAO_ADERENTE",
  NAO_APLICA: "NAO_APLICA",
  DELEGADO_TI: "DELEGADO_TI",
} as const;
export type CyberAderencia = (typeof CYBER_ADERENCIA)[keyof typeof CYBER_ADERENCIA];

export const VALID_CYBER_ADERENCIAS = new Set<string>(Object.values(CYBER_ADERENCIA));

export function cyberAderenciaLabel(a: string | null | undefined): string {
  switch (a) {
    case "ADERENTE":     return "Aderente";
    case "PARCIAL":      return "Parcial";
    case "NAO_ADERENTE": return "Não aderente";
    case "NAO_APLICA":   return "Não se aplica";
    case "DELEGADO_TI":  return "Delegado à TI";
    default:             return "Não respondido";
  }
}

export function cyberAderenciaBadgeClass(a: string | null | undefined): string {
  switch (a) {
    case "ADERENTE":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    case "PARCIAL":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "NAO_ADERENTE":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
    case "NAO_APLICA":
      return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    case "DELEGADO_TI":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}

// ============================================================
// DTO (saída pras APIs)
// ============================================================

export interface CyberAnswerDTO {
  id: string;
  controlCode: string;
  aderencia: CyberAderencia;
  pontoMelhoria: string | null;
  evidence: string | null;
  evidenceFrom: string | null;
  delegatedTo: { id: string; name: string | null; email: string } | null;
  delegatedAt: string | null;
  delegatedDue: string | null;
  answeredBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CyberAnswerRow {
  id: string;
  controlCode: string;
  aderencia: string;
  pontoMelhoria: string | null;
  evidence: string | null;
  evidenceFrom: string | null;
  delegatedTo?: { id: string; name: string | null; email: string } | null;
  delegatedAt: Date | null;
  delegatedDue: Date | null;
  answeredBy?: { id: string; name: string | null; email: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export function cyberAnswerToDTO(r: CyberAnswerRow): CyberAnswerDTO {
  return {
    id: r.id,
    controlCode: r.controlCode,
    aderencia: r.aderencia as CyberAderencia,
    pontoMelhoria: r.pontoMelhoria,
    evidence: r.evidence,
    evidenceFrom: r.evidenceFrom,
    delegatedTo: r.delegatedTo ?? null,
    delegatedAt: r.delegatedAt ? r.delegatedAt.toISOString() : null,
    delegatedDue: r.delegatedDue ? r.delegatedDue.toISOString() : null,
    answeredBy: r.answeredBy ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// ============================================================
// Auth (DPO-only por padrão; user delegado lê própria delegação)
// ============================================================

export type CyberAuthUser = {
  id: string;
  companyId: string;
  role: string;
  isDPO: boolean;
};

export async function loadCyberAuth(
  requireDPO = true
): Promise<{ error: NextResponse } | { user: CyberAuthUser }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }
  const u = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!u?.companyId) {
    return {
      error: NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 }),
    };
  }
  const dpo = isDPO(u.role);
  if (requireDPO && !dpo) {
    return {
      error: NextResponse.json(
        { error: "Apenas DPO acessa a Maturidade Cibernética" },
        { status: 403 }
      ),
    };
  }
  return {
    user: { id: u.id, companyId: u.companyId, role: u.role, isDPO: dpo },
  };
}

// ============================================================
// Score engine (ponderado por função)
// ============================================================

/**
 * Cada função tem peso igual no score consolidado (20% × 5 = 100%).
 * Pesos podem ser tunados depois conforme prioridade da organização.
 */
export const FUNCTION_WEIGHTS: Record<CyberFunction, number> = {
  ID: 20,
  PR: 20,
  DE: 20,
  RS: 20,
  RC: 20,
};

/**
 * Mapeamento de aderência pra valor numérico. NAO_APLICA é neutro
 * (não conta no denominador). DELEGADO_TI é tratado como respondido
 * mas neutro (50% — ainda em revisão).
 */
function aderenciaScore(a: string): number | null {
  switch (a) {
    case "ADERENTE":     return 100;
    case "PARCIAL":      return 50;
    case "NAO_ADERENTE": return 0;
    case "DELEGADO_TI":  return 50;
    case "NAO_APLICA":   return null; // exclui do score
    default:             return null;
  }
}

export interface FunctionScore {
  function: CyberFunction;
  label: string;
  score: number;            // 0-100
  weight: number;           // pra fins de exibição
  totalControls: number;
  answered: number;
  aderente: number;
  parcial: number;
  naoAderente: number;
  naoAplica: number;
  delegadoTi: number;
}

export interface CyberScore {
  overall: number;          // 0-100
  level: "INICIANTE" | "EM_DESENVOLVIMENTO" | "INTERMEDIARIO" | "AVANCADO" | "EXEMPLAR";
  totalControls: number;
  answered: number;          // todas exceto não respondidas
  byFunction: ReadonlyArray<FunctionScore>;
}

export function cyberLevelLabel(level: CyberScore["level"]): string {
  switch (level) {
    case "INICIANTE":          return "Iniciante";
    case "EM_DESENVOLVIMENTO": return "Em desenvolvimento";
    case "INTERMEDIARIO":      return "Intermediário";
    case "AVANCADO":           return "Avançado";
    case "EXEMPLAR":           return "Exemplar";
  }
}

function levelFromScore(score: number): CyberScore["level"] {
  if (score >= 85) return "EXEMPLAR";
  if (score >= 70) return "AVANCADO";
  if (score >= 50) return "INTERMEDIARIO";
  if (score >= 25) return "EM_DESENVOLVIMENTO";
  return "INICIANTE";
}

/**
 * Calcula o score consolidado da Maturidade Cibernética.
 * Engine pura — recebe respostas (não depende do Prisma).
 */
export function computeCyberScore(
  answers: ReadonlyArray<{ controlCode: string; aderencia: string }>
): CyberScore {
  const answersByCode = new Map<string, string>();
  for (const a of answers) {
    answersByCode.set(a.controlCode, a.aderencia);
  }

  const byFunction: FunctionScore[] = [];
  const FUNCTIONS: CyberFunction[] = ["ID", "PR", "DE", "RS", "RC"];
  const FUNC_LABEL: Record<CyberFunction, string> = {
    ID: "Identificar",
    PR: "Proteger",
    DE: "Detectar",
    RS: "Responder",
    RC: "Recuperar",
  };

  for (const fn of FUNCTIONS) {
    const controlsOfFn = CYBER_CONTROLS.filter((c) => c.function === fn);
    let scoreSum = 0;
    let scoreDen = 0;
    let aderente = 0;
    let parcial = 0;
    let naoAderente = 0;
    let naoAplica = 0;
    let delegadoTi = 0;
    let answered = 0;

    for (const c of controlsOfFn) {
      const a = answersByCode.get(c.code);
      if (!a) continue;
      answered += 1;
      switch (a) {
        case "ADERENTE":     aderente += 1; break;
        case "PARCIAL":      parcial += 1; break;
        case "NAO_ADERENTE": naoAderente += 1; break;
        case "NAO_APLICA":   naoAplica += 1; break;
        case "DELEGADO_TI":  delegadoTi += 1; break;
      }
      const v = aderenciaScore(a);
      if (v != null) {
        scoreSum += v;
        scoreDen += 1;
      }
    }

    const fnScore = scoreDen > 0 ? Math.round(scoreSum / scoreDen) : 0;
    byFunction.push({
      function: fn,
      label: FUNC_LABEL[fn],
      score: fnScore,
      weight: FUNCTION_WEIGHTS[fn],
      totalControls: controlsOfFn.length,
      answered,
      aderente,
      parcial,
      naoAderente,
      naoAplica,
      delegadoTi,
    });
  }

  // Score consolidado: média ponderada das funções
  const totalWeight = byFunction.reduce((s, f) => s + f.weight, 0);
  const overall =
    totalWeight > 0
      ? Math.round(
          byFunction.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight
        )
      : 0;

  const totalControls = byFunction.reduce((s, f) => s + f.totalControls, 0);
  const answered = byFunction.reduce((s, f) => s + f.answered, 0);

  return {
    overall,
    level: levelFromScore(overall),
    totalControls,
    answered,
    byFunction,
  };
}

// ============================================================
// Recomendações automáticas
// ============================================================

export interface CyberRecommendation {
  controlCode: string;
  control: CyberControl;
  priority: "ALTA" | "MEDIA" | "BAIXA";
  reason: string;
  pontoMelhoria: string | null;
}

/**
 * Gera lista priorizada de recomendações a partir das respostas.
 * Foca em NAO_ADERENTE (alta prioridade) e PARCIAL (média).
 * DELEGADO_TI ainda em revisão não vira recomendação imediata.
 */
export function buildCyberRecommendations(
  answers: ReadonlyArray<{ controlCode: string; aderencia: string; pontoMelhoria: string | null }>
): ReadonlyArray<CyberRecommendation> {
  const recommendations: CyberRecommendation[] = [];
  const answersByCode = new Map<
    string,
    { aderencia: string; pontoMelhoria: string | null }
  >();
  for (const a of answers) {
    answersByCode.set(a.controlCode, { aderencia: a.aderencia, pontoMelhoria: a.pontoMelhoria });
  }

  for (const c of CYBER_CONTROLS) {
    const a = answersByCode.get(c.code);
    if (!a) continue;
    if (a.aderencia === "NAO_ADERENTE") {
      recommendations.push({
        controlCode: c.code,
        control: c,
        priority: "ALTA",
        reason: `Controle "${c.code}" marcado como não aderente. ${
          c.audience === "TI" ? "Requer ação técnica." : "Requer ação organizacional."
        }`,
        pontoMelhoria: a.pontoMelhoria,
      });
    } else if (a.aderencia === "PARCIAL") {
      recommendations.push({
        controlCode: c.code,
        control: c,
        priority: "MEDIA",
        reason: `Controle "${c.code}" parcialmente implementado. Avaliar próximo passo.`,
        pontoMelhoria: a.pontoMelhoria,
      });
    }
  }

  return recommendations;
}

// ============================================================
// Estatísticas globais
// ============================================================

export interface CyberStats {
  totalControls: number;
  answered: number;
  notAnswered: number;
  byAderencia: {
    ADERENTE: number;
    PARCIAL: number;
    NAO_ADERENTE: number;
    NAO_APLICA: number;
    DELEGADO_TI: number;
  };
  delegatedToTi: number;        // = byAderencia.DELEGADO_TI
  blockedQuestions: number;      // alta prioridade pendente
  prepopulatedFromOtherCps: number;
}

export function computeCyberStats(
  answers: ReadonlyArray<{
    controlCode: string;
    aderencia: string;
    evidenceFrom: string | null;
  }>
): CyberStats {
  const byAderencia = {
    ADERENTE: 0,
    PARCIAL: 0,
    NAO_ADERENTE: 0,
    NAO_APLICA: 0,
    DELEGADO_TI: 0,
  };
  let prepopulatedFromOtherCps = 0;
  for (const a of answers) {
    const k = a.aderencia as keyof typeof byAderencia;
    if (k in byAderencia) byAderencia[k] += 1;
    if (a.evidenceFrom) prepopulatedFromOtherCps += 1;
  }
  return {
    totalControls: CYBER_CONTROLS.length,
    answered: answers.length,
    notAnswered: CYBER_CONTROLS.length - answers.length,
    byAderencia,
    delegatedToTi: byAderencia.DELEGADO_TI,
    blockedQuestions: byAderencia.NAO_ADERENTE,
    prepopulatedFromOtherCps,
  };
}
