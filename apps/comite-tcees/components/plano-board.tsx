"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { statusEntrega, eixoTag, TRIMESTRES, STATUS_ENTREGA } from "@/lib/comite-ui";
import { salvarEntrega, excluirEntrega, type EntregaInput } from "@/app/dashboard/plano/actions";

export type EntregaDTO = {
  id: string;
  titulo: string;
  descricao: string | null;
  eixoCodigo: string;
  trimestre: string;
  responsavel: string | null;
  prazoTexto: string | null;
  prazoISO: string | null;
  status: string;
};

const EIXOS = [
  { c: "A", n: "Governança / Homologação" },
  { c: "B", n: "Inventário / Riscos / RIPDs" },
  { c: "C", n: "Documentos externos" },
  { c: "D", n: "Cultura / Capacitação" },
  { c: "E", n: "Monitoramento / Auditoria" },
];

const EIXOS_FILTRO = [
  { f: "all", label: "Todos os eixos" },
  { f: "A", label: "Eixo A · Governança" },
  { f: "B", label: "Eixo B · Inventário/RIPD" },
  { f: "C", label: "Eixo C · Docs externos" },
  { f: "D", label: "Eixo D · Cultura" },
  { f: "E", label: "Eixo E · Monitoramento" },
];

const VAZIA = (): EntregaDTO => ({
  id: "", titulo: "", descricao: "", eixoCodigo: "A", trimestre: "Q3-2026",
  responsavel: "", prazoTexto: "", prazoISO: "", status: "A_INICIAR",
});

export function PlanoBoard({ entregas }: { entregas: EntregaDTO[] }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState("all");
  const [editando, setEditando] = useState<EntregaDTO | null>(null);

  const visiveis = entregas.filter((e) => filtro === "all" || e.eixoCodigo === filtro);
  const concluidas = entregas.filter((e) => e.status === "CONCLUIDO").length;
  const atrasadas = entregas.filter((e) => e.status === "ATRASADO").length;

  return (
    <>
      <div className="flex gap-2 flex-wrap mb-4">
        {EIXOS_FILTRO.map((c) => (
          <button
            key={c.f}
            onClick={() => setFiltro(c.f)}
            className={`text-xs font-semibold border rounded-full px-3 py-1.5 transition-colors ${
              filtro === c.f ? "bg-navy text-white border-navy" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">
          📋 {entregas.length} entregas · {concluidas} concluídas · {atrasadas} atrasadas
        </div>
        <button
          onClick={() => setEditando(VAZIA())}
          className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" /> Nova entrega
        </button>
      </div>

      {TRIMESTRES.map((q) => {
        const doQ = visiveis.filter((e) => e.trimestre === q.id);
        if (doQ.length === 0) return null;
        return (
          <div key={q.id} className="mb-6">
            <h3 className="text-[13px] font-extrabold text-brand-700 flex items-center gap-2 mb-2.5">
              <span className="bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded text-xs">{q.label}</span>
              {q.sub}
            </h3>
            <div className="space-y-2">
              {doQ.map((e) => {
                const st = statusEntrega(e.status);
                return (
                  <div key={e.id} className="bg-white border rounded-xl px-3.5 py-3 flex items-center gap-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold text-gray-900">{e.titulo}</div>
                      <div className="text-[11.5px] text-gray-500 mt-1 flex gap-3.5 flex-wrap items-center">
                        {e.responsavel && <span><b className="text-gray-700 font-semibold">Resp.:</b> {e.responsavel}</span>}
                        {e.prazoTexto && <span><b className="text-gray-700 font-semibold">Prazo:</b> {e.prazoTexto}</span>}
                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${eixoTag(e.eixoCodigo)}`}>Eixo {e.eixoCodigo}</span>
                      </div>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => setEditando(e)} title="Editar" className="text-gray-300 hover:text-brand-600">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Excluir a entrega "${e.titulo}"?`)) return;
                          const t = toast.loading("Excluindo…");
                          try {
                            await excluirEntrega(e.id);
                            toast.success("Entrega excluída", { id: t });
                            router.refresh();
                          } catch {
                            toast.error("Não foi possível excluir", { id: t });
                          }
                        }}
                        title="Excluir"
                        className="text-gray-300 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px] flex gap-2 mt-2">
        💡 Mudar o <b>status</b> de uma entrega para "concluído" atualiza automaticamente o <b>% de execução</b> e o
        progresso por eixo na Visão geral.
      </div>

      {editando && (
        <EntregaModal entrega={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />
      )}
    </>
  );
}

function EntregaModal({ entrega, onClose, onSaved }: { entrega: EntregaDTO; onClose: () => void; onSaved: () => void }) {
  const ehNova = !entrega.id;
  const [form, setForm] = useState<EntregaDTO>(entrega);
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof EntregaDTO>(k: K, v: EntregaDTO[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function salvar() {
    if (!form.titulo.trim()) return toast.error("Informe o título.");
    setSalvando(true);
    const input: EntregaInput = {
      id: form.id || undefined,
      titulo: form.titulo,
      descricao: form.descricao ?? "",
      eixoCodigo: form.eixoCodigo,
      trimestre: form.trimestre,
      responsavel: form.responsavel ?? "",
      prazoTexto: form.prazoTexto ?? "",
      prazoData: form.prazoISO ?? "",
      status: form.status,
    };
    try {
      await salvarEntrega(input);
      toast.success(ehNova ? "Entrega criada" : "Entrega atualizada");
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
          <h2 className="text-base font-bold text-gray-900">{ehNova ? "Nova entrega" : "Editar entrega"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-3.5">
          <div>
            <label className={labelCls}>Título *</label>
            <input className={inputCls} value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex.: Publicação do Aviso de Privacidade" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Eixo *</label>
              <select className={inputCls} value={form.eixoCodigo} onChange={(e) => set("eixoCodigo", e.target.value)}>
                {EIXOS.map((x) => <option key={x.c} value={x.c}>Eixo {x.c} · {x.n}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Trimestre *</label>
              <select className={inputCls} value={form.trimestre} onChange={(e) => set("trimestre", e.target.value)}>
                {TRIMESTRES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Responsável</label>
            <input className={inputCls} value={form.responsavel ?? ""} onChange={(e) => set("responsavel", e.target.value)} placeholder="Ex.: Coordenação + CJU" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Prazo (texto)</label>
              <input className={inputCls} value={form.prazoTexto ?? ""} onChange={(e) => set("prazoTexto", e.target.value)} placeholder="Ex.: 30/09/2026 ou Q3/2026" />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUS_ENTREGA).filter(([k]) => k !== "CRITICO").map(([k, v]) => (
                  <option key={k} value={k}>{v.label.replace("✓ ", "")}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Data exata <span className="font-normal text-gray-400">(opcional — aparece no Calendário)</span></label>
            <input type="date" className={inputCls} value={form.prazoISO ?? ""} onChange={(e) => set("prazoISO", e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Descrição <span className="font-normal text-gray-400">(opcional)</span></label>
            <textarea className={inputCls} rows={2} value={form.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} />
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
