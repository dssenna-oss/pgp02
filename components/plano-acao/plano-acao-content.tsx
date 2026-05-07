"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useHashSyncedState } from "@/lib/hash-sync-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  Plus,
  Search,
  Sparkles,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  AlertTriangle,
  Calendar,
  User as UserIcon,
  ExternalLink,
  Edit,
  Trash2,
  CalendarDays,
  Download,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  type ActionPlanDTO,
  type ActionStatus,
  ACTION_STATUS,
  originLabel,
  originBadgeClass,
  priorityLabel,
  priorityBadgeClass,
  statusLabel,
  statusBadgeClass,
} from "@/lib/action-plan-helpers";
import ActionFormModal from "./action-form-modal";

interface ApiResponse {
  items: ActionPlanDTO[];
  stats: {
    total: number;
    byStatus: Record<ActionStatus, number>;
    byPriority: Record<string, number>;
    byOrigin: Record<string, number>;
    overdue: number;
    dueSoon: number;
  };
}

interface Props {
  session: any;
  isDPO: boolean;
}

export default function PlanoAcaoContent({ session, isDPO }: Props) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  // Tab sincronizada com hash da URL (#abertas / #concluidas / #cronograma).
  // Permite que sub-itens da sidebar levem direto à aba certa, e que o
  // user compartilhe links que abrem na mesma aba.
  const [tab, setTab] = useHashSyncedState(
    ["abertas", "concluidas", "cronograma"] as const,
    "abertas",
  );
  const [editingAction, setEditingAction] = useState<ActionPlanDTO | "new" | null>(
    null,
  );
  const [importing, setImporting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/plano-acao", { cache: "no-store" });
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

  const filtered = useMemo(() => {
    if (!data) return [];
    let items = data.items;
    // Tab filter
    if (tab === "abertas") {
      items = items.filter(
        (i) => i.status === "A_FAZER" || i.status === "EM_ANDAMENTO",
      );
    } else if (tab === "concluidas") {
      items = items.filter(
        (i) => i.status === "CONCLUIDA" || i.status === "CANCELADA",
      );
    }
    // Filtros
    if (originFilter !== "ALL") items = items.filter((i) => i.origin === originFilter);
    if (priorityFilter !== "ALL") items = items.filter((i) => i.priority === priorityFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.assignee?.name?.toLowerCase().includes(q) ||
          i.assignee?.email?.toLowerCase().includes(q),
      );
    }
    return items;
  }, [data, tab, originFilter, priorityFilter, search]);

  const handleImport = async () => {
    if (!confirm("Importar ações pendentes do GAP, Riscos e Bases Legais?\n\nNão duplica — só cria ações pra itens que ainda não estão no Plano.")) {
      return;
    }
    setImporting(true);
    try {
      const r = await fetch("/api/plano-acao/import", { method: "POST" });
      if (!r.ok) {
        toast.error("Erro ao importar");
        return;
      }
      const j = await r.json();
      if (j.created === 0) {
        toast.success("Nenhuma ação nova — tudo já estava no Plano.");
      } else {
        toast.success(
          `${j.created} ação(ões) importada(s): ${j.byOrigin.GAP} do GAP, ${j.byOrigin.RISCO} de Riscos, ${j.byOrigin.BASES} de Bases Legais.`,
        );
      }
      refresh();
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta ação? Essa operação não pode ser desfeita.")) return;
    const r = await fetch(`/api/plano-acao/${id}`, { method: "DELETE" });
    if (!r.ok) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Ação excluída");
    refresh();
  };

  const handleQuickStatus = async (id: string, status: ActionStatus) => {
    const r = await fetch(`/api/plano-acao/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!r.ok) {
      toast.error("Erro ao mudar status");
      return;
    }
    refresh();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2.5 mt-1">
          <Target className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Plano de Ação
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Lista oficial das ações da organização pra adequação à LGPD.
            Diferente das tarefas pessoais — aqui o foco é institucional,
            com responsável formal, prazo e prioridade.
          </p>
          {!isDPO && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
              Você está vendo apenas as ações onde é responsável. DPOs
              veem o Plano completo.
            </p>
          )}
        </div>
        {isDPO && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              asChild
              title="Baixar XLSX consolidado do Plano de Ação"
            >
              <a href="/api/plano-acao/export" download>
                <Download className="h-4 w-4 mr-1.5" />
                Exportar Excel
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={handleImport}
              disabled={importing}
              title="Cria ações automaticamente para gaps, riscos e bases legais pendentes"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1.5" />
              )}
              Importar pendentes
            </Button>
            <Button onClick={() => setEditingAction("new")}>
              <Plus className="h-4 w-4 mr-1.5" />
              Nova ação
            </Button>
          </div>
        )}
      </div>

      {/* KPIs */}
      {data && data.stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            icon={<Circle className="h-4 w-4" />}
            label="A fazer"
            value={data.stats.byStatus.A_FAZER}
            tone="gray"
          />
          <KpiCard
            icon={<Clock className="h-4 w-4" />}
            label="Em andamento"
            value={data.stats.byStatus.EM_ANDAMENTO}
            tone="blue"
          />
          <KpiCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Atrasadas"
            value={data.stats.overdue}
            tone="red"
            hint="Prazo vencido"
          />
          <KpiCard
            icon={<CalendarDays className="h-4 w-4" />}
            label="Vencendo"
            value={data.stats.dueSoon}
            tone="amber"
            hint="Próximos 7 dias"
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="space-y-4">
        <TabsList className="grid grid-cols-3 max-w-xl">
          <TabsTrigger value="abertas">
            Em aberto
            <Badge variant="outline" className="ml-2 text-[10px]">
              {(data?.stats.byStatus.A_FAZER ?? 0) + (data?.stats.byStatus.EM_ANDAMENTO ?? 0)}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="concluidas">
            Concluídas
            <Badge variant="outline" className="ml-2 text-[10px]">
              {(data?.stats.byStatus.CONCLUIDA ?? 0) + (data?.stats.byStatus.CANCELADA ?? 0)}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cronograma">
            <CalendarDays className="h-4 w-4 mr-1.5" />
            Cronograma
          </TabsTrigger>
        </TabsList>

        {/* Filtros (visíveis nas 3 tabs) */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ação, descrição ou responsável..."
              className="pl-9"
            />
          </div>
          <Select value={originFilter} onValueChange={setOriginFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as origens</SelectItem>
              <SelectItem value="MANUAL">Manual</SelectItem>
              <SelectItem value="GAP">GAP Analysis</SelectItem>
              <SelectItem value="RISCO">Riscos</SelectItem>
              <SelectItem value="BASES">Bases Legais</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toda prioridade</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
              <SelectItem value="MEDIA">Média</SelectItem>
              <SelectItem value="BAIXA">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conteúdo das tabs */}
        <TabsContent value="abertas">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Carregando...</div>
          ) : (
            <ActionList
              items={filtered}
              isDPO={isDPO}
              onEdit={setEditingAction}
              onDelete={handleDelete}
              onQuickStatus={handleQuickStatus}
              emptyText={
                data?.stats.total === 0
                  ? "Nenhuma ação cadastrada ainda."
                  : "Nenhuma ação em aberto com esses filtros."
              }
            />
          )}
        </TabsContent>
        <TabsContent value="concluidas">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Carregando...</div>
          ) : (
            <ActionList
              items={filtered}
              isDPO={isDPO}
              onEdit={setEditingAction}
              onDelete={handleDelete}
              onQuickStatus={handleQuickStatus}
              emptyText="Nenhuma ação concluída ainda."
            />
          )}
        </TabsContent>
        <TabsContent value="cronograma">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Carregando...</div>
          ) : (
            <CronogramaView items={filtered.filter((i) => i.dueDate)} />
          )}
        </TabsContent>
      </Tabs>

      {/* Form modal */}
      {editingAction && (
        <ActionFormModal
          action={editingAction === "new" ? null : editingAction}
          onClose={() => setEditingAction(null)}
          onSaved={() => {
            setEditingAction(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// KpiCard
// ============================================================

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
  tone: "gray" | "blue" | "red" | "amber" | "emerald";
  hint?: string;
}) {
  const toneCls: Record<typeof tone, string> = {
    gray: "border-gray-300 bg-gray-50 text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300",
    blue: "border-blue-300 bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300",
    red: "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300",
    amber: "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300",
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

// ============================================================
// ActionList — renderiza lista de cards
// ============================================================

function ActionList({
  items,
  isDPO,
  onEdit,
  onDelete,
  onQuickStatus,
  emptyText,
}: {
  items: ActionPlanDTO[];
  isDPO: boolean;
  onEdit: (a: ActionPlanDTO) => void;
  onDelete: (id: string) => void;
  onQuickStatus: (id: string, status: ActionStatus) => void;
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-sm text-gray-500">
          {emptyText}
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((a) => (
        <ActionCard
          key={a.id}
          action={a}
          isDPO={isDPO}
          onEdit={() => onEdit(a)}
          onDelete={() => onDelete(a.id)}
          onQuickStatus={(s) => onQuickStatus(a.id, s)}
        />
      ))}
    </div>
  );
}

function ActionCard({
  action,
  isDPO,
  onEdit,
  onDelete,
  onQuickStatus,
}: {
  action: ActionPlanDTO;
  isDPO: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onQuickStatus: (s: ActionStatus) => void;
}) {
  const isOverdue =
    action.dueDate &&
    action.status !== "CONCLUIDA" &&
    action.status !== "CANCELADA" &&
    (action.daysUntilDue ?? 0) < 0;

  return (
    <Card
      className={cn(
        "transition-colors",
        isOverdue && "border-red-300 dark:border-red-800",
      )}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start gap-3 flex-wrap">
          <button
            onClick={() =>
              onQuickStatus(
                action.status === "CONCLUIDA"
                  ? ACTION_STATUS.A_FAZER
                  : ACTION_STATUS.CONCLUIDA,
              )
            }
            className="mt-0.5 text-gray-400 hover:text-emerald-600 transition-colors"
            title={
              action.status === "CONCLUIDA" ? "Reabrir" : "Marcar como concluída"
            }
          >
            {action.status === "CONCLUIDA" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3
                className={cn(
                  "font-semibold text-gray-900 dark:text-white",
                  action.status === "CONCLUIDA" && "line-through text-gray-500",
                  action.status === "CANCELADA" && "line-through text-gray-400",
                )}
              >
                {action.title}
              </h3>
              <Badge
                variant="outline"
                className={cn("text-[10px]", priorityBadgeClass(action.priority))}
              >
                {priorityLabel(action.priority)}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-[10px]", originBadgeClass(action.origin))}
              >
                {originLabel(action.origin)}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-[10px]", statusBadgeClass(action.status))}
              >
                {statusLabel(action.status)}
              </Badge>
            </div>
            {action.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-line line-clamp-3">
                {action.description}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-600 dark:text-gray-400">
              {action.assignee && (
                <span className="inline-flex items-center gap-1">
                  <UserIcon className="h-3 w-3" />
                  {action.assignee.name ?? action.assignee.email}
                </span>
              )}
              {action.dueDate && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    isOverdue && "text-red-600 dark:text-red-400 font-medium",
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {new Date(action.dueDate).toLocaleDateString("pt-BR")}
                  {action.daysUntilDue != null && (
                    <span className="opacity-75">
                      {action.daysUntilDue < 0
                        ? `(${Math.abs(action.daysUntilDue)} dia(s) atrasada)`
                        : action.daysUntilDue === 0
                          ? "(hoje)"
                          : `(em ${action.daysUntilDue} dia(s))`}
                    </span>
                  )}
                </span>
              )}
              {action.refLabel && action.refHref && (
                <Link
                  href={action.refHref}
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {action.refLabel}
                </Link>
              )}
            </div>
          </div>
          <div className="shrink-0 flex gap-1">
            {(isDPO || action.assignee?.id) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onEdit}
                title={isDPO ? "Editar" : "Atualizar status / notas"}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            )}
            {isDPO && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                title="Excluir"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// CronogramaView — agrupa por mês de vencimento
// ============================================================

function CronogramaView({ items }: { items: ActionPlanDTO[] }) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-sm text-gray-500">
          Nenhuma ação com prazo definido. Edite uma ação e marque uma data
          de prazo pra aparecer no cronograma.
        </CardContent>
      </Card>
    );
  }
  // Agrupa por "YYYY-MM"
  const groups = new Map<string, ActionPlanDTO[]>();
  for (const a of items) {
    const d = new Date(a.dueDate!);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }
  const sortedKeys = [...groups.keys()].sort();
  return (
    <div className="space-y-4">
      {sortedKeys.map((key) => {
        const [y, m] = key.split("-");
        const monthName = new Date(Number(y), Number(m) - 1).toLocaleDateString(
          "pt-BR",
          { month: "long", year: "numeric" },
        );
        const groupItems = groups.get(key)!.sort((a, b) =>
          (a.dueDate ?? "").localeCompare(b.dueDate ?? ""),
        );
        return (
          <div key={key}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-2 capitalize">
              {monthName}
              <Badge variant="outline" className="ml-2 text-[10px] font-normal">
                {groupItems.length}
              </Badge>
            </h3>
            <div className="space-y-1.5">
              {groupItems.map((a) => {
                const day = new Date(a.dueDate!).getDate();
                const isOverdue =
                  a.status !== "CONCLUIDA" &&
                  a.status !== "CANCELADA" &&
                  (a.daysUntilDue ?? 0) < 0;
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "flex items-start gap-3 p-2.5 rounded border bg-white dark:bg-gray-900 dark:border-gray-800",
                      isOverdue && "border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10",
                    )}
                  >
                    <div className="shrink-0 w-10 text-center">
                      <div className="text-xs uppercase text-gray-500">dia</div>
                      <div className="text-lg font-bold">{day}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            (a.status === "CONCLUIDA" || a.status === "CANCELADA") && "line-through text-gray-500",
                          )}
                        >
                          {a.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", priorityBadgeClass(a.priority))}
                        >
                          {priorityLabel(a.priority)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", originBadgeClass(a.origin))}
                        >
                          {originLabel(a.origin)}
                        </Badge>
                      </div>
                      {a.assignee && (
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Responsável: {a.assignee.name ?? a.assignee.email}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
