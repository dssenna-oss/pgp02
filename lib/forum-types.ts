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
  /** Reações agregadas (1 entrada por emoji com count + meReacted). */
  reactions?: ReactionCount[];
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

// ============================================================
// Reações (Etapa 25 — 2026-05-09)
// ============================================================

/**
 * Emojis permitidos pra reações em posts. Lista fixa pra evitar
 * conteúdo arbitrário no banco.
 */
export const FORUM_REACTION_EMOJIS = [
  "👍", // joinha — concordo / boa ideia
  "❤️", // coração — apoio / gostei muito
  "🎯", // alvo — esse é o ponto / certeiro
  "🤔", // pensativo — dúvida / preciso refletir
  "🎉", // festa — celebração / conquista
] as const;

export type ForumReactionEmoji = (typeof FORUM_REACTION_EMOJIS)[number];

export const VALID_REACTION_EMOJIS: ReadonlySet<string> = new Set(
  FORUM_REACTION_EMOJIS,
);

/**
 * DTO de uma reação agregada (total + se o user logado reagiu).
 * 1 reação por (post, user) — clicar em outro emoji substitui o
 * anterior; clicar no mesmo emoji que já reagiu remove.
 */
export interface ReactionCount {
  emoji: ForumReactionEmoji;
  count: number;
  /** True se o user logado é um dos que reagiram com esse emoji. */
  meReacted: boolean;
}

/**
 * Agrega array bruto de reações em counts por emoji + flag meReacted.
 * Usado nos endpoints GET /api/forum (list) e GET /api/forum/[id]
 * (detail) — ambos retornam ReactionCount[] no DTO.
 *
 * Garante que apenas emojis da lista permitida apareçam na saída
 * (defesa contra dados antigos ou injeção via SQL externa).
 */
export function aggregateReactions(
  rows: Array<{ emoji: string; userId: string }>,
  meId: string,
): ReactionCount[] {
  const map = new Map<string, { count: number; meReacted: boolean }>();
  for (const r of rows) {
    if (!VALID_REACTION_EMOJIS.has(r.emoji)) continue;
    const cur = map.get(r.emoji) ?? { count: 0, meReacted: false };
    cur.count += 1;
    if (r.userId === meId) cur.meReacted = true;
    map.set(r.emoji, cur);
  }
  // Mantém a ordem de FORUM_REACTION_EMOJIS (que é canonical)
  const out: ReactionCount[] = [];
  for (const e of FORUM_REACTION_EMOJIS) {
    const v = map.get(e);
    if (v && v.count > 0) {
      out.push({ emoji: e, count: v.count, meReacted: v.meReacted });
    }
  }
  return out;
}
