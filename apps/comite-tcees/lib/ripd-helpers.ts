/**
 * Helpers do RIPD (Fase 6) — versão mono-instituição do app do Comitê.
 * Trazido do app principal (Checkpoint 13), sem company/user/permissões:
 * tipo RipdData (8 seções), status, labels e normalização.
 */

export const RIPD_STATUS = {
  RASCUNHO: "RASCUNHO",
  EM_REVISAO: "EM_REVISAO",
  APROVADO: "APROVADO",
  ARQUIVADO: "ARQUIVADO",
} as const;
export type RipdStatus = (typeof RIPD_STATUS)[keyof typeof RIPD_STATUS];

export const VALID_RIPD_STATUSES = new Set<string>(Object.values(RIPD_STATUS));

export function ripdStatusLabel(s: string | null | undefined): string {
  switch (s) {
    case "RASCUNHO":   return "Rascunho";
    case "EM_REVISAO": return "Em revisão";
    case "APROVADO":   return "Aprovado";
    case "ARQUIVADO":  return "Arquivado";
    default:           return "—";
  }
}

export function ripdStatusBadgeClass(s: string | null | undefined): string {
  switch (s) {
    case "APROVADO":   return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "EM_REVISAO": return "bg-blue-100 text-blue-800 border-blue-300";
    case "RASCUNHO":   return "bg-amber-100 text-amber-800 border-amber-300";
    case "ARQUIVADO":  return "bg-gray-200 text-gray-700 border-gray-300";
    default:           return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

// ============================================================
// Estrutura do conteúdo (JSON em Ripd.data) — 8 seções (Res. CD/ANPD 2/2022)
// ============================================================

export interface RipdData {
  v: 1;
  s1: {
    controller: { name: string; cnpj: string; address: string; legalRepresentative: string };
    dpo: { name: string; email: string; phone: string };
    operators: string;
    operatorsList: ReadonlyArray<{
      id: string;
      name: string;
      cnpj: string;
      relationType: string;
      activityDescription: string;
      contractStatus: string;
      contractRiskClass: string;
      country: string;
    }>;
  };
  s2: { name: string; description: string; objective: string; responsibleArea: string };
  s3: {
    categories: string;
    personalData: string;
    sensitiveDataNotes: string;
    subjects: string;
    volumeEstimate: string;
  };
  s4: {
    purposes: string;
    legalBasis: string;
    sensitiveBasis: string;
    necessityJustification: string;
    proportionalityJustification: string;
  };
  s5: {
    collection: string;
    storage: string;
    retention: string;
    elimination: string;
    internationalTransfer: string;
  };
  s6: {
    risks: ReadonlyArray<{
      code: string;
      label: string;
      status: string;
      severityLevel: string;
      severityDetail: string;
      description: string;
      mitigationSummary: string;
    }>;
    overallAssessment: string;
  };
  s7: {
    existingControls: ReadonlyArray<{ code: string; label: string; cenarioAtual: string }>;
    plannedActions: ReadonlyArray<{
      id: string;
      title: string;
      status: string;
      dueDate: string | null;
      priority: string;
    }>;
    additionalSafeguards: string;
  };
  s8: { finalConclusion: string; recommendations: string };
}

export function emptyRipdData(): RipdData {
  return {
    v: 1,
    s1: {
      controller: { name: "", cnpj: "", address: "", legalRepresentative: "" },
      dpo: { name: "", email: "", phone: "" },
      operators: "",
      operatorsList: [],
    },
    s2: { name: "", description: "", objective: "", responsibleArea: "" },
    s3: { categories: "", personalData: "", sensitiveDataNotes: "", subjects: "", volumeEstimate: "" },
    s4: { purposes: "", legalBasis: "", sensitiveBasis: "", necessityJustification: "", proportionalityJustification: "" },
    s5: { collection: "", storage: "", retention: "", elimination: "", internationalTransfer: "" },
    s6: { risks: [], overallAssessment: "" },
    s7: { existingControls: [], plannedActions: [], additionalSafeguards: "" },
    s8: { finalConclusion: "", recommendations: "" },
  };
}

export function normalizeRipdData(raw: any): RipdData {
  const base = emptyRipdData();
  if (!raw || typeof raw !== "object") return base;
  const out: any = { ...base, ...raw };
  out.s1 = { ...base.s1, ...(raw.s1 ?? {}) };
  out.s1.controller = { ...base.s1.controller, ...(raw.s1?.controller ?? {}) };
  out.s1.dpo = { ...base.s1.dpo, ...(raw.s1?.dpo ?? {}) };
  if (!Array.isArray(out.s1.operatorsList)) out.s1.operatorsList = [];
  out.s2 = { ...base.s2, ...(raw.s2 ?? {}) };
  out.s3 = { ...base.s3, ...(raw.s3 ?? {}) };
  out.s4 = { ...base.s4, ...(raw.s4 ?? {}) };
  out.s5 = { ...base.s5, ...(raw.s5 ?? {}) };
  out.s6 = { ...base.s6, ...(raw.s6 ?? {}) };
  if (!Array.isArray(out.s6.risks)) out.s6.risks = [];
  out.s7 = { ...base.s7, ...(raw.s7 ?? {}) };
  if (!Array.isArray(out.s7.existingControls)) out.s7.existingControls = [];
  if (!Array.isArray(out.s7.plannedActions)) out.s7.plannedActions = [];
  out.s8 = { ...base.s8, ...(raw.s8 ?? {}) };
  out.v = 1;
  return out as RipdData;
}

export const RIPD_SECTION_LABELS: ReadonlyArray<{
  key: keyof RipdData & `s${number}`;
  label: string;
  short: string;
}> = [
  { key: "s1", label: "Identificação dos agentes",     short: "Agentes" },
  { key: "s2", label: "Descrição do projeto/processo", short: "Projeto" },
  { key: "s3", label: "Dados pessoais tratados",       short: "Dados" },
  { key: "s4", label: "Finalidade e bases legais",     short: "Finalidade" },
  { key: "s5", label: "Ciclo de vida dos dados",       short: "Ciclo de vida" },
  { key: "s6", label: "Avaliação de riscos",           short: "Riscos" },
  { key: "s7", label: "Medidas de mitigação",          short: "Mitigação" },
  { key: "s8", label: "Parecer e aprovação",           short: "Parecer" },
];
