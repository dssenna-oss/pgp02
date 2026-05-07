/**
 * Painel de Retomada — Engine "Desde sua última visita" (CP27 Fatia 2)
 *
 * Calcula 3 baldes de novidades pra mostrar no Dashboard:
 *   🔴 Crítico — itens que pedem AÇÃO da pessoa logada (RIPDs/LIAs em
 *       fila pra DPO aprovar, incidentes ALTO/MEDIO em aberto, ações do
 *       Plano vencidas designadas a ela).
 *   🟠 Suas coisas — itens que ELA criou ou aprovou foram modificados
 *       desde a última visita.
 *   ⚪ Geral — mudanças relevantes na organização (processos cadastrados,
 *       contribuidores convidados, políticas publicadas) desde a última
 *       visita.
 *
 * Fonte da janela: `User.previousLoginAt` (capturado no signIn callback
 * do NextAuth — Fatia 1 do CP27).
 *
 * Quando esconder o card:
 *   - `previousLoginAt = null` (primeiro login do user; nada pra comparar)
 *   - Card fica visível só nas primeiras 24h após o login atual
 *     (decisão #5 do menu — "some quando passa 24h dentro do app")
 *   - Total de itens nos 3 baldes = 0
 */

import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/auth-helpers";

export interface RetomadaItem {
  /// Texto curto pra exibir ("RIPD 'Cadastro Servidores' aguardando")
  label: string;
  /// Tooltip / sub-texto opcional ("severidade ALTO · prazo 48h")
  detail?: string;
  /// Rota pra navegar
  href: string;
  /// "Quando" foi (string humanizada — "5h atrás", "ontem", "3 dias atrás")
  whenLabel: string;
  /// Timestamp absoluto pra ordenar
  when: Date;
}

export interface RetomadaBuckets {
  critico: RetomadaItem[];
  suasCoisas: RetomadaItem[];
  geral: RetomadaItem[];
}

export interface RetomadaResponse {
  /// Quando o user logou da vez ANTERIOR a esta (null = primeiro login).
  previousLoginAt: string | null;
  /// String tipo "3 dias", "ontem", "há 5 horas" — pro header do card.
  windowLabel: string | null;
  /// Se o card deve aparecer (false quando: primeiro login OR > 24h dentro
  /// do app OR sem itens em nenhum balde).
  showCard: boolean;
  /// Total de itens consolidado (pra hint visual no header — "12 novidades").
  totalCount: number;
  buckets: RetomadaBuckets;
}

/// Limite máximo de itens por balde (UX: lista longa cansa).
const MAX_PER_BUCKET = 5;

/// Janela de exibição do card depois do login atual (decisão #5).
const HIDE_AFTER_HOURS = 24;

/**
 * Humaniza diferença de tempo em pt-BR.
 */
function humanizeAgo(d: Date): string {
  const ms = Date.now() - d.getTime();
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.round(hours / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `${days} dias atrás`;
  const weeks = Math.round(days / 7);
  if (weeks === 1) return "1 semana atrás";
  if (weeks < 4) return `${weeks} semanas atrás`;
  const months = Math.round(days / 30);
  return `${months} ${months === 1 ? "mês" : "meses"} atrás`;
}

/**
 * Janela do banner — texto humanizado entre previousLogin e agora.
 */
function humanizeWindow(previous: Date): string {
  return humanizeAgo(previous);
}

interface UserContext {
  id: string;
  role: string;
  companyId: string;
  lastLoginAt: Date | null;
  previousLoginAt: Date | null;
}

/**
 * Verifica se o user é DPO (Principal/Substituto/Auxiliar/admin legacy).
 */
function isDpo(role: string): boolean {
  return (
    role === ROLES.DPO_PRINCIPAL ||
    role === ROLES.DPO_SUBSTITUTO ||
    role === ROLES.DPO_AUXILIAR ||
    role === ROLES.ADMIN_LEGACY
  );
}

/**
 * Computa o balde 🔴 Crítico — coisas que pedem AÇÃO do user.
 */
async function buildCriticoBucket(user: UserContext): Promise<RetomadaItem[]> {
  const items: RetomadaItem[] = [];
  const dpo = isDpo(user.role);

  // RIPDs aguardando aprovação (DPO only)
  if (dpo) {
    const pendingRipds = await prisma.ripd.findMany({
      where: { companyId: user.companyId, status: "EM_REVISAO" },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: MAX_PER_BUCKET,
    });
    for (const r of pendingRipds) {
      items.push({
        label: `RIPD "${r.title}" aguardando sua aprovação`,
        href: `/dashboard/ripd/${r.id}`,
        whenLabel: humanizeAgo(r.updatedAt),
        when: r.updatedAt,
      });
    }

    // LIAs aguardando aprovação
    const pendingLias = await prisma.lia.findMany({
      where: { companyId: user.companyId, status: "EM_REVISAO" },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: MAX_PER_BUCKET,
    });
    for (const l of pendingLias) {
      items.push({
        label: `LIA "${l.title}" aguardando sua aprovação`,
        href: `/dashboard/lia/${l.id}`,
        whenLabel: humanizeAgo(l.updatedAt),
        when: l.updatedAt,
      });
    }
  }

  // Incidentes severidade ALTO/MEDIO em aberto
  const openIncidents = await prisma.incident.findMany({
    where: {
      companyId: user.companyId,
      severity: { in: ["ALTO", "MEDIO"] },
      status: { notIn: ["ENCERRADO", "FALSO_POSITIVO"] },
    },
    select: { id: true, title: true, severity: true, detectedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: MAX_PER_BUCKET,
  });
  for (const inc of openIncidents) {
    const ts = inc.detectedAt ?? inc.createdAt;
    items.push({
      label: `Incidente "${inc.title}" — severidade ${inc.severity}, em aberto`,
      detail: "Prazo ANPD 72h",
      href: `/dashboard/incidentes/${inc.id}`,
      whenLabel: humanizeAgo(ts),
      when: ts,
    });
  }

  // Ações do Plano vencidas
  const now = new Date();
  const overdueActions = await prisma.actionPlan.findMany({
    where: {
      companyId: user.companyId,
      dueDate: { lt: now },
      status: { notIn: ["CONCLUIDA", "CANCELADA"] },
    },
    select: { id: true, title: true, dueDate: true, status: true },
    orderBy: { dueDate: "asc" },
    take: MAX_PER_BUCKET,
  });
  for (const a of overdueActions) {
    const dueDate = a.dueDate as Date;
    items.push({
      label: `Ação "${a.title}" vencida sem encerramento`,
      detail: `prazo era ${dueDate.toLocaleDateString("pt-BR")}`,
      href: `/dashboard/plano-acao`,
      whenLabel: humanizeAgo(dueDate),
      when: dueDate,
    });
  }

  // Ordena por mais recente e corta no limite
  items.sort((a, b) => b.when.getTime() - a.when.getTime());
  return items.slice(0, MAX_PER_BUCKET);
}

/**
 * Balde 🟠 Suas coisas — itens que VOCÊ criou ou aprovou foram
 * modificados desde a última visita.
 */
async function buildSuasCoisasBucket(
  user: UserContext,
  windowStart: Date
): Promise<RetomadaItem[]> {
  const items: RetomadaItem[] = [];

  // Inventários que VOCÊ criou e foram modificados
  const myInventories = await prisma.dataInventory.findMany({
    where: {
      companyId: user.companyId,
      createdById: user.id,
      updatedAt: { gt: windowStart },
    },
    select: { id: true, serviceName: true, status: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: MAX_PER_BUCKET,
  });
  for (const inv of myInventories) {
    items.push({
      label: `Inventário "${inv.serviceName}" foi atualizado`,
      detail: `status: ${inv.status}`,
      href: `/dashboard/inventario/${inv.id}`,
      whenLabel: humanizeAgo(inv.updatedAt),
      when: inv.updatedAt,
    });
  }

  // RIPDs que VOCÊ criou e foram modificados
  const myRipds = await prisma.ripd.findMany({
    where: {
      companyId: user.companyId,
      createdById: user.id,
      updatedAt: { gt: windowStart },
    },
    select: { id: true, title: true, status: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: MAX_PER_BUCKET,
  });
  for (const r of myRipds) {
    items.push({
      label: `RIPD "${r.title}" foi atualizado`,
      detail: `status: ${r.status}`,
      href: `/dashboard/ripd/${r.id}`,
      whenLabel: humanizeAgo(r.updatedAt),
      when: r.updatedAt,
    });
  }

  // LIAs que VOCÊ criou
  const myLias = await prisma.lia.findMany({
    where: {
      companyId: user.companyId,
      createdById: user.id,
      updatedAt: { gt: windowStart },
    },
    select: { id: true, title: true, status: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: MAX_PER_BUCKET,
  });
  for (const l of myLias) {
    items.push({
      label: `LIA "${l.title}" foi atualizada`,
      detail: `status: ${l.status}`,
      href: `/dashboard/lia/${l.id}`,
      whenLabel: humanizeAgo(l.updatedAt),
      when: l.updatedAt,
    });
  }

  items.sort((a, b) => b.when.getTime() - a.when.getTime());
  return items.slice(0, MAX_PER_BUCKET);
}

/**
 * Balde ⚪ Geral — coisas relevantes que aconteceram na org desde
 * a última visita.
 */
async function buildGeralBucket(
  user: UserContext,
  windowStart: Date
): Promise<RetomadaItem[]> {
  const items: RetomadaItem[] = [];

  // Novos processos cadastrados na org
  const newInventories = await prisma.dataInventory.count({
    where: {
      companyId: user.companyId,
      createdAt: { gt: windowStart },
      status: { not: "RASCUNHO" },
    },
  });
  if (newInventories > 0) {
    items.push({
      label: `${newInventories} processo${newInventories > 1 ? "s" : ""} novo${newInventories > 1 ? "s" : ""} cadastrado${newInventories > 1 ? "s" : ""} no Inventário`,
      href: `/dashboard/inventario`,
      whenLabel: "desde sua última visita",
      when: windowStart,
    });
  }

  // Contribuidores convidados (DPO only — outros não veem essa info útil)
  if (isDpo(user.role)) {
    const newContribs = await prisma.user.count({
      where: {
        companyId: user.companyId,
        createdAt: { gt: windowStart },
        role: ROLES.CONTRIBUIDOR,
      },
    });
    if (newContribs > 0) {
      items.push({
        label: `${newContribs} contribuidor${newContribs > 1 ? "es" : ""} convidado${newContribs > 1 ? "s" : ""}`,
        href: `/dashboard/contribuidores`,
        whenLabel: "desde sua última visita",
        when: windowStart,
      });
    }
  }

  // Políticas publicadas
  const publishedPolicies = await prisma.policy.findMany({
    where: {
      companyId: user.companyId,
      publishedAt: { gt: windowStart },
    },
    select: { id: true, title: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });
  for (const p of publishedPolicies) {
    if (p.publishedAt) {
      items.push({
        label: `Política "${p.title}" publicada`,
        href: `/dashboard/politicas/${p.id}`,
        whenLabel: humanizeAgo(p.publishedAt),
        when: p.publishedAt,
      });
    }
  }

  items.sort((a, b) => b.when.getTime() - a.when.getTime());
  return items.slice(0, MAX_PER_BUCKET);
}

/**
 * Computa a resposta completa do Painel de Retomada — chamada pela API.
 */
export async function buildPainelRetomada(user: UserContext): Promise<RetomadaResponse> {
  const noPrev = !user.previousLoginAt;
  const windowStart = user.previousLoginAt ?? new Date(0);

  // Decisão #5 — esconde card se passou 24h dentro do app desde o login atual
  let hideByTime = false;
  if (user.lastLoginAt) {
    const hoursSinceCurrentLogin = (Date.now() - user.lastLoginAt.getTime()) / 3_600_000;
    hideByTime = hoursSinceCurrentLogin > HIDE_AFTER_HOURS;
  }

  // Sem previousLogin OR muito tempo no app → não calcula nada
  if (noPrev || hideByTime) {
    return {
      previousLoginAt: user.previousLoginAt?.toISOString() ?? null,
      windowLabel: null,
      showCard: false,
      totalCount: 0,
      buckets: { critico: [], suasCoisas: [], geral: [] },
    };
  }

  // Calcula os 3 baldes em paralelo
  const [critico, suasCoisas, geral] = await Promise.all([
    buildCriticoBucket(user),
    buildSuasCoisasBucket(user, windowStart),
    buildGeralBucket(user, windowStart),
  ]);

  const totalCount = critico.length + suasCoisas.length + geral.length;

  return {
    previousLoginAt: user.previousLoginAt!.toISOString(),
    windowLabel: humanizeWindow(user.previousLoginAt!),
    showCard: totalCount > 0,
    totalCount,
    buckets: { critico, suasCoisas, geral },
  };
}
