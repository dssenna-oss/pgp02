"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, FileDown, CheckCircle2 } from "lucide-react";
import {
  DSR_RIGHTS, DSR_RIGHT_CODES, DSR_STATUS_LABELS, dsrStatusBadgeClass,
  DSR_TITULAR_CATEGORY_LABELS, DSR_ORIGIN_LABELS, DSR_DECISION_LABELS,
  daysUntilDue, deadlineUrgency,
} from "@/lib/dsr-helpers";
import { salvarDsr, responderDsr, mudarStatusDsr, excluirDsr, type DsrInput } from "@/app/dashboard/execucao/dsr/actions";

export type DsrDTO = {
  id: string;
  protocolNumber: string;
  origin: string;
  titularName: string;
  titularCategory: string;
  requestedRights: string[];
  detailedRequest: string | null;
  receivedISO: string;
  dueISO: string;
  status: string;
  decision: string | null;
  responseText: string | null;
};

const URGENCIA: Record<string, { txt: string; cls: string }> = {
  overdue:   { txt: "Prazo vencido", cls: "bg-red-100 text-red-700 border-red-300" },
  critical:  { txt: "≤ 3 dias", cls: "bg-red-50 text-red-700 border-red-200" },
  warning:   { txt: "≤ 7 dias", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  normal:    { txt: "no prazo", cls: "bg-slate-50 text-slate-600 border-slate-200" },
  concluded: { txt: "concluído", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const VAZIO = (): DsrDTO => ({
  id: "", protocolNumber: "", origin: "ouvidoria", titularName: "", titularCategory: "cidadao",
  requestedRights: [], detailedRequest: "", receivedISO: new Date().toISOString().slice(0, 10),
  dueISO: "", status: "RECEBIDA", decision: null, responseText: null,
});

export function DsrAdminClient({ pedidos }: { pedidos: DsrDTO[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<DsrDTO | null>(null);
  const [respondendo, setRespondendo] = useState<DsrDTO | null>(null);

  const abertos = pedidos.filter((p) => p.status !== "RESPONDIDA" && p.status !== "INDEFERIDA");
  const vencendo = abertos.filter((p) => deadlineUrgency(p.dueISO, p.status) === "critical" || deadlineUrgency(p.dueISO, p.status) === "overdue").length;

  return (
    <>
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4 mb-5">
        <div className="bg-white border rounded-xl p-4"><div className="text-xs text-gray-500 font-semibold">Total de pedidos</div><div className="text-2xl font-extrabold text-gray-900 mt-1">{pedidos.length}</div></div>
        <div className="bg-white border rounded-xl p-4"><div className="text-xs text-gray-500 font-semibold">Em aberto</div><div className="text-2xl font-extrabold text-gray-900 mt-1">{abertos.length}</div></div>
        <div className="bg-white border rounded-xl p-4 border-l-4 border-l-red-400"><div className="text-xs text-gray-500 font-semibold">Prazo crítico/vencido</div><div className="text-2xl font-extrabold text-red-600 mt-1">{vencendo}</div></div>
        <div className="bg-white border rounded-xl p-4"><div className="text-xs text-gray-500 font-semibold">Prazo legal</div><div className="text-2xl font-extrabold text-gray-900 mt-1">15 <span className="text-sm font-medium text-gray-400">dias</span></div></div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">📋 Pedidos recebidos pelo rito oficial (registro do Encarregado)</div>
        <button onClick={() => setEditando(VAZIO())} className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Registrar pedido
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-gray-500 text-sm">
          Nenhum pedido registrado. Quando um pedido chegar pelo rito oficial (Ouvidoria / Acesso Identificado / NCD),
          registre-o aqui para controlar o prazo de 15 dias e gerar a resposta.
        </div>
      ) : (
        <div className="space-y-2">
          {pedidos.map((p) => {
            const urg = deadlineUrgency(p.dueISO, p.status);
            const dias = daysUntilDue(p.dueISO);
            const u = URGENCIA[urg];
            return (
              <div key={p.id} className="bg-white border rounded-xl px-3.5 py-3">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold text-gray-900">{p.protocolNumber} · {p.titularName}</div>
                    <div className="text-[11.5px] text-gray-500 mt-1 flex gap-3 flex-wrap items-center">
                      <span>{DSR_ORIGIN_LABELS[p.origin] ?? p.origin}</span>
                      <span>{DSR_TITULAR_CATEGORY_LABELS[p.titularCategory] ?? p.titularCategory}</span>
                      <span>Direitos: {p.requestedRights.length ? p.requestedRights.join(", ") : "—"}</span>
                    </div>
                  </div>
                  <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${dsrStatusBadgeClass(p.status)}`}>{DSR_STATUS_LABELS[p.status as keyof typeof DSR_STATUS_LABELS] ?? p.status}</span>
                  <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${u.cls}`} title={`Vence em ${new Date(p.dueISO).toLocaleDateString("pt-BR")}`}>
                    {urg === "concluded" ? "concluído" : urg === "overdue" ? `vencido há ${Math.abs(dias)}d` : `${dias}d restantes`}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <select
                    value={p.status}
                    onChange={async (e) => { try { await mudarStatusDsr(p.id, e.target.value); router.refresh(); } catch { toast.error("Falhou"); } }}
                    className="text-[11.5px] border rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {Object.entries(DSR_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <button onClick={() => setRespondendo(p)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Responder
                  </button>
                  <a href={`/api/dsr/${p.id}/docx`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-gray-600 hover:text-brand-700">
                    <FileDown className="w-3.5 h-3.5" /> DOCX
                  </a>
                  <button onClick={() => setEditando(p)} title="Editar" className="ml-auto text-gray-300 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
                  <button
                    onClick={async () => { if (!confirm(`Excluir o registro ${p.protocolNumber}?`)) return; try { await excluirDsr(p.id); toast.success("Excluído"); router.refresh(); } catch { toast.error("Falhou"); } }}
                    title="Excluir" className="text-gray-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editando && <DsrModal pedido={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />}
      {respondendo && <ResponderModal pedido={respondendo} onClose={() => setRespondendo(null)} onSaved={() => { setRespondendo(null); router.refresh(); }} />}
    </>
  );
}

function DsrModal({ pedido, onClose, onSaved }: { pedido: DsrDTO; onClose: () => void; onSaved: () => void }) {
  const ehNovo = !pedido.id;
  const [form, setForm] = useState<DsrDTO>(pedido);
  const [salvando, setSalvando] = useState(false);
  function set<K extends keyof DsrDTO>(k: K, v: DsrDTO[K]) { setForm((f) => ({ ...f, [k]: v })); }
  function toggleRight(code: string) {
    setForm((f) => ({ ...f, requestedRights: f.requestedRights.includes(code) ? f.requestedRights.filter((c) => c !== code) : [...f.requestedRights, code] }));
  }

  async function salvar() {
    setSalvando(true);
    const input: DsrInput = {
      id: form.id || undefined, protocolNumber: form.protocolNumber, origin: form.origin,
      titularName: form.titularName, titularCategory: form.titularCategory,
      requestedRights: form.requestedRights, detailedRequest: form.detailedRequest ?? "",
      receivedAt: form.receivedISO, status: form.status,
    };
    try { await salvarDsr(input); toast.success(ehNovo ? "Pedido registrado" : "Atualizado"); onSaved(); }
    catch (e: any) { toast.error(e?.message ?? "Não foi possível salvar"); }
    finally { setSalvando(false); }
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{ehNovo ? "Registrar pedido do titular" : "Editar pedido"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Protocolo (e-tcees/Ouvidoria) *</label><input className={inputCls} value={form.protocolNumber} onChange={(e) => set("protocolNumber", e.target.value)} placeholder="Ex.: 2026/01234" /></div>
            <div><label className={labelCls}>Recebido em *</label><input type="date" className={inputCls} value={form.receivedISO} onChange={(e) => set("receivedISO", e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>Nome do titular *</label><input className={inputCls} value={form.titularName} onChange={(e) => set("titularName", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Canal de origem</label>
              <select className={inputCls} value={form.origin} onChange={(e) => set("origin", e.target.value)}>
                {Object.entries(DSR_ORIGIN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Categoria</label>
              <select className={inputCls} value={form.titularCategory} onChange={(e) => set("titularCategory", e.target.value)}>
                {Object.entries(DSR_TITULAR_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Direitos solicitados (art. 18)</label>
            <div className="grid sm:grid-cols-2 gap-1.5 max-h-44 overflow-auto border rounded-md p-2">
              {DSR_RIGHT_CODES.map((c) => (
                <label key={c} className="flex items-start gap-2 text-[12px] text-gray-700 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 accent-brand-600" checked={form.requestedRights.includes(c)} onChange={() => toggleRight(c)} />
                  <span><b>{c}.</b> {DSR_RIGHTS[c].label}</span>
                </label>
              ))}
            </div>
          </div>
          <div><label className={labelCls}>Detalhe do pedido</label><textarea className={inputCls} rows={3} value={form.detailedRequest ?? ""} onChange={(e) => set("detailedRequest", e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">{salvando ? "Salvando…" : ehNovo ? "Registrar" : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}

function ResponderModal({ pedido, onClose, onSaved }: { pedido: DsrDTO; onClose: () => void; onSaved: () => void }) {
  const [decision, setDecision] = useState(pedido.decision ?? "DEFERIDO");
  const [responseText, setResponseText] = useState(pedido.responseText ?? "");
  const [responseActions, setResponseActions] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!responseText.trim()) return toast.error("Descreva a resposta ao titular.");
    setSalvando(true);
    try { await responderDsr({ id: pedido.id, decision, responseText, responseActions }); toast.success("Resposta registrada"); onSaved(); }
    catch (e: any) { toast.error(e?.message ?? "Falhou"); }
    finally { setSalvando(false); }
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">Responder — {pedido.protocolNumber}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div><label className={labelCls}>Decisão</label>
            <select className={inputCls} value={decision} onChange={(e) => setDecision(e.target.value)}>
              {Object.entries(DSR_DECISION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Resposta ao titular *</label><textarea className={inputCls} rows={5} value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Texto que será comunicado ao titular." /></div>
          <div><label className={labelCls}>Providências adotadas <span className="font-normal text-gray-400">(opcional)</span></label><textarea className={inputCls} rows={2} value={responseActions} onChange={(e) => setResponseActions(e.target.value)} /></div>
          <p className="text-[11px] text-gray-400">Ao salvar, o pedido é marcado como respondido/indeferido com a data de hoje. Gere o DOCX para enviar pelo canal escolhido.</p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">{salvando ? "Salvando…" : "Registrar resposta"}</button>
        </div>
      </div>
    </div>
  );
}
