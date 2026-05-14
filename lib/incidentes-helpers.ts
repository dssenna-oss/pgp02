/**
 * Helpers do módulo de Incidentes (Checkpoint 16).
 *
 * Base legal: Art. 48 LGPD + Resolução CD/ANPD nº 15/2024.
 *
 * Workflow:
 *   DETECTADO → EM_ANALISE → EM_CONTENCAO →
 *     COMUNICADO_ANPD → COMUNICADO_TITULARES → ENCERRADO
 *   (ou FALSO_POSITIVO em qualquer momento)
 *
 * Severidade:
 *   - ALTO/MEDIO disparam obrigatoriedade de comunicação ANPD (Art. 48 §3º)
 *   - BAIXO é discricionário
 *
 * Prazo regressivo: 72h desde `detectedAt` (clock visual + badge sidebar).
 *
 * Visibilidade:
 *   - DPO: vê e edita TUDO; pode encerrar
 *   - Contribuidor: cria + lista próprios; edita o que criou enquanto não
 *     estiver COMUNICADO_ANPD; não pode encerrar
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO, isContribuidor } from "@/lib/auth-helpers";

// ============================================================
// Enums
// ============================================================

export const INCIDENT_STATUS = {
  DETECTADO: "DETECTADO",
  EM_ANALISE: "EM_ANALISE",
  EM_CONTENCAO: "EM_CONTENCAO",
  COMUNICADO_ANPD: "COMUNICADO_ANPD",
  COMUNICADO_TITULARES: "COMUNICADO_TITULARES",
  ENCERRADO: "ENCERRADO",
  FALSO_POSITIVO: "FALSO_POSITIVO",
} as const;
export type IncidentStatus = (typeof INCIDENT_STATUS)[keyof typeof INCIDENT_STATUS];
export const VALID_INCIDENT_STATUSES = new Set(Object.values(INCIDENT_STATUS));

export const INCIDENT_SEVERITY = {
  ALTO: "ALTO",
  MEDIO: "MEDIO",
  BAIXO: "BAIXO",
} as const;
export type IncidentSeverity =
  (typeof INCIDENT_SEVERITY)[keyof typeof INCIDENT_SEVERITY];
export const VALID_INCIDENT_SEVERITIES = new Set(Object.values(INCIDENT_SEVERITY));

export const INCIDENT_TYPE = {
  VAZAMENTO: "VAZAMENTO",
  ACESSO_NAO_AUTORIZADO: "ACESSO_NAO_AUTORIZADO",
  PERDA: "PERDA",
  ALTERACAO_INDEVIDA: "ALTERACAO_INDEVIDA",
  INDISPONIBILIDADE: "INDISPONIBILIDADE",
  OUTRO: "OUTRO",
} as const;
export type IncidentType = (typeof INCIDENT_TYPE)[keyof typeof INCIDENT_TYPE];
export const VALID_INCIDENT_TYPES = new Set(Object.values(INCIDENT_TYPE));

export const COMM_TARGET = {
  ANPD: "ANPD",
  TITULARES: "TITULARES",
} as const;
export type CommTarget = (typeof COMM_TARGET)[keyof typeof COMM_TARGET];

// ============================================================
// Labels (UI)
// ============================================================

export function statusLabel(s: string | null | undefined): string {
  switch (s) {
    case "DETECTADO":            return "Detectado";
    case "EM_ANALISE":           return "Em análise";
    case "EM_CONTENCAO":         return "Em contenção";
    case "COMUNICADO_ANPD":      return "Comunicado à ANPD";
    case "COMUNICADO_TITULARES": return "Comunicado aos titulares";
    case "ENCERRADO":            return "Encerrado";
    case "FALSO_POSITIVO":       return "Falso positivo";
    default:                     return "—";
  }
}

export function severityLabel(s: string | null | undefined): string {
  switch (s) {
    case "ALTO":  return "Alto";
    case "MEDIO": return "Médio";
    case "BAIXO": return "Baixo";
    default:      return "—";
  }
}

export function incidentTypeLabel(t: string | null | undefined): string {
  switch (t) {
    case "VAZAMENTO":             return "Vazamento de dados";
    case "ACESSO_NAO_AUTORIZADO": return "Acesso não autorizado";
    case "PERDA":                 return "Perda de dados";
    case "ALTERACAO_INDEVIDA":    return "Alteração indevida";
    case "INDISPONIBILIDADE":     return "Indisponibilidade do sistema";
    case "OUTRO":                 return "Outro";
    default:                      return "—";
  }
}

export function commTargetLabel(t: string | null | undefined): string {
  switch (t) {
    case "ANPD":      return "ANPD";
    case "TITULARES": return "Titulares";
    default:          return "—";
  }
}

// ============================================================
// Classes Tailwind (UI)
// ============================================================

export function statusBadgeClass(s: string | null | undefined): string {
  switch (s) {
    case "DETECTADO":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "EM_ANALISE":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "EM_CONTENCAO":
      return "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800";
    case "COMUNICADO_ANPD":
      return "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800";
    case "COMUNICADO_TITULARES":
      return "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800";
    case "ENCERRADO":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    case "FALSO_POSITIVO":
      return "bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

export function severityBadgeClass(s: string | null | undefined): string {
  switch (s) {
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
// Workflow — transições válidas
// ============================================================

/**
 * Transições permitidas entre status. Ordem importa (sequencial), mas
 * FALSO_POSITIVO é alcançável de qualquer estado anterior ao
 * encerramento.
 *
 *   DETECTADO          → EM_ANALISE | FALSO_POSITIVO
 *   EM_ANALISE         → EM_CONTENCAO | FALSO_POSITIVO | DETECTADO
 *   EM_CONTENCAO       → COMUNICADO_ANPD | ENCERRADO | FALSO_POSITIVO
 *   COMUNICADO_ANPD    → COMUNICADO_TITULARES | ENCERRADO
 *   COMUNICADO_TITULARES → ENCERRADO
 *   ENCERRADO          → (terminal — só DPO reabre via PATCH direto)
 *   FALSO_POSITIVO     → DETECTADO (caso reabra investigação)
 */
const TRANSITIONS: Record<IncidentStatus, ReadonlyArray<IncidentStatus>> = {
  DETECTADO: ["EM_ANALISE", "FALSO_POSITIVO"],
  EM_ANALISE: ["EM_CONTENCAO", "FALSO_POSITIVO", "DETECTADO"],
  EM_CONTENCAO: ["COMUNICADO_ANPD", "ENCERRADO", "FALSO_POSITIVO"],
  COMUNICADO_ANPD: ["COMUNICADO_TITULARES", "ENCERRADO"],
  COMUNICADO_TITULARES: ["ENCERRADO"],
  ENCERRADO: [],
  FALSO_POSITIVO: ["DETECTADO"],
};

export function canTransitionTo(
  from: string,
  to: string
): boolean {
  if (from === to) return true; // no-op é sempre ok
  const list = TRANSITIONS[from as IncidentStatus];
  if (!list) return false;
  return list.includes(to as IncidentStatus);
}

// ============================================================
// Severidade × obrigatoriedade ANPD
// ============================================================

/**
 * Severidade ALTO ou MEDIO obriga comunicação à ANPD (Art. 48 §3º LGPD
 * + Res. CD/ANPD nº 15/2024). BAIXO é discricionário.
 */
export function requiresAnpdCommunication(severity: string): boolean {
  return severity === "ALTO" || severity === "MEDIO";
}

// ============================================================
// Prazo regressivo — 72h
// ============================================================

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface DeadlineInfo {
  /** Total de horas restantes desde o cálculo (negativo = vencido) */
  hoursRemaining: number;
  /** "OK" (>24h) | "WARN" (≤24h e >0) | "CRITICAL" (<0, vencido) */
  level: "OK" | "WARN" | "CRITICAL";
  /** Texto curto pra UI ("12h restantes", "vencido há 5h") */
  label: string;
  /** Indica se já passou do prazo */
  expired: boolean;
}

/**
 * Calcula o prazo regressivo de 72h pra comunicação ANPD.
 * Se já notificou (anpdNotifiedAt != null), devolve null.
 */
export function computeAnpdDeadline(
  detectedAt: Date | string,
  anpdNotifiedAt: Date | string | null
): DeadlineInfo | null {
  if (anpdNotifiedAt) return null;

  const det =
    detectedAt instanceof Date ? detectedAt : new Date(detectedAt);
  const deadline = det.getTime() + SEVENTY_TWO_HOURS_MS;
  const now = Date.now();
  const msRemaining = deadline - now;
  const hoursRemaining = msRemaining / (60 * 60 * 1000);

  let level: "OK" | "WARN" | "CRITICAL";
  let label: string;
  if (msRemaining < 0) {
    level = "CRITICAL";
    const overdue = Math.abs(hoursRemaining);
    label =
      overdue >= 24
        ? `vencido há ${Math.floor(overdue / 24)}d`
        : `vencido há ${Math.floor(overdue)}h`;
  } else if (msRemaining <= TWENTY_FOUR_HOURS_MS) {
    level = "WARN";
    label =
      hoursRemaining < 1
        ? `${Math.max(0, Math.floor(msRemaining / (60 * 1000)))}min restantes`
        : `${Math.floor(hoursRemaining)}h restantes`;
  } else {
    level = "OK";
    const days = Math.floor(hoursRemaining / 24);
    const hrs = Math.floor(hoursRemaining % 24);
    label = days > 0 ? `${days}d ${hrs}h restantes` : `${Math.floor(hoursRemaining)}h restantes`;
  }

  return {
    hoursRemaining,
    level,
    label,
    expired: msRemaining < 0,
  };
}

// ============================================================
// DTO
// ============================================================

export interface IncidentCommunicationDTO {
  id: string;
  target: CommTarget;
  content: string;
  channel: string | null;
  createdById: string | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
}

export interface IncidentDTO {
  id: string;
  companyId: string;

  // Identificação
  title: string;
  description: string;
  incidentType: IncidentType;

  // Workflow + severidade
  status: IncidentStatus;
  severity: IncidentSeverity;

  // Datas
  occurredAt: string | null;
  detectedAt: string;
  anpdNotifiedAt: string | null;
  subjectsNotifiedAt: string | null;
  closedAt: string | null;

  // Dados afetados
  affectedDataTypes: string | null;
  hasSensitiveData: boolean;
  affectedSubjectsCategories: string | null;
  affectedSubjectsCount: number | null;

  // Técnico
  rootCause: string | null;
  attackVector: string | null;
  affectedSystems: string | null;
  affectedOperators: string | null;

  // Risco e medidas
  riskAssessment: string | null;
  securityMeasuresInPlace: string | null;
  containmentMeasures: string | null;
  correctiveMeasures: string | null;
  delayJustification: string | null;

  // Encerramento
  closureNotes: string | null;

  // Auditoria
  createdById: string | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  closedById: string | null;
  closedBy: { id: string; name: string | null; email: string } | null;

  // Comunicações
  communications: ReadonlyArray<IncidentCommunicationDTO>;

  // Vínculos M:N (Checkpoint 16 / F2-F3)
  /** Processos do Inventário formalmente vinculados a este incidente. */
  linkedInventories: ReadonlyArray<{
    id: string;
    serviceName: string;
    setor: string | null;
    status: string;
  }>;
  /** Operadores (terceiros) formalmente vinculados a este incidente. */
  linkedOperators: ReadonlyArray<{
    id: string;
    name: string;
    relationType: string;
    contractRiskClass: string;
  }>;

  // Derivados
  /** Prazo regressivo de 72h desde detectedAt; null se já notificou. */
  anpdDeadline: DeadlineInfo | null;
  /** Severidade ALTO/MEDIO + ainda sem anpdNotifiedAt = obrigatório comunicar. */
  anpdCommunicationRequired: boolean;

  createdAt: string;
  updatedAt: string;
}

interface IncidentRow {
  id: string;
  companyId: string;
  title: string;
  description: string;
  incidentType: string;
  status: string;
  severity: string;
  occurredAt: Date | null;
  detectedAt: Date;
  anpdNotifiedAt: Date | null;
  subjectsNotifiedAt: Date | null;
  closedAt: Date | null;
  affectedDataTypes: string | null;
  hasSensitiveData: boolean;
  affectedSubjectsCategories: string | null;
  affectedSubjectsCount: number | null;
  rootCause: string | null;
  attackVector: string | null;
  affectedSystems: string | null;
  affectedOperators: string | null;
  riskAssessment: string | null;
  securityMeasuresInPlace: string | null;
  containmentMeasures: string | null;
  correctiveMeasures: string | null;
  delayJustification: string | null;
  closureNotes: string | null;
  createdById: string | null;
  createdBy?: { id: string; name: string | null; email: string } | null;
  closedById: string | null;
  closedBy?: { id: string; name: string | null; email: string } | null;
  communications?: ReadonlyArray<{
    id: string;
    target: string;
    content: string;
    channel: string | null;
    createdById: string | null;
    createdBy?: { id: string; name: string | null; email: string } | null;
    createdAt: Date;
  }>;
  /** Vínculos M:N — Inventário (F2) e Operadores (F3). */
  dataInventories?: ReadonlyArray<{
    dataInventoryId: string;
    dataInventory?: { id: string; serviceName: string; setor: string | null; status: string };
  }>;
  affectedOperatorsList?: ReadonlyArray<{
    operatorId: string;
    operator?: { id: string; name: string; relationType: string; contractRiskClass: string };
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export function incidentToDTO(i: IncidentRow): IncidentDTO {
  const deadline = computeAnpdDeadline(i.detectedAt, i.anpdNotifiedAt);
  const anpdRequired =
    requiresAnpdCommunication(i.severity) && i.anpdNotifiedAt == null;

  return {
    id: i.id,
    companyId: i.companyId,
    title: i.title,
    description: i.description,
    incidentType: i.incidentType as IncidentType,
    status: i.status as IncidentStatus,
    severity: i.severity as IncidentSeverity,
    occurredAt: i.occurredAt ? i.occurredAt.toISOString() : null,
    detectedAt: i.detectedAt.toISOString(),
    anpdNotifiedAt: i.anpdNotifiedAt ? i.anpdNotifiedAt.toISOString() : null,
    subjectsNotifiedAt: i.subjectsNotifiedAt
      ? i.subjectsNotifiedAt.toISOString()
      : null,
    closedAt: i.closedAt ? i.closedAt.toISOString() : null,
    affectedDataTypes: i.affectedDataTypes,
    hasSensitiveData: i.hasSensitiveData,
    affectedSubjectsCategories: i.affectedSubjectsCategories,
    affectedSubjectsCount: i.affectedSubjectsCount,
    rootCause: i.rootCause,
    attackVector: i.attackVector,
    affectedSystems: i.affectedSystems,
    affectedOperators: i.affectedOperators,
    riskAssessment: i.riskAssessment,
    securityMeasuresInPlace: i.securityMeasuresInPlace,
    containmentMeasures: i.containmentMeasures,
    correctiveMeasures: i.correctiveMeasures,
    delayJustification: i.delayJustification,
    closureNotes: i.closureNotes,
    createdById: i.createdById,
    createdBy: i.createdBy ?? null,
    closedById: i.closedById,
    closedBy: i.closedBy ?? null,
    communications:
      i.communications?.map((c) => ({
        id: c.id,
        target: c.target as CommTarget,
        content: c.content,
        channel: c.channel,
        createdById: c.createdById,
        createdBy: c.createdBy ?? null,
        createdAt: c.createdAt.toISOString(),
      })) ?? [],
    linkedInventories:
      i.dataInventories
        ?.filter((j) => j.dataInventory)
        .map((j) => ({
          id: j.dataInventory!.id,
          serviceName: j.dataInventory!.serviceName,
          setor: j.dataInventory!.setor,
          status: j.dataInventory!.status,
        })) ?? [],
    linkedOperators:
      i.affectedOperatorsList
        ?.filter((j) => j.operator)
        .map((j) => ({
          id: j.operator!.id,
          name: j.operator!.name,
          relationType: j.operator!.relationType,
          contractRiskClass: j.operator!.contractRiskClass,
        })) ?? [],
    anpdDeadline: deadline,
    anpdCommunicationRequired: anpdRequired,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

// ============================================================
// Auth check (DPO + Contribuidor com escopo)
// ============================================================

export type IncidentAuthUser = {
  id: string;
  companyId: string;
  role: string;
  isDPO: boolean;
};

export async function loadIncidentAuth(): Promise<
  { error: NextResponse } | { user: IncidentAuthUser }
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
        { error: "Sem permissão pra acessar Incidentes" },
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

/**
 * Pode editar este incidente?
 *   - DPO: sempre
 *   - Contribuidor: só o que ele criou, e enquanto não chegou em
 *     COMUNICADO_ANPD (a partir daí é só DPO)
 */
export function canEditIncident(
  user: IncidentAuthUser,
  incident: { createdById: string | null; status: string }
): boolean {
  if (user.isDPO) return true;
  if (incident.createdById !== user.id) return false;
  return ![
    "COMUNICADO_ANPD",
    "COMUNICADO_TITULARES",
    "ENCERRADO",
  ].includes(incident.status);
}

/** Pode excluir? Apenas DPO. Contribuidor pode no máximo marcar FALSO_POSITIVO. */
export function canDeleteIncident(user: IncidentAuthUser): boolean {
  return user.isDPO;
}

/** Pode encerrar? Apenas DPO. */
export function canCloseIncident(user: IncidentAuthUser): boolean {
  return user.isDPO;
}

/** Pode gerar comunicação à ANPD? Apenas DPO. */
export function canCommunicateAnpd(user: IncidentAuthUser): boolean {
  return user.isDPO;
}

// ============================================================
// Filtros de listagem
// ============================================================

/**
 * DPO vê todos os incidentes da company. Contribuidor vê apenas os que
 * ele criou.
 */
export function incidentAccessFilter(user: IncidentAuthUser): {
  companyId: string;
  createdById?: string;
} {
  if (user.isDPO) {
    return { companyId: user.companyId };
  }
  return { companyId: user.companyId, createdById: user.id };
}

// ============================================================
// Stats agregadas
// ============================================================

export interface IncidentStats {
  total: number;
  byStatus: Record<IncidentStatus, number>;
  bySeverity: Record<IncidentSeverity, number>;
  /** Em aberto: tudo exceto ENCERRADO e FALSO_POSITIVO */
  open: number;
  /** Encerrados (sucesso) */
  closed: number;
  /** Falsos positivos */
  falsePositives: number;
  /** Comunicação ANPD pendente (severidade ALTO/MEDIO + sem anpdNotifiedAt) */
  pendingAnpd: number;
  /** Prazo regressivo crítico (<24h ou vencido, sem comunicação) */
  criticalDeadline: number;
}

export function computeIncidentStats(
  rows: ReadonlyArray<{
    status: string;
    severity: string;
    detectedAt: Date;
    anpdNotifiedAt: Date | null;
  }>
): IncidentStats {
  const stats: IncidentStats = {
    total: rows.length,
    byStatus: {
      DETECTADO: 0,
      EM_ANALISE: 0,
      EM_CONTENCAO: 0,
      COMUNICADO_ANPD: 0,
      COMUNICADO_TITULARES: 0,
      ENCERRADO: 0,
      FALSO_POSITIVO: 0,
    },
    bySeverity: { ALTO: 0, MEDIO: 0, BAIXO: 0 },
    open: 0,
    closed: 0,
    falsePositives: 0,
    pendingAnpd: 0,
    criticalDeadline: 0,
  };
  for (const r of rows) {
    if (r.status in stats.byStatus) {
      (stats.byStatus as any)[r.status] += 1;
    }
    if (r.severity in stats.bySeverity) {
      (stats.bySeverity as any)[r.severity] += 1;
    }
    if (r.status === "ENCERRADO") stats.closed += 1;
    else if (r.status === "FALSO_POSITIVO") stats.falsePositives += 1;
    else stats.open += 1;

    if (
      requiresAnpdCommunication(r.severity) &&
      r.anpdNotifiedAt == null &&
      r.status !== "FALSO_POSITIVO"
    ) {
      stats.pendingAnpd += 1;
      const deadline = computeAnpdDeadline(r.detectedAt, null);
      if (deadline && (deadline.level === "WARN" || deadline.level === "CRITICAL")) {
        stats.criticalDeadline += 1;
      }
    }
  }
  return stats;
}

// ============================================================
// Sanitização de body
// ============================================================

const TRIM_MAX = 5000;

export function sanitizeText(
  v: unknown,
  max = TRIM_MAX
): string | null {
  if (v == null) return null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

export function sanitizeRequiredText(
  v: unknown,
  max = TRIM_MAX
): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

export function sanitizeDate(v: unknown): Date | null {
  if (!v) return null;
  if (typeof v !== "string" && !(v instanceof Date)) return null;
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function sanitizeInt(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.floor(n));
}

export function sanitizeBool(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

// ============================================================
// Inclusão Prisma padrão
// ============================================================

export const INCIDENT_FULL_INCLUDE = {
  createdBy: { select: { id: true, name: true, email: true } },
  closedBy: { select: { id: true, name: true, email: true } },
  communications: {
    orderBy: { createdAt: "desc" as const },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  },
  // Vínculos M:N (Checkpoint 16 / F2-F3)
  dataInventories: {
    include: {
      dataInventory: {
        select: { id: true, serviceName: true, setor: true, status: true },
      },
    },
  },
  affectedOperatorsList: {
    include: {
      operator: {
        select: {
          id: true,
          name: true,
          relationType: true,
          contractRiskClass: true,
        },
      },
    },
  },
} as const;
