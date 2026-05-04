"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  ShieldAlert,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Target,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Renderiza os mini-apps nativos da fase passada (Inventário, Análise de
 * Riscos, GAP, etc.). Cada fase tem seu conjunto.
 *
 * Hoje suporta:
 *   - fase-3 → Inventário + Análise de Riscos
 *   - fase-4 → GAP Analysis
 *   - fase-5 → Plano de Ação institucional
 *
 * Pra adicionar uma nova fase, basta criar uma branch no switch principal
 * que renderize os cards relevantes (idealmente em arquivos separados quando
 * crescer demais).
 *
 * Usa o componente <ToolCard> reusável pros cards individuais. Ele calcula
 * cor da borda esquerda baseada em progresso (cinza → âmbar → verde) e
 * suporta ações primária/secundária.
 */
export default function PhaseNativeTools({ phase }: { phase: string }) {
  if (phase === "fase-3") {
    return <Fase3Tools />;
  }
  if (phase === "fase-4") {
    return <Fase4Tools />;
  }
  if (phase === "fase-5") {
    return <Fase5Tools />;
  }
  // Outras fases ainda sem mini-apps nativos.
  return null;
}

/** Indica se uma fase tem ferramentas nativas (pra `PhasePracticalLinks`
 * decidir se mostra ou não a mensagem "nenhum link adicionado"). */
export function phaseHasNativeTools(phase: string): boolean {
  return phase === "fase-3" || phase === "fase-4" || phase === "fase-5";
}

// ============================================================
// Fase 3 — Inventário + Análise de Riscos
// ============================================================

interface InventoryItem {
  id: string;
  status: string;
  isDraft?: boolean;
  serviceName: string;
  updatedAt: string;
}

interface RiscosResponse {
  items: Array<{ id: string; analyzed: boolean; totalRisks: number }>;
  stats: {
    totalProcesses: number;
    analyzedCount: number;
    pendingCount: number;
    totalRisks: number;
  };
}

function Fase3Tools() {
  const [inv, setInv] = useState<InventoryItem[] | null>(null);
  const [riscos, setRiscos] = useState<RiscosResponse | null>(null);
  const [riscosForbidden, setRiscosForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Inventário: todos os papéis têm acesso (filtrado server-side)
        const invRes = await fetch("/api/inventario");
        if (invRes.ok) {
          setInv(await invRes.json());
        }

        // Riscos: só DPO. Contribuidor recebe 403 → mostra estado limitado.
        const rRes = await fetch("/api/riscos");
        if (rRes.ok) {
          setRiscos(await rRes.json());
        } else if (rRes.status === 403) {
          setRiscosForbidden(true);
        }
      } catch {
        // silencioso — UI mostra estado de erro genérico
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Stats do Inventário
  const invStats = (() => {
    if (!inv) return null;
    const aprovados = inv.filter((i) => i.status === "APROVADO").length;
    const rascunhos = inv.filter(
      (i) => i.status === "RASCUNHO" || i.isDraft
    ).length;
    const submetidos = inv.filter((i) => i.status === "SUBMETIDO").length;
    const emRevisao = inv.filter((i) => i.status === "EM_REVISAO").length;
    const devolvidos = inv.filter((i) => i.status === "DEVOLVIDO").length;
    const ultimoRascunho = inv
      .filter((i) => i.status === "RASCUNHO" || i.isDraft)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];
    return {
      total: inv.length,
      aprovados,
      rascunhos,
      submetidos,
      emRevisao,
      devolvidos,
      ultimoRascunho,
    };
  })();

  // Cor de progresso do card Inventário
  const invColor: ToolCardColor = !invStats || invStats.total === 0
    ? "neutral"
    : invStats.aprovados > 0
    ? "success"
    : "warning";

  // Cor de progresso do card Análise de Riscos
  const riscosColor: ToolCardColor = riscosForbidden
    ? "neutral"
    : !riscos || riscos.stats.totalProcesses === 0
    ? "neutral"
    : riscos.stats.pendingCount === 0
    ? "success"
    : "warning";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* ===== Card Inventário ===== */}
      <ToolCard
        icon={<ClipboardList className="h-6 w-6" />}
        iconColor="text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/40"
        title="Inventário de Dados"
        description="Mapeie cada processo de tratamento de dados pessoais da organização."
        progressColor={invColor}
        loading={loading}
        primaryAction={{
          label:
            invStats && invStats.total > 0
              ? "Abrir Inventário"
              : "Iniciar Inventário",
          href: "/dashboard/inventario",
        }}
        secondaryAction={
          invStats?.ultimoRascunho
            ? {
                label: "Continuar último rascunho",
                href: `/dashboard/inventario/${invStats.ultimoRascunho.id}/editar`,
                icon: <PlayCircle className="h-4 w-4" />,
              }
            : undefined
        }
        stats={
          invStats && invStats.total > 0
            ? [
                {
                  label: "processos",
                  value: invStats.total,
                  icon: <ClipboardList className="h-3.5 w-3.5" />,
                },
                {
                  label: "aprovados",
                  value: invStats.aprovados,
                  color: "emerald",
                  icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                },
                {
                  label: "rascunhos",
                  value: invStats.rascunhos,
                  color: "amber",
                  icon: <Clock className="h-3.5 w-3.5" />,
                },
                ...(invStats.submetidos + invStats.emRevisao > 0
                  ? [
                      {
                        label: "em revisão",
                        value: invStats.submetidos + invStats.emRevisao,
                        color: "blue" as const,
                        icon: <AlertCircle className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
                ...(invStats.devolvidos > 0
                  ? [
                      {
                        label: "devolvidos",
                        value: invStats.devolvidos,
                        color: "red" as const,
                        icon: <AlertCircle className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
              ]
            : []
        }
        emptyHint="Você ainda não cadastrou nenhum processo. Comece pelo primeiro mapeamento."
      />

      {/* ===== Card Análise de Riscos ===== */}
      <ToolCard
        icon={<ShieldAlert className="h-6 w-6" />}
        iconColor="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/40"
        title="Análise de Riscos"
        description="Identifique os riscos LGPD em cada processo aprovado e classifique seu nível."
        progressColor={riscosColor}
        loading={loading}
        primaryAction={{
          label:
            riscos && riscos.stats.totalProcesses > 0
              ? "Abrir Análise de Riscos"
              : "Abrir painel",
          href: "/dashboard/riscos",
        }}
        stats={
          riscosForbidden
            ? []
            : riscos && riscos.stats.totalProcesses > 0
            ? [
                {
                  label: "processos aprovados",
                  value: riscos.stats.totalProcesses,
                  icon: <ClipboardList className="h-3.5 w-3.5" />,
                },
                {
                  label: "analisados",
                  value: riscos.stats.analyzedCount,
                  color: "emerald",
                  icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                },
                ...(riscos.stats.pendingCount > 0
                  ? [
                      {
                        label: "pendentes",
                        value: riscos.stats.pendingCount,
                        color: "amber" as const,
                        icon: <Clock className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
                ...(riscos.stats.totalRisks > 0
                  ? [
                      {
                        label: "riscos identificados",
                        value: riscos.stats.totalRisks,
                        color: "red" as const,
                        icon: <AlertCircle className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
              ]
            : []
        }
        emptyHint={
          riscosForbidden
            ? "Esta tela é trabalhada pelo DPO da organização."
            : !riscos || riscos.stats.totalProcesses === 0
            ? "Aprove pelo menos 1 processo no Inventário pra começar a Análise de Riscos."
            : undefined
        }
      />
    </div>
  );
}

// ============================================================
// Fase 4 — GAP Analysis
// ============================================================

interface GapResp {
  answers: Array<{ controlCode: string; autoSuggested: boolean }>;
  stats: {
    total: number;
    answered: number;
    confirmed: number;
    autoSuggested: number;
    byAderencia: Record<string, number>;
  };
  suggestions: Record<string, unknown> | null;
}

function Fase4Tools() {
  const [gap, setGap] = useState<GapResp | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/gap?withSuggestions=1");
        if (res.ok) {
          setGap(await res.json());
        } else if (res.status === 403) {
          setForbidden(true);
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = gap?.stats.total ?? 119;
  const answered = gap?.stats.answered ?? 0;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  // Cor da borda esquerda do card
  const color: ToolCardColor = forbidden
    ? "neutral"
    : answered === 0
      ? "neutral"
      : answered === total
        ? "success"
        : "warning";

  const naoAderente = gap?.stats.byAderencia.NAO_ADERENTE ?? 0;
  const sugestoes = gap?.suggestions ? Object.keys(gap.suggestions).length : 0;

  return (
    <div className="grid grid-cols-1 gap-4">
      <ToolCard
        icon={<ClipboardList className="h-6 w-6" />}
        iconColor="text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40"
        title="GAP Analysis"
        description="Diagnóstico macro de adequação à LGPD: 119 controles em 28 domínios, baseados no template oficial LGPD PRO."
        progressColor={color}
        loading={loading}
        primaryAction={{
          label: answered > 0 ? "Continuar diagnóstico" : "Iniciar diagnóstico",
          href: "/dashboard/gap-analysis",
        }}
        stats={
          forbidden
            ? []
            : gap
              ? [
                  {
                    label: `de ${total} controles respondidos (${pct}%)`,
                    value: answered,
                    icon: <ClipboardList className="h-3.5 w-3.5" />,
                  },
                  {
                    label: "confirmados pelo DPO",
                    value: gap.stats.confirmed,
                    color: "emerald",
                    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                  },
                  ...(naoAderente > 0
                    ? [
                        {
                          label: "não aderente(s)",
                          value: naoAderente,
                          color: "red" as const,
                          icon: <AlertCircle className="h-3.5 w-3.5" />,
                        },
                      ]
                    : []),
                  ...(sugestoes > 0
                    ? [
                        {
                          label: "sugestão(ões) auto pendente(s)",
                          value: sugestoes,
                          color: "amber" as const,
                          icon: <Clock className="h-3.5 w-3.5" />,
                        },
                      ]
                    : []),
                ]
              : []
        }
        emptyHint={
          forbidden
            ? "Esta tela é trabalhada pelo DPO da organização."
            : answered === 0
              ? "Você ainda não começou. Abra o GAP pra ver as sugestões automáticas vindas do Inventário."
              : undefined
        }
      />
    </div>
  );
}

// ============================================================
// Fase 5 — Plano de Ação institucional
// ============================================================

interface PlanoAcaoResp {
  items: Array<{ id: string; status: string; priority: string; origin: string }>;
  stats: {
    total: number;
    byStatus: { A_FAZER: number; EM_ANDAMENTO: number; CONCLUIDA: number; CANCELADA: number };
    byPriority: { ALTA: number; MEDIA: number; BAIXA: number };
    byOrigin: { MANUAL: number; GAP: number; RISCO: number; BASES: number };
    overdue: number;
    dueSoon: number;
  };
}

function Fase5Tools() {
  const [plano, setPlano] = useState<PlanoAcaoResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Plano de Ação é visível pra DPO (tudo) e Contribuidor (próprias)
        // — sempre 200, sem 403. UI mostra contagens conforme escopo.
        const res = await fetch("/api/plano-acao");
        if (res.ok) setPlano(await res.json());
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = plano?.stats.total ?? 0;
  const emAberto =
    (plano?.stats.byStatus.A_FAZER ?? 0) +
    (plano?.stats.byStatus.EM_ANDAMENTO ?? 0);
  const concluidas = plano?.stats.byStatus.CONCLUIDA ?? 0;
  const overdue = plano?.stats.overdue ?? 0;
  const dueSoon = plano?.stats.dueSoon ?? 0;

  // Cor de progresso:
  //   - neutral: sem ações
  //   - success: total > 0 e nada em aberto (tudo concluído/cancelado)
  //   - warning: tem coisas em aberto
  const color: ToolCardColor =
    total === 0 ? "neutral" : emAberto === 0 ? "success" : "warning";

  return (
    <div className="grid grid-cols-1 gap-4">
      <ToolCard
        icon={<Target className="h-6 w-6" />}
        iconColor="text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/40"
        title="Plano de Ação"
        description="Lista oficial das ações da organização pra adequação à LGPD — com responsável formal, prazo e prioridade. Aceita import automático de gaps, riscos e bases legais pendentes."
        progressColor={color}
        loading={loading}
        primaryAction={{
          label: total > 0 ? "Abrir Plano de Ação" : "Iniciar Plano de Ação",
          href: "/dashboard/plano-acao",
        }}
        stats={
          plano && total > 0
            ? [
                {
                  label: "ações totais",
                  value: total,
                  icon: <Target className="h-3.5 w-3.5" />,
                },
                {
                  label: "em aberto",
                  value: emAberto,
                  color: "amber",
                  icon: <Clock className="h-3.5 w-3.5" />,
                },
                {
                  label: "concluídas",
                  value: concluidas,
                  color: "emerald",
                  icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                },
                ...(overdue > 0
                  ? [
                      {
                        label: "atrasadas",
                        value: overdue,
                        color: "red" as const,
                        icon: <AlertCircle className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
                ...(dueSoon > 0
                  ? [
                      {
                        label: "vencendo (7d)",
                        value: dueSoon,
                        color: "amber" as const,
                        icon: <CalendarDays className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
              ]
            : []
        }
        emptyHint={
          total === 0
            ? "Nenhuma ação cadastrada. Use \"Importar pendentes\" pra criar ações automaticamente a partir do GAP, Riscos e Bases Legais."
            : undefined
        }
      />
    </div>
  );
}

// ============================================================
// ToolCard — componente reusável pros cards de mini-app
// ============================================================

type ToolCardColor = "neutral" | "warning" | "success";
type StatColor = "default" | "emerald" | "amber" | "blue" | "red";

interface Stat {
  label: string;
  value: number | string;
  color?: StatColor;
  icon?: React.ReactNode;
}

interface ToolCardProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
  progressColor: ToolCardColor;
  loading?: boolean;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string; icon?: React.ReactNode };
  stats: Stat[];
  emptyHint?: string;
}

const STAT_COLOR_CLASSES: Record<StatColor, string> = {
  default: "text-gray-700 dark:text-gray-300",
  emerald: "text-emerald-700 dark:text-emerald-300",
  amber: "text-amber-700 dark:text-amber-300",
  blue: "text-blue-700 dark:text-blue-300",
  red: "text-red-700 dark:text-red-300",
};

const PROGRESS_BORDER: Record<ToolCardColor, string> = {
  neutral: "border-l-gray-300 dark:border-l-gray-700",
  warning: "border-l-amber-400 dark:border-l-amber-500",
  success: "border-l-emerald-500 dark:border-l-emerald-500",
};

function ToolCard({
  icon,
  iconColor,
  title,
  description,
  progressColor,
  loading,
  primaryAction,
  secondaryAction,
  stats,
  emptyHint,
}: ToolCardProps) {
  return (
    <div
      className={cn(
        "border rounded-lg p-4 bg-white dark:bg-gray-950 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-900/30",
        "border-l-4",
        PROGRESS_BORDER[progressColor]
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("p-2 rounded-lg shrink-0", iconColor)}>{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="text-xs text-gray-400 mb-3">Carregando…</div>
      ) : stats.length > 0 ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3 text-sm">
          {stats.map((s, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center gap-1.5",
                STAT_COLOR_CLASSES[s.color ?? "default"]
              )}
            >
              {s.icon}
              <strong className="font-bold">{s.value}</strong>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {s.label}
              </span>
            </span>
          ))}
        </div>
      ) : emptyHint ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-3">
          {emptyHint}
        </p>
      ) : null}

      {/* Ações */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button asChild size="sm">
          <Link href={primaryAction.href}>
            {primaryAction.label}
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </Button>
        {secondaryAction && (
          <Button asChild variant="outline" size="sm">
            <Link href={secondaryAction.href}>
              {secondaryAction.icon}
              <span className={secondaryAction.icon ? "ml-1.5" : ""}>
                {secondaryAction.label}
              </span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
