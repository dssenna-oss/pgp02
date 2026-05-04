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
  bySeverity: { ALTO: number; MEDIO: number; BAIXO: number; NONE: number };
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
    bySeverity: { ALTO: number; MEDIO: number; BAIXO: number; NONE: number };
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
  const [sevFilter, setSevFilter] = useState<"ALL" | "ALTO" | "MEDIO" | "BAIXO" | "NONE">("ALL");

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
    if (sevFilter !== "ALL" && (it.bySeverity?.[sevFilter] ?? 0) === 0) return false;
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

              {/* Severidade agregada (Checkpoint 6) */}
              {data.stats.totalRisks > 0 && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Severidade dos riscos identificados
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <SevPill label="Alto" value={data.stats.bySeverity.ALTO} tone="red" />
                      <SevPill label="Médio" value={data.stats.bySeverity.MEDIO} tone="amber" />
                      <SevPill label="Baixo" value={data.stats.bySeverity.BAIXO} tone="emerald" />
                      <SevPill label="Sem classificação" value={data.stats.bySeverity.NONE} tone="gray" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Riscos sem classificação ainda não tiveram a matriz Probabilidade × Impacto definida. Abra cada um pelo botão "Detalhar" e classifique.
                    </p>
                  </CardContent>
                </Card>
              )}

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

              {/* Busca + filtro por severidade */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome do processo, setor ou criador..."
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {(["ALL", "ALTO", "MEDIO", "BAIXO", "NONE"] as const).map((v) => {
                    const labelMap = { ALL: "Todos", ALTO: "Alto", MEDIO: "Médio", BAIXO: "Baixo", NONE: "S/ classif." };
                    const active = sevFilter === v;
                    return (
                      <Badge
                        key={v}
                        variant="outline"
                        onClick={() => setSevFilter(v)}
                        className={cn(
                          "cursor-pointer px-2.5 py-1 text-xs whitespace-nowrap",
                          active
                            ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800",
                        )}
                      >
                        {labelMap[v]}
                      </Badge>
                    );
                  })}
                </div>
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

        {/* ========== Aba 2 — Da organização (GAP Analysis) ========== */}
        <TabsContent value="organizacao">
          <Card>
            <CardContent className="p-6 sm:p-8 space-y-5">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-950/40 p-2.5">
                  <Building2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Riscos da organização (GAP Analysis)
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Os riscos macro que não pertencem a um processo específico
                    — ausência de DPO, política de incidentes, governança em
                    privacidade, etc. — são tratados no GAP Analysis: 119
                    controles em 28 domínios baseados no template oficial LGPD
                    PRO.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild>
                  <Link href="/dashboard/gap-analysis">
                    Abrir GAP Analysis
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
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
            <>
              <div className="flex flex-col items-end gap-0.5 text-[10px]">
                {item.bySeverity.ALTO > 0 && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800">
                    {item.bySeverity.ALTO} alto
                  </Badge>
                )}
                {item.bySeverity.MEDIO > 0 && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800">
                    {item.bySeverity.MEDIO} médio
                  </Badge>
                )}
                {item.bySeverity.BAIXO > 0 && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800">
                    {item.bySeverity.BAIXO} baixo
                  </Badge>
                )}
                {item.bySeverity.NONE > 0 && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400">
                    {item.bySeverity.NONE} s/ classif.
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                  {item.totalRisks}
                </div>
                <div className="text-xs text-gray-500">
                  de 13 ({pct}%)
                </div>
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-400">Sem riscos marcados</span>
          )}
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// SevPill — pílula colorida pra contagem por severidade
// ============================================================

function SevPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "red" | "amber" | "emerald" | "gray";
}) {
  const toneCls: Record<typeof tone, string> = {
    red: "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
    amber: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
    gray: "bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  };
  return (
    <div className={cn("border rounded-md p-2 text-center", toneCls[tone])}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[11px]">{label}</div>
    </div>
  );
}
