"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { statusDoc, STATUS_DOC } from "@/lib/comite-ui";
import { salvarDocumento, excluirDocumento, type DocumentoInput } from "@/app/dashboard/documentos/actions";
import { usePodeEditar } from "@/lib/use-pode-editar";

export type DocumentoDTO = {
  id: string;
  nome: string;
  tipo: string | null;
  versao: string | null;
  status: string;
  atualizadoEm: string | null;
  arquivoUrl: string | null;
};

const VAZIO = (): DocumentoDTO => ({
  id: "", nome: "", tipo: "", versao: "", status: "A_ELABORAR", atualizadoEm: "", arquivoUrl: "",
});

export function DocumentosClient({ documentos }: { documentos: DocumentoDTO[] }) {
  const router = useRouter();
  const podeEditar = usePodeEditar();
  const [editando, setEditando] = useState<DocumentoDTO | null>(null);

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">
          📄 Status: a elaborar → elaborado → pendente de aprovação → homologado
        </div>
        {podeEditar && (
          <button
            onClick={() => setEditando(VAZIO())}
            className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" /> Enviar documento
          </button>
        )}
      </div>

      {/* MOBILE: cartões empilhados */}
      <div className="sm:hidden space-y-2.5">
        {documentos.map((d) => {
          const st = statusDoc(d.status);
          return (
            <div key={d.id} className="bg-white border rounded-xl p-3.5">
              <div className="text-[13.5px] font-semibold text-gray-900">
                {d.arquivoUrl ? (
                  <a href={d.arquivoUrl} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">📎 {d.nome}</a>
                ) : d.nome}
              </div>
              <div className="text-[11.5px] text-gray-500 mt-1">
                {[d.tipo, d.versao].filter(Boolean).join(" · ") || "—"}
                {d.atualizadoEm ? ` · atualizado ${d.atualizadoEm}` : ""}
              </div>
              <div className="flex items-center justify-between gap-2 mt-2.5">
                <Badge variant={st.variant}>{st.label}</Badge>
                {podeEditar && (
                  <div className="flex gap-3">
                    <button onClick={() => setEditando(d)} title="Editar" className="text-gray-400 hover:text-brand-600">
                      <Pencil className="w-[18px] h-[18px]" />
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Excluir o documento "${d.nome}"?`)) return;
                        const t = toast.loading("Excluindo…");
                        try { await excluirDocumento(d.id); toast.success("Documento excluído", { id: t }); router.refresh(); }
                        catch { toast.error("Não foi possível excluir", { id: t }); }
                      }}
                      title="Excluir"
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {documentos.length === 0 && (
          <div className="bg-white border rounded-xl p-6 text-center text-sm text-gray-500">Nenhum documento cadastrado.</div>
        )}
      </div>

      {/* DESKTOP: tabela */}
      <div className="hidden sm:block overflow-x-auto bg-white border rounded-xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {["Documento", "Tipo", "Versão", "Status", "Atualizado", ""].map((h, i) => (
                <th key={i} className="text-left px-3.5 py-2.5 text-[11px] uppercase tracking-wide text-gray-500 font-bold border-b">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {documentos.map((d) => {
              const st = statusDoc(d.status);
              return (
                <tr key={d.id} className="border-b last:border-b-0">
                  <td className="px-3.5 py-3 text-[13px] font-semibold text-gray-900">
                    {d.arquivoUrl ? (
                      <a href={d.arquivoUrl} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">📎 {d.nome}</a>
                    ) : d.nome}
                  </td>
                  <td className="px-3.5 py-3 text-[13px] text-gray-600">{d.tipo ?? "—"}</td>
                  <td className="px-3.5 py-3 text-[13px] text-gray-600">{d.versao ?? "—"}</td>
                  <td className="px-3.5 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-3.5 py-3 text-[13px] text-gray-600">{d.atualizadoEm ?? "—"}</td>
                  <td className="px-3.5 py-3 whitespace-nowrap">
                    {podeEditar && (
                      <div className="flex gap-2">
                        <button onClick={() => setEditando(d)} title="Editar" className="text-gray-300 hover:text-brand-600">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Excluir o documento "${d.nome}"?`)) return;
                            const t = toast.loading("Excluindo…");
                            try {
                              await excluirDocumento(d.id);
                              toast.success("Documento excluído", { id: t });
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
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editando && (
        <DocumentoModal documento={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />
      )}
    </>
  );
}

function DocumentoModal({ documento, onClose, onSaved }: { documento: DocumentoDTO; onClose: () => void; onSaved: () => void }) {
  const ehNovo = !documento.id;
  const [form, setForm] = useState<DocumentoDTO>(documento);
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof DocumentoDTO>(k: K, v: DocumentoDTO[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function salvar() {
    if (!form.nome.trim()) return toast.error("Informe o nome do documento.");
    setSalvando(true);
    const input: DocumentoInput = {
      id: form.id || undefined,
      nome: form.nome,
      tipo: form.tipo ?? "",
      versao: form.versao ?? "",
      status: form.status,
      atualizadoEm: form.atualizadoEm ?? "",
      arquivoUrl: form.arquivoUrl ?? "",
    };
    try {
      await salvarDocumento(input);
      toast.success(ehNovo ? "Documento adicionado" : "Documento atualizado");
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
          <h2 className="text-base font-bold text-gray-900">{ehNovo ? "Novo documento" : "Editar documento"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-3.5">
          <div>
            <label className={labelCls}>Nome do documento *</label>
            <input className={inputCls} value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: Política Interna de Proteção de Dados" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tipo</label>
              <input className={inputCls} value={form.tipo ?? ""} onChange={(e) => set("tipo", e.target.value)} placeholder="Ex.: Política, Norma interna, Ata…" />
            </div>
            <div>
              <label className={labelCls}>Versão</label>
              <input className={inputCls} value={form.versao ?? ""} onChange={(e) => set("versao", e.target.value)} placeholder="Ex.: v1.0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUS_DOC).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Atualizado em</label>
              <input className={inputCls} value={form.atualizadoEm ?? ""} onChange={(e) => set("atualizadoEm", e.target.value)} placeholder="Ex.: 25/06/2024" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Link do documento (opcional)</label>
            <input className={inputCls} value={form.arquivoUrl ?? ""} onChange={(e) => set("arquivoUrl", e.target.value)} placeholder="https://… (link do arquivo no sistema)" />
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
