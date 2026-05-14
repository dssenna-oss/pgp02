"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GAP_ADERENCIA,
  type GapStats,
  type GapDomainStats,
  gapAderenciaLabel,
} from "@/lib/gap-helpers";

/**
 * Visão analítica do GAP — agrega o estado por domínio em barras
 * horizontais empilhadas (4 segmentos coloridos = 4 níveis de
 * aderência + sem resposta como "vazio"). Permite ler num relance
 * onde estão as maiores lacunas da organização.
 */
export default function GapDashboard({ stats }: { stats: GapStats }) {
  // Top 5 domínios com mais "Não aderente"
  const topRiscos = [...stats.byDomain]
    .filter((d) => d.byAderencia.NAO_ADERENTE > 0)
    .sort((a, b) => b.byAderencia.NAO_ADERENTE - a.byAderencia.NAO_ADERENTE)
    .slice(0, 5);

  // Top 5 domínios com maior % aderência (entre os já respondidos)
  const topAderentes = [...stats.byDomain]
    .filter((d) => d.answered > 0)
    .map((d) => ({
      ...d,
      pctAderente: Math.round(
        (d.byAderencia.ADERENTE / Math.max(d.answered, 1)) * 100,
      ),
    }))
    .sort((a, b) => b.pctAderente - a.pctAderente)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Distribuição agregada por aderência */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Aderência geral da organização
            </h2>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Distribuição dos {stats.total} controles por nível de aderência
            declarado pelo DPO.
          </p>
          <StackedBar
            total={stats.total}
            segments={[
              {
                value: stats.byAderencia.ADERENTE,
                label: "Aderente",
                cls: "bg-emerald-500",
              },
              {
                value: stats.byAderencia.PARCIAL,
                label: "Parcialmente",
                cls: "bg-amber-500",
              },
              {
                value: stats.byAderencia.NAO_ADERENTE,
                label: "Não aderente",
                cls: "bg-red-500",
              },
              {
                value: stats.byAderencia.NA,
                label: "N/A",
                cls: "bg-gray-400 dark:bg-gray-600",
              },
              {
                value: stats.byAderencia.SEM_RESPOSTA,
                label: "Sem resposta",
                cls: "bg-gray-200 dark:bg-gray-800",
              },
            ]}
          />
          <Legend total={stats.total} stats={stats} />
        </CardContent>
      </Card>

      {/* Por domínio — barras horizontais empilhadas */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Status por domínio
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Cada barra = 1 dos 28 domínios. Cores mostram a distribuição da
            aderência dentro do domínio. Domínios cinza claro ainda não
            tiveram nenhum controle respondido.
          </p>
          <div className="space-y-2.5">
            {stats.byDomain.map((d) => (
              <DomainBar key={d.domainCode} d={d} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top problemas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Domínios com mais não-aderências
              </h3>
            </div>
            {topRiscos.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                Nenhum domínio com não-aderência registrada. Bom sinal — ou
                ainda não respondeu o suficiente pra ter dado.
              </p>
            ) : (
              <ul className="space-y-2">
                {topRiscos.map((d) => (
                  <li
                    key={d.domainCode}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800 shrink-0"
                    >
                      {d.byAderencia.NAO_ADERENTE}
                    </Badge>
                    <span className="text-gray-900 dark:text-gray-100">
                      {d.domain}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Domínios mais aderentes
              </h3>
            </div>
            {topAderentes.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                Ainda não há controles respondidos com aderência total.
              </p>
            ) : (
              <ul className="space-y-2">
                {topAderentes.map((d) => (
                  <li
                    key={d.domainCode}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 shrink-0"
                    >
                      {d.pctAderente}%
                    </Badge>
                    <span className="text-gray-900 dark:text-gray-100">
                      {d.domain}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximos passos */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="p-5 flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-200 space-y-1">
            <p className="font-medium">Como usar essa visão</p>
            <ul className="text-xs space-y-0.5 list-disc list-inside text-blue-800 dark:text-blue-300">
              <li>
                Comece pelos domínios cinza claro (sem resposta) — completar
                o diagnóstico vem antes de priorizar gaps.
              </li>
              <li>
                Depois, ataque os domínios em vermelho (não aderente) —
                cada não-aderência pode virar uma tarefa via "Virar tarefa"
                no controle.
              </li>
              <li>
                Quando o dashboard estiver estável, congele um snapshot pra
                acompanhar evolução ao longo do tempo.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Stacked bar — barra horizontal com vários segmentos coloridos
// ============================================================

function StackedBar({
  total,
  segments,
  height = "h-7",
}: {
  total: number;
  segments: { value: number; label: string; cls: string }[];
  height?: string;
}) {
  if (total === 0) {
    return (
      <div
        className={cn(
          "w-full bg-gray-100 dark:bg-gray-800 rounded overflow-hidden",
          height,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex w-full rounded overflow-hidden bg-gray-100 dark:bg-gray-800",
        height,
      )}
      role="img"
      aria-label={`Distribuição: ${segments
        .filter((s) => s.value > 0)
        .map((s) => `${s.value} ${s.label}`)
        .join(", ")}`}
    >
      {segments.map((s, i) => {
        if (s.value === 0) return null;
        const pct = (s.value / total) * 100;
        return (
          <div
            key={i}
            className={cn(s.cls, "flex items-center justify-center text-[10px] font-medium text-white/95")}
            style={{ width: `${pct}%`, minWidth: pct > 0 ? "1.5%" : 0 }}
            title={`${s.label}: ${s.value} (${Math.round(pct)}%)`}
          >
            {pct >= 8 ? s.value : ""}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Legend — legendinha textual abaixo da barra agregada
// ============================================================

function Legend({ total, stats }: { total: number; stats: GapStats }) {
  const items: { label: string; value: number; cls: string }[] = [
    { label: gapAderenciaLabel(GAP_ADERENCIA.ADERENTE), value: stats.byAderencia.ADERENTE, cls: "bg-emerald-500" },
    { label: gapAderenciaLabel(GAP_ADERENCIA.PARCIAL), value: stats.byAderencia.PARCIAL, cls: "bg-amber-500" },
    { label: gapAderenciaLabel(GAP_ADERENCIA.NAO_ADERENTE), value: stats.byAderencia.NAO_ADERENTE, cls: "bg-red-500" },
    { label: gapAderenciaLabel(GAP_ADERENCIA.NA), value: stats.byAderencia.NA, cls: "bg-gray-400 dark:bg-gray-600" },
    { label: "Sem resposta", value: stats.byAderencia.SEM_RESPOSTA, cls: "bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700" },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-700 dark:text-gray-300">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span className={cn("inline-block w-3 h-3 rounded-sm", it.cls)} />
          {it.label}
          <span className="text-gray-500 dark:text-gray-400">
            ({it.value} / {total})
          </span>
        </span>
      ))}
    </div>
  );
}

// ============================================================
// DomainBar — uma linha por domínio
// ============================================================

function DomainBar({ d }: { d: GapDomainStats }) {
  const pct = Math.round((d.answered / d.total) * 100);
  return (
    <div className="grid grid-cols-12 gap-3 items-center">
      <div className="col-span-12 sm:col-span-5 min-w-0">
        <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
          {d.domain}
        </div>
        <div className="text-[10px] text-gray-500">
          {d.answered} / {d.total} respondidos ({pct}%)
        </div>
      </div>
      <div className="col-span-10 sm:col-span-6">
        <StackedBar
          total={d.total}
          height="h-5"
          segments={[
            { value: d.byAderencia.ADERENTE, label: "Aderente", cls: "bg-emerald-500" },
            { value: d.byAderencia.PARCIAL, label: "Parcialmente", cls: "bg-amber-500" },
            { value: d.byAderencia.NAO_ADERENTE, label: "Não aderente", cls: "bg-red-500" },
            { value: d.byAderencia.NA, label: "N/A", cls: "bg-gray-400 dark:bg-gray-600" },
            { value: d.byAderencia.SEM_RESPOSTA, label: "Sem resposta", cls: "bg-gray-200 dark:bg-gray-800" },
          ]}
        />
      </div>
      <div className="col-span-2 sm:col-span-1 text-right">
        {d.byAderencia.NAO_ADERENTE > 0 ? (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
          >
            <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
            {d.byAderencia.NAO_ADERENTE}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
