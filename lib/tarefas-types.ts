/**
 * Tipos e helpers compartilhados entre API e UI das Tarefas pessoais.
 *
 * Inspirado em `components/tarefas/types.ts` do RADAR PNTP, com adaptações:
 * - 3 status (A_FAZER / EM_ANDAMENTO / CONCLUIDA) em UPPER (padrão do PGP)
 * - Vínculo com `dataInventoryId` em vez de criterio/avaliacao do RADAR
 * - Sem KPIs semanais / metas / drag-and-drop / cron de email
 */

// ============================================================
// Tipos
// ============================================================

export type TaskStatus = "A_FAZER" | "EM_ANDAMENTO" | "CONCLUIDA";
export type TaskPriority = "BAIXA" | "MEDIA" | "ALTA";
export type MarkerColor =
  | "slate"
  | "indigo"
  | "amber"
  | "red"
  | "emerald"
  | "fuchsia";

export interface TaskDTO {
  id: string;
  userId: string;
  companyId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  /** JSON serializado: array de nomes de marcador. */
  markers: string | null;
  dataInventoryId: string | null;
  dataInventory?: {
    id: string;
    serviceName: string;
    setor: string | null;
  } | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarkerDTO {
  id: string;
  userId: string;
  companyId: string;
  name: string;
  color: MarkerColor;
  createdAt: string;
}

export interface TaskCounters {
  aFazer: number;
  emAndamento: number;
  concluidas: number;
  /** Tarefas com dueDate antes de hoje e status != CONCLUIDA. */
  atrasadas: number;
  /** Tarefas com dueDate == hoje e status != CONCLUIDA. */
  vencendoHoje: number;
}

// ============================================================
// Constantes / labels
// ============================================================

export const TASK_STATUS = {
  A_FAZER: "A_FAZER",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  CONCLUIDA: "CONCLUIDA",
} as const;

export const TASK_PRIORITY = {
  BAIXA: "BAIXA",
  MEDIA: "MEDIA",
  ALTA: "ALTA",
} as const;

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  A_FAZER: "A fazer",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

/** Classes utilitárias por prioridade (badges). */
export const TASK_PRIORITY_CLS: Record<TaskPriority, string> = {
  BAIXA:
    "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  MEDIA:
    "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  ALTA:
    "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
};

/** Cor da borda esquerda dos cards por status. */
export const TASK_STATUS_BORDER: Record<TaskStatus, string> = {
  A_FAZER: "border-l-blue-400 dark:border-l-blue-500",
  EM_ANDAMENTO: "border-l-amber-400 dark:border-l-amber-500",
  CONCLUIDA: "border-l-emerald-500 dark:border-l-emerald-500",
};

// ============================================================
// Marcadores: paleta de cores
// ============================================================

export const MARKER_COLORS: ReadonlyArray<{
  value: MarkerColor;
  label: string;
  chipCls: string;
  swatchCls: string;
}> = [
  {
    value: "slate",
    label: "Cinza",
    chipCls:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    swatchCls: "bg-slate-400",
  },
  {
    value: "indigo",
    label: "Azul",
    chipCls:
      "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    swatchCls: "bg-indigo-500",
  },
  {
    value: "amber",
    label: "Âmbar",
    chipCls:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    swatchCls: "bg-amber-500",
  },
  {
    value: "red",
    label: "Vermelho",
    chipCls:
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
    swatchCls: "bg-red-500",
  },
  {
    value: "emerald",
    label: "Verde",
    chipCls:
      "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    swatchCls: "bg-emerald-500",
  },
  {
    value: "fuchsia",
    label: "Rosa",
    chipCls:
      "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-800",
    swatchCls: "bg-fuchsia-500",
  },
];

export const MARKER_COLOR_VALUES = MARKER_COLORS.map((c) => c.value);

export const CHIP_CLS_BY_COLOR: Record<MarkerColor, string> =
  Object.fromEntries(
    MARKER_COLORS.map((c) => [c.value, c.chipCls])
  ) as Record<MarkerColor, string>;

// ============================================================
// Helpers
// ============================================================

/** Lê o JSON de marcadores tolerando lixo. */
export function parseMarkers(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? arr.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

/** Compara prazo com hoje. */
export function dueDateState(
  dueDate: string | null | undefined,
  status?: TaskStatus
): "none" | "future" | "today" | "overdue" {
  if (!dueDate) return "none";
  if (status === "CONCLUIDA") return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = due.getTime() - today.getTime();
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  return "future";
}

/** Texto humano do prazo: "hoje", "amanhã", "atrasada 2 dias", "23/05". */
export function dueDateLabel(dueDate: string | null | undefined): string {
  if (!dueDate) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const days = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  if (days === -1) return "atrasada 1 dia";
  if (days < 0) return `atrasada ${Math.abs(days)} dias`;
  if (days < 7) return `em ${days} dias`;
  return due.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

// ============================================================
// Validação
// ============================================================

export const VALID_STATUSES: ReadonlySet<string> = new Set(
  Object.values(TASK_STATUS)
);
export const VALID_PRIORITIES: ReadonlySet<string> = new Set(
  Object.values(TASK_PRIORITY)
);
export const VALID_MARKER_COLORS: ReadonlySet<string> = new Set(
  MARKER_COLOR_VALUES
);
