/**
 * Engine pura de cálculo de risco do contrato com terceiros
 * (Checkpoint 14 / G1).
 *
 * Inspirado na metodologia da Denise (consultoria PGP) — replicada da
 * planilha "Inventário de Terceiros" do material original. Os critérios
 * vêm do conceito de ALTO RISCO da ANPD (combinação de critério geral
 * + critério específico).
 *
 * Régua:
 *   - Critério Geral (2 itens):    largaEscala + afetaTitulares
 *   - Critério Específico (4 itens): novasTecnologias + vigilanciaPublica +
 *                                    decisaoAutomatizada + dadosSensiveis
 *
 * Cálculo:
 *   - geralCount × especCount ≥ 1   → ALTO   (tem pelo menos 1 de cada)
 *   - geralCount ≥ 1 OU especCount ≥ 1 → MEDIO
 *   - nenhum                          → BAIXO
 *
 * Recomendação de cláusula (combinada com `relationType` do Operator):
 *   - relationType=OPERADOR + ALTO              → ROBUSTA
 *   - relationType=OPERADOR + MEDIO/BAIXO       → SIMPLES
 *   - relationType=CONTROLADOR ou CO_CONTROLADOR → CC (ignora risco)
 *   - relationType=INDEFINIDO                    → INDEFINIDO
 *
 * Engine pura — testável sem DB.
 */

import type {
  ContractRiskClass,
  RecommendedClause,
  RelationType,
} from "@/lib/operadores-helpers";

// ============================================================
// Régua de risco do contrato
// ============================================================

export interface ContractRiskInput {
  /** Critério geral 1 — Tratamento em larga escala */
  largaEscala: boolean;
  /** Critério geral 2 — Afeta significativamente direitos dos titulares */
  afetaTitulares: boolean;
  /** Crit. específico 1 — Uso de tecnologias emergentes/inovadoras */
  novasTecnologias: boolean;
  /** Crit. específico 2 — Vigilância em zonas acessíveis ao público */
  vigilanciaPublica: boolean;
  /** Crit. específico 3 — Decisão tomada unicamente por tratamento automatizado */
  decisaoAutomatizada: boolean;
  /** Crit. específico 4 — Dados sensíveis OU crianças/adolescentes/idosos */
  dadosSensiveis: boolean;
}

export interface ContractRiskResult {
  riskClass: ContractRiskClass;
  /** Quantos critérios gerais marcados (0..2) */
  generalCount: number;
  /** Quantos critérios específicos marcados (0..4) */
  specificCount: number;
  /** Texto pro DPO entender por que deu este resultado */
  rationale: string;
}

/**
 * Calcula a classe de risco do contrato a partir dos 6 critérios ANPD.
 */
export function computeContractRisk(input: ContractRiskInput): ContractRiskResult {
  const generalCount =
    Number(input.largaEscala) + Number(input.afetaTitulares);
  const specificCount =
    Number(input.novasTecnologias) +
    Number(input.vigilanciaPublica) +
    Number(input.decisaoAutomatizada) +
    Number(input.dadosSensiveis);

  let riskClass: ContractRiskClass;
  let rationale: string;

  if (generalCount >= 1 && specificCount >= 1) {
    riskClass = "ALTO";
    rationale = `Risco ALTO: ${generalCount} critério(s) geral(is) + ${specificCount} crit. específico(s) — ANPD considera tratamento de alto risco quando há a combinação dos dois.`;
  } else if (generalCount >= 1 || specificCount >= 1) {
    riskClass = "MEDIO";
    rationale = `Risco MÉDIO: ${generalCount} critério(s) geral(is) e ${specificCount} crit. específico(s) — fica próximo do limiar da ANPD mas falta a combinação completa.`;
  } else {
    riskClass = "BAIXO";
    rationale =
      "Risco BAIXO: nenhum dos 6 critérios marcados. Tratamento sem indícios de alto risco.";
  }

  return { riskClass, generalCount, specificCount, rationale };
}

// ============================================================
// Recomendação de cláusula
// ============================================================

/**
 * Devolve a cláusula recomendada com base na posição do terceiro
 * (`relationType`) combinada com a classe de risco do contrato.
 *
 * Regras:
 *   - INDEFINIDO → INDEFINIDO (precisa classificar o terceiro primeiro)
 *   - OPERADOR + ALTO → ROBUSTA
 *   - OPERADOR + MEDIO/BAIXO → SIMPLES
 *   - CONTROLADOR → CC (mesma cláusula independente do risco)
 *   - CO_CONTROLADOR → CC
 */
export function recommendClause(
  relationType: RelationType,
  riskClass: ContractRiskClass
): RecommendedClause {
  if (relationType === "INDEFINIDO") return "INDEFINIDO";
  if (relationType === "CONTROLADOR" || relationType === "CO_CONTROLADOR") {
    return "CC";
  }
  // OPERADOR
  if (riskClass === "ALTO") return "ROBUSTA";
  return "SIMPLES";
}

/**
 * Atalho que combina os dois cálculos: dado um operador completo,
 * devolve o snapshot atualizado de risco + cláusula recomendada.
 */
export function recalcRiskAndClause(
  relationType: RelationType,
  criteria: ContractRiskInput
): {
  riskClass: ContractRiskClass;
  recommendedClause: RecommendedClause;
  generalCount: number;
  specificCount: number;
  rationale: string;
} {
  const r = computeContractRisk(criteria);
  const recommendedClause = recommendClause(relationType, r.riskClass);
  return {
    riskClass: r.riskClass,
    recommendedClause,
    generalCount: r.generalCount,
    specificCount: r.specificCount,
    rationale: r.rationale,
  };
}
