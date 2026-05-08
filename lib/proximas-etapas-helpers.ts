/**
 * Engine "Próximas etapas" — gera a lista priorizada do que o user
 * deveria fazer agora.
 *
 * Cardápio aprovado em 2026-05-08:
 *   · 1A: substitui os 2 cards antigos do dashboard
 *   · 2C: híbrido — regras de workflow + recomendações do Diagnóstico
 *   · 3C: top 3 + expansível
 *   · 4B: regras diferentes pra DPO vs Contribuidor
 *
 * Engine PURA — só lê dados, não escreve. Chamada do server (API route +
 * server component).
 */
import { prisma } from "@/lib/db";
import { isDPO, INVENTORY_STATUS } from "@/lib/auth-helpers";
import { buildDiagnostico } from "@/lib/diagnostico-scoring";

/** Prioridade visual + ordenação dentro da fase. */
export type ProximaEtapaPriority = "alta" | "media" | "baixa";

/** De onde a etapa veio (analytics + UI dica). */
export type ProximaEtapaSource = "workflow" | "diagnostico";

/**
 * Fase do PGP a que a etapa pertence — ordena a lista (ascendente).
 *  0 = Preliminar (Sensibilização / Capacitação)
 *  1 = Formação das Equipes
 *  2 = Diagnóstico Inicial
 *  3 = Mapeamento e Análise de Riscos (Inventário + Riscos + Bases)
 *  4 = GAP Analysis
 *  5 = Plano de Ação
 *  6 = Execução (Políticas + RIPDs + LIA + Terceiros)
 *  7 = Monitoramento (Incidentes)
 */
export type ProximaEtapaPhase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const PHASE_LABEL: Record<ProximaEtapaPhase, string> = {
  0: "Preliminar",
  1: "Fase 1",
  2: "Fase 2",
  3: "Fase 3",
  4: "Fase 4",
  5: "Fase 5",
  6: "Fase 6",
  7: "Fase 7",
};

/** Um item da lista. */
export interface ProximaEtapa {
  /** ID estável, único por usuário (usado como key React). */
  id: string;
  /** Frase principal — começa com verbo no imperativo. */
  title: string;
  /** Detalhe opcional (1 linha). */
  description?: string;
  /** Link clicável que leva pra ação. */
  href: string;
  priority: ProximaEtapaPriority;
  source: ProximaEtapaSource;
  /** Ícone lucide (nome string, resolvido no client). */
  icon: string;
  /** Fase do PGP — ordena a lista. */
  phase: ProximaEtapaPhase;
}

interface UserCtx {
  id: string;
  role: string;
  companyId: string;
}

/** Pondera prioridade pra ordenação numérica (alta > media > baixa). */
function priorityWeight(p: ProximaEtapaPriority): number {
  return p === "alta" ? 3 : p === "media" ? 2 : 1;
}

/** Trunca título mantendo final legível. */
function trunc(s: string, n = 60): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

/* =========================================================================
 * Regras de workflow PRA DPO — baseadas em status das tabelas existentes.
 * ========================================================================= */

async function dpoWorkflowEtapas(user: UserCtx): Promise<ProximaEtapa[]> {
  const out: ProximaEtapa[] = [];
  const companyId = user.companyId;

  // Roda em paralelo
  const [
    pendingInventarios,
    pendingRipds,
    pendingLias,
    openIncidents,
    invSemRipd,
    politicaPriv,
    politicaCookies,
    lastGapSnapshot,
    operadoresPendentes,
  ] = await Promise.all([
    prisma.dataInventory.findMany({
      where: {
        companyId,
        status: { in: [INVENTORY_STATUS.SUBMETIDO, INVENTORY_STATUS.EM_REVISAO] },
      },
      select: { id: true, serviceName: true, status: true, updatedAt: true },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.ripd.findMany({
      where: { companyId, status: "EM_REVISAO" },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.lia.findMany({
      where: { companyId, status: "EM_REVISAO" },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.incident.findMany({
      where: {
        companyId,
        severity: { in: ["ALTO", "MEDIO"] },
        status: { notIn: ["ENCERRADO", "FALSO_POSITIVO"] },
        anpdNotifiedAt: null,
      },
      select: { id: true, title: true, severity: true, detectedAt: true },
      orderBy: { detectedAt: "desc" },
    }),
    prisma.dataInventory.findMany({
      where: { companyId, status: "APROVADO", ripds: { none: {} } },
      select: { id: true, serviceName: true, updatedAt: true },
      orderBy: { updatedAt: "asc" },
      take: 5,
    }),
    prisma.policy.findFirst({
      where: { companyId, type: "POLITICA_PRIVACIDADE_INTERNO" },
      select: { id: true, status: true, publishedAt: true },
    }),
    prisma.policy.findFirst({
      where: { companyId, type: "POLITICA_COOKIES" },
      select: { id: true, status: true, publishedAt: true },
    }),
    prisma.gapSnapshot.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    // Operadores com pendência crítica (espelha lógica do pending-count)
    prisma.operator.findMany({
      where: {
        companyId,
        OR: [
          { contractStatus: "VENCIDO" },
          { contractStatus: "SEM_CONTRATO" },
          { contractRiskClass: "ALTO" },
        ],
      },
      select: { id: true, name: true, contractStatus: true },
      take: 5,
    }),
  ]);

  // Inventários aguardando aprovação — Fase 3 (Mapeamento)
  for (const inv of pendingInventarios.slice(0, 3)) {
    out.push({
      id: `wf-inv-${inv.id}`,
      title: `Revisar inventário "${trunc(inv.serviceName, 40)}"`,
      description:
        inv.status === "SUBMETIDO"
          ? "Submetido pelo Contribuidor — abrir e iniciar revisão"
          : "Você está revisando — aprovar ou devolver",
      href: `/dashboard/inventario`,
      priority: "alta",
      source: "workflow",
      icon: "ClipboardList",
      phase: 3,
    });
  }

  // RIPDs em revisão — Fase 6 (Execução)
  for (const r of pendingRipds.slice(0, 3)) {
    out.push({
      id: `wf-ripd-${r.id}`,
      title: `Aprovar RIPD "${trunc(r.title, 40)}"`,
      description: "Relatório de Impacto aguardando aprovação do DPO",
      href: `/dashboard/ripd/${r.id}`,
      priority: "alta",
      source: "workflow",
      icon: "FileCheck2",
      phase: 6,
    });
  }

  // LIAs em revisão — Fase 6 (Execução)
  for (const l of pendingLias.slice(0, 3)) {
    out.push({
      id: `wf-lia-${l.id}`,
      title: `Aprovar LIA "${trunc(l.title, 40)}"`,
      description: "Avaliação de Legítimo Interesse aguardando aprovação",
      href: `/dashboard/lia/${l.id}`,
      priority: "alta",
      source: "workflow",
      icon: "Scale",
      phase: 6,
    });
  }

  // Incidentes severidade ALTO/MEDIO sem comunicação ANPD — Fase 7 (Monitoramento)
  for (const inc of openIncidents.slice(0, 3)) {
    out.push({
      id: `wf-inc-${inc.id}`,
      title: `Comunicar incidente "${trunc(inc.title, 40)}" à ANPD`,
      description: `Severidade ${inc.severity} · prazo legal de 72h (Art. 48 LGPD)`,
      href: `/dashboard/incidentes/${inc.id}`,
      priority: "alta",
      source: "workflow",
      icon: "AlertCircle",
      phase: 7,
    });
  }

  // Inventário aprovado SEM RIPD vinculado — Fase 6 (Execução)
  for (const inv of invSemRipd.slice(0, 2)) {
    out.push({
      id: `wf-noripd-${inv.id}`,
      title: `Crie RIPD para "${trunc(inv.serviceName, 40)}"`,
      description: "Processo aprovado — Relatório de Impacto pendente",
      href: `/dashboard/ripd?inventoryId=${inv.id}`,
      priority: "media",
      source: "workflow",
      icon: "FileText",
      phase: 6,
    });
  }

  // Política de Privacidade não publicada — Fase 6 (Execução)
  if (!politicaPriv || politicaPriv.status !== "PUBLICADA") {
    out.push({
      id: "wf-pol-priv",
      title: "Publique a Política de Privacidade",
      description:
        "Política institucional alinhada à Resolução CD/ANPD nº 20/2024",
      href: politicaPriv
        ? `/dashboard/politicas/${politicaPriv.id}`
        : "/dashboard/politicas",
      priority: "alta",
      source: "workflow",
      icon: "FileText",
      phase: 6,
    });
  }

  // Política de Cookies não publicada — Fase 6 (Execução)
  if (!politicaCookies || politicaCookies.status !== "PUBLICADA") {
    out.push({
      id: "wf-pol-cookies",
      title: "Publique a Política de Cookies",
      description: "Necessária pro banner aparecer no site público",
      href: politicaCookies
        ? `/dashboard/politicas/${politicaCookies.id}`
        : "/dashboard/politicas",
      priority: "media",
      source: "workflow",
      icon: "FileText",
      phase: 6,
    });
  }

  // GAP Analysis sem snapshot recente (>90 dias) ou nunca rodado — Fase 4
  if (!lastGapSnapshot) {
    out.push({
      id: "wf-gap-never",
      title: "Rode o primeiro Diagnóstico GAP",
      description:
        "GAP Analysis aponta as 119 lacunas mais críticas pra adequação à LGPD",
      href: "/dashboard/gap-analysis",
      priority: "alta",
      source: "workflow",
      icon: "ClipboardList",
      phase: 4,
    });
  } else {
    const daysAgo =
      (Date.now() - lastGapSnapshot.createdAt.getTime()) / 86_400_000;
    if (daysAgo > 90) {
      out.push({
        id: "wf-gap-stale",
        title: "Reaplique o GAP Analysis",
        description: `Último snapshot há ${Math.round(daysAgo)} dias — ANPD recomenda revisão trimestral`,
        href: "/dashboard/gap-analysis",
        priority: "media",
        source: "workflow",
        icon: "ClipboardList",
        phase: 4,
      });
    }
  }

  // Operadores com pendência crítica — Fase 6 (Execução)
  for (const op of operadoresPendentes.slice(0, 2)) {
    const motivo =
      op.contractStatus === "VENCIDO"
        ? "Contrato vencido"
        : op.contractStatus === "SEM_CONTRATO"
          ? "Sem contrato cadastrado"
          : "Risco contratual ALTO";
    out.push({
      id: `wf-op-${op.id}`,
      title: `Adequar operador "${trunc(op.name, 35)}"`,
      description: motivo,
      href: `/dashboard/terceiros/${op.id}`,
      priority: "media",
      source: "workflow",
      icon: "Handshake",
      phase: 6,
    });
  }

  return out;
}

/* =========================================================================
 * Recomendações do Diagnóstico de Privacidade (só DPO).
 * ========================================================================= */

async function dpoDiagnosticoEtapas(user: UserCtx): Promise<ProximaEtapa[]> {
  const companyId = user.companyId;

  const [inventories, risks, gapAnswers] = await Promise.all([
    prisma.dataInventory.findMany({
      where: { companyId },
      select: {
        id: true,
        serviceName: true,
        setor: true,
        status: true,
        dataCategory: true,
        legalBasis: true,
        legalBasisSensitive: true,
        legalBasisComments: true,
      },
    }),
    prisma.processRisk.findMany({
      where: { companyId },
      select: {
        id: true,
        dataInventoryId: true,
        riskCode: true,
        status: true,
        severityLevel: true,
        mitigationPlan: true,
      },
    }),
    prisma.gapAnswer.findMany({
      where: { companyId },
      select: {
        controlCode: true,
        aderencia: true,
        mapeamento: true,
        pontoMelhoria: true,
      },
    }),
  ]);

  const approvedCount = inventories.filter(
    (i) => i.status === "APROVADO",
  ).length;
  const inventoryNameById: Record<string, string> = {};
  for (const i of inventories) inventoryNameById[i.id] = i.serviceName;

  const out = buildDiagnostico({
    inventories,
    risks,
    gapAnswers,
    approvedCount,
    inventoryNameById,
  });

  // Pega só top 5 do diagnóstico — workflow já cobre o urgente, isso aqui
  // entra como fonte estratégica.
  // Mapeia source → fase do PGP: RISCO/BASES → Fase 3 · GAP → Fase 4
  return out.recommendations.slice(0, 5).map((rec) => {
    const phase: ProximaEtapaPhase =
      rec.source === "GAP" ? 4 : 3;
    return {
      id: `diag-${rec.id}`,
      title: rec.title,
      description: rec.description,
      href: rec.href,
      priority:
        rec.priority === "ALTA"
          ? "alta"
          : rec.priority === "MEDIA"
            ? "media"
            : "baixa",
      source: "diagnostico" as const,
      icon:
        rec.source === "RISCO"
          ? "ShieldAlert"
          : rec.source === "GAP"
            ? "ClipboardList"
            : "Scale",
      phase,
    };
  });
}

/* =========================================================================
 * Regras de workflow PRA CONTRIBUIDOR.
 * ========================================================================= */

async function contribuidorWorkflowEtapas(user: UserCtx): Promise<ProximaEtapa[]> {
  const out: ProximaEtapa[] = [];
  const companyId = user.companyId;
  const userId = user.id;

  const [
    invDevolvidos,
    invRascunhos,
    ripdsDevolvidos,
    liasDevolvidas,
    tasksAtrasadas,
    tasksVencendo,
  ] = await Promise.all([
    prisma.dataInventory.findMany({
      where: {
        companyId,
        createdById: userId,
        status: INVENTORY_STATUS.DEVOLVIDO,
      },
      select: {
        id: true,
        serviceName: true,
        reviewComment: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.dataInventory.findMany({
      where: {
        companyId,
        createdById: userId,
        status: INVENTORY_STATUS.RASCUNHO,
      },
      select: { id: true, serviceName: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
    prisma.ripd.findMany({
      where: {
        companyId,
        createdById: userId,
        status: "RASCUNHO",
        rejectionNote: { not: null },
      },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
    prisma.lia.findMany({
      where: {
        companyId,
        createdById: userId,
        status: "RASCUNHO",
        rejectionNote: { not: null },
      },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
    // Tarefas atrasadas (vencidas)
    prisma.task.findMany({
      where: {
        userId,
        status: { not: "CONCLUIDA" },
        dueDate: { lt: new Date() },
      },
      select: { id: true, title: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 3,
    }),
    // Tarefas vencendo nos próximos 7 dias
    prisma.task.findMany({
      where: {
        userId,
        status: { not: "CONCLUIDA" },
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 86_400_000),
        },
      },
      select: { id: true, title: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 3,
    }),
  ]);

  // Inventários devolvidos pelo DPO — Fase 3
  for (const inv of invDevolvidos.slice(0, 3)) {
    out.push({
      id: `wf-c-inv-dev-${inv.id}`,
      title: `Ajustar inventário "${trunc(inv.serviceName, 40)}"`,
      description: inv.reviewComment
        ? `DPO devolveu: "${trunc(inv.reviewComment, 60)}"`
        : "Devolvido pelo DPO — abrir e re-submeter",
      href: `/dashboard/inventario/${inv.id}/editar`,
      priority: "alta",
      source: "workflow",
      icon: "ClipboardList",
      phase: 3,
    });
  }

  // Inventários em rascunho — Fase 3
  for (const inv of invRascunhos.slice(0, 2)) {
    out.push({
      id: `wf-c-inv-rasc-${inv.id}`,
      title: `Continuar inventário "${trunc(inv.serviceName, 40)}"`,
      description: "Rascunho aberto — concluir e submeter ao DPO",
      href: `/dashboard/inventario/${inv.id}/editar`,
      priority: "media",
      source: "workflow",
      icon: "ClipboardList",
      phase: 3,
    });
  }

  // RIPDs devolvidos — Fase 6
  for (const r of ripdsDevolvidos.slice(0, 3)) {
    out.push({
      id: `wf-c-ripd-${r.id}`,
      title: `Ajustar RIPD "${trunc(r.title, 40)}"`,
      description: "Devolvido pelo DPO — revisar e re-submeter",
      href: `/dashboard/ripd/${r.id}`,
      priority: "alta",
      source: "workflow",
      icon: "FileCheck2",
      phase: 6,
    });
  }

  // LIAs devolvidas — Fase 6
  for (const l of liasDevolvidas.slice(0, 3)) {
    out.push({
      id: `wf-c-lia-${l.id}`,
      title: `Ajustar LIA "${trunc(l.title, 40)}"`,
      description: "Devolvida pelo DPO — revisar e re-submeter",
      href: `/dashboard/lia/${l.id}`,
      priority: "alta",
      source: "workflow",
      icon: "Scale",
      phase: 6,
    });
  }

  // Tarefas atrasadas — sem fase específica → Fase 5 (Plano de Ação) é o
  // mais próximo conceitualmente. Tarefas pessoais entram aqui.
  for (const t of tasksAtrasadas.slice(0, 2)) {
    out.push({
      id: `wf-c-task-late-${t.id}`,
      title: `Concluir tarefa "${trunc(t.title, 40)}"`,
      description: "Atrasada",
      href: `/dashboard/tarefas`,
      priority: "alta",
      source: "workflow",
      icon: "ListChecks",
      phase: 5,
    });
  }

  // Tarefas vencendo — Fase 5
  for (const t of tasksVencendo.slice(0, 2)) {
    out.push({
      id: `wf-c-task-due-${t.id}`,
      title: `Concluir tarefa "${trunc(t.title, 40)}"`,
      description: "Vence em até 7 dias",
      href: `/dashboard/tarefas`,
      priority: "media",
      source: "workflow",
      icon: "ListChecks",
      phase: 5,
    });
  }

  return out;
}

/* =========================================================================
 * Entry point.
 * ========================================================================= */

/**
 * Retorna a lista priorizada de "Próximas etapas" pro user.
 *
 * DPO: workflow rules + diagnóstico (top 5)
 * Contribuidor: só workflow rules
 */
export async function getProximasEtapas(user: UserCtx): Promise<ProximaEtapa[]> {
  const isUserDPO = isDPO(user.role);

  const [workflow, diagnostico] = await Promise.all([
    isUserDPO ? dpoWorkflowEtapas(user) : contribuidorWorkflowEtapas(user),
    isUserDPO ? dpoDiagnosticoEtapas(user) : Promise.resolve([] as ProximaEtapa[]),
  ]);

  // Ordenação pelas FASES do PGP (decisão do user em 2026-05-08):
  //   1) Fase ASC — segue o caminho didático do programa (Fase 3 antes
  //      de Fase 4 antes de Fase 6, etc.)
  //   2) Prioridade DESC dentro da mesma fase
  //   3) Workflow antes de Diagnóstico em empate (workflow é mais
  //      imediato; diagnóstico é estratégico)
  const merged = [...workflow, ...diagnostico];
  merged.sort((a, b) => {
    if (a.phase !== b.phase) return a.phase - b.phase;
    const dp = priorityWeight(b.priority) - priorityWeight(a.priority);
    if (dp !== 0) return dp;
    if (a.source !== b.source) return a.source === "workflow" ? -1 : 1;
    return 0;
  });

  // Cap em 30 itens — UI mostra 3 + expansível, mas evita listas absurdas
  return merged.slice(0, 30);
}
