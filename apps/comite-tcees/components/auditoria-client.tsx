"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { dataBR } from "@/lib/utils";
import {
  salvarAuditoria, excluirAuditoria, salvarAchado, excluirAchado,
  type AuditoriaInput, type AchadoInput,
} from "@/app/dashboard/auditoria/actions";
import { usePodeEditar } from "@/lib/use-pode-editar";

export type AchadoDTO = {
  id: string; auditoriaId: string; descricao: string; severidade: string;
  naoConformidade: boolean; recomendacao: string | null; planoAcao: string | null;
  prazoISO: string | null; status: string;
};
export type AuditoriaDTO = {
  id: string; titulo: string; escopo: string | null; responsavel: string | null;
  dataPrevistaISO: string | null; dataRealizadaISO: string | null; status: string;
  observacoes: string | null; achados: AchadoDTO[];
};

const ST_AUD: Record<string, { label: string; variant: "gray" | "amber" | "green" }> = {
  PLANEJADA: { label: "planejada", variant: "gray" },
  EM_ANDAMENTO: { label: "em andamento", variant: "amber" },
  CONCLUIDA: { label: "concluída", variant: "green" },
};
const ST_ACHADO: Record<string, { label: string; variant: "red" | "amber" | "green" }> = {
  ABERTO: { label: "aberto", variant: "red" },
  EM_TRATAMENTO: { label: "em tratamento", variant: "amber" },
  RESOLVIDO: { label: "resolvido", variant: "green" },
};
const SEV: Record<string, { label: string; cls: string }> = {
  BAIXA: { label: "Baixa", cls: "bg-slate-100 text-slate-700 border-slate-300" },
  MEDIA: { label: "Média", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  ALTA: { label: "Alta", cls: "bg-red-100 text-red-800 border-red-300" },
};

const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

const AUD_VAZIA = (): AuditoriaDTO => ({ id: "", titulo: "", escopo: "", responsavel: "", dataPrevistaISO: "", dataRealizadaISO: "", status: "PLANEJADA", observacoes: "", achados: [] });

export function AuditoriaClient({ auditorias }: { auditorias: AuditoriaDTO[] }) {
  const router = useRouter();
  const podeEditar = usePodeEditar();
  const [editAud, setEditAud] = useState<AuditoriaDTO | null>(null);
  const [editAchado, setEditAchado] = useState<Partial<AchadoDTO> | null>(null);

  const concluidas = auditorias.filter((a) => a.status === "CONCLUIDA").length;
  const achadosAbertos = auditorias.flatMap((a) => a.achados).filter((f) => f.status !== "RESOLVIDO").length;

  async function mudarStatusAud(a: AuditoriaDTO, status: string) {
    try {
      await salvarAuditoria({ id: a.id, titulo: a.titulo, escopo: a.escopo ?? "", responsavel: a.responsavel ?? "", dataPrevista: a.dataPrevistaISO ?? "", dataRealizada: a.dataRealizadaISO ?? "", status, observacoes: a.observacoes ?? "" });
      router.refresh();
    } catch { toast.error("Não foi possível atualizar"); }
  }
  async function mudarStatusAchado(f: AchadoDTO, status: string) {
    try {
      await salvarAchado({ id: f.id, auditoriaId: f.auditoriaId, descricao: f.descricao, severidade: f.severidade, naoConformidade: f.naoConformidade, recomendacao: f.recomendacao ?? "", planoAcao: f.planoAcao ?? "", prazo: f.prazoISO ?? "", status });
      router.refresh();
    } catch { toast.error("Não foi possível atualizar"); }
  }

  return (
    <>
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4 mb-5">
        <div className="bg-white border rounded-xl p-4"><div className="text-xs text-gray-500 font-semibold">Auditorias</div><div className="text-2xl font-extrabold text-gray-900 mt-1">{auditorias.length}</div></div>
        <div className="bg-white border rounded-xl p-4"><div className="text-xs text-gray-500 font-semibold">Concluídas</div><div className="text-2xl font-extrabold text-gray-900 mt-1">{concluidas}</div></div>
        <div className="bg-white border rounded-xl p-4 border-l-4 border-l-red-400"><div className="text-xs text-gray-500 font-semibold">Achados em aberto</div><div className="text-2xl font-extrabold text-red-600 mt-1">{achadosAbertos}</div></div>
        {podeEditar && (
          <div className="bg-white border rounded-xl p-4 flex items-center"><button onClick={() => setEditAud(AUD_VAZIA())} className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-3 py-2 text-sm font-semibold hover:bg-brand-700"><Plus className="w-4 h-4" /> Nova auditoria</button></div>
        )}
      </div>

      {auditorias.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-gray-500 text-sm">
          Nenhuma auditoria registrada. Planeje a 1ª Auditoria Interna do PGP (marco do biênio) pelo botão acima.
        </div>
      ) : (
        <div className="space-y-3">
          {auditorias.map((a) => {
            const st = ST_AUD[a.status] ?? ST_AUD.PLANEJADA;
            return (
              <div key={a.id} className="bg-white border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold text-gray-900">{a.titulo}</div>
                    <div className="text-[11.5px] text-gray-500 mt-1 flex gap-3 flex-wrap">
                      {a.responsavel && <span>👤 {a.responsavel}</span>}
                      {a.dataPrevistaISO && <span>📅 prevista {dataBR(new Date(a.dataPrevistaISO))}</span>}
                      {a.dataRealizadaISO && <span>✓ realizada {dataBR(new Date(a.dataRealizadaISO))}</span>}
                    </div>
                    {a.escopo && <div className="text-[12px] text-gray-600 mt-1.5">{a.escopo}</div>}
                  </div>
                  {podeEditar && (
                    <div className="flex items-center gap-2 shrink-0">
                      <select value={a.status} onChange={(e) => mudarStatusAud(a, e.target.value)} className="text-[11.5px] border rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-brand-500">
                        {Object.entries(ST_AUD).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <button onClick={() => setEditAud(a)} title="Editar" className="text-gray-300 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={async () => { if (!confirm(`Excluir a auditoria "${a.titulo}" e seus achados?`)) return; try { await excluirAuditoria(a.id); toast.success("Excluída"); router.refresh(); } catch { toast.error("Falhou"); } }} title="Excluir" className="text-gray-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>

                {/* Achados */}
                <div className="mt-3 border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-wide text-gray-500 font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Achados · {a.achados.length}</span>
                    {podeEditar && (
                      <button onClick={() => setEditAchado({ auditoriaId: a.id, severidade: "MEDIA", naoConformidade: true, status: "ABERTO" })} className="text-[12px] font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Novo achado</button>
                    )}
                  </div>
                  {a.achados.length === 0 ? (
                    <p className="text-[12px] text-gray-400">Nenhum achado registrado.</p>
                  ) : (
                    <div className="space-y-2">
                      {a.achados.map((f) => {
                        const sa = ST_ACHADO[f.status] ?? ST_ACHADO.ABERTO;
                        const sev = SEV[f.severidade] ?? SEV.MEDIA;
                        return (
                          <div key={f.id} className="border rounded-lg px-3 py-2 bg-slate-50">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                              {/* Badges + descrição (largura total no mobile) */}
                              <div className="flex items-start gap-2 flex-wrap flex-1 min-w-0">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sev.cls}`}>{sev.label}</span>
                                {f.naoConformidade && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-red-50 text-red-700 border-red-200">não conformidade</span>}
                                <span className="text-[12.5px] text-gray-800 min-w-0">{f.descricao}</span>
                              </div>
                              {/* Controles: status + ações (linha própria no mobile) */}
                              {podeEditar && (
                                <div className="flex items-center gap-2 shrink-0">
                                  <select value={f.status} onChange={(e) => mudarStatusAchado(f, e.target.value)} className="text-[11px] border rounded px-1.5 py-0.5 outline-none">
                                    {Object.entries(ST_ACHADO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                  </select>
                                  <button onClick={() => setEditAchado(f)} title="Editar" className="text-gray-300 hover:text-brand-600"><Pencil className="w-3.5 h-3.5" /></button>
                                  <button onClick={async () => { if (!confirm("Excluir este achado?")) return; try { await excluirAchado(f.id); toast.success("Excluído"); router.refresh(); } catch { toast.error("Falhou"); } }} title="Excluir" className="text-gray-300 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              )}
                            </div>
                            {f.recomendacao && <div className="text-[11.5px] text-gray-600 mt-1"><b>Recomendação:</b> {f.recomendacao}</div>}
                            {f.planoAcao && <div className="text-[11.5px] text-gray-600 mt-0.5"><b>Plano de ação:</b> {f.planoAcao}{f.prazoISO ? ` · prazo ${dataBR(new Date(f.prazoISO))}` : ""}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editAud && <AuditoriaModal aud={editAud} onClose={() => setEditAud(null)} onSaved={() => { setEditAud(null); router.refresh(); }} />}
      {editAchado && <AchadoModal achado={editAchado} onClose={() => setEditAchado(null)} onSaved={() => { setEditAchado(null); router.refresh(); }} />}
    </>
  );
}

function AuditoriaModal({ aud, onClose, onSaved }: { aud: AuditoriaDTO; onClose: () => void; onSaved: () => void }) {
  const ehNova = !aud.id;
  const [f, setF] = useState<AuditoriaDTO>(aud);
  const [salvando, setSalvando] = useState(false);
  const set = <K extends keyof AuditoriaDTO>(k: K, v: AuditoriaDTO[K]) => setF((x) => ({ ...x, [k]: v }));

  async function salvar() {
    if (!f.titulo.trim()) return toast.error("Informe o título.");
    setSalvando(true);
    const input: AuditoriaInput = { id: f.id || undefined, titulo: f.titulo, escopo: f.escopo ?? "", responsavel: f.responsavel ?? "", dataPrevista: f.dataPrevistaISO ?? "", dataRealizada: f.dataRealizadaISO ?? "", status: f.status, observacoes: f.observacoes ?? "" };
    try { await salvarAuditoria(input); toast.success(ehNova ? "Auditoria criada" : "Auditoria atualizada"); onSaved(); }
    catch (e: any) { toast.error(e?.message ?? "Não foi possível salvar"); }
    finally { setSalvando(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{ehNova ? "Nova auditoria" : "Editar auditoria"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div><label className={labelCls}>Título *</label><input className={inputCls} value={f.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex.: 1ª Auditoria Interna do PGP" /></div>
          <div><label className={labelCls}>Escopo</label><textarea className={inputCls} rows={2} value={f.escopo ?? ""} onChange={(e) => set("escopo", e.target.value)} placeholder="O que será auditado" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Responsável</label><input className={inputCls} value={f.responsavel ?? ""} onChange={(e) => set("responsavel", e.target.value)} placeholder="Ex.: Controle Interno" /></div>
            <div><label className={labelCls}>Status</label>
              <select className={inputCls} value={f.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(ST_AUD).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Data prevista</label><input type="date" className={inputCls} value={f.dataPrevistaISO ?? ""} onChange={(e) => set("dataPrevistaISO", e.target.value)} /></div>
            <div><label className={labelCls}>Data realizada</label><input type="date" className={inputCls} value={f.dataRealizadaISO ?? ""} onChange={(e) => set("dataRealizadaISO", e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>Observações</label><textarea className={inputCls} rows={2} value={f.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">{salvando ? "Salvando…" : ehNova ? "Criar" : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}

function AchadoModal({ achado, onClose, onSaved }: { achado: Partial<AchadoDTO>; onClose: () => void; onSaved: () => void }) {
  const ehNovo = !achado.id;
  const [f, setF] = useState<Partial<AchadoDTO>>(achado);
  const [salvando, setSalvando] = useState(false);
  const set = <K extends keyof AchadoDTO>(k: K, v: AchadoDTO[K]) => setF((x) => ({ ...x, [k]: v }));

  async function salvar() {
    if (!f.descricao?.trim()) return toast.error("Descreva o achado.");
    setSalvando(true);
    const input: AchadoInput = { id: f.id || undefined, auditoriaId: f.auditoriaId!, descricao: f.descricao!, severidade: f.severidade ?? "MEDIA", naoConformidade: f.naoConformidade ?? true, recomendacao: f.recomendacao ?? "", planoAcao: f.planoAcao ?? "", prazo: f.prazoISO ?? "", status: f.status ?? "ABERTO" };
    try { await salvarAchado(input); toast.success(ehNovo ? "Achado registrado" : "Achado atualizado"); onSaved(); }
    catch (e: any) { toast.error(e?.message ?? "Não foi possível salvar"); }
    finally { setSalvando(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{ehNovo ? "Novo achado" : "Editar achado"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div><label className={labelCls}>Descrição do achado *</label><textarea className={inputCls} rows={2} value={f.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex.: Processo X sem base legal documentada" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Severidade</label>
              <select className={inputCls} value={f.severidade ?? "MEDIA"} onChange={(e) => set("severidade", e.target.value)}>
                {Object.entries(SEV).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Status</label>
              <select className={inputCls} value={f.status ?? "ABERTO"} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(ST_ACHADO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer select-none">
            <input type="checkbox" className="w-4 h-4 accent-red-600" checked={f.naoConformidade ?? true} onChange={(e) => set("naoConformidade", e.target.checked)} />
            É uma não conformidade
          </label>
          <div><label className={labelCls}>Recomendação</label><textarea className={inputCls} rows={2} value={f.recomendacao ?? ""} onChange={(e) => set("recomendacao", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className={labelCls}>Plano de ação</label><textarea className={inputCls} rows={2} value={f.planoAcao ?? ""} onChange={(e) => set("planoAcao", e.target.value)} /></div>
            <div><label className={labelCls}>Prazo</label><input type="date" className={inputCls} value={f.prazoISO ?? ""} onChange={(e) => set("prazoISO", e.target.value)} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">{salvando ? "Salvando…" : ehNovo ? "Registrar" : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}
