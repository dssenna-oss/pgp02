import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { calcularDiagnostico } from "@/lib/diagnostico";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

function corBarra(score: number): string {
  if (score <= 25) return "bg-red-500";
  if (score <= 50) return "bg-amber-500";
  if (score <= 75) return "bg-blue-500";
  return "bg-emerald-500";
}

export default async function DiagnosticoPage() {
  const diag = await calcularDiagnostico();
  // anel de progresso (SVG)
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (diag.overall / 100) * circ;

  return (
    <>
      <PageHeader
        emoji="🩺"
        title="Diagnóstico de Privacidade"
        lead="Fase 2 — termômetro da adequação à LGPD, calculado automaticamente a partir do GAP, Riscos e Inventário. Use as recomendações para subir a nota."
      />

      {/* Score + nível */}
      <div className="bg-white border rounded-xl p-5 flex items-center gap-6 flex-wrap mb-5">
        <div className="relative shrink-0" style={{ width: 128, height: 128 }}>
          <svg width="128" height="128" className="-rotate-90">
            <circle cx="64" cy="64" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
            <circle
              cx="64" cy="64" r={r} fill="none" strokeWidth="12" strokeLinecap="round"
              stroke={diag.overall <= 25 ? "#ef4444" : diag.overall <= 50 ? "#f59e0b" : diag.overall <= 75 ? "#3b82f6" : "#10b981"}
              strokeDasharray={`${dash} ${circ}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-gray-900">{diag.overall}</span>
            <span className="text-[10px] text-gray-400">de 100</span>
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">Nível de maturidade</div>
          <div className={`text-2xl font-extrabold mt-0.5 ${diag.nivel.cor}`}>{diag.nivel.label}</div>
          <div className="text-[12px] text-gray-500 mt-1">faixa {diag.nivel.faixa} · recalcula sozinho conforme você avança nas fases</div>
        </div>
      </div>

      {/* Pilares */}
      <h2 className="text-sm font-extrabold text-gray-900 mb-3">Pilares</h2>
      <div className="space-y-3 mb-6">
        {diag.pilares.map((p) => (
          <Link key={p.key} href={p.href} className="block bg-white border rounded-xl px-4 py-3 hover:border-brand-300 transition-colors">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="text-[13.5px] font-semibold text-gray-900">{p.label}</div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">peso {Math.round(p.weight * 100)}%</span>
                <span className="text-[15px] font-extrabold text-gray-900 tabular-nums">{p.semDados ? "—" : `${p.score}%`}</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <span className={`block h-full rounded-full ${corBarra(p.score)}`} style={{ width: `${p.score}%` }} />
            </div>
            <div className="text-[11.5px] text-gray-500 mt-1.5">{p.detail}</div>
          </Link>
        ))}
      </div>

      {/* Recomendações */}
      <h2 className="text-sm font-extrabold text-gray-900 mb-3">Recomendações para subir a nota</h2>
      {diag.recomendacoes.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-[13px]">
          🎉 Todos os pilares estão acima de 60%. Continue mantendo as fases atualizadas.
        </div>
      ) : (
        <div className="space-y-2">
          {diag.recomendacoes.map((rec, i) => (
            <Link key={i} href={rec.href} className="flex items-center gap-2 bg-white border rounded-lg px-3.5 py-2.5 text-[13px] text-gray-800 hover:border-brand-300 hover:text-brand-700">
              <span className="flex-1">{rec.texto}</span>
              <ArrowRight className="w-4 h-4 shrink-0 text-brand-600" />
            </Link>
          ))}
        </div>
      )}

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px] mt-6">
        💡 A nota é calculada ao vivo: <b>GAP 40% · Riscos 30% · Inventário 20% · Bases legais 10%</b>. Não há questionário —
        ela reflete o que já está preenchido nas ferramentas das fases. Esta nota também alimenta o indicador <b>I2</b> em Indicadores.
      </div>
    </>
  );
}
