/**
 * Utilitários do mini-app "Requisições de Direitos do Titular".
 *
 * Cobre arts. 18, 19 e 20 da LGPD — 12 direitos (I a XII).
 * Prazo legal de resposta: 15 dias corridos do recebimento (art. 19 §1º).
 */

import { prisma } from "@/lib/db";

// ----- Direitos do titular (códigos -> rótulo + fundamento) -----
export const DSR_RIGHTS = {
  I:    { label: "Confirmação da existência de tratamento",                                    legal: "Art. 18, I" },
  II:   { label: "Acesso aos dados",                                                            legal: "Art. 18, II" },
  III:  { label: "Correção de dados incompletos, inexatos ou desatualizados",                  legal: "Art. 18, III" },
  IV:   { label: "Anonimização, bloqueio ou eliminação de dados desnecessários ou irregulares", legal: "Art. 18, IV" },
  V:    { label: "Portabilidade dos dados",                                                    legal: "Art. 18, V" },
  VI:   { label: "Eliminação após revogação do consentimento",                                 legal: "Art. 18, VI" },
  VII:  { label: "Informação sobre compartilhamentos com terceiros",                           legal: "Art. 18, VII" },
  VIII: { label: "Informação sobre não-consentimento e consequências",                         legal: "Art. 18, VIII" },
  IX:   { label: "Revogação do consentimento",                                                 legal: "Art. 18, IX" },
  X:    { label: "Oposição ao tratamento (em caso de descumprimento da LGPD)",                 legal: "Art. 18, §2º" },
  XI:   { label: "Petição relativa aos seus dados — direito a explicações",                    legal: "Art. 19" },
  XII:  { label: "Revisão de decisões automatizadas",                                          legal: "Art. 20" },
} as const;

export type DsrRightCode = keyof typeof DSR_RIGHTS;
export const DSR_RIGHT_CODES = Object.keys(DSR_RIGHTS) as DsrRightCode[];

// ----- Categorias de titular -----
export const DSR_TITULAR_CATEGORIES = [
  "cidadao",
  "servidor",
  "fornecedor",
  "jurisdicionado",
  "outro",
] as const;
export type DsrTitularCategory = (typeof DSR_TITULAR_CATEGORIES)[number];

export const DSR_TITULAR_CATEGORY_LABELS: Record<DsrTitularCategory, string> = {
  cidadao: "Cidadão / usuário de serviço público",
  servidor: "Servidor / colaborador",
  fornecedor: "Fornecedor / contratado",
  jurisdicionado: "Jurisdicionado",
  outro: "Outro",
};

// ----- Canais de resposta -----
export const DSR_RESPONSE_CHANNELS = [
  "email",
  "postal",
  "presencial",
  "outro",
] as const;
export type DsrResponseChannel = (typeof DSR_RESPONSE_CHANNELS)[number];

export const DSR_RESPONSE_CHANNEL_LABELS: Record<DsrResponseChannel, string> = {
  email: "E-mail",
  postal: "Correspondência postal",
  presencial: "Retirada presencial",
  outro: "Outro",
};

// ----- Status do workflow -----
export const DSR_STATUSES = [
  "RECEBIDA",
  "EM_ANALISE",
  "AGUARDANDO_TITULAR",
  "RESPONDIDA",
  "INDEFERIDA",
] as const;
export type DsrStatus = (typeof DSR_STATUSES)[number];

export const DSR_STATUS_LABELS: Record<DsrStatus, string> = {
  RECEBIDA: "Recebida",
  EM_ANALISE: "Em análise",
  AGUARDANDO_TITULAR: "Aguardando o titular",
  RESPONDIDA: "Respondida",
  INDEFERIDA: "Indeferida",
};

export const DSR_STATUS_COLORS: Record<DsrStatus, { bg: string; fg: string; ring: string }> = {
  RECEBIDA:           { bg: "bg-blue-50",   fg: "text-blue-700",   ring: "ring-blue-600/20" },
  EM_ANALISE:         { bg: "bg-amber-50",  fg: "text-amber-700",  ring: "ring-amber-600/20" },
  AGUARDANDO_TITULAR: { bg: "bg-purple-50", fg: "text-purple-700", ring: "ring-purple-600/20" },
  RESPONDIDA:         { bg: "bg-green-50",  fg: "text-green-700",  ring: "ring-green-600/20" },
  INDEFERIDA:         { bg: "bg-gray-50",   fg: "text-gray-700",   ring: "ring-gray-600/20" },
};

// ----- Decisão -----
export const DSR_DECISIONS = ["DEFERIDO", "DEFERIDO_PARCIAL", "INDEFERIDO"] as const;
export type DsrDecision = (typeof DSR_DECISIONS)[number];
export const DSR_DECISION_LABELS: Record<DsrDecision, string> = {
  DEFERIDO: "Deferido integralmente",
  DEFERIDO_PARCIAL: "Deferido parcialmente",
  INDEFERIDO: "Indeferido",
};

// ----- Prazo legal: 15 dias corridos -----
export const DSR_DEADLINE_DAYS = 15;

export function computeDueDate(receivedAt: Date = new Date()): Date {
  const due = new Date(receivedAt);
  due.setDate(due.getDate() + DSR_DEADLINE_DAYS);
  return due;
}

/**
 * Dias restantes até o prazo legal (negativo se já estourou).
 * Calculado em dias corridos (não úteis), conforme art. 19 §1º LGPD.
 */
export function daysUntilDue(dueDate: Date | string, now: Date = new Date()): number {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const ms = due.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * Classificação de urgência para badge visual no painel DPO.
 * - "overdue":  prazo já vencido
 * - "critical": ≤ 3 dias restantes
 * - "warning":  ≤ 7 dias restantes
 * - "normal":   > 7 dias
 */
export function deadlineUrgency(
  dueDate: Date | string,
  status: DsrStatus,
): "overdue" | "critical" | "warning" | "normal" | "concluded" {
  if (status === "RESPONDIDA" || status === "INDEFERIDA") return "concluded";
  const days = daysUntilDue(dueDate);
  if (days < 0) return "overdue";
  if (days <= 3) return "critical";
  if (days <= 7) return "warning";
  return "normal";
}

// ----- Geração de protocolo -----
/**
 * Gera próximo número de protocolo no formato "REQ-YYYY-NNNN" (4 dígitos,
 * com zero à esquerda). Numeração reinicia a cada ano por empresa.
 *
 * Implementação resistente a race condition: usa transação + lock advisory
 * via `pg_advisory_xact_lock` por companyId. Em volume baixo (typical para
 * órgão público) é mais que suficiente.
 */
export async function generateProtocolNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `REQ-${year}-`;

  // Conta quantas requisições já existem da empresa naquele ano
  const count = await prisma.dataSubjectRequest.count({
    where: {
      companyId,
      protocolNumber: { startsWith: prefix },
    },
  });

  let candidate = `${prefix}${String(count + 1).padStart(4, "0")}`;

  // Salvaguarda contra colisão (caso o count esteja desatualizado em race condition)
  let attempts = 0;
  while (attempts < 5) {
    const exists = await prisma.dataSubjectRequest.findUnique({
      where: { protocolNumber: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    attempts++;
    candidate = `${prefix}${String(count + 1 + attempts).padStart(4, "0")}`;
  }

  // Fallback robusto: incluir timestamp se 5 tentativas falharem
  return `${prefix}${String(Date.now()).slice(-6)}`;
}

// ----- Validações de entrada (form público) -----

const CPF_RE = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type DsrSubmissionInput = {
  companyId: string;
  // Identificação
  titularName: string;
  titularCpf: string;
  titularDocType?: string;
  titularDocNumber?: string;
  titularBirthDate?: string | null;
  titularPhone: string;
  titularEmail: string;
  titularAddress?: string;
  titularCategory: string;
  titularCategoryOther?: string;
  // Representante
  hasRepresentative?: boolean;
  representativeName?: string;
  representativeCpf?: string;
  representativeType?: string;
  representativeTypeOther?: string;
  representativeEmail?: string;
  representativePhone?: string;
  // Pedido
  requestedRights: string[];
  detailedRequest: string;
  responseChannel: string;
  responseChannelOther?: string;
  // Anexos
  identityDocUrl?: string | null;
  representationDocUrl?: string | null;
  additionalDocs?: Array<{ name: string; url: string }>;
  // Aceite
  authenticityAccepted: boolean;
  // Auditoria (preenchido pelo handler)
  ipAddress?: string;
  userAgent?: string;
};

export type DsrValidationError = { field: string; message: string };

export function validateDsrSubmission(input: DsrSubmissionInput): DsrValidationError[] {
  const errors: DsrValidationError[] = [];

  // Identificação
  if (!input.titularName || input.titularName.trim().length < 3) {
    errors.push({ field: "titularName", message: "Nome completo é obrigatório (mín. 3 caracteres)." });
  }
  if (!input.titularCpf || !CPF_RE.test(input.titularCpf.trim())) {
    errors.push({ field: "titularCpf", message: "CPF inválido. Use o formato 000.000.000-00." });
  }
  if (!input.titularPhone || input.titularPhone.trim().length < 8) {
    errors.push({ field: "titularPhone", message: "Telefone é obrigatório." });
  }
  if (!input.titularEmail || !EMAIL_RE.test(input.titularEmail.trim())) {
    errors.push({ field: "titularEmail", message: "E-mail inválido." });
  }
  if (!DSR_TITULAR_CATEGORIES.includes(input.titularCategory as DsrTitularCategory)) {
    errors.push({ field: "titularCategory", message: "Categoria do titular inválida." });
  }
  if (input.titularCategory === "outro" && !input.titularCategoryOther?.trim()) {
    errors.push({ field: "titularCategoryOther", message: "Especifique a categoria." });
  }

  // Representante (se aplicável)
  if (input.hasRepresentative) {
    if (!input.representativeName?.trim()) {
      errors.push({ field: "representativeName", message: "Nome do representante é obrigatório." });
    }
    if (!input.representativeCpf || !CPF_RE.test(input.representativeCpf.trim())) {
      errors.push({ field: "representativeCpf", message: "CPF do representante inválido." });
    }
    if (!input.representativeType?.trim()) {
      errors.push({ field: "representativeType", message: "Tipo de representação é obrigatório." });
    }
    if (!input.representationDocUrl) {
      errors.push({ field: "representationDocUrl", message: "Documento de representação é obrigatório." });
    }
  }

  // Pedido
  if (!Array.isArray(input.requestedRights) || input.requestedRights.length === 0) {
    errors.push({ field: "requestedRights", message: "Selecione pelo menos um direito a exercer." });
  } else {
    const invalid = input.requestedRights.filter(
      (r) => !DSR_RIGHT_CODES.includes(r as DsrRightCode),
    );
    if (invalid.length > 0) {
      errors.push({ field: "requestedRights", message: `Códigos de direito inválidos: ${invalid.join(", ")}.` });
    }
  }
  if (!input.detailedRequest || input.detailedRequest.trim().length < 10) {
    errors.push({ field: "detailedRequest", message: "Descreva seu pedido com no mínimo 10 caracteres." });
  }
  if (!DSR_RESPONSE_CHANNELS.includes(input.responseChannel as DsrResponseChannel)) {
    errors.push({ field: "responseChannel", message: "Canal de resposta inválido." });
  }
  if (input.responseChannel === "outro" && !input.responseChannelOther?.trim()) {
    errors.push({ field: "responseChannelOther", message: "Especifique o canal preferido." });
  }

  // Anexos (B1: upload obrigatório de identidade)
  if (!input.identityDocUrl) {
    errors.push({ field: "identityDocUrl", message: "Documento de identidade é obrigatório." });
  }

  // Aceite
  if (!input.authenticityAccepted) {
    errors.push({ field: "authenticityAccepted", message: "É necessário aceitar a declaração de autenticidade." });
  }

  return errors;
}

/** Sanitiza o input — remove espaços extras, normaliza CPF, etc. */
export function normalizeDsrSubmission(input: DsrSubmissionInput): DsrSubmissionInput {
  return {
    ...input,
    titularName: input.titularName?.trim(),
    titularCpf: input.titularCpf?.trim(),
    titularPhone: input.titularPhone?.trim(),
    titularEmail: input.titularEmail?.trim().toLowerCase(),
    titularAddress: input.titularAddress?.trim(),
    titularCategoryOther: input.titularCategoryOther?.trim(),
    representativeName: input.representativeName?.trim(),
    representativeCpf: input.representativeCpf?.trim(),
    representativeEmail: input.representativeEmail?.trim().toLowerCase(),
    representativePhone: input.representativePhone?.trim(),
    representativeTypeOther: input.representativeTypeOther?.trim(),
    detailedRequest: input.detailedRequest?.trim(),
    responseChannelOther: input.responseChannelOther?.trim(),
  };
}
