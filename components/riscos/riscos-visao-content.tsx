"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  AlertTriangle,
  Activity,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Pause,
  Hourglass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RISCOS_CATALOG,
  RISCOS_BY_CODE,
  type RiskCode,
} from "@/lib/riscos-catalog";
import RiskRadarChart from "./risk-radar-chart";

interface VisaoStats {
  totalRisks: number;
  bySeverityByCode: Record<
    string,
    { ALTO: number; MEDIO: number; BAIXO: number; NONE: number }
  >;
  bySeverity: { ALTO: number; MEDIO: number; BAIXO: number; NONE: number };
  byStatusAgg: Record<string, number>;
  topCriticos: Array<{
    processId: string;
    processName: string;
    setor: string | null;
    riskCode: string;
    identifiedAt: string;
  }>;
}

interface RadarItem {
  id: string;
  serviceName: string;
  setor: string | null;
  codes: string[];
  totalRisks: number;
}

interface Props {
  stats: VisaoStats;
  items: RadarItem[];
}

/**
 * Visão consolidada de Riscos com gráficos (Checkpoint 7).
 * Lê os agregados que `/api/riscos` já devolve e renderiza:
 *   - Stacked bars por tipo de risco (13 barras × 4 segmentos de severidade)
 *   - Bar de severidade agregada
 *   - Bar de status do ciclo de vida
 *   - Top 5 críticos (severidade ALTO + status IDENTIFICADO, ordenados pelo
 *     mais antigo = parado há mais tempo)
 */
export default function RiscosVisaoContent({ stats, items }: Props) {
  if (stats.totalRisks === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center space-y-3">
          <Activity className="h-10 w-10 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nenhum risco identificado ainda
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            A visão consolidada ganha dado quando você marcar pelo menos
            1 risco em algum processo. Volte aqui depois de rodar a
            Análise de Riscos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mapa radar dos 13 tipos de risco — vista panorâmica.
          Decisão UX 2026-05-09:
            - W1+X1+Y1+Z1: radar único agregado no topo
            - B+1+B+3: filtro setor (chips multi-select) + modo
              comparação multi-radar com cada processo como camada */}
      <RiskRadarChart items={items} totalRisks={stats.totalRisks} />

      {/* Severidade agregada */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Severidade agregada da organização
            </h2>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Distribuição dos {stats.totalRisks} riscos identificados na org
            por nível de severidade. "Sem classif." = riscos identificados
            mas que ainda não tiveram a matriz Probabilidade × Impacto
            preenchida no detalhamento.
          </p>
          <StackedBar
            total={stats.totalRisks}
            segments={[
              { value: stats.bySeverity.ALTO, label: "Alto", cls: "bg-red-500" },
              { value: stats.bySeverity.MEDIO, label: "Médio", cls: "bg-amber-500" },
              { value: stats.bySeverity.BAIXO, label: "Baixo", cls: "bg-emerald-500" },
              { value: stats.bySeverity.NONE, label: "Sem classif.", cls: "bg-gray-300 dark:bg-gray-700" },
            ]}
          />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-700 dark:text-gray-300">
            <LegendItem cls="bg-red-500" label="Alto" value={stats.bySeverity.ALTO} total={stats.totalRisks} />
            <LegendItem cls="bg-amber-500" label="Médio" value={stats.bySeverity.MEDIO} total={stats.totalRisks} />
            <LegendItem cls="bg-emerald-500" label="Baixo" value={stats.bySeverity.BAIXO} total={stats.totalRisks} />
            <LegendItem cls="bg-gray-300 dark:bg-gray-700 border border-gray-400" label="Sem classif." value={stats.bySeverity.NONE} total={stats.totalRisks} />
          </div>
        </CardContent>
      </Card>

      {/* Status do ciclo de vida */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Status do ciclo de vida
            </h2>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Em que fase de tratamento está cada risco. "Identificado" parado
            é o que mais conta negativo no Diagnóstico — vire pra "Em
            mitigação" assim que tiver plano.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatusCard
              icon={<AlertTriangle className="h-5 w-5" />}
              label="Identificado"
              value={stats.byStatusAgg.IDENTIFICADO ?? 0}
              tone="red"
              hint="Marcado mas sem ação"
            />
            <StatusCard
              icon={<Hourglass className="h-5 w-5" />}
              label="Em mitigação"
              value={stats.byStatusAgg.EM_MITIGACAO ?? 0}
              tone="amber"
              hint="Plano em execução"
            />
            <StatusCard
              icon={<Pause className="h-5 w-5" />}
              label="Aceito"
              value={stats.byStatusAgg.ACEITO ?? 0}
              tone="blue"
              hint="Org decidiu seguir"
            />
            <StatusCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Eliminado"
              value={stats.byStatusAgg.ELIMINADO ?? 0}
              tone="emerald"
              hint="Mitigado e confirmado"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stacked bars por tipo de risco (13 barras) */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Distribuição por tipo de risco (13 categorias LGPD)
            </h2>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Cada barra = quantos processos têm esse tipo de risco identificado.
            Cores mostram a distribuição de severidade dentro do tipo.
          </p>
          <div className="space-y-2.5">
            {RISCOS_CATALOG.map((def) => {
              const counts = stats.bySeverityByCode[def.code] ?? {
                ALTO: 0, MEDIO: 0, BAIXO: 0, NONE: 0,
              };
              const total = counts.ALTO + counts.MEDIO + counts.BAIXO + counts.NONE;
              return (
                <RiskTypeBar
                  key={def.code}
                  code={def.code}
                  label={def.shortLabel}
                  total={total}
                  counts={counts}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top 5 críticos (ALTO + IDENTIFICADO, parados há mais tempo) */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top 5 críticos parados
            </h2>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Riscos com severidade Alta + status Identificado, ordenados do
            mais antigo (parado há mais tempo). São os que mais pesam na
            sua nota de adequação.
          </p>
          {stats.topCriticos.length === 0 ? (
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-4 text-center text-sm text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5 mx-auto mb-1" />
              Nenhum risco crítico parado no momento. 🎉
            </div>
          ) : (
            <ul className="space-y-2">
              {stats.topCriticos.map((c, i) => {
                const def = RISCOS_BY_CODE[c.riskCode as RiskCode];
                const days = Math.floor(
                  (Date.now() - new Date(c.identifiedAt).getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                return (
                  <li
                    key={`${c.processId}-${c.riskCode}`}
                    className="flex items-start gap-3 p-3 rounded-md border border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/10"
                  >
                    <div className="shrink-0 w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {def?.shortLabel ?? c.riskCode} —{" "}
                        <span className="text-gray-700 dark:text-gray-300">
                          {c.processName}
                        </span>
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {c.setor && <>Setor: {c.setor} · </>}
                        Identificado há {days} dia{days === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="shrink-0">
                      <Link
                        href={`/dashboard/inventario/${c.processId}/risco/${c.riskCode}`}
                      >
                        Detalhar
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// StackedBar
// ============================================================

function StackedBar({
  total,
  segments,
}: {
  total: number;
  segments: { value: number; label: string; cls: string }[];
}) {
  if (total === 0) {
    return <div className="h-7 bg-gray-100 dark:bg-gray-800 rounded" />;
  }
  return (
    <div className="flex w-full rounded overflow-hidden bg-gray-100 dark:bg-gray-800 h-7">
      {segments.map((s, i) => {
        if (s.value === 0) return null;
        const pct = (s.value / total) * 100;
        return (
          <div
            key={i}
            className={cn(s.cls, "flex items-center justify-center text-[10px] font-medium text-white/95")}
            style={{ width: `${pct}%`, minWidth: "1.5%" }}
            title={`${s.label}: ${s.value} (${Math.round(pct)}%)`}
          >
            {pct >= 8 ? s.value : ""}
          </div>
        );
      })}
    </div>
  );
}

function LegendItem({
  cls,
  label,
  value,
  total,
}: {
  cls: string;
  label: string;
  value: number;
  total: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("inline-block w-3 h-3 rounded-sm", cls)} />
      {label}
      <span className="text-gray-500 dark:text-gray-400">
        ({value}/{total})
      </span>
    </span>
  );
}

// ============================================================
// StatusCard
// ============================================================

function StatusCard({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "red" | "amber" | "blue" | "emerald";
  hint: string;
}) {
  const toneCls: Record<typeof tone, string> = {
    red: "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300",
    amber: "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300",
    blue: "border-blue-300 bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300",
  };
  return (
    <div className={cn("border rounded-md p-3 text-center", toneCls[tone])}>
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium">{label}</div>
      <div className="text-[10px] opacity-75">{hint}</div>
    </div>
  );
}

// ============================================================
// RiskTypeBar — uma linha por tipo de risco
// ============================================================

function RiskTypeBar({
  code,
  label,
  total,
  counts,
}: {
  code: string;
  label: string;
  total: number;
  counts: { ALTO: number; MEDIO: number; BAIXO: number; NONE: number };
}) {
  return (
    <div className="grid grid-cols-12 gap-3 items-center">
      <div className="col-span-12 sm:col-span-4 min-w-0">
        <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
          {label}
          <Badge
            variant="outline"
            className="font-mono text-[9px] px-1 py-0 ml-1.5 text-gray-500 dark:text-gray-400"
          >
            {code}
          </Badge>
        </div>
        <div className="text-[10px] text-gray-500">
          {total === 0 ? "Sem ocorrência" : `${total} processo(s)`}
        </div>
      </div>
      <div className="col-span-10 sm:col-span-7">
        {total === 0 ? (
          <div className="h-5 bg-gray-50 dark:bg-gray-900 rounded border border-dashed border-gray-200 dark:border-gray-800" />
        ) : (
          <StackedBar
            total={total}
            segments={[
              { value: counts.ALTO, label: "Alto", cls: "bg-red-500" },
              { value: counts.MEDIO, label: "Médio", cls: "bg-amber-500" },
              { value: counts.BAIXO, label: "Baixo", cls: "bg-emerald-500" },
              { value: counts.NONE, label: "Sem classif.", cls: "bg-gray-300 dark:bg-gray-700" },
            ]}
          />
        )}
      </div>
      <div className="col-span-2 sm:col-span-1 text-right">
        {counts.ALTO > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
          >
            {counts.ALTO}
          </Badge>
        )}
      </div>
    </div>
  );
}
