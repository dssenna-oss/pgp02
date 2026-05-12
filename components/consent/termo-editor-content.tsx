"use client";

/**
 * Editor de Termo de Consentimento — split markdown + preview.
 *
 * Layout:
 *   - Header com ações: Histórico · DOCX · PDF · Ver público · Salvar · Publicar
 *   - 3 abas: Editar (split) · Registros (records) · Configurações (modos + vínculos)
 *   - Salvamento manual (botão Salvar). Publicar abre modal de changeLog.
 *
 * Reusa estilo das Políticas/Avisos. Padrão consistente.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { marked } from "marked";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  FileSignature,
  Loader2,
  Save,
  Send,
  ExternalLink,
  Download,
  Printer,
  Copy,
  Edit3,
  Eye,
  ListChecks,
  Settings as SettingsIcon,
  Trash2,
  Archive,
  Plus,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import TermoRecordsPanel from "./termo-records-panel";
import TermoLinkPickerModal from "./termo-link-picker-modal";
import TermoQrCode from "./termo-qr-code";

interface TermDetail {
  id: string;
  slug: string;
  title: string;
  status: "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";
  templateType: string;
  currentVersion: number;
  currentContent: string;
  publishedContent: string | null;
  allowsPhysical: boolean;
  allowsDigital: boolean;
  publishedAt: string | null;
  acceptedCount: number;
  company: { slug: string | null; companyName: string };
  inventoryLinks: Array<{
    inventory: {
      id: string;
      serviceName: string | null;
      status: string;
      setor: string | null;
    };
  }>;
}

type TabKey = "edit" | "records" | "settings";

export default function TermoEditorContent({ termId }: { termId: string }) {
  const router = useRouter();
  const [data, setData] = useState<TermDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("edit");

  // Estado editável
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [allowsPhysical, setAllowsPhysical] = useState(true);
  const [allowsDigital, setAllowsDigital] = useState(true);
  const [dirty, setDirty] = useState(false);

  // Ações
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [changeLog, setChangeLog] = useState("");
  const [view, setView] = useState<"split" | "preview">("split");
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [linkOpInProgress, setLinkOpInProgress] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/consent-terms/${termId}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Erro");
      setData(j.term);
      setTitle(j.term.title);
      setContent(j.term.currentContent);
      setAllowsPhysical(j.term.allowsPhysical);
      setAllowsDigital(j.term.allowsDigital);
      setDirty(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termId]);

  async function save() {
    if (!data || saving) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/consent-terms/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentContent: content,
          title: title.trim() || data.title,
          allowsPhysical,
          allowsDigital,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        toast.error(j?.error ?? "Erro ao salvar");
        return;
      }
      await load();
      toast.success("Rascunho salvo.");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!data || publishing) return;
    if (dirty) {
      if (!confirm("Há alterações não salvas. Salve antes de publicar.")) return;
      await save();
    }
    setPublishing(true);
    try {
      const r = await fetch(`/api/consent-terms/${data.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeLog: changeLog || null }),
      });
      const j = await r.json();
      if (!r.ok) {
        toast.error(j?.error ?? "Erro ao publicar");
        return;
      }
      toast.success(`Versão ${j.term.currentVersion} publicada.`);
      setShowPublish(false);
      setChangeLog("");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally {
      setPublishing(false);
    }
  }

  async function persistLinks(newLinkedInventoryIds: string[]) {
    if (!data) return;
    const r = await fetch(`/api/consent-terms/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkedInventoryIds: newLinkedInventoryIds }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) {
      toast.error(j?.error ?? "Erro ao atualizar vínculos");
      throw new Error(j?.error ?? "Erro");
    }
    await load();
  }

  async function handleAddLinks(finalIds: string[]) {
    try {
      await persistLinks(finalIds);
      setShowLinkPicker(false);
      toast.success("Processos vinculados.");
    } catch {
      // toast já mostrado em persistLinks
    }
  }

  async function handleRemoveLink(inventoryId: string) {
    if (!data) return;
    if (!confirm("Remover este processo do termo? Os aceites já coletados continuam válidos.")) return;
    setLinkOpInProgress(inventoryId);
    try {
      const remaining = data.inventoryLinks
        .map((l) => l.inventory.id)
        .filter((id) => id !== inventoryId);
      await persistLinks(remaining);
      toast.success("Processo desvinculado.");
    } catch {
      // toast já mostrado
    } finally {
      setLinkOpInProgress(null);
    }
  }

  async function archive() {
    if (!data) return;
    if (!confirm("Arquivar este termo? A URL pública vai parar de aceitar novos aceites. Registros existentes ficam preservados.")) return;
    try {
      const r = await fetch(`/api/consent-terms/${data.id}`, { method: "DELETE" });
      if (!r.ok) {
        toast.error("Erro ao arquivar");
        return;
      }
      toast.success("Termo arquivado.");
      router.push("/dashboard/termos-consentimento");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    }
  }

  const previewHtml = useMemo(
    () => (content ? (marked.parse(content) as string) : ""),
    [content],
  );

  const publicUrl = useMemo(() => {
    if (!data || !data.company.slug) return null;
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://lgpd-pgp.vercel.app";
    return `${base}/p/${data.company.slug}/termo/${data.slug}`;
  }, [data]);

  function copyUrl() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    toast.success("URL copiada.");
  }

  function markDirty<T>(setter: (v: T) => void): (v: T) => void {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
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
        <p className="text-sm text-red-700">Termo não encontrado.</p>
        <Link href="/dashboard/termos-consentimento" className="text-xs text-violet-600">
          ← Voltar pra lista
        </Link>
      </div>
    );
  }

  const isPub = data.status === "PUBLICADO";
  const isArchived = data.status === "ARQUIVADO";

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <nav className="text-sm text-gray-500 mb-3">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span className="mx-1">/</span>
        <Link href="/dashboard/termos-consentimento" className="hover:text-gray-700">
          Termos de Consentimento
        </Link>
        <span className="mx-1">/</span>
        <span className="text-gray-700 font-medium truncate">{data.title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-violet-600 shrink-0" />
            <span className="truncate">{data.title}</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isPub ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                🟢 Publicado v{data.currentVersion}
                {data.publishedAt && ` em ${new Date(data.publishedAt).toLocaleDateString("pt-BR")}`}
              </span>
            ) : isArchived ? (
              <span className="text-gray-700 font-medium">📦 Arquivado</span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400 font-medium">🟡 Rascunho</span>
            )}
            {data.acceptedCount > 0 && (
              <> · <strong>{data.acceptedCount}</strong> aceite{data.acceptedCount === 1 ? "" : "s"} coletado{data.acceptedCount === 1 ? "" : "s"}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <a
            href={`/api/consent-terms/${data.id}/export?source=${isPub ? "published" : "current"}`}
            className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 inline-flex items-center gap-1"
            title="Baixar DOCX (modo físico)"
          >
            <Download className="h-3.5 w-3.5" /> DOCX
          </a>
          <a
            href={`/dashboard/termos-consentimento/${data.id}/pdf?source=${isPub ? "published" : "current"}&autoprint=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 inline-flex items-center gap-1"
          >
            <Printer className="h-3.5 w-3.5" /> PDF
          </a>
          {isPub && data.company.slug && data.allowsDigital && (
            <button
              type="button"
              onClick={() => setShowQrCode((v) => !v)}
              className={cn(
                "text-xs px-3 py-1.5 rounded border inline-flex items-center gap-1",
                showQrCode
                  ? "border-violet-300 bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
                  : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800",
              )}
              title="Gerar QR Code da URL pública"
            >
              <QrCode className="h-3.5 w-3.5" /> QR Code
            </button>
          )}
          {isPub && data.company.slug && (
            <a
              href={`/p/${data.company.slug}/termo/${data.slug}`}
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
            disabled={saving || !dirty || isArchived}
            className="text-xs"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Salvar rascunho
          </Button>
          <Button
            size="sm"
            onClick={() => setShowPublish(true)}
            disabled={publishing || isArchived}
            className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            {isPub ? "Publicar nova versão" : "Publicar"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        <TabButton active={tab === "edit"} onClick={() => setTab("edit")} icon={<Edit3 className="h-3.5 w-3.5" />}>
          Editar conteúdo
        </TabButton>
        <TabButton active={tab === "records"} onClick={() => setTab("records")} icon={<ListChecks className="h-3.5 w-3.5" />} badge={data.acceptedCount}>
          Registros de aceite
        </TabButton>
        <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon={<SettingsIcon className="h-3.5 w-3.5" />}>
          Configurações
        </TabButton>
      </div>

      {showQrCode && isPub && publicUrl && (
        <div className="mb-5">
          <TermoQrCode
            url={publicUrl}
            termTitle={data.title}
            termSlug={data.slug}
          />
        </div>
      )}

      {tab === "edit" && (
        <div
          className={cn(
            "grid gap-5",
            view === "split" ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1",
          )}
        >
          <div className="lg:col-span-12 flex items-center gap-2 mb-2">
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

          {view === "split" && (
            <aside className="lg:col-span-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Título
                </label>
                <Input
                  value={title}
                  onChange={(e) => markDirty(setTitle)(e.target.value)}
                  disabled={isArchived}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Markdown do termo
                </label>
                <textarea
                  value={content}
                  onChange={(e) => markDirty(setContent)(e.target.value)}
                  disabled={isArchived}
                  rows={24}
                  className="w-full text-sm p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900"
                  placeholder="Conteúdo em markdown..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Suporta markdown: # título, **negrito**, *itálico*, listas com - ou 1., links [texto](url).
                </p>
              </div>
              {publicUrl && (
                <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <h3 className="font-semibold text-xs text-gray-900 dark:text-gray-100 mb-1.5">
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
                  <p className="text-xs text-gray-500 mt-1.5">
                    {isPub ? "Disponível agora." : "Disponível após publicar."}
                  </p>
                </div>
              )}
            </aside>
          )}

          <section className={cn(view === "split" ? "lg:col-span-6" : "col-span-1")}>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-900/40 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                  👁 Preview · como o cidadão vai ver
                </h3>
                {dirty && (
                  <span className="text-xs text-amber-700 dark:text-amber-400">
                    Não salvo
                  </span>
                )}
              </div>
              <article
                className="p-5 policy-article max-h-[750px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </section>
        </div>
      )}

      {tab === "records" && <TermoRecordsPanel termId={data.id} />}

      {tab === "settings" && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">
              Modo de coleta
            </h3>
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowsPhysical}
                  onChange={(e) => markDirty(setAllowsPhysical)(e.target.checked)}
                  disabled={isArchived}
                  className="mt-1 h-4 w-4 rounded"
                />
                <div className="text-sm">
                  <strong>Físico</strong> — DOCX/PDF pra impressão e assinatura presencial.
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowsDigital}
                  onChange={(e) => markDirty(setAllowsDigital)(e.target.checked)}
                  disabled={isArchived}
                  className="mt-1 h-4 w-4 rounded"
                />
                <div className="text-sm">
                  <strong>Digital</strong> — URL pública com formulário de aceite + evidência (IP/UA/checksum).
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                Processos vinculados
                {data.inventoryLinks.length > 0 && (
                  <span className="text-xs font-normal text-gray-500 ml-1.5">
                    ({data.inventoryLinks.length})
                  </span>
                )}
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowLinkPicker(true)}
                disabled={isArchived}
                className="text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar processo
              </Button>
            </div>
            {data.inventoryLinks.length === 0 ? (
              <p className="text-xs text-gray-500 italic">
                Nenhum processo vinculado. Clique em <strong>Adicionar processo</strong>{" "}
                pra associar a 1 ou mais entradas aprovadas do Inventário.
              </p>
            ) : (
              <ul className="space-y-1 text-sm divide-y divide-gray-100 dark:divide-gray-700">
                {data.inventoryLinks.map(({ inventory: inv }) => (
                  <li
                    key={inv.id}
                    className="flex items-center gap-2 py-1.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/dashboard/inventario/${inv.id}/editar`}
                          className="font-medium text-violet-700 dark:text-violet-300 hover:underline truncate"
                        >
                          {inv.serviceName}
                        </Link>
                        {inv.setor && (
                          <span className="text-xs text-gray-500">
                            · {inv.setor}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                          {inv.status}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(inv.id)}
                      disabled={isArchived || linkOpInProgress === inv.id}
                      className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Desvincular do termo (mantém os aceites já coletados)"
                    >
                      {linkOpInProgress === inv.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Desvincular
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!isArchived && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-red-900 dark:text-red-200 mb-1 flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Arquivar termo
              </h3>
              <p className="text-xs text-red-800 dark:text-red-300 mb-3">
                A URL pública para de aceitar novos consentimentos. Registros existentes ficam
                preservados pra auditoria. Pode desarquivar depois via banco.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={archive}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Arquivar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal de publish */}
      {showPublish && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Publicar termo?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {isPub
                ? `Vai congelar a versão ${data.currentVersion + 1} e atualizar a URL pública. Aceites coletados na versão anterior continuam válidos (com referência à versão exata).`
                : "Vai criar a versão 1 e disponibilizar a URL pública pro titular dar aceite."}
            </p>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              O que mudou? (opcional)
            </label>
            <textarea
              value={changeLog}
              onChange={(e) => setChangeLog(e.target.value)}
              rows={3}
              className="w-full text-sm p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
              placeholder="Ex: Ajustes na seção de Finalidade após mudança no fluxo do serviço."
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button size="sm" variant="ghost" onClick={() => { setShowPublish(false); setChangeLog(""); }} disabled={publishing}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={publish}
                disabled={publishing}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Publicar
              </Button>
            </div>
          </div>
        </div>
      )}

      <TermoLinkPickerModal
        open={showLinkPicker}
        onClose={() => setShowLinkPicker(false)}
        alreadyLinkedIds={data.inventoryLinks.map((l) => l.inventory.id)}
        onConfirm={handleAddLinks}
      />

      <style jsx global>{`
        .policy-article { line-height: 1.7; color: #1f2937; }
        .policy-article h1 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 1rem; }
        .policy-article h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.5rem; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
        .policy-article p { margin: 0.5rem 0; font-size: 0.95rem; }
        .policy-article ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; font-size: 0.95rem; }
        .policy-article li { margin: 0.2rem 0; }
        .policy-article strong { font-weight: 600; color: #111827; }
        .policy-article em { font-style: italic; color: #6b7280; }
        .policy-article blockquote { border-left: 3px solid #d1d5db; padding-left: 12px; color: #4b5563; margin: 1rem 0; }
        .policy-article hr { margin: 1.5rem 0; border: none; border-top: 1px solid #e5e7eb; }
      `}</style>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  badge,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
        active
          ? "border-violet-600 text-violet-700 dark:text-violet-300"
          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
      )}
    >
      {icon}
      {children}
      {badge != null && badge > 0 && (
        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300">
          {badge}
        </span>
      )}
    </button>
  );
}
