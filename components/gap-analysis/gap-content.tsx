"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  History,
  ListChecks,
  BarChart3,
  Download,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  GAP_ADERENCIA,
  type GapAnswerDTO,
  type GapStats,
  gapAderenciaLabel,
} from "@/lib/gap-helpers";
import type { GapSuggestion } from "@/lib/gap-suggest";
import GapWelcome from "./gap-welcome";
import GapDomainAccordion from "./gap-domain-accordion";
import GapSnapshotsModal from "./gap-snapshots-modal";
import GapDashboard from "./gap-dashboard";

interface GapContentProps {
  session: any;
}

interface ApiState {
  answers: GapAnswerDTO[];
  stats: GapStats;
  suggestions: Record<string, GapSuggestion> | null;
}

const ADERENCIA_ORDER = [
  GAP_ADERENCIA.ADERENTE,
  GAP_ADERENCIA.PARCIAL,
  GAP_ADERENCIA.NAO_ADERENTE,
  GAP_ADERENCIA.NA,
] as const;

export default function GapContent({ session: _session }: GapContentProps) {
  const [data, setData] = useState<ApiState | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [aderFilter, setAderFilter] = useState<string | null>(null);
  const [onlyWithPM, setOnlyWithPM] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [skipWelcome, setSkipWelcome] = useState(false);

  const refresh = async () => {
    try {
      const r = await fetch("/api/gap", { cache: "no-store" });
      if (!r.ok) {
        const err = await r.json();
        toast.error(err.error ?? "Erro ao carregar GAP");
        return;
      }
      const j = (await r.json()) as ApiState;
      setData(j);
    } catch {
      toast.error("Erro de rede");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // Map de respostas pra lookup rápido por code
  const answersByCode = useMemo(() => {
    const m = new Map<string, GapAnswerDTO>();
    data?.answers.forEach((a) => m.set(a.controlCode, a));
    return m;
  }, [data]);

  // ---------- Loading / Welcome ----------

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-gray-500">
        Carregando GAP Analysis...
      </div>
    );
  }
  if (!data) return null;

  const isFirstRun = data.stats.answered === 0;
  if (isFirstRun && !skipWelcome) {
    return (
      <div className="max-w-6xl mx-auto">
        <GapWelcome
          stats={data.stats}
          suggestionsCount={
            data.suggestions ? Object.keys(data.suggestions).length : 0
          }
          onStart={() => setSkipWelcome(true)}
        />
      </div>
    );
  }

  // ---------- Tela principal ----------

  const pctAnswered = Math.round((data.stats.answered / data.stats.total) * 100);

  const handleSnapshotCreated = () => {
    toast.success("Snapshot salvo!");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2.5 mt-1">
          <ClipboardList className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            GAP Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Diagnóstico macro de adequação à LGPD — 119 controles em 28 domínios
            (template oficial). Você ({"DPO"}) preenche cenário atual,
            mapeamento, aderência e ponto de melhoria.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            asChild
            title="Baixar XLSX baseado no template oficial LGPD PRO"
          >
            <a href="/api/gap/export" download>
              <Download className="h-4 w-4 mr-1.5" />
              Exportar Excel
            </a>
          </Button>
          <Button variant="outline" onClick={() => setShowSnapshots(true)}>
            <History className="h-4 w-4 mr-1.5" />
            Histórico
          </Button>
        </div>
      </div>

      {/* KPIs principais (decisão 6c) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Controles totais"
          value={`${data.stats.answered} / ${data.stats.total}`}
          extra={`${pctAnswered}% respondidos`}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Confirmados pelo DPO"
          value={data.stats.confirmed}
          color="emerald"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Em andamento"
          value={data.stats.byMapeamento.EM_ANDAMENTO}
          color="amber"
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5" />}
          label="Não aderentes"
          value={data.stats.byAderencia.NAO_ADERENTE}
          color="red"
        />
      </div>

      {/* Aviso de auto-sugestões disponíveis */}
      {data.suggestions && Object.keys(data.suggestions).length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-200">
                {Object.keys(data.suggestions).length} sugestão(ões) automática(s)
                disponíveis com base no Inventário aprovado.
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                Os campos foram pré-preenchidos onde possível e aparecem com
                etiqueta laranja "✨ Sugestão". Salve manualmente pra confirmar
                como sua resposta.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Responder controles | Visão geral */}
      <Tabs defaultValue="responder" className="space-y-5">
        <TabsList className="grid grid-cols-2 max-w-md">
          <TabsTrigger value="responder">
            <ListChecks className="h-4 w-4 mr-2" />
            Responder controles
          </TabsTrigger>
          <TabsTrigger value="visao-geral">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão geral
          </TabsTrigger>
        </TabsList>

        {/* ====== Tab 1 — Responder controles ====== */}
        <TabsContent value="responder" className="space-y-5">
          {/* Filtros (decisão 3a) */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar pergunta ou domínio..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <Badge
                variant="outline"
                onClick={() => setAderFilter(null)}
                className={cn(
                  "cursor-pointer px-2.5 py-1 text-xs",
                  aderFilter === null
                    ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800",
                )}
              >
                Todos
              </Badge>
              {ADERENCIA_ORDER.map((v) => {
                const active = aderFilter === v;
                const count = data.stats.byAderencia[v] ?? 0;
                return (
                  <Badge
                    key={v}
                    variant="outline"
                    onClick={() => setAderFilter(active ? null : v)}
                    className={cn(
                      "cursor-pointer px-2.5 py-1 text-xs",
                      active
                        ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800",
                    )}
                  >
                    {gapAderenciaLabel(v)}{" "}
                    <span className="ml-1 font-bold opacity-80">{count}</span>
                  </Badge>
                );
              })}
            </div>
            <Badge
              variant="outline"
              onClick={() => setOnlyWithPM((v) => !v)}
              className={cn(
                "cursor-pointer px-2.5 py-1 text-xs whitespace-nowrap",
                onlyWithPM
                  ? "bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/40 dark:text-amber-200"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800",
              )}
            >
              Só com Ponto de Melhoria
            </Badge>
          </div>

          {/* Accordion por domínio */}
          <GapDomainAccordion
            stats={data.stats}
            answersByCode={answersByCode}
            suggestions={data.suggestions ?? {}}
            search={search}
            aderFilter={aderFilter}
            onlyWithPM={onlyWithPM}
            onAnswerSaved={() => refresh()}
          />
        </TabsContent>

        {/* ====== Tab 2 — Visão geral ====== */}
        <TabsContent value="visao-geral">
          <GapDashboard stats={data.stats} />
        </TabsContent>
      </Tabs>

      {/* Snapshots modal */}
      {showSnapshots && (
        <GapSnapshotsModal
          onClose={() => setShowSnapshots(false)}
          onCreated={handleSnapshotCreated}
        />
      )}
    </div>
  );
}

// ============================================================
// Stat card (igual ao padrão do riscos-dashboard)
// ============================================================

function StatCard({
  icon,
  label,
  value,
  extra,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  extra?: string;
  color: "blue" | "emerald" | "amber" | "red";
}) {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/30",
    emerald:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30",
    amber:
      "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30",
    red: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/30",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", colorClasses[color])}>{icon}</div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-gray-900 dark:text-white truncate">
              {value}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
            {extra && (
              <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5">
                {extra}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
