"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Archive,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  type PolicyDTO,
  policyTypeLabel,
  policyTypeShortLabel,
  policyStatusLabel,
  policyStatusBadgeClass,
  policyTypeBadgeClass,
} from "@/lib/policies-helpers";

interface TemplateEntry {
  type: string;
  defaultTitle: string;
  blurb: string;
}

interface ApiResponse {
  items: PolicyDTO[];
  stats: {
    total: number;
    byStatus: { RASCUNHO: number; PUBLICADA: number; ARQUIVADA: number };
    outdated: number;
  };
  templates: TemplateEntry[];
  companySlug: string | null;
}

export default function PoliticasContent() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/politicas", { cache: "no-store" });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao carregar");
        return;
      }
      setData(await r.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreateFromTemplate = async (type: string) => {
    setCreating(type);
    try {
      const r = await fetch("/api/politicas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao criar");
        return;
      }
      const j = await r.json();
      toast.success("Política criada — abrindo editor...");
      setShowCreate(false);
      // Navega pro editor da política recém-criada
      window.location.assign(`/dashboard/politicas/${j.policy.id}`);
    } finally {
      setCreating(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Excluir "${title}"? Versões publicadas também serão removidas. Não pode ser desfeito.`)) {
      return;
    }
    const r = await fetch(`/api/politicas/${id}`, { method: "DELETE" });
    if (!r.ok) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Política excluída");
    refresh();
  };

  const filtered = data?.items.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      policyTypeLabel(p.type).toLowerCase().includes(q) ||
      p.slug.includes(q)
    );
  }) ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-2.5 mt-1">
          <FileText className="h-7 w-7 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Políticas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Documentos jurídicos da organização: aviso de privacidade,
            termos de uso, política de cookies e outras. Gerados a partir
            de templates oficiais e publicados em URLs públicas para os
            titulares.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nova política
        </Button>
      </div>

      {/* KPIs */}
      {data && data.stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            icon={<FileText className="h-4 w-4" />}
            label="Total"
            value={data.stats.total}
            tone="gray"
          />
          <KpiCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Publicadas"
            value={data.stats.byStatus.PUBLICADA}
            tone="emerald"
          />
          <KpiCard
            icon={<Clock className="h-4 w-4" />}
            label="Em rascunho"
            value={data.stats.byStatus.RASCUNHO}
            tone="amber"
          />
          <KpiCard
            icon={<AlertCircle className="h-4 w-4" />}
            label="Com mudanças não publicadas"
            value={data.stats.outdated}
            tone={data.stats.outdated > 0 ? "red" : "gray"}
            hint="Rascunho diferente da versão publicada"
          />
        </div>
      )}

      {/* Empty state — primeira vez */}
      {!loading && data && data.items.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <FileText className="h-10 w-10 text-gray-400 mx-auto" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Nenhuma política cadastrada ainda
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Comece criando uma política a partir de um template oficial.
              Recomendamos: <strong>Aviso de Privacidade (externo)</strong>,{" "}
              <strong>Termos de Uso</strong> e <strong>Política de Cookies</strong>.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Criar primeira política
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      {data && data.items.length > 0 && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, tipo ou slug..."
              className="pl-9"
            />
          </div>

          <div className="space-y-2">
            {filtered.map((p) => (
              <PolicyCard
                key={p.id}
                policy={p}
                onDelete={() => handleDelete(p.id, p.title)}
              />
            ))}
            {filtered.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-sm text-gray-500">
                  Nenhuma política encontrada com esse termo de busca.
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Modal: criar de template */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Escolha um template</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Cada template já vem preenchido com os dados da sua organização
            (nome, CNPJ, endereço, contato do DPO). Você edita depois.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data?.templates.map((t) => (
              <button
                key={t.type}
                onClick={() => handleCreateFromTemplate(t.type)}
                disabled={creating !== null}
                className={cn(
                  "text-left border rounded-lg p-3 transition-all",
                  "border-gray-200 dark:border-gray-800 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700",
                  creating === t.type && "opacity-50",
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", policyTypeBadgeClass(t.type))}
                  >
                    {policyTypeShortLabel(t.type)}
                  </Badge>
                  {creating === t.type && (
                    <span className="text-[10px] text-gray-500">Criando...</span>
                  )}
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {t.defaultTitle}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">
                  {t.blurb}
                </p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "gray" | "emerald" | "amber" | "red";
  hint?: string;
}) {
  const toneCls: Record<typeof tone, string> = {
    gray: "border-gray-300 bg-gray-50 text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300",
    amber: "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300",
    red: "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300",
  };
  return (
    <div className={cn("border rounded-md p-3", toneCls[tone])}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-medium">
        {icon}
        {label}
      </div>
      <div className="text-3xl font-bold tabular-nums mt-1">{value}</div>
      {hint && <div className="text-[10px] opacity-75">{hint}</div>}
    </div>
  );
}

function PolicyCard({
  policy,
  onDelete,
}: {
  policy: PolicyDTO;
  onDelete: () => void;
}) {
  const isOutdated =
    policy.status === "PUBLICADA" &&
    policy.publishedContent != null &&
    policy.currentContent !== policy.publishedContent;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {policy.title}
              </h3>
              <Badge
                variant="outline"
                className={cn("text-[10px]", policyTypeBadgeClass(policy.type))}
              >
                {policyTypeShortLabel(policy.type)}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-[10px]", policyStatusBadgeClass(policy.status))}
              >
                {policyStatusLabel(policy.status)}
              </Badge>
              {isOutdated && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
                >
                  Mudanças não publicadas
                </Badge>
              )}
              {policy.versionCount > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  v{policy.currentVersion}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11px] text-gray-600 dark:text-gray-400">
              <span>
                <strong>slug:</strong> /{policy.slug}
              </span>
              {policy.publishedAt && (
                <span>
                  <strong>publicada:</strong>{" "}
                  {new Date(policy.publishedAt).toLocaleDateString("pt-BR")}
                </span>
              )}
              <span>
                <strong>atualizada:</strong>{" "}
                {new Date(policy.updatedAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex gap-1">
            {policy.publicUrl && (
              <Button
                size="sm"
                variant="ghost"
                asChild
                title="Ver versão pública"
              >
                <a href={policy.publicUrl} target="_blank" rel="noopener">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
            <Button size="sm" variant="ghost" asChild title="Editar">
              <Link href={`/dashboard/politicas/${policy.id}`}>
                <Edit className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              title="Excluir"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
