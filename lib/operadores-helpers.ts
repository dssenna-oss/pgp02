/**
 * Helpers da Gestão de Terceiros (Checkpoint 14 / G1).
 *
 * Cada `Operator` é uma entidade jurídica externa (fornecedor /
 * prestador / parceiro) que mantém alguma relação contratual com a
 * Company. Inclui dados do contrato vigente embutidos (régua de risco,
 * cláusulas presentes, anexos, status).
 *
 * Inspirado nos materiais da Denise (consultoria PGP):
 *   - Inventário de Terceiros (XLSX) → estrutura
 *   - Política de Avaliação de Terceiros → diretrizes
 *   - Régua de risco do contrato (6 critérios ANPD) → engine
 *
 * Visibilidade:
 *   - DPO (qualquer nível): vê e edita TUDO
 *   - Contribuidor: vê apenas operadores vinculados a processos do
 *     Inventário que ele criou (escopo de "seus" processos)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO, isContribuidor } from "@/lib/auth-helpers";

// ============================================================
// Enums
// ============================================================

export const RELATION_TYPE = {
  INDEFINIDO: "INDEFINIDO",
  OPERADOR: "OPERADOR",
  CONTROLADOR: "CONTROLADOR",
  CO_CONTROLADOR: "CO_CONTROLADOR",
} as const;
export type RelationType = (typeof RELATION_TYPE)[keyof typeof RELATION_TYPE];
export const VALID_RELATION_TYPES = new Set(Object.values(RELATION_TYPE));

export const CONTRACT_STATUS = {
  VIGENTE: "VIGENTE",
  VENCENDO_90D: "VENCENDO_90D",
  VENCIDO: "VENCIDO",
  EM_RENOVACAO: "EM_RENOVACAO",
  SEM_CONTRATO: "SEM_CONTRATO",
  NAO_APLICAVEL: "NAO_APLICAVEL",
} as const;
export type ContractStatus =
  (typeof CONTRACT_STATUS)[keyof typeof CONTRACT_STATUS];
export const VALID_CONTRACT_STATUSES = new Set(Object.values(CONTRACT_STATUS));

export const CONTRACT_RISK_CLASS = {
  ALTO: "ALTO",
  MEDIO: "MEDIO",
  BAIXO: "BAIXO",
} as const;
export type ContractRiskClass =
  (typeof CONTRACT_RISK_CLASS)[keyof typeof CONTRACT_RISK_CLASS];

export const RECOMMENDED_CLAUSE = {
  ROBUSTA: "ROBUSTA",
  SIMPLES: "SIMPLES",
  CC: "CC",
  CLIENTE_OPERADOR: "CLIENTE_OPERADOR",
  MINUTA: "MINUTA",
  INDEFINIDO: "INDEFINIDO",
} as const;
export type RecommendedClause =
  (typeof RECOMMENDED_CLAUSE)[keyof typeof RECOMMENDED_CLAUSE];

/**
 * Status do ciclo de adequação LGPD (Checkpoint 14 H1).
 *
 * Diferente do `contractStatus` (que mede vigência: vigente/vencido/etc.),
 * o `lgpdComplianceStatus` mede ADEQUAÇÃO LGPD do contrato — se ele tem
 * cláusulas obrigatórias, se passou por avaliação, etc.
 *
 *   - NAO_AVALIADO: default; ainda não passou por avaliação LGPD
 *   - EM_ADEQUACAO: campanha de adequação ativa (5 ações no Plano)
 *   - ADEQUADO: avaliado, com cláusulas LGPD presentes e ok
 *   - NAO_APLICAVEL: relação não trata dados pessoais (ex: aluguel imóvel)
 */
export const LGPD_COMPLIANCE_STATUS = {
  NAO_AVALIADO: "NAO_AVALIADO",
  EM_ADEQUACAO: "EM_ADEQUACAO",
  ADEQUADO: "ADEQUADO",
  NAO_APLICAVEL: "NAO_APLICAVEL",
} as const;
export type LgpdComplianceStatus =
  (typeof LGPD_COMPLIANCE_STATUS)[keyof typeof LGPD_COMPLIANCE_STATUS];
export const VALID_LGPD_COMPLIANCE_STATUSES = new Set(
  Object.values(LGPD_COMPLIANCE_STATUS)
);

export function lgpdComplianceStatusLabel(s: string | null | undefined): string {
  switch (s) {
    case "NAO_AVALIADO":   return "Não avaliado";
    case "EM_ADEQUACAO":   return "Em adequação";
    case "ADEQUADO":       return "Adequado";
    case "NAO_APLICAVEL":  return "Não aplicável";
    default:               return "—";
  }
}

export function lgpdComplianceBadgeClass(s: string | null | undefined): string {
  switch (s) {
    case "ADEQUADO":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    case "EM_ADEQUACAO":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "NAO_AVALIADO":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "NAO_APLICAVEL":
      return "bg-gray-200 text-gray-700 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

export const OPERATOR_TYPE = {
  CLOUD: "CLOUD",
  PAGAMENTOS: "PAGAMENTOS",
  MARKETING: "MARKETING",
  RH: "RH",
  AUDITORIA: "AUDITORIA",
  LOGISTICA: "LOGISTICA",
  TI: "TI",
  JURIDICO: "JURIDICO",
  SAUDE: "SAUDE",
  OUTRO: "OUTRO",
} as const;
export const VALID_OPERATOR_TYPES = new Set(Object.values(OPERATOR_TYPE));

// ============================================================
// Labels (UI)
// ============================================================

export function relationTypeLabel(t: string | null | undefined): string {
  switch (t) {
    case "INDEFINIDO":     return "A classificar";
    case "OPERADOR":       return "Operador";
    case "CONTROLADOR":    return "Outro Controlador";
    case "CO_CONTROLADOR": return "Co-controladoria";
    default:               return "—";
  }
}

export function contractStatusLabel(s: string | null | undefined): string {
  switch (s) {
    case "VIGENTE":       return "Vigente";
    case "VENCENDO_90D":  return "Vencendo (90d)";
    case "VENCIDO":       return "Vencido";
    case "EM_RENOVACAO":  return "Em renovação";
    case "SEM_CONTRATO":  return "Sem contrato";
    case "NAO_APLICAVEL": return "Não aplicável";
    default:              return "—";
  }
}

export function contractRiskClassLabel(c: string | null | undefined): string {
  switch (c) {
    case "ALTO":  return "Alto";
    case "MEDIO": return "Médio";
    case "BAIXO": return "Baixo";
    default:      return "—";
  }
}

export function recommendedClauseLabel(r: string | null | undefined): string {
  switch (r) {
    case "ROBUSTA":          return "Cláusula Controlador × Operador (robusta)";
    case "SIMPLES":          return "Cláusula Controlador × Operador (simples)";
    case "CC":               return "Cláusula Controlador × Controlador";
    case "CLIENTE_OPERADOR": return "Cláusula Operador (Cliente) × Controlador";
    case "MINUTA":           return "Minuta de cláusula padrão";
    case "INDEFINIDO":       return "—";
    default:                 return "—";
  }
}

export function operatorTypeLabel(t: string | null | undefined): string {
  switch (t) {
    case "CLOUD":      return "Cloud / Hospedagem";
    case "PAGAMENTOS": return "Pagamentos";
    case "MARKETING":  return "Marketing / CRM";
    case "RH":         return "RH / Folha";
    case "AUDITORIA":  return "Auditoria";
    case "LOGISTICA":  return "Logística / Entrega";
    case "TI":         return "TI / Sistemas";
    case "JURIDICO":   return "Jurídico";
    case "SAUDE":      return "Saúde Ocupacional";
    case "OUTRO":      return "Outro";
    default:           return "—";
  }
}

// ============================================================
// Classes Tailwind (UI)
// ============================================================

export function relationTypeBadgeClass(t: string | null | undefined): string {
  switch (t) {
    case "OPERADOR":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800";
    case "CONTROLADOR":
      return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800";
    case "CO_CONTROLADOR":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800";
    case "INDEFINIDO":
      return "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export function contractStatusBadgeClass(
  s: string | null | undefined
): string {
  switch (s) {
    case "VIGENTE":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    case "VENCENDO_90D":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "VENCIDO":
    case "SEM_CONTRATO":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
    case "EM_RENOVACAO":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "NAO_APLICAVEL":
      return "bg-gray-200 text-gray-700 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

export function contractRiskBadgeClass(c: string | null | undefined): string {
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
// Checklist de classificação (Operador vs Controlador)
// ============================================================

/**
 * Perguntas pra classificar a posição do terceiro.
 *
 * Bloco "C": indícios de CONTROLADOR (terceiro toma decisões essenciais)
 * Bloco "O": indícios de OPERADOR (terceiro segue instruções)
 *
 * Sugestão automática:
 *   - Se maioria do bloco C = SIM → CONTROLADOR
 *   - Se maioria do bloco O = SIM → OPERADOR
 *   - Se ambos altos: CO_CONTROLADOR (decisões comuns/convergentes)
 *   - Default: INDEFINIDO (DPO precisa decidir manualmente)
 *
 * Inspirado na aula da Denise (capítulo "Avaliar quem é o terceiro").
 */
export interface ClassificationQuestion {
  id: string;
  block: "C" | "O";
  question: string;
}

export const CLASSIFICATION_QUESTIONS: ReadonlyArray<ClassificationQuestion> = [
  // ----- Bloco C: indícios de CONTROLADOR -----
  { id: "c1", block: "C", question: "O terceiro decide quais dados pessoais coletar?" },
  { id: "c2", block: "C", question: "O terceiro define a finalidade do tratamento dos dados?" },
  { id: "c3", block: "C", question: "O terceiro define com quem os dados podem ser compartilhados?" },
  { id: "c4", block: "C", question: "O terceiro define quanto tempo os dados ficam retidos?" },
  { id: "c5", block: "C", question: "O terceiro tem influência sobre as cláusulas essenciais do tratamento?" },

  // ----- Bloco O: indícios de OPERADOR -----
  { id: "o1", block: "O", question: "O terceiro trata os dados estritamente conforme instruções da minha empresa?" },
  { id: "o2", block: "O", question: "O terceiro precisa pedir autorização antes de compartilhar dados com outros?" },
  { id: "o3", block: "O", question: "O terceiro elimina ou devolve os dados ao fim do contrato conforme minhas instruções?" },
  { id: "o4", block: "O", question: "Posso dar instruções ao terceiro sobre medidas de segurança a aplicar?" },
  { id: "o5", block: "O", question: "O terceiro só pode usar os dados pra finalidade que eu defini?" },
];

export type ClassificationAnswers = Record<string, boolean>;

export interface ClassificationResult {
  /** Sugestão calculada. Pode ser confirmada ou alterada pelo DPO. */
  suggestion: RelationType;
  /** Detalhe pra UI. */
  controllerScore: number;
  operatorScore: number;
  rationale: string;
}

export function classifyRelationType(
  answers: ClassificationAnswers
): ClassificationResult {
  let controllerScore = 0;
  let operatorScore = 0;
  for (const q of CLASSIFICATION_QUESTIONS) {
    if (answers[q.id]) {
      if (q.block === "C") controllerScore += 1;
      else operatorScore += 1;
    }
  }
  // Bloco C tem 5 perguntas; bloco O tem 5. Maioria = >=3.
  const cMajority = controllerScore >= 3;
  const oMajority = operatorScore >= 3;

  let suggestion: RelationType;
  let rationale: string;

  if (cMajority && oMajority) {
    suggestion = "CO_CONTROLADOR";
    rationale =
      "Ambos os blocos têm maioria SIM — indica decisões comuns ou convergentes. Verifique se as duas partes têm poder de decisão sobre finalidades.";
  } else if (cMajority) {
    suggestion = "CONTROLADOR";
    rationale =
      "Maioria do bloco \"Controlador\" — terceiro toma decisões essenciais. Use cláusula Controlador × Controlador.";
  } else if (oMajority) {
    suggestion = "OPERADOR";
    rationale =
      "Maioria do bloco \"Operador\" — terceiro segue suas instruções. Use cláusula Controlador × Operador (robusta ou simples conforme risco).";
  } else {
    suggestion = "INDEFINIDO";
    rationale =
      "Respostas insuficientes pra classificar. Reveja o checklist ou classifique manualmente.";
  }

  return { suggestion, controllerScore, operatorScore, rationale };
}

// ============================================================
// DTO
// ============================================================

export interface OperatorAttachment {
  name: string;
  url: string;
  uploadedAt: string;
  /** "CONTRATO" | "DPA" | "EVIDENCIA" | "OUTRO" */
  kind?: string;
}

export interface OperatorProcessLinkDTO {
  id: string;
  dataInventoryId: string;
  inventory: { id: string; serviceName: string; status: string } | null;
  activityDescription: string | null;
}

export interface OperatorDTO {
  id: string;
  companyId: string;

  // Identificação
  name: string;
  tradeName: string | null;
  cnpj: string | null;
  country: string | null;
  operatorType: string | null;
  description: string | null;
  notes: string | null;

  // Posição
  relationType: RelationType;
  classificationAnswers: ClassificationAnswers | null;

  // Contato terceiro
  thirdPartyDpoName: string | null;
  thirdPartyDpoEmail: string | null;
  thirdPartyDpoPhone: string | null;

  // Responsável interno
  responsibleId: string | null;
  responsible: { id: string; name: string | null; email: string } | null;

  // Termo de confidencialidade
  confidentialityTermSignedAt: string | null;
  confidentialityTermAttachment: string | null;

  // Contrato
  contractLabel: string | null;
  contractSignedAt: string | null;
  contractExpiresAt: string | null;
  contractLastReviewedAt: string | null;
  contractOriginalDate: string | null;
  contractStatus: ContractStatus;
  /** Status do ciclo de adequação LGPD (Checkpoint 14 H1). */
  lgpdComplianceStatus: LgpdComplianceStatus;

  // Régua de risco
  largaEscala: boolean;
  afetaTitulares: boolean;
  novasTecnologias: boolean;
  vigilanciaPublica: boolean;
  decisaoAutomatizada: boolean;
  dadosSensiveis: boolean;
  contractRiskClass: ContractRiskClass;
  recommendedClause: RecommendedClause;

  // Cláusulas presentes
  hasPrivacyClause: boolean;
  hasIncidentClause: boolean;
  incidentNotificationDays: number | null;
  permitsSubcontracting: boolean;
  permitsInternationalTransfer: boolean;
  isStandardMinute: boolean;

  // Anexos do contrato
  contractAttachments: ReadonlyArray<OperatorAttachment>;

  // Vínculos com processos
  processLinks: ReadonlyArray<OperatorProcessLinkDTO>;

  // Auditoria
  createdById: string;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface OperatorRow {
  id: string;
  companyId: string;
  name: string;
  tradeName: string | null;
  cnpj: string | null;
  country: string | null;
  operatorType: string | null;
  description: string | null;
  notes: string | null;
  relationType: string;
  classificationAnswers: any;
  thirdPartyDpoName: string | null;
  thirdPartyDpoEmail: string | null;
  thirdPartyDpoPhone: string | null;
  responsibleId: string | null;
  responsible?: { id: string; name: string | null; email: string } | null;
  confidentialityTermSignedAt: Date | null;
  confidentialityTermAttachment: string | null;
  contractLabel: string | null;
  contractSignedAt: Date | null;
  contractExpiresAt: Date | null;
  contractLastReviewedAt: Date | null;
  contractOriginalDate: Date | null;
  contractStatus: string;
  lgpdComplianceStatus: string;
  largaEscala: boolean;
  afetaTitulares: boolean;
  novasTecnologias: boolean;
  vigilanciaPublica: boolean;
  decisaoAutomatizada: boolean;
  dadosSensiveis: boolean;
  contractRiskClass: string;
  recommendedClause: string;
  hasPrivacyClause: boolean;
  hasIncidentClause: boolean;
  incidentNotificationDays: number | null;
  permitsSubcontracting: boolean;
  permitsInternationalTransfer: boolean;
  isStandardMinute: boolean;
  contractAttachments: any;
  createdById: string;
  createdBy?: { id: string; name: string | null; email: string } | null;
  createdAt: Date;
  updatedAt: Date;
  processLinks?: ReadonlyArray<{
    id: string;
    dataInventoryId: string;
    activityDescription: string | null;
    dataInventory?: { id: string; serviceName: string; status: string } | null;
  }>;
}

export function operatorToDTO(o: OperatorRow): OperatorDTO {
  return {
    id: o.id,
    companyId: o.companyId,
    name: o.name,
    tradeName: o.tradeName,
    cnpj: o.cnpj,
    country: o.country,
    operatorType: o.operatorType,
    description: o.description,
    notes: o.notes,
    relationType: o.relationType as RelationType,
    classificationAnswers:
      (o.classificationAnswers ?? null) as ClassificationAnswers | null,
    thirdPartyDpoName: o.thirdPartyDpoName,
    thirdPartyDpoEmail: o.thirdPartyDpoEmail,
    thirdPartyDpoPhone: o.thirdPartyDpoPhone,
    responsibleId: o.responsibleId,
    responsible: o.responsible ?? null,
    confidentialityTermSignedAt: o.confidentialityTermSignedAt
      ? o.confidentialityTermSignedAt.toISOString()
      : null,
    confidentialityTermAttachment: o.confidentialityTermAttachment,
    contractLabel: o.contractLabel,
    contractSignedAt: o.contractSignedAt
      ? o.contractSignedAt.toISOString()
      : null,
    contractExpiresAt: o.contractExpiresAt
      ? o.contractExpiresAt.toISOString()
      : null,
    contractLastReviewedAt: o.contractLastReviewedAt
      ? o.contractLastReviewedAt.toISOString()
      : null,
    contractOriginalDate: o.contractOriginalDate
      ? o.contractOriginalDate.toISOString()
      : null,
    contractStatus: o.contractStatus as ContractStatus,
    lgpdComplianceStatus: o.lgpdComplianceStatus as LgpdComplianceStatus,
    largaEscala: o.largaEscala,
    afetaTitulares: o.afetaTitulares,
    novasTecnologias: o.novasTecnologias,
    vigilanciaPublica: o.vigilanciaPublica,
    decisaoAutomatizada: o.decisaoAutomatizada,
    dadosSensiveis: o.dadosSensiveis,
    contractRiskClass: o.contractRiskClass as ContractRiskClass,
    recommendedClause: o.recommendedClause as RecommendedClause,
    hasPrivacyClause: o.hasPrivacyClause,
    hasIncidentClause: o.hasIncidentClause,
    incidentNotificationDays: o.incidentNotificationDays,
    permitsSubcontracting: o.permitsSubcontracting,
    permitsInternationalTransfer: o.permitsInternationalTransfer,
    isStandardMinute: o.isStandardMinute,
    contractAttachments:
      Array.isArray(o.contractAttachments) ? o.contractAttachments : [],
    processLinks:
      o.processLinks?.map((l) => ({
        id: l.id,
        dataInventoryId: l.dataInventoryId,
        inventory: l.dataInventory ?? null,
        activityDescription: l.activityDescription,
      })) ?? [],
    createdById: o.createdById,
    createdBy: o.createdBy ?? null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

// ============================================================
// Auth check (DPO + Contribuidor com escopo)
// ============================================================

export type OperatorAuthUser = {
  id: string;
  companyId: string;
  role: string;
  isDPO: boolean;
};

export async function loadOperatorAuth(): Promise<
  { error: NextResponse } | { user: OperatorAuthUser }
> {
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
      error: NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      ),
    };
  }
  if (!isDPO(u.role) && !isContribuidor(u.role)) {
    return {
      error: NextResponse.json(
        { error: "Sem permissão pra acessar Gestão de Terceiros" },
        { status: 403 }
      ),
    };
  }
  return {
    user: {
      id: u.id,
      companyId: u.companyId,
      role: u.role,
      isDPO: isDPO(u.role),
    },
  };
}

/** Pode editar o operador? Apenas DPO. */
export function canEditOperator(user: OperatorAuthUser): boolean {
  return user.isDPO;
}

/** Pode excluir o operador? Apenas DPO. */
export function canDeleteOperator(user: OperatorAuthUser): boolean {
  return user.isDPO;
}

// ============================================================
// Filtros de listagem
// ============================================================

/**
 * DPO vê todos os operadores da company. Contribuidor vê apenas os
 * vinculados a processos do Inventário que ele mesmo criou.
 *
 * Devolve um WHERE Prisma. Pra Contribuidor, retornamos um filtro que
 * exige pelo menos 1 processLink em processos próprios — caso o
 * Contribuidor não tenha nenhum, lista vazia.
 */
export function operatorAccessFilter(user: OperatorAuthUser): any {
  if (user.isDPO) {
    return { companyId: user.companyId };
  }
  return {
    companyId: user.companyId,
    processLinks: {
      some: {
        dataInventory: { createdById: user.id },
      },
    },
  };
}

// ============================================================
// Stats agregadas
// ============================================================

export interface OperatorStats {
  total: number;
  byRelation: Record<RelationType, number>;
  byRiskClass: Record<ContractRiskClass, number>;
  byContractStatus: Record<ContractStatus, number>;
  byLgpdCompliance: Record<LgpdComplianceStatus, number>;
  /** Operadores com contrato vencendo em ≤90d. Calculado on-demand. */
  expiringSoon: number;
  /** Operadores sem contrato vigente OU vencido. Sinaliza ação urgente. */
  needsAttention: number;
  /** Operadores pendentes de adequação LGPD (NAO_AVALIADO + EM_ADEQUACAO). */
  pendingCompliance: number;
}

export function computeOperatorStats(
  rows: ReadonlyArray<{
    relationType: string;
    contractRiskClass: string;
    contractStatus: string;
    lgpdComplianceStatus: string;
  }>
): OperatorStats {
  const stats: OperatorStats = {
    total: rows.length,
    byRelation: {
      INDEFINIDO: 0,
      OPERADOR: 0,
      CONTROLADOR: 0,
      CO_CONTROLADOR: 0,
    },
    byRiskClass: { ALTO: 0, MEDIO: 0, BAIXO: 0 },
    byContractStatus: {
      VIGENTE: 0,
      VENCENDO_90D: 0,
      VENCIDO: 0,
      EM_RENOVACAO: 0,
      SEM_CONTRATO: 0,
      NAO_APLICAVEL: 0,
    },
    byLgpdCompliance: {
      NAO_AVALIADO: 0,
      EM_ADEQUACAO: 0,
      ADEQUADO: 0,
      NAO_APLICAVEL: 0,
    },
    expiringSoon: 0,
    needsAttention: 0,
    pendingCompliance: 0,
  };
  for (const r of rows) {
    if (r.relationType in stats.byRelation) {
      (stats.byRelation as any)[r.relationType] += 1;
    }
    if (r.contractRiskClass in stats.byRiskClass) {
      (stats.byRiskClass as any)[r.contractRiskClass] += 1;
    }
    if (r.contractStatus in stats.byContractStatus) {
      (stats.byContractStatus as any)[r.contractStatus] += 1;
    }
    if (r.lgpdComplianceStatus in stats.byLgpdCompliance) {
      (stats.byLgpdCompliance as any)[r.lgpdComplianceStatus] += 1;
    }
    if (r.contractStatus === "VENCENDO_90D") stats.expiringSoon += 1;
    if (r.contractStatus === "VENCIDO" || r.contractStatus === "SEM_CONTRATO") {
      stats.needsAttention += 1;
    }
    if (
      r.lgpdComplianceStatus === "NAO_AVALIADO" ||
      r.lgpdComplianceStatus === "EM_ADEQUACAO"
    ) {
      stats.pendingCompliance += 1;
    }
  }
  return stats;
}

// ============================================================
// Helper: derivar contractStatus a partir de expiresAt
// ============================================================

/**
 * Atualiza contractStatus on-the-fly baseado em contractExpiresAt e
 * contractStatus atual. Não persiste — apenas devolve o status real
 * pra exibir e filtrar.
 *
 * Regras:
 *   - "EM_RENOVACAO" e "NAO_APLICAVEL" e "SEM_CONTRATO" → mantém
 *   - Se expiresAt no passado → "VENCIDO"
 *   - Se expiresAt em ≤90d → "VENCENDO_90D"
 *   - Caso contrário → "VIGENTE"
 */
export function deriveContractStatus(
  storedStatus: string,
  expiresAt: Date | string | null
): ContractStatus {
  // Status manuais não são sobrescritos
  if (
    storedStatus === "EM_RENOVACAO" ||
    storedStatus === "NAO_APLICAVEL" ||
    storedStatus === "SEM_CONTRATO"
  ) {
    return storedStatus as ContractStatus;
  }
  if (!expiresAt) return "SEM_CONTRATO";
  const exp = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  const now = Date.now();
  const diffDays = (exp.getTime() - now) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "VENCIDO";
  if (diffDays <= 90) return "VENCENDO_90D";
  return "VIGENTE";
}
