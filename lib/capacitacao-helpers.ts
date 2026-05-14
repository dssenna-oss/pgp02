/**
 * Helpers do mini-app Capacitação LGPD (Checkpoint 18).
 *
 * Centraliza:
 *   - Auth (DPO-only para escrita; qualquer autenticado pode listar)
 *   - Catálogos (eixos, tipos, públicos, recorrência) com label PT-BR
 *   - DTO de saída (com vínculos resolvidos)
 *   - Stats consolidadas (total, por status, cobertura por eixo/público)
 *   - Sanitizadores
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { isDPO, canManageContributors } from "@/lib/auth-helpers";

// ============================================================
// Tipos públicos
// ============================================================

export type CapacitacaoEixo =
  | "ONBOARDING"
  | "PILULAS"
  | "PRATICA"
  | "DEPARTAMENTAL"
  | "MONITORAMENTO";

export type CapacitacaoType =
  | "PALESTRA"
  | "WORKSHOP"
  | "TREINAMENTO"
  | "EMAIL"
  | "VIDEO"
  | "CAMPANHA"
  | "SIMULADO"
  | "QUIZ"
  | "OUTRO";

export type CapacitacaoAudience =
  | "GERAL"
  | "RH_MARKETING"
  | "TI_SEGURANCA"
  | "EXTERNOS"
  | "DIRETORIA"
  | "ATENDIMENTO"
  | "NOVOS_COLABORADORES";

export type CapacitacaoStatus = "PLANEJADO" | "REALIZADO" | "CANCELADO";

export type CapacitacaoRecurrence =
  | "UNICO"
  | "MENSAL"
  | "TRIMESTRAL"
  | "SEMESTRAL"
  | "ANUAL";

// ============================================================
// Catálogos com label PT-BR
// ============================================================

export const EIXO_LABELS: Record<CapacitacaoEixo, string> = {
  ONBOARDING: "Onboarding",
  PILULAS: "Pílulas de Conhecimento",
  PRATICA: "Prática e Gamificação",
  DEPARTAMENTAL: "Treinamentos por Departamento",
  MONITORAMENTO: "Monitoramento e Ciclo",
};

export const EIXO_DESCRIPTIONS: Record<CapacitacaoEixo, string> = {
  ONBOARDING:
    "Integração e nivelamento — treinamentos obrigatórios pra novos colaboradores e prestadores de serviço.",
  PILULAS:
    "Comunicação interna constante — newsletters, wallpapers, canais Slack/Teams pra manter o tema vivo.",
  PRATICA:
    "Atividades práticas e gamificação — simulados de phishing, quizzes premiados, workshops de Data Cleaning.",
  DEPARTAMENTAL:
    "Treinamentos específicos por área — Privacy by Design, gestão de crises, atendimento ao titular.",
  MONITORAMENTO:
    "Matriz de treinamento, pesquisas de clima, revisão semestral de conteúdo.",
};

export const TYPE_LABELS: Record<CapacitacaoType, string> = {
  PALESTRA: "Palestra",
  WORKSHOP: "Workshop",
  TREINAMENTO: "Treinamento (E-learning)",
  EMAIL: "E-mail / Newsletter",
  VIDEO: "Vídeo",
  CAMPANHA: "Campanha visual",
  SIMULADO: "Simulado (phishing/incidente)",
  QUIZ: "Quiz / Gamificação",
  OUTRO: "Outro",
};

export const AUDIENCE_LABELS: Record<CapacitacaoAudience, string> = {
  GERAL: "Geral (todos)",
  RH_MARKETING: "RH e Marketing",
  TI_SEGURANCA: "TI e Segurança",
  EXTERNOS: "Externos / Terceiros",
  DIRETORIA: "Diretoria",
  ATENDIMENTO: "Atendimento ao Titular (SAC)",
  NOVOS_COLABORADORES: "Novos Colaboradores",
};

export const STATUS_LABELS: Record<CapacitacaoStatus, string> = {
  PLANEJADO: "Planejado",
  REALIZADO: "Realizado",
  CANCELADO: "Cancelado",
};

export const RECURRENCE_LABELS: Record<CapacitacaoRecurrence, string> = {
  UNICO: "Único",
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
};

export const ALL_EIXOS: CapacitacaoEixo[] = [
  "ONBOARDING",
  "PILULAS",
  "PRATICA",
  "DEPARTAMENTAL",
  "MONITORAMENTO",
];

export const ALL_AUDIENCES: CapacitacaoAudience[] = [
  "GERAL",
  "RH_MARKETING",
  "TI_SEGURANCA",
  "EXTERNOS",
  "DIRETORIA",
  "ATENDIMENTO",
  "NOVOS_COLABORADORES",
];

// ============================================================
// Validação
// ============================================================

export function isValidEixo(v: unknown): v is CapacitacaoEixo {
  return typeof v === "string" && v in EIXO_LABELS;
}
export function isValidType(v: unknown): v is CapacitacaoType {
  return typeof v === "string" && v in TYPE_LABELS;
}
export function isValidAudience(v: unknown): v is CapacitacaoAudience {
  return typeof v === "string" && v in AUDIENCE_LABELS;
}
export function isValidStatus(v: unknown): v is CapacitacaoStatus {
  return typeof v === "string" && v in STATUS_LABELS;
}
export function isValidRecurrence(v: unknown): v is CapacitacaoRecurrence {
  return typeof v === "string" && v in RECURRENCE_LABELS;
}

// ============================================================
// Auth
// ============================================================

export interface CapacitacaoAuthUser {
  id: string;
  email: string;
  companyId: string;
  role: string;
  name: string | null;
}

/** Carrega usuário autenticado + valida companyId. Não exige DPO (qualquer
 *  papel pode ver). */
export async function loadCapacitacaoAuth(): Promise<
  | { error: NextResponse }
  | { user: CapacitacaoAuthUser }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }
  const u = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, companyId: true, role: true, name: true },
  });
  if (!u || !u.companyId) {
    return {
      error: NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 },
      ),
    };
  }
  return {
    user: {
      id: u.id,
      email: u.email,
      companyId: u.companyId,
      role: u.role,
      name: u.name,
    },
  };
}

/** Pode CRIAR/EDITAR eventos: qualquer DPO. */
export function canManageCapacitacao(role: string): boolean {
  return isDPO(role);
}

/** Pode DELETAR: só DPO Principal/Substituto. */
export function canDeleteCapacitacao(role: string): boolean {
  return canManageContributors(role);
}

// ============================================================
// DTO de saída
// ============================================================

export interface CapacitacaoEventoDTO {
  id: string;
  title: string;
  description: string | null;
  eixo: CapacitacaoEixo;
  eixoLabel: string;
  type: CapacitacaoType;
  typeLabel: string;
  audience: CapacitacaoAudience;
  audienceLabel: string;
  scheduledAt: string | null;
  completedAt: string | null;
  status: CapacitacaoStatus;
  statusLabel: string;
  recurrence: CapacitacaoRecurrence;
  recurrenceLabel: string;
  evidenceUrl: string | null;
  evidenceFileName: string | null;
  attendeesCount: number | null;
  notes: string | null;
  /** Vínculos opcionais resolvidos pra exibição */
  operator: { id: string; name: string } | null;
  incident: { id: string; title: string } | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface RawCapacitacao {
  id: string;
  title: string;
  description: string | null;
  eixo: string;
  type: string;
  audience: string;
  scheduledAt: Date | null;
  completedAt: Date | null;
  status: string;
  recurrence: string;
  evidenceUrl: string | null;
  evidenceFileName: string | null;
  attendeesCount: number | null;
  notes: string | null;
  operator: { id: string; name: string } | null;
  incident: { id: string; title: string } | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toCapacitacaoDTO(row: RawCapacitacao): CapacitacaoEventoDTO {
  const eixo = (isValidEixo(row.eixo) ? row.eixo : "MONITORAMENTO") as CapacitacaoEixo;
  const type = (isValidType(row.type) ? row.type : "OUTRO") as CapacitacaoType;
  const audience = (isValidAudience(row.audience)
    ? row.audience
    : "GERAL") as CapacitacaoAudience;
  const status = (isValidStatus(row.status)
    ? row.status
    : "PLANEJADO") as CapacitacaoStatus;
  const recurrence = (isValidRecurrence(row.recurrence)
    ? row.recurrence
    : "UNICO") as CapacitacaoRecurrence;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    eixo,
    eixoLabel: EIXO_LABELS[eixo],
    type,
    typeLabel: TYPE_LABELS[type],
    audience,
    audienceLabel: AUDIENCE_LABELS[audience],
    scheduledAt: row.scheduledAt ? row.scheduledAt.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    status,
    statusLabel: STATUS_LABELS[status],
    recurrence,
    recurrenceLabel: RECURRENCE_LABELS[recurrence],
    evidenceUrl: row.evidenceUrl,
    evidenceFileName: row.evidenceFileName,
    attendeesCount: row.attendeesCount,
    notes: row.notes,
    operator: row.operator,
    incident: row.incident,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const CAPACITACAO_FULL_INCLUDE = {
  operator: { select: { id: true, name: true } },
  incident: { select: { id: true, title: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

// ============================================================
// Stats
// ============================================================

export interface CapacitacaoStats {
  total: number;
  byStatus: Record<CapacitacaoStatus, number>;
  byEixo: Record<CapacitacaoEixo, number>;
  byAudience: Record<CapacitacaoAudience, number>;
  /** Próxima sessão agendada (status PLANEJADO mais próximo no futuro) */
  nextScheduled: { id: string; title: string; scheduledAt: string } | null;
  /** Quantos eixos têm pelo menos 1 evento REALIZADO */
  eixosCovered: number;
  /** Quantos públicos têm pelo menos 1 evento REALIZADO */
  audiencesCovered: number;
  /** Total de eventos com evidência anexada */
  withEvidence: number;
}

export function computeCapacitacaoStats(
  rows: ReadonlyArray<{
    id: string;
    title: string;
    eixo: string;
    audience: string;
    status: string;
    scheduledAt: Date | null;
    evidenceUrl: string | null;
  }>,
): CapacitacaoStats {
  const byStatus: Record<CapacitacaoStatus, number> = {
    PLANEJADO: 0,
    REALIZADO: 0,
    CANCELADO: 0,
  };
  const byEixo: Record<CapacitacaoEixo, number> = {
    ONBOARDING: 0,
    PILULAS: 0,
    PRATICA: 0,
    DEPARTAMENTAL: 0,
    MONITORAMENTO: 0,
  };
  const byAudience: Record<CapacitacaoAudience, number> = {
    GERAL: 0,
    RH_MARKETING: 0,
    TI_SEGURANCA: 0,
    EXTERNOS: 0,
    DIRETORIA: 0,
    ATENDIMENTO: 0,
    NOVOS_COLABORADORES: 0,
  };
  const eixosWithRealizado = new Set<CapacitacaoEixo>();
  const audiencesWithRealizado = new Set<CapacitacaoAudience>();
  let withEvidence = 0;
  let nextScheduled: CapacitacaoStats["nextScheduled"] = null;
  const now = Date.now();

  for (const r of rows) {
    if (isValidStatus(r.status)) byStatus[r.status]++;
    if (isValidEixo(r.eixo)) byEixo[r.eixo]++;
    if (isValidAudience(r.audience)) byAudience[r.audience]++;
    if (r.evidenceUrl) withEvidence++;
    if (r.status === "REALIZADO") {
      if (isValidEixo(r.eixo)) eixosWithRealizado.add(r.eixo);
      if (isValidAudience(r.audience)) audiencesWithRealizado.add(r.audience);
    }
    if (
      r.status === "PLANEJADO" &&
      r.scheduledAt &&
      r.scheduledAt.getTime() >= now
    ) {
      const ts = r.scheduledAt.getTime();
      if (
        !nextScheduled ||
        ts < new Date(nextScheduled.scheduledAt).getTime()
      ) {
        nextScheduled = {
          id: r.id,
          title: r.title,
          scheduledAt: r.scheduledAt.toISOString(),
        };
      }
    }
  }

  return {
    total: rows.length,
    byStatus,
    byEixo,
    byAudience,
    nextScheduled,
    eixosCovered: eixosWithRealizado.size,
    audiencesCovered: audiencesWithRealizado.size,
    withEvidence,
  };
}

// ============================================================
// Sanitizadores
// ============================================================

export function sanitizeText(v: unknown, maxLen = 5000): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, maxLen);
}

export function sanitizeRequiredText(v: unknown, maxLen = 5000): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, maxLen);
}

export function sanitizeDate(v: unknown): Date | null {
  if (typeof v !== "string" || !v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function sanitizeIntPositive(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.floor(v);
  if (typeof v === "string" && v.trim()) {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n) && n >= 0) return n;
  }
  return null;
}
