"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, Download, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STATUS_ACAO, PRIORIDADE_ACAO, ORIGEM_ACAO, eixoTag } from "@/lib/comite-ui";
import { salvarAcao, excluirAcao, importarDoGap, importarDosRiscos, type AcaoInput } from "@/app/dashboard/plano-acao/actions";

export type AcaoDTO = {
  id: string; acao: string; descricao: string | null; origem: string;
  responsavel: string | null; prazoISO: string | null; prazoBR: string | null;
  prioridade: string; status: string;
};
export type EntregaCalDTO = { titulo: string; prazoBR: string; eixoCodigo: string; status: string };

const VAZIA = (): AcaoDTO => ({ id: "", acao: "", descricao: "", origem: "MANUAL", responsavel: "", prazoISO: "", prazoBR: null, prioridade: "MEDIA", status: "A_FAZER" });

export function PlanoAcaoClient({ acoes, entregas }: { acoes: AcaoDTO[]; entregas: EntregaCalDTO[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<AcaoDTO | null>(null);
  const [filtro, setFiltro] = useState("TODAS");
  const [importando, setImportando] = useState(false);

  const hoje = new Date().toISOString().slice(0, 10);
  const cont = {
    A_FAZER: acoes.filter((a) => a.status === "A_FAZER").length,
    EM_ANDAMENTO: acoes.filter((a) => a.status === "EM_ANDAMENTO").length,
    CONCLUIDA: acoes.filter((a) => a.status === "CONCLUIDA").length,
    ATRASADAS: acoes.filter((a) => a.status !== "CONCLUIDA" && a.prazoISO && a.prazoISO < hoje).length,
  };
  const visiveis = acoes.filter((a) => filtro === "TODAS" || a.status === filtro);

  async function importar(fn: () => Promise<{ criadas: number }>, label: string) {
    setImportando(true);
    const t = toast.loading(`Importando ${label}…`);
    try {
      const r = await fn();
      toast.success(r.criadas > 0 ? `${r.criadas} ação(ões) importada(s) do ${label}` : `Nenhuma nova lacuna do ${label}`, { id: t });
      router.refresh();
    } catch {
      toast.error("Não foi possível importar", { id: t });
    } finally { setImportando(false); }
  }

  async function mudarStatus(a: AcaoDTO, status: string) {
    try {
      await salvarAcao({ id: a.id, acao: a.acao, descricao: a.descricao ?? "", origem: a.origem, responsavel: a.responsavel ?? "", prazo: a.prazoISO ?? "", prioridade: a.prioridade, status });
      router.refresh();
    } catch { toast.error("Não foi possível atualizar"); }
  }

  const chip = (k: string, label: string) => (
    <button onClick={() => setFiltro(k)} className={`text-xs font-semibold border rounded-full px-3 py-1.5 ${filtro === k ? "bg-navy text-white border-navy" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>{label}</button>
  );

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {chip("TODAS", `Todas (${acoes.length})`)}
          {chip("A_FAZER", `A fazer (${cont.A_FAZER})`)}
          {chip("EM_ANDAMENTO", `Em andamento (${cont.EM_ANDAMENTO})`)}
          {chip("CONCLUIDA", `Concluídas (${cont.CONCLUIDA})`)}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => importar(importarDoGap, "GAP")} disabled={importando} className="inline-flex items-center gap-2 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-indigo-100 disabled:opacity-60">
            <Download className="w-4 h-4" /> Importar do GAP
          </button>
          <button onClick={() => importar(importarDosRiscos, "Riscos")} disabled={importando} className="inline-flex items-center gap-2 border border-red-200 bg-red-50 text-red-700 rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-red-100 disabled:opacity-60">
            <Download className="w-4 h-4" /> Importar dos Riscos
          </button>
          <button onClick={() => setEditando(VAZIA())} className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700">
            <Plus className="w-4 h-4" /> Nova ação
          </button>
        </div>
      </div>

      {cont.ATRASADAS > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md px-3.5 py-2 text-[12.5px] mb-3">
          ⏰ {cont.ATRASADAS} ação(ões) com prazo vencido.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3 items-start">
        {/* Ações */}
        <div className="lg:col-span-2 space-y-2">
          {visiveis.map((a) => {
            const st = STATUS_ACAO[a.status] ?? STATUS_ACAO.A_FAZER;
            const pr = PRIORIDADE_ACAO[a.prioridade] ?? PRIORIDADE_ACAO.MEDIA;
            const og = ORIGEM_ACAO[a.origem] ?? ORIGEM_ACAO.MANUAL;
            const atrasada = a.status !== "CONCLUIDA" && a.prazoISO && a.prazoISO < hoje;
            return (
              <div key={a.id} className="bg-white border rounded-xl px-4 py-3">
                <div className="flex justify-between gap-2 items-start">
                  <div className="text-[13px] font-semibold text-gray-900">{a.acao}</div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => setEditando(a)} title="Editar" className="text-gray-300 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={async () => { if (!confirm("Excluir esta ação?")) return; const t = toast.loading("Excluindo…"); try { await excluirAcao(a.id); toast.success("Excluída", { id: t }); router.refresh(); } catch { toast.error("Falhou", { id: t }); } }} title="Excluir" className="text-gray-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <Badge variant={og.variant}>{og.label}</Badge>
                  <Badge variant={pr.variant}>prioridade {pr.label}</Badge>
                  {a.responsavel && <span className="text-[11.5px] text-gray-500">👤 {a.responsavel}</span>}
                  {a.prazoBR && <span className={`text-[11.5px] ${atrasada ? "text-red-600 font-semibold" : "text-gray-500"}`}>📅 {a.prazoBR}</span>}
                  <select value={a.status} onChange={(e) => mudarStatus(a, e.target.value)} className="ml-auto text-[11.5px] border rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-brand-500">
                    {Object.entries(STATUS_ACAO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
          {visiveis.length === 0 && (
            <div className="bg-white border rounded-xl p-6 text-center text-sm text-gray-500">
              Nenhuma ação aqui. Use <b>Importar do GAP</b> / <b>Importar dos Riscos</b> para gerar ações a partir das lacunas, ou <b>Nova ação</b>.
            </div>
          )}
        </div>

        {/* Calendário do Plano de Trabalho */}
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-extrabold text-gray-900 flex items-center gap-2 mb-3"><CalendarDays className="w-4 h-4 text-brand-600" /> Calendário do Plano de Trabalho</div>
          <p className="text-[11.5px] text-gray-500 mb-3">Entregas institucionais com prazo (Fase 5 do PGP cruza estas ações com as lacunas acima).</p>
          <div className="space-y-2">
            {entregas.map((e, i) => (
              <div key={i} className="border-l-2 border-brand-200 pl-2.5 py-0.5">
                <div className="text-[12px] font-semibold text-gray-800">{e.titulo}</div>
                <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                  📅 {e.prazoBR} <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${eixoTag(e.eixoCodigo)}`}>{e.eixoCodigo}</span>
                </div>
              </div>
            ))}
            {entregas.length === 0 && <div className="text-[12px] text-gray-400">Sem entregas com data exata.</div>}
          </div>
        </div>
      </div>

      {editando && <AcaoModal acao={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />}
    </>
  );
}

function AcaoModal({ acao, onClose, onSaved }: { acao: AcaoDTO; onClose: () => void; onSaved: () => void }) {
  const ehNova = !acao.id;
  const [form, setForm] = useState<AcaoDTO>(acao);
  const [salvando, setSalvando] = useState(false);
  function set<K extends keyof AcaoDTO>(k: K, v: AcaoDTO[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function salvar() {
    if (!form.acao.trim()) return toast.error("Descreva a ação.");
    setSalvando(true);
    const input: AcaoInput = { id: form.id || undefined, acao: form.acao, descricao: form.descricao ?? "", origem: form.origem, responsavel: form.responsavel ?? "", prazo: form.prazoISO ?? "", prioridade: form.prioridade, status: form.status };
    try { await salvarAcao(input); toast.success(ehNova ? "Ação criada" : "Ação atualizada"); onSaved(); }
    catch (e: any) { toast.error(e?.message ?? "Não foi possível salvar"); }
    finally { setSalvando(false); }
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{ehNova ? "Nova ação" : "Editar ação"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div>
            <label className={labelCls}>Ação *</label>
            <textarea className={inputCls} rows={2} value={form.acao} onChange={(e) => set("acao", e.target.value)} placeholder="O que precisa ser feito" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Responsável</label>
              <input className={inputCls} value={form.responsavel ?? ""} onChange={(e) => set("responsavel", e.target.value)} placeholder="Ex.: Coordenação + CJU" />
            </div>
            <div>
              <label className={labelCls}>Prazo</label>
              <input type="date" className={inputCls} value={form.prazoISO ?? ""} onChange={(e) => set("prazoISO", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Prioridade</label>
              <select className={inputCls} value={form.prioridade} onChange={(e) => set("prioridade", e.target.value)}>
                <option value="ALTA">Alta</option><option value="MEDIA">Média</option><option value="BAIXA">Baixa</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUS_ACAO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Detalhes</label>
            <textarea className={inputCls} rows={2} value={form.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">{salvando ? "Salvando…" : ehNova ? "Criar" : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}
