"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radar as RadarIcon } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  RISCOS_CATALOG,
  RISCOS_BY_CODE,
  RISK_CATEGORIES_ORDERED,
  RISK_CATEGORY_LABEL,
  RISK_CATEGORY_BY_CODE,
  type RiskCode,
} from "@/lib/riscos-catalog";

/**
 * Radar agregado dos 13 tipos de risco da org.
 *
 * - Eixos = 13 códigos do catálogo BR..CD (em ordem do catálogo)
 * - Valor = quantidade de processos que marcaram aquele risco
 * - Tooltip mostra código + nome completo + count
 *
 * Ideal pra reunião executiva: vista panorâmica de "onde a org acumula
 * risco". Forma do polígono revela padrões (ex: dominância em
 * Compartilhamento sugere problema sistêmico de Operadores).
 *
 * Decisão UX 2026-05-09 (W1+X1+Y1+Z1 do cardápio): radar único
 * agregado, contagem como métrica, sem filtro, no topo do
 * /dashboard/riscos.
 */
interface Props {
  bySeverityByCode: Record<
    string,
    { ALTO: number; MEDIO: number; BAIXO: number; NONE: number }
  >;
  totalRisks: number;
}

interface RadarDatum {
  code: string;
  shortLabel: string;
  fullLabel: string;
  category: string;
  value: number;
}

/**
 * Converte `bySeverityByCode` em array de pontos pro radar.
 * Soma severidades (ALTO+MEDIO+BAIXO+NONE) → "quantos processos
 * marcaram esse risco".
 */
function buildRadarData(
  bySeverityByCode: Props["bySeverityByCode"],
): RadarDatum[] {
  return RISCOS_CATALOG.map((def) => {
    const sev = bySeverityByCode[def.code] ?? {
      ALTO: 0,
      MEDIO: 0,
      BAIXO: 0,
      NONE: 0,
    };
    const total = sev.ALTO + sev.MEDIO + sev.BAIXO + sev.NONE;
    return {
      code: def.code,
      shortLabel: def.shortLabel,
      fullLabel: def.fullLabel,
      category: RISK_CATEGORY_LABEL[RISK_CATEGORY_BY_CODE[def.code as RiskCode]],
      value: total,
    };
  });
}

/**
 * Tooltip custom — recharts default mostra só `code` + value, queremos
 * código + nome completo + categoria + contagem.
 */
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: RadarDatum }>;
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

export default function RiskRadarChart({
  bySeverityByCode,
  totalRisks,
}: Props) {
  const data = buildRadarData(bySeverityByCode);
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  // Top 3 picos pra mostrar como insight rápido em legenda
  const top3 = [...data]
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <RadarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mapa de riscos da organização
            </h2>
          </div>
          <Badge
            variant="outline"
            className="border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30"
          >
            {totalRisks} {totalRisks === 1 ? "risco identificado" : "riscos identificados"}
          </Badge>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          Cada eixo é um dos 13 tipos de risco LGPD do catálogo (BR..CD).
          A distância do centro mostra <strong>quantos processos</strong>{" "}
          marcaram aquele risco. Picos no contorno revelam padrões
          sistêmicos. Passe o mouse sobre os pontos pra ver detalhes.
        </p>

        {/* Radar */}
        <div className="w-full" style={{ height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="code"
                tick={{
                  fontSize: 11,
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  fill: "#374151",
                }}
              />
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
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Insights — top 3 picos */}
        {top3.length > 0 && (
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
      </CardContent>
    </Card>
  );
}
