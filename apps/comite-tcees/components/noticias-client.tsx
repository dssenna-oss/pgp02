"use client";

import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { marked } from "marked";
import { Plus, Pencil, Trash2, X, Eye, UploadCloud, Send, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { tipoArtigo, statusArtigo, TIPOS_ARTIGO } from "@/lib/articles";
import { usePodeEditar } from "@/lib/use-pode-editar";
import { salvarArtigo, alternarPublicacao, excluirArtigo, type ArticleInput } from "@/app/dashboard/noticias/actions";

marked.setOptions({ gfm: true, breaks: false });

export type ArticleDTO = {
  id: string;
  titulo: string;
  tipo: string;
  resumo: string | null;
  conteudo: string;
  capaUrl: string | null;
  autor: string | null;
  status: string;
  publicadoEmBR: string | null;
};

const VAZIO = (): ArticleDTO => ({
  id: "", titulo: "", tipo: "NOTICIA", resumo: "", conteudo: "", capaUrl: null, autor: null, status: "RASCUNHO", publicadoEmBR: null,
});

export function NoticiasClient({ artigos }: { artigos: ArticleDTO[] }) {
  const router = useRouter();
  const podeEditar = usePodeEditar();
  const [editando, setEditando] = useState<ArticleDTO | null>(null);
  const [lendo, setLendo] = useState<ArticleDTO | null>(null);
  const [filtro, setFiltro] = useState<string>("todos");

  // Membros (só leitura) só veem publicados; editores veem tudo.
  const base = podeEditar ? artigos : artigos.filter((a) => a.status === "PUBLICADO");
  const visiveis = filtro === "todos" ? base : base.filter((a) => a.tipo === filtro);

  const chip = (k: string, label: string) => (
    <button
      onClick={() => setFiltro(k)}
      className={`text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
        filtro === k ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {chip("todos", "Todos")}
          {TIPOS_ARTIGO.map((t) => chip(t, `${tipoArtigo(t).emoji} ${tipoArtigo(t).label}`))}
        </div>
        {podeEditar && (
          <button onClick={() => setEditando(VAZIO())} className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700">
            <Plus className="w-4 h-4" /> Nova publicação
          </button>
        )}
      </div>

      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {visiveis.map((a) => {
          const ti = tipoArtigo(a.tipo);
          const st = statusArtigo(a.status);
          return (
            <div key={a.id} className="bg-white border rounded-xl overflow-hidden flex flex-col">
              <button onClick={() => setLendo(a)} className="text-left flex flex-col flex-1 hover:opacity-95">
                {a.capaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.capaUrl} alt="" className="w-full h-32 object-cover bg-slate-100" />
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-brand-50 to-slate-100 flex items-center justify-center text-4xl">{ti.emoji}</div>
                )}
                <div className="p-3.5 flex-1 flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Badge variant={ti.variant}>{ti.emoji} {ti.label}</Badge>
                    {a.status !== "PUBLICADO" && <Badge variant={st.variant}>{st.label}</Badge>}
                  </div>
                  <div className="text-[14px] font-bold text-gray-900 leading-snug">{a.titulo}</div>
                  {a.resumo && <p className="text-[12px] text-gray-500 mt-1 line-clamp-2">{a.resumo}</p>}
                  <div className="text-[11px] text-gray-400 mt-auto pt-2">
                    {a.autor ? `${a.autor} · ` : ""}{a.publicadoEmBR ?? "não publicado"}
                  </div>
                </div>
              </button>
              {podeEditar && (
                <div className="flex items-center gap-2 px-3.5 py-2 border-t bg-slate-50/60">
                  <button
                    onClick={async () => {
                      const t = toast.loading("…");
                      try { const r = await alternarPublicacao(a.id); toast.success(r.publicado ? "Publicado" : "Voltou a rascunho", { id: t }); router.refresh(); }
                      catch (e: any) { toast.error(e?.message ?? "Falhou", { id: t }); }
                    }}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-700 hover:text-brand-800"
                  >
                    {a.status === "PUBLICADO" ? <><Undo2 className="w-3.5 h-3.5" /> Despublicar</> : <><Send className="w-3.5 h-3.5" /> Publicar</>}
                  </button>
                  <div className="ml-auto flex gap-2">
                    <button onClick={() => setEditando(a)} title="Editar" className="text-gray-400 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Excluir "${a.titulo}"?`)) return;
                        const t = toast.loading("Excluindo…");
                        try { await excluirArtigo(a.id); toast.success("Excluído", { id: t }); router.refresh(); }
                        catch { toast.error("Não foi possível excluir", { id: t }); }
                      }}
                      title="Excluir" className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {visiveis.length === 0 && (
          <div className="col-span-full bg-white border rounded-xl p-8 text-center text-sm text-gray-500">
            {podeEditar ? "Nenhuma publicação ainda. Clique em “Nova publicação” para começar." : "Nenhuma publicação disponível no momento."}
          </div>
        )}
      </div>

      {lendo && <LeituraModal artigo={lendo} onClose={() => setLendo(null)} />}
      {editando && <EdicaoModal artigo={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />}
    </>
  );
}

function LeituraModal({ artigo, onClose }: { artigo: ArticleDTO; onClose: () => void }) {
  const ti = tipoArtigo(artigo.tipo);
  const html = useMemo(() => marked.parse(artigo.conteudo || "") as string, [artigo.conteudo]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
        {artigo.capaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artigo.capaUrl} alt="" className="w-full h-48 object-cover rounded-t-xl bg-slate-100" />
        )}
        <div className="flex items-start justify-between gap-3 px-6 pt-5">
          <div>
            <Badge variant={ti.variant}>{ti.emoji} {ti.label}</Badge>
            <h2 className="text-xl font-extrabold text-gray-900 mt-2">{artigo.titulo}</h2>
            <div className="text-[12px] text-gray-400 mt-1">{artigo.autor ? `${artigo.autor} · ` : ""}{artigo.publicadoEmBR ?? "não publicado"}</div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700 shrink-0"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5">
          {artigo.conteudo.trim()
            ? <article className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-a:text-brand-700" dangerouslySetInnerHTML={{ __html: html }} />
            : <p className="text-sm text-gray-400 italic">Sem conteúdo.</p>}
        </div>
      </div>
    </div>
  );
}

function EdicaoModal({ artigo, onClose, onSaved }: { artigo: ArticleDTO; onClose: () => void; onSaved: () => void }) {
  const ehNovo = !artigo.id;
  const [form, setForm] = useState<ArticleDTO>(artigo);
  const [salvando, setSalvando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewHtml = useMemo(() => marked.parse(form.conteudo || "") as string, [form.conteudo]);

  function set<K extends keyof ArticleDTO>(k: K, v: ArticleDTO[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function escolherCapa(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Selecione uma imagem.");
    // redimensiona p/ largura máx 800px (capa) no canvas
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 800;
        const escala = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        set("capaUrl", canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function salvar(publicarDepois: boolean) {
    if (!form.titulo.trim()) return toast.error("Informe o título.");
    setSalvando(true);
    const input: ArticleInput = {
      id: form.id || undefined, titulo: form.titulo, tipo: form.tipo,
      resumo: form.resumo ?? "", conteudo: form.conteudo ?? "", capaUrl: form.capaUrl,
    };
    try {
      const r = await salvarArtigo(input);
      // publica só se pedido e ainda não estiver publicado
      if (publicarDepois && form.status !== "PUBLICADO") await alternarPublicacao(r.id);
      toast.success(publicarDepois ? "Salvo e publicado" : "Salvo");
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{ehNovo ? "Nova publicação" : "Editar publicação"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-3.5">
          <div className="grid sm:grid-cols-[1fr_auto] gap-3">
            <div>
              <label className={labelCls}>Título *</label>
              <input className={inputCls} value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex.: Comitê conclui o ROPA dos processos prioritários" />
            </div>
            <div>
              <label className={labelCls}>Tipo</label>
              <select className={inputCls} value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>
                {TIPOS_ARTIGO.map((t) => <option key={t} value={t}>{tipoArtigo(t).emoji} {tipoArtigo(t).label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Resumo <span className="font-normal text-gray-400">(chamada curta exibida na lista)</span></label>
            <input className={inputCls} value={form.resumo ?? ""} onChange={(e) => set("resumo", e.target.value)} placeholder="Uma frase que resume a publicação" />
          </div>

          <div>
            <label className={labelCls}>Imagem de capa <span className="font-normal text-gray-400">(opcional)</span></label>
            <div className="flex items-center gap-3">
              {form.capaUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={form.capaUrl} alt="" className="w-28 h-16 object-cover rounded-md border" />
                : <div className="w-28 h-16 rounded-md border bg-slate-50 flex items-center justify-center text-2xl text-gray-300">🖼️</div>}
              <input ref={inputRef} type="file" accept="image/*" onChange={escolherCapa} className="hidden" />
              <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold border rounded-md px-3 py-2 text-gray-700 hover:bg-gray-50">
                <UploadCloud className="w-4 h-4" /> {form.capaUrl ? "Trocar" : "Enviar"}
              </button>
              {form.capaUrl && <button onClick={() => set("capaUrl", null)} className="text-[12px] text-gray-400 hover:text-red-600">Remover</button>}
            </div>
          </div>

          {/* Editor split: markdown + preview */}
          <div>
            <label className={labelCls}>Conteúdo <span className="font-normal text-gray-400">(markdown: **negrito**, # título, - lista, [link](url))</span></label>
            <div className="grid md:grid-cols-2 gap-3">
              <textarea
                className={`${inputCls} font-mono text-[12.5px] min-h-[260px]`}
                value={form.conteudo}
                onChange={(e) => set("conteudo", e.target.value)}
                placeholder={"# Título da seção\n\nEscreva o conteúdo aqui em **markdown**.\n\n- ponto 1\n- ponto 2"}
              />
              <div className="border rounded-md p-3 overflow-auto min-h-[260px] bg-slate-50/40">
                <div className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-1.5 flex items-center gap-1"><Eye className="w-3 h-3" /> Pré-visualização</div>
                {form.conteudo.trim()
                  ? <article className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-a:text-brand-700" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  : <p className="text-[12px] text-gray-400 italic">A pré-visualização aparece aqui.</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={() => salvar(false)} disabled={salvando} className="text-sm border border-brand-200 bg-brand-50 text-brand-700 rounded-md px-4 py-2 font-semibold hover:bg-brand-100 disabled:opacity-60">
            {salvando ? "Salvando…" : "Salvar rascunho"}
          </button>
          <button onClick={() => salvar(true)} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">
            {salvando ? "…" : "Salvar e publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}
