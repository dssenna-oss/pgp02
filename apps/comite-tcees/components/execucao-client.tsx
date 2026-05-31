"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { statusInstrumento, STATUS_INSTRUMENTO, GRUPO_INSTRUMENTO, INSTRUMENTO_PRONTO } from "@/lib/comite-ui";
import { dataBR } from "@/lib/utils";
import { salvarInstrumento, excluirInstrumento, type InstrumentoInput } from "@/app/dashboard/execucao/actions";
import { abrirPolicyDoInstrumento } from "@/app/dashboard/execucao/politicas/actions";

export type InstrumentoDTO = {
  id: string; nome: string; grupo: string; tipo: string | null; baseLegal: string | null;
  obrigatorio: boolean; status: string; responsavel: string | null;
  prazoISO: string | null; prazoBR: string | null; conteudoUrl: string | null; descricao: string | null;
  /** Fase 6: este instrumento é um documento de texto editável no editor de Políticas? */
  policyEditavel: boolean;
  /** id da política já vinculada (null = ainda não criada). */
  policyId: string | null;
};

const GRUPOS = ["PUBLICO", "INTERNO", "OPERADORES_TITULAR"];
const VAZIO = (grupo = "INTERNO"): InstrumentoDTO => ({
  id: "", nome: "", grupo, tipo: "", baseLegal: "", obrigatorio: false, status: "A_ELABORAR",
  responsavel: "", prazoISO: "", prazoBR: null, conteudoUrl: "", descricao: "",
  policyEditavel: false, policyId: null,
});

export function ExecucaoClient({ instrumentos }: { instrumentos: InstrumentoDTO[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<InstrumentoDTO | null>(null);
  const [abrindo, setAbrindo] = useState<string | null>(null);

  async function abrirEditor(it: InstrumentoDTO) {
    if (it.policyId) {
      router.push(`/dashboard/execucao/politicas/${it.policyId}`);
      return;
    }
    setAbrindo(it.id);
    try {
      const r = await abrirPolicyDoInstrumento(it.id);
      if ("erro" in r) {
        toast.error(r.erro);
        setAbrindo(null);
        return;
      }
      toast.success("Documento criado a partir do modelo");
      router.push(`/dashboard/execucao/politicas/${r.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível abrir o editor");
      setAbrindo(null);
    }
  }

  const prontos = instrumentos.filter((i) => INSTRUMENTO_PRONTO.has(i.status)).length;
  const obrigatorios = instrumentos.filter((i) => i.obrigatorio).length;
  const obrigProntos = instrumentos.filter((i) => i.obrigatorio && INSTRUMENTO_PRONTO.has(i.status)).length;
  const pct = instrumentos.length ? Math.round((prontos / instrumentos.length) * 100) : 0;

  async function mudarStatus(it: InstrumentoDTO, status: string) {
    try {
      await salvarInstrumento({ id: it.id, nome: it.nome, grupo: it.grupo, tipo: it.tipo ?? "", baseLegal: it.baseLegal ?? "", obrigatorio: it.obrigatorio, status, responsavel: it.responsavel ?? "", prazo: it.prazoISO ?? "", conteudoUrl: it.conteudoUrl ?? "", descricao: it.descricao ?? "" });
      router.refresh();
    } catch { toast.error("Não foi possível atualizar"); }
  }

  return (
    <>
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-3 mb-5">
        <div className="bg-white border rounded-xl p-4 border-l-4 border-l-brand-500">
          <div className="text-xs text-gray-500 font-semibold">Instrumentos prontos</div>
          <div className="text-3xl font-extrabold text-gray-900 mt-1">{pct}%</div>
          <div className="h-2 rounded-full bg-slate-100 mt-2 overflow-hidden"><span className="block h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} /></div>
          <div className="text-[11px] text-gray-500 mt-1.5">{prontos} de {instrumentos.length} aprovados/publicados</div>
        </div>
        <div className="bg-white border rounded-xl p-4"><div className="text-xs text-gray-500 font-semibold">Obrigatórios prontos</div><div className="text-2xl font-extrabold text-gray-900 mt-1">{obrigProntos}/{obrigatorios}</div><div className="text-[11px] text-gray-500 mt-1">os exigidos pela LGPD</div></div>
        <div className="bg-white border rounded-xl p-4"><div className="text-xs text-gray-500 font-semibold">Total de instrumentos</div><div className="text-2xl font-extrabold text-gray-900 mt-1">{instrumentos.length}</div><div className="text-[11px] text-gray-500 mt-1">nos 3 grupos</div></div>
      </div>

      <div className="flex justify-end gap-2 mb-4 flex-wrap">
        <a href="/dashboard/execucao/politicas" className="inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-gray-50">
          <FileText className="w-4 h-4" /> Políticas e Documentos
        </a>
        <a href="/dashboard/execucao/ripd" className="inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-gray-50">
          <FileText className="w-4 h-4" /> RIPD
        </a>
        <a href="/dashboard/execucao/clausulas" className="inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-gray-50">
          <FileText className="w-4 h-4" /> Cláusulas
        </a>
        <button onClick={() => setEditando(VAZIO())} className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Novo instrumento
        </button>
      </div>

      {GRUPOS.map((g) => {
        const doGrupo = instrumentos.filter((i) => i.grupo === g);
        if (doGrupo.length === 0) return null;
        const meta = GRUPO_INSTRUMENTO[g];
        return (
          <div key={g} className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-sm font-extrabold text-gray-900">{meta.emoji} {meta.nome}</h2>
              <span className="text-[11px] text-gray-400">· {doGrupo.length}</span>
            </div>
            <p className="text-[11.5px] text-gray-500 mb-2.5">{meta.desc}</p>
            <div className="grid gap-2.5 lg:grid-cols-2">
              {doGrupo.map((it) => {
                const st = statusInstrumento(it.status);
                return (
                  <div key={it.id} className="bg-white border rounded-xl p-3.5">
                    <div className="flex justify-between gap-2 items-start">
                      <div className="text-[13px] font-bold text-gray-900 flex items-center gap-1.5">
                        {it.conteudoUrl ? <a href={it.conteudoUrl} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline inline-flex items-center gap-1">{it.nome} <ExternalLink className="w-3 h-3" /></a> : it.nome}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => setEditando(it)} title="Editar" className="text-gray-300 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
                        <button onClick={async () => { if (!confirm(`Excluir "${it.nome}"?`)) return; const t = toast.loading("Excluindo…"); try { await excluirInstrumento(it.id); toast.success("Excluído", { id: t }); router.refresh(); } catch { toast.error("Falhou", { id: t }); } }} title="Excluir" className="text-gray-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {it.obrigatorio ? <Badge variant="red">obrigatório</Badge> : <Badge variant="gray">recomendado</Badge>}
                      {it.tipo && <Badge variant="blue">{it.tipo}</Badge>}
                      <select value={it.status} onChange={(e) => mudarStatus(it, e.target.value)} className="ml-auto text-[11.5px] border rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-brand-500">
                        {Object.entries(STATUS_INSTRUMENTO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    {it.baseLegal && <div className="text-[11px] text-gray-500 mt-1.5"><b className="text-gray-600">Base legal:</b> {it.baseLegal}</div>}
                    {(it.responsavel || it.prazoBR) && (
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {it.responsavel && <span>👤 {it.responsavel}</span>}{it.responsavel && it.prazoBR ? " · " : ""}{it.prazoBR && <span>📅 {it.prazoBR}</span>}
                      </div>
                    )}
                    {it.policyEditavel && (
                      <button
                        onClick={() => abrirEditor(it)}
                        disabled={abrindo === it.id}
                        className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {abrindo === it.id ? "Abrindo…" : it.policyId ? "Abrir editor de conteúdo" : "Redigir documento (do modelo)"}
                      </button>
                    )}
                    {it.nome.includes("RIPD") && (
                      <a href="/dashboard/execucao/ripd" className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-600 hover:text-brand-700">
                        <FileText className="w-3.5 h-3.5" /> Abrir editor de RIPDs
                      </a>
                    )}
                    {it.nome.includes("Cláusula") && (
                      <a href="/dashboard/execucao/clausulas" className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-600 hover:text-brand-700">
                        <FileText className="w-3.5 h-3.5" /> Gerar cláusulas (DOCX)
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px] flex gap-2">
        💡 Instrumentos que são <b>documentos de texto</b> (Aviso de Privacidade, Cookies, PSI, Retenção, Política Interna…) têm o botão <b>Redigir documento</b>: o editor abre a partir de um modelo pronto, com versões, exportação DOCX e página pública. RIPD, Cláusulas de Operadores e DSR ganham editores próprios em seguida.
      </div>

      {editando && <InstrumentoModal instrumento={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />}
    </>
  );
}

function InstrumentoModal({ instrumento, onClose, onSaved }: { instrumento: InstrumentoDTO; onClose: () => void; onSaved: () => void }) {
  const ehNovo = !instrumento.id;
  const [form, setForm] = useState<InstrumentoDTO>(instrumento);
  const [salvando, setSalvando] = useState(false);
  function set<K extends keyof InstrumentoDTO>(k: K, v: InstrumentoDTO[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function salvar() {
    if (!form.nome.trim()) return toast.error("Informe o nome.");
    setSalvando(true);
    const input: InstrumentoInput = { id: form.id || undefined, nome: form.nome, grupo: form.grupo, tipo: form.tipo ?? "", baseLegal: form.baseLegal ?? "", obrigatorio: form.obrigatorio, status: form.status, responsavel: form.responsavel ?? "", prazo: form.prazoISO ?? "", conteudoUrl: form.conteudoUrl ?? "", descricao: form.descricao ?? "" };
    try { await salvarInstrumento(input); toast.success(ehNovo ? "Instrumento criado" : "Instrumento atualizado"); onSaved(); }
    catch (e: any) { toast.error(e?.message ?? "Não foi possível salvar"); }
    finally { setSalvando(false); }
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{ehNovo ? "Novo instrumento" : "Editar instrumento"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div>
            <label className={labelCls}>Nome *</label>
            <input className={inputCls} value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: Política de Retenção e Descarte" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Grupo</label>
              <select className={inputCls} value={form.grupo} onChange={(e) => set("grupo", e.target.value)}>
                <option value="PUBLICO">Documentos públicos</option>
                <option value="INTERNO">Instrumentos internos</option>
                <option value="OPERADORES_TITULAR">Operadores & Titular</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Tipo</label>
              <input className={inputCls} value={form.tipo ?? ""} onChange={(e) => set("tipo", e.target.value)} placeholder="Ex.: Política, RIPD, Termo…" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Base legal</label>
            <input className={inputCls} value={form.baseLegal ?? ""} onChange={(e) => set("baseLegal", e.target.value)} placeholder="Ex.: Art. 46 da LGPD" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUS_INSTRUMENTO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Prazo</label>
              <input type="date" className={inputCls} value={form.prazoISO ?? ""} onChange={(e) => set("prazoISO", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Responsável</label>
            <input className={inputCls} value={form.responsavel ?? ""} onChange={(e) => set("responsavel", e.target.value)} placeholder="Ex.: Coordenação + CJU" />
          </div>
          <div>
            <label className={labelCls}>Link do documento</label>
            <input className={inputCls} value={form.conteudoUrl ?? ""} onChange={(e) => set("conteudoUrl", e.target.value)} placeholder="https://… (documento publicado/anexo)" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer select-none">
            <input type="checkbox" className="w-4 h-4 accent-red-600" checked={form.obrigatorio} onChange={(e) => set("obrigatorio", e.target.checked)} />
            Obrigatório (exigido pela LGPD)
          </label>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">{salvando ? "Salvando…" : ehNovo ? "Criar" : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}
