"use client";

/**
 * Editor do Aviso de Privacidade — `/dashboard/avisos-privacidade/[id]/editar`.
 *
 * Layout split:
 *   Coluna esquerda — checkboxes de seções (10) + textarea de Observações
 *     Adicionais + caixa de URL pública.
 *   Coluna direita — preview do markdown gerado em tempo real (via API
 *     PATCH a cada save ou client-side via builder? — usamos client-side
 *     pra ser instantâneo).
 *
 * Decisões importantes:
 *   - Save manual (botão "Salvar rascunho"). Não auto-save pra evitar
 *     publish acidental.
 *   - "Publicar nova versão" pede changeLog opcional e cria
 *     ServicePrivacyNoticeVersion + atualiza publishedContent.
 *   - "Sincronizar do Inventário" só aparece quando outdated=true.
 *
 * Pra v1 não temos editor de markdown — usuário vê o markdown gerado em
 * read-only no preview e edita via seções + observações. Caso queira
 * edição livre do markdown completo, fica pra v2 (mesma textarea split
 * que policy-editor.tsx usa).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { marked } from "marked";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Save,
  Send,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Copy,
  Edit3,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AVISO_SECTIONS } from "@/lib/aviso-privacidade-sections";

interface NoticeData {
  id: string;
  slug: string;
  status: "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";
  currentVersion: number;
  currentContent: string;
  publishedContent: string | null;
  includedSections: Record<string, { included: boolean; content?: string }>;
  additionalNotes: string | null;
  lastSyncedFromInventoryAt: string;
  forcedDespiteNotApproved: boolean;
  publishedAt: string | null;
  outdated: boolean;
  dataInventory: {
    id: string;
    serviceName: string;
    status: string;
    updatedAt: string;
    setor: string | null;
  };
  company: { slug: string | null; companyName: string };
}

export default function AvisoEditorContent({ noticeId }: { noticeId: string }) {
  const router = useRouter();
  const [data, setData] = useState<NoticeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [includedSections, setIncludedSections] = useState<
    Record<string, { included: boolean; content?: string }>
  >({});
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [changeLog, setChangeLog] = useState("");
  const [view, setView] = useState<"split" | "preview">("split");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/avisos-privacidade/${noticeId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Erro");
        if (cancelled) return;
        setData(json.notice);
        setIncludedSections(json.notice.includedSections ?? {});
        setAdditionalNotes(json.notice.additionalNotes ?? "");
        setDirty(false);
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message ?? "Erro ao carregar Aviso");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [noticeId]);

  function toggleSection(id: string) {
    const def = AVISO_SECTIONS.find((s) => s.id === id);
    if (def?.required) return; // não pode desligar obrigatórios
    setIncludedSections((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), included: !prev[id]?.included },
    }));
    setDirty(true);
  }

  function updateNotes(v: string) {
    setAdditionalNotes(v);
    setDirty(true);
  }

  async function save() {
    if (saving || !data) return;
    setSaving(true);
    try {
      // PATCH não regenera o currentContent automaticamente — precisamos
      // sincronizar do Inventário pra refletir mudanças de seção.
      // Salvamos as configs primeiro, depois disparamos sync que
      // regerá o markdown com as seções novas + notes novos.
      const patchRes = await fetch(`/api/avisos-privacidade/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          includedSections,
          additionalNotes: additionalNotes || null,
        }),
      });
      const patchJson = await patchRes.json();
      if (!patchRes.ok) {
        toast.error(patchJson?.error ?? "Erro ao salvar");
        return;
      }
      // Re-sincroniza pra regerar o markdown com as novas seções
      const syncRes = await fetch(
        `/api/avisos-privacidade/${data.id}/sync-from-inventory`,
        { method: "POST" },
      );
      const syncJson = await syncRes.json();
      if (!syncRes.ok) {
        toast.error(syncJson?.error ?? "Erro ao re-gerar markdown");
        return;
      }
      // Recarrega o detalhe completo pra refletir tudo
      const detail = await fetch(`/api/avisos-privacidade/${data.id}`);
      const detailJson = await detail.json();
      if (detail.ok) {
        setData(detailJson.notice);
        setIncludedSections(detailJson.notice.includedSections ?? {});
        setAdditionalNotes(detailJson.notice.additionalNotes ?? "");
        setDirty(false);
        toast.success("Rascunho salvo.");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (publishing || !data) return;
    if (dirty) {
      if (!confirm("Você tem alterações não salvas. Salve antes de publicar.")) {
        return;
      }
      await save();
    }
    setPublishing(true);
    try {
      const res = await fetch(`/api/avisos-privacidade/${data.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeLog: changeLog || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error ?? "Erro ao publicar");
        return;
      }
      toast.success(`Versão ${json.notice.currentVersion} publicada.`);
      setShowPublishModal(false);
      setChangeLog("");
      const detail = await fetch(`/api/avisos-privacidade/${data.id}`);
      const detailJson = await detail.json();
      if (detail.ok) setData(detailJson.notice);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro inesperado");
    } finally {
      setPublishing(false);
    }
  }

  async function sync() {
    if (syncing || !data) return;
    setSyncing(true);
    try {
      const res = await fetch(
        `/api/avisos-privacidade/${data.id}/sync-from-inventory`,
        { method: "POST" },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j?.error ?? "Erro ao sincronizar");
        return;
      }
      const detail = await fetch(`/api/avisos-privacidade/${data.id}`);
      const detailJson = await detail.json();
      if (detail.ok) {
        setData(detailJson.notice);
        setIncludedSections(detailJson.notice.includedSections ?? {});
        setAdditionalNotes(detailJson.notice.additionalNotes ?? "");
        setDirty(false);
        toast.success("Sincronizado com o Inventário.");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erro inesperado");
    } finally {
      setSyncing(false);
    }
  }

  const previewHtml = useMemo(() => {
    if (!data) return "";
    return marked.parse(data.currentContent) as string;
  }, [data]);

  const publicUrl = useMemo(() => {
    if (!data || !data.company.slug) return null;
    const base =
      typeof window !== "undefined" ? window.location.origin : "https://lgpd-pgp.vercel.app";
    return `${base}/p/${data.company.slug}/aviso-servico/${data.slug}`;
  }, [data]);

  function copyUrl() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    toast.success("URL copiada.");
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-sm text-red-700">Aviso não encontrado.</p>
        <Link href="/dashboard/avisos-privacidade" className="text-xs text-violet-600">
          ← Voltar pra lista
        </Link>
      </div>
    );
  }

  const isPub = data.status === "PUBLICADO";

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-3">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span className="mx-1">/</span>
        <Link href="/dashboard/avisos-privacidade" className="hover:text-gray-700">
          Avisos de Privacidade
        </Link>
        <span className="mx-1">/</span>
        <span className="text-gray-700 font-medium truncate">
          {data.dataInventory.serviceName}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="h-6 w-6 text-violet-600 shrink-0" />
            <span className="truncate">Aviso de Privacidade — {data.dataInventory.serviceName}</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Vinculado ao Inventário (status {data.dataInventory.status}) ·
            {isPub ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                {" "}🟢 Publicado v{data.currentVersion}
                {data.publishedAt && ` em ${new Date(data.publishedAt).toLocaleDateString("pt-BR")}`}
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400 font-medium"> 🟡 Rascunho</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {isPub && data.company.slug && (
            <a
              href={`/p/${data.company.slug}/aviso-servico/${data.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 inline-flex items-center gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Ver público
            </a>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={save}
            disabled={saving || !dirty}
            className="text-xs"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            Salvar rascunho
          </Button>
          <Button
            size="sm"
            onClick={() => setShowPublishModal(true)}
            disabled={publishing}
            className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            {isPub ? "Publicar nova versão" : "Publicar"}
          </Button>
        </div>
      </div>

      {/* Banner Inventário mudou */}
      {data.outdated && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-3 rounded mb-5 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1 text-sm">
            <strong className="text-amber-900 dark:text-amber-100">
              O Inventário foi atualizado em{" "}
              {new Date(data.dataInventory.updatedAt).toLocaleDateString("pt-BR")}.
            </strong>{" "}
            <span className="text-amber-800 dark:text-amber-200">
              O conteúdo abaixo ainda reflete a sincronização anterior. Re-sincronize pra
              incorporar as mudanças (suas Observações Adicionais ficam preservadas).
            </span>
          </div>
          <Button
            size="sm"
            onClick={sync}
            disabled={syncing}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
            )}
            Sincronizar
          </Button>
        </div>
      )}

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setView("split")}
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
            view === "split"
              ? "bg-gray-800 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200",
          )}
        >
          <Edit3 className="h-3.5 w-3.5" /> Editar + Preview
        </button>
        <button
          type="button"
          onClick={() => setView("preview")}
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
            view === "preview"
              ? "bg-gray-800 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200",
          )}
        >
          <Eye className="h-3.5 w-3.5" /> Só preview
        </button>
      </div>

      <div
        className={cn(
          "grid gap-5",
          view === "split" ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1",
        )}
      >
        {view === "split" && (
          <aside className="lg:col-span-5 space-y-5">
            {/* Seções */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                ☑️ Seções deste Aviso
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Marque o que aparece pro cidadão. Mudanças salvam quando você clica em
                "Salvar rascunho".
              </p>
              <div className="space-y-1.5">
                {AVISO_SECTIONS.map((s) => {
                  const state = includedSections[s.id];
                  const checked = s.required ? true : Boolean(state?.included);
                  return (
                    <label
                      key={s.id}
                      className={cn(
                        "flex items-start gap-2 p-1.5 rounded text-sm",
                        s.required ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={s.required}
                        onChange={() => toggleSection(s.id)}
                        className="mt-1 rounded h-4 w-4 text-violet-600 focus:ring-violet-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {s.title}
                          {s.required && (
                            <span className="text-xs text-gray-400 font-normal ml-1">
                              · obrigatório
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{s.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Observações adicionais */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                ✏️ Observações adicionais
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                Texto livre que entra como última seção do documento. Aceita markdown
                (**negrito**, *itálico*, listas, [links](url)).
              </p>
              <textarea
                value={additionalNotes}
                onChange={(e) => updateNotes(e.target.value)}
                rows={6}
                className="w-full text-sm p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900"
                placeholder="Ex: horário de atendimento, canais alternativos, informações que não cabem no Inventário..."
              />
            </div>

            {/* URL pública */}
            {data.company.slug && (
              <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                  🌐 URL pública
                </h3>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 font-mono text-xs">
                  <span className="flex-1 truncate text-gray-700 dark:text-gray-300">
                    {publicUrl}
                  </span>
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 inline-flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" /> Copiar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {isPub
                    ? "Disponível agora — pode colar no site da organização."
                    : "Disponível assim que você publicar."}
                </p>
              </div>
            )}
          </aside>
        )}

        {/* Preview */}
        <section className={cn(view === "split" ? "lg:col-span-7" : "col-span-1")}>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-900/40 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                👁 Preview · como o cidadão vai ver
              </h3>
              {dirty && (
                <span className="text-xs text-amber-700 dark:text-amber-400">
                  Alterações pendentes — salve pra atualizar o preview
                </span>
              )}
            </div>
            <article
              className="p-5 policy-article max-h-[800px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </section>
      </div>

      {/* Modal de publish */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Publicar Aviso?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {isPub
                ? `Vai congelar a versão ${data.currentVersion + 1} e atualizar a URL pública. A versão atual (${data.currentVersion}) fica no histórico.`
                : "Vai criar a versão 1 e disponibilizar a URL pública pra acesso de qualquer pessoa."}
            </p>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              O que mudou nessa versão? (opcional)
            </label>
            <textarea
              value={changeLog}
              onChange={(e) => setChangeLog(e.target.value)}
              rows={3}
              className="w-full text-sm p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
              placeholder="Ex: Atualização da seção de Compartilhamento após mudança no fluxo."
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowPublishModal(false);
                  setChangeLog("");
                }}
                disabled={publishing}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={publish}
                disabled={publishing}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Publicar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inline css pra preview parecer com /p/.. */}
      <style jsx global>{`
        .policy-article {
          line-height: 1.7;
          color: #1f2937;
        }
        .policy-article h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 1.5rem 0 1rem;
        }
        .policy-article h2 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 1.5rem 0 0.5rem;
          padding-bottom: 4px;
          border-bottom: 1px solid #e5e7eb;
        }
        .policy-article p {
          margin: 0.5rem 0;
          font-size: 0.95rem;
        }
        .policy-article ul {
          list-style: disc;
          padding-left: 1.25rem;
          margin: 0.5rem 0;
          font-size: 0.95rem;
        }
        .policy-article li {
          margin: 0.2rem 0;
        }
        .policy-article strong {
          font-weight: 600;
          color: #111827;
        }
        .policy-article em {
          font-style: italic;
          color: #6b7280;
        }
        .policy-article blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 12px;
          color: #4b5563;
          margin: 1rem 0;
        }
        .policy-article hr {
          margin: 1.5rem 0;
          border: none;
          border-top: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
}
