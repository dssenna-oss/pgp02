// Rótulos, cores e helpers de apresentação do módulo do Comitê.
// Centraliza os mapeamentos status→badge e eixo→cor usados nas 9 telas.

export type BadgeVariant = "green" | "amber" | "red" | "gray" | "blue" | "indigo";

// --- Status de ENTREGAS / MARCOS ---
export const STATUS_ENTREGA: Record<string, { label: string; variant: BadgeVariant }> = {
  CONCLUIDO: { label: "✓ concluído", variant: "green" },
  EM_ANDAMENTO: { label: "em andamento", variant: "amber" },
  A_INICIAR: { label: "a iniciar", variant: "gray" },
  ATRASADO: { label: "atrasado", variant: "red" },
  CRITICO: { label: "crítico", variant: "amber" },
};

export function statusEntrega(s: string) {
  return STATUS_ENTREGA[s] ?? { label: s, variant: "gray" as BadgeVariant };
}

// --- Status de INDICADORES ---
export const STATUS_INDICADOR: Record<string, { label: string; variant: BadgeVariant }> = {
  CONCLUIDO: { label: "atingido", variant: "green" },
  EM_ANDAMENTO: { label: "em andamento", variant: "amber" },
  EM_RISCO: { label: "em risco", variant: "amber" },
  ATRASADO: { label: "atrasado", variant: "red" },
  A_INICIAR: { label: "a iniciar", variant: "gray" },
};

export function statusIndicador(s: string) {
  return STATUS_INDICADOR[s] ?? { label: s, variant: "gray" as BadgeVariant };
}

// --- Status de DOCUMENTOS ---
export const STATUS_DOC: Record<string, { label: string; variant: BadgeVariant }> = {
  A_ELABORAR: { label: "a elaborar", variant: "gray" },
  ELABORADO: { label: "elaborado", variant: "blue" },
  PENDENTE_APROVACAO: { label: "pendente de aprovação", variant: "amber" },
  HOMOLOGADO: { label: "homologado", variant: "green" },
  REGISTRADA: { label: "registrada", variant: "green" },
};

export function statusDoc(s: string) {
  return STATUS_DOC[s] ?? { label: s, variant: "gray" as BadgeVariant };
}

// --- Status de CONSULTA PRÉVIA ---
export const STATUS_CONSULTA: Record<string, { label: string; variant: BadgeVariant; border: string }> = {
  RESPONDIDA: { label: "respondida", variant: "green", border: "border-l-emerald-500" },
  EM_ANALISE: { label: "em análise", variant: "amber", border: "border-l-amber-500" },
  PENDENCIA: { label: "pendência de área", variant: "red", border: "border-l-red-500" },
};

export function statusConsulta(s: string) {
  return STATUS_CONSULTA[s] ?? { label: s, variant: "gray" as BadgeVariant, border: "border-l-gray-300" };
}

// --- Cores dos EIXOS (chip/tag) — espelham o mockup ---
export const EIXO_TAG: Record<string, string> = {
  A: "bg-violet-100 text-violet-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-emerald-100 text-emerald-800",
  D: "bg-rose-100 text-rose-800",
  E: "bg-yellow-100 text-yellow-800",
  IMPACTO: "bg-slate-200 text-slate-700",
};

// Barra de progresso por eixo (cor sólida)
export const EIXO_BAR: Record<string, string> = {
  A: "bg-violet-500",
  B: "bg-blue-500",
  C: "bg-emerald-500",
  D: "bg-rose-500",
  E: "bg-yellow-500",
};

export function eixoTag(codigo: string) {
  return EIXO_TAG[codigo] ?? "bg-gray-100 text-gray-700";
}

// Trimestres do biênio, em ordem cronológica + rótulo legível.
export const TRIMESTRES: { id: string; label: string; sub: string }[] = [
  { id: "Q2-2026", label: "Q2 2026", sub: "Maio–Junho · Consolidação inicial" },
  { id: "Q3-2026", label: "Q3 2026", sub: "Julho–Setembro · Consolidação técnica" },
  { id: "Q4-2026", label: "Q4 2026", sub: "Outubro–Dezembro · Entrega do marco-mãe" },
  { id: "Q1-2027", label: "Q1 2027", sub: "Janeiro–Março · Consolidação operacional" },
  { id: "Q2-2027", label: "Q2 2027", sub: "Abril–Junho" },
  { id: "Q3-2027", label: "Q3 2027", sub: "Julho–Setembro · Auditoria" },
  { id: "Q4-2027", label: "Q4 2027", sub: "Outubro–Dezembro · Encerramento do biênio" },
];

// --- Status do INVENTÁRIO (Fase 3) ---
export const STATUS_INVENTARIO: Record<string, { label: string; variant: BadgeVariant }> = {
  PRELIMINAR: { label: "preliminar", variant: "amber" },
  EM_REVISAO: { label: "em revisão", variant: "blue" },
  CONCLUIDO: { label: "concluído", variant: "green" },
};

export function statusInventario(s: string) {
  return STATUS_INVENTARIO[s] ?? { label: s, variant: "gray" as BadgeVariant };
}

// Hipóteses macro de tratamento (Seção 7.3 do Plano)
export const HIPOTESE_MACRO: Record<string, string> = {
  I: "Ações de controle externo",
  II: "Serviços à sociedade",
  III: "Ações de capacitação",
  IV: "Ações administrativas internas",
};

// --- Análise de Riscos (matriz P×I) ---
export const PI_LABEL: Record<number, string> = { 1: "Baixa", 2: "Média", 3: "Alta" };

/** Nível de risco a partir de Probabilidade × Impacto (produto na matriz 3×3). */
export function nivelRisco(prob: number, impacto: number): {
  produto: number;
  nivel: "BAIXO" | "MEDIO" | "ALTO";
  label: string;
  variant: BadgeVariant;
  /** cor sólida para célula da matriz / radar */
  cor: string;
} {
  const produto = prob * impacto;
  if (produto <= 2) return { produto, nivel: "BAIXO", label: "Baixo", variant: "green", cor: "#16a34a" };
  if (produto <= 4) return { produto, nivel: "MEDIO", label: "Médio", variant: "amber", cor: "#d97706" };
  return { produto, nivel: "ALTO", label: "Alto", variant: "red", cor: "#dc2626" };
}

export const STATUS_RISCO: Record<string, { label: string; variant: BadgeVariant }> = {
  ABERTO: { label: "aberto", variant: "amber" },
  TRATADO: { label: "tratado", variant: "green" },
  ACEITO: { label: "risco aceito", variant: "gray" },
};

// --- Plano de Ação (Fase 5) ---
export const STATUS_ACAO: Record<string, { label: string; variant: BadgeVariant }> = {
  A_FAZER: { label: "a fazer", variant: "gray" },
  EM_ANDAMENTO: { label: "em andamento", variant: "amber" },
  CONCLUIDA: { label: "concluída", variant: "green" },
};
export const PRIORIDADE_ACAO: Record<string, { label: string; variant: BadgeVariant }> = {
  ALTA: { label: "alta", variant: "red" },
  MEDIA: { label: "média", variant: "amber" },
  BAIXA: { label: "baixa", variant: "gray" },
};
export const ORIGEM_ACAO: Record<string, { label: string; variant: BadgeVariant }> = {
  GAP: { label: "GAP", variant: "indigo" },
  RISCO: { label: "Risco", variant: "red" },
  PLANO: { label: "Plano de Trabalho", variant: "blue" },
  MANUAL: { label: "Manual", variant: "gray" },
};

export const MESES_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];
