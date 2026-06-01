"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { iniciais } from "@/lib/utils";
import { salvarMembro, excluirMembro, type MembroInput } from "@/app/dashboard/membros/actions";
import { usePodeEditar } from "@/lib/use-pode-editar";

export type MembroDTO = {
  id: string;
  nome: string;
  funcao: string;
  cargo: string | null;
  unidade: string | null;
  matricula: string | null;
  inciso: string | null;
  email: string | null;
  emailInterno: string | null;
};

const VAZIO = (): MembroDTO => ({
  id: "", nome: "", funcao: "Membro", cargo: "", unidade: "", matricula: "", inciso: "", email: "", emailInterno: "",
});

const FUNCOES = ["Presidente", "Coordenador", "Encarregado titular", "Encarregado substituto", "Membro"];

export function MembrosClient({ membros }: { membros: MembroDTO[] }) {
  const router = useRouter();
  const podeEditar = usePodeEditar();
  const [editando, setEditando] = useState<MembroDTO | null>(null);
  const unidades = new Set(membros.map((m) => m.unidade).filter(Boolean));

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">
          👤 {membros.length} integrantes · {unidades.size} unidades representadas
        </div>
        {podeEditar && (
          <button
            onClick={() => setEditando(VAZIO())}
            className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" /> Adicionar membro
          </button>
        )}
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {membros.map((m) => (
          <div key={m.id} className="bg-white border rounded-xl p-3.5 flex gap-3 items-start group">
            <div className="w-[42px] h-[42px] rounded-lg bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
              {iniciais(m.nome)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold text-gray-900">{m.nome}</div>
              <div className="text-[12px] text-brand-600 font-semibold mt-0.5">{m.funcao}</div>
              <div className="text-[11.5px] text-gray-500 mt-1">
                {m.cargo ? `${m.cargo} · ` : ""}
                {m.unidade}
                {m.matricula ? ` · mat. ${m.matricula}` : ""}
              </div>
              {m.email && <div className="text-[11px] text-gray-400 mt-0.5 truncate">{m.email}</div>}
              {m.emailInterno && <div className="text-[11px] text-gray-400 truncate" title="E-mail para comunicações internas do Comitê">↳ interno: {m.emailInterno}</div>}
            </div>
            {podeEditar && (
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => setEditando(m)} title="Editar" className="text-gray-300 hover:text-brand-600">
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`Remover ${m.nome} do Comitê?`)) return;
                    const t = toast.loading("Removendo…");
                    try {
                      await excluirMembro(m.id);
                      toast.success("Membro removido", { id: t });
                      router.refresh();
                    } catch {
                      toast.error("Não foi possível remover", { id: t });
                    }
                  }}
                  title="Remover"
                  className="text-gray-300 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {editando && (
        <MembroModal membro={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />
      )}
    </>
  );
}

function MembroModal({ membro, onClose, onSaved }: { membro: MembroDTO; onClose: () => void; onSaved: () => void }) {
  const ehNovo = !membro.id;
  const [form, setForm] = useState<MembroDTO>(membro);
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof MembroDTO>(k: K, v: MembroDTO[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function salvar() {
    if (!form.nome.trim()) return toast.error("Informe o nome.");
    setSalvando(true);
    const input: MembroInput = {
      id: form.id || undefined,
      nome: form.nome,
      funcao: form.funcao,
      cargo: form.cargo ?? "",
      unidade: form.unidade ?? "",
      matricula: form.matricula ?? "",
      inciso: form.inciso ?? "",
      email: form.email ?? "",
      emailInterno: form.emailInterno ?? "",
    };
    try {
      await salvarMembro(input);
      toast.success(ehNovo ? "Membro adicionado" : "Membro atualizado");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível salvar");
    } finally {
      setSalvando(false);
    }
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{ehNovo ? "Adicionar membro" : "Editar membro"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-3.5">
          <div>
            <label className={labelCls}>Nome *</label>
            <input className={inputCls} value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Nome completo" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Função *</label>
              <input className={inputCls} list="funcoes-comite" value={form.funcao} onChange={(e) => set("funcao", e.target.value)} placeholder="Ex.: Membro" />
              <datalist id="funcoes-comite">
                {FUNCOES.map((f) => <option key={f} value={f} />)}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Unidade</label>
              <input className={inputCls} value={form.unidade ?? ""} onChange={(e) => set("unidade", e.target.value)} placeholder="Ex.: SEGAFI" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Cargo</label>
            <input className={inputCls} value={form.cargo ?? ""} onChange={(e) => set("cargo", e.target.value)} placeholder="Ex.: Auditor de Controle Externo" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Matrícula</label>
              <input className={inputCls} value={form.matricula ?? ""} onChange={(e) => set("matricula", e.target.value)} placeholder="Ex.: 203.604" />
            </div>
            <div>
              <label className={labelCls}>Inciso (Portaria)</label>
              <input className={inputCls} value={form.inciso ?? ""} onChange={(e) => set("inciso", e.target.value)} placeholder="Ex.: I, a" />
            </div>
          </div>

          <div>
            <label className={labelCls}>E-mail (contato oficial / externo)</label>
            <input type="email" className={inputCls} value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="email@tcees.tc.br" />
          </div>

          <div>
            <label className={labelCls}>E-mail interno (comunicações do Comitê)</label>
            <input type="email" className={inputCls} value={form.emailInterno ?? ""} onChange={(e) => set("emailInterno", e.target.value)} placeholder="Opcional — só se for diferente do oficial" />
            <p className="text-[11px] text-gray-400 mt-1">Se preenchido, os avisos do Comitê (reunião, pauta) vão para cá em vez do e-mail oficial. Útil para o Encarregado, cujo e-mail oficial é a caixa pública do DPO.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">
            {salvando ? "Salvando…" : ehNovo ? "Adicionar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
