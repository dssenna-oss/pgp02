/**
 * Tipos e helpers compartilhados pelo Fórum + Mensagens diretas.
 *
 * Inspirado no `app/alertas/forum-content.tsx` do RADAR PNTP, com
 * adaptações pro PGP:
 * - 2 tipos em vez de 3 (Discussão + Comunicado, sem Lembrete)
 * - 5 categorias adaptadas ao vocabulário LGPD
 * - Sem preferências de e-mail (notificação é só visual no app)
 */

// ============================================================
// Tipos
// ============================================================

export type ForumPostType = "DISCUSSION" | "ANNOUNCEMENT";

export type ForumCategory =
  | "GERAL"
  | "INVENTARIO"
  | "RISCOS"
  | "BASES_LEGAIS"
  | "DUVIDA";

export interface ForumAuthor {
  id: string;
  name: string | null;
  email: string;
  role?: string | null;
}

export interface ForumReplyDTO {
  id: string;
  postId: string;
  authorId: string;
  author: ForumAuthor;
  content: string;
  createdAt: string;
}

export interface ForumPostDTO {
  id: string;
  companyId: string;
  authorId: string;
  author: ForumAuthor;
  recipientId: string | null;
  recipient: ForumAuthor | null;
  type: ForumPostType;
  category: ForumCategory | null;
  title: string;
  content: string;
  pinned: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  /** Calculado pelo backend: 1 = lido pelo user atual. */
  read: boolean;
  /** Quantidade de respostas (não inclui a array em si nas listagens). */
  replyCount: number;
  /** Apenas em GET por ID — array completa. */
  replies?: ForumReplyDTO[];
}

export interface ForumStats {
  /** Posts públicos não-lidos pelo user. */
  unreadPublic: number;
  /** DMs recebidas e não-lidas. */
  unreadDMs: number;
  /** Total combinado pra badge da sidebar. */
  totalUnread: number;
}

// ============================================================
// Constantes / labels
// ============================================================

export const FORUM_POST_TYPE = {
  DISCUSSION: "DISCUSSION",
  ANNOUNCEMENT: "ANNOUNCEMENT",
} as const;

export const FORUM_CATEGORY = {
  GERAL: "GERAL",
  INVENTARIO: "INVENTARIO",
  RISCOS: "RISCOS",
  BASES_LEGAIS: "BASES_LEGAIS",
  DUVIDA: "DUVIDA",
} as const;

export const FORUM_TYPE_LABEL: Record<ForumPostType, string> = {
  DISCUSSION: "Discussão",
  ANNOUNCEMENT: "Comunicado",
};

export const FORUM_CATEGORY_LABEL: Record<ForumCategory, string> = {
  GERAL: "Geral",
  INVENTARIO: "Inventário",
  RISCOS: "Riscos",
  BASES_LEGAIS: "Bases Legais",
  DUVIDA: "Dúvida",
};

/** Cores das categorias (badges). */
export const FORUM_CATEGORY_CLS: Record<ForumCategory, string> = {
  GERAL:
    "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  INVENTARIO:
    "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  RISCOS:
    "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
  BASES_LEGAIS:
    "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  DUVIDA:
    "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
};

// ============================================================
// Helpers
// ============================================================

/** "agora", "5min", "2h", "3d", "23/05". */
export function timeAgoShort(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

// ============================================================
// Validação
// ============================================================

export const VALID_FORUM_TYPES: ReadonlySet<string> = new Set(
  Object.values(FORUM_POST_TYPE)
);
export const VALID_FORUM_CATEGORIES: ReadonlySet<string> = new Set(
  Object.values(FORUM_CATEGORY)
);
