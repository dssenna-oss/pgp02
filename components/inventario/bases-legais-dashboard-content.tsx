"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Scale,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowRight,
  ClipboardList,
  ScrollText,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: string;
  serviceName: string;
  status: string;
  setor: string | null;
  legalBasis: string;
  legalBasisSensitive: string | null;
  previsaoLegal: string | null;
  legalBasisComments: string | null;
  legalReviewedAt: string | null;
  legalReviewedBy?: { name: string | null; email: string } | null;
  reviewedAt: string | null;
  createdBy: { name: string | null; email: string } | null;
  formAnswers?: any;
}

type Completeness = "complete" | "partial" | "missing";

interface ProcessRow extends InventoryItem {
  /** completeness derivada — qual é o estado das bases legais. */
  completeness: Completeness;
  /** se tem dados sensíveis no inventário (puxa do formAnswers). */
  hasSensitiveData: boolean;
}

const PLACEHOLDER = "[Em preenchimento]";

function classifyCompleteness(item: InventoryItem): Completeness {
  const hasComum = !!item.legalBasis && item.legalBasis !== PLACEHOLDER;
  const hasSensitive = !!item.legalBasisSensitive;
  const hasPrevisao = !!item.previsaoLegal;
  const sensitiveDataPresent = detectSensitiveData(item);
  const filled = [hasComum, hasSensitive, hasPrevisao].filter(Boolean).length;
  if (filled === 0) return "missing";
  // Tem dado sensível mas faltou base sensível → não pode ser "completo"
  if (sensitiveDataPresent && !hasSensitive) return "partial";
  // Comum + (sensível se houver dado sensível) → completo
  if (hasComum && (sensitiveDataPresent ? hasSensitive : true)) return "complete";
  return "partial";
}

function detectSensitiveData(item: InventoryItem): boolean {
  // Se tem formAnswers, lê resposta da pergunta data_sensitive_yn
  const ans = (item as any).formAnswers;
  const v = ans?.sections?.sec3?.data_sensitive_yn;
  if (typeof v === "string" && v.toLowerCase().startsWith("sim")) return true;
  // Fallback: se a categoria de dados menciona "sensí*"
  return /sens[íi]ve/i.test((item as any).dataCategory ?? "");
}

export default function BasesLegaisDashboardContent({
  session: _session,
}: {
  session: any;
}) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "missing" | "partial" | "complete">(
    "all"
  );

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/inventario", { cache: "no-store" });
        if (!r.ok) {
          toast.error("Erro ao carregar processos");
          return;
        }
        const list = await r.json();
        setItems(
          (list as any[]).filter((p) => p.status === "APROVADO")
        );
      } catch {
        toast.error("Erro de rede");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rows: ProcessRow[] = useMemo(() => {
    return items.map((it) => ({
      ...it,
      completeness: classifyCompleteness(it),
      hasSensitiveData: detectSensitiveData(it),
    }));
  }, [items]);

  const stats = useMemo(() => {
    const total = rows.length;
    const complete = rows.filter((r) => r.completeness === "complete").length;
    const partial = rows.filter((r) => r.completeness === "partial").length;
    const missing = rows.filter((r) => r.completeness === "missing").length;
    return { total, complete, partial, missing };
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (tab !== "all" && r.completeness !== tab) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.serviceName.toLowerCase().includes(q) ||
      (r.setor ?? "").toLowerCase().includes(q) ||
      (r.legalBasis ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2.5 mt-1 flex-shrink-0">
          <Scale className="h-7 w-7 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bases Legais
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            Visão consolidada das bases legais (Art. 7º + Art. 11 + Previsão
            Legal) dos processos aprovados. Use pra acompanhar o que ainda
            está pendente de preenchimento jurídico.
          </p>
        </div>
      </div>

      {/* Stats */}
      {!loading && stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<ClipboardList className="h-4 w-4" />}
            label="Processos aprovados"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Completos"
            value={stats.complete}
            color="emerald"
          />
          <StatCard
            icon={<AlertCircle className="h-4 w-4" />}
            label="Parciais"
            value={stats.partial}
            color="amber"
          />
          <StatCard
            icon={<ShieldAlert className="h-4 w-4" />}
            label="Sem base legal"
            value={stats.missing}
            color="red"
          />
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome do processo, setor ou base legal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs por completeness */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="all">
            Todos
            <Badge variant="secondary" className="ml-1.5">
              {stats.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="missing">
            <span className="hidden sm:inline">Sem base</span>
            <span className="sm:hidden">Sem</span>
            <Badge variant="secondary" className="ml-1.5">
              {stats.missing}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="partial">
            Parciais
            <Badge variant="secondary" className="ml-1.5">
              {stats.partial}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="complete">
            Completos
            <Badge variant="secondary" className="ml-1.5">
              {stats.complete}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-2 mt-4">
          {loading ? (
            <p className="text-center py-8 text-sm text-gray-500">
              Carregando...
            </p>
          ) : stats.total === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center space-y-3">
                <ClipboardList className="h-10 w-10 text-gray-400 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Nenhum processo aprovado ainda
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  As Bases Legais só ficam disponíveis pra processos
                  aprovados pelo DPO.
                </p>
                <Button asChild>
                  <Link href="/dashboard/inventario">
                    Ir pra listagem do inventário
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-500 italic">
              Nenhum processo nessa categoria.
            </p>
          ) : (
            filtered.map((r) => <ProcessLegalRow key={r.id} row={r} />)
          )}
        </TabsContent>
      </Tabs>
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
  color: "blue" | "emerald" | "amber" | "red";
}) {
  const cls = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/30",
    emerald:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30",
    amber:
      "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30",
    red: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/30",
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
// ProcessLegalRow
// ============================================================

function ProcessLegalRow({ row }: { row: ProcessRow }) {
  const borderCls =
    row.completeness === "complete"
      ? "border-l-emerald-500"
      : row.completeness === "partial"
      ? "border-l-amber-400"
      : "border-l-red-500";

  const hasComum = !!row.legalBasis && row.legalBasis !== PLACEHOLDER;
  const hasSensitive = !!row.legalBasisSensitive;
  const hasPrevisao = !!row.previsaoLegal;
  const sensitivePending = row.hasSensitiveData && !hasSensitive;

  return (
    <Link
      href={`/dashboard/inventario/${row.id}/bases-legais`}
      className={cn(
        "block border rounded-lg p-4 transition-colors",
        "hover:bg-gray-50 dark:hover:bg-gray-900/40",
        "border-l-4",
        borderCls,
        "border-gray-200 dark:border-gray-800"
      )}
    >
      <div className="flex items-start gap-3 flex-col sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {row.serviceName === PLACEHOLDER
                ? "Sem nome ainda"
                : row.serviceName}
            </h3>
            {row.completeness === "complete" && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Completo
              </Badge>
            )}
            {row.completeness === "partial" && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100">
                <AlertCircle className="h-3 w-3 mr-1" /> Parcial
              </Badge>
            )}
            {row.completeness === "missing" && (
              <Badge className="bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 hover:bg-red-100">
                <ShieldAlert className="h-3 w-3 mr-1" /> Sem base legal
              </Badge>
            )}
          </div>

          {/* Metadata da fila */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
            {row.setor && (
              <span>
                <strong>Setor:</strong> {row.setor}
              </span>
            )}
            {row.legalReviewedAt && row.legalReviewedBy && (
              <span>
                <strong>Última revisão:</strong>{" "}
                {row.legalReviewedBy.name ?? row.legalReviewedBy.email}
                {" · "}
                {new Date(row.legalReviewedAt).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>

          {/* Resumo das 3 colunas: Previsão / Comum / Sensível */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <CompactField
              icon={<ScrollText className="h-3.5 w-3.5" />}
              label="Previsão Legal"
              value={row.previsaoLegal}
              filled={hasPrevisao}
            />
            <CompactField
              icon={<Shield className="h-3.5 w-3.5" />}
              label="Base Comum (Art. 7º)"
              value={
                row.legalBasis === PLACEHOLDER ? null : row.legalBasis
              }
              filled={hasComum}
            />
            <CompactField
              icon={<ShieldAlert className="h-3.5 w-3.5" />}
              label="Base Sensível (Art. 11)"
              value={row.legalBasisSensitive}
              filled={hasSensitive}
              warningPending={sensitivePending}
            />
          </div>
        </div>

        <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1 hidden sm:block" />
      </div>
    </Link>
  );
}

function CompactField({
  icon,
  label,
  value,
  filled,
  warningPending,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  filled: boolean;
  warningPending?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-2",
        filled
          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50"
          : warningPending
          ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50"
          : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"
      )}
    >
      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 mb-0.5">
        {icon}
        <span className="font-medium uppercase text-[10px] tracking-wide">
          {label}
        </span>
      </div>
      {filled && value ? (
        <p className="text-gray-800 dark:text-gray-200 truncate" title={value}>
          {value}
        </p>
      ) : warningPending ? (
        <p className="text-red-700 dark:text-red-300 italic text-[11px]">
          ⚠ Há dados sensíveis — preencher
        </p>
      ) : (
        <p className="text-gray-400 dark:text-gray-500 italic text-[11px]">
          Não preenchida
        </p>
      )}
    </div>
  );
}
