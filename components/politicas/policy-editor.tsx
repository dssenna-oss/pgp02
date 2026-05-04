"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  Code,
  Send,
  History,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Download,
  FileText,
  GitCompareArrows,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  type PolicyDTO,
  policyTypeLabel,
  policyStatusLabel,
  policyStatusBadgeClass,
} from "@/lib/policies-helpers";

interface VersionEntry {
  id: string;
  version: number;
  changeLog: string | null;
  publishedAt: string;
  publishedBy: { id: string; name: string | null; email: string } | null;
}

interface DiffResp {
  a: { ref: string; label: string; length: number };
  b: { ref: string; label: string; length: number };
  sameContent: boolean;
  stats: { addedLines: number; removedLines: number };
  parts: { value: string; added: boolean; removed: boolean }[];
}

interface ApiResponse {
  policy: PolicyDTO;
  versions: VersionEntry[];
}

interface Props {
  policyId: string;
}

type ViewMode = "edit" | "preview" | "split";

export default function PolicyEditor({ policyId }: Props) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [showPublish, setShowPublish] = useState(false);
  const [changeLog, setChangeLog] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [diffData, setDiffData] = useState<DiffResp | null>(null);
  const [diffA, setDiffA] = useState<string>("published");
  const [diffB, setDiffB] = useState<string>("current");
  const [loadingDiff, setLoadingDiff] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/politicas/${policyId}`, { cache: "no-store" });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao carregar");
        return;
      }
      const j = (await r.json()) as ApiResponse;
      setData(j);
      setTitle(j.policy.title);
      setSlug(j.policy.slug);
      setContent(j.policy.currentContent);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [policyId]);

  // Detecta mudanças não salvas
  const isDirty =
    data &&
    (title !== data.policy.title ||
      slug !== data.policy.slug ||
      content !== data.policy.currentContent);

  // Detecta divergência rascunho vs publicado (mostra alerta no header)
  const hasUnpublishedChanges =
    data &&
    data.policy.status === "PUBLICADA" &&
    data.policy.publishedContent != null &&
    content !== data.policy.publishedContent;

  const previewHtml = useMemo(() => {
    return marked.parse(content) as string;
  }, [content]);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const body: any = {};
      if (title !== data.policy.title) body.title = title;
      if (slug !== data.policy.slug) body.slug = slug;
      if (content !== data.policy.currentContent) body.currentContent = content;
      if (Object.keys(body).length === 0) {
        toast("Nada pra salvar", { icon: "ℹ️" });
        return;
      }
      const r = await fetch(`/api/politicas/${policyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao salvar");
        return;
      }
      toast.success("Rascunho salvo");
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const loadDiff = async (a: string, b: string) => {
    setLoadingDiff(true);
    try {
      const r = await fetch(
        `/api/politicas/${policyId}/diff?a=${a}&b=${b}`,
        { cache: "no-store" },
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao comparar");
        setDiffData(null);
        return;
      }
      setDiffData(await r.json());
    } finally {
      setLoadingDiff(false);
    }
  };

  // Quando abre o modal Comparar, carrega diff default (published vs current)
  useEffect(() => {
    if (showCompare && data) {
      loadDiff(diffA, diffB);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCompare]);

  // Reload quando troca a/b dentro do modal
  useEffect(() => {
    if (showCompare && data) {
      loadDiff(diffA, diffB);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diffA, diffB]);

  const handlePublish = async () => {
    if (!data) return;
    if (isDirty) {
      // Salva primeiro
      await handleSave();
    }
    setPublishing(true);
    try {
      const r = await fetch(`/api/politicas/${policyId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeLog: changeLog.trim() || null }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao publicar");
        return;
      }
      const j = await r.json();
      toast.success(`Versão ${j.publishedVersion} publicada`);
      setShowPublish(false);
      setChangeLog("");
      refresh();
    } finally {
      setPublishing(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-gray-500">
        Carregando política...
      </div>
    );
  }

  const { policy } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <Button asChild variant="outline" size="sm" className="mt-1">
          <Link href="/dashboard/politicas">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {policyTypeLabel(policy.type)}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {policy.title}
          </h1>
          <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
            <Badge
              variant="outline"
              className={cn("text-[10px]", policyStatusBadgeClass(policy.status))}
            >
              {policyStatusLabel(policy.status)}
            </Badge>
            {policy.versionCount > 0 && (
              <Badge variant="outline" className="text-[10px]">
                v{policy.currentVersion} · {policy.versionCount} versão(ões)
              </Badge>
            )}
            {hasUnpublishedChanges && (
              <Badge
                variant="outline"
                className="text-[10px] bg-amber-50 text-amber-700 border-amber-300"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Rascunho difere da versão publicada
              </Badge>
            )}
            {policy.publicUrl && (
              <a
                href={policy.publicUrl}
                target="_blank"
                rel="noopener"
                className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                {policy.publicUrl}
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            asChild
            title="Baixar como Word (.docx) — usa rascunho atual"
          >
            <a
              href={`/api/politicas/${policyId}/export?source=current`}
              download
            >
              <Download className="h-4 w-4 mr-1.5" />
              DOCX
            </a>
          </Button>
          <Button
            variant="outline"
            asChild
            title="Abrir versão de impressão (Salvar como PDF)"
          >
            <a
              href={`/dashboard/politicas/${policyId}/pdf?source=current&autoprint=1`}
              target="_blank"
              rel="noopener"
            >
              <FileText className="h-4 w-4 mr-1.5" />
              PDF
            </a>
          </Button>
          {policy.versionCount > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowCompare(true)}
              title="Comparar rascunho com versão publicada (ou versões entre si)"
            >
              <GitCompareArrows className="h-4 w-4 mr-1.5" />
              Comparar
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4 mr-1.5" />
            Histórico ({policy.versionCount})
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving || !isDirty}
            title={!isDirty ? "Nada mudou desde o último save" : undefined}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Salvar rascunho
          </Button>
          <Button onClick={() => setShowPublish(true)}>
            <Send className="h-4 w-4 mr-1.5" />
            Publicar
          </Button>
        </div>
      </div>

      {/* Metadados (título + slug) */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Título
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Slug (URL pública)
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              maxLength={80}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Toolbar de view */}
      <div className="flex justify-between items-center">
        <div className="flex gap-1.5">
          <ViewToggle current={viewMode} value="edit" onSelect={setViewMode} icon={<Code className="h-3.5 w-3.5" />}>
            Editar
          </ViewToggle>
          <ViewToggle current={viewMode} value="split" onSelect={setViewMode} icon={<Code className="h-3.5 w-3.5" />}>
            Dividir
          </ViewToggle>
          <ViewToggle current={viewMode} value="preview" onSelect={setViewMode} icon={<Eye className="h-3.5 w-3.5" />}>
            Preview
          </ViewToggle>
        </div>
        <div className="text-xs text-gray-500">
          {content.length.toLocaleString("pt-BR")} caracteres ·{" "}
          {content.split(/\s+/).filter(Boolean).length.toLocaleString("pt-BR")} palavras
        </div>
      </div>

      {/* Editor + preview */}
      <div
        className={cn(
          "grid gap-3",
          viewMode === "split" && "grid-cols-1 lg:grid-cols-2",
          viewMode === "edit" && "grid-cols-1",
          viewMode === "preview" && "grid-cols-1",
        )}
      >
        {(viewMode === "edit" || viewMode === "split") && (
          <Card>
            <CardContent className="p-0">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="font-mono text-sm min-h-[600px] border-0 rounded-md resize-y"
                placeholder="Digite o conteúdo em markdown..."
              />
            </CardContent>
          </Card>
        )}
        {(viewMode === "preview" || viewMode === "split") && (
          <Card>
            <CardContent className="p-6 min-h-[600px] overflow-y-auto bg-white text-gray-900">
              <div
                className="policy-article"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de publicar */}
      <Dialog open={showPublish} onOpenChange={setShowPublish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publicar nova versão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {policy.versionCount === 0
                ? "Esta será a versão 1 da política. A partir daqui ela fica acessível na URL pública."
                : `Esta será a versão ${policy.currentVersion + 1}. A versão ${policy.currentVersion} ficará no histórico.`}
            </p>
            {isDirty && (
              <div className="rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Você tem mudanças não salvas. Salvaremos o rascunho automaticamente antes de publicar.
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                O que mudou nesta versão? (opcional)
              </label>
              <Textarea
                value={changeLog}
                onChange={(e) => setChangeLog(e.target.value)}
                rows={3}
                placeholder="Ex: Atualização do contato do DPO + ajuste no prazo de retenção fiscal."
                maxLength={500}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowPublish(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePublish} disabled={publishing}>
                {publishing ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1.5" />
                )}
                Confirmar publicação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de histórico */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de versões</DialogTitle>
          </DialogHeader>
          {data.versions.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-6 text-center">
              Esta política ainda não foi publicada.
            </p>
          ) : (
            <ul className="space-y-2 mt-2">
              {data.versions.map((v) => (
                <li
                  key={v.id}
                  className="border rounded-md p-3 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        v{v.version}
                      </Badge>
                      {v.version === policy.currentVersion && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Atual
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(v.publishedAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  {v.changeLog && (
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1.5">
                      {v.changeLog}
                    </p>
                  )}
                  {v.publishedBy && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      Publicada por{" "}
                      {v.publishedBy.name ?? v.publishedBy.email}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: comparar versões */}
      <Dialog open={showCompare} onOpenChange={setShowCompare}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comparar versões</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {/* Seletores */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Versão A (antes)
                </label>
                <select
                  value={diffA}
                  onChange={(e) => setDiffA(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="published">Publicada (v{policy.currentVersion})</option>
                  <option value="current">Rascunho atual</option>
                  {data.versions.map((v) => (
                    <option key={v.id} value={String(v.version)}>
                      v{v.version} ({new Date(v.publishedAt).toLocaleDateString("pt-BR")})
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-center text-gray-500 pb-2 hidden sm:block">→</div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Versão B (depois)
                </label>
                <select
                  value={diffB}
                  onChange={(e) => setDiffB(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="current">Rascunho atual</option>
                  <option value="published">Publicada (v{policy.currentVersion})</option>
                  {data.versions.map((v) => (
                    <option key={v.id} value={String(v.version)}>
                      v{v.version} ({new Date(v.publishedAt).toLocaleDateString("pt-BR")})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resultado */}
            {loadingDiff ? (
              <div className="text-center py-12 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />
                Comparando...
              </div>
            ) : diffData ? (
              <>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400 border-t pt-3 dark:border-gray-800">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-800/50 border border-emerald-400"></span>
                    +{diffData.stats.addedLines} linha(s) adicionada(s)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-200 dark:bg-red-900/40 border border-red-400"></span>
                    -{diffData.stats.removedLines} linha(s) removida(s)
                  </span>
                  {diffData.sameContent && (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      ✓ Conteúdos idênticos
                    </span>
                  )}
                </div>
                <div className="border rounded p-4 bg-gray-50 dark:bg-gray-900/50 dark:border-gray-800 max-h-[50vh] overflow-y-auto">
                  {diffData.sameContent ? (
                    <p className="text-sm text-gray-500 italic text-center py-4">
                      Nenhuma diferença entre as duas versões.
                    </p>
                  ) : (
                    <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
                      {diffData.parts.map((p, i) => (
                        <span
                          key={i}
                          className={cn(
                            p.added &&
                              "bg-emerald-200 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200",
                            p.removed &&
                              "bg-red-200 dark:bg-red-900/40 text-red-900 dark:text-red-200 line-through",
                          )}
                        >
                          {p.value}
                        </span>
                      ))}
                    </pre>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-6">
                Escolha duas versões pra comparar.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Estilos do preview (mesma classe da view pública) */}
      <style jsx global>{`
        .policy-article { line-height: 1.7; color: #1f2937; }
        .policy-article h1 { font-size: 1.875rem; font-weight: 700; margin: 2rem 0 1rem; color: #111827; }
        .policy-article h2 { font-size: 1.5rem; font-weight: 600; margin: 2rem 0 0.75rem; color: #111827; }
        .policy-article h3 { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: #111827; }
        .policy-article h4 { font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem; }
        .policy-article p { margin: 0.75rem 0; }
        .policy-article ul { list-style: disc; padding-left: 1.5rem; margin: 0.75rem 0; }
        .policy-article ol { list-style: decimal; padding-left: 1.5rem; margin: 0.75rem 0; }
        .policy-article li { margin: 0.25rem 0; }
        .policy-article a { color: #2563eb; text-decoration: underline; }
        .policy-article strong { font-weight: 600; }
        .policy-article em { font-style: italic; }
        .policy-article code { background: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: ui-monospace, monospace; font-size: 0.875em; }
        .policy-article hr { margin: 2rem 0; border: 0; border-top: 1px solid #e5e7eb; }
        .policy-article blockquote { border-left: 4px solid #d1d5db; padding-left: 1rem; margin: 1rem 0; color: #4b5563; font-style: italic; }
        .policy-article table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.875rem; }
        .policy-article th, .policy-article td { border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; text-align: left; }
        .policy-article th { background: #f9fafb; font-weight: 600; }
      `}</style>
    </div>
  );
}

function ViewToggle({
  current,
  value,
  onSelect,
  icon,
  children,
}: {
  current: ViewMode;
  value: ViewMode;
  onSelect: (v: ViewMode) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <Button
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={() => onSelect(value)}
    >
      {icon}
      <span className="ml-1.5">{children}</span>
    </Button>
  );
}
