"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  type MaturityResult,
  maturityLevelLabel,
} from "@/lib/maturidade-pgp";

/**
 * View de impressão do Painel de Maturidade do PGP (B3).
 *
 * Layout limpo A4 — sem sidebar, sem chrome do app — pronto pra
 * o diálogo de impressão / Salvar como PDF do navegador.
 *
 * Auto-print ao montar quando `?autoprint=1`.
 */
export default function MaturidadePgpPdfView() {
  const [data, setData] = useState<MaturityResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/maturidade-pgp", { cache: "no-store" });
        if (r.ok) setData(await r.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-print quando ?autoprint=1
  useEffect(() => {
    if (loading || !data) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoprint") === "1") {
      // Pequeno delay pra garantir que o DOM carregou
      setTimeout(() => window.print(), 600);
    }
  }, [loading, data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Erro ao carregar dados.</p>
      </div>
    );
  }

  const today = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 18mm 16mm;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
        body {
          background: white !important;
        }
      `}</style>

      {/* Botão de imprimir manual (só na tela, não imprime) */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 text-sm font-medium shadow-lg"
        >
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      <div className="max-w-[170mm] mx-auto py-8 px-4 print:py-0 print:px-0">
        {/* Capa */}
        <header className="border-b-2 border-violet-600 pb-4 mb-6">
          <p className="text-xs uppercase tracking-widest text-violet-700 font-semibold mb-1">
            Relatório executivo
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Maturidade do Programa de Governança em Privacidade
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Documento gerado em {today}
          </p>
        </header>

        {/* Score + Nível */}
        <section className="mb-6 print:mb-4">
          <div className="flex items-baseline gap-6 border-l-4 border-violet-600 pl-4 py-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Score consolidado
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-violet-700">
                  {data.score}
                </span>
                <span className="text-xl text-gray-500">/100</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Nível de maturidade
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {maturityLevelLabel(data.level)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {data.levelDescription}
              </p>
            </div>
          </div>
        </section>

        {/* Pilares */}
        <section className="mb-6 print:mb-4">
          <h2 className="text-lg font-bold mb-3 text-gray-900 border-b border-gray-300 pb-1">
            Composição do score
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Pesos — Diagnóstico de Privacidade 40% · Plano de Ação em dia 20% · Políticas publicadas 15% · RIPDs aprovados 15% · Terceiros adequados 10%
          </p>
          <table className="w-full text-sm border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2 border-b border-gray-300 font-semibold">Pilar</th>
                <th className="text-right p-2 border-b border-gray-300 font-semibold">Score</th>
                <th className="text-right p-2 border-b border-gray-300 font-semibold">Peso</th>
                <th className="text-right p-2 border-b border-gray-300 font-semibold">Contribuição</th>
              </tr>
            </thead>
            <tbody>
              {data.pillars.map((p) => (
                <tr key={p.key} className="border-b border-gray-200">
                  <td className="p-2">
                    <p className="font-medium">{p.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.rationale}</p>
                  </td>
                  <td className="p-2 text-right tabular-nums font-semibold">{p.score}/100</td>
                  <td className="p-2 text-right tabular-nums">{p.weight}%</td>
                  <td className="p-2 text-right tabular-nums font-semibold text-violet-700">
                    {p.contribution.toFixed(1)} pts
                  </td>
                </tr>
              ))}
              <tr className="bg-violet-50 font-bold">
                <td className="p-2" colSpan={3}>
                  Total
                </td>
                <td className="p-2 text-right tabular-nums text-violet-800">
                  {data.score} pts
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Pendências críticas */}
        {data.criticalPending.length > 0 && (
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold mb-3 text-gray-900 border-b border-gray-300 pb-1">
              Pendências críticas ({data.criticalPending.length})
            </h2>
            <ul className="space-y-1.5 text-sm">
              {data.criticalPending.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className={
                      p.severity === "alta"
                        ? "text-red-700 font-bold flex-shrink-0"
                        : "text-amber-700 font-bold flex-shrink-0"
                    }
                  >
                    [{p.severity === "alta" ? "ALTA" : "MÉDIA"}]
                  </span>
                  <span>{p.message}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Status das fases */}
        <section className="mb-6 page-break print:page-break-before-always">
          <h2 className="text-lg font-bold mb-3 text-gray-900 border-b border-gray-300 pb-1">
            As 7 Fases do PGP em ação
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Cada fase tem KPIs reais derivados dos instrumentos do programa (Inventário, Riscos, GAP, Plano de Ação, Políticas, RIPD, Terceiros).
          </p>
          <table className="w-full text-sm border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2 border-b border-gray-300 font-semibold">Fase</th>
                <th className="text-left p-2 border-b border-gray-300 font-semibold">Descrição</th>
                <th className="text-center p-2 border-b border-gray-300 font-semibold">Progresso</th>
                <th className="text-left p-2 border-b border-gray-300 font-semibold">Status</th>
                <th className="text-left p-2 border-b border-gray-300 font-semibold">KPIs principais</th>
              </tr>
            </thead>
            <tbody>
              {data.phases.map((phase) => (
                <tr key={phase.id} className="border-b border-gray-200 align-top">
                  <td className="p-2 font-semibold">
                    {phase.number === 0 ? "Preliminar" : `Fase ${phase.number}`}
                  </td>
                  <td className="p-2 text-xs">{phase.description}</td>
                  <td className="p-2 text-center tabular-nums">{phase.progress}%</td>
                  <td className="p-2 text-xs">{phase.statusLabel}</td>
                  <td className="p-2 text-xs">
                    {phase.kpis.map((k, i) => (
                      <div key={i}>
                        <span className="text-gray-600">{k.label}:</span>{" "}
                        <span className={k.highlight ? "font-semibold" : ""}>{k.value}</span>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Rodapé */}
        <footer className="border-t border-gray-300 pt-3 mt-6 text-xs text-gray-500 italic">
          <p>
            Documento institucional do Programa de Governança em Privacidade —
            gerado automaticamente pelo PGP em {today}.
          </p>
          <p className="mt-1">
            <strong>Lembrete:</strong> O PGP é um programa contínuo, não um projeto. Este relatório é uma fotografia do momento e deve ser revisado trimestralmente pela Alta Direção, conforme item 9 da Política do PGP.
          </p>
        </footer>
      </div>
    </div>
  );
}
