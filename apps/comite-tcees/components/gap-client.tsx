"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { GAP_DOMAINS } from "@/lib/gap-catalog";
import { scorePorDominio, scoreGeral, type RespostaMap } from "@/lib/gap-score";
import { salvarGap } from "@/app/dashboard/gap/actions";

type Resposta = { aderencia?: string | null; cenarioAtual?: string | null; pontoMelhoria?: string | null };

const ADER = [
  { v: "ADERENTE", label: "Aderente", on: "bg-emerald-600 text-white border-emerald-600", off: "text-emerald-700 border-emerald-200 hover:bg-emerald-50" },
  { v: "PARCIAL", label: "Parcial", on: "bg-amber-500 text-white border-amber-500", off: "text-amber-700 border-amber-200 hover:bg-amber-50" },
  { v: "NAO_ADERENTE", label: "Não aderente", on: "bg-red-600 text-white border-red-600", off: "text-red-700 border-red-200 hover:bg-red-50" },
  { v: "NA", label: "N.A.", on: "bg-slate-500 text-white border-slate-500", off: "text-slate-600 border-slate-200 hover:bg-slate-50" },
];

function scoreColor(score: number | null) {
  if (score === null) return "text-gray-400";
  if (score >= 80) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export function GapClient({ respostasIniciais }: { respostasIniciais: Record<string, Resposta> }) {
  const router = useRouter();
  const [respostas, setRespostas] = useState<Record<string, Resposta>>(respostasIniciais);
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [detalhe, setDetalhe] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const geral = scoreGeral(respostas as RespostaMap);
  const domScores = scorePorDominio(respostas as RespostaMap);
  const scoreByDomain = Object.fromEntries(domScores.map((d) => [d.code, d]));

  function toggleSet(setFn: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) {
    setFn((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  async function salvar(controlCode: string, patch: Resposta) {
    setRespostas((prev) => ({ ...prev, [controlCode]: { ...prev[controlCode], ...patch } }));
    setSalvando(controlCode);
    try {
      await salvarGap({
        controlCode,
        aderencia: patch.aderencia !== undefined ? patch.aderencia : respostas[controlCode]?.aderencia,
        cenarioAtual: patch.cenarioAtual !== undefined ? (patch.cenarioAtual ?? "") : (respostas[controlCode]?.cenarioAtual ?? ""),
        pontoMelhoria: patch.pontoMelhoria !== undefined ? (patch.pontoMelhoria ?? "") : (respostas[controlCode]?.pontoMelhoria ?? ""),
      });
      startTransition(() => router.refresh());
    } catch {
      toast.error("Não foi possível salvar");
    } finally {
      setSalvando(null);
    }
  }

  return (
    <>
      {/* Resumo */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4 mb-5">
        <div className="bg-white border rounded-xl p-4 border-l-4 border-l-brand-500">
          <div className="text-xs text-gray-500 font-semibold">Aderência geral</div>
          <div className={`text-3xl font-extrabold mt-1 ${scoreColor(geral.score)}`}>{geral.score === null ? "—" : `${geral.score}%`}</div>
          <div className="text-[11px] text-gray-500 mt-1">{geral.respondidos} de {geral.totalCatalogo} controles respondidos</div>
        </div>
        <div className="bg-white border rounded-xl p-4"><div className="text-xs text-gray-500 font-semibold">Aderentes</div><div className="text-2xl font-extrabold text-emerald-600 mt-1">{geral.aderentes}</div></div>
        <div className="bg-white border rounded-xl p-4"><div className="text-xs text-gray-500 font-semibold">Parciais</div><div className="text-2xl font-extrabold text-amber-600 mt-1">{geral.parciais}</div></div>
        <div className="bg-white border rounded-xl p-4"><div className="text-xs text-gray-500 font-semibold">Não aderentes</div><div className="text-2xl font-extrabold text-red-600 mt-1">{geral.naoAderentes}</div></div>
      </div>

      <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold mb-3">
        🧩 {GAP_DOMAINS.length} domínios · {geral.totalCatalogo} controles (template oficial LGPD)
      </div>

      {/* Domínios (accordion) */}
      <div className="space-y-2">
        {GAP_DOMAINS.map((d) => {
          const sc = scoreByDomain[d.code];
          const aberto = abertos.has(d.code);
          return (
            <div key={d.code} className="bg-white border rounded-xl overflow-hidden">
              <button onClick={() => toggleSet(setAbertos, d.code)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50">
                {aberto ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-bold text-gray-900">{d.name}</div>
                  <div className="text-[11px] text-gray-500">{sc.respondidos}/{sc.total} respondidos{sc.na ? ` · ${sc.na} N.A.` : ""}</div>
                </div>
                <div className={`text-lg font-extrabold ${scoreColor(sc.score)} shrink-0`}>{sc.score === null ? "—" : `${sc.score}%`}</div>
              </button>

              {aberto && (
                <div className="border-t divide-y">
                  {d.controls.map((c) => {
                    const r = respostas[c.code] ?? {};
                    const det = detalhe.has(c.code);
                    return (
                      <div key={c.code} className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-bold text-gray-400 mt-0.5 shrink-0">{c.code}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12.5px] text-gray-800">{c.question}</div>
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {ADER.map((a) => {
                                const sel = r.aderencia === a.v;
                                return (
                                  <button
                                    key={a.v}
                                    onClick={() => salvar(c.code, { aderencia: sel ? null : a.v })}
                                    className={`text-[11.5px] font-semibold border rounded-full px-2.5 py-1 transition-colors ${sel ? a.on : `bg-white ${a.off}`}`}
                                  >
                                    {a.label}
                                  </button>
                                );
                              })}
                              {salvando === c.code && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
                              <button onClick={() => toggleSet(setDetalhe, c.code)} className="text-[11px] text-brand-600 hover:underline ml-1">
                                {det ? "ocultar detalhes" : "detalhar"}
                              </button>
                            </div>

                            {det && (
                              <div className="mt-2.5 space-y-2 bg-slate-50 rounded-lg p-3">
                                {c.article && <div className="text-[11px] text-gray-500"><b>Base legal:</b> {c.article.slice(0, 300)}{c.article.length > 300 ? "…" : ""}</div>}
                                <div>
                                  <label className="text-[11px] font-semibold text-gray-600">Cenário atual</label>
                                  <textarea defaultValue={r.cenarioAtual ?? ""} onBlur={(e) => { if (e.target.value !== (r.cenarioAtual ?? "")) salvar(c.code, { cenarioAtual: e.target.value }); }} rows={2} className="w-full mt-1 px-2.5 py-1.5 border rounded-md text-[12px] outline-none focus:ring-2 focus:ring-brand-500" placeholder="Como está hoje na instituição…" />
                                </div>
                                <div>
                                  <label className="text-[11px] font-semibold text-gray-600">Ponto de melhoria</label>
                                  <textarea defaultValue={r.pontoMelhoria ?? ""} onBlur={(e) => { if (e.target.value !== (r.pontoMelhoria ?? "")) salvar(c.code, { pontoMelhoria: e.target.value }); }} rows={2} className="w-full mt-1 px-2.5 py-1.5 border rounded-md text-[12px] outline-none focus:ring-2 focus:ring-brand-500" placeholder="O que precisa ser feito…" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px] flex gap-2 mt-4">
        💡 O GAP Analysis (marco de Q3/2026 do Plano) mede o quão aderente o TCEES está à LGPD. Os pontos de melhoria marcados aqui viram insumo para o Plano de Ação (Fase 5).
      </div>
    </>
  );
}
