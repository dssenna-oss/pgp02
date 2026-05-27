"use client";

// Lista de Setores que tratam dados — prática 2A da Fase 2.
// Mostra os 2 processos pré-cadastrados do órgão (puxados dos seeds),
// permite ao grupo marcar como "discutido" e registrar observações curtas.

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Check, Save } from "lucide-react";
import { salvarSetores, type SetorContexto, type SetorDiscutido, type SetoresSalvos } from "./actions";

export function SetoresView({
  setores,
  salvos,
}: {
  setores: SetorContexto[];
  salvos: SetoresSalvos | null;
}) {
  // Estado inicial: mescla contexto com salvo (se houver)
  const [estado, setEstado] = useState<Record<string, SetorDiscutido>>(() => {
    const m: Record<string, SetorDiscutido> = {};
    setores.forEach((s) => {
      const sv = salvos?.setores.find((x) => x.id === s.id);
      m[s.id] = sv || { id: s.id, discutido: false, observacao: "" };
    });
    return m;
  });
  const [salvando, setSalvando] = useState(false);

  function toggleDiscutido(id: string) {
    setEstado((p) => ({ ...p, [id]: { ...p[id], discutido: !p[id].discutido } }));
  }
  function setObservacao(id: string, v: string) {
    setEstado((p) => ({ ...p, [id]: { ...p[id], observacao: v } }));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const lista = setores.map((s) => estado[s.id]);
      const r = await salvarSetores(lista);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Salvo. Sigam pra Priorização ou Roadmap.");
    } finally {
      setSalvando(false);
    }
  }

  const discutidos = Object.values(estado).filter((s) => s.discutido).length;

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/dashboard/fase-2"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-3"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar à Fase 2
      </Link>

      <div className="mb-1 text-xs uppercase tracking-wide text-gray-500 font-semibold">
        Fase 2 · Prática 2A
      </div>
      <h1 className="text-2xl font-bold text-gray-900">🏢 Setores que tratam dados pessoais</h1>
      <p className="text-sm text-gray-600 mt-1">
        Em uma instituição real, vocês usariam a <strong>Carta de Serviços</strong> como fonte
        para identificar TODOS os processos. No curso, simplificamos: o grupo recebe os{" "}
        {setores.length} processos críticos já pré-cadastrados — discutam cada um, registrem
        observações, e sigam para a Priorização.
      </p>

      <div className="mt-5 space-y-3">
        {setores.map((s, idx) => {
          const st = estado[s.id];
          return (
            <div
              key={s.id}
              className={`rounded-lg border-l-4 ${
                st.discutido
                  ? "border-l-emerald-500 border-emerald-200 bg-emerald-50/30"
                  : "border-l-gray-300 border-gray-200 bg-white"
              } border p-4 transition-colors`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleDiscutido(s.id)}
                  aria-label={st.discutido ? "Marcar como não discutido" : "Marcar como discutido"}
                  className={`shrink-0 h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
                    st.discutido
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200 border border-gray-300"
                  }`}
                >
                  {st.discutido ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900">{s.nomeProcesso}</h3>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Setor responsável: <span className="font-medium text-gray-700">{s.setor}</span>
                  </div>
                  <p className="text-xs text-gray-700 mt-2 leading-relaxed">{s.finalidade}</p>
                  <div className="mt-3">
                    <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                      Observações do grupo
                    </label>
                    <textarea
                      value={st.observacao}
                      onChange={(e) => setObservacao(s.id, e.target.value)}
                      rows={2}
                      placeholder="Ex: este processo é crítico porque... / atenção pra... / dúvida a esclarecer..."
                      className="mt-1 w-full px-2.5 py-1.5 border rounded-md text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 sticky bottom-0 bg-white/95 backdrop-blur border-t pt-3 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="text-xs text-gray-600">
          {discutidos}/{setores.length} discutido(s)
        </div>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
