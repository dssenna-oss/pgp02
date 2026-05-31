"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { statusEntrega, eixoTag } from "@/lib/comite-ui";
import { salvarMarco, excluirMarco, type MarcoInput } from "@/app/dashboard/marcos/actions";

export type MarcoDTO = {
  id: string;
  dataISO: string;
  dataBR: string;
  descricao: string;
  eixoCodigos: string;
  tipo: string;
  status: string;
};

const VAZIO = (): MarcoDTO => ({
  id: "", dataISO: "", dataBR: "", descricao: "", eixoCodigos: "A", tipo: "NORMAL", status: "A_INICIAR",
});

const STATUS_MARCO: Record<string, string> = {
  A_INICIAR: "A iniciar", EM_ANDAMENTO: "Em andamento", CONCLUIDO: "Concluído", CRITICO: "Crítico",
};

export function MarcosClient({ marcos }: { marcos: MarcoDTO[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<MarcoDTO | null>(null);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">📌 Marcos críticos do biênio</h2>
        <button onClick={() => setEditando(VAZIO())} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-700 border border-brand-100 bg-brand-50 rounded-md px-2.5 py-1 hover:bg-brand-100">
          <Plus className="w-3.5 h-3.5" /> Novo marco
        </button>
      </div>
      <div className="bg-white border rounded-xl p-5">
        <ol className="relative ml-2 pl-6 border-l-2 border-slate-200 space-y-4">
          {marcos.map((m) => {
            const st = statusEntrega(m.status);
            const mae = m.tipo === "MAE";
            return (
              <li key={m.id} className="relative group">
                <span className={`absolute -left-[31px] top-1 rounded-full border-[3px] border-white shadow ${mae ? "w-[18px] h-[18px] -left-[33px] bg-amber-500" : "w-3.5 h-3.5 bg-brand-500"}`} />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[12px] font-extrabold text-gray-900 flex items-center gap-2 flex-wrap">
                      {m.dataBR}
                      {mae && <span className="text-amber-700">— MARCO-MÃE</span>}
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <div className="text-[13px] text-gray-700 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {m.descricao}
                      {m.eixoCodigos.split(",").filter(Boolean).map((c) => (
                        <span key={c} className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${eixoTag(c)}`}>{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => setEditando(m)} title="Editar" className="text-gray-300 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Excluir o marco "${m.descricao.slice(0, 40)}…"?`)) return;
                        const t = toast.loading("Excluindo…");
                        try { await excluirMarco(m.id); toast.success("Marco excluído", { id: t }); router.refresh(); }
                        catch { toast.error("Não foi possível excluir", { id: t }); }
                      }}
                      title="Excluir" className="text-gray-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {editando && <MarcoModal marco={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />}
    </>
  );
}

function MarcoModal({ marco, onClose, onSaved }: { marco: MarcoDTO; onClose: () => void; onSaved: () => void }) {
  const ehNovo = !marco.id;
  const [form, setForm] = useState<MarcoDTO>(marco);
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof MarcoDTO>(k: K, v: MarcoDTO[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function salvar() {
    if (!form.dataISO) return toast.error("Informe a data.");
    if (!form.descricao.trim()) return toast.error("Informe a descrição.");
    setSalvando(true);
    const input: MarcoInput = {
      id: form.id || undefined, data: form.dataISO, descricao: form.descricao,
      eixoCodigos: form.eixoCodigos, tipo: form.tipo, status: form.status,
    };
    try { await salvarMarco(input); toast.success(ehNovo ? "Marco criado" : "Marco atualizado"); onSaved(); }
    catch (e: any) { toast.error(e?.message ?? "Não foi possível salvar"); }
    finally { setSalvando(false); }
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{ehNovo ? "Novo marco" : "Editar marco"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div>
            <label className={labelCls}>Descrição *</label>
            <input className={inputCls} value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex.: Publicação do Aviso de Privacidade institucional" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Data *</label>
              <input type="date" className={inputCls} value={form.dataISO} onChange={(e) => set("dataISO", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUS_MARCO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Eixo(s)</label>
              <input className={inputCls} value={form.eixoCodigos} onChange={(e) => set("eixoCodigos", e.target.value)} placeholder="Ex.: A ou A,B,C,D,E" />
            </div>
            <div>
              <label className={labelCls}>Tipo</label>
              <select className={inputCls} value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>
                <option value="NORMAL">Normal</option>
                <option value="MAE">Marco-mãe</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">
            {salvando ? "Salvando…" : ehNovo ? "Criar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
