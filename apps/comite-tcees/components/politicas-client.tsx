"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, ExternalLink, X } from "lucide-react";
import {
  POLICY_TYPE,
  policyTypeLabel,
  policyStatusLabel,
  policyStatusBadgeClass,
} from "@/lib/policies-helpers";
import { criarPolicy, excluirPolicy } from "@/app/dashboard/execucao/politicas/actions";
import { usePodeEditar } from "@/lib/use-pode-editar";

export type PolicyListDTO = {
  id: string;
  type: string;
  title: string;
  slug: string;
  status: string;
  currentVersion: number;
  updatedAt: string;
  vinculadaInstrumento: boolean;
};

const TIPOS_CRIAVEIS = [
  POLICY_TYPE.AVISO_PRIVACIDADE_EXTERNO,
  POLICY_TYPE.POLITICA_PRIVACIDADE_INTERNO,
  POLICY_TYPE.POLITICA_COOKIES,
  POLICY_TYPE.TERMOS_USO,
  POLICY_TYPE.POLITICA_PGP,
  POLICY_TYPE.NORMA_PRIVACIDADE,
  POLICY_TYPE.POLITICA_RETENCAO,
  POLICY_TYPE.POLITICA_TREINAMENTO,
  POLICY_TYPE.POLITICA_TRANSFERENCIA,
  POLICY_TYPE.OUTRA,
] as const;

export function PoliticasClient({ policies }: { policies: PolicyListDTO[] }) {
  const router = useRouter();
  const podeEditar = usePodeEditar();
  const [criando, setCriando] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">
          📄 {policies.length} documento(s) · {policies.filter((p) => p.status === "PUBLICADA").length} publicado(s)
        </div>
        {podeEditar && (
          <button
            onClick={() => setCriando(true)}
            className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" /> Nova política
          </button>
        )}
      </div>

      {policies.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-gray-500 text-sm">
          Nenhuma política ainda. Crie uma pelo botão acima, ou abra um instrumento da Central
          (Aviso de Privacidade, Cookies, PSI…) que ele gera o documento a partir do modelo.
        </div>
      ) : (
        <div className="space-y-2">
          {policies.map((p) => (
            <div key={p.id} className="bg-white border rounded-xl px-3.5 py-3 flex items-center gap-3.5">
              <div className="flex-1 min-w-0">
                <Link href={`/dashboard/execucao/politicas/${p.id}`} className="text-[13.5px] font-semibold text-gray-900 hover:text-brand-600">
                  {p.title}
                </Link>
                <div className="text-[11.5px] text-gray-500 mt-1 flex gap-3 flex-wrap items-center">
                  <span>{policyTypeLabel(p.type)}</span>
                  {p.currentVersion > 0 && <span>· v{p.currentVersion}</span>}
                  {p.vinculadaInstrumento && <span className="text-brand-600">· ligada à Central</span>}
                </div>
              </div>
              <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${policyStatusBadgeClass(p.status)}`}>
                {policyStatusLabel(p.status)}
              </span>
              <div className="flex gap-1.5 shrink-0">
                {podeEditar && (
                  <Link href={`/dashboard/execucao/politicas/${p.id}`} title="Editar" className="text-gray-300 hover:text-brand-600">
                    <Pencil className="w-4 h-4" />
                  </Link>
                )}
                {p.status === "PUBLICADA" && (
                  <Link href={`/p/${p.slug}`} target="_blank" title="Ver público" className="text-gray-300 hover:text-emerald-600">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
                {podeEditar && (
                  <button
                    onClick={async () => {
                      if (!confirm(`Excluir "${p.title}"? Esta ação não pode ser desfeita.`)) return;
                      const t = toast.loading("Excluindo…");
                      try {
                        await excluirPolicy(p.id);
                        toast.success("Excluída", { id: t });
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

      {criando && <NovaPoliticaModal onClose={() => setCriando(false)} />}
    </>
  );
}

function NovaPoliticaModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<string>(POLICY_TYPE.AVISO_PRIVACIDADE_EXTERNO);
  const [criando, setCriando] = useState(false);

  async function criar() {
    setCriando(true);
    try {
      const r = await criarPolicy(tipo as any);
      toast.success("Política criada a partir do modelo");
      router.push(`/dashboard/execucao/politicas/${r.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível criar");
      setCriando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">Nova política</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Tipo de documento</label>
            <select
              className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {TIPOS_CRIAVEIS.map((t) => (
                <option key={t} value={t}>{policyTypeLabel(t)}</option>
              ))}
            </select>
          </div>
          <p className="text-[12px] text-gray-500">
            O documento começa a partir de um modelo pronto, já com os dados do TCE-ES preenchidos.
            Você ajusta o texto no editor e publica quando estiver pronto.
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
