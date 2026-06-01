"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, FileText } from "lucide-react";
import { ripdStatusLabel, ripdStatusBadgeClass } from "@/lib/ripd-helpers";
import { criarRipd, excluirRipd } from "@/app/dashboard/execucao/ripd/actions";
import { usePodeEditar } from "@/lib/use-pode-editar";

export type RipdListDTO = {
  id: string;
  title: string;
  status: string;
  inventoryName: string | null;
  publishedVersionNum: number | null;
  updatedAt: string;
};

export type InventoryOption = { id: string; nome: string; jaTemRipd: boolean };

export function RipdListClient({
  ripds,
  inventario,
}: {
  ripds: RipdListDTO[];
  inventario: InventoryOption[];
}) {
  const router = useRouter();
  const podeEditar = usePodeEditar();
  const [criando, setCriando] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">
          📋 {ripds.length} RIPD(s) · {ripds.filter((r) => r.status === "APROVADO").length} aprovado(s)
        </div>
        {podeEditar && (
          <button onClick={() => setCriando(true)} className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700">
            <Plus className="w-4 h-4" /> Novo RIPD
          </button>
        )}
      </div>

      {ripds.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-gray-500 text-sm">
          Nenhum RIPD ainda. Crie um a partir de um processo do Inventário — as seções já vêm
          pré-preenchidas com os dados do processo e seus riscos.
        </div>
      ) : (
        <div className="space-y-2">
          {ripds.map((r) => (
            <div key={r.id} className="bg-white border rounded-xl px-3.5 py-3 flex items-center gap-3.5">
              <div className="flex-1 min-w-0">
                <Link href={`/dashboard/execucao/ripd/${r.id}`} className="text-[13.5px] font-semibold text-gray-900 hover:text-brand-600">
                  {r.title}
                </Link>
                <div className="text-[11.5px] text-gray-500 mt-1 flex gap-3 flex-wrap items-center">
                  {r.inventoryName && <span>Processo: {r.inventoryName}</span>}
                  {r.publishedVersionNum ? <span>· v{r.publishedVersionNum}</span> : null}
                </div>
              </div>
              <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${ripdStatusBadgeClass(r.status)}`}>
                {ripdStatusLabel(r.status)}
              </span>
              <div className="flex gap-1.5 shrink-0">
                {podeEditar && (
                  <Link href={`/dashboard/execucao/ripd/${r.id}`} title="Editar" className="text-gray-300 hover:text-brand-600">
                    <Pencil className="w-4 h-4" />
                  </Link>
                )}
                <a href={`/api/ripd/${r.id}/docx`} title="Baixar DOCX" className="text-gray-300 hover:text-brand-600">
                  <FileText className="w-4 h-4" />
                </a>
                {podeEditar && (
                  <button
                    onClick={async () => {
                      if (!confirm(`Excluir "${r.title}"?`)) return;
                      const t = toast.loading("Excluindo…");
                      try {
                        await excluirRipd(r.id);
                        toast.success("Excluído", { id: t });
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
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {criando && <NovoRipdModal inventario={inventario} onClose={() => setCriando(false)} />}
    </>
  );
}

function NovoRipdModal({ inventario, onClose }: { inventario: InventoryOption[]; onClose: () => void }) {
  const router = useRouter();
  const [invId, setInvId] = useState<string>(inventario[0]?.id ?? "");
  const [criando, setCriando] = useState(false);

  async function criar() {
    setCriando(true);
    try {
      const r = await criarRipd({ inventoryId: invId || null });
      if ("erro" in r) {
        toast.error(r.erro);
        setCriando(false);
        return;
      }
      toast.success("RIPD criado");
      router.push(`/dashboard/execucao/ripd/${r.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível criar");
      setCriando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">Novo RIPD</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Processo do Inventário</label>
            <select className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500" value={invId} onChange={(e) => setInvId(e.target.value)}>
              <option value="">— Em branco (sem processo) —</option>
              {inventario.map((i) => (
                <option key={i.id} value={i.id}>{i.nome}{i.jaTemRipd ? " (já tem RIPD)" : ""}</option>
              ))}
            </select>
          </div>
          <p className="text-[12px] text-gray-500">
            Ao escolher um processo, as 8 seções já vêm preenchidas com os dados dele (finalidade, base legal,
            dados tratados) e a lista de riscos da Fase 3. Você complementa e aprova.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={criar} disabled={criando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">
            {criando ? "Criando…" : "Criar e editar"}
          </button>
        </div>
      </div>
    </div>
  );
}
