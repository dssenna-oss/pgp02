/**
 * Helpers compartilhados das rotas de GAP Analysis (Checkpoint 9).
 *
 * Centraliza:
 *   - Auth check (só DPO acessa o GAP)
 *   - Enums de Mapeamento e Aderência (com labels e cores pra UI)
 *   - Cálculo de stats agregados (% por status / aderência / domínio)
 *   - DTOs e tipos serializáveis
 *
 * O catálogo dos 119 controles fica em `lib/gap-catalog.ts` (gerado).
 * Esta file aqui é a "ponte" entre o catálogo e os dados do banco.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { GAP_CONTROLS, GAP_DOMAINS, GAP_TOTAL } from "@/lib/gap-catalog";

// ============================================================
// Enums
// ============================================================

export const GAP_MAPEAMENTO = {
  NAO_INICIADO: "NAO_INICIADO",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  FINALIZADO: "FINALIZADO",
} as const;

export type GapMapeamento =
  (typeof GAP_MAPEAMENTO)[keyof typeof GAP_MAPEAMENTO];

export const GAP_ADERENCIA = {
  ADERENTE: "ADERENTE",
  PARCIAL: "PARCIAL",
  NAO_ADERENTE: "NAO_ADERENTE",
  NA: "NA",
} as const;

export type GapAderencia =
  (typeof GAP_ADERENCIA)[keyof typeof GAP_ADERENCIA];

export const VALID_MAPEAMENTO: ReadonlySet<string> = new Set(
  Object.values(GAP_MAPEAMENTO),
);
export const VALID_ADERENCIA: ReadonlySet<string> = new Set(
  Object.values(GAP_ADERENCIA),
);

export function gapMapeamentoLabel(v: string | null | undefined): string {
  switch (v) {
    case GAP_MAPEAMENTO.NAO_INICIADO:
      return "Não iniciado";
    case GAP_MAPEAMENTO.EM_ANDAMENTO:
      return "Em andamento";
    case GAP_MAPEAMENTO.FINALIZADO:
      return "Finalizado";
    default:
      return "—";
  }
}

export function gapAderenciaLabel(v: string | null | undefined): string {
  switch (v) {
    case GAP_ADERENCIA.ADERENTE:
      return "Aderente";
    case GAP_ADERENCIA.PARCIAL:
      return "Parcialmente aderente";
    case GAP_ADERENCIA.NAO_ADERENTE:
      return "Não aderente";
    case GAP_ADERENCIA.NA:
      return "N/A";
    default:
      return "—";
  }
}

/** Classes Tailwind pra badge de mapeamento. */
export function gapMapeamentoBadgeClass(v: string | null | undefined): string {
  switch (v) {
    case GAP_MAPEAMENTO.FINALIZADO:
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    case GAP_MAPEAMENTO.EM_ANDAMENTO:
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case GAP_MAPEAMENTO.NAO_INICIADO:
      return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    default:
      return "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800";
  }
}

/** Classes Tailwind pra badge de aderência. */
export function gapAderenciaBadgeClass(v: string | null | undefined): string {
  switch (v) {
    case GAP_ADERENCIA.ADERENTE:
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    case GAP_ADERENCIA.PARCIAL:
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case GAP_ADERENCIA.NAO_ADERENTE:
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
    case GAP_ADERENCIA.NA:
      return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    default:
      return "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800";
  }
}

// ============================================================
// Auth — só DPO acessa o GAP (decisão 4a)
// ============================================================

export interface GapAuthOK {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    companyId: string;
  };
}

export interface GapAuthErr {
  error: NextResponse;
}

/**
 * Valida sessão + papel DPO + companyId. Retorna `{ user }` quando ok ou
 * `{ error: NextResponse }` quando bloqueia.
 *
 * Uso típico:
 *   const r = await loadGapDPO();
 *   if ("error" in r) return r.error;
 *   const { user } = r;
 */
export async function loadGapDPO(): Promise<GapAuthOK | GapAuthErr> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!dbUser) {
    return {
      error: NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      ),
    };
  }
  if (!dbUser.companyId) {
    return {
      error: NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 },
      ),
    };
  }
  if (!isDPO(dbUser.role)) {
    return {
      error: NextResponse.json(
        { error: "Apenas o DPO acessa o GAP Analysis" },
        { status: 403 },
      ),
    };
  }
  return {
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      companyId: dbUser.companyId,
    },
  };
}

// ============================================================
// DTOs
// ============================================================

/**
 * Forma serializável de uma resposta de controle.
 * Igual ao model Prisma `GapAnswer` mas com datas em ISO string.
 */
export interface GapAnswerDTO {
  id: string;
  controlCode: string;
  cenarioAtual: string | null;
  mapeamento: GapMapeamento | null;
  aderencia: GapAderencia | null;
  pontoMelhoria: string | null;
  autoSuggested: boolean;
  answeredById: string | null;
  answeredAt: string | null;
  updatedAt: string;
  answeredBy?: { name: string | null; email: string } | null;
}

export interface GapDomainStats {
  /** Slug do domínio (igual ao `domainCode` do catálogo). */
  domainCode: string;
  /** Nome humano. */
  domain: string;
  /** Quantos controles esse domínio tem no catálogo. */
  total: number;
  /** Quantos receberam resposta de qualquer tipo. */
  answered: number;
  /** Distribuição por mapeamento. */
  byMapeamento: Record<GapMapeamento | "SEM_RESPOSTA", number>;
  /** Distribuição por aderência. */
  byAderencia: Record<GapAderencia | "SEM_RESPOSTA", number>;
}

export interface GapStats {
  /** Total no catálogo (constante = 119). */
  total: number;
  /** Quantos foram respondidos (qualquer campo). */
  answered: number;
  /** Quantos não foram tocados ainda. */
  pending: number;
  /** Quantos têm pelo menos `mapeamento` ou `aderencia` setado pelo DPO
   *  (autoSuggested = true conta como pendente de confirmação). */
  confirmed: number;
  /** Quantos foram pré-preenchidos pela auto-sugestão e ainda não confirmados. */
  autoSuggested: number;
  /** Distribuição agregada por mapeamento. */
  byMapeamento: Record<GapMapeamento | "SEM_RESPOSTA", number>;
  /** Distribuição agregada por aderência. */
  byAderencia: Record<GapAderencia | "SEM_RESPOSTA", number>;
  /** Por domínio (28 entradas, ordem do catálogo). */
  byDomain: GapDomainStats[];
}

// ============================================================
// Cálculo de stats
// ============================================================

const emptyMap = (): Record<GapMapeamento | "SEM_RESPOSTA", number> => ({
  NAO_INICIADO: 0,
  EM_ANDAMENTO: 0,
  FINALIZADO: 0,
  SEM_RESPOSTA: 0,
});

const emptyAde = (): Record<GapAderencia | "SEM_RESPOSTA", number> => ({
  ADERENTE: 0,
  PARCIAL: 0,
  NAO_ADERENTE: 0,
  NA: 0,
  SEM_RESPOSTA: 0,
});

/**
 * Calcula todas as estatísticas do GAP a partir das respostas + do
 * catálogo. Sem chamadas ao banco — passa o array já carregado.
 */
export function buildGapStats(
  answers: ReadonlyArray<{
    controlCode: string;
    mapeamento: string | null;
    aderencia: string | null;
    cenarioAtual: string | null;
    pontoMelhoria: string | null;
    autoSuggested: boolean;
  }>,
): GapStats {
  const byCode = new Map(answers.map((a) => [a.controlCode, a]));

  const stats: GapStats = {
    total: GAP_TOTAL,
    answered: 0,
    pending: 0,
    confirmed: 0,
    autoSuggested: 0,
    byMapeamento: emptyMap(),
    byAderencia: emptyAde(),
    byDomain: [],
  };

  for (const dom of GAP_DOMAINS) {
    const ds: GapDomainStats = {
      domainCode: dom.code,
      domain: dom.name,
      total: dom.controls.length,
      answered: 0,
      byMapeamento: emptyMap(),
      byAderencia: emptyAde(),
    };
    for (const ctrl of dom.controls) {
      const a = byCode.get(ctrl.code);
      const map = (a?.mapeamento ?? null) as GapMapeamento | null;
      const ade = (a?.aderencia ?? null) as GapAderencia | null;
      const hasContent = !!(
        a &&
        (a.cenarioAtual || a.pontoMelhoria || map || ade)
      );

      if (hasContent) {
        ds.answered += 1;
        stats.answered += 1;
        if (a!.autoSuggested) {
          stats.autoSuggested += 1;
        } else {
          stats.confirmed += 1;
        }
      }

      const mapKey: GapMapeamento | "SEM_RESPOSTA" = map ?? "SEM_RESPOSTA";
      ds.byMapeamento[mapKey] += 1;
      stats.byMapeamento[mapKey] += 1;

      const adeKey: GapAderencia | "SEM_RESPOSTA" = ade ?? "SEM_RESPOSTA";
      ds.byAderencia[adeKey] += 1;
      stats.byAderencia[adeKey] += 1;
    }
    stats.byDomain.push(ds);
  }
  stats.pending = stats.total - stats.answered;
  return stats;
}

// ============================================================
// Serialização
// ============================================================

export function answerToDTO(a: {
  id: string;
  controlCode: string;
  cenarioAtual: string | null;
  mapeamento: string | null;
  aderencia: string | null;
  pontoMelhoria: string | null;
  autoSuggested: boolean;
  answeredById: string | null;
  answeredAt: Date | null;
  updatedAt: Date;
  answeredBy?: { name: string | null; email: string } | null;
}): GapAnswerDTO {
  return {
    id: a.id,
    controlCode: a.controlCode,
    cenarioAtual: a.cenarioAtual,
    mapeamento: (a.mapeamento ?? null) as GapMapeamento | null,
    aderencia: (a.aderencia ?? null) as GapAderencia | null,
    pontoMelhoria: a.pontoMelhoria,
    autoSuggested: a.autoSuggested,
    answeredById: a.answeredById,
    answeredAt: a.answeredAt ? a.answeredAt.toISOString() : null,
    updatedAt: a.updatedAt.toISOString(),
    answeredBy: a.answeredBy ?? null,
  };
}

/** Validação de código contra o catálogo (lookup O(log n) bastante rápido). */
const VALID_CODES: ReadonlySet<string> = new Set(GAP_CONTROLS.map((c) => c.code));

export function isValidControlCode(code: string): boolean {
  return VALID_CODES.has(code);
}
