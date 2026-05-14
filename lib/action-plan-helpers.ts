/**
 * Helpers do Plano de Ação institucional (Checkpoint 11).
 *
 * Diferente das `Task` (que são pessoais e ficam no caderno individual
 * do usuário), o Plano de Ação é INSTITUCIONAL — ações oficiais que a
 * organização precisa executar pra adequação LGPD, com responsável
 * formal, prazo, prioridade e origem (manual ou auto-importada de
 * GAP/Risco/Bases).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";

// ============================================================
// Enums
// ============================================================

export const ACTION_ORIGIN = {
  MANUAL: "MANUAL",
  GAP: "GAP",
  RISCO: "RISCO",
  BASES: "BASES",
  OPERADOR: "OPERADOR",
  INCIDENTE: "INCIDENTE",
  LIA: "LIA",
  CYBER: "CYBER",
} as const;
export type ActionOrigin = (typeof ACTION_ORIGIN)[keyof typeof ACTION_ORIGIN];

export const ACTION_PRIORITY = {
  ALTA: "ALTA",
  MEDIA: "MEDIA",
  BAIXA: "BAIXA",
} as const;
export type ActionPriority =
  (typeof ACTION_PRIORITY)[keyof typeof ACTION_PRIORITY];

export const ACTION_STATUS = {
  A_FAZER: "A_FAZER",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  CONCLUIDA: "CONCLUIDA",
  CANCELADA: "CANCELADA",
} as const;
export type ActionStatus = (typeof ACTION_STATUS)[keyof typeof ACTION_STATUS];

export const VALID_ORIGINS = new Set(Object.values(ACTION_ORIGIN));
export const VALID_PRIORITIES = new Set(Object.values(ACTION_PRIORITY));
export const VALID_STATUSES = new Set(Object.values(ACTION_STATUS));

// ============================================================
// Labels (UI)
// ============================================================

export function originLabel(o: string | null | undefined): string {
  switch (o) {
    case "MANUAL":    return "Manual";
    case "GAP":       return "GAP Analysis";
    case "RISCO":     return "Análise de Riscos";
    case "BASES":     return "Bases Legais";
    case "OPERADOR":  return "Gestão de Terceiros";
    case "INCIDENTE": return "Incidente";
    case "LIA":       return "Legítimo Interesse";
    case "CYBER":     return "Maturidade Cibernética";
    default:          return "—";
  }
}

export function priorityLabel(p: string | null | undefined): string {
  switch (p) {
    case "ALTA":  return "Alta";
    case "MEDIA": return "Média";
    case "BAIXA": return "Baixa";
    default:      return "—";
  }
}

export function statusLabel(s: string | null | undefined): string {
  switch (s) {
    case "A_FAZER":      return "A fazer";
    case "EM_ANDAMENTO": return "Em andamento";
    case "CONCLUIDA":    return "Concluída";
    case "CANCELADA":    return "Cancelada";
    default:             return "—";
  }
}

// ============================================================
// Classes Tailwind (UI)
// ============================================================

export function originBadgeClass(o: string | null | undefined): string {
  switch (o) {
    case "MANUAL":
      return "bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    case "GAP":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800";
    case "RISCO":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800";
    case "BASES":
      return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800";
    case "OPERADOR":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800";
    case "INCIDENTE":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800";
    case "LIA":
      return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800";
    case "CYBER":
      return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800";
    default:
      return "bg-gray-50 text-gray-700 border-gray-300";
  }
}

export function priorityBadgeClass(p: string | null | undefined): string {
  switch (p) {
    case "ALTA":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
    case "MEDIA":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "BAIXA":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

export function statusBadgeClass(s: string | null | undefined): string {
  switch (s) {
    case "A_FAZER":
      return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    case "EM_ANDAMENTO":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "CONCLUIDA":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    case "CANCELADA":
      return "bg-gray-100 text-gray-500 border-gray-300 line-through dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

// ============================================================
// DTO
// ============================================================

export interface ActionPlanDTO {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  origin: ActionOrigin;
  refGapCode: string | null;
  refRiskId: string | null;
  refInventoryId: string | null;
  refOperatorId: string | null;
  refIncidentId: string | null;
  refCyberCode: string | null;
  /** Label legível pra UI (ex: "GAP #002", "Risco BR em Sistema RH"). */
  refLabel: string | null;
  /** URL pra clicar e abrir o item de origem. Pode ser null. */
  refHref: string | null;
  assigneeId: string | null;
  assignee: { id: string; name: string | null; email: string } | null;
  dueDate: string | null;
  /** Dias restantes até o prazo (negativo = atrasada). null se sem prazo. */
  daysUntilDue: number | null;
  priority: ActionPriority;
  status: ActionStatus;
  completedAt: string | null;
  createdById: string;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ActionPlanRow {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  origin: string;
  refGapCode: string | null;
  refRiskId: string | null;
  refInventoryId: string | null;
  refOperatorId: string | null;
  refIncidentId: string | null;
  refCyberCode: string | null;
  assigneeId: string | null;
  assignee: { id: string; name: string | null; email: string } | null;
  dueDate: Date | null;
  priority: string;
  status: string;
  completedAt: Date | null;
  createdById: string;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export function actionToDTO(
  a: ActionPlanRow,
  refResolver?: {
    gapDomainByCode?: Record<string, string>;
    inventoryById?: Record<string, string>;
    operatorById?: Record<string, string>;
    incidentById?: Record<string, string>;
  },
): ActionPlanDTO {
  const refLabel = computeRefLabel(a, refResolver);
  const refHref = computeRefHref(a);
  const daysUntilDue =
    a.dueDate == null
      ? null
      : Math.floor(
          (a.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    notes: a.notes,
    origin: a.origin as ActionOrigin,
    refGapCode: a.refGapCode,
    refRiskId: a.refRiskId,
    refInventoryId: a.refInventoryId,
    refOperatorId: a.refOperatorId,
    refIncidentId: a.refIncidentId,
    refCyberCode: a.refCyberCode,
    refLabel,
    refHref,
    assigneeId: a.assigneeId,
    assignee: a.assignee,
    dueDate: a.dueDate ? a.dueDate.toISOString() : null,
    daysUntilDue,
    priority: a.priority as ActionPriority,
    status: a.status as ActionStatus,
    completedAt: a.completedAt ? a.completedAt.toISOString() : null,
    createdById: a.createdById,
    createdBy: a.createdBy,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function computeRefLabel(
  a: ActionPlanRow,
  resolver?: {
    gapDomainByCode?: Record<string, string>;
    inventoryById?: Record<string, string>;
    operatorById?: Record<string, string>;
    incidentById?: Record<string, string>;
  },
): string | null {
  if (a.origin === "GAP" && a.refGapCode) {
    const dom = resolver?.gapDomainByCode?.[a.refGapCode];
    return dom
      ? `GAP #${a.refGapCode} — ${dom}`
      : `GAP #${a.refGapCode}`;
  }
  if (a.origin === "RISCO" && a.refRiskId) {
    return `Risco identificado`;
  }
  if (a.origin === "BASES" && a.refInventoryId) {
    const name = resolver?.inventoryById?.[a.refInventoryId];
    return name ? `Bases legais — ${name}` : `Bases legais (processo)`;
  }
  if (a.origin === "OPERADOR" && a.refOperatorId) {
    const name = resolver?.operatorById?.[a.refOperatorId];
    return name ? `Operador — ${name}` : `Operador / Terceiro`;
  }
  if (a.origin === "INCIDENTE" && a.refIncidentId) {
    const name = resolver?.incidentById?.[a.refIncidentId];
    return name ? `Incidente — ${name}` : `Incidente`;
  }
  if (a.origin === "LIA" && a.refInventoryId) {
    const name = resolver?.inventoryById?.[a.refInventoryId];
    return name ? `LIA — ${name}` : `LIA (processo)`;
  }
  if (a.origin === "CYBER" && a.refCyberCode) {
    return `Cyber NIST — ${a.refCyberCode}`;
  }
  return null;
}

function computeRefHref(a: ActionPlanRow): string | null {
  if (a.origin === "GAP" && a.refGapCode) {
    return `/dashboard/gap-analysis`;
  }
  if (a.origin === "RISCO" && a.refRiskId && a.refInventoryId) {
    return `/dashboard/inventario/${a.refInventoryId}/analise-riscos`;
  }
  if (a.origin === "BASES" && a.refInventoryId) {
    return `/dashboard/inventario/${a.refInventoryId}/bases-legais`;
  }
  if (a.origin === "OPERADOR" && a.refOperatorId) {
    return `/dashboard/terceiros/${a.refOperatorId}`;
  }
  if (a.origin === "INCIDENTE" && a.refIncidentId) {
    return `/dashboard/incidentes/${a.refIncidentId}`;
  }
  if (a.origin === "LIA") {
    return `/dashboard/lia`;
  }
  if (a.origin === "CYBER") {
    return `/dashboard/maturidade-cyber`;
  }
  return null;
}

// ============================================================
// Auth check (DPO-only)
// ============================================================

export async function loadActionPlanAuth(
  requireDPO = true,
): Promise<
  | { error: NextResponse }
  | {
      user: {
        id: string;
        companyId: string;
        role: string;
        isDPO: boolean;
      };
    }
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
        { status: 404 },
      ),
    };
  }
  const dpo = isDPO(u.role);
  if (requireDPO && !dpo) {
    return {
      error: NextResponse.json(
        { error: "Apenas DPO pode gerenciar o Plano de Ação" },
        { status: 403 },
      ),
    };
  }
  return {
    user: { id: u.id, companyId: u.companyId, role: u.role, isDPO: dpo },
  };
}

// ============================================================
// Stats agregadas
// ============================================================

export interface ActionPlanStats {
  total: number;
  byStatus: Record<ActionStatus, number>;
  byPriority: Record<ActionPriority, number>;
  byOrigin: Record<ActionOrigin, number>;
  /** Quantas estão atrasadas (dueDate < hoje, status != CONCLUIDA/CANCELADA). */
  overdue: number;
  /** Quantas vencem nos próximos 7 dias (ainda não vencidas). */
  dueSoon: number;
}

export function computeActionStats(
  actions: ReadonlyArray<{ status: string; priority: string; origin: string; dueDate: Date | null }>,
): ActionPlanStats {
  const stats: ActionPlanStats = {
    total: actions.length,
    byStatus: { A_FAZER: 0, EM_ANDAMENTO: 0, CONCLUIDA: 0, CANCELADA: 0 },
    byPriority: { ALTA: 0, MEDIA: 0, BAIXA: 0 },
    byOrigin: { MANUAL: 0, GAP: 0, RISCO: 0, BASES: 0, OPERADOR: 0, INCIDENTE: 0, LIA: 0, CYBER: 0 },
    overdue: 0,
    dueSoon: 0,
  };
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  for (const a of actions) {
    if (a.status in stats.byStatus) {
      (stats.byStatus as any)[a.status] += 1;
    }
    if (a.priority in stats.byPriority) {
      (stats.byPriority as any)[a.priority] += 1;
    }
    if (a.origin in stats.byOrigin) {
      (stats.byOrigin as any)[a.origin] += 1;
    }
    if (
      a.dueDate &&
      a.status !== "CONCLUIDA" &&
      a.status !== "CANCELADA"
    ) {
      const t = a.dueDate.getTime();
      if (t < now) stats.overdue += 1;
      else if (t - now <= sevenDays) stats.dueSoon += 1;
    }
  }
  return stats;
}
