"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Scale,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  Archive,
  Bell,
  AlertTriangle,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { isDPO } from "@/lib/auth-helpers";
import {
  type LiaDTO,
  type LiaStats,
  liaStatusLabel,
  liaStatusBadgeClass,
} from "@/lib/lia-helpers";

interface ApiResponse {
  items: LiaDTO[];
  stats: LiaStats;
}

interface InventoryOption {
  id: string;
  serviceName: string;
  status: string;
}

const STATUS_FILTERS = [
  { value: "ALL", label: "Todos" },
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "EM_REVISAO", label: "Em revisão" },
  { value: "APROVADO", label: "Aprovadas" },
  { value: "ARQUIVADO", label: "Arquivadas" },
] as const;

export default function LiaListContent() {
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
      const r = await fetch("/api/lia", { cache: "no-store" });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao carregar LIAs");
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
    const r = await fetch(`/api/lia/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao excluir");
      return;
    }
    toast.success("LIA excluída");
    refresh();
  };

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((l) => {
      if (statusFilter !== "ALL" && l.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        (l.inventory?.serviceName ?? "").toLowerCase().includes(q) ||
        (l.createdBy?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [data?.items, statusFilter, search]);

  const canDelete = (l: LiaDTO): boolean => {
    if (userIsDPO) return true;
    return l.createdBy?.id === userId && l.status === "RASCUNHO";
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-violet-100 dark:bg-violet-950/40 p-2 rounded-lg">
            <Scale className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">LIA</h1>
            <p className="text-sm text-muted-foreground">
              Avaliação de Legítimo Interesse — Art. 10 §3º LGPD
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova LIA
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
                {data!.stats.byStatus.EM_REVISAO} LIA
                {data!.stats.byStatus.EM_REVISAO > 1 ? "s aguardam" : " aguarda"}{" "}
                sua revisão
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-0.5">
                Como DPO, você precisa avaliar e aprovar/rejeitar antes que cada
                LIA seja considerada oficial.
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

      {/* Banner Bloqueadas — alerta sobre LIAs com Art. 11/14 */}
      {(data?.stats?.blocked ?? 0) > 0 && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-md flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-900 dark:text-red-200">
                {data!.stats.blocked} LIA
                {data!.stats.blocked > 1 ? "s estão bloqueadas" : " está bloqueada"}
              </p>
              <p className="text-sm text-red-800 dark:text-red-300 mt-0.5">
                Tratam dados sensíveis ou de crianças/adolescentes — Art. 7º IX
                não se aplica. Mude a base legal pra consentimento (Art. 11/14)
                ou outra hipótese permitida.
              </p>
            </div>
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
            highlightLabel="DPO: LIAs aguardando aprovação"
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
            placeholder="Buscar por título, processo ou autor…"
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
          Carregando LIAs…
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground/50" />
            {(data?.items.length ?? 0) === 0 ? (
              <>
                <p className="text-lg font-medium">Nenhuma LIA ainda</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  A LIA é exigida pra qualquer tratamento que use o Art. 7º IX
                  da LGPD (legítimo interesse) como base legal. Cadastre uma
                  pra cada processo do Inventário que use essa base.
                </p>
                <Button onClick={() => setShowCreate(true)} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira LIA
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma LIA corresponde aos filtros atuais.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((l) => (
            <LiaCard
              key={l.id}
              lia={l}
              canDelete={canDelete(l)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal de criação */}
      <LiaCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(id) => {
          setShowCreate(false);
          // Editor virá na Fatia 2; por enquanto recarrega a lista pra mostrar.
          refresh();
          toast.success("LIA criada — editor virá na próxima entrega.");
        }}
      />
    </div>
  );
}

// ============================================================
// LiaCard — card individual na lista
// ============================================================

function LiaCard({
  lia,
  canDelete,
  onDelete,
}: {
  lia: LiaDTO;
  canDelete: boolean;
  onDelete: (id: string, title: string) => void;
}) {
  return (
    <Card
      className={
        lia.blocked
          ? "border-red-300 dark:border-red-900/50"
          : ""
      }
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/dashboard/lia/${lia.id}`}
                className="font-semibold text-base hover:underline truncate"
              >
                {lia.title}
              </Link>
              <span
                className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${liaStatusBadgeClass(
                  lia.status
                )}`}
              >
                {liaStatusLabel(lia.status)}
              </span>
              {lia.blocked && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
                  <AlertTriangle className="h-3 w-3" />
                  Bloqueada (Art. 11/14)
                </span>
              )}
              {lia.publishedVersionNum && (
                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full border bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                  v{lia.publishedVersionNum}
                </span>
              )}
            </div>
            {lia.inventory && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                <ExternalLink className="h-3 w-3 inline mr-1" />
                Processo:{" "}
                <Link
                  href={`/dashboard/inventario/${lia.inventory.id}`}
                  className="hover:underline"
                >
                  {lia.inventory.serviceName}
                </Link>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {lia.createdBy?.name ?? "—"} · atualizada{" "}
              {new Date(lia.updatedAt).toLocaleString("pt-BR")}
            </p>
            {lia.rejectionNote && (
              <div className="mt-2 text-xs px-2 py-1 rounded bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900">
                <strong>Devolvida pelo DPO:</strong> {lia.rejectionNote}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Indicador de completude (0-100%) */}
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Completa</div>
              <div className="text-lg font-bold tabular-nums">
                {Math.round(lia.completeness * 100)}%
              </div>
            </div>
            <Link href={`/dashboard/lia/${lia.id}`}>
              <Button variant="outline" size="sm">
                Abrir
              </Button>
            </Link>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(lia.id, lia.title)}
                title="Excluir LIA"
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

function LiaCreateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [inventoryId, setInventoryId] = useState<string>("none");
  const [inventories, setInventories] = useState<InventoryOption[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setInventoryId("none");
    setLoadingInv(true);
    // Carrega processos pra escolher como vinculação opcional.
    fetch("/api/inventario", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((j) => {
        const items = (j.items ?? j.inventories ?? []) as InventoryOption[];
        setInventories(
          items.filter(
            (i: any) => i.status === "APROVADO" || i.status === "EM_ANALISE"
          )
        );
      })
      .catch(() => setInventories([]))
      .finally(() => setLoadingInv(false));
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Informe um título");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/lia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          inventoryId: inventoryId === "none" ? null : inventoryId,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao criar LIA");
        return;
      }
      const j = await r.json();
      onCreated(j.lia.id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova LIA</DialogTitle>
          <DialogDescription>
            Avaliação de Legítimo Interesse exigida pra usar o Art. 7º IX LGPD
            como base legal de um tratamento. Você pode vincular a um processo
            do Inventário (recomendado).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="lia-title">Título *</Label>
            <Input
              id="lia-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Marketing direto via newsletter aos clientes"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lia-inventory">Processo do Inventário (opcional)</Label>
            <Select value={inventoryId} onValueChange={setInventoryId}>
              <SelectTrigger id="lia-inventory">
                <SelectValue placeholder="Sem vínculo / LIA avulsa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem vínculo / LIA avulsa</SelectItem>
                {loadingInv ? (
                  <SelectItem value="loading" disabled>
                    Carregando processos…
                  </SelectItem>
                ) : (
                  inventories.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.serviceName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Vincular permite que a LIA seja referenciada no RIPD do mesmo
              processo (Fatia 3).
            </p>
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
              "Criar LIA"
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
