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
import {
  eixoLabel,
  audienceLabel,
  type RelatorioExecutivo,
} from "@/lib/relatorio-executivo-helpers";

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
  /** D1 — 1-pager: versão resumida em 1 página A4 */
  layout?: "completo" | "resumido";
}

export default function RelatorioExecutivoContent({
  data,
  layout = "completo",
}: Props) {
  if (layout === "resumido") {
    return <RelatorioOnePager data={data} />;
  }
  return <RelatorioCompleto data={data} />;
}

function RelatorioCompleto({ data }: { data: RelatorioExecutivo }) {
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
      <div className="print-hide flex items-center justify-between gap-3 mb-6 sticky top-0 bg-white dark:bg-gray-950 z-10 py-3 border-b border-gray-200 dark:border-gray-800 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <FileText className="h-5 w-5 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Relatório Executivo
          </h1>
          <Badge variant="outline" className="text-xs">
            Completo · 7+ páginas
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="?layout=resumido"
            className="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            title="Versão 1-página A4 — resumo executivo curto"
          >
            Ver versão 1-pager
          </a>
          <Button onClick={() => window.print()} size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir / Salvar PDF
          </Button>
        </div>
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
        <SectionHeader
          number="1"
          title="Postura geral de conformidade"
          law="Art. 50 LGPD — Programa de Governança em Privacidade · Art. 41 — Encarregado pelo tratamento"
        />

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
        <SectionHeader
          number="2"
          title="KPIs operacionais"
          law="Art. 37 — Registro de operações de tratamento · Art. 38 — RIPD · Art. 50 §2 II — política e responsabilidades"
        />

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

      {/* ============= PÁGINA — Capacitação detalhada (B1) ============= */}
      <section className="print-page space-y-6 py-8 print:py-4">
        <SectionHeader
          number="2.1"
          title="Capacitação e educação continuada"
          law="Art. 50 §2 II d — programa contínuo · Art. 52 §1 VIII — comprovação de capacitação"
        />
        <CapacitacaoBlock data={data.capacitacaoDetalhada} />
      </section>

      {/* ============= PÁGINA 4 — Mapa de Riscos (Radar) ============= */}
      <section className="print-page space-y-6 py-8 print:py-4">
        <SectionHeader
          number="3"
          title="Onde a organização acumula risco"
          law="Art. 50 §2 II d — análise de riscos · Art. 38 — RIPD obrigatório para alto risco"
        />
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
        <SectionHeader
          number="4"
          title="Próximas etapas prioritárias"
          law="Art. 50 §1 — diretrizes de adequação contínua e melhoria do programa"
        />
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
        <SectionHeader
          number="5"
          title="Pendências críticas"
          law="Arts. 7º (bases legais) · 11 (dados sensíveis) · 38 (RIPD) · 48 (incidente)"
          icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
          accent="red"
        />

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

      {/* ============= PÁGINA — Alertas de prazo regulatório (B5) ============= */}
      <section className="print-page space-y-6 py-8 print:py-4">
        <SectionHeader
          number="6"
          title="Alertas de prazo regulatório"
          law="Art. 50 §2 II g — revisão e atualização contínua dos instrumentos · Art. 52 §1 VIII — capacitação contínua"
        />
        <AlertasPrazoBlock data={data.alertasPrazo} />
      </section>

      {/* ============= PÁGINA 7 — Histórico (se houver) ============= */}
      {data.historico && data.historico.snapshots.length >= 2 && (
        <section className="print-page space-y-6 py-8 print:py-4">
          <SectionHeader
            number="7"
            title="Evolução histórica do score"
            law="Art. 50 §1 — adequação contínua · monitoramento periódico"
            icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
          />
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
        <SectionHeader
          number={data.historico && data.historico.snapshots.length >= 2 ? "8" : "7"}
          title="Conclusão e recomendações"
          law="Art. 41 — atribuição do Encarregado · Art. 50 §1 — programa de governança documentado"
          icon={<Target className="h-6 w-6 text-blue-600" />}
        />

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

// ============================================================
// C2 — SectionHeader com citação de artigos LGPD
// ============================================================

function SectionHeader({
  number,
  title,
  law,
  icon,
  accent = "blue",
}: {
  number: string;
  title: string;
  law: string;
  icon?: React.ReactNode;
  accent?: "blue" | "red";
}) {
  return (
    <div
      className={cn(
        "border-b-2 pb-2",
        accent === "red" ? "border-red-600" : "border-blue-600",
      )}
    >
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        {icon}
        {number}. {title}
      </h2>
      <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-1 italic">
        Fundamento legal: {law}
      </p>
    </div>
  );
}

// ============================================================
// B1 — CapacitacaoBlock
// ============================================================

function CapacitacaoBlock({
  data,
}: {
  data: import("@/lib/relatorio-executivo-helpers").CapacitacaoDetalhada;
}) {
  if (data.totalEventos === 0) {
    return (
      <p className="text-sm text-gray-500 italic text-center py-8">
        Nenhum evento de capacitação registrado ainda. Programa contínuo de
        educação é exigido pelo Art. 52 §1 VIII da LGPD.
      </p>
    );
  }
  const eixosOrder = [
    "ONBOARDING",
    "PILULAS",
    "PRATICA",
    "DEPARTAMENTAL",
    "MONITORAMENTO",
  ];
  const totalPublicos = Object.keys(data.porPublico).length;
  return (
    <div className="space-y-5">
      {/* Headline numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:gap-2">
        <KpiCard
          label="Eventos totais"
          primary={`${data.totalEventos}`}
          secondary={`${data.realizados} realizados · ${data.planejados} planejados${
            data.cancelados > 0 ? ` · ${data.cancelados} cancelados` : ""
          }`}
          color="emerald"
        />
        <KpiCard
          label="Públicos cobertos"
          primary={`${totalPublicos}`}
          secondary="de 7 públicos do CP18"
          color="blue"
        />
        <KpiCard
          label="Eixos ativos"
          primary={`${
            Object.values(data.porEixo).filter((e) => e.total > 0).length
          }`}
          secondary="de 5 eixos do programa"
          color="violet"
        />
        <KpiCard
          label="Próximos 90 dias"
          primary={`${data.proximosEventos.length}`}
          secondary="eventos no cronograma"
          color="amber"
        />
      </div>

      {/* Por eixo */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Distribuição por eixo
        </h3>
        <div className="space-y-2">
          {eixosOrder.map((eixo) => {
            const stats = data.porEixo[eixo] ?? { total: 0, realizados: 0 };
            const pct =
              stats.total > 0
                ? Math.round((stats.realizados / stats.total) * 100)
                : 0;
            return (
              <div key={eixo} className="text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {eixoLabel(eixo)}
                  </span>
                  <span className="tabular-nums text-gray-600">
                    {stats.realizados}/{stats.total} realizados ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      stats.total === 0
                        ? "bg-gray-300"
                        : pct >= 70
                          ? "bg-emerald-500"
                          : pct >= 40
                            ? "bg-blue-500"
                            : "bg-amber-500",
                    )}
                    style={{
                      width: stats.total === 0 ? "0%" : `${pct}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Próximos eventos */}
      {data.proximosEventos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Cronograma — próximos 90 dias
          </h3>
          <ul className="space-y-1.5">
            {data.proximosEventos.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center justify-between gap-3 text-xs py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {ev.title}
                  </span>
                  <span className="text-gray-500 ml-2">
                    {eixoLabel(ev.eixo)} · {audienceLabel(ev.audience)}
                  </span>
                </div>
                <span className="text-xs text-gray-600 tabular-nums flex-shrink-0">
                  {fmtDate(ev.scheduledAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================
// B5 — AlertasPrazoBlock
// ============================================================

function AlertasPrazoBlock({
  data,
}: {
  data: import("@/lib/relatorio-executivo-helpers").AlertasPrazo;
}) {
  const total =
    data.ripdsSemRevisaoLonga.length +
    data.politicasVencendo.length +
    data.capacitacoesPlanejadasAtrasadas.length +
    data.contratosOperadorVencendo.length;

  if (total === 0) {
    return (
      <div className="text-center py-10 rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200">
        <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-600 mb-2" />
        <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
          Nenhum alerta de prazo regulatório no horizonte avaliado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Itens com prazo conhecido que requerem atenção planejada (não imediata
        como em &quot;Pendências críticas&quot;).
      </p>
      <PendenciaBlock
        title="📅 RIPDs aprovados há mais de 90 dias sem revisão"
        items={data.ripdsSemRevisaoLonga.map((r) => ({
          primary: r.title,
          secondary: `Sem atualização há ${r.daysSinceUpdate} dias — recomenda-se revisar pelo menos a cada 90 dias`,
        }))}
      />
      <PendenciaBlock
        title="📅 Políticas publicadas há mais de 12 meses (revisão anual)"
        items={data.politicasVencendo.map((p) => ({
          primary: p.title,
          secondary: `Publicada há ${p.daysSincePublish} dias — recomenda-se revisão anual`,
        }))}
      />
      <PendenciaBlock
        title="📅 Capacitações planejadas com prazo vencido"
        items={data.capacitacoesPlanejadasAtrasadas.map((e) => ({
          primary: e.title,
          secondary: `${eixoLabel(e.eixo)} · ${e.daysOverdue} dia(s) em atraso`,
        }))}
      />
      <PendenciaBlock
        title="📅 Contratos de Operadores expirando nos próximos 90 dias"
        items={data.contratosOperadorVencendo.map((o) => ({
          primary: o.name,
          secondary:
            o.daysToExpire === 0
              ? "Vence hoje"
              : `Vence em ${o.daysToExpire} dia(s)`,
        }))}
      />
    </div>
  );
}

// ============================================================
// D1 — Versão 1-pager (resumo executivo)
// ============================================================

function RelatorioOnePager({ data }: { data: RelatorioExecutivo }) {
  const totalPendencias =
    data.pendencias.riscosAltoSemMitigacao.length +
    data.pendencias.processosSemBaseLegal.length +
    data.pendencias.incidentesAbertosLongos.length +
    data.pendencias.operadoresAltoRiscoNaoAdequados.length;

  const top3Pendencias: Array<{ label: string; count: number; cor: string }> = [
    {
      label: "Riscos ALTO sem mitigação",
      count: data.pendencias.riscosAltoSemMitigacao.length,
      cor: "red",
    },
    {
      label: "Processos sem base legal",
      count: data.pendencias.processosSemBaseLegal.length,
      cor: "amber",
    },
    {
      label: "Incidentes em aberto > 30d",
      count: data.pendencias.incidentesAbertosLongos.length,
      cor: "red",
    },
    {
      label: "Operadores ALTO sem adequação",
      count: data.pendencias.operadoresAltoRiscoNaoAdequados.length,
      cor: "amber",
    },
  ]
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto py-4 print:py-0">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.2cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-hide {
            display: none !important;
          }
          aside,
          nav,
          [role="navigation"] {
            display: none !important;
          }
        }
      `}</style>

      {/* Toolbar (print-hide) */}
      <div className="print-hide flex items-center justify-between gap-3 mb-4 sticky top-0 bg-white dark:bg-gray-950 z-10 py-2 border-b border-gray-200 dark:border-gray-800 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <FileText className="h-4 w-4 text-blue-600" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Resumo Executivo · 1 página
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="?layout=completo"
            className="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Ver versão completa
          </a>
          <Button onClick={() => window.print()} size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      {/* Header compacto */}
      <header className="border-b border-gray-300 dark:border-gray-700 pb-3 mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Conformidade LGPD · {data.companyName}
          </h1>
          <p className="text-xs text-gray-500">
            {data.period} · Encarregado: {data.dpoName ?? "—"} · Gerado em{" "}
            {fmtDate(data.generatedAt)}
          </p>
        </div>
        <div
          className={cn(
            "rounded-lg border-2 px-4 py-2 text-center flex-shrink-0",
            MATURITY_COLOR_BG[data.maturidade.color] ?? MATURITY_COLOR_BG.blue,
          )}
        >
          <div className="text-3xl font-bold leading-none">
            {data.diagnostico.score.overall ?? "—"}
          </div>
          <div className="text-[10px] uppercase tracking-wide opacity-75">
            {data.maturidade.label}
          </div>
        </div>
      </header>

      {/* 4 KPIs principais em linha */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <KpiCard
          label="Inventário aprovado"
          primary={`${data.kpis.inventario.approved}`}
          secondary={`de ${data.kpis.inventario.total}`}
          color="blue"
        />
        <KpiCard
          label="Riscos identificados"
          primary={`${data.kpis.riscos.total}`}
          secondary={`${data.kpis.riscos.altoCount} alto`}
          color="red"
        />
        <KpiCard
          label="Plano de Ação"
          primary={`${data.kpis.plano.concluidas}/${data.kpis.plano.total}`}
          secondary={`${data.kpis.plano.atrasadas} atrasadas`}
          color="emerald"
        />
        <KpiCard
          label="Incidentes"
          primary={`${data.kpis.incidentes.open}`}
          secondary={
            data.kpis.incidentes.anpdOverdue > 0
              ? `⚠ ${data.kpis.incidentes.anpdOverdue} ANPD vencido`
              : `${data.kpis.incidentes.closed} encerrados`
          }
          color={data.kpis.incidentes.anpdOverdue > 0 ? "red" : "blue"}
        />
      </div>

      {/* 4 pilares horizontais compactos */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Pilares do score
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {Object.values(data.diagnostico.score.sub).map((pilar) => (
            <div
              key={pilar.key}
              className="rounded-md border border-gray-200 dark:border-gray-700 p-2"
            >
              <div className="text-[10px] uppercase text-gray-500 truncate">
                {pilar.label}
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                {pilar.value !== null ? `${pilar.value}` : "—"}
                <span className="text-xs text-gray-400">/100</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top pendências críticas */}
      {top3Pendencias.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Top pendências críticas
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {top3Pendencias.map((p, idx) => (
              <div
                key={idx}
                className="rounded-md border-l-4 border-red-500 bg-red-50/40 dark:bg-red-950/15 p-2"
              >
                <div className="text-2xl font-bold text-red-700 dark:text-red-300 tabular-nums">
                  {p.count}
                </div>
                <div className="text-[10px] text-gray-700 dark:text-gray-300 leading-tight">
                  {p.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximas 5 etapas */}
      {data.proximasEtapas.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Próximas 5 etapas prioritárias
          </h2>
          <ol className="space-y-1">
            {data.proximasEtapas.slice(0, 5).map((e, idx) => (
              <li key={e.id} className="text-xs flex items-start gap-2">
                <span className="font-mono text-gray-400 w-4 flex-shrink-0">
                  {idx + 1}.
                </span>
                <span className="text-gray-800 dark:text-gray-200 flex-1">
                  {e.title}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] flex-shrink-0 uppercase",
                    e.priority === "alta"
                      ? "bg-red-50 text-red-800 border-red-300"
                      : e.priority === "media"
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-gray-50 text-gray-700 border-gray-300",
                  )}
                >
                  {e.priority}
                </Badge>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Conclusão curta — 2 primeiros parágrafos */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
          Síntese executiva
        </h2>
        <div className="text-xs leading-relaxed text-gray-800 dark:text-gray-200 space-y-1.5">
          {data.conclusao
            .split("\n\n")
            .slice(0, 2)
            .map((p, i) => (
              <p
                key={i}
                dangerouslySetInnerHTML={{
                  __html: p.replace(
                    /\*\*(.+?)\*\*/g,
                    '<strong class="text-gray-900 dark:text-white">$1</strong>',
                  ),
                }}
              />
            ))}
        </div>
      </div>

      {/* Assinatura */}
      <footer className="mt-6 pt-3 border-t border-gray-300 dark:border-gray-700 text-center">
        <div className="text-xs font-semibold text-gray-900 dark:text-white">
          {data.dpoName ?? "[Encarregado]"}
        </div>
        <div className="text-[10px] italic text-gray-500">
          Encarregado pelo Tratamento de Dados Pessoais ·{" "}
          {data.dpoEmail ?? ""}
        </div>
        <div className="text-[10px] text-gray-400 mt-1">
          Documento gerado pelo Sistema PGP em {fmtDate(data.generatedAt)}
        </div>
      </footer>
    </div>
  );
}
