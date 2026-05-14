"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ClipboardList,
  Scale,
  ShieldAlert,
  Target,
  TrendingUp,
  ListTodo,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  scoreColor,
  priorityBadgeClass,
  sourceBadgeClass,
  sourceLabel,
  SUB_SCORE_ORDER,
  type DiagnosticoOutput,
  type SubScoreKey,
} from "@/lib/diagnostico-scoring";
import AddToActionPlanButton from "@/components/plano-acao/add-to-action-plan-button";

const SUB_SCORE_ICON: Record<SubScoreKey, React.ReactNode> = {
  INVENTARIO: <ClipboardList className="h-5 w-5" />,
  BASES: <Scale className="h-5 w-5" />,
  RISCOS: <ShieldAlert className="h-5 w-5" />,
  GAP: <Target className="h-5 w-5" />,
};

const SUB_SCORE_HREF: Record<SubScoreKey, string> = {
  INVENTARIO: "/dashboard/inventario",
  BASES: "/dashboard/bases-legais",
  RISCOS: "/dashboard/riscos",
  GAP: "/dashboard/gap-analysis",
};

const VISIBLE_RECS_INITIAL = 10;

export default function DiagnosticoContent() {
  const [data, setData] = useState<DiagnosticoOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/diagnostico", { cache: "no-store" });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          setError(j.error ?? "Erro ao carregar diagnóstico");
          return;
        }
        setData(await r.json());
      } catch {
        setError("Erro de rede");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-gray-500">
        Carregando Diagnóstico de Privacidade...
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-red-600">
        {error}
      </div>
    );
  }
  if (!data) return null;

  const { score, recommendations, generatedAt, raw } = data;
  const overallColor = scoreColor(score.overall);
  const visibleRecs = showAll
    ? recommendations
    : recommendations.slice(0, VISIBLE_RECS_INITIAL);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2.5 mt-1">
          <Activity className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Diagnóstico de Privacidade
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visão consolidada do estado da LGPD na organização. Pega dados
            do Inventário, Bases Legais, Análise de Riscos e GAP, calcula
            uma nota de maturidade e prioriza o que fazer a seguir.
          </p>
          <p className="text-[11px] text-gray-500 mt-2">
            Atualizado em {new Date(generatedAt).toLocaleString("pt-BR")} ·
            Dados ao vivo (sempre que abre, recalcula).
          </p>
        </div>
      </div>

      {/* Hero — score geral */}
      <Card className={cn("border-2", overallColor.border, overallColor.bg)}>
        <CardContent className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center">
          <div className="flex flex-col items-center justify-center">
            <div
              className={cn(
                "text-7xl font-bold tabular-nums",
                overallColor.text,
              )}
            >
              {score.overall == null ? "—" : score.overall}
              {score.overall != null && (
                <span className="text-2xl font-normal text-gray-500">/100</span>
              )}
            </div>
            <Badge
              variant="outline"
              className={cn("mt-2 px-2.5 py-1", overallColor.text, overallColor.border)}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {score.maturityLabel}
            </Badge>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Maturidade geral em privacidade
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Composto da nota dos 4 pilares abaixo, ponderado por
              relevância (GAP 40% · Riscos 30% · Bases 20% · Inventário 10%).
              {score.overall == null && (
                <>
                  {" "}<strong>Sem dados suficientes ainda</strong> — comece pelo
                  Inventário e os outros pilares se enchem em sequência.
                </>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
              <RawStat label="Processos" value={`${raw.aprovados}/${raw.totalProcessos}`} hint="aprovados" />
              <RawStat label="Bases" value={`${raw.basesCompletas}/${raw.basesCompletas + raw.basesIncompletas}`} hint="completas" />
              <RawStat label="Riscos" value={`${raw.riscosTotal - raw.riscosSemMitigacao}/${raw.riscosTotal}`} hint="sob controle" />
              <RawStat label="GAP" value={`${raw.gapRespondidos}/119`} hint="controles" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4 sub-scores */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Pilares
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUB_SCORE_ORDER.map((key) => {
            const s = score.sub[key];
            const c = scoreColor(s.value);
            return (
              <Link
                key={key}
                href={SUB_SCORE_HREF[key]}
                className={cn(
                  "block border rounded-lg p-4 transition-colors hover:shadow-md",
                  c.border,
                  c.bg,
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={cn("p-2 rounded-md bg-white/60 dark:bg-gray-900/60", c.text)}>
                    {SUB_SCORE_ICON[key]}
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {Math.round(s.weight * 100)}%
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-2">
                  {s.label}
                </h3>
                <div className={cn("text-3xl font-bold mt-1 tabular-nums", c.text)}>
                  {s.value == null ? "—" : `${s.value}`}
                  {s.value != null && (
                    <span className="text-base font-normal text-gray-500">
                      /100
                    </span>
                  )}
                </div>
                {/* Barra de progresso */}
                <div className="h-1.5 bg-white/60 dark:bg-gray-900/60 rounded-full overflow-hidden mt-2">
                  <div
                    className={cn("h-full transition-all", c.bar)}
                    style={{ width: `${s.value ?? 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-2">
                  {s.detail}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  {s.hint}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recomendações priorizadas */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Próximos passos priorizados
            <Badge variant="outline" className="text-xs font-normal">
              {recommendations.length}
            </Badge>
          </h2>
          {recommendations.length > VISIBLE_RECS_INITIAL && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? "Mostrar só os 10 primeiros"
                : `Ver todas (${recommendations.length})`}
            </Button>
          )}
        </div>
        {recommendations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <p className="font-medium text-gray-900 dark:text-white">
                Nada de urgente pendente!
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Não há bases legais faltantes, riscos parados nem pontos de
                melhoria do GAP em aberto. Continue o trabalho normalmente.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {visibleRecs.map((rec) => (
              <Link
                key={rec.id}
                href={rec.href}
                className="block border rounded-lg p-3 bg-white dark:bg-gray-900 dark:border-gray-800 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        priorityBadgeClass(rec.priority),
                      )}
                    >
                      {rec.priority}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        sourceBadgeClass(rec.source),
                      )}
                    >
                      {sourceLabel(rec.source)}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                      {rec.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {rec.description}
                    </p>
                    {rec.context && (
                      <p className="text-[10px] text-gray-500 mt-1">
                        Setor: {rec.context}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2 mt-0.5">
                    <AddToActionPlanButton
                      title={rec.title}
                      description={rec.description}
                      origin={rec.source}
                      refGapCode={rec.refGapCode ?? undefined}
                      refRiskId={rec.refRiskId ?? undefined}
                      refInventoryId={rec.refInventoryId ?? undefined}
                      priority={rec.priority}
                    />
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Composição do score (transparência) */}
      <Card className="bg-gray-50/50 dark:bg-gray-900/30">
        <CardContent className="p-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2 mb-2 text-gray-900 dark:text-white">
            <TrendingUp className="h-4 w-4" />
            <strong>Como o score é calculado</strong>
          </div>
          <p>
            Média ponderada dos 4 pilares (sub-scores que estão em "—"
            ainda não têm dado suficiente e ficam fora da média):
          </p>
          <ul className="list-disc list-inside mt-2 space-y-0.5">
            <li>
              <strong>GAP Analysis (40%)</strong>: Aderente conta 100,
              Parcial conta 50, Não aderente conta 0. N/A não conta.
            </li>
            <li>
              <strong>Riscos (30%)</strong>: % dos riscos identificados que
              estão "Em mitigação", "Aceito" ou "Eliminado". "Identificado"
              parado pesa negativo.
            </li>
            <li>
              <strong>Bases Legais (20%)</strong>: % de processos APROVADOS
              com base legal preenchida (e base sensível, se aplicável).
            </li>
            <li>
              <strong>Inventário (10%)</strong>: % de processos APROVADOS
              entre os cadastrados.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// RawStat — stat pequeno no hero
// ============================================================

function RawStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded bg-white/40 dark:bg-gray-900/40 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-[10px] text-gray-500">{hint}</div>
    </div>
  );
}
