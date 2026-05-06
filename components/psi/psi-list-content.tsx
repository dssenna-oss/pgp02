"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  Archive,
  Bell,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { isDPO } from "@/lib/auth-helpers";
import {
  type PsiDTO,
  type PsiStats,
  psiStatusLabel,
  psiStatusBadgeClass,
} from "@/lib/psi-helpers";

interface ApiResponse {
  items: PsiDTO[];
  stats: PsiStats;
}

const STATUS_FILTERS = [
  { value: "ALL", label: "Todos" },
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "EM_REVISAO", label: "Em revisão" },
  { value: "APROVADO", label: "Aprovadas" },
  { value: "ARQUIVADO", label: "Arquivadas" },
] as const;

export default function PsiListContent() {
  const { data: session } = useSession();
  const userIsDPO = isDPO(session?.user?.role);
  const userId = (session?.user as any)?.id ?? "";

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showCreate, setShowCreate] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/psi", { cache: "no-store" });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao carregar PSIs");
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

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `Excluir "${title}"?\n\nVersões aprovadas também serão removidas. Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }
    const r = await fetch(`/api/psi/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao excluir");
      return;
    }
    toast.success("PSI excluída");
    refresh();
  };

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.createdBy?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [data?.items, statusFilter, search]);

  const canDelete = (p: PsiDTO): boolean => {
    if (userIsDPO) return true;
    return p.createdBy?.id === userId && p.status === "RASCUNHO";
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-100 dark:bg-cyan-950/40 p-2 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">PSI</h1>
            <p className="text-sm text-muted-foreground">
              Política de Segurança da Informação — LGPD Art. 50 + ISO 27001/27002
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova PSI
        </Button>
      </div>

      {/* Banner DPO — fila de revisão */}
      {userIsDPO && (data?.stats?.byStatus?.EM_REVISAO ?? 0) > 0 && (
        <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-md flex-shrink-0">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-blue-900 dark:text-blue-200">
                {data!.stats.byStatus.EM_REVISAO} PSI
                {data!.stats.byStatus.EM_REVISAO > 1 ? "s aguardam" : " aguarda"}{" "}
                sua revisão
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-0.5">
                Como DPO, você precisa avaliar e aprovar/rejeitar antes que cada
                PSI seja considerada oficial.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300"
              onClick={() => setStatusFilter("EM_REVISAO")}
            >
              Filtrar pendentes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            icon={<FileText className="h-5 w-5 text-amber-600" />}
            label="Rascunhos"
            value={data.stats.byStatus.RASCUNHO ?? 0}
          />
          <KpiCard
            icon={<Clock className="h-5 w-5 text-blue-600" />}
            label="Em revisão"
            value={data.stats.byStatus.EM_REVISAO ?? 0}
            highlight={userIsDPO && (data.stats.byStatus.EM_REVISAO ?? 0) > 0}
            highlightLabel="DPO: PSIs aguardando aprovação"
          />
          <KpiCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            label="Aprovadas"
            value={data.stats.byStatus.APROVADO ?? 0}
          />
          <KpiCard
            icon={<Archive className="h-5 w-5 text-gray-500" />}
            label="Arquivadas"
            value={data.stats.byStatus.ARQUIVADO ?? 0}
          />
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou autor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={statusFilter === s.value ? "default" : "outline"}
              onClick={() => setStatusFilter(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Carregando PSIs…
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground/50" />
            {(data?.items.length ?? 0) === 0 ? (
              <>
                <p className="text-lg font-medium">Nenhuma PSI ainda</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  A PSI é o documento institucional que descreve as medidas
                  técnicas e organizacionais de segurança — exigida pelo
                  Art. 50 §1º LGPD e referenciada por ISO/IEC 27001/27002.
                </p>
                <Button onClick={() => setShowCreate(true)} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira PSI
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma PSI corresponde aos filtros atuais.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <PsiCard
              key={p.id}
              psi={p}
              canDelete={canDelete(p)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal de criação */}
      <PsiCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          refresh();
          toast.success("PSI criada — editor virá na próxima entrega.");
        }}
      />
    </div>
  );
}

// ============================================================
// PsiCard — card individual na lista
// ============================================================

function PsiCard({
  psi,
  canDelete,
  onDelete,
}: {
  psi: PsiDTO;
  canDelete: boolean;
  onDelete: (id: string, title: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/dashboard/psi/${psi.id}`}
                className="font-semibold text-base hover:underline truncate"
              >
                {psi.title}
              </Link>
              <span
                className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${psiStatusBadgeClass(
                  psi.status
                )}`}
              >
                {psiStatusLabel(psi.status)}
              </span>
              {psi.publishedVersionNum && (
                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full border bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                  v{psi.publishedVersionNum}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {psi.createdBy?.name ?? "—"} · atualizada{" "}
              {new Date(psi.updatedAt).toLocaleString("pt-BR")}
            </p>
            {psi.rejectionNote && (
              <div className="mt-2 text-xs px-2 py-1 rounded bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900">
                <strong>Devolvida pelo DPO:</strong> {psi.rejectionNote}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Completa</div>
              <div className="text-lg font-bold tabular-nums">
                {Math.round(psi.completeness * 100)}%
              </div>
            </div>
            <Link href={`/dashboard/psi/${psi.id}`}>
              <Button variant="outline" size="sm">
                Abrir
              </Button>
            </Link>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(psi.id, psi.title)}
                title="Excluir PSI"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Modal de criação
// ============================================================

function PsiCreateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [useSeed, setUseSeed] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setUseSeed(true);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Informe um título");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/psi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          useSeed,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao criar PSI");
        return;
      }
      const j = await r.json();
      onCreated(j.psi.id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova PSI</DialogTitle>
          <DialogDescription>
            Política de Segurança da Informação — documento institucional
            estruturado em 7 seções (Governança, Ativos, Acesso, Criptografia,
            Físico, Incidentes, Continuidade).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="psi-title">Título *</Label>
            <Input
              id="psi-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Ex.: PSI v${new Date().getFullYear()} — ${
                "[Empresa]"
              }`}
              maxLength={200}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3 bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="psi-seed">Pré-popular com sugestões</Label>
              <p className="text-xs text-muted-foreground">
                Inclui texto institucional baseado em ISO 27001/27002. Você
                pode editar livremente depois.
              </p>
            </div>
            <Switch
              id="psi-seed"
              checked={useSeed}
              onCheckedChange={setUseSeed}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !title.trim()}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Criando…
              </>
            ) : (
              "Criar PSI"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// KpiCard
// ============================================================

function KpiCard({
  icon,
  label,
  value,
  highlight,
  highlightLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
  highlightLabel?: string;
}) {
  const ringClass = highlight ? "ring-2 ring-blue-400 dark:ring-blue-500/60" : "";
  return (
    <Card className={ringClass} title={highlight ? highlightLabel : undefined}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex-shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
