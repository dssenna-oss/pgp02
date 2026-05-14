"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { GAP_DOMAINS } from "@/lib/gap-catalog";
import {
  type GapAnswerDTO,
  type GapStats,
  gapAderenciaLabel,
  gapMapeamentoLabel,
} from "@/lib/gap-helpers";

interface ApiState {
  answers: GapAnswerDTO[];
  stats: GapStats;
}

/**
 * View "PDF" do GAP. Layout dedicado pra impressão (A4, sem sidebar,
 * tipografia reforçada). Ao montar, abre automaticamente o diálogo de
 * impressão do navegador. O usuário escolhe "Salvar como PDF" no
 * destino e tem o arquivo final.
 *
 * Esconde a barra de controles via @media print (CSS no <style> embaixo).
 */
export default function GapPdfView() {
  const [data, setData] = useState<ApiState | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    (async () => {
      const [gapRes, sessionRes] = await Promise.all([
        fetch("/api/gap?withSuggestions=0", { cache: "no-store" }),
        fetch("/api/auth/session"),
      ]);
      if (gapRes.ok) {
        const j = (await gapRes.json()) as ApiState;
        setData(j);
      }
      if (sessionRes.ok) {
        const s = await sessionRes.json();
        setCompanyName(s?.user?.company?.companyName ?? "Organização");
      }
    })();
  }, []);

  // Auto-print quando os dados terminam de carregar — desativado por
  // default. Pra ligar, abrir a página com `?autoprint=1` (o link no
  // header do GAP usa essa flag). Sem isso, o user pode pré-visualizar
  // a tela e clicar manualmente em "Imprimir / Salvar PDF".
  useEffect(() => {
    if (!data || printed) return;
    if (typeof window === "undefined") return;
    const autoprint = new URL(window.location.href).searchParams.get("autoprint");
    if (autoprint !== "1") return;
    const t = setTimeout(() => {
      window.print();
      setPrinted(true);
    }, 600);
    return () => clearTimeout(t);
  }, [data, printed]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Preparando relatório...
      </div>
    );
  }

  const { stats, answers } = data;
  const answersByCode = new Map(answers.map((a) => [a.controlCode, a]));

  // Score do GAP (peso ADERENTE=1, PARCIAL=0.5, NAO_ADERENTE=0; NA exclui)
  const respondidos = answers.filter((a) => a.aderencia && a.aderencia !== "NA");
  const weighted = respondidos.reduce(
    (acc, a) => acc + (a.aderencia === "ADERENTE" ? 1 : a.aderencia === "PARCIAL" ? 0.5 : 0),
    0,
  );
  const gapScore = respondidos.length > 0 ? Math.round((weighted / respondidos.length) * 100) : null;
  const completude = Math.round((stats.answered / stats.total) * 100);
  const maturityFromGap = (s: number | null): { label: string; cls: string } => {
    if (s == null) return { label: "Sem dados suficientes", cls: "text-gray-500" };
    if (s >= 90) return { label: "Excelente", cls: "text-emerald-700" };
    if (s >= 75) return { label: "Boa", cls: "text-emerald-600" };
    if (s >= 50) return { label: "Em desenvolvimento", cls: "text-blue-600" };
    if (s >= 25) return { label: "Inicial", cls: "text-amber-700" };
    return { label: "Crítico", cls: "text-red-700" };
  };
  const maturity = maturityFromGap(gapScore);

  // Top pontos de melhoria (NAO_ADERENTE primeiro, depois PARCIAL — só com PM preenchido)
  const topPM = answers
    .filter((a) => a.pontoMelhoria && a.pontoMelhoria.trim())
    .sort((a, b) => {
      const order = (x: string | null) =>
        x === "NAO_ADERENTE" ? 0 : x === "PARCIAL" ? 1 : 2;
      return order(a.aderencia) - order(b.aderencia);
    })
    .slice(0, 10);

  return (
    <>
      {/* CSS de impressão — esconde controles, força fundo branco, ajusta margens */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .pdf-page { padding: 0 !important; max-width: none !important; }
          .pdf-section { break-inside: avoid; page-break-inside: avoid; }
          .pdf-page-break { page-break-after: always; }
        }
        @page { size: A4; margin: 1.5cm; }
      `}</style>

      {/* Barra de controles — só na tela, escondida no print */}
      <div className="no-print sticky top-0 z-10 border-b bg-white dark:bg-gray-950 dark:border-gray-800 p-3 flex items-center justify-between gap-2 shadow-sm">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/gap-analysis">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
        </Button>
        <div className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
          Diálogo de impressão abre automaticamente — escolha "Salvar como PDF" no destino.
        </div>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1.5" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="pdf-page max-w-4xl mx-auto p-8 bg-white text-gray-900 dark:bg-white dark:text-gray-900">
        {/* ============== Capa ============== */}
        <header className="pdf-section text-center space-y-3 py-12 border-b border-gray-300">
          <p className="text-sm uppercase tracking-widest text-gray-500">
            Relatório executivo
          </p>
          <h1 className="text-4xl font-bold">GAP Analysis — LGPD</h1>
          <p className="text-xl text-gray-700">{companyName}</p>
          <p className="text-sm text-gray-600 mt-4">
            Emitido em {new Date().toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-gray-500 italic max-w-xl mx-auto pt-4">
            Diagnóstico macro de adequação à LGPD baseado no template oficial
            "Matriz de Controles e Avaliação de Gaps" (LGPD PRO / Denise),
            com 119 controles em 28 domínios.
          </p>
        </header>

        {/* ============== Score ============== */}
        <section className="pdf-section py-8 border-b border-gray-300">
          <h2 className="text-2xl font-bold mb-4">Maturidade do GAP</h2>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={cn("text-7xl font-bold tabular-nums", maturity.cls)}>
                {gapScore ?? "—"}
                {gapScore != null && (
                  <span className="text-2xl font-normal text-gray-500">/100</span>
                )}
              </div>
              <div className={cn("text-sm font-medium uppercase tracking-wide mt-1", maturity.cls)}>
                {maturity.label}
              </div>
            </div>
            <div className="flex-1 text-sm text-gray-700 leading-relaxed">
              <p>
                Score calculado a partir das respostas de aderência:{" "}
                <strong>Aderente = 100, Parcial = 50, Não aderente = 0</strong>{" "}
                (controles "N/A" são excluídos).
              </p>
              <p className="mt-2">
                Foram <strong>{stats.answered}</strong> de{" "}
                <strong>{stats.total}</strong> controles respondidos
                ({completude}% de completude).
              </p>
            </div>
          </div>
        </section>

        {/* ============== KPIs ============== */}
        <section className="pdf-section py-8 border-b border-gray-300">
          <h2 className="text-2xl font-bold mb-4">Visão geral</h2>
          <div className="grid grid-cols-4 gap-3">
            <KpiBox label="Aderente" value={stats.byAderencia.ADERENTE} cls="text-emerald-700 border-emerald-300 bg-emerald-50" />
            <KpiBox label="Parcial" value={stats.byAderencia.PARCIAL} cls="text-amber-700 border-amber-300 bg-amber-50" />
            <KpiBox label="Não aderente" value={stats.byAderencia.NAO_ADERENTE} cls="text-red-700 border-red-300 bg-red-50" />
            <KpiBox label="N/A" value={stats.byAderencia.NA} cls="text-gray-700 border-gray-300 bg-gray-50" />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <KpiBox label="Não iniciado" value={stats.byMapeamento.NAO_INICIADO} cls="text-gray-700 border-gray-300 bg-gray-50" />
            <KpiBox label="Em andamento" value={stats.byMapeamento.EM_ANDAMENTO} cls="text-blue-700 border-blue-300 bg-blue-50" />
            <KpiBox label="Finalizado" value={stats.byMapeamento.FINALIZADO} cls="text-emerald-700 border-emerald-300 bg-emerald-50" />
          </div>
        </section>

        {/* ============== Top pontos de melhoria ============== */}
        <section className="pdf-section py-8 border-b border-gray-300">
          <h2 className="text-2xl font-bold mb-2">Pontos de melhoria priorizados</h2>
          <p className="text-sm text-gray-600 mb-4">
            Os 10 controles com maior necessidade de ação imediata
            (não-aderentes primeiro, depois parciais — todos com Ponto de
            Melhoria preenchido).
          </p>
          {topPM.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Nenhum ponto de melhoria registrado ainda.
            </p>
          ) : (
            <ol className="space-y-2 list-decimal list-inside">
              {topPM.map((a) => (
                <li key={a.controlCode} className="text-sm">
                  <strong className="font-mono text-xs mr-1">#{a.controlCode}</strong>
                  <span
                    className={cn(
                      "inline-block px-1.5 py-0 rounded text-[10px] mr-1.5 align-middle",
                      a.aderencia === "NAO_ADERENTE"
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300",
                    )}
                  >
                    {gapAderenciaLabel(a.aderencia)}
                  </span>
                  <span>{a.pontoMelhoria}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ============== Sumário por domínio ============== */}
        <section className="pdf-section py-8">
          <h2 className="text-2xl font-bold mb-2">Sumário por domínio</h2>
          <p className="text-sm text-gray-600 mb-4">
            Estado de cada um dos 28 domínios LGPD: completude (controles
            respondidos / total) e distribuição de aderência.
          </p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-400">
                <th className="text-left py-1.5 px-1">Domínio</th>
                <th className="text-right py-1.5 px-1 w-20">Completo</th>
                <th className="text-right py-1.5 px-1 w-12">Ader.</th>
                <th className="text-right py-1.5 px-1 w-12">Parc.</th>
                <th className="text-right py-1.5 px-1 w-14">Não ad.</th>
                <th className="text-right py-1.5 px-1 w-12">N/A</th>
              </tr>
            </thead>
            <tbody>
              {stats.byDomain.map((d) => {
                const pct = Math.round((d.answered / d.total) * 100);
                return (
                  <tr key={d.domainCode} className="border-b border-gray-200">
                    <td className="py-1.5 px-1">{d.domain}</td>
                    <td className="text-right py-1.5 px-1 tabular-nums">
                      {d.answered}/{d.total}
                      <span className="text-gray-500 ml-1">({pct}%)</span>
                    </td>
                    <td className="text-right py-1.5 px-1 tabular-nums text-emerald-700">
                      {d.byAderencia.ADERENTE || "—"}
                    </td>
                    <td className="text-right py-1.5 px-1 tabular-nums text-amber-700">
                      {d.byAderencia.PARCIAL || "—"}
                    </td>
                    <td className="text-right py-1.5 px-1 tabular-nums text-red-700">
                      {d.byAderencia.NAO_ADERENTE || "—"}
                    </td>
                    <td className="text-right py-1.5 px-1 tabular-nums text-gray-500">
                      {d.byAderencia.NA || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* ============== Footer ============== */}
        <footer className="pdf-section text-center text-xs text-gray-500 py-6 border-t border-gray-300">
          <p>
            Gerado pelo PGP — Programa de Governança em Privacidade ·{" "}
            {companyName}
          </p>
          <p className="mt-1">
            Documento confidencial — uso interno e direção. Estado vivo na
            data de emissão.
          </p>
        </footer>
      </div>
    </>
  );
}

function KpiBox({
  label,
  value,
  cls,
}: {
  label: string;
  value: number;
  cls: string;
}) {
  return (
    <div className={cn("border rounded-md text-center p-3", cls)}>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-wide font-medium">
        {label}
      </div>
    </div>
  );
}
