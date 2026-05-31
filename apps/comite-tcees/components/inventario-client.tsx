"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { statusInventario, STATUS_INVENTARIO, HIPOTESE_MACRO } from "@/lib/comite-ui";
import { salvarInventario, excluirInventario, adicionarSugestoes, type InventarioInput, type SugestaoInput } from "@/app/dashboard/inventario/actions";

export type InventarioDTO = {
  id: string;
  nome: string;
  unidadeGestora: string | null;
  hipoteseMacro: string | null;
  finalidade: string | null;
  baseLegal: string | null;
  tiposDados: string | null;
  dadosSensiveis: boolean;
  retencao: string | null;
  compartilhamento: string | null;
  medidasSeguranca: string | null;
  prioritario: boolean;
  status: string;
  observacoes: string | null;
};

const VAZIO = (): InventarioDTO => ({
  id: "", nome: "", unidadeGestora: "", hipoteseMacro: "IV", finalidade: "", baseLegal: "",
  tiposDados: "", dadosSensiveis: false, retencao: "", compartilhamento: "", medidasSeguranca: "",
  prioritario: false, status: "PRELIMINAR", observacoes: "",
});

export function InventarioClient({ processos }: { processos: InventarioDTO[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<InventarioDTO | null>(null);
  const [sugerindo, setSugerindo] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | "prioritarios" | "sensiveis">("todos");

  const visiveis = processos.filter((p) =>
    filtro === "prioritarios" ? p.prioritario : filtro === "sensiveis" ? p.dadosSensiveis : true,
  );
  const prioritarios = processos.filter((p) => p.prioritario).length;
  const sensiveis = processos.filter((p) => p.dadosSensiveis).length;

  const chip = (k: typeof filtro, label: string) => (
    <button
      onClick={() => setFiltro(k)}
      className={`text-xs font-semibold border rounded-full px-3 py-1.5 ${
        filtro === k ? "bg-navy text-white border-navy" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="flex gap-2 flex-wrap mb-4">
        {chip("todos", `Todos (${processos.length})`)}
        {chip("prioritarios", `Prioritários (${prioritarios})`)}
        {chip("sensiveis", `Com dados sensíveis (${sensiveis})`)}
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">
          🗂️ {processos.length} processos · {prioritarios} prioritários · {sensiveis} com dados sensíveis
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSugerindo(true)} className="inline-flex items-center gap-2 border border-brand-200 bg-brand-50 text-brand-700 rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-100">
            <Sparkles className="w-4 h-4" /> Sugerir da Carta de Serviços
          </button>
          <button onClick={() => setEditando(VAZIO())} className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700">
            <Plus className="w-4 h-4" /> Novo processo
          </button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
        {visiveis.map((p) => {
          const st = statusInventario(p.status);
          return (
            <div key={p.id} className="bg-white border rounded-xl p-4">
              <div className="flex justify-between gap-2 items-start">
                <div className="text-[13.5px] font-bold text-gray-900">{p.nome}</div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setEditando(p)} title="Editar" className="text-gray-300 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Excluir o processo "${p.nome}" do Inventário?`)) return;
                      const t = toast.loading("Excluindo…");
                      try { await excluirInventario(p.id); toast.success("Processo excluído", { id: t }); router.refresh(); }
                      catch { toast.error("Não foi possível excluir", { id: t }); }
                    }}
                    title="Excluir" className="text-gray-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant={st.variant}>{st.label}</Badge>
                {p.prioritario && <Badge variant="indigo">prioritário</Badge>}
                {p.dadosSensiveis && <Badge variant="red"><ShieldAlert className="w-3 h-3" /> dados sensíveis</Badge>}
                {p.hipoteseMacro && <Badge variant="gray">Hipótese {p.hipoteseMacro}</Badge>}
              </div>
              <div className="text-[11.5px] text-gray-500 mt-2 space-y-0.5">
                {p.unidadeGestora && <div><b className="text-gray-700">Unidade gestora:</b> {p.unidadeGestora}</div>}
                {p.hipoteseMacro && <div><b className="text-gray-700">Tratamento:</b> {HIPOTESE_MACRO[p.hipoteseMacro] ?? p.hipoteseMacro}</div>}
                {p.baseLegal && <div><b className="text-gray-700">Base legal:</b> {p.baseLegal}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px] flex gap-2 mt-4">
        💡 Os 12 processos prioritários têm Inventário inicial (2021) e serão refeitos sob metodologia atualizada (marco de Q3/2026).
        O Inventário será estendido aos ~103 processos restantes até Q2/2027.
      </div>

      {editando && <InventarioModal processo={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />}
      {sugerindo && <SugerirModal onClose={() => setSugerindo(false)} onSaved={() => { setSugerindo(false); router.refresh(); }} />}
    </>
  );
}

// ===================== Sugerir da Carta de Serviços (IA) =====================
type ServicoSugerido = {
  id: string;
  name: string;
  description: string;
  classification: "SUGERIDO" | "TALVEZ" | "NAO";
  classificationReason: string;
  category: string | null;
  sourceUrl: string;
  prefill: {
    process_name?: string;
    process_purpose?: string;
    data_subjects?: string[];
    legalBasis?: string;
    share_targets?: string[];
    share_with_whom?: string;
  };
  alreadyMapped?: { inventoryId: string };
};

const CLASS_BADGE: Record<string, { label: string; variant: "green" | "amber" | "gray" }> = {
  SUGERIDO: { label: "trata dados pessoais", variant: "green" },
  TALVEZ: { label: "talvez", variant: "amber" },
  NAO: { label: "sem dados pessoais", variant: "gray" },
};

function SugerirModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [url, setUrl] = useState("https://www.tcees.tc.br/");
  const [fase, setFase] = useState<"input" | "carregando" | "resultado">("input");
  const [servicos, setServicos] = useState<ServicoSugerido[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);

  async function buscar() {
    if (!/^https?:\/\//.test(url.trim())) return toast.error("Informe uma URL válida (com https://).");
    setFase("carregando");
    setErro(null);
    try {
      const res = await fetch("/api/inventario/sugerir-da-carta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Falha na busca");
      const svcs: ServicoSugerido[] = data.services ?? [];
      setServicos(svcs);
      setWarnings(data.warnings ?? []);
      setErro(data.blockingError ?? null);
      // pré-seleciona os SUGERIDO ainda não mapeados
      setSel(new Set(svcs.filter((s) => s.classification === "SUGERIDO" && !s.alreadyMapped).map((s) => s.id)));
      setFase("resultado");
    } catch (e: any) {
      setErro(e?.message ?? "Erro inesperado");
      setFase("resultado");
    }
  }

  function toggle(id: string) {
    setSel((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function adicionar() {
    const escolhidos = servicos.filter((s) => sel.has(s.id) && !s.alreadyMapped);
    if (!escolhidos.length) return toast.error("Selecione ao menos um processo.");
    setSalvando(true);
    const payload: SugestaoInput[] = escolhidos.map((s) => ({
      nome: s.prefill.process_name || s.name,
      finalidade: s.prefill.process_purpose,
      baseLegal: s.prefill.legalBasis,
      compartilhamento: s.prefill.share_with_whom || (s.prefill.share_targets ?? []).join("; "),
      publicoAlvo: (s.prefill.data_subjects ?? []).join(", "),
      sourceUrl: s.sourceUrl,
    }));
    try {
      const r = await adicionarSugestoes(payload);
      toast.success(`${r.criados} processo(s) adicionado(s) ao Inventário`);
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível adicionar");
    } finally {
      setSalvando(false);
    }
  }

  const selecionaveis = servicos.filter((s) => !s.alreadyMapped);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-600" /> Sugerir processos da Carta de Serviços</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5">
          <p className="text-[12.5px] text-gray-600 mb-3">
            Informe o link da Carta de Serviços (ou outra página de serviços) do TCEES. A IA lê a página e suas sub-páginas e sugere processos que tratam dados pessoais — você revisa e escolhe quais entram no Inventário.
          </p>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.tcees.tc.br/carta-de-servicos/"
              disabled={fase === "carregando"}
            />
            <button onClick={buscar} disabled={fase === "carregando"} className="bg-brand-600 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 whitespace-nowrap">
              {fase === "carregando" ? "Lendo…" : "Buscar processos"}
            </button>
          </div>

          {fase === "carregando" && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Lendo a página e analisando com IA — isso pode levar até ~40 segundos…
            </div>
          )}

          {fase === "resultado" && (
            <div className="mt-4">
              {erro && <div className="bg-red-50 border border-red-200 text-red-800 rounded-md px-3 py-2 text-[12.5px] mb-3">{erro}</div>}
              {warnings.map((w, i) => (
                <div key={i} className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-3 py-1.5 text-[11.5px] mb-1.5">{w}</div>
              ))}

              {selecionaveis.length > 0 && (
                <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold mt-2 mb-2">
                  {servicos.length} processos encontrados · {sel.size} selecionado(s)
                </div>
              )}

              <div className="space-y-2 max-h-[42vh] overflow-auto pr-1">
                {servicos.map((s) => {
                  const cb = CLASS_BADGE[s.classification];
                  const mapped = !!s.alreadyMapped;
                  return (
                    <label key={s.id} className={`flex gap-2.5 items-start border rounded-lg px-3 py-2.5 ${mapped ? "bg-gray-50 opacity-70" : "bg-white cursor-pointer hover:bg-gray-50"}`}>
                      <input
                        type="checkbox"
                        className="mt-0.5 w-4 h-4 accent-brand-600"
                        checked={mapped || sel.has(s.id)}
                        disabled={mapped}
                        onChange={() => toggle(s.id)}
                      />
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                          {s.prefill.process_name || s.name}
                          <Badge variant={cb.variant}>{cb.label}</Badge>
                          {s.category && <Badge variant="blue">{s.category}</Badge>}
                          {mapped && <Badge variant="gray">já no Inventário</Badge>}
                        </div>
                        {s.classificationReason && <div className="text-[11.5px] text-gray-500 mt-0.5">{s.classificationReason}</div>}
                      </div>
                    </label>
                  );
                })}
                {servicos.length === 0 && !erro && <div className="text-sm text-gray-500 py-3">Nenhum processo encontrado nessa página.</div>}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Fechar</button>
          {fase === "resultado" && selecionaveis.length > 0 && (
            <button onClick={adicionar} disabled={salvando || sel.size === 0} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">
              {salvando ? "Adicionando…" : `Adicionar ${sel.size} ao Inventário`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InventarioModal({ processo, onClose, onSaved }: { processo: InventarioDTO; onClose: () => void; onSaved: () => void }) {
  const ehNovo = !processo.id;
  const [form, setForm] = useState<InventarioDTO>(processo);
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof InventarioDTO>(k: K, v: InventarioDTO[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function salvar() {
    if (!form.nome.trim()) return toast.error("Informe o nome do processo.");
    setSalvando(true);
    const input: InventarioInput = {
      id: form.id || undefined, nome: form.nome, unidadeGestora: form.unidadeGestora ?? "",
      hipoteseMacro: form.hipoteseMacro ?? "", finalidade: form.finalidade ?? "", baseLegal: form.baseLegal ?? "",
      tiposDados: form.tiposDados ?? "", dadosSensiveis: form.dadosSensiveis, retencao: form.retencao ?? "",
      compartilhamento: form.compartilhamento ?? "", medidasSeguranca: form.medidasSeguranca ?? "",
      prioritario: form.prioritario, status: form.status, observacoes: form.observacoes ?? "",
    };
    try { await salvarInventario(input); toast.success(ehNovo ? "Processo adicionado" : "Processo atualizado"); onSaved(); }
    catch (e: any) { toast.error(e?.message ?? "Não foi possível salvar"); }
    finally { setSalvando(false); }
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{ehNovo ? "Novo processo no Inventário" : "Editar processo"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div>
            <label className={labelCls}>Nome do processo / sistema *</label>
            <input className={inputCls} value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: SGP RH — Folha de Pagamento" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Unidade gestora</label>
              <input className={inputCls} value={form.unidadeGestora ?? ""} onChange={(e) => set("unidadeGestora", e.target.value)} placeholder="Ex.: SEGAFI" />
            </div>
            <div>
              <label className={labelCls}>Hipótese de tratamento</label>
              <select className={inputCls} value={form.hipoteseMacro ?? ""} onChange={(e) => set("hipoteseMacro", e.target.value)}>
                <option value="">—</option>
                {Object.entries(HIPOTESE_MACRO).map(([k, v]) => <option key={k} value={k}>{k} · {v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Finalidade</label>
            <textarea className={inputCls} rows={2} value={form.finalidade ?? ""} onChange={(e) => set("finalidade", e.target.value)} placeholder="Para que os dados são tratados…" />
          </div>
          <div>
            <label className={labelCls}>Base legal</label>
            <input className={inputCls} value={form.baseLegal ?? ""} onChange={(e) => set("baseLegal", e.target.value)} placeholder="Ex.: Art. 7º, III c/c art. 23, I, da LGPD" />
          </div>
          <div>
            <label className={labelCls}>Tipos de dados tratados</label>
            <textarea className={inputCls} rows={2} value={form.tiposDados ?? ""} onChange={(e) => set("tiposDados", e.target.value)} placeholder="Ex.: nome, CPF, matrícula, dados funcionais…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Retenção</label>
              <input className={inputCls} value={form.retencao ?? ""} onChange={(e) => set("retencao", e.target.value)} placeholder="Prazo de guarda" />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUS_INVENTARIO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Compartilhamento</label>
            <input className={inputCls} value={form.compartilhamento ?? ""} onChange={(e) => set("compartilhamento", e.target.value)} placeholder="Com quem os dados são compartilhados" />
          </div>
          <div>
            <label className={labelCls}>Medidas de segurança</label>
            <textarea className={inputCls} rows={2} value={form.medidasSeguranca ?? ""} onChange={(e) => set("medidasSeguranca", e.target.value)} placeholder="Controles de acesso, criptografia, logs…" />
          </div>
          <div className="flex gap-5 pt-1">
            <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={form.prioritario} onChange={(e) => set("prioritario", e.target.checked)} />
              Processo prioritário
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 accent-red-600" checked={form.dadosSensiveis} onChange={(e) => set("dadosSensiveis", e.target.checked)} />
              Trata dados sensíveis
            </label>
          </div>
          <div>
            <label className={labelCls}>Observações</label>
            <textarea className={inputCls} rows={2} value={form.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">
            {salvando ? "Salvando…" : ehNovo ? "Adicionar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
