"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check } from "lucide-react";
import { MONITORAMENTO_CHECKLIST, CHECKLIST_TOTAL } from "@/lib/monitoramento-checklist";
import { alternarItem } from "@/app/dashboard/checklist-monitoramento/actions";

export function ChecklistMonitoramentoClient({ feitos }: { feitos: string[] }) {
  const router = useRouter();
  const [done, setDone] = useState<Set<string>>(new Set(feitos));
  const [salvando, setSalvando] = useState<string | null>(null);

  const totalFeito = done.size;
  const pctGeral = Math.round((totalFeito / CHECKLIST_TOTAL) * 100);

  async function toggle(itemId: string) {
    // otimista
    const novo = new Set(done);
    novo.has(itemId) ? novo.delete(itemId) : novo.add(itemId);
    setDone(novo);
    setSalvando(itemId);
    try {
      await alternarItem(itemId);
    } catch {
      toast.error("Não foi possível salvar");
      setDone(new Set(done)); // reverte
    } finally {
      setSalvando(null);
    }
  }

  return (
    <>
      {/* Progresso geral */}
      <div className="bg-white border rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">Progresso geral</span>
          <span className="text-[15px] font-extrabold text-gray-900">{totalFeito}/{CHECKLIST_TOTAL} · {pctGeral}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <span className="block h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pctGeral}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        {MONITORAMENTO_CHECKLIST.map((sec) => {
          const feitosSecao = sec.itens.filter((i) => done.has(i.id)).length;
          const pct = Math.round((feitosSecao / sec.itens.length) * 100);
          return (
            <section key={sec.id} className="bg-white border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between gap-3">
                <h2 className="text-[13.5px] font-bold text-gray-900">{sec.titulo}</h2>
                <span className={`text-[11.5px] font-bold ${pct === 100 ? "text-emerald-600" : "text-gray-500"}`}>{feitosSecao}/{sec.itens.length}</span>
              </div>
              <div className="divide-y">
                {sec.itens.map((item) => {
                  const checked = done.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggle(item.id)}
                      disabled={salvando === item.id}
                      className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50 disabled:opacity-60"
                    >
                      <span className={`mt-0.5 w-5 h-5 shrink-0 rounded border flex items-center justify-center ${checked ? "bg-emerald-500 border-emerald-500" : "border-gray-300 bg-white"}`}>
                        {checked && <Check className="w-3.5 h-3.5 text-white" />}
                      </span>
                      <span className={`text-[13px] ${checked ? "text-gray-400 line-through" : "text-gray-800"}`}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px] mt-5">
        💡 Marque os itens conforme forem sendo implementados — o progresso fica salvo e é compartilhado com todo o Comitê.
        Várias dessas práticas já têm ferramenta no app (Incidentes, Indicadores, Autoavaliação TCU, Plano de Ação).
      </div>
    </>
  );
}
