"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Save, CheckCircle2, FileDown, ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
import { ripdStatusLabel, ripdStatusBadgeClass, type RipdData } from "@/lib/ripd-helpers";
import { RIPD_SECTIONS, getFieldValue, setFieldValue } from "@/lib/ripd-section-fields";
import { salvarRipd, aprovarRipd, reabrirRipd } from "@/app/dashboard/execucao/ripd/actions";

export type RipdEditorDTO = {
  id: string;
  title: string;
  status: string;
  data: RipdData;
  inventoryName: string | null;
  publishedVersionNum: number | null;
  approvedBy: string | null;
};

export function RipdEditorClient({ ripd }: { ripd: RipdEditorDTO }) {
  const router = useRouter();
  const [title, setTitle] = useState(ripd.title);
  const [data, setData] = useState<RipdData>(ripd.data);
  const [salvando, setSalvando] = useState(false);
  const [aprovando, setAprovando] = useState(false);

  const aprovado = ripd.status === "APROVADO";

  function setField(path: string, value: string) {
    setData((d) => setFieldValue(d, path, value));
  }

  async function salvar() {
    if (!title.trim()) return toast.error("Informe o título.");
    setSalvando(true);
    try {
      await salvarRipd({ id: ripd.id, title, data });
      toast.success("Rascunho salvo");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível salvar");
    } finally {
      setSalvando(false);
    }
  }

  async function aprovar() {
    if (!confirm("Aprovar este RIPD? O conteúdo atual será salvo e congelado como uma nova versão.")) return;
    await salvarRipd({ id: ripd.id, title, data }).catch(() => {});
    const changeLog = prompt("Observação desta versão (opcional):") ?? undefined;
    setAprovando(true);
    try {
      const r = await aprovarRipd({ id: ripd.id, changeLog });
      toast.success(`RIPD aprovado — versão ${r.version}`);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível aprovar");
    } finally {
      setAprovando(false);
    }
  }

  async function reabrir() {
    if (!confirm("Reabrir para edição? O RIPD volta para rascunho (a versão aprovada fica no histórico).")) return;
    try {
      await reabrirRipd(ripd.id);
      toast.success("Reaberto para edição");
      router.refresh();
    } catch {
      toast.error("Não foi possível reabrir");
    }
  }

  const labelCls = "text-[12px] font-semibold text-gray-700 mb-1 flex items-center gap-1.5";
  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <Link href="/dashboard/execucao/ripd" className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-brand-600 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar aos RIPDs
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${ripdStatusBadgeClass(ripd.status)}`}>
              {ripdStatusLabel(ripd.status)}
            </span>
            {ripd.inventoryName && <span className="text-[11.5px] text-gray-500">Processo: {ripd.inventoryName}</span>}
            {ripd.publishedVersionNum ? <span className="text-[11.5px] text-gray-500">· v{ripd.publishedVersionNum}</span> : null}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href={`/api/ripd/${ripd.id}/docx`} className="inline-flex items-center gap-1.5 text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-3 py-2 hover:bg-gray-50">
            <FileDown className="w-4 h-4" /> Baixar DOCX
          </a>
          {aprovado ? (
            <button onClick={reabrir} className="inline-flex items-center gap-1.5 text-sm border border-amber-300 bg-amber-50 text-amber-700 rounded-md px-3 py-2 hover:bg-amber-100">
              <RotateCcw className="w-4 h-4" /> Reabrir
            </button>
          ) : null}
          <button onClick={salvar} disabled={salvando} className="inline-flex items-center gap-1.5 text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-3 py-2 hover:bg-gray-50 disabled:opacity-50">
            <Save className="w-4 h-4" /> {salvando ? "Salvando…" : "Salvar rascunho"}
          </button>
          <button onClick={aprovar} disabled={aprovando} className="inline-flex items-center gap-1.5 text-sm bg-brand-600 text-white rounded-md px-3 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">
            <CheckCircle2 className="w-4 h-4" /> {aprovando ? "Aprovando…" : aprovado ? "Reaprovar (nova versão)" : "Aprovar"}
          </button>
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-lg font-bold text-gray-900 px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-brand-500"
        placeholder="Título do RIPD"
      />

      {/* Seções */}
      {RIPD_SECTIONS.map((sec) => (
        <section key={sec.key} className="bg-white border rounded-xl p-4">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[11px] font-extrabold text-brand-700 bg-brand-50 rounded px-2 py-0.5">Seção {sec.number}</span>
            <h2 className="text-sm font-bold text-gray-900">{sec.title}</h2>
          </div>
          <p className="text-[11.5px] text-gray-500 mb-3">{sec.intro}</p>

          <div className="grid sm:grid-cols-2 gap-3">
            {sec.fields.map((f) => {
              const val = getFieldValue(data, f.path);
              const full = (f.width ?? "full") === "full";
              return (
                <div key={f.path} className={full ? "sm:col-span-2" : ""}>
                  <label className={labelCls}>
                    {f.label}
                    {f.prepop && <span className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />auto</span>}
                  </label>
                  {f.hint && <p className="text-[10.5px] text-gray-400 mb-1">{f.hint}</p>}
                  {f.kind === "textarea" ? (
                    <textarea
                      className={`${inputCls} resize-y`}
                      rows={f.rows ?? 3}
                      value={val}
                      placeholder={f.placeholder}
                      disabled={aprovado}
                      onChange={(e) => setField(f.path, e.target.value)}
                    />
                  ) : f.kind === "readonly" ? (
                    <div className="px-3 py-2 border rounded-md text-sm bg-slate-50 text-gray-600 min-h-[38px]">{val || "—"}</div>
                  ) : (
                    <input
                      className={inputCls}
                      value={val}
                      placeholder={f.placeholder}
                      disabled={aprovado}
                      onChange={(e) => setField(f.path, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Lista anexa de riscos (Seção 6) */}
          {sec.hasList === "risks" && (
            <div className="mt-3">
              <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold mb-2">
                Riscos do processo (da Análise de Riscos) · {data.s6.risks.length}
              </div>
              {data.s6.risks.length === 0 ? (
                <p className="text-[12px] text-gray-400">Nenhum risco mapeado para este processo na Fase 3.</p>
              ) : (
                <div className="space-y-2">
                  {data.s6.risks.map((r, i) => (
                    <div key={i} className="border rounded-lg px-3 py-2 bg-slate-50">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12.5px] font-semibold text-gray-800">{r.label}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border">{r.severityLevel}</span>
                        <span className="text-[10.5px] text-gray-500">{r.severityDetail}</span>
                      </div>
                      {r.mitigationSummary && <div className="text-[11.5px] text-gray-600 mt-1"><b>Recomendação:</b> {r.mitigationSummary}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Operadores (Seção 1) — mono: sem módulo de Terceiros */}
          {sec.hasList === "operatorsList" && data.s1.operatorsList.length === 0 && (
            <p className="text-[11px] text-gray-400 mt-2">Sem operadores estruturados cadastrados — descreva os terceiros no campo acima.</p>
          )}

          {/* Listas da Seção 7 */}
          {sec.hasList === "existingControls" && (
            <p className="text-[11px] text-gray-400 mt-2">
              {data.s7.existingControls.length + data.s7.plannedActions.length === 0
                ? "Complemente as medidas no campo acima; controles do GAP e ações do Plano podem ser referenciados manualmente."
                : `${data.s7.existingControls.length} controle(s) · ${data.s7.plannedActions.length} ação(ões) vinculadas.`}
            </p>
          )}
        </section>
      ))}

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px]">
        💡 Campos com <b>auto</b> vieram do Inventário/Riscos. <b>Salvar rascunho</b> guarda sem aprovar; <b>Aprovar</b> congela
        uma versão no histórico e marca o instrumento como aprovado. Depois de aprovado, use <b>Reabrir</b> para nova rodada.
      </div>
    </div>
  );
}
