"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ListChecks,
  Plus,
  Tag,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  Sparkles,
  Filter,
  ClipboardList,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { notifySidebarRefresh } from "@/lib/sidebar-events";
import {
  parseMarkers,
  TASK_PRIORITY_LABEL,
  TASK_STATUS,
  type TaskDTO,
  type MarkerDTO,
  type TaskStatus,
  type TaskCounters,
  type TaskPriority,
} from "@/lib/tarefas-types";
import TaskCard from "./task-card";
import TaskFormDialog from "./task-form-dialog";
import MarkersManager from "./markers-manager";

interface ProcessOption {
  id: string;
  serviceName: string;
}

export default function TarefasContent({ session: _session }: { session: any }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialProcessId = searchParams?.get("processId") ?? null;

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [markers, setMarkers] = useState<MarkerDTO[]>([]);
  const [counters, setCounters] = useState<TaskCounters | null>(null);
  const [processes, setProcesses] = useState<ProcessOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [markerFilter, setMarkerFilter] = useState<string>("all");
  const [processFilter, setProcessFilter] = useState<string>(
    initialProcessId ?? "all"
  );

  // Modais
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [markersOpen, setMarkersOpen] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [tRes, mRes, cRes, pRes] = await Promise.all([
        fetch("/api/tarefas", { cache: "no-store" }),
        fetch("/api/marcadores", { cache: "no-store" }),
        fetch("/api/tarefas/contadores", { cache: "no-store" }),
        fetch("/api/inventario", { cache: "no-store" }),
      ]);
      if (tRes.ok) {
        const j = await tRes.json();
        setTasks(j.tasks ?? []);
      }
      if (mRes.ok) {
        const j = await mRes.json();
        setMarkers(j.markers ?? []);
      }
      if (cRes.ok) {
        const j = await cRes.json();
        setCounters(j);
      }
      if (pRes.ok) {
        const list = await pRes.json();
        // Só processos APROVADOS são vinculáveis
        setProcesses(
          (list as any[])
            .filter((p) => p.status === "APROVADO")
            .map((p) => ({ id: p.id, serviceName: p.serviceName }))
        );
      }
    } catch {
      toast.error("Erro de rede ao carregar tarefas");
    } finally {
      setLoading(false);
    }
    // Avisa a sidebar pra atualizar o badge na hora (sem esperar polling)
    notifySidebarRefresh();
  };

  useEffect(() => {
    void refresh();
  }, []);

  // Filtros aplicados em memória
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const hit =
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (priorityFilter !== "all" && t.priority !== priorityFilter) {
        return false;
      }
      if (markerFilter !== "all") {
        const tags = parseMarkers(t.markers);
        if (!tags.includes(markerFilter)) return false;
      }
      if (processFilter !== "all" && t.dataInventoryId !== processFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, search, priorityFilter, markerFilter, processFilter]);

  const byStatus = useMemo(() => {
    const groups: Record<TaskStatus, TaskDTO[]> = {
      A_FAZER: [],
      EM_ANDAMENTO: [],
      CONCLUIDA: [],
    };
    for (const t of filtered) {
      groups[t.status]?.push(t);
    }
    return groups;
  }, [filtered]);

  // Mutações
  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      const r = await fetch(`/api/tarefas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        toast.error(j.error ?? "Erro ao atualizar");
        return;
      }
      await refresh();
    } catch {
      toast.error("Erro de rede");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const r = await fetch(`/api/tarefas/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        toast.error(j.error ?? "Erro ao excluir");
        return;
      }
      toast.success("Tarefa excluída");
      await refresh();
    } catch {
      toast.error("Erro de rede");
    }
  };

  const openCreate = () => {
    setEditingTask(null);
    setFormOpen(true);
  };
  const openEdit = (t: TaskDTO) => {
    setEditingTask(t);
    setFormOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2.5 mt-1 flex-shrink-0">
            <ListChecks className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Minhas Tarefas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
              Caderno pessoal de planejamento. Só você vê e edita as suas
              tarefas.
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setMarkersOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            <Tag className="h-4 w-4 mr-1.5" />
            Marcadores ({markers.length})
          </Button>
          <Button onClick={openCreate} className="flex-1 sm:flex-initial">
            <Plus className="h-4 w-4 mr-1.5" />
            Nova tarefa
          </Button>
        </div>
      </div>

      {/* Banner: filtro por processo ativo */}
      {processFilter !== "all" && (
        <div className="rounded-md border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/20 p-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 flex-shrink-0" />
            <span>
              Mostrando apenas tarefas vinculadas ao processo:{" "}
              <strong>
                {processes.find((p) => p.id === processFilter)?.serviceName ??
                  "(processo)"}
              </strong>
            </span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setProcessFilter("all");
              router.replace("/dashboard/tarefas");
            }}
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Limpar filtro
          </Button>
        </div>
      )}

      {/* Stats */}
      {counters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Sparkles className="h-4 w-4" />}
            label="A fazer"
            value={counters.aFazer}
            color="blue"
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Em andamento"
            value={counters.emAndamento}
            color="amber"
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Concluídas"
            value={counters.concluidas}
            color="emerald"
          />
          <StatCard
            icon={<AlertCircle className="h-4 w-4" />}
            label={
              counters.atrasadas > 0
                ? "Atrasadas"
                : counters.vencendoHoje > 0
                ? "Vencem hoje"
                : "Sem atrasos"
            }
            value={
              counters.atrasadas > 0
                ? counters.atrasadas
                : counters.vencendoHoje
            }
            color={
              counters.atrasadas > 0
                ? "red"
                : counters.vencendoHoje > 0
                ? "amber"
                : "slate"
            }
          />
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar tarefa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas prioridades</SelectItem>
                <SelectItem value="ALTA">{TASK_PRIORITY_LABEL.ALTA}</SelectItem>
                <SelectItem value="MEDIA">{TASK_PRIORITY_LABEL.MEDIA}</SelectItem>
                <SelectItem value="BAIXA">{TASK_PRIORITY_LABEL.BAIXA}</SelectItem>
              </SelectContent>
            </Select>
            {markers.length > 0 && (
              <Select value={markerFilter} onValueChange={setMarkerFilter}>
                <SelectTrigger className="w-[150px]">
                  <Tag className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue placeholder="Marcador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos marcadores</SelectItem>
                  {markers.map((m) => (
                    <SelectItem key={m.id} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs por status */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : tasks.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <Tabs defaultValue="A_FAZER">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="A_FAZER">
              A fazer
              <Badge variant="secondary" className="ml-1.5">
                {byStatus.A_FAZER.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="EM_ANDAMENTO">
              <span className="hidden sm:inline">Em andamento</span>
              <span className="sm:hidden">Andamento</span>
              <Badge variant="secondary" className="ml-1.5">
                {byStatus.EM_ANDAMENTO.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="CONCLUIDA">
              Concluídas
              <Badge variant="secondary" className="ml-1.5">
                {byStatus.CONCLUIDA.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {(["A_FAZER", "EM_ANDAMENTO", "CONCLUIDA"] as TaskStatus[]).map(
            (st) => (
              <TabsContent key={st} value={st} className="space-y-2 mt-4">
                {byStatus[st].length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-8">
                    {st === TASK_STATUS.A_FAZER
                      ? "Nada a fazer no momento"
                      : st === TASK_STATUS.EM_ANDAMENTO
                      ? "Nenhuma tarefa em andamento"
                      : "Nenhuma tarefa concluída"}
                  </p>
                ) : (
                  byStatus[st].map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      markers={markers}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onChangeStatus={handleStatusChange}
                    />
                  ))
                )}
              </TabsContent>
            )
          )}
        </Tabs>
      )}

      {/* Modais */}
      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        markers={markers}
        processes={processes}
        onSaved={refresh}
      />
      <MarkersManager
        open={markersOpen}
        onOpenChange={setMarkersOpen}
        markers={markers}
        onChanged={refresh}
      />
    </div>
  );
}

// ============================================================
// StatCard
// ============================================================

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "amber" | "emerald" | "red" | "slate";
}) {
  const cls = {
    blue:
      "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/30",
    amber:
      "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30",
    emerald:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30",
    red: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/30",
    slate:
      "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800",
  };
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={cn("p-2 rounded-md", cls[color])}>{icon}</div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {value}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// EmptyState
// ============================================================

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-8 text-center space-y-3">
        <ListChecks className="h-10 w-10 text-gray-400 mx-auto" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Nenhuma tarefa ainda
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Use as tarefas pra anotar o que você precisa fazer relacionado à
          adequação à LGPD: revisões, reuniões, treinamentos, lembretes.
        </p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-1.5" />
          Criar primeira tarefa
        </Button>
      </CardContent>
    </Card>
  );
}
