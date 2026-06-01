"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, CheckCircle2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { salvarReuniao, excluirReuniao, aprovarPauta, type ReuniaoInput } from "@/app/dashboard/reunioes/actions";
import { usePodeEditar } from "@/lib/use-pode-editar";

export type ReuniaoDTO = {
  id: string;
  titulo: string;
  dataISO: string; // YYYY-MM-DD
  dataBR: string;
  hora: string | null;
  local: string | null;
  pauta: string | null;
  decisoes: string | null;
  presentes: number | null;
  totalConvocados: number | null;
  status: string;
  pautaAprovada: boolean;
  ataRegistrada: boolean;
  ataUrl: string | null;
};

const VAZIA = (): ReuniaoDTO => ({
  id: "", titulo: "", dataISO: "", dataBR: "", hora: "", local: "", pauta: "",
  decisoes: "", presentes: null, totalConvocados: null, status: "AGENDADA",
  pautaAprovada: false, ataRegistrada: false, ataUrl: "",
});

export function ReunioesClient({ reunioes }: { reunioes: ReuniaoDTO[] }) {
  const router = useRouter();
  const podeEditar = usePodeEditar();
  const [editando, setEditando] = useState<ReuniaoDTO | null>(null);
  const proxima = reunioes.find((r) => r.status === "AGENDADA");

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">
          🗂️ {reunioes.length} reuniões registradas{proxima ? ` · próxima ${proxima.dataBR}` : ""}
        </div>
        {podeEditar && (
          <button
            onClick={() => setEditando(VAZIA())}
            className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" /> Agendar reunião
          </button>
        )}
      </div>

      <div className="space-y-3">
        {reunioes.map((r) => {
          const agendada = r.status === "AGENDADA";
          return (
            <div
              key={r.id}
              className={`bg-white border border-l-4 ${agendada ? "border-l-indigo-500" : "border-l-emerald-500"} rounded-xl px-4 py-3.5`}
            >
              <div className="flex justify-between gap-3 items-start">
                <div className="text-sm font-bold text-gray-900">{r.titulo}</div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={agendada ? "indigo" : "green"}>
                    {agendada ? "agendada" : "realizada"} · {r.dataBR}
                  </Badge>
                  {podeEditar && (
                    <>
                      <button onClick={() => setEditando(r)} title="Editar" className="text-gray-400 hover:text-brand-600">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Excluir a reunião "${r.titulo}"? Esta ação não pode ser desfeita.`)) return;
                          const t = toast.loading("Excluindo…");
                          try {
                            await excluirReuniao(r.id);
                            toast.success("Reunião excluída", { id: t });
                            router.refresh();
                          } catch {
                            toast.error("Não foi possível excluir", { id: t });
                          }
                        }}
                        title="Excluir"
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {r.pauta && (
                <div className="mt-1.5">
                  <p className="text-[12.5px] text-gray-700"><b>Pauta:</b> {r.pauta}</p>
                  <div className="mt-1.5">
                    {r.pautaAprovada ? (
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pauta aprovada
                      </span>
                    ) : podeEditar ? (
                      <button
                        onClick={async () => {
                          const t = toast.loading("Aprovando pauta…");
                          try {
                            await aprovarPauta(r.id);
                            toast.success("Pauta aprovada — membros avisados", { id: t });
                            router.refresh();
                          } catch {
                            toast.error("Não foi possível aprovar", { id: t });
                          }
                        }}
                        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-md px-2.5 py-1 hover:bg-emerald-100"
                      >
                        <Check className="w-3.5 h-3.5" /> Aprovar pauta
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
              {r.decisoes && <p className="text-[12.5px] text-gray-700 mt-1.5"><b>Principais decisões:</b> {r.decisoes}</p>}
              <div className="text-[11.5px] text-gray-500 mt-2 flex gap-3.5 flex-wrap">
                {r.local && <span><b className="text-gray-700">Local:</b> {r.local}{r.hora ? ` · ${r.hora}` : ""}</span>}
                {r.totalConvocados != null && (
                  <span>
                    <b className="text-gray-700">Participantes:</b>{" "}
                    {r.presentes != null ? `${r.presentes} de ${r.totalConvocados}` : `convocação a ${r.totalConvocados} membros`}
                  </span>
                )}
                <span>
                  <b className="text-gray-700">Ata:</b>{" "}
                  {r.ataRegistrada ? (
                    r.ataUrl ? (
                      <a href={r.ataUrl} target="_blank" rel="noreferrer" className="text-brand-600 underline">📎 registrada</a>
                    ) : "📎 registrada"
                  ) : "📎 Não registrada"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px] flex gap-2 mt-4">
        💡 Em etapas futuras, cada reunião poderá vincular as <b>decisões</b> a entregas do Plano de Trabalho
        e gerar a <b>ata em DOCX</b> automaticamente a partir da pauta.
      </div>

      {editando && (
        <ReuniaoModal reuniao={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />
      )}
    </>
  );
}

function ReuniaoModal({ reuniao, onClose, onSaved }: { reuniao: ReuniaoDTO; onClose: () => void; onSaved: () => void }) {
  const ehNova = !reuniao.id;
  const [form, setForm] = useState<ReuniaoDTO>(reuniao);
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof ReuniaoDTO>(k: K, v: ReuniaoDTO[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function salvar() {
    if (!form.titulo.trim()) return toast.error("Informe o título.");
    if (!form.dataISO) return toast.error("Informe a data.");
    setSalvando(true);
    const input: ReuniaoInput = {
      id: form.id || undefined,
      titulo: form.titulo,
      data: form.dataISO,
      hora: form.hora ?? "",
      local: form.local ?? "",
      pauta: form.pauta ?? "",
      decisoes: form.decisoes ?? "",
      presentes: form.presentes != null ? String(form.presentes) : "",
      totalConvocados: form.totalConvocados != null ? String(form.totalConvocados) : "",
      status: form.status,
      ataRegistrada: form.ataRegistrada,
      ataUrl: form.ataUrl ?? "",
    };
    try {
      await salvarReuniao(input);
      toast.success(ehNova ? "Reunião agendada" : "Reunião atualizada");
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
          <h2 className="text-base font-bold text-gray-900">{ehNova ? "Agendar reunião" : "Editar reunião"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-3.5">
          <div>
            <label className={labelCls}>Título *</label>
            <input className={inputCls} value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex.: Reunião ordinária do Comitê" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Data *</label>
              <input type="date" className={inputCls} value={form.dataISO} onChange={(e) => set("dataISO", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Hora</label>
              <input className={inputCls} value={form.hora ?? ""} onChange={(e) => set("hora", e.target.value)} placeholder="Ex.: 14h" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Local</label>
              <input className={inputCls} value={form.local ?? ""} onChange={(e) => set("local", e.target.value)} placeholder="Ex.: Sala do Pleno" />
            </div>
            <div>
              <label className={labelCls}>Situação</label>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="AGENDADA">Agendada</option>
                <option value="REALIZADA">Realizada</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Pauta</label>
            <textarea className={inputCls} rows={3} value={form.pauta ?? ""} onChange={(e) => set("pauta", e.target.value)} placeholder="Itens a discutir na reunião…" />
          </div>

          <div>
            <label className={labelCls}>Decisões / encaminhamentos</label>
            <textarea className={inputCls} rows={3} value={form.decisoes ?? ""} onChange={(e) => set("decisoes", e.target.value)} placeholder="Preencher após a reunião…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Presentes</label>
              <input type="number" min={0} className={inputCls} value={form.presentes ?? ""} onChange={(e) => set("presentes", e.target.value === "" ? null : Number(e.target.value))} placeholder="Ex.: 12" />
            </div>
            <div>
              <label className={labelCls}>Total convocados</label>
              <input type="number" min={0} className={inputCls} value={form.totalConvocados ?? ""} onChange={(e) => set("totalConvocados", e.target.value === "" ? null : Number(e.target.value))} placeholder="Ex.: 15" />
            </div>
          </div>

          <div className="border-t pt-3.5">
            <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={form.ataRegistrada} onChange={(e) => set("ataRegistrada", e.target.checked)} />
              Ata registrada
            </label>
            {form.ataRegistrada && (
              <div className="mt-2">
                <label className={labelCls}>Link da ata (opcional)</label>
                <input className={inputCls} value={form.ataUrl ?? ""} onChange={(e) => set("ataUrl", e.target.value)} placeholder="https://… (link do documento)" />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">
            {salvando ? "Salvando…" : ehNova ? "Agendar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
