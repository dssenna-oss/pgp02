"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { statusInventario, STATUS_INVENTARIO, HIPOTESE_MACRO } from "@/lib/comite-ui";
import { salvarInventario, excluirInventario, type InventarioInput } from "@/app/dashboard/inventario/actions";

export type InventarioDTO = {
  id: string;
  nome: string;
  unidadeGestora: string | null;
  hipoteseMacro: string | null;
  finalidade: string | null;
  baseLegal: string | null;
  tiposDados: string | null;
  dadosSensiveis: boolean;
  retencao: string | null;
  compartilhamento: string | null;
  medidasSeguranca: string | null;
  prioritario: boolean;
  status: string;
  observacoes: string | null;
};

const VAZIO = (): InventarioDTO => ({
  id: "", nome: "", unidadeGestora: "", hipoteseMacro: "IV", finalidade: "", baseLegal: "",
  tiposDados: "", dadosSensiveis: false, retencao: "", compartilhamento: "", medidasSeguranca: "",
  prioritario: false, status: "PRELIMINAR", observacoes: "",
});

export function InventarioClient({ processos }: { processos: InventarioDTO[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<InventarioDTO | null>(null);
  const [filtro, setFiltro] = useState<"todos" | "prioritarios" | "sensiveis">("todos");

  const visiveis = processos.filter((p) =>
    filtro === "prioritarios" ? p.prioritario : filtro === "sensiveis" ? p.dadosSensiveis : true,
  );
  const prioritarios = processos.filter((p) => p.prioritario).length;
  const sensiveis = processos.filter((p) => p.dadosSensiveis).length;

  const chip = (k: typeof filtro, label: string) => (
    <button
      onClick={() => setFiltro(k)}
      className={`text-xs font-semibold border rounded-full px-3 py-1.5 ${
        filtro === k ? "bg-navy text-white border-navy" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="flex gap-2 flex-wrap mb-4">
        {chip("todos", `Todos (${processos.length})`)}
        {chip("prioritarios", `Prioritários (${prioritarios})`)}
        {chip("sensiveis", `Com dados sensíveis (${sensiveis})`)}
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">
          🗂️ {processos.length} processos · {prioritarios} prioritários · {sensiveis} com dados sensíveis
        </div>
        <button onClick={() => setEditando(VAZIO())} className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Novo processo
        </button>
      </div>

      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
        {visiveis.map((p) => {
          const st = statusInventario(p.status);
          return (
            <div key={p.id} className="bg-white border rounded-xl p-4">
              <div className="flex justify-between gap-2 items-start">
                <div className="text-[13.5px] font-bold text-gray-900">{p.nome}</div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setEditando(p)} title="Editar" className="text-gray-300 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Excluir o processo "${p.nome}" do Inventário?`)) return;
                      const t = toast.loading("Excluindo…");
                      try { await excluirInventario(p.id); toast.success("Processo excluído", { id: t }); router.refresh(); }
                      catch { toast.error("Não foi possível excluir", { id: t }); }
                    }}
                    title="Excluir" className="text-gray-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant={st.variant}>{st.label}</Badge>
                {p.prioritario && <Badge variant="indigo">prioritário</Badge>}
                {p.dadosSensiveis && <Badge variant="red"><ShieldAlert className="w-3 h-3" /> dados sensíveis</Badge>}
                {p.hipoteseMacro && <Badge variant="gray">Hipótese {p.hipoteseMacro}</Badge>}
              </div>
              <div className="text-[11.5px] text-gray-500 mt-2 space-y-0.5">
                {p.unidadeGestora && <div><b className="text-gray-700">Unidade gestora:</b> {p.unidadeGestora}</div>}
                {p.hipoteseMacro && <div><b className="text-gray-700">Tratamento:</b> {HIPOTESE_MACRO[p.hipoteseMacro] ?? p.hipoteseMacro}</div>}
                {p.baseLegal && <div><b className="text-gray-700">Base legal:</b> {p.baseLegal}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px] flex gap-2 mt-4">
        💡 Os 12 processos prioritários têm Inventário inicial (2021) e serão refeitos sob metodologia atualizada (marco de Q3/2026).
        O Inventário será estendido aos ~103 processos restantes até Q2/2027.
      </div>

      {editando && <InventarioModal processo={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />}
    </>
  );
}

function InventarioModal({ processo, onClose, onSaved }: { processo: InventarioDTO; onClose: () => void; onSaved: () => void }) {
  const ehNovo = !processo.id;
  const [form, setForm] = useState<InventarioDTO>(processo);
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof InventarioDTO>(k: K, v: InventarioDTO[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function salvar() {
    if (!form.nome.trim()) return toast.error("Informe o nome do processo.");
    setSalvando(true);
    const input: InventarioInput = {
      id: form.id || undefined, nome: form.nome, unidadeGestora: form.unidadeGestora ?? "",
      hipoteseMacro: form.hipoteseMacro ?? "", finalidade: form.finalidade ?? "", baseLegal: form.baseLegal ?? "",
      tiposDados: form.tiposDados ?? "", dadosSensiveis: form.dadosSensiveis, retencao: form.retencao ?? "",
      compartilhamento: form.compartilhamento ?? "", medidasSeguranca: form.medidasSeguranca ?? "",
      prioritario: form.prioritario, status: form.status, observacoes: form.observacoes ?? "",
    };
    try { await salvarInventario(input); toast.success(ehNovo ? "Processo adicionado" : "Processo atualizado"); onSaved(); }
    catch (e: any) { toast.error(e?.message ?? "Não foi possível salvar"); }
    finally { setSalvando(false); }
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{ehNovo ? "Novo processo no Inventário" : "Editar processo"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div>
            <label className={labelCls}>Nome do processo / sistema *</label>
            <input className={inputCls} value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: SGP RH — Folha de Pagamento" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Unidade gestora</label>
              <input className={inputCls} value={form.unidadeGestora ?? ""} onChange={(e) => set("unidadeGestora", e.target.value)} placeholder="Ex.: SEGAFI" />
            </div>
            <div>
              <label className={labelCls}>Hipótese de tratamento</label>
              <select className={inputCls} value={form.hipoteseMacro ?? ""} onChange={(e) => set("hipoteseMacro", e.target.value)}>
                <option value="">—</option>
                {Object.entries(HIPOTESE_MACRO).map(([k, v]) => <option key={k} value={k}>{k} · {v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Finalidade</label>
            <textarea className={inputCls} rows={2} value={form.finalidade ?? ""} onChange={(e) => set("finalidade", e.target.value)} placeholder="Para que os dados são tratados…" />
          </div>
          <div>
            <label className={labelCls}>Base legal</label>
            <input className={inputCls} value={form.baseLegal ?? ""} onChange={(e) => set("baseLegal", e.target.value)} placeholder="Ex.: Art. 7º, III c/c art. 23, I, da LGPD" />
          </div>
          <div>
            <label className={labelCls}>Tipos de dados tratados</label>
            <textarea className={inputCls} rows={2} value={form.tiposDados ?? ""} onChange={(e) => set("tiposDados", e.target.value)} placeholder="Ex.: nome, CPF, matrícula, dados funcionais…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Retenção</label>
              <input className={inputCls} value={form.retencao ?? ""} onChange={(e) => set("retencao", e.target.value)} placeholder="Prazo de guarda" />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUS_INVENTARIO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Compartilhamento</label>
            <input className={inputCls} value={form.compartilhamento ?? ""} onChange={(e) => set("compartilhamento", e.target.value)} placeholder="Com quem os dados são compartilhados" />
          </div>
          <div>
            <label className={labelCls}>Medidas de segurança</label>
            <textarea className={inputCls} rows={2} value={form.medidasSeguranca ?? ""} onChange={(e) => set("medidasSeguranca", e.target.value)} placeholder="Controles de acesso, criptografia, logs…" />
          </div>
          <div className="flex gap-5 pt-1">
            <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={form.prioritario} onChange={(e) => set("prioritario", e.target.checked)} />
              Processo prioritário
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 accent-red-600" checked={form.dadosSensiveis} onChange={(e) => set("dadosSensiveis", e.target.checked)} />
              Trata dados sensíveis
            </label>
          </div>
          <div>
            <label className={labelCls}>Observações</label>
            <textarea className={inputCls} rows={2} value={form.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} />
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
