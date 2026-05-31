"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, AlertTriangle, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SEVERIDADE_INCIDENTE, STATUS_INCIDENTE, PRAZO_ANPD_HORAS } from "@/lib/comite-ui";
import { salvarIncidente, excluirIncidente } from "@/app/dashboard/incidentes/actions";

export type IncidenteDTO = {
  id: string; titulo: string; descricao: string | null; severidade: string; status: string;
  ocorridoISO: string | null; detectadoISO: string | null;
  comunicadoAnpd: boolean; comunicadoTitular: boolean; naturezaDados: string | null; medidasMitigacao: string | null;
};

// Estado do prazo de 72h a partir da detecção
function prazoAnpd(i: IncidenteDTO): { texto: string; cor: string; vencido: boolean } | null {
  if (!i.detectadoISO) return null;
  if (i.comunicadoAnpd) return { texto: "Comunicado à ANPD", cor: "text-emerald-700", vencido: false };
  if (i.status === "ENCERRADO") return null;
  const deadline = new Date(i.detectadoISO).getTime() + PRAZO_ANPD_HORAS * 3600_000;
  const restMs = deadline - Date.now();
  if (restMs <= 0) return { texto: "Prazo de 72h VENCIDO — comunicar à ANPD", cor: "text-red-700", vencido: true };
  const h = Math.floor(restMs / 3600_000);
  const m = Math.floor((restMs % 3600_000) / 60000);
  return { texto: `${h}h ${m}min p/ comunicar à ANPD`, cor: h < 24 ? "text-red-700" : "text-amber-700", vencido: false };
}

const VAZIO = (): IncidenteDTO => ({
  id: "", titulo: "", descricao: "", severidade: "MEDIA", status: "EM_ANALISE",
  ocorridoISO: "", detectadoISO: "", comunicadoAnpd: false, comunicadoTitular: false, naturezaDados: "", medidasMitigacao: "",
});

export function IncidentesClient({ incidentes }: { incidentes: IncidenteDTO[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<IncidenteDTO | null>(null);

  const emAnalise = incidentes.filter((i) => i.status === "EM_ANALISE").length;
  const encerrados = incidentes.filter((i) => i.status === "ENCERRADO").length;
  const comunicados = incidentes.filter((i) => i.comunicadoAnpd).length;
  const prazosCriticos = incidentes.filter((i) => { const p = prazoAnpd(i); return p && !p.vencido && /p\/ comunicar/.test(p.texto); }).length;
  const vencidos = incidentes.filter((i) => { const p = prazoAnpd(i); return p?.vencido; }).length;

  return (
    <>
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4 mb-4">
        <div className="bg-white border rounded-xl p-4"><div className="text-xs text-gray-500 font-semibold">Incidentes registrados</div><div className="text-2xl font-extrabold text-gray-900 mt-1">{incidentes.length}</div></div>
        <div className="bg-white border rounded-xl p-4"><div className="text-xs text-gray-500 font-semibold">Em análise</div><div className="text-2xl font-extrabold text-amber-600 mt-1">{emAnalise}</div></div>
        <div className="bg-white border rounded-xl p-4"><div className="text-xs text-gray-500 font-semibold">Comunicados à ANPD</div><div className="text-2xl font-extrabold text-gray-900 mt-1">{comunicados}</div></div>
        <div className="bg-white border rounded-xl p-4"><div className="text-xs text-gray-500 font-semibold">Encerrados</div><div className="text-2xl font-extrabold text-emerald-600 mt-1">{encerrados}</div></div>
      </div>

      {(prazosCriticos > 0 || vencidos > 0) && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md px-3.5 py-2.5 text-[12.5px] mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {vencidos > 0 && <span><b>{vencidos}</b> incidente(s) com prazo de 72h <b>vencido</b>. </span>}
          {prazosCriticos > 0 && <span><b>{prazosCriticos}</b> dentro da janela de 72h aguardando comunicação à ANPD.</span>}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">🚨 Registro de incidentes de segurança · prazo ANPD de 72h (Res. CD/ANPD 15/2024)</div>
        <button onClick={() => setEditando(VAZIO())} className="inline-flex items-center gap-2 bg-red-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-red-700">
          <Plus className="w-4 h-4" /> Registrar incidente
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-2.5">
          {incidentes.map((i) => {
            const sev = SEVERIDADE_INCIDENTE[i.severidade] ?? SEVERIDADE_INCIDENTE.MEDIA;
            const st = STATUS_INCIDENTE[i.status] ?? STATUS_INCIDENTE.EM_ANALISE;
            const prazo = prazoAnpd(i);
            return (
              <div key={i.id} className={`bg-white border rounded-xl px-4 py-3 ${prazo?.vencido ? "border-l-4 border-l-red-500" : ""}`}>
                <div className="flex justify-between gap-2 items-start">
                  <div className="text-[13.5px] font-bold text-gray-900">{i.titulo}</div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => setEditando(i)} title="Editar" className="text-gray-300 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={async () => { if (!confirm("Excluir este incidente?")) return; const t = toast.loading("Excluindo…"); try { await excluirIncidente(i.id); toast.success("Excluído", { id: t }); router.refresh(); } catch { toast.error("Falhou", { id: t }); } }} title="Excluir" className="text-gray-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {i.descricao && <p className="text-[12px] text-gray-600 mt-1">{i.descricao}</p>}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <Badge variant={sev.variant}>severidade {sev.label}</Badge>
                  <Badge variant={st.variant}>{st.label}</Badge>
                  {i.comunicadoAnpd && <Badge variant="green"><CheckCircle2 className="w-3 h-3" /> ANPD</Badge>}
                  {i.comunicadoTitular && <Badge variant="green"><CheckCircle2 className="w-3 h-3" /> titular</Badge>}
                  {prazo && <span className={`inline-flex items-center gap-1 text-[11.5px] font-semibold ${prazo.cor} ml-auto`}><Clock className="w-3.5 h-3.5" /> {prazo.texto}</span>}
                </div>
              </div>
            );
          })}
          {incidentes.length === 0 && (
            <div className="bg-white border rounded-xl p-6 text-center text-sm text-gray-500">
              Nenhum incidente registrado. Use <b>Registrar incidente</b> ao detectar um evento de segurança — o prazo de 72h para comunicar à ANPD começa na data de detecção.
            </div>
          )}
        </div>

        {/* Outros instrumentos de Monitoramento (já existentes) */}
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-extrabold text-gray-900 flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-brand-600" /> Monitoramento do PGP</div>
          <p className="text-[11.5px] text-gray-500 mb-3">A Fase 7 também acompanha KPIs, maturidade e a prestação de contas — já disponíveis no app:</p>
          <div className="space-y-2">
            <Link href="/dashboard/indicadores" className="block border rounded-lg px-3 py-2 hover:bg-gray-50">
              <div className="text-[12.5px] font-semibold text-gray-900">📈 Indicadores & Painel de Maturidade</div>
              <div className="text-[11px] text-gray-500">KPIs por eixo (A–E) + impacto institucional</div>
            </Link>
            <Link href="/dashboard/indicadores" className="block border rounded-lg px-3 py-2 hover:bg-gray-50">
              <div className="text-[12.5px] font-semibold text-gray-900">⬇️ Relatório Anual de Resultados</div>
              <div className="text-[11px] text-gray-500">DOCX da Portaria 22/2026 (art. 4º §3º)</div>
            </Link>
            <div className="border rounded-lg px-3 py-2 opacity-70">
              <div className="text-[12.5px] font-semibold text-gray-700">🔍 Auditoria Interna do PGP</div>
              <div className="text-[11px] text-gray-400">marco de Q3/2027 · em breve</div>
            </div>
          </div>
        </div>
      </div>

      {editando && <IncidenteModal incidente={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />}
    </>
  );
}

function IncidenteModal({ incidente, onClose, onSaved }: { incidente: IncidenteDTO; onClose: () => void; onSaved: () => void }) {
  const ehNovo = !incidente.id;
  const [form, setForm] = useState<IncidenteDTO>(incidente);
  const [salvando, setSalvando] = useState(false);
  function set<K extends keyof IncidenteDTO>(k: K, v: IncidenteDTO[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function salvar() {
    if (!form.titulo.trim()) return toast.error("Informe o título.");
    setSalvando(true);
    try {
      await salvarIncidente({
        id: form.id || undefined, titulo: form.titulo, descricao: form.descricao ?? "", severidade: form.severidade, status: form.status,
        ocorridoEm: form.ocorridoISO ?? "", detectadoEm: form.detectadoISO ?? "",
        comunicadoAnpd: form.comunicadoAnpd, comunicadoTitular: form.comunicadoTitular,
        naturezaDados: form.naturezaDados ?? "", medidasMitigacao: form.medidasMitigacao ?? "",
      });
      toast.success(ehNovo ? "Incidente registrado" : "Incidente atualizado"); onSaved();
    } catch (e: any) { toast.error(e?.message ?? "Não foi possível salvar"); }
    finally { setSalvando(false); }
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{ehNovo ? "Registrar incidente" : "Editar incidente"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div>
            <label className={labelCls}>Título *</label>
            <input className={inputCls} value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex.: Acesso não autorizado ao sistema X" />
          </div>
          <div>
            <label className={labelCls}>Descrição</label>
            <textarea className={inputCls} rows={2} value={form.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} placeholder="O que aconteceu" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Severidade</label>
              <select className={inputCls} value={form.severidade} onChange={(e) => set("severidade", e.target.value)}>
                <option value="BAIXA">Baixa</option><option value="MEDIA">Média</option><option value="ALTA">Alta</option><option value="CRITICA">Crítica</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="RASCUNHO">Rascunho</option><option value="EM_ANALISE">Em análise</option><option value="ENCERRADO">Encerrado</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Ocorrido em</label>
              <input type="datetime-local" className={inputCls} value={form.ocorridoISO ?? ""} onChange={(e) => set("ocorridoISO", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Detectado em <span className="font-normal text-gray-400">(inicia 72h)</span></label>
              <input type="datetime-local" className={inputCls} value={form.detectadoISO ?? ""} onChange={(e) => set("detectadoISO", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Natureza dos dados afetados</label>
            <input className={inputCls} value={form.naturezaDados ?? ""} onChange={(e) => set("naturezaDados", e.target.value)} placeholder="Ex.: nome, CPF, dados de saúde…" />
          </div>
          <div>
            <label className={labelCls}>Medidas de mitigação</label>
            <textarea className={inputCls} rows={2} value={form.medidasMitigacao ?? ""} onChange={(e) => set("medidasMitigacao", e.target.value)} placeholder="O que foi feito para conter/remediar" />
          </div>
          <div className="flex gap-5 pt-1">
            <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 accent-emerald-600" checked={form.comunicadoAnpd} onChange={(e) => set("comunicadoAnpd", e.target.checked)} /> Comunicado à ANPD
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 accent-emerald-600" checked={form.comunicadoTitular} onChange={(e) => set("comunicadoTitular", e.target.checked)} /> Comunicado aos titulares
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="text-sm bg-red-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-red-700 disabled:opacity-60">{salvando ? "Salvando…" : ehNovo ? "Registrar" : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}
