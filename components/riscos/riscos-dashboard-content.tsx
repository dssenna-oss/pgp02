"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  ShieldAlert,
  Building2,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RISCOS_CATALOG, RISCOS_BY_CODE } from "@/lib/riscos-catalog";

interface Item {
  id: string;
  serviceName: string;
  setor: string | null;
  legalReviewedAt: string | null;
  approvedAt: string | null;
  createdBy: { name: string | null; email: string } | null;
  totalRisks: number;
  analyzed: boolean;
  byStatus: Record<string, number>;
  codes: string[];
}

interface ApiResponse {
  items: Item[];
  stats: {
    totalProcesses: number;
    analyzedCount: number;
    pendingCount: number;
    totalRisks: number;
    byCode: Record<string, number>;
  };
}

export default function RiscosDashboardContent({
  session: _session,
}: {
  session: any;
}) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/riscos");
        if (!r.ok) {
          const err = await r.json();
          toast.error(err.error ?? "Erro ao carregar riscos");
          return;
        }
        const j = (await r.json()) as ApiResponse;
        setData(j);
      } catch {
        toast.error("Erro de rede");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = (data?.items ?? []).filter((it) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      it.serviceName?.toLowerCase().includes(q) ||
      it.setor?.toLowerCase().includes(q) ||
      it.createdBy?.name?.toLowerCase().includes(q) ||
      it.createdBy?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start gap-3 flex-wrap">
          <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2.5 mt-1">
            <ShieldAlert className="h-7 w-7 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Análise de Riscos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Avaliação dos riscos LGPD identificados nos processos da
              organização. Os riscos por processo são analisados
              individualmente; os riscos macro da organização são
              consolidados no GAP Analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="por-processo" className="space-y-6">
        <TabsList className="grid grid-cols-2 max-w-lg">
          <TabsTrigger value="por-processo">
            <FileText className="h-4 w-4 mr-2" />
            Riscos por processo
          </TabsTrigger>
          <TabsTrigger value="organizacao">
            <Building2 className="h-4 w-4 mr-2" />
            Riscos da organização
          </TabsTrigger>
        </TabsList>

        {/* ========== Aba 1 — Por processo ========== */}
        <TabsContent value="por-processo" className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Carregando...
            </div>
          ) : !data ? null : data.stats.totalProcesses === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center space-y-3">
                <FileText className="h-10 w-10 text-gray-400 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Nenhum processo aprovado ainda
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  A Análise de Riscos só está disponível pra processos
                  aprovados pelo DPO. Aprove os mapeamentos pendentes pra
                  começar.
                </p>
                <Button asChild>
                  <Link href="/dashboard/inventario">
                    Ir pra listagem do inventário
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats agregadas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<FileText className="h-5 w-5" />}
                  label="Processos aprovados"
                  value={data.stats.totalProcesses}
                  color="blue"
                />
                <StatCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  label="Já analisados"
                  value={data.stats.analyzedCount}
                  color="emerald"
                />
                <StatCard
                  icon={<Clock className="h-5 w-5" />}
                  label="Pendentes"
                  value={data.stats.pendingCount}
                  color="amber"
                />
                <StatCard
                  icon={<AlertCircle className="h-5 w-5" />}
                  label="Riscos identificados"
                  value={data.stats.totalRisks}
                  color="red"
                />
              </div>

              {/* Top riscos da organização */}
              {Object.keys(data.stats.byCode).length > 0 && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Riscos mais comuns na organização
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(data.stats.byCode)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 8)
                        .map(([code, count]) => {
                          const def = RISCOS_BY_CODE[
                            code as keyof typeof RISCOS_BY_CODE
                          ];
                          if (!def) return null;
                          return (
                            <Badge
                              key={code}
                              variant="outline"
                              className="bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800"
                            >
                              {def.shortLabel}{" "}
                              <span className="ml-1 font-bold">{count}</span>
                            </Badge>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome do processo, setor ou criador..."
                  className="pl-9"
                />
              </div>

              {/* Lista de processos */}
              <div className="space-y-2">
                {filtered.map((it) => (
                  <ProcessRiskCard key={it.id} item={it} />
                ))}
                {filtered.length === 0 && (
                  <p className="text-center py-8 text-sm text-gray-500">
                    Nenhum processo encontrado.
                  </p>
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* ========== Aba 2 — Da organização (placeholder) ========== */}
        <TabsContent value="organizacao">
          <Card className="border-dashed">
            <CardContent className="p-8 text-center space-y-4">
              <div className="rounded-full bg-blue-100 dark:bg-blue-950/40 p-3 inline-block">
                <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Riscos da organização — em breve
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Aqui ficarão os riscos macro que não pertencem a uma área
                específica — como ausência de Encarregado (DPO), falta de
                programa de conscientização, política de incidentes
                inexistente, processos de gestão de terceiros, gestão do
                ciclo de vida da informação, etc.
              </p>
              <p className="text-xs text-gray-500 max-w-xl mx-auto">
                Vai ser construído no <strong>GAP Analysis (Checkpoint 9)</strong>{" "}
                e consolidado no Diagnóstico de Privacidade.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Stat card
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
  color: "blue" | "emerald" | "amber" | "red";
}) {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/30",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30",
    red: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/30",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", colorClasses[color])}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// ProcessRiskCard — linha por processo aprovado
// ============================================================

function ProcessRiskCard({ item }: { item: Item }) {
  const totalCodes = RISCOS_CATALOG.length;
  const pct = item.totalRisks > 0
    ? Math.round((item.totalRisks / totalCodes) * 100)
    : 0;

  return (
    <Link
      href={`/dashboard/inventario/${item.id}/analise-riscos`}
      className={cn(
        "block border rounded-lg p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/40",
        item.analyzed
          ? "border-l-4 border-l-emerald-500 border-gray-200 dark:border-gray-800"
          : "border-l-4 border-l-amber-400 border-gray-200 dark:border-gray-800"
      )}
    >
      <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {item.serviceName === "[Em preenchimento]"
                ? "Sem nome ainda"
                : item.serviceName}
            </h3>
            {item.analyzed ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100">
                Analisado
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100">
                Pendente
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
            {item.setor && (
              <span>
                <strong>Setor:</strong> {item.setor}
              </span>
            )}
            {item.createdBy && (
              <span>
                <strong>Criado por:</strong>{" "}
                {item.createdBy.name ?? item.createdBy.email}
              </span>
            )}
            {item.approvedAt && (
              <span>
                <strong>Aprovado em:</strong>{" "}
                {new Date(item.approvedAt).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {item.totalRisks > 0 ? (
            <div className="text-right">
              <div className="text-xl font-bold text-red-600 dark:text-red-400">
                {item.totalRisks}
              </div>
              <div className="text-xs text-gray-500">
                de 13 ({pct}%)
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Sem riscos marcados</span>
          )}
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </Link>
  );
}
