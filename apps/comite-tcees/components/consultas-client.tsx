"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { statusConsulta, STATUS_CONSULTA } from "@/lib/comite-ui";
import { salvarConsulta, excluirConsulta, type ConsultaInput } from "@/app/dashboard/consultas/actions";

export type ConsultaDTO = {
  id: string;
  titulo: string;
  area: string | null;
  descricao: string | null;
  parecerCju: string | null;
  status: string;
  abertaISO: string | null;
  respondidaISO: string | null;
  abertaBR: string | null;
  respondidaBR: string | null;
};

const VAZIA = (): ConsultaDTO => ({
  id: "", titulo: "", area: "", descricao: "", parecerCju: "", status: "EM_ANALISE",
  abertaISO: "", respondidaISO: "", abertaBR: null, respondidaBR: null,
});

export function ConsultasClient({ consultas }: { consultas: ConsultaDTO[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<ConsultaDTO | null>(null);
  const pendentes = consultas.filter((c) => c.status !== "RESPONDIDA").length;

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">
          📝 {consultas.length} consultas · {pendentes} pendente(s)
        </div>
        <button onClick={() => setEditando(VAZIA())} className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Nova consulta
        </button>
      </div>

      <div className="space-y-3">
        {consultas.map((c) => {
          const st = statusConsulta(c.status);
          return (
            <div key={c.id} className={`bg-white border border-l-4 ${st.border} rounded-xl px-4 py-3.5`}>
              <div className="flex justify-between gap-3 items-start">
                <div className="text-sm font-bold text-gray-900">{c.titulo}</div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={st.variant}>{st.label}</Badge>
                  <button onClick={() => setEditando(c)} title="Editar" className="text-gray-300 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Excluir a consulta "${c.titulo}"?`)) return;
                      const t = toast.loading("Excluindo…");
                      try { await excluirConsulta(c.id); toast.success("Consulta excluída", { id: t }); router.refresh(); }
                      catch { toast.error("Não foi possível excluir", { id: t }); }
                    }}
                    title="Excluir" className="text-gray-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {c.descricao && <p className="text-[12.5px] text-gray-700 mt-1.5">{c.descricao}</p>}
              <div className="text-[11.5px] text-gray-500 mt-2 flex gap-3.5 flex-wrap">
                {c.area && <span><b className="text-gray-700">Área:</b> {c.area}</span>}
                {c.parecerCju && <span><b className="text-gray-700">Parecer CJU:</b> {c.parecerCju}</span>}
                {c.abertaBR && <span><b className="text-gray-700">Aberta em:</b> {c.abertaBR}</span>}
                {c.respondidaBR && <span><b className="text-gray-700">Respondida em:</b> {c.respondidaBR}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {editando && <ConsultaModal consulta={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />}
    </>
  );
}

function ConsultaModal({ consulta, onClose, onSaved }: { consulta: ConsultaDTO; onClose: () => void; onSaved: () => void }) {
  const ehNova = !consulta.id;
  const [form, setForm] = useState<ConsultaDTO>(consulta);
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof ConsultaDTO>(k: K, v: ConsultaDTO[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function salvar() {
    if (!form.titulo.trim()) return toast.error("Informe o título.");
    setSalvando(true);
    const input: ConsultaInput = {
      id: form.id || undefined,
      titulo: form.titulo, area: form.area ?? "", descricao: form.descricao ?? "",
      parecerCju: form.parecerCju ?? "", status: form.status,
      abertaEm: form.abertaISO ?? "", respondidaEm: form.respondidaISO ?? "",
    };
    try { await salvarConsulta(input); toast.success(ehNova ? "Consulta criada" : "Consulta atualizada"); onSaved(); }
    catch (e: any) { toast.error(e?.message ?? "Não foi possível salvar"); }
    finally { setSalvando(false); }
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{ehNova ? "Nova consulta prévia" : "Editar consulta"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div>
            <label className={labelCls}>Título *</label>
            <input className={inputCls} value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex.: Contratação de videomonitoramento" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Área</label>
              <input className={inputCls} value={form.area ?? ""} onChange={(e) => set("area", e.target.value)} placeholder="Ex.: SEGAFI + SGTI" />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUS_CONSULTA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Parecer CJU</label>
            <input className={inputCls} value={form.parecerCju ?? ""} onChange={(e) => set("parecerCju", e.target.value)} placeholder="Ex.: favorável" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Aberta em</label>
              <input type="date" className={inputCls} value={form.abertaISO ?? ""} onChange={(e) => set("abertaISO", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Respondida em</label>
              <input type="date" className={inputCls} value={form.respondidaISO ?? ""} onChange={(e) => set("respondidaISO", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Descrição</label>
            <textarea className={inputCls} rows={3} value={form.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} placeholder="Resumo da manifestação / situação…" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">
            {salvando ? "Salvando…" : ehNova ? "Criar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
