"use client";

import { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Target,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RISCOS_CATALOG,
  RISK_CATEGORY_LABEL,
  RISK_CATEGORY_BY_CODE,
  type RiskCode,
} from "@/lib/riscos-catalog";
import type { RelatorioExecutivo } from "@/lib/relatorio-executivo-helpers";

const MATURITY_COLOR_BG: Record<string, string> = {
  red: "bg-red-100 text-red-800 border-red-300",
  amber: "bg-amber-100 text-amber-800 border-amber-300",
  blue: "bg-blue-100 text-blue-800 border-blue-300",
  emerald: "bg-emerald-100 text-emerald-800 border-emerald-300",
  violet: "bg-violet-100 text-violet-800 border-violet-300",
};

const SCORE_COLOR_BAR: Record<string, string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
};

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmtDateShort(d: string): string {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

interface Props {
  data: RelatorioExecutivo;
}

export default function RelatorioExecutivoContent({ data }: Props) {
  const radarData = useMemo(() => {
    return RISCOS_CATALOG.map((def) => ({
      code: def.code,
      shortLabel: def.shortLabel,
      value: data.riscosByCode[def.code] ?? 0,
      category:
        RISK_CATEGORY_LABEL[RISK_CATEGORY_BY_CODE[def.code as RiskCode]],
    }));
  }, [data.riscosByCode]);

  const maxRadar = Math.max(...radarData.map((r) => r.value), 1);

  return (
    <div className="max-w-5xl mx-auto py-6 print:py-0">
      {/* Estilos de impressão — força quebra de página entre seções */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-hide {
            display: none !important;
          }
          .print-page {
            page-break-after: always;
            break-after: page;
          }
          .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          aside,
          nav,
          [role="navigation"],
          .lucide-tour-floating-button {
            display: none !important;
          }
        }
      `}</style>

      {/* ============= Toolbar de impressão (print-hide) ============= */}
      <div className="print-hide flex items-center justify-between gap-3 mb-6 sticky top-0 bg-white dark:bg-gray-950 z-10 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Relatório Executivo
          </h1>
          <Badge variant="outline" className="text-xs">
            DPO-only
          </Badge>
        </div>
        <Button onClick={() => window.print()} size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      {/* ============= PÁGINA 1 — Capa ============= */}
      <section className="print-page min-h-[80vh] flex flex-col items-center justify-center text-center py-12 print:py-0">
        {data.companyLogoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.companyLogoUrl}
            alt={data.companyName}
            className="h-24 w-auto mb-8 object-contain"
          />
        )}
        <Building2 className="h-12 w-12 text-blue-600 mb-4 print:text-gray-400" />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Relatório Executivo
        </h1>
        <h2 className="text-2xl text-gray-700 dark:text-gray-200 mb-8">
          de Conformidade LGPD
        </h2>
        <div className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          {data.companyName}
        </div>
        <div className="text-md text-gray-500 mb-8">{data.period}</div>
        {data.dpoName && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-12 border-t border-gray-200 pt-6 max-w-md">
            <div className="font-semibold">Encarregado pelo Tratamento de Dados</div>
            <div>{data.dpoName}</div>
            {data.dpoEmail && (
              <div className="text-xs text-gray-500">{data.dpoEmail}</div>
            )}
          </div>
        )}
        <div className="text-xs text-gray-400 mt-8">
          Documento gerado automaticamente em {fmtDate(data.generatedAt)}
        </div>
      </section>

      {/* ============= PÁGINA 2 — Score + Maturidade ============= */}
      <section className="print-page space-y-6 py-8 print:py-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b-2 border-blue-600 pb-2">
          1. Postura geral de conformidade
        </h2>

        {/* Score grande + maturidade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
          <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="text-xs uppercase text-gray-500 mb-2">
              Score de Conformidade
            </div>
            <div className="text-6xl font-bold text-gray-900 dark:text-white">
              {data.diagnostico.score.overall ?? "—"}
              <span className="text-2xl text-gray-400">/100</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Diagnóstico de Privacidade · 4 pilares ponderados
            </div>
          </div>

          <div
            className={cn(
              "rounded-xl border-2 p-6 text-center",
              MATURITY_COLOR_BG[data.maturidade.color] ?? MATURITY_COLOR_BG.blue,
            )}
          >
            <div className="text-xs uppercase opacity-75 mb-2">
              Nível de Maturidade
            </div>
            <div className="text-3xl font-bold">{data.maturidade.label}</div>
            <p className="text-sm mt-3 leading-snug">
              {data.maturidade.description}
            </p>
          </div>
        </div>

        {/* 4 pilares */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Pilares do score
          </h3>
          <div className="space-y-3">
            {Object.values(data.diagnostico.score.sub).map((pilar) => (
              <div key={pilar.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {pilar.label}
                  </span>
                  <span className="text-xs tabular-nums text-gray-700 dark:text-gray-300">
                    {pilar.value !== null ? `${pilar.value}/100` : "—"}{" "}
                    <span className="text-gray-400">
                      (peso {Math.round(pilar.weight * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      pilar.value !== null && pilar.value >= 70
                        ? "bg-emerald-500"
                        : pilar.value !== null && pilar.value >= 50
                          ? "bg-blue-500"
                          : pilar.value !== null && pilar.value >= 30
                            ? "bg-amber-500"
                            : "bg-red-500",
                    )}
                    style={{
                      width: `${pilar.value ?? 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {pilar.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============= PÁGINA 3 — KPIs Operacionais ============= */}
      <section className="print-page space-y-6 py-8 print:py-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b-2 border-blue-600 pb-2">
          2. KPIs operacionais
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:gap-2 print:grid-cols-4">
          <KpiCard
            label="Inventário"
            primary={`${data.kpis.inventario.approved}`}
            secondary={`${data.kpis.inventario.total} total · ${data.kpis.inventario.inReview} em revisão`}
            color="blue"
          />
          <KpiCard
            label="Riscos identificados"
            primary={`${data.kpis.riscos.total}`}
            secondary={`${data.kpis.riscos.altoCount} alto · ${data.kpis.riscos.medioCount} médio · ${data.kpis.riscos.baixoCount} baixo`}
            color="red"
          />
          <KpiCard
            label="GAP Analysis"
            primary={`${data.kpis.gap.aderente}`}
            secondary={`de 119 controles aderentes · ${data.kpis.gap.parcial} parciais · ${data.kpis.gap.naoAderente} não aderentes`}
            color="indigo"
          />
          <KpiCard
            label="Plano de Ação"
            primary={`${data.kpis.plano.total}`}
            secondary={`${data.kpis.plano.concluidas} concluídas · ${data.kpis.plano.atrasadas} atrasadas`}
            color="emerald"
          />
          <KpiCard
            label="Políticas LGPD"
            primary={`${data.kpis.politicas.published}`}
            secondary={`publicadas · ${data.kpis.politicas.draft} em rascunho`}
            color="violet"
          />
          <KpiCard
            label="RIPDs"
            primary={`${data.kpis.ripds.approved}`}
            secondary={`aprovados · ${data.kpis.ripds.inReview} em revisão`}
            color="amber"
          />
          <KpiCard
            label="LIA"
            primary={`${data.kpis.lia.approved}`}
            secondary={`aprovadas · ${data.kpis.lia.total} total`}
            color="violet"
          />
          <KpiCard
            label="Operadores"
            primary={`${data.kpis.operadores.total}`}
            secondary={`${data.kpis.operadores.adequados} adequados · ${data.kpis.operadores.highRisk} alto risco`}
            color="amber"
          />
          <KpiCard
            label="Incidentes"
            primary={`${data.kpis.incidentes.open}`}
            secondary={`em aberto · ${data.kpis.incidentes.closed} encerrados${
              data.kpis.incidentes.anpdOverdue > 0
                ? ` · ⚠ ${data.kpis.incidentes.anpdOverdue} ANPD vencido`
                : ""
            }`}
            color={data.kpis.incidentes.anpdOverdue > 0 ? "red" : "blue"}
          />
          <KpiCard
            label="Capacitação"
            primary={`${data.kpis.capacitacao.events}`}
            secondary={`eventos · ${data.kpis.capacitacao.eixosCovered} de 5 eixos cobertos`}
            color="emerald"
          />
        </div>
      </section>

      {/* ============= PÁGINA 4 — Mapa de Riscos (Radar) ============= */}
      <section className="print-page space-y-6 py-8 print:py-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b-2 border-blue-600 pb-2">
          3. Onde a organização acumula risco
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Cada eixo é um dos 13 tipos de risco LGPD do catálogo (BR..CD). A
          distância do centro mostra quantos processos marcaram aquele risco.
        </p>

        {data.kpis.riscos.total > 0 ? (
          <>
            <div className="w-full" style={{ height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="code"
                    tick={{
                      fontSize: 11,
                      fontFamily: "ui-monospace, monospace",
                      fill: "#374151",
                    }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, maxRadar]}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickCount={Math.min(maxRadar + 1, 5)}
                    axisLine={false}
                  />
                  <Radar
                    name="Processos com risco"
                    dataKey="value"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fill="#6366f1"
                    fillOpacity={0.35}
                    isAnimationActive={false}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Top 5 riscos mais frequentes
              </h3>
              <ol className="space-y-1.5">
                {data.topRiscos.map((r, idx) => (
                  <li
                    key={r.code}
                    className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400 w-5">
                        {idx + 1}.
                      </span>
                      <span className="font-mono text-xs text-gray-500">
                        {r.code}
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {r.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        — {r.category}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums text-indigo-700 dark:text-indigo-300">
                      {r.count}{" "}
                      <span className="text-xs font-normal text-gray-500">
                        processo(s)
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 italic text-center py-12">
            Nenhum risco identificado ainda. Realize Análise de Riscos nos
            processos aprovados.
          </p>
        )}
      </section>

      {/* ============= PÁGINA 5 — Próximas etapas ============= */}
      <section className="print-page space-y-6 py-8 print:py-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b-2 border-blue-600 pb-2">
          4. Próximas etapas prioritárias
        </h2>
        {data.proximasEtapas.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-8">
            Nenhuma próxima etapa identificada — programa em equilíbrio
            momentâneo.
          </p>
        ) : (
          <ol className="space-y-2.5">
            {data.proximasEtapas.map((etapa, idx) => (
              <li
                key={etapa.id}
                className="rounded-md border border-gray-200 dark:border-gray-700 p-3 print:p-2"
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs text-gray-400 w-6 pt-0.5 flex-shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex-1">
                        {etapa.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs flex-shrink-0 uppercase",
                          etapa.priority === "alta"
                            ? "bg-red-50 text-red-800 border-red-300"
                            : etapa.priority === "media"
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-gray-50 text-gray-700 border-gray-300",
                        )}
                      >
                        {etapa.priority}
                      </Badge>
                      {etapa.phase !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          🚩 Fase {etapa.phase}
                        </Badge>
                      )}
                    </div>
                    {etapa.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {etapa.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ============= PÁGINA 6 — Pendências críticas ============= */}
      <section className="print-page space-y-6 py-8 print:py-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b-2 border-red-600 pb-2 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          5. Pendências críticas
        </h2>

        {Object.values(data.pendencias).every(
          (arr) => (arr as any[]).length === 0,
        ) ? (
          <div className="text-center py-10 rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200">
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-600 mb-2" />
            <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
              Nenhuma pendência crítica detectada nas dimensões avaliadas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <PendenciaBlock
              title="🚨 Riscos ALTO sem mitigação iniciada"
              items={data.pendencias.riscosAltoSemMitigacao.map((r) => ({
                primary: r.label,
                secondary: `Em ${r.processName} · ${r.code}`,
              }))}
            />
            <PendenciaBlock
              title="🚨 Processos APROVADOS sem base legal definida"
              items={data.pendencias.processosSemBaseLegal.map((p) => ({
                primary: p.name,
                secondary: "Falta indicar base legal (Art. 7º LGPD)",
              }))}
            />
            <PendenciaBlock
              title="🚨 Incidentes em aberto há mais de 30 dias"
              items={data.pendencias.incidentesAbertosLongos.map((i) => ({
                primary: i.title,
                secondary: `${i.daysOpen} dias em aberto`,
              }))}
            />
            <PendenciaBlock
              title="🚨 Operadores ALTO risco não adequados"
              items={data.pendencias.operadoresAltoRiscoNaoAdequados.map(
                (o) => ({
                  primary: o.name,
                  secondary: "Risco contratual ALTO sem adequação LGPD concluída",
                }),
              )}
            />
          </div>
        )}
      </section>

      {/* ============= PÁGINA 7 — Histórico (se houver) ============= */}
      {data.historico && data.historico.snapshots.length >= 2 && (
        <section className="print-page space-y-6 py-8 print:py-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b-2 border-blue-600 pb-2 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            6. Evolução histórica do score
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Score consolidado em cada snapshot do GAP Analysis. Evolução do
            programa ao longo do tempo.
          </p>
          <div className="w-full" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.historico.snapshots.map((s) => ({
                  date: fmtDateShort(s.date),
                  score: s.score,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#374151" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#374151" }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#6366f1" }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ============= PÁGINA FINAL — Conclusão + Assinatura ============= */}
      <section className="print-page space-y-6 py-8 print:py-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b-2 border-blue-600 pb-2 flex items-center gap-2">
          <Target className="h-6 w-6 text-blue-600" />
          {data.historico && data.historico.snapshots.length >= 2 ? "7" : "6"}.
          Conclusão e recomendações
        </h2>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          {data.conclusao.split("\n\n").map((parag, idx) => (
            <p
              key={idx}
              className="text-sm leading-relaxed text-gray-800 dark:text-gray-200"
              dangerouslySetInnerHTML={{
                __html: parag.replace(
                  /\*\*(.+?)\*\*/g,
                  '<strong class="text-gray-900 dark:text-white">$1</strong>',
                ),
              }}
            />
          ))}
        </div>

        {/* Assinatura */}
        <div className="mt-12 print:mt-16 pt-6 border-t-2 border-gray-300 max-w-md mx-auto text-center">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {data.dpoName ?? "[Nome do Encarregado]"}
          </div>
          <div className="text-xs italic text-gray-500 mt-0.5">
            Encarregado pelo Tratamento de Dados Pessoais
          </div>
          {data.dpoEmail && (
            <div className="text-xs text-gray-400 mt-0.5">{data.dpoEmail}</div>
          )}
        </div>

        <div className="text-xs text-gray-400 text-center mt-12">
          Documento gerado automaticamente pelo Sistema PGP em{" "}
          {fmtDate(data.generatedAt)} · {data.companyName}
        </div>
      </section>
    </div>
  );
}

// ============================================================
// Sub-componentes
// ============================================================

function KpiCard({
  label,
  primary,
  secondary,
  color,
}: {
  label: string;
  primary: string;
  secondary: string;
  color: "blue" | "red" | "amber" | "emerald" | "violet" | "indigo";
}) {
  const accent: Record<typeof color, string> = {
    blue: "border-l-blue-500",
    red: "border-l-red-500",
    amber: "border-l-amber-500",
    emerald: "border-l-emerald-500",
    violet: "border-l-violet-500",
    indigo: "border-l-indigo-500",
  };
  return (
    <div
      className={cn(
        "rounded-md border border-gray-200 dark:border-gray-700 border-l-4 p-3 print:p-2",
        accent[color],
      )}
    >
      <div className="text-[10px] uppercase text-gray-500 tracking-wide">
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums mt-1">
        {primary}
      </div>
      <div className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug mt-1">
        {secondary}
      </div>
    </div>
  );
}

function PendenciaBlock({
  title,
  items,
}: {
  title: string;
  items: Array<{ primary: string; secondary: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/15 p-3 print:p-2">
      <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
        {title}
      </h3>
      <ul className="space-y-1">
        {items.map((it, idx) => (
          <li
            key={idx}
            className="text-xs text-gray-800 dark:text-gray-200 flex items-start gap-2"
          >
            <span className="text-red-500 flex-shrink-0">•</span>
            <span>
              <span className="font-medium">{it.primary}</span>
              <span className="text-gray-500"> — {it.secondary}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
