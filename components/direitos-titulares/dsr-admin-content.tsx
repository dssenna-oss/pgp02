/**
 * Painel DPO — Requisições de Direitos do Titular.
 *
 * Lista com:
 *  - Header com link público "→ formulário público"
 *  - 5 tabs por status, cada uma com contador
 *  - Busca por protocolo / nome / e-mail / CPF
 *  - Tabela com badge de urgência (countdown 15 dias)
 *  - Click → abre modal de detalhe + workflow
 */
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  ExternalLink,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Inbox,
  Hourglass,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  DSR_STATUS_LABELS,
  DSR_STATUS_COLORS,
  DSR_STATUSES,
  DSR_TITULAR_CATEGORY_LABELS,
  daysUntilDue,
  deadlineUrgency,
  type DsrStatus,
  type DsrTitularCategory,
} from "@/lib/data-subject-requests";
import { DsrAdminDetailModal } from "./dsr-admin-detail-modal";

type DsrListItem = {
  id: string;
  protocolNumber: string;
  titularName: string;
  titularEmail: string;
  titularCategory: string;
  requestedRights: string[];
  status: DsrStatus;
  dueDate: string;
  createdAt: string;
  responseDate: string | null;
  decision: string | null;
};

type ApiResponse = {
  items: DsrListItem[];
  total: number;
  page: number;
  pageSize: number;
  counts: Partial<Record<DsrStatus, number>>;
};

const TAB_ICONS: Record<DsrStatus, React.ReactNode> = {
  RECEBIDA: <Inbox className="h-4 w-4" />,
  EM_ANALISE: <Clock className="h-4 w-4" />,
  AGUARDANDO_TITULAR: <Hourglass className="h-4 w-4" />,
  RESPONDIDA: <CheckCircle2 className="h-4 w-4" />,
  INDEFERIDA: <XCircle className="h-4 w-4" />,
};

const URG_BG: Record<ReturnType<typeof deadlineUrgency>, string> = {
  overdue: "bg-red-100 text-red-800 ring-red-600/20",
  critical: "bg-orange-100 text-orange-800 ring-orange-600/20",
  warning: "bg-amber-100 text-amber-800 ring-amber-600/20",
  normal: "bg-blue-50 text-blue-700 ring-blue-600/20",
  concluded: "bg-slate-100 text-slate-600 ring-slate-400/30",
};

export function DsrAdminContent({ companyId }: { companyId: string }) {
  const [activeStatus, setActiveStatus] = useState<DsrStatus | "ALL">(
    "RECEBIDA",
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Debounce do search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStatus !== "ALL") params.set("status", activeStatus);
      if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
      params.set("pageSize", "50");

      const res = await fetch(
        `/api/direitos-titulares?${params.toString()}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        toast.error("Erro ao carregar requisições.");
        setData(null);
        return;
      }
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      toast.error("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }, [activeStatus, debouncedSearch]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Auto-refresh leve quando modal fecha (após edição)
  function handleModalChange(open: boolean) {
    if (!open) {
      setSelectedId(null);
      void fetchData();
    }
  }

  const totalPending = useMemo(() => {
    if (!data) return 0;
    return (
      (data.counts.RECEBIDA || 0) +
      (data.counts.EM_ANALISE || 0) +
      (data.counts.AGUARDANDO_TITULAR || 0)
    );
  }, [data]);

  const totalOverdue = useMemo(() => {
    if (!data) return 0;
    return data.items.filter(
      (i) => deadlineUrgency(i.dueDate, i.status) === "overdue",
    ).length;
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Requisições de Direitos do Titular
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Atendimento dos direitos do titular (arts. 18, 19 e 20 da LGPD).
            Prazo legal: 15 dias corridos do recebimento.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/direitos-titulares/${companyId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Formulário público
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Em atendimento"
          value={totalPending}
          tone="blue"
          subtitle="Recebida + em análise + aguardando"
        />
        <KpiCard
          label="Prazo vencido"
          value={totalOverdue}
          tone="red"
          subtitle="Requer ação imediata"
        />
        <KpiCard
          label="Concluídas (filtro atual)"
          value={
            (data?.counts.RESPONDIDA || 0) + (data?.counts.INDEFERIDA || 0)
          }
          tone="green"
          subtitle="Respondidas + indeferidas"
        />
      </div>

      {/* Busca */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por protocolo, nome, e-mail ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Tabs por status */}
      <Tabs
        value={activeStatus}
        onValueChange={(v) => setActiveStatus(v as DsrStatus | "ALL")}
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="ALL">
            Todas
            {data ? (
              <span className="ml-2 rounded-full bg-slate-100 px-2 text-xs">
                {data.total}
              </span>
            ) : null}
          </TabsTrigger>
          {DSR_STATUSES.map((st) => (
            <TabsTrigger key={st} value={st} className="gap-1.5">
              {TAB_ICONS[st]}
              <span className="hidden sm:inline">
                {DSR_STATUS_LABELS[st]}
              </span>
              {data?.counts[st] != null && (
                <span className="ml-1 rounded-full bg-slate-100 px-2 text-xs">
                  {data.counts[st]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeStatus} className="mt-4">
          {loading ? (
            <Card className="p-10 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
              <p className="mt-2 text-sm text-slate-600">Carregando…</p>
            </Card>
          ) : !data || data.items.length === 0 ? (
            <Card className="p-10 text-center">
              <Inbox className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">
                Nenhuma requisição encontrada
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {debouncedSearch
                  ? "Tente outro termo de busca."
                  : "Quando um titular preencher o formulário público, aparecerá aqui."}
              </p>
            </Card>
          ) : (
            <DsrTable
              items={data.items}
              onSelect={(id) => setSelectedId(id)}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de detalhe */}
      <DsrAdminDetailModal
        requestId={selectedId}
        open={!!selectedId}
        onOpenChange={handleModalChange}
      />
    </div>
  );
}

// ---------- KPI card ----------
function KpiCard({
  label,
  value,
  tone,
  subtitle,
}: {
  label: string;
  value: number;
  tone: "blue" | "red" | "green";
  subtitle: string;
}) {
  const toneClasses = {
    blue: "border-blue-200 bg-blue-50/40",
    red: "border-red-200 bg-red-50/40",
    green: "border-green-200 bg-green-50/40",
  }[tone];
  const valueColor = {
    blue: "text-blue-700",
    red: "text-red-700",
    green: "text-green-700",
  }[tone];

  return (
    <Card className={`p-4 ${toneClasses}`}>
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-bold ${valueColor}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </Card>
  );
}

// ---------- Tabela ----------
function DsrTable({
  items,
  onSelect,
}: {
  items: DsrListItem[];
  onSelect: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <Th>Protocolo</Th>
              <Th>Titular</Th>
              <Th>Categoria</Th>
              <Th>Direitos</Th>
              <Th>Status</Th>
              <Th>Prazo</Th>
              <Th>Recebida</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((it) => {
              const urg = deadlineUrgency(it.dueDate, it.status);
              const days = daysUntilDue(it.dueDate);
              const statusColors = DSR_STATUS_COLORS[it.status];
              return (
                <tr
                  key={it.id}
                  onClick={() => onSelect(it.id)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <Td className="font-mono text-xs">{it.protocolNumber}</Td>
                  <Td>
                    <div className="font-medium">{it.titularName}</div>
                    <div className="text-xs text-slate-500">
                      {it.titularEmail}
                    </div>
                  </Td>
                  <Td className="text-xs">
                    {DSR_TITULAR_CATEGORY_LABELS[
                      it.titularCategory as DsrTitularCategory
                    ] || it.titularCategory}
                  </Td>
                  <Td>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                      {it.requestedRights.length}
                    </span>
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColors.bg} ${statusColors.fg} ${statusColors.ring}`}
                    >
                      {DSR_STATUS_LABELS[it.status]}
                    </span>
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${URG_BG[urg]}`}
                    >
                      {urg === "overdue" && (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {urg === "concluded"
                        ? "Concluída"
                        : days >= 0
                          ? `${days}d`
                          : `-${Math.abs(days)}d`}
                    </span>
                  </Td>
                  <Td className="text-xs text-slate-600">
                    {new Date(it.createdAt).toLocaleDateString("pt-BR")}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
