"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileCheck2,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  Archive,
  Bell,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { isDPO } from "@/lib/auth-helpers";
import {
  type RipdDTO,
  type RipdStats,
  ripdStatusLabel,
} from "@/lib/ripd-helpers";
import RipdCard from "./ripd-card";
import RipdCreateModal from "./ripd-create-modal";

interface ApiResponse {
  items: RipdDTO[];
  stats: RipdStats;
}

const STATUS_FILTERS = [
  { value: "ALL",        label: "Todos" },
  { value: "RASCUNHO",   label: "Rascunho" },
  { value: "EM_REVISAO", label: "Em revisão" },
  { value: "APROVADO",   label: "Aprovados" },
  { value: "ARQUIVADO",  label: "Arquivados" },
] as const;

export default function RipdListContent() {
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
      const r = await fetch("/api/ripd", { cache: "no-store" });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao carregar RIPDs");
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
    const r = await fetch(`/api/ripd/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao excluir");
      return;
    }
    toast.success("RIPD excluído");
    refresh();
  };

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        (r.inventory?.serviceName ?? "").toLowerCase().includes(q) ||
        (r.createdBy?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [data?.items, statusFilter, search]);

  const canDeleteRipd = (r: RipdDTO): boolean => {
    if (userIsDPO) return true;
    return r.createdBy?.id === userId && r.status === "RASCUNHO";
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-950/40 p-2 rounded-lg">
            <FileCheck2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">RIPD</h1>
            <p className="text-sm text-muted-foreground">
              Relatórios de Impacto à Proteção de Dados
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo RIPD
        </Button>
      </div>

      {/* Banner de fila DPO destacado — só aparece quando DPO + tem RIPDs em revisão */}
      {userIsDPO && (data?.stats?.byStatus?.EM_REVISAO ?? 0) > 0 && (
        <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-md flex-shrink-0">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-blue-900 dark:text-blue-200">
                {data!.stats.byStatus.EM_REVISAO} RIPD
                {data!.stats.byStatus.EM_REVISAO > 1
                  ? "s aguardam"
                  : " aguarda"}{" "}
                sua revisão
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-0.5">
                Como DPO, você precisa avaliar e aprovar/rejeitar antes que
                cada RIPD seja considerado oficial.
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
            tone="amber"
          />
          <KpiCard
            icon={<Clock className="h-5 w-5 text-blue-600" />}
            label="Em revisão"
            value={data.stats.byStatus.EM_REVISAO ?? 0}
            tone="blue"
            highlight={userIsDPO && (data.stats.byStatus.EM_REVISAO ?? 0) > 0}
            highlightLabel="DPO: você tem RIPDs aguardando sua aprovação"
          />
          <KpiCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            label="Aprovados"
            value={data.stats.byStatus.APROVADO ?? 0}
            tone="emerald"
          />
          <KpiCard
            icon={<Archive className="h-5 w-5 text-gray-500" />}
            label="Arquivados"
            value={data.stats.byStatus.ARQUIVADO ?? 0}
            tone="gray"
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
          Carregando RIPDs…
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <FileCheck2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            {(data?.items.length ?? 0) === 0 ? (
              <>
                <p className="text-lg font-medium">Nenhum RIPD ainda</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Crie o primeiro RIPD a partir de um processo aprovado do
                  Inventário. Os dados, riscos e controles serão
                  pré-preenchidos automaticamente.
                </p>
                <Button onClick={() => setShowCreate(true)} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro RIPD
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum RIPD corresponde aos filtros atuais.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <RipdCard
              key={r.id}
              ripd={r}
              canDelete={canDeleteRipd(r)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal de criação */}
      <RipdCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(id) => {
          setShowCreate(false);
          window.location.assign(`/dashboard/ripd/${id}`);
        }}
      />
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
  highlight,
  highlightLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "amber" | "blue" | "emerald" | "gray";
  highlight?: boolean;
  highlightLabel?: string;
}) {
  const ringClass = highlight
    ? "ring-2 ring-blue-400 dark:ring-blue-500/60"
    : "";
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
