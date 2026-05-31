"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { marked } from "marked";
import { Save, UploadCloud, FileDown, ExternalLink, ArrowLeft, Eye } from "lucide-react";
import {
  policyStatusLabel,
  policyStatusBadgeClass,
  policyTypeLabel,
} from "@/lib/policies-helpers";
import { salvarRascunho, publicarPolicy } from "@/app/dashboard/execucao/politicas/actions";

export type PolicyEditorDTO = {
  id: string;
  type: string;
  title: string;
  slug: string;
  status: string;
  currentContent: string;
  currentVersion: number;
  publishedAt: string | null;
  publishedBy: string | null;
};

marked.setOptions({ gfm: true, breaks: false });

export function PolicyEditorClient({ policy }: { policy: PolicyEditorDTO }) {
  const router = useRouter();
  const [title, setTitle] = useState(policy.title);
  const [content, setContent] = useState(policy.currentContent);
  const [salvando, setSalvando] = useState(false);
  const [publicando, setPublicando] = useState(false);

  const dirty = title !== policy.title || content !== policy.currentContent;
  const previewHtml = useMemo(() => marked.parse(content || "") as string, [content]);

  async function salvar() {
    if (!title.trim()) return toast.error("Informe o título.");
    setSalvando(true);
    try {
      await salvarRascunho({ id: policy.id, title, content });
      toast.success("Rascunho salvo");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível salvar");
    } finally {
      setSalvando(false);
    }
  }

  async function publicar() {
    if (dirty) {
      const ok = confirm(
        "Há alterações não salvas. Salvar o rascunho antes de publicar?\n\nOK = salvar e publicar · Cancelar = abortar",
      );
      if (!ok) return;
      await salvarRascunho({ id: policy.id, title, content }).catch(() => {});
    }
    const changeLog = prompt("O que mudou nesta versão? (opcional)") ?? undefined;
    setPublicando(true);
    try {
      const r = await publicarPolicy({ id: policy.id, changeLog });
      toast.success(`Publicada — versão ${r.version}`);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível publicar");
    } finally {
      setPublicando(false);
    }
  }

  const publicada = policy.status === "PUBLICADA";

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <Link href="/dashboard/execucao/politicas" className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-brand-600 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar às Políticas
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${policyStatusBadgeClass(policy.status)}`}>
              {policyStatusLabel(policy.status)}
            </span>
            <span className="text-[11.5px] text-gray-500">{policyTypeLabel(policy.type)}</span>
            {policy.currentVersion > 0 && (
              <span className="text-[11.5px] text-gray-500">· v{policy.currentVersion}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href={`/api/policies/${policy.id}/docx`}
            className="inline-flex items-center gap-1.5 text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-3 py-2 hover:bg-gray-50"
          >
            <FileDown className="w-4 h-4" /> Baixar DOCX
          </a>
          {publicada && (
            <Link
              href={`/p/${policy.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm border border-emerald-300 bg-emerald-50 text-emerald-700 rounded-md px-3 py-2 hover:bg-emerald-100"
            >
              <ExternalLink className="w-4 h-4" /> Ver página pública
            </Link>
          )}
          <button
            onClick={salvar}
            disabled={salvando || !dirty}
            className="inline-flex items-center gap-1.5 text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {salvando ? "Salvando…" : "Salvar rascunho"}
          </button>
          <button
            onClick={publicar}
            disabled={publicando}
            className="inline-flex items-center gap-1.5 text-sm bg-brand-600 text-white rounded-md px-3 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60"
          >
            <UploadCloud className="w-4 h-4" /> {publicando ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </div>

      {/* Título */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-lg font-bold text-gray-900 px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-brand-500"
        placeholder="Título do documento"
      />

      {/* Editor split */}
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="flex flex-col">
          <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold mb-1.5">
            Texto (markdown)
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck
            className="w-full h-[60vh] font-mono text-[12.5px] leading-relaxed px-3 py-2.5 border rounded-md outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>
        <div className="flex flex-col">
          <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold mb-1.5 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> Pré-visualização
          </div>
          <div
            className="prose prose-sm max-w-none h-[60vh] overflow-auto px-4 py-3 border rounded-md bg-white"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px]">
        💡 Escreva em <b>markdown</b> (# título, ** negrito **, listas com -). O texto entre <b>[colchetes]</b> são lacunas
        a preencher. <b>Salvar rascunho</b> guarda sem publicar; <b>Publicar</b> congela uma versão e atualiza a página pública.
      </div>
    </div>
  );
}
