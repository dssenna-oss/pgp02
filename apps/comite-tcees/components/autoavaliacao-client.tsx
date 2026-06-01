"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip,
} from "recharts";
import { ChevronDown, RotateCcw, Sparkles } from "lucide-react";
import type { TcuDiagnostico } from "@/lib/tcu-diagnostico";
import { RESPOSTA_LABEL } from "@/lib/tcu-catalog";
import { responderTcu, redefinirTcu } from "@/app/dashboard/autoavaliacao/actions";
import { usePodeEditar } from "@/lib/use-pode-editar";

const fmt = (n: number) => n.toFixed(2).replace(".", ",");

const ATIVO_CLS: Record<string, string> = {
  SIM: "bg-emerald-600 text-white border-emerald-600",
  PARCIAL: "bg-amber-600 text-white border-amber-600",
  NAO: "bg-red-600 text-white border-red-600",
  NA: "bg-slate-500 text-white border-slate-500",
};

export function AutoavaliacaoClient({ diag }: { diag: TcuDiagnostico }) {
  const router = useRouter();
  const podeEditar = usePodeEditar();
  const [aberta, setAberta] = useState<string | null>(diag.dimensoes[0]?.key ?? null);

  const radarData = diag.dimensoes.map((d) => ({
    dim: d.nome.split(" ")[0],
    org: Math.round(d.valor * 100),
    media: Math.round(d.media * 100),
  }));

  const pctInd = Math.round(diag.indicador * 100);
  const acimaMedia = diag.indicador >= diag.mediaGeral;

  async function responder(code: string, resposta: string) {
    try { await responderTcu({ questionCode: code, resposta }); router.refresh(); }
    catch (e: any) { toast.error(e?.message ?? "Falhou"); }
  }
  async function redefinir(code: string) {
    try { await redefinirTcu(code); router.refresh(); }
    catch { toast.error("Falhou"); }
  }

  return (
    <div className="space-y-5">
      {/* Indicador + radar */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-5 flex flex-col justify-center">
          <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">Indicador de adequação à LGPD</div>
          <div className="flex items-end gap-3 mt-1">
            <span className={`text-5xl font-extrabold ${diag.nivel.cor}`}>{fmt(diag.indicador)}</span>
            <span className="text-sm text-gray-400 mb-2">de 1,00 · {pctInd}%</span>
          </div>
          <div className={`text-lg font-bold ${diag.nivel.cor}`}>{diag.nivel.label}</div>
          <div className="mt-3 text-[12.5px] text-gray-600">
            Média nacional (382 órgãos): <b>{fmt(diag.mediaGeral)}</b> ·{" "}
            <span className={acimaMedia ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
              {acimaMedia ? "acima" : "abaixo"} da média
            </span>
          </div>
          <div className="mt-3 text-[11.5px] text-gray-500">
            {diag.respondidas}/{diag.totalQuestoes} respondidas · {diag.autoCount} preenchidas automaticamente ⚙
          </div>
          <div className="mt-3 text-[11px] text-gray-400">
            Níveis: Inexpressivo (≤0,15) · Inicial (≤0,5) · Intermediário (≤0,8) · Aprimorado (&gt;0,8)
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold mb-2">Dimensões — sua organização × média nacional</div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="Média nacional" dataKey="media" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.25} />
              <Radar name="Sua organização" dataKey="org" stroke="#1e3a5f" fill="#1e3a5f" fillOpacity={0.4} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dimensões */}
      {diag.dimensoes.map((d) => {
        const aberto = aberta === d.key;
        const acima = d.valor >= d.media;
        return (
          <div key={d.key} className="bg-white border rounded-xl overflow-hidden">
            <button onClick={() => setAberta(aberto ? null : d.key)} className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 hover:bg-slate-50 text-left">
              {/* Esquerda: badge (oculto no mobile) + nome (cede espaço) */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 shrink-0">{d.perspectiva === 1 ? "Estruturação" : "Controles"}</span>
                <span className="font-semibold text-gray-900 text-[13.5px] sm:text-[14px] min-w-0">{d.nome}</span>
              </div>
              {/* Direita: números compactos, protegidos contra corte */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="text-[11.5px] sm:text-[12px] text-gray-500 tabular-nums whitespace-nowrap">{d.respondidas}/{d.total}</span>
                <span className={`text-[13.5px] sm:text-[14px] font-extrabold tabular-nums ${acima ? "text-emerald-600" : "text-amber-600"}`}>{fmt(d.valor)}</span>
                <span className="text-[10px] sm:text-[11px] text-gray-400 whitespace-nowrap">méd {fmt(d.media)}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${aberto ? "rotate-180" : ""}`} />
              </div>
            </button>

            {aberto && (
              <div className="border-t divide-y">
                {d.questoes.map((q) => {
                  const opcoes: string[] = q.escala === "SPN" ? ["SIM", "PARCIAL", "NAO"] : ["SIM", "NAO"];
                  if (q.permiteNA) opcoes.push("NA");
                  return (
                    <div key={q.code} className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <span className="text-[11px] font-bold text-brand-700 shrink-0 mt-0.5">{q.code}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] text-gray-800">{q.texto}</div>
                          <div className="text-[10.5px] text-gray-400 mt-0.5">{q.ref} · média nacional {fmt(q.media)}</div>
                        </div>
                        {q.origem === "auto" && (
                          <span className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 shrink-0" title={q.autoFonte ?? ""}>
                            <Sparkles className="w-2.5 h-2.5" />auto
                          </span>
                        )}
                        {q.origem === "pendente" && (
                          <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0">pendente</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap pl-6">
                        {opcoes.map((op) => {
                          const ativo = q.resposta === op;
                          return (
                            <button
                              key={op}
                              onClick={() => responder(q.code, op)}
                              disabled={!podeEditar}
                              className={`text-[11.5px] font-semibold rounded-full px-2.5 py-1 border transition-colors ${
                                ativo ? ATIVO_CLS[op] : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                              } ${podeEditar ? "" : "cursor-default opacity-90"}`}
                            >
                              {RESPOSTA_LABEL[op as keyof typeof RESPOSTA_LABEL]}
                            </button>
                          );
                        })}
                        {podeEditar && q.origem === "manual" && q.autoFonte && (
                          <button onClick={() => redefinir(q.code)} title="Voltar ao automático" className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-brand-600 ml-1">
                            <RotateCcw className="w-3 h-3" /> auto
                          </button>
                        )}
                      </div>
                      {q.autoFonte && q.origem === "auto" && (
                        <div className="text-[10.5px] text-emerald-700 mt-1 pl-6">Fonte: {q.autoFonte}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px]">
        💡 Pontuação oficial do TCU: <b>Sim=1 · Parcialmente=0,5 · Não=0</b>, somando ÷ 42 controles. As respostas <b>⚙ auto</b>
        vêm do que o app já tem (Inventário, Riscos, Políticas, Incidentes, etc.) — clique nos botões para confirmar ou ajustar.
        Questões <b>pendentes</b> contam como "Não" até serem respondidas.
      </div>
    </div>
  );
}
