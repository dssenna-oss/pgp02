"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, ShieldAlert } from "lucide-react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { nivelRisco, PI_LABEL, STATUS_RISCO } from "@/lib/comite-ui";
import { salvarRisco, excluirRisco, type RiscoInput } from "@/app/dashboard/riscos/actions";

export type RiscoDTO = {
  id: string;
  inventoryId: string;
  descricao: string;
  probabilidade: number;
  impacto: number;
  recomendacao: string | null;
  status: string;
};
export type ProcessoComRiscos = {
  id: string;
  nome: string;
  prioritario: boolean;
  dadosSensiveis: boolean;
  riscos: RiscoDTO[];
};

const shortNome = (n: string) => (n.length > 22 ? n.slice(0, 20) + "…" : n);

export function RiscosClient({ processos }: { processos: ProcessoComRiscos[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<Partial<RiscoDTO> | null>(null);

  const todosRiscos = processos.flatMap((p) => p.riscos);
  const cont = { ALTO: 0, MEDIO: 0, BAIXO: 0 } as Record<string, number>;
  todosRiscos.forEach((r) => cont[nivelRisco(r.probabilidade, r.impacto).nivel]++);

  // Matriz 3×3: linhas Impacto 3→1, colunas Probabilidade 1→3
  const celula = (prob: number, imp: number) =>
    todosRiscos.filter((r) => r.probabilidade === prob && r.impacto === imp);

  // Radar: pior risco (maior produto) por processo que tem riscos
  const radarData = processos
    .filter((p) => p.riscos.length > 0)
    .map((p) => ({
      processo: shortNome(p.nome),
      risco: Math.max(...p.riscos.map((r) => r.probabilidade * r.impacto)),
    }));

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">
          ⚠️ {todosRiscos.length} riscos avaliados ·
          <span className="text-red-700"> {cont.ALTO} alto</span> ·
          <span className="text-amber-700"> {cont.MEDIO} médio</span> ·
          <span className="text-emerald-700"> {cont.BAIXO} baixo</span>
        </div>
        <button onClick={() => setEditando({ probabilidade: 2, impacto: 2, status: "ABERTO" })} className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Avaliar risco
        </button>
      </div>

      {/* Matriz + Radar */}
      <div className="grid gap-4 lg:grid-cols-2 items-start mb-6">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-extrabold text-gray-900 mb-3">Matriz Probabilidade × Impacto</div>
          <div className="flex gap-2">
            <div className="flex flex-col justify-around text-[10px] font-bold text-gray-400 uppercase" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
              Impacto
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-1.5">
                {[3, 2, 1].map((imp) => (
                  <FragmentRow key={imp} imp={imp} celula={celula} />
                ))}
                <div />
                {[1, 2, 3].map((prob) => (
                  <div key={prob} className="text-[10px] font-bold text-gray-400 text-center pt-1">{PI_LABEL[prob]}</div>
                ))}
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase text-center mt-1">Probabilidade</div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-extrabold text-gray-900 mb-3">Radar de riscos por processo</div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid />
                <PolarAngleAxis dataKey="processo" tick={{ fontSize: 10, fill: "#6b7280" }} />
                <PolarRadiusAxis domain={[0, 9]} tick={{ fontSize: 9 }} />
                <Radar name="Risco (P×I)" dataKey="risco" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-gray-400 py-10 text-center">Sem riscos avaliados ainda.</div>
          )}
        </div>
      </div>

      {/* Processos com seus riscos */}
      <div className="space-y-3">
        {processos.map((p) => (
          <div key={p.id} className="bg-white border rounded-xl p-4">
            <div className="flex justify-between items-start gap-2">
              <div className="text-[13.5px] font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                {p.nome}
                {p.dadosSensiveis && <Badge variant="red"><ShieldAlert className="w-3 h-3" /> sensíveis</Badge>}
                {p.prioritario && <Badge variant="indigo">prioritário</Badge>}
              </div>
              <button onClick={() => setEditando({ inventoryId: p.id, probabilidade: 2, impacto: 2, status: "ABERTO" })} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-700 border border-brand-100 bg-brand-50 rounded-md px-2.5 py-1 hover:bg-brand-100 shrink-0">
                <Plus className="w-3.5 h-3.5" /> Avaliar risco
              </button>
            </div>
            {p.riscos.length === 0 ? (
              <div className="text-[12px] text-gray-400 mt-2">Nenhum risco avaliado para este processo.</div>
            ) : (
              <div className="mt-2.5 space-y-1.5">
                {p.riscos.map((r) => {
                  const nv = nivelRisco(r.probabilidade, r.impacto);
                  const st = STATUS_RISCO[r.status] ?? STATUS_RISCO.ABERTO;
                  return (
                    <div key={r.id} className="flex items-center gap-3 border rounded-lg px-3 py-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: nv.cor }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] text-gray-900">{r.descricao}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Prob.: {PI_LABEL[r.probabilidade]} · Impacto: {PI_LABEL[r.impacto]}
                          {r.recomendacao ? ` · ${r.recomendacao}` : ""}
                        </div>
                      </div>
                      <Badge variant={nv.variant}>{nv.label}</Badge>
                      <Badge variant={st.variant}>{st.label}</Badge>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => setEditando(r)} title="Editar" className="text-gray-300 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
                        <button
                          onClick={async () => {
                            if (!confirm("Excluir este risco?")) return;
                            const t = toast.loading("Excluindo…");
                            try { await excluirRisco(r.id); toast.success("Risco excluído", { id: t }); router.refresh(); }
                            catch { toast.error("Não foi possível excluir", { id: t }); }
                          }}
                          title="Excluir" className="text-gray-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {processos.length === 0 && (
          <div className="bg-white border rounded-xl p-6 text-center text-sm text-gray-500">
            Cadastre processos no Inventário primeiro — a Análise de Riscos avalia cada processo.
          </div>
        )}
      </div>

      {editando && <RiscoModal risco={editando} processos={processos} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />}
    </>
  );
}

function FragmentRow({ imp, celula }: { imp: number; celula: (p: number, i: number) => RiscoDTO[] }) {
  return (
    <>
      <div className="text-[10px] font-bold text-gray-400 flex items-center justify-end pr-1">{PI_LABEL[imp]}</div>
      {[1, 2, 3].map((prob) => {
        const nv = nivelRisco(prob, imp);
        const n = celula(prob, imp).length;
        return (
          <div key={prob} className="aspect-[2/1] rounded-md flex items-center justify-center text-sm font-extrabold" style={{ background: nv.cor + "22", color: nv.cor, border: `1px solid ${nv.cor}55` }}>
            {n || ""}
          </div>
        );
      })}
    </>
  );
}

function RiscoModal({ risco, processos, onClose, onSaved }: { risco: Partial<RiscoDTO>; processos: ProcessoComRiscos[]; onClose: () => void; onSaved: () => void }) {
  const ehNovo = !risco.id;
  const [form, setForm] = useState<Partial<RiscoDTO>>(risco);
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof RiscoDTO>(k: K, v: RiscoDTO[K]) { setForm((f) => ({ ...f, [k]: v })); }

  const prob = form.probabilidade ?? 2;
  const imp = form.impacto ?? 2;
  const nv = nivelRisco(prob, imp);

  async function salvar() {
    if (!form.inventoryId) return toast.error("Selecione o processo.");
    if (!form.descricao?.trim()) return toast.error("Descreva o risco.");
    setSalvando(true);
    const input: RiscoInput = {
      id: form.id || undefined,
      inventoryId: form.inventoryId,
      descricao: form.descricao,
      probabilidade: prob,
      impacto: imp,
      recomendacao: form.recomendacao ?? "",
      status: form.status ?? "ABERTO",
    };
    try { await salvarRisco(input); toast.success(ehNovo ? "Risco avaliado" : "Risco atualizado"); onSaved(); }
    catch (e: any) { toast.error(e?.message ?? "Não foi possível salvar"); }
    finally { setSalvando(false); }
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{ehNovo ? "Avaliar risco" : "Editar risco"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div>
            <label className={labelCls}>Processo *</label>
            <select className={inputCls} value={form.inventoryId ?? ""} onChange={(e) => set("inventoryId", e.target.value)} disabled={!ehNovo}>
              <option value="">Selecione…</option>
              {processos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Risco / ameaça *</label>
            <textarea className={inputCls} rows={2} value={form.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex.: Acesso indevido a dados pessoais por falta de controle de acesso" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Probabilidade</label>
              <select className={inputCls} value={prob} onChange={(e) => set("probabilidade", Number(e.target.value))}>
                <option value={1}>Baixa</option><option value={2}>Média</option><option value={3}>Alta</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Impacto</label>
              <select className={inputCls} value={imp} onChange={(e) => set("impacto", Number(e.target.value))}>
                <option value={1}>Baixo</option><option value={2}>Médio</option><option value={3}>Alto</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Nível resultante:</span>
            <Badge variant={nv.variant}>{nv.label} ({nv.produto})</Badge>
          </div>
          <div>
            <label className={labelCls}>Recomendação / tratamento</label>
            <textarea className={inputCls} rows={2} value={form.recomendacao ?? ""} onChange={(e) => set("recomendacao", e.target.value)} placeholder="Medida para mitigar o risco…" />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status ?? "ABERTO"} onChange={(e) => set("status", e.target.value)}>
              {Object.entries(STATUS_RISCO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">
            {salvando ? "Salvando…" : ehNovo ? "Avaliar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
