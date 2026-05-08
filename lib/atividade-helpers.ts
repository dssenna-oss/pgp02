/**
 * Helpers da feature "Minha atividade".
 *
 * Agrega eventos dos últimos 30 dias do user atual a partir de tabelas
 * existentes (sem schema novo). Cada entidade tem campos `*ById` + `*At`
 * que mapeamos pra um array unificado de `ActivityEvent`.
 *
 * Decisões (cardápio aprovado em 2026-05-07):
 *  · 1A: só ações em conteúdo institucional
 *  · 2A: 30 dias fixo
 *  · 7A: cada user vê só o próprio
 *  · 8A: sem schema novo
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Tipo de ação realizada. */
export type ActivityActionType =
  | "criou"
  | "editou"
  | "revisou"
  | "aprovou"
  | "publicou"
  | "encerrou"
  | "enviou"
  | "respondeu";

/** Tipo da entidade afetada. */
export type ActivityEntityType =
  | "INVENTARIO"
  | "RISCO"
  | "GAP"
  | "GAP_SNAPSHOT"
  | "PLANO"
  | "POLITICA"
  | "POLITICA_VERSAO"
  | "RIPD"
  | "RIPD_VERSAO"
  | "LIA"
  | "LIA_VERSAO"
  | "OPERADOR"
  | "OPERADOR_AVALIACAO"
  | "INCIDENTE"
  | "INCIDENTE_COMUNICACAO"
  | "CAPACITACAO";

/** Um evento da timeline. */
export type ActivityEvent = {
  /** ID único do evento (usado como key no React). */
  id: string;
  action: ActivityActionType;
  entityType: ActivityEntityType;
  entityId: string;
  /** Título humano da entidade (ex: "RIPD Folha de Pagamento"). */
  title: string;
  /** Timestamp do evento. */
  timestamp: string; // ISO
  /** Link clicável pra abrir a entidade. */
  href: string;
};

/** Label PT-BR de cada entityType (singular). */
export const ENTITY_LABEL: Record<ActivityEntityType, string> = {
  INVENTARIO: "Inventário",
  RISCO: "Risco",
  GAP: "GAP",
  GAP_SNAPSHOT: "Snapshot do GAP",
  PLANO: "Plano de Ação",
  POLITICA: "Política",
  POLITICA_VERSAO: "Versão de Política",
  RIPD: "RIPD",
  RIPD_VERSAO: "Versão de RIPD",
  LIA: "LIA",
  LIA_VERSAO: "Versão de LIA",
  OPERADOR: "Terceiro",
  OPERADOR_AVALIACAO: "Avaliação de Terceiro",
  INCIDENTE: "Incidente",
  INCIDENTE_COMUNICACAO: "Comunicação de Incidente",
  CAPACITACAO: "Capacitação",
};

/** Agrupamentos pro filtro de "entidade" (UI). */
export const ENTITY_GROUPS: Array<{ key: ActivityEntityType[]; label: string }> = [
  { key: ["INVENTARIO"], label: "Inventário" },
  { key: ["RISCO"], label: "Riscos" },
  { key: ["GAP", "GAP_SNAPSHOT"], label: "GAP" },
  { key: ["PLANO"], label: "Plano de Ação" },
  { key: ["POLITICA", "POLITICA_VERSAO"], label: "Políticas" },
  { key: ["RIPD", "RIPD_VERSAO"], label: "RIPDs" },
  { key: ["LIA", "LIA_VERSAO"], label: "LIA" },
  { key: ["OPERADOR", "OPERADOR_AVALIACAO"], label: "Terceiros" },
  { key: ["INCIDENTE", "INCIDENTE_COMUNICACAO"], label: "Incidentes" },
  { key: ["CAPACITACAO"], label: "Capacitação" },
];

/** Window de 30 dias atrás. */
function cutoff30d(): Date {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

/** Helper pra criar evento (mantém o tipo consistente). */
function ev(
  parts: Omit<ActivityEvent, "id" | "timestamp"> & { timestamp: Date | null }
): ActivityEvent | null {
  if (!parts.timestamp) return null;
  return {
    id: `${parts.entityType}-${parts.entityId}-${parts.action}-${parts.timestamp.getTime()}`,
    action: parts.action,
    entityType: parts.entityType,
    entityId: parts.entityId,
    title: parts.title,
    timestamp: parts.timestamp.toISOString(),
    href: parts.href,
  };
}

/**
 * Busca todos os eventos do user nos últimos 30 dias e retorna a timeline
 * ordenada (mais recente primeiro).
 *
 * Cada entidade gera 1+ eventos (criou, aprovou, etc.) condicionado ao
 * timestamp estar dentro do range. Tudo é executado em paralelo
 * via `Promise.all`.
 */
export async function getUserActivity(userId: string): Promise<ActivityEvent[]> {
  const since = cutoff30d();

  const [
    inventarios,
    riscos,
    gapAnswers,
    gapSnapshots,
    actionPlans,
    policies,
    policyVersions,
    ripds,
    ripdVersions,
    lias,
    liaVersions,
    operators,
    operatorAssessments,
    incidents,
    incidentCommunications,
    capacitacoes,
  ] = await Promise.all([
    // --- Inventário (DataInventory) ---
    prisma.dataInventory.findMany({
      where: {
        OR: [
          { createdById: userId, createdAt: { gte: since } },
          { reviewedById: userId, reviewedAt: { gte: since } },
          { legalReviewedById: userId, legalReviewedAt: { gte: since } },
        ],
      },
      select: {
        id: true,
        serviceName: true,
        createdById: true,
        createdAt: true,
        reviewedById: true,
        reviewedAt: true,
        legalReviewedById: true,
        legalReviewedAt: true,
      },
    }),

    // --- Riscos (ProcessRisk) ---
    prisma.processRisk.findMany({
      where: {
        OR: [
          { identifiedById: userId, identifiedAt: { gte: since } },
          { reviewedById: userId, reviewedAt: { gte: since } },
        ],
      },
      select: {
        id: true,
        riskCode: true,
        description: true,
        dataInventoryId: true,
        identifiedById: true,
        identifiedAt: true,
        reviewedById: true,
        reviewedAt: true,
      },
    }),

    // --- GAP Answers ---
    prisma.gapAnswer.findMany({
      where: { answeredById: userId, answeredAt: { gte: since } },
      select: {
        id: true,
        controlCode: true,
        answeredAt: true,
      },
    }),

    // --- GAP Snapshots ---
    prisma.gapSnapshot.findMany({
      where: { createdById: userId, createdAt: { gte: since } },
      select: { id: true, label: true, createdAt: true },
    }),

    // --- Plano de Ação ---
    prisma.actionPlan.findMany({
      where: {
        OR: [
          { createdById: userId, createdAt: { gte: since } },
          { assigneeId: userId, completedAt: { gte: since } },
        ],
      },
      select: {
        id: true,
        title: true,
        createdById: true,
        createdAt: true,
        assigneeId: true,
        completedAt: true,
      },
    }),

    // --- Políticas ---
    prisma.policy.findMany({
      where: {
        OR: [
          { createdById: userId, createdAt: { gte: since } },
          { publishedById: userId, publishedAt: { gte: since } },
        ],
      },
      select: {
        id: true,
        title: true,
        createdById: true,
        createdAt: true,
        publishedById: true,
        publishedAt: true,
      },
    }),

    prisma.policyVersion.findMany({
      where: { publishedById: userId, publishedAt: { gte: since } },
      select: {
        id: true,
        version: true,
        publishedAt: true,
        policy: { select: { id: true, title: true } },
      },
    }),

    // --- RIPDs ---
    prisma.ripd.findMany({
      where: {
        OR: [
          { createdById: userId, createdAt: { gte: since } },
          { approvedById: userId, approvedAt: { gte: since } },
        ],
      },
      select: {
        id: true,
        title: true,
        createdById: true,
        createdAt: true,
        approvedById: true,
        approvedAt: true,
      },
    }),

    prisma.ripdVersion.findMany({
      where: { approvedById: userId, approvedAt: { gte: since } },
      select: {
        id: true,
        version: true,
        approvedAt: true,
        ripd: { select: { id: true, title: true } },
      },
    }),

    // --- LIA ---
    prisma.lia.findMany({
      where: {
        OR: [
          { createdById: userId, createdAt: { gte: since } },
          { approvedById: userId, approvedAt: { gte: since } },
        ],
      },
      select: {
        id: true,
        title: true,
        createdById: true,
        createdAt: true,
        approvedById: true,
        approvedAt: true,
      },
    }),

    prisma.liaVersion.findMany({
      where: { approvedById: userId, approvedAt: { gte: since } },
      select: {
        id: true,
        version: true,
        approvedAt: true,
        lia: { select: { id: true, title: true } },
      },
    }),

    // --- Operadores ---
    prisma.operator.findMany({
      where: { createdById: userId, createdAt: { gte: since } },
      select: { id: true, name: true, createdAt: true },
    }),

    prisma.operatorAssessment.findMany({
      where: {
        OR: [
          { createdById: userId, createdAt: { gte: since } },
          { reviewedById: userId, reviewedAt: { gte: since } },
        ],
      },
      select: {
        id: true,
        label: true,
        createdById: true,
        createdAt: true,
        reviewedById: true,
        reviewedAt: true,
        operatorId: true,
        operator: { select: { name: true } },
      },
    }),

    // --- Incidentes ---
    prisma.incident.findMany({
      where: {
        OR: [
          { createdById: userId, createdAt: { gte: since } },
          { closedById: userId, closedAt: { gte: since } },
        ],
      },
      select: {
        id: true,
        title: true,
        createdById: true,
        createdAt: true,
        closedById: true,
        closedAt: true,
      },
    }),

    prisma.incidentCommunication.findMany({
      where: { createdById: userId, createdAt: { gte: since } },
      select: {
        id: true,
        target: true,
        createdAt: true,
        incidentId: true,
        incident: { select: { title: true } },
      },
    }),

    // --- Capacitação ---
    prisma.capacitacaoEvento.findMany({
      where: { createdById: userId, createdAt: { gte: since } },
      select: { id: true, title: true, createdAt: true },
    }),
  ]);

  const events: Array<ActivityEvent | null> = [];

  // === Mapeia resultados pra ActivityEvent ===

  for (const inv of inventarios) {
    if (inv.createdById === userId) {
      events.push(
        ev({
          action: "criou",
          entityType: "INVENTARIO",
          entityId: inv.id,
          title: inv.serviceName,
          timestamp: inv.createdAt,
          href: `/dashboard/inventario/${inv.id}`,
        })
      );
    }
    if (inv.reviewedById === userId && inv.reviewedAt) {
      events.push(
        ev({
          action: "revisou",
          entityType: "INVENTARIO",
          entityId: inv.id,
          title: inv.serviceName,
          timestamp: inv.reviewedAt,
          href: `/dashboard/inventario/${inv.id}`,
        })
      );
    }
    if (inv.legalReviewedById === userId && inv.legalReviewedAt) {
      events.push(
        ev({
          action: "aprovou",
          entityType: "INVENTARIO",
          entityId: inv.id,
          title: `${inv.serviceName} (revisão jurídica)`,
          timestamp: inv.legalReviewedAt,
          href: `/dashboard/inventario/${inv.id}`,
        })
      );
    }
  }

  for (const r of riscos) {
    const desc = r.description ?? "";
    const titulo = `${r.riskCode} — ${desc.slice(0, 60)}${desc.length > 60 ? "…" : ""}`;
    if (r.identifiedById === userId) {
      events.push(
        ev({
          action: "criou",
          entityType: "RISCO",
          entityId: r.id,
          title: titulo,
          timestamp: r.identifiedAt,
          href: `/dashboard/inventario/${r.dataInventoryId}/riscos`,
        })
      );
    }
    if (r.reviewedById === userId && r.reviewedAt) {
      events.push(
        ev({
          action: "revisou",
          entityType: "RISCO",
          entityId: r.id,
          title: titulo,
          timestamp: r.reviewedAt,
          href: `/dashboard/inventario/${r.dataInventoryId}/riscos`,
        })
      );
    }
  }

  for (const g of gapAnswers) {
    events.push(
      ev({
        action: "respondeu",
        entityType: "GAP",
        entityId: g.id,
        title: `Controle ${g.controlCode}`,
        timestamp: g.answeredAt,
        href: `/dashboard/gap-analysis`,
      })
    );
  }

  for (const s of gapSnapshots) {
    events.push(
      ev({
        action: "criou",
        entityType: "GAP_SNAPSHOT",
        entityId: s.id,
        title: s.label,
        timestamp: s.createdAt,
        href: `/dashboard/gap-analysis`,
      })
    );
  }

  for (const p of actionPlans) {
    if (p.createdById === userId) {
      events.push(
        ev({
          action: "criou",
          entityType: "PLANO",
          entityId: p.id,
          title: p.title,
          timestamp: p.createdAt,
          href: `/dashboard/plano-acao`,
        })
      );
    }
    if (p.assigneeId === userId && p.completedAt) {
      events.push(
        ev({
          action: "encerrou",
          entityType: "PLANO",
          entityId: p.id,
          title: p.title,
          timestamp: p.completedAt,
          href: `/dashboard/plano-acao`,
        })
      );
    }
  }

  for (const p of policies) {
    if (p.createdById === userId) {
      events.push(
        ev({
          action: "criou",
          entityType: "POLITICA",
          entityId: p.id,
          title: p.title,
          timestamp: p.createdAt,
          href: `/dashboard/politicas/${p.id}`,
        })
      );
    }
    if (p.publishedById === userId && p.publishedAt) {
      events.push(
        ev({
          action: "publicou",
          entityType: "POLITICA",
          entityId: p.id,
          title: p.title,
          timestamp: p.publishedAt,
          href: `/dashboard/politicas/${p.id}`,
        })
      );
    }
  }

  for (const v of policyVersions) {
    events.push(
      ev({
        action: "publicou",
        entityType: "POLITICA_VERSAO",
        entityId: v.id,
        title: `${v.policy.title} (v${v.version})`,
        timestamp: v.publishedAt,
        href: `/dashboard/politicas/${v.policy.id}`,
      })
    );
  }

  for (const r of ripds) {
    if (r.createdById === userId) {
      events.push(
        ev({
          action: "criou",
          entityType: "RIPD",
          entityId: r.id,
          title: r.title,
          timestamp: r.createdAt,
          href: `/dashboard/ripd/${r.id}`,
        })
      );
    }
    if (r.approvedById === userId && r.approvedAt) {
      events.push(
        ev({
          action: "aprovou",
          entityType: "RIPD",
          entityId: r.id,
          title: r.title,
          timestamp: r.approvedAt,
          href: `/dashboard/ripd/${r.id}`,
        })
      );
    }
  }

  for (const v of ripdVersions) {
    events.push(
      ev({
        action: "aprovou",
        entityType: "RIPD_VERSAO",
        entityId: v.id,
        title: `${v.ripd.title} (v${v.version})`,
        timestamp: v.approvedAt,
        href: `/dashboard/ripd/${v.ripd.id}`,
      })
    );
  }

  for (const l of lias) {
    if (l.createdById === userId) {
      events.push(
        ev({
          action: "criou",
          entityType: "LIA",
          entityId: l.id,
          title: l.title,
          timestamp: l.createdAt,
          href: `/dashboard/lia/${l.id}`,
        })
      );
    }
    if (l.approvedById === userId && l.approvedAt) {
      events.push(
        ev({
          action: "aprovou",
          entityType: "LIA",
          entityId: l.id,
          title: l.title,
          timestamp: l.approvedAt,
          href: `/dashboard/lia/${l.id}`,
        })
      );
    }
  }

  for (const v of liaVersions) {
    events.push(
      ev({
        action: "aprovou",
        entityType: "LIA_VERSAO",
        entityId: v.id,
        title: `${v.lia.title} (v${v.version})`,
        timestamp: v.approvedAt,
        href: `/dashboard/lia/${v.lia.id}`,
      })
    );
  }

  for (const o of operators) {
    events.push(
      ev({
        action: "criou",
        entityType: "OPERADOR",
        entityId: o.id,
        title: o.name,
        timestamp: o.createdAt,
        href: `/dashboard/terceiros/${o.id}`,
      })
    );
  }

  for (const a of operatorAssessments) {
    const label = a.label ?? "Avaliação";
    const titulo = a.operator?.name ? `${label} — ${a.operator.name}` : label;
    if (a.createdById === userId) {
      events.push(
        ev({
          action: "enviou",
          entityType: "OPERADOR_AVALIACAO",
          entityId: a.id,
          title: titulo,
          timestamp: a.createdAt,
          href: `/dashboard/terceiros/${a.operatorId}`,
        })
      );
    }
    if (a.reviewedById === userId && a.reviewedAt) {
      events.push(
        ev({
          action: "revisou",
          entityType: "OPERADOR_AVALIACAO",
          entityId: a.id,
          title: titulo,
          timestamp: a.reviewedAt,
          href: `/dashboard/terceiros/${a.operatorId}`,
        })
      );
    }
  }

  for (const i of incidents) {
    if (i.createdById === userId) {
      events.push(
        ev({
          action: "criou",
          entityType: "INCIDENTE",
          entityId: i.id,
          title: i.title,
          timestamp: i.createdAt,
          href: `/dashboard/incidentes/${i.id}`,
        })
      );
    }
    if (i.closedById === userId && i.closedAt) {
      events.push(
        ev({
          action: "encerrou",
          entityType: "INCIDENTE",
          entityId: i.id,
          title: i.title,
          timestamp: i.closedAt,
          href: `/dashboard/incidentes/${i.id}`,
        })
      );
    }
  }

  for (const c of incidentCommunications) {
    const targetLabel = c.target === "ANPD" ? "ANPD" : "Titulares";
    events.push(
      ev({
        action: "enviou",
        entityType: "INCIDENTE_COMUNICACAO",
        entityId: c.id,
        title: `${c.incident.title} → ${targetLabel}`,
        timestamp: c.createdAt,
        href: `/dashboard/incidentes/${c.incidentId}`,
      })
    );
  }

  for (const c of capacitacoes) {
    events.push(
      ev({
        action: "criou",
        entityType: "CAPACITACAO",
        entityId: c.id,
        title: c.title,
        timestamp: c.createdAt,
        href: `/dashboard/capacitacao`,
      })
    );
  }

  // Filtra nulls e ordena DESC por timestamp
  return events
    .filter((e): e is ActivityEvent => e !== null)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Agrupa eventos por dia (chave 'YYYY-MM-DD').
 * Ordem dos grupos: dia mais recente primeiro.
 */
export function groupByDay(
  events: ActivityEvent[]
): Array<{ dayKey: string; date: Date; events: ActivityEvent[] }> {
  const map = new Map<string, ActivityEvent[]>();
  for (const e of events) {
    const d = new Date(e.timestamp);
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const arr = map.get(dayKey) ?? [];
    arr.push(e);
    map.set(dayKey, arr);
  }
  const groups = Array.from(map.entries()).map(([dayKey, evs]) => ({
    dayKey,
    date: new Date(evs[0].timestamp),
    events: evs,
  }));
  return groups.sort((a, b) => b.dayKey.localeCompare(a.dayKey));
}
