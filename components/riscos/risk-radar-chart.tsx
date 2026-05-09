"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radar as RadarIcon, Layers, X } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  RISCOS_CATALOG,
  RISK_CATEGORY_LABEL,
  RISK_CATEGORY_BY_CODE,
  type RiskCode,
} from "@/lib/riscos-catalog";
import { cn } from "@/lib/utils";

/**
 * Radar agregado dos 13 tipos de risco da org com:
 *   - Filtro por setor (chips multi-select acima do radar)
 *   - Modo comparação (multi-radar sobreposto, cada processo = camada
 *     colorida)
 *
 * Decisão UX 2026-05-09:
 *   - W1+X1+Y1+Z1 (PR #4): radar único agregado, contagem, sem filtro
 *   - B+1+B+3 (PR atual): + filtro setor + comparação processos
 */

interface Item {
  id: string;
  serviceName: string;
  setor: string | null;
  codes: string[];
  codesByStatus?: Record<string, string[]>;
  totalRisks: number;
}

interface Props {
  items: Item[];
  totalRisks: number;
}

/**
 * Presets de filtro por status (B+2, 2026-05-10).
 * Em vez de chips individuais por status (que adicionariam muita
 * carga visual), 4 botões de preset cobrem 95% dos casos de uso:
 *   - Backlog: riscos identificados mas sem mitigação iniciada
 *   - Em ação: trabalho em andamento
 *   - Resolvido: tratados (aceitos formalmente ou eliminados)
 *   - Tudo: sem filtro (default)
 */
type StatusPreset = "all" | "backlog" | "em_acao" | "resolvido";

const PRESET_STATUSES: Record<StatusPreset, ReadonlyArray<string>> = {
  all: ["IDENTIFICADO", "EM_MITIGACAO", "ACEITO", "ELIMINADO"],
  backlog: ["IDENTIFICADO"],
  em_acao: ["EM_MITIGACAO"],
  resolvido: ["ACEITO", "ELIMINADO"],
};

const PRESET_LABEL: Record<StatusPreset, string> = {
  all: "Tudo",
  backlog: "Backlog",
  em_acao: "Em ação",
  resolvido: "Resolvido",
};

const PRESET_HINT: Record<StatusPreset, string> = {
  all: "Mostra todos os riscos marcados",
  backlog: "Riscos identificados sem mitigação iniciada",
  em_acao: "Riscos com plano de mitigação em andamento",
  resolvido: "Riscos aceitos formalmente ou eliminados",
};

interface SingleDatum {
  code: string;
  shortLabel: string;
  fullLabel: string;
  category: string;
  value: number;
}

interface MultiDatum {
  code: string;
  shortLabel: string;
  fullLabel: string;
  category: string;
  // chave dinâmica = nome do processo, valor = 0 ou 1
  [processName: string]: string | number;
}

// Paleta de cores pra multi-radar (até 8 processos distintos antes de
// repetir). Cores escolhidas pra terem boa diferenciação visual e
// funcionarem bem em modo light/dark.
const PROCESS_COLORS = [
  "#4f46e5", // indigo-600
  "#ef4444", // red-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
] as const;

/**
 * Tooltip custom do modo single — mostra código + nome + categoria + count.
 */
function SingleTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SingleDatum }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-3 text-sm max-w-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
          {d.code}
        </span>
        <span className="font-semibold text-gray-900 dark:text-white">
          {d.shortLabel}
        </span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-snug">
        {d.fullLabel}
      </p>
      <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {d.category}
        </span>
        <span className="text-base font-bold text-blue-600 dark:text-blue-400 tabular-nums">
          {d.value}{" "}
          <span className="text-xs font-normal text-gray-500">
            {d.value === 1 ? "processo" : "processos"}
          </span>
        </span>
      </div>
    </div>
  );
}

/**
 * Tooltip do modo multi — mostra todos os processos que têm aquele risco
 * marcado pra esse eixo.
 */
function MultiTooltip({
  active,
  payload,
  processes,
}: {
  active?: boolean;
  payload?: Array<{ payload: MultiDatum }>;
  processes: Array<{ name: string; color: string }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const marked = processes.filter((p) => d[p.name] === 1);
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-3 text-sm max-w-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
          {d.code}
        </span>
        <span className="font-semibold text-gray-900 dark:text-white">
          {d.shortLabel}
        </span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-snug">
        {d.fullLabel}
      </p>
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Marcado em:
        </p>
        {marked.length === 0 ? (
          <p className="text-xs text-gray-400 italic">nenhum processo</p>
        ) : (
          <ul className="space-y-0.5">
            {marked.map((p) => (
              <li
                key={p.name}
                className="flex items-center gap-1.5 text-xs"
              >
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-gray-700 dark:text-gray-300 truncate">
                  {p.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Helper: filtra os codes de um item conforme o preset de status.
 * Se preset='all' ou item não tem codesByStatus, devolve item.codes inteiro.
 * Caso contrário, devolve só os códigos cujo status está no preset.
 */
function codesForPreset(
  item: Item,
  preset: StatusPreset,
): string[] {
  if (preset === "all" || !item.codesByStatus) {
    return item.codes;
  }
  const allowed = PRESET_STATUSES[preset];
  const codes: string[] = [];
  for (const status of allowed) {
    const statusCodes = item.codesByStatus[status] ?? [];
    codes.push(...statusCodes);
  }
  return codes;
}

export default function RiskRadarChart({ items, totalRisks }: Props) {
  const [selectedSetores, setSelectedSetores] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState(false);
  const [statusPreset, setStatusPreset] = useState<StatusPreset>("all");

  // Setores distintos disponíveis (excluindo nulls). Ordenados alfabeticamente.
  const availableSetores = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      if (it.setor) set.add(it.setor);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [items]);

  // Items filtrados pelo setor + preset de status. Inclui só processos
  // que têm AO MENOS 1 risco no preset selecionado (radar vazio não
  // comunica nada).
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (it.totalRisks === 0) return false;
      // Filtro de setor
      if (
        selectedSetores.size > 0 &&
        (it.setor === null || !selectedSetores.has(it.setor))
      ) {
        return false;
      }
      // Filtro de preset de status — exige que o processo tenha ao
      // menos 1 código nessa categoria
      if (statusPreset !== "all") {
        const codes = codesForPreset(it, statusPreset);
        if (codes.length === 0) return false;
      }
      return true;
    });
  }, [items, selectedSetores, statusPreset]);

  // Dados agregados pra modo single (ou pra fallback quando multi tem 0 itens)
  const singleData: SingleDatum[] = useMemo(() => {
    return RISCOS_CATALOG.map((def) => {
      const count = filteredItems.filter((it) =>
        codesForPreset(it, statusPreset).includes(def.code),
      ).length;
      return {
        code: def.code,
        shortLabel: def.shortLabel,
        fullLabel: def.fullLabel,
        category:
          RISK_CATEGORY_LABEL[RISK_CATEGORY_BY_CODE[def.code as RiskCode]],
        value: count,
      };
    });
  }, [filteredItems]);

  // Dados pra modo multi: cada processo é uma chave dinâmica com 0 ou 1
  const multiData: MultiDatum[] = useMemo(() => {
    return RISCOS_CATALOG.map((def) => {
      const row: MultiDatum = {
        code: def.code,
        shortLabel: def.shortLabel,
        fullLabel: def.fullLabel,
        category:
          RISK_CATEGORY_LABEL[RISK_CATEGORY_BY_CODE[def.code as RiskCode]],
      };
      for (const it of filteredItems) {
        row[it.serviceName] = codesForPreset(it, statusPreset).includes(
          def.code,
        )
          ? 1
          : 0;
      }
      return row;
    });
  }, [filteredItems, statusPreset]);

  // Lista de processos pra render no modo multi (com cor estável).
  // Cor é atribuída pela ORDEM do filteredItems.
  const processColorMap = useMemo(() => {
    return filteredItems.map((it, idx) => ({
      name: it.serviceName,
      color: PROCESS_COLORS[idx % PROCESS_COLORS.length],
      setor: it.setor,
    }));
  }, [filteredItems]);

  // Top 3 picos no modo single (insight de "onde acumula risco")
  const top3 = useMemo(() => {
    return [...singleData]
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }, [singleData]);

  const maxValue = Math.max(...singleData.map((d) => d.value), 1);

  // Toggle setor no filtro
  const toggleSetor = (setor: string) => {
    setSelectedSetores((prev) => {
      const next = new Set(prev);
      if (next.has(setor)) next.delete(setor);
      else next.add(setor);
      return next;
    });
  };
  const clearSetores = () => setSelectedSetores(new Set());

  const filteredCount = filteredItems.length;
  const filteredRisksTotal = filteredItems.reduce(
    (acc, it) => acc + it.totalRisks,
    0,
  );

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <RadarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mapa de riscos da organização
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {filteredCount !== items.filter((i) => i.totalRisks > 0).length && (
              <Badge
                variant="outline"
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
              >
                {filteredRisksTotal} de {totalRisks}{" "}
                {totalRisks === 1 ? "risco" : "riscos"}
              </Badge>
            )}
            {filteredCount === items.filter((i) => i.totalRisks > 0).length && (
              <Badge
                variant="outline"
                className="border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30"
              >
                {totalRisks}{" "}
                {totalRisks === 1
                  ? "risco identificado"
                  : "riscos identificados"}
              </Badge>
            )}
            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              onClick={() => setCompareMode((v) => !v)}
              className={cn("gap-1.5 h-8")}
              disabled={filteredCount === 0}
              title={
                compareMode
                  ? "Voltar à vista agregada"
                  : "Sobrepor cada processo como uma camada"
              }
            >
              <Layers className="h-3.5 w-3.5" />
              {compareMode ? "Modo comparação" : "Comparar processos"}
            </Button>
          </div>
        </div>

        {/* Descrição */}
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          {compareMode ? (
            <>
              Cada cor é um processo — vértices nos eixos onde aquele
              processo tem risco marcado. Sobreposição revela onde
              processos diferentes <strong>convergem</strong> nos mesmos
              riscos.
            </>
          ) : (
            <>
              Cada eixo é um dos 13 tipos de risco LGPD do catálogo (BR..CD).
              A distância do centro mostra <strong>quantos processos</strong>{" "}
              marcaram aquele risco. Picos no contorno revelam padrões
              sistêmicos. Passe o mouse sobre os pontos pra ver detalhes.
            </>
          )}
        </p>

        {/* Presets de status do risco (B+2, 2026-05-10):
            4 botões em linha — Tudo / Backlog / Em ação / Resolvido.
            Vocabulário gestão (não jargão técnico do schema). */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
            Mostrar:
          </span>
          {(["all", "backlog", "em_acao", "resolvido"] as StatusPreset[]).map(
            (p) => {
              const active = statusPreset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setStatusPreset(p)}
                  title={PRESET_HINT[p]}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-md border font-medium transition-colors",
                    active
                      ? p === "backlog"
                        ? "border-red-500 bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200 dark:border-red-700"
                        : p === "em_acao"
                          ? "border-amber-500 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700"
                          : p === "resolvido"
                            ? "border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-700"
                            : "border-indigo-500 bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-700"
                      : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                  )}
                >
                  {PRESET_LABEL[p]}
                </button>
              );
            },
          )}
        </div>

        {/* Filtros de setor — chips */}
        {availableSetores.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
              Setor:
            </span>
            {availableSetores.map((setor) => {
              const active = selectedSetores.has(setor);
              return (
                <button
                  key={setor}
                  type="button"
                  onClick={() => toggleSetor(setor)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    active
                      ? "border-indigo-500 bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-700"
                      : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                  )}
                >
                  {setor}
                </button>
              );
            })}
            {selectedSetores.size > 0 && (
              <button
                type="button"
                onClick={clearSetores}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center gap-1 ml-1"
                title="Limpar filtros"
              >
                <X className="h-3 w-3" />
                Limpar
              </button>
            )}
          </div>
        )}

        {/* Estado: nada filtrado */}
        {filteredCount === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
            Nenhum processo analisado nos setores selecionados.
          </div>
        ) : (
          <>
            {/* Radar */}
            <div className="w-full" style={{ height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="75%"
                  data={compareMode ? multiData : singleData}
                >
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="code"
                    tick={{
                      fontSize: 11,
                      fontFamily: "ui-monospace, SFMono-Regular, monospace",
                      fill: "#374151",
                    }}
                  />
                  {compareMode ? (
                    <>
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 1]}
                        tick={false}
                        axisLine={false}
                      />
                      {processColorMap.map((p) => (
                        <Radar
                          key={p.name}
                          name={p.name}
                          dataKey={p.name}
                          stroke={p.color}
                          strokeWidth={2}
                          fill={p.color}
                          fillOpacity={0.15}
                          isAnimationActive
                        />
                      ))}
                      <Tooltip
                        content={
                          <MultiTooltip processes={processColorMap} />
                        }
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        iconType="circle"
                      />
                    </>
                  ) : (
                    <>
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, maxValue]}
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickCount={Math.min(maxValue + 1, 5)}
                        axisLine={false}
                      />
                      <Radar
                        name="Processos com risco marcado"
                        dataKey="value"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fill="#6366f1"
                        fillOpacity={0.35}
                        isAnimationActive
                      />
                      <Tooltip content={<SingleTooltip />} />
                    </>
                  )}
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Insights — top 3 picos só no modo single */}
            {!compareMode && top3.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Onde a org mais acumula risco:
                </p>
                <div className="flex flex-wrap gap-2">
                  {top3.map((d, idx) => (
                    <Badge
                      key={d.code}
                      variant="outline"
                      className="text-xs"
                      title={d.fullLabel}
                    >
                      <span className="font-mono text-gray-400 mr-1.5">
                        {idx + 1}.
                      </span>
                      <span className="font-mono text-gray-500 dark:text-gray-400 mr-1.5">
                        {d.code}
                      </span>
                      {d.shortLabel}
                      <span className="ml-1.5 font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                        ({d.value})
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
