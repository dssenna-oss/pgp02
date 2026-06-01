"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { statusIndicador, eixoTag, STATUS_INDICADOR } from "@/lib/comite-ui";
import { salvarIndicador, excluirIndicador, type IndicadorInput } from "@/app/dashboard/indicadores/actions";
import { usePodeEditar } from "@/lib/use-pode-editar";

export type IndicadorDTO = {
  id: string;
  codigo: string;
  eixoCodigo: string;
  descricao: string;
  tipo: string;
  unidade: string | null;
  meta2026: string | null;
  meta2027: string | null;
  valorAtual: string | null;
  status: string;
  /** Etapa 3: valor calculado ao vivo das ferramentas das Fases (substitui o manual). */
  auto?: { valor: string; fonte: string; href: string } | null;
};

const GRUPOS = ["A", "B", "C", "D", "E", "IMPACTO"];
const EIXO_NOME: Record<string, string> = {
  A: "Eixo A — Governança e Homologação",
  B: "Eixo B — Inventário, Riscos e RIPDs",
  C: "Eixo C — Documentos Institucionais Externos",
  D: "Eixo D — Cultura Organizacional e Capacitação",
  E: "Eixo E — Monitoramento, Incidentes e Auditoria",
  IMPACTO: "Indicadores de impacto institucional (top-level)",
};
const TIPOS = ["Estrutural", "Processual", "Resultado", "Impacto"];

const VAZIO = (): IndicadorDTO => ({
  id: "", codigo: "", eixoCodigo: "A", descricao: "", tipo: "Resultado",
  unidade: "", meta2026: "", meta2027: "", valorAtual: "", status: "A_INICIAR",
});

export function IndicadoresClient({ indicadores }: { indicadores: IndicadorDTO[] }) {
  const router = useRouter();
  const podeEditar = usePodeEditar();
  const [editando, setEditando] = useState<IndicadorDTO | null>(null);

  return (
    <>
      {podeEditar && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setEditando(VAZIO())} className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700">
            <Plus className="w-4 h-4" /> Novo indicador
          </button>
        </div>
      )}

      {GRUPOS.map((g) => {
        const doGrupo = indicadores.filter((i) => i.eixoCodigo === g);
        if (doGrupo.length === 0) return null;
        return (
          <div key={g} className="mt-6">
            <h2 className="text-sm font-extrabold text-gray-900 mb-3">{EIXO_NOME[g]}</h2>
            <div className="overflow-x-auto bg-white border rounded-xl">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    {["Cód.", "Indicador", "Meta 2026", "Meta 2027", "Atual", "Status", ""].map((h, i) => (
                      <th key={i} className="text-left px-3 py-2.5 text-[11px] uppercase tracking-wide text-gray-500 font-bold border-b whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {doGrupo.map((i) => {
                    const st = statusIndicador(i.status);
                    return (
                      <tr key={i.id} className="border-b last:border-b-0">
                        <td className="px-3 py-2.5"><span className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${eixoTag(g)}`}>{i.codigo}</span></td>
                        <td className="px-3 py-2.5 text-[12.5px] text-gray-800 min-w-[200px]">{i.descricao}</td>
                        <td className="px-3 py-2.5 text-[12px] text-gray-600 whitespace-nowrap">{i.meta2026 ?? "—"}</td>
                        <td className="px-3 py-2.5 text-[12px] text-gray-600 whitespace-nowrap">{i.meta2027 ?? "—"}</td>
                        <td className="px-3 py-2.5 text-[12.5px] font-semibold text-gray-900 whitespace-nowrap">
                          {i.auto ? (
                            <Link href={i.auto.href} title={`Calculado automaticamente: ${i.auto.fonte}`} className="inline-flex items-center gap-1.5 group">
                              <span>{i.auto.valor}</span>
                              <span className="text-[9px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded group-hover:bg-emerald-200">⚙ auto</span>
                            </Link>
                          ) : (
                            i.valorAtual ?? "—"
                          )}
                        </td>
                        <td className="px-3 py-2.5"><Badge variant={st.variant}>{st.label}</Badge></td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {podeEditar && (
                            <div className="flex gap-1.5">
                              <button onClick={() => setEditando(i)} title="Editar" className="text-gray-300 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
                              <button
                                onClick={async () => {
                                  if (!confirm(`Excluir o indicador ${i.codigo}?`)) return;
                                  const t = toast.loading("Excluindo…");
                                  try { await excluirIndicador(i.id); toast.success("Indicador excluído", { id: t }); router.refresh(); }
                                  catch { toast.error("Não foi possível excluir", { id: t }); }
                                }}
                                title="Excluir" className="text-gray-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {editando && <IndicadorModal indicador={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />}
    </>
  );
}

function IndicadorModal({ indicador, onClose, onSaved }: { indicador: IndicadorDTO; onClose: () => void; onSaved: () => void }) {
  const ehNovo = !indicador.id;
  const [form, setForm] = useState<IndicadorDTO>(indicador);
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof IndicadorDTO>(k: K, v: IndicadorDTO[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function salvar() {
    if (!form.codigo.trim()) return toast.error("Informe o código.");
    if (!form.descricao.trim()) return toast.error("Informe a descrição.");
    setSalvando(true);
    const input: IndicadorInput = {
      id: form.id || undefined, codigo: form.codigo, eixoCodigo: form.eixoCodigo,
      descricao: form.descricao, tipo: form.tipo, unidade: form.unidade ?? "",
      meta2026: form.meta2026 ?? "", meta2027: form.meta2027 ?? "", valorAtual: form.valorAtual ?? "", status: form.status,
    };
    try { await salvarIndicador(input); toast.success(ehNovo ? "Indicador criado" : "Indicador atualizado"); onSaved(); }
    catch (e: any) { toast.error(e?.message ?? "Não foi possível salvar"); }
    finally { setSalvando(false); }
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{ehNovo ? "Novo indicador" : `Editar indicador ${form.codigo}`}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Código *</label>
              <input className={inputCls} value={form.codigo} onChange={(e) => set("codigo", e.target.value)} placeholder="Ex.: A1" />
            </div>
            <div>
              <label className={labelCls}>Eixo</label>
              <select className={inputCls} value={form.eixoCodigo} onChange={(e) => set("eixoCodigo", e.target.value)}>
                {GRUPOS.map((g) => <option key={g} value={g}>{g === "IMPACTO" ? "Impacto" : `Eixo ${g}`}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tipo</label>
              <select className={inputCls} value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Descrição *</label>
            <input className={inputCls} value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex.: RIPDs definitivos publicados" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Unidade</label>
              <input className={inputCls} value={form.unidade ?? ""} onChange={(e) => set("unidade", e.target.value)} placeholder="Ex.: %, un., sim/não" />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUS_INDICADOR).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Meta 2026</label>
              <input className={inputCls} value={form.meta2026 ?? ""} onChange={(e) => set("meta2026", e.target.value)} placeholder="Ex.: ≥ 12" />
            </div>
            <div>
              <label className={labelCls}>Meta 2027</label>
              <input className={inputCls} value={form.meta2027 ?? ""} onChange={(e) => set("meta2027", e.target.value)} placeholder="Ex.: 100%" />
            </div>
            <div>
              <label className={labelCls}>Valor atual</label>
              <input className={inputCls} value={form.valorAtual ?? ""} onChange={(e) => set("valorAtual", e.target.value)} placeholder="Ex.: 2/12" />
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
