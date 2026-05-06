/**
 * Engine de pré-população automática (Checkpoint 22 / Fatia 2).
 *
 * Aproveita dados de outros checkpoints pra sugerir respostas iniciais
 * em controles NIST específicos. Reduz o trabalho do DPO em ~10-15%
 * dos controles totais.
 *
 * Fontes:
 *   - GAP Analysis (CP9): controles aderentes do mapeamento LGPD
 *   - Capacitação (CP18): treinamentos cadastrados confirmam PR.AT-1
 *   - Incidentes (CP16): se há plano + comunicação ativa, confirma RS.RP-1, RS.CO-2/3, RC.CO-3
 *   - Terceiros (CP14): existência de avaliações + contratos confirma ID.SC-1/2/3
 *
 * Engine pura — recebe os dados consolidados, devolve sugestões. Não
 * grava no banco; o aplicador (POST /api/cyber/prepopulate) decide.
 */

import { CYBER_CONTROLS, type CyberPrepopulateSource } from "./cyber-catalog";

export interface PrepopulateInput {
  /** Resumo do GAP Analysis (CP9) — controles que estão aderentes. */
  gap: {
    aderentesCount: number;
    /** Códigos GAP marcados como ADERENTE. Usado pra inferência cruzada. */
    aderentesCodes: ReadonlyArray<string>;
  };
  /** Resumo da Capacitação LGPD (CP18). */
  capacitacao: {
    totalEvents: number;
    realizedCount: number;
    onboardingCovered: boolean;
  };
  /** Resumo dos Incidentes (CP16). */
  incidentes: {
    total: number;
    /** Existe ao menos 1 incidente com comunicação à ANPD registrada? */
    hasAnpdNotification: boolean;
    /** Existe pelo menos 1 incidente com comunicação aos titulares? */
    hasSubjectNotification: boolean;
    /** Algum encerrado mostra que o ciclo completo (resposta + recuperação) funciona? */
    hasClosedIncident: boolean;
  };
  /** Resumo da Gestão de Terceiros (CP14). */
  terceiros: {
    total: number;
    /** Operadores com avaliação completa (formulário enviado e respondido). */
    assessedCount: number;
    /** Operadores com cláusulas contratuais LGPD assinadas. */
    withContractCount: number;
  };
}

export interface PrepopulateSuggestion {
  controlCode: string;
  suggestedAderencia: "ADERENTE" | "PARCIAL";
  evidence: string;
  evidenceFrom: CyberPrepopulateSource;
  /** Quão "forte" é a sugestão. ADERENTE com strong=true é confiável. */
  confidence: "alta" | "media";
}

/**
 * Calcula as sugestões a partir dos dados consolidados.
 * Devolve apenas controles ainda NÃO respondidos (caller filtra).
 */
export function buildPrepopulateSuggestions(
  input: PrepopulateInput
): ReadonlyArray<PrepopulateSuggestion> {
  const out: PrepopulateSuggestion[] = [];

  // ---------- GAP — Capacitação cruzada ----------
  // PR.AT-1: All users are informed and trained
  if (input.capacitacao.totalEvents > 0 && input.capacitacao.realizedCount > 0) {
    out.push({
      controlCode: "PR.AT-1",
      suggestedAderencia: input.capacitacao.onboardingCovered ? "ADERENTE" : "PARCIAL",
      evidence: `Treinamentos cadastrados na Capacitação LGPD (CP18): ${input.capacitacao.realizedCount} realizados de ${input.capacitacao.totalEvents} planejados${
        input.capacitacao.onboardingCovered ? ", com onboarding coberto" : " (onboarding ainda não coberto)"
      }.`,
      evidenceFrom: "CAPACITACAO",
      confidence: input.capacitacao.onboardingCovered ? "alta" : "media",
    });
  }

  // ---------- INCIDENTES (CP16) ----------
  if (input.incidentes.total > 0) {
    // PR.IP-9: Response plans and recovery plans are in place
    out.push({
      controlCode: "PR.IP-9",
      suggestedAderencia: "ADERENTE",
      evidence: `Há ${input.incidentes.total} incidente(s) cadastrado(s) no app, com workflow de resposta documentado (Checkpoint 16 — Incidentes).`,
      evidenceFrom: "INCIDENTES",
      confidence: "alta",
    });

    // RS.RP-1: Response plan is executed during or after an incident
    if (input.incidentes.hasClosedIncident) {
      out.push({
        controlCode: "RS.RP-1",
        suggestedAderencia: "ADERENTE",
        evidence: "Há incidente(s) encerrado(s) com workflow de resposta seguido (CP16).",
        evidenceFrom: "INCIDENTES",
        confidence: "alta",
      });
    }

    // RS.CO-2: Incidents are reported consistent with established criteria
    out.push({
      controlCode: "RS.CO-2",
      suggestedAderencia: "ADERENTE",
      evidence: `Workflow de incidentes documentado e em uso (CP16 — ${input.incidentes.total} registros).`,
      evidenceFrom: "INCIDENTES",
      confidence: "alta",
    });

    // RS.CO-3: Information is shared consistent with response plans
    if (input.incidentes.hasAnpdNotification || input.incidentes.hasSubjectNotification) {
      out.push({
        controlCode: "RS.CO-3",
        suggestedAderencia: "ADERENTE",
        evidence: `Comunicações registradas (CP16): ${input.incidentes.hasAnpdNotification ? "ANPD" : ""}${
          input.incidentes.hasAnpdNotification && input.incidentes.hasSubjectNotification ? " + " : ""
        }${input.incidentes.hasSubjectNotification ? "titulares" : ""} foram notificados.`,
        evidenceFrom: "INCIDENTES",
        confidence: "alta",
      });

      // RC.CO-3: Recovery activities are communicated to stakeholders
      out.push({
        controlCode: "RC.CO-3",
        suggestedAderencia: "ADERENTE",
        evidence: "Comunicações pós-incidente já documentadas no app (CP16).",
        evidenceFrom: "INCIDENTES",
        confidence: "alta",
      });
    }
  }

  // ---------- TERCEIROS (CP14) ----------
  if (input.terceiros.total > 0) {
    // ID.SC-2: Suppliers and third-party partners are identified
    out.push({
      controlCode: "ID.SC-2",
      suggestedAderencia: "ADERENTE",
      evidence: `${input.terceiros.total} fornecedor(es) cadastrado(s) na Gestão de Terceiros (CP14).`,
      evidenceFrom: "TERCEIROS",
      confidence: "alta",
    });

    // ID.SC-3: Contracts include cybersecurity measures
    if (input.terceiros.withContractCount > 0) {
      out.push({
        controlCode: "ID.SC-3",
        suggestedAderencia:
          input.terceiros.withContractCount === input.terceiros.total ? "ADERENTE" : "PARCIAL",
        evidence: `${input.terceiros.withContractCount} de ${input.terceiros.total} fornecedor(es) com cláusulas contratuais LGPD assinadas (CP14).`,
        evidenceFrom: "TERCEIROS",
        confidence:
          input.terceiros.withContractCount === input.terceiros.total ? "alta" : "media",
      });
    }

    // ID.SC-1: Cyber supply chain risk management process exists
    if (input.terceiros.assessedCount > 0) {
      out.push({
        controlCode: "ID.SC-1",
        suggestedAderencia:
          input.terceiros.assessedCount === input.terceiros.total ? "ADERENTE" : "PARCIAL",
        evidence: `${input.terceiros.assessedCount} de ${input.terceiros.total} fornecedor(es) avaliados via formulário Cyber+LGPD (CP14).`,
        evidenceFrom: "TERCEIROS",
        confidence:
          input.terceiros.assessedCount === input.terceiros.total ? "alta" : "media",
      });
    }

    // PR.AT-3: Third-party stakeholders understand their roles
    if (input.terceiros.withContractCount > 0) {
      out.push({
        controlCode: "PR.AT-3",
        suggestedAderencia: "PARCIAL",
        evidence: `${input.terceiros.withContractCount} fornecedor(es) têm cláusula contratual com obrigações de privacidade — alinha com PR.AT-3.`,
        evidenceFrom: "TERCEIROS",
        confidence: "media",
      });
    }
  }

  // ---------- GAP ANALYSIS (CP9) ----------
  if (input.gap.aderentesCount > 0) {
    const codes = new Set(input.gap.aderentesCodes);

    // ID.GV-3: Legal/regulatory requirements understood
    // Indicador no GAP: BR-01 ou BR-02 marcados como aderentes
    if (codes.has("BR-01") || codes.has("BR-02")) {
      out.push({
        controlCode: "ID.GV-3",
        suggestedAderencia: "ADERENTE",
        evidence: `Controles base do GAP (BR-01/BR-02 — fundamentos LGPD) estão marcados como aderentes.`,
        evidenceFrom: "GAP",
        confidence: "alta",
      });
    }

    // ID.AM-3: Data flows mapped — se mapeamento de processos do Inventário existe
    if (codes.has("BR-12") || codes.has("BR-13") || codes.has("BR-14")) {
      out.push({
        controlCode: "ID.AM-3",
        suggestedAderencia: "PARCIAL",
        evidence: "Inventário com fluxos de dados mapeados (parcialmente alinhado com NIST).",
        evidenceFrom: "GAP",
        confidence: "media",
      });
    }
  }

  return out;
}

/**
 * Filtra sugestões pra incluir só controles que ainda não foram
 * respondidos (não sobrescrever respostas existentes).
 */
export function filterUnansweredSuggestions(
  suggestions: ReadonlyArray<PrepopulateSuggestion>,
  alreadyAnsweredCodes: ReadonlySet<string>
): ReadonlyArray<PrepopulateSuggestion> {
  return suggestions.filter((s) => !alreadyAnsweredCodes.has(s.controlCode));
}

/**
 * Validador: confirma que cada sugestão refere-se a um controle real
 * do catálogo NIST. Defensivo — se alguém renomear códigos no
 * catálogo, sugestões inválidas são descartadas em vez de quebrar.
 */
export function validateSuggestions(
  suggestions: ReadonlyArray<PrepopulateSuggestion>
): ReadonlyArray<PrepopulateSuggestion> {
  const validCodes = new Set(CYBER_CONTROLS.map((c) => c.code));
  return suggestions.filter((s) => validCodes.has(s.controlCode));
}
