/**
 * Helpers do DSR (Direitos do Titular) — versão mono do app do Comitê.
 *
 * No TCE-ES o INTAKE é externo (Ouvidoria → Acesso Identificado/NCD →
 * Encarregado via e-tcees). Este módulo serve ao PAINEL INTERNO do
 * Encarregado: catálogo de direitos (art. 18), categorias, canais de
 * origem do rito oficial, status do atendimento e o prazo legal de 15 dias.
 */

export const DSR_RIGHTS = {
  I:    { label: "Confirmação da existência de tratamento", legal: "Art. 18, I" },
  II:   { label: "Acesso aos dados", legal: "Art. 18, II" },
  III:  { label: "Correção de dados incompletos, inexatos ou desatualizados", legal: "Art. 18, III" },
  IV:   { label: "Anonimização, bloqueio ou eliminação de dados desnecessários ou irregulares", legal: "Art. 18, IV" },
  V:    { label: "Portabilidade dos dados", legal: "Art. 18, V" },
  VI:   { label: "Eliminação após revogação do consentimento", legal: "Art. 18, VI" },
  VII:  { label: "Informação sobre compartilhamentos com terceiros", legal: "Art. 18, VII" },
  VIII: { label: "Informação sobre não-consentimento e consequências", legal: "Art. 18, VIII" },
  IX:   { label: "Revogação do consentimento", legal: "Art. 18, IX" },
  X:    { label: "Oposição ao tratamento (descumprimento da LGPD)", legal: "Art. 18, §2º" },
  XI:   { label: "Petição relativa aos seus dados — direito a explicações", legal: "Art. 19" },
  XII:  { label: "Revisão de decisões automatizadas", legal: "Art. 20" },
} as const;
export type DsrRightCode = keyof typeof DSR_RIGHTS;
export const DSR_RIGHT_CODES = Object.keys(DSR_RIGHTS) as DsrRightCode[];

export const DSR_TITULAR_CATEGORY_LABELS: Record<string, string> = {
  cidadao: "Cidadão / usuário de serviço público",
  servidor: "Servidor / colaborador",
  fornecedor: "Fornecedor / contratado",
  jurisdicionado: "Jurisdicionado",
  outro: "Outro",
};
export const DSR_TITULAR_CATEGORIES = Object.keys(DSR_TITULAR_CATEGORY_LABELS);
export type DsrTitularCategory = string;

/** Canais de resposta ao titular (usado no DOCX de resposta). */
export const DSR_RESPONSE_CHANNEL_LABELS: Record<string, string> = {
  email: "E-mail",
  postal: "Correspondência postal",
  presencial: "Retirada presencial",
  outro: "Outro",
};
export type DsrResponseChannel = string;

/** Canal de ORIGEM do pedido — o rito oficial do TCE-ES. */
export const DSR_ORIGIN_LABELS: Record<string, string> = {
  ouvidoria: "Ouvidoria — Conta pra Gente",
  acesso_identificado: "Acesso Identificado (peticionamento)",
  ncd: "NCD / Protocolo (presencial)",
  outro: "Outro",
};
export const DSR_ORIGINS = Object.keys(DSR_ORIGIN_LABELS);

export const DSR_STATUSES = ["RECEBIDA", "EM_ANALISE", "AGUARDANDO_TITULAR", "RESPONDIDA", "INDEFERIDA"] as const;
export type DsrStatus = (typeof DSR_STATUSES)[number];

export const DSR_STATUS_LABELS: Record<DsrStatus, string> = {
  RECEBIDA: "Recebida",
  EM_ANALISE: "Em análise",
  AGUARDANDO_TITULAR: "Aguardando o titular",
  RESPONDIDA: "Respondida",
  INDEFERIDA: "Indeferida",
};

export function dsrStatusBadgeClass(s: string | null | undefined): string {
  switch (s) {
    case "RECEBIDA":           return "bg-blue-100 text-blue-800 border-blue-300";
    case "EM_ANALISE":         return "bg-amber-100 text-amber-800 border-amber-300";
    case "AGUARDANDO_TITULAR": return "bg-purple-100 text-purple-800 border-purple-300";
    case "RESPONDIDA":         return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "INDEFERIDA":         return "bg-gray-200 text-gray-700 border-gray-300";
    default:                   return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

export const DSR_DECISIONS = ["DEFERIDO", "DEFERIDO_PARCIAL", "INDEFERIDO"] as const;
export type DsrDecision = (typeof DSR_DECISIONS)[number];
export const DSR_DECISION_LABELS: Record<DsrDecision, string> = {
  DEFERIDO: "Deferido integralmente",
  DEFERIDO_PARCIAL: "Deferido parcialmente",
  INDEFERIDO: "Indeferido",
};

// ----- Prazo legal: 15 dias corridos (art. 19 §1º; Res. ANPD) -----
export const DSR_DEADLINE_DAYS = 15;

export function computeDueDate(receivedAt: Date = new Date()): Date {
  const due = new Date(receivedAt);
  due.setDate(due.getDate() + DSR_DEADLINE_DAYS);
  return due;
}

export function daysUntilDue(dueDate: Date | string, now: Date = new Date()): number {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function deadlineUrgency(
  dueDate: Date | string,
  status: string,
): "overdue" | "critical" | "warning" | "normal" | "concluded" {
  if (status === "RESPONDIDA" || status === "INDEFERIDA") return "concluded";
  const days = daysUntilDue(dueDate);
  if (days < 0) return "overdue";
  if (days <= 3) return "critical";
  if (days <= 7) return "warning";
  return "normal";
}
