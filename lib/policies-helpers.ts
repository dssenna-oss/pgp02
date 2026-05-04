/**
 * Helpers das Políticas LGPD (Checkpoint 12).
 *
 * Cada `Policy` é um documento "vivo" com 1 conteúdo de rascunho
 * editável + histórico de versões publicadas (`PolicyVersion`). Quando
 * o DPO publica, snapshot do `currentContent` vira `PolicyVersion` nova
 * e `publishedContent` é atualizado.
 *
 * URL pública: `/p/<companySlug>/<policySlug>`. Slug da empresa fica
 * em Company.slug (gerado de `companyName` se ainda não setado).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";

// ============================================================
// Enums
// ============================================================

export const POLICY_TYPE = {
  AVISO_PRIVACIDADE_EXTERNO: "AVISO_PRIVACIDADE_EXTERNO",
  POLITICA_PRIVACIDADE_INTERNO: "POLITICA_PRIVACIDADE_INTERNO",
  NORMA_PRIVACIDADE: "NORMA_PRIVACIDADE",
  TERMOS_USO: "TERMOS_USO",
  POLITICA_COOKIES: "POLITICA_COOKIES",
  POLITICA_TERCEIROS: "POLITICA_TERCEIROS",
  POLITICA_RETENCAO: "POLITICA_RETENCAO",
  POLITICA_TREINAMENTO: "POLITICA_TREINAMENTO",
  POLITICA_TRANSFERENCIA: "POLITICA_TRANSFERENCIA",
  OUTRA: "OUTRA",
} as const;
export type PolicyType = (typeof POLICY_TYPE)[keyof typeof POLICY_TYPE];

export const POLICY_STATUS = {
  RASCUNHO: "RASCUNHO",
  PUBLICADA: "PUBLICADA",
  ARQUIVADA: "ARQUIVADA",
} as const;
export type PolicyStatus = (typeof POLICY_STATUS)[keyof typeof POLICY_STATUS];

export const VALID_POLICY_TYPES = new Set(Object.values(POLICY_TYPE));
export const VALID_POLICY_STATUSES = new Set(Object.values(POLICY_STATUS));

// ============================================================
// Labels (UI)
// ============================================================

export function policyTypeLabel(t: string | null | undefined): string {
  switch (t) {
    case "AVISO_PRIVACIDADE_EXTERNO":   return "Aviso de Privacidade (externo)";
    case "POLITICA_PRIVACIDADE_INTERNO": return "Política de Privacidade (interna)";
    case "NORMA_PRIVACIDADE":            return "Norma de Privacidade";
    case "TERMOS_USO":                   return "Termos de Uso";
    case "POLITICA_COOKIES":             return "Política de Cookies";
    case "POLITICA_TERCEIROS":           return "Política de Terceiros";
    case "POLITICA_RETENCAO":            return "Política de Retenção e Descarte";
    case "POLITICA_TREINAMENTO":         return "Política de Treinamento";
    case "POLITICA_TRANSFERENCIA":       return "Política de Transferência Internacional";
    case "OUTRA":                        return "Outra";
    default:                             return "—";
  }
}

export function policyTypeShortLabel(t: string | null | undefined): string {
  switch (t) {
    case "AVISO_PRIVACIDADE_EXTERNO":   return "Privacidade (externa)";
    case "POLITICA_PRIVACIDADE_INTERNO": return "Privacidade (interna)";
    case "NORMA_PRIVACIDADE":            return "Norma";
    case "TERMOS_USO":                   return "Termos";
    case "POLITICA_COOKIES":             return "Cookies";
    case "POLITICA_TERCEIROS":           return "Terceiros";
    case "POLITICA_RETENCAO":            return "Retenção";
    case "POLITICA_TREINAMENTO":         return "Treinamento";
    case "POLITICA_TRANSFERENCIA":       return "Transferência Int.";
    case "OUTRA":                        return "Outra";
    default:                             return "—";
  }
}

export function policyStatusLabel(s: string | null | undefined): string {
  switch (s) {
    case "RASCUNHO":  return "Rascunho";
    case "PUBLICADA": return "Publicada";
    case "ARQUIVADA": return "Arquivada";
    default:          return "—";
  }
}

// ============================================================
// Classes Tailwind (UI)
// ============================================================

export function policyStatusBadgeClass(s: string | null | undefined): string {
  switch (s) {
    case "PUBLICADA":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    case "RASCUNHO":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "ARQUIVADA":
      return "bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

export function policyTypeBadgeClass(t: string | null | undefined): string {
  switch (t) {
    case "AVISO_PRIVACIDADE_EXTERNO":
    case "POLITICA_PRIVACIDADE_INTERNO":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800";
    case "NORMA_PRIVACIDADE":
      return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800";
    case "TERMOS_USO":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800";
    case "POLITICA_COOKIES":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
}

// ============================================================
// Slug helpers
// ============================================================

/** Normaliza string em slug URL-safe (sem acentos, lowercase, hífens). */
export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Slug default por tipo de política — usado quando DPO cria nova. */
export function defaultSlugForType(t: string): string {
  switch (t) {
    case "AVISO_PRIVACIDADE_EXTERNO":   return "privacidade";
    case "POLITICA_PRIVACIDADE_INTERNO": return "privacidade-interna";
    case "NORMA_PRIVACIDADE":            return "norma-privacidade";
    case "TERMOS_USO":                   return "termos-de-uso";
    case "POLITICA_COOKIES":             return "cookies";
    case "POLITICA_TERCEIROS":           return "terceiros";
    case "POLITICA_RETENCAO":            return "retencao-descarte";
    case "POLITICA_TREINAMENTO":         return "treinamento";
    case "POLITICA_TRANSFERENCIA":       return "transferencia-internacional";
    default:                             return "outra";
  }
}

// ============================================================
// DTO
// ============================================================

export interface PolicyDTO {
  id: string;
  type: PolicyType;
  title: string;
  slug: string;
  status: PolicyStatus;
  currentContent: string;
  publishedContent: string | null;
  currentVersion: number;
  publishedAt: string | null;
  publishedBy: { id: string; name: string | null; email: string } | null;
  createdById: string;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
  /** URL pública (relativa) — null se a Company ainda não tem slug. */
  publicUrl: string | null;
  /** Quantas versões publicadas no histórico. */
  versionCount: number;
}

interface PolicyRow {
  id: string;
  type: string;
  title: string;
  slug: string;
  status: string;
  currentContent: string;
  publishedContent: string | null;
  currentVersion: number;
  publishedAt: Date | null;
  publishedBy: { id: string; name: string | null; email: string } | null;
  createdById: string;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: Date;
  updatedAt: Date;
  versions?: { id: string }[];
  _count?: { versions: number };
}

export function policyToDTO(
  p: PolicyRow,
  companySlug: string | null,
): PolicyDTO {
  const versionCount = p._count?.versions ?? p.versions?.length ?? 0;
  const publicUrl =
    companySlug && p.status === "PUBLICADA" && p.publishedContent
      ? `/p/${companySlug}/${p.slug}`
      : null;
  return {
    id: p.id,
    type: p.type as PolicyType,
    title: p.title,
    slug: p.slug,
    status: p.status as PolicyStatus,
    currentContent: p.currentContent,
    publishedContent: p.publishedContent,
    currentVersion: p.currentVersion,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    publishedBy: p.publishedBy,
    createdById: p.createdById,
    createdBy: p.createdBy,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    publicUrl,
    versionCount,
  };
}

// ============================================================
// Auth check (DPO-only)
// ============================================================

export async function loadPolicyAuth(): Promise<
  | { error: NextResponse }
  | { user: { id: string; companyId: string; isDPO: boolean } }
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
  if (!isDPO(u.role)) {
    return {
      error: NextResponse.json(
        { error: "Apenas DPO pode gerenciar Políticas" },
        { status: 403 },
      ),
    };
  }
  return { user: { id: u.id, companyId: u.companyId, isDPO: true } };
}

/**
 * Garante que a Company tem um slug — gera de `companyName` se ainda
 * não existir. Idempotente. Retry com sufixo `-2`, `-3`... em colisão.
 */
export async function ensureCompanySlug(companyId: string): Promise<string> {
  const c = await prisma.company.findUnique({
    where: { id: companyId },
    select: { slug: true, companyName: true },
  });
  if (!c) throw new Error("Company não encontrada");
  if (c.slug) return c.slug;

  const base = slugify(c.companyName) || "organizacao";
  let candidate = base;
  let suffix = 2;
  while (true) {
    const taken = await prisma.company.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) break;
    candidate = `${base}-${suffix++}`;
    if (suffix > 100) {
      candidate = `${base}-${Date.now()}`;
      break;
    }
  }
  await prisma.company.update({
    where: { id: companyId },
    data: { slug: candidate },
  });
  return candidate;
}

// ============================================================
// Stats agregadas
// ============================================================

export interface PolicyStats {
  total: number;
  byStatus: Record<PolicyStatus, number>;
  byType: Record<string, number>;
  /** Quantas estão obsoletas (publicadas, mas o currentContent != publishedContent — ou seja, tem rascunho mais novo aguardando publicação). */
  outdated: number;
}

export function computePolicyStats(
  policies: ReadonlyArray<{
    status: string;
    type: string;
    currentContent: string;
    publishedContent: string | null;
  }>,
): PolicyStats {
  const stats: PolicyStats = {
    total: policies.length,
    byStatus: { RASCUNHO: 0, PUBLICADA: 0, ARQUIVADA: 0 },
    byType: {},
    outdated: 0,
  };
  for (const p of policies) {
    if (p.status in stats.byStatus) (stats.byStatus as any)[p.status] += 1;
    stats.byType[p.type] = (stats.byType[p.type] ?? 0) + 1;
    if (
      p.status === "PUBLICADA" &&
      p.publishedContent != null &&
      p.currentContent !== p.publishedContent
    ) {
      stats.outdated += 1;
    }
  }
  return stats;
}
