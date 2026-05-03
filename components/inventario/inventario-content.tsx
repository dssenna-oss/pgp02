
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardList,
  Tags,
  Target,
  Scale,
  FileSpreadsheet,
  Plus,
  Search,
  Edit,
  Trash2,
  FileEdit,
  CheckCircle2,
  PlayCircle,
  ArrowDownUp,
  AlignLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
// @ts-ignore
import * as XLSX from "xlsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  INVENTARIO_FORM_SCHEMA,
  isFieldVisible,
  type FormAnswers,
  type WizardStep,
} from "@/lib/inventario-form-schema";

interface InventarioContentProps {
  session?: any;
}

const PLACEHOLDER = "[Em preenchimento]";

type StatusFilter = "all" | "done" | "draft";
type SortBy = "recent" | "oldest" | "az";

/**
 * Calcula progresso de um draft a partir do formAnswers, usando o
 * mesmo critério da revisão do wizard (campos visíveis e preenchidos).
 */
function computeProgress(formAnswers: any): {
  filledSections: number;
  totalSections: number;
  filledFields: number;
  totalFields: number;
  pct: number;
} {
  const sections = INVENTARIO_FORM_SCHEMA.filter(
    (s) => s.kind === "section"
  ) as Extract<WizardStep, { kind: "section" }>[];

  let totalFields = 0;
  let filledFields = 0;
  let filledSections = 0;

  for (const sec of sections) {
    const sa = ((formAnswers ?? {})[sec.id] ?? {}) as Record<string, any>;
    const visible = sec.fields.filter((f) => isFieldVisible(f, sa));
    const filled = visible.filter((f) => {
      const v = sa[f.id];
      return Array.isArray(v) ? v.length > 0 : !!v?.toString().trim();
    });
    totalFields += visible.length;
    filledFields += filled.length;
    if (visible.length > 0 && filled.length === visible.length) filledSections++;
  }

  const pct = totalFields ? Math.round((filledFields / totalFields) * 100) : 0;
  return {
    filledSections,
    totalSections: sections.length,
    filledFields,
    totalFields,
    pct,
  };
}

/** Mostra valor real ou em branco — nunca o placeholder bruto. */
function cleanField(v?: string | null): string {
  if (!v) return "";
  if (v === PLACEHOLDER) return "";
  return v;
}

export default function InventarioContent({ session }: InventarioContentProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [inventarios, setInventarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("recent");

  useEffect(() => {
    loadInventarios();
  }, []);

  const loadInventarios = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/inventario");
      if (!response.ok) throw new Error("Erro ao carregar inventários");
      const data = await response.json();
      setInventarios(data);
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar inventários");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/inventario/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir inventário");

      toast.success("Inventário excluído com sucesso!");
      loadInventarios();
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao excluir inventário");
    } finally {
      setDeleteId(null);
    }
  };

  const exportToExcel = () => {
    if (filteredInventarios.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    const dataToExport = filteredInventarios.map((item) => ({
      "Processo/Serviço": cleanField(item.serviceName),
      "Categoria de Dados": cleanField(item.dataCategory),
      "Dados Pessoais": cleanField(item.personalData),
      "Base Legal": cleanField(item.legalBasis),
      Finalidade: cleanField(item.purpose),
      Titulares: cleanField(item.dataSubjects),
      Retenção: cleanField(item.retention),
      Armazenamento: cleanField(item.storage),
      Compartilhamento: cleanField(item.sharing) || "Não há",
      "Medidas de Segurança": cleanField(item.security),
      Status: item.isDraft ? "Rascunho" : "Concluído",
      "Data de Criação": new Date(item.createdAt).toLocaleDateString("pt-BR"),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventário de Dados");

    const colWidths = [
      { wch: 30 }, { wch: 25 }, { wch: 40 }, { wch: 25 }, { wch: 40 },
      { wch: 25 }, { wch: 30 }, { wch: 25 }, { wch: 35 }, { wch: 40 },
      { wch: 12 }, { wch: 15 },
    ];
    ws["!cols"] = colWidths;

    const timestamp = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `inventario-dados-pessoais-${timestamp}.xlsx`);

    toast.success("Arquivo Excel exportado com sucesso!");
  };

  const filteredInventarios = useMemo(() => {
    const search = searchTerm.toLowerCase();
    let list = inventarios.filter((item) => {
      // status filter
      if (statusFilter === "done" && item.isDraft) return false;
      if (statusFilter === "draft" && !item.isDraft) return false;

      // search filter
      if (!search) return true;
      return (
        cleanField(item.serviceName).toLowerCase().includes(search) ||
        cleanField(item.dataCategory).toLowerCase().includes(search) ||
        cleanField(item.personalData).toLowerCase().includes(search) ||
        cleanField(item.legalBasis).toLowerCase().includes(search) ||
        cleanField(item.purpose).toLowerCase().includes(search)
      );
    });

    // sort
    list = [...list].sort((a, b) => {
      if (sortBy === "az") {
        const an = (cleanField(a.serviceName) || "~").toLowerCase();
        const bn = (cleanField(b.serviceName) || "~").toLowerCase();
        return an.localeCompare(bn, "pt-BR");
      }
      const aT = new Date(a.createdAt).getTime();
      const bT = new Date(b.createdAt).getTime();
      return sortBy === "oldest" ? aT - bT : bT - aT;
    });

    return list;
  }, [inventarios, searchTerm, statusFilter, sortBy]);

  // Estatísticas — só conta valores reais (ignora placeholders)
  const stats = useMemo(() => {
    const real = inventarios;
    const cats = new Set<string>();
    const purp = new Set<string>();
    const legal = new Set<string>();
    let done = 0;
    let draft = 0;
    for (const i of real) {
      const c = cleanField(i.dataCategory);
      const p = cleanField(i.purpose);
      const l = cleanField(i.legalBasis);
      if (c) cats.add(c);
      if (p) purp.add(p);
      if (l) legal.add(l);
      if (i.isDraft) draft++;
      else done++;
    }
    return {
      total: real.length,
      done,
      draft,
      categories: cats.size,
      purposes: purp.size,
      legalBases: legal.size,
    };
  }, [inventarios]);

  const isFiltered =
    !!searchTerm || statusFilter !== "all" || sortBy !== "recent";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        {/* ===== Header ===== */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2.5 mt-1">
              <ClipboardList className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Inventário de Dados Pessoais
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Mapeamento completo dos dados pessoais tratados pela organização
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button asChild size="lg" className="shadow-md">
              <Link href="/dashboard/inventario/novo">
                <Plus className="h-4 w-4 mr-2" />
                Novo Mapeamento
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={exportToExcel}
              className="border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-900/40 dark:hover:bg-emerald-950/30"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* ===== Search + Filter + Sort ===== */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar no inventário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <TabsList>
              <TabsTrigger value="all">
                Todos
                <Badge variant="secondary" className="ml-2">
                  {stats.total}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="done">
                Concluídos
                <Badge variant="secondary" className="ml-2">
                  {stats.done}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="draft">
                Rascunhos
                <Badge variant="secondary" className="ml-2">
                  {stats.draft}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[180px]">
              <ArrowDownUp className="h-4 w-4 mr-1 text-gray-500" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigos</SelectItem>
              <SelectItem value="az">A → Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ===== Stats Cards ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<ClipboardList className="h-8 w-8" />}
            label="Total de Registros"
            value={stats.total}
            subtitle={
              stats.total > 0
                ? `${stats.done} ativos · ${stats.draft} rascunhos`
                : "Nenhum mapeamento ainda"
            }
            tone="blue"
          />
          <StatCard
            icon={<Tags className="h-8 w-8" />}
            label="Categorias"
            value={stats.categories}
            subtitle="Tipos distintos de dados"
            tone="green"
          />
          <StatCard
            icon={<Target className="h-8 w-8" />}
            label="Finalidades"
            value={stats.purposes}
            subtitle="Objetivos de uso"
            tone="orange"
          />
          <StatCard
            icon={<Scale className="h-8 w-8" />}
            label="Bases Legais"
            value={stats.legalBases}
            subtitle="Fundamentos LGPD"
            tone="purple"
          />
        </div>

        {/* ===== Lista ===== */}
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="flex items-center gap-2">
                <AlignLeft className="h-5 w-5 text-gray-500" />
                Lista de Tratamentos de Dados
                <Badge variant="secondary" className="ml-1">
                  {filteredInventarios.length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2 text-xs">
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {stats.done} concluídos
                </Badge>
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300">
                  <FileEdit className="h-3 w-3 mr-1" />
                  {stats.draft} rascunhos
                </Badge>
                {isFiltered && (
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    Mostrando {filteredInventarios.length} de {stats.total}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  Carregando inventários...
                </p>
              </div>
            ) : filteredInventarios.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  {isFiltered
                    ? "Nenhum registro encontrado com esses filtros."
                    : "Nenhum inventário cadastrado. Clique em 'Novo Mapeamento' para começar."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInventarios.map((item) => (
                  <InventarioRow
                    key={item.id}
                    item={item}
                    onDelete={() => setDeleteId(item.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== Confirmar Exclusão ===== */}
        <AlertDialog
          open={!!deleteId}
          onOpenChange={() => setDeleteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este inventário? Esta ação não
                pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

// ============================================================
// Stat Card — ícones e cores distintas por tipo
// ============================================================

const TONE: Record<
  string,
  { iconColor: string; iconBg: string; ring: string }
> = {
  blue: {
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    ring: "ring-blue-100 dark:ring-blue-900/30",
  },
  green: {
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    ring: "ring-emerald-100 dark:ring-emerald-900/30",
  },
  orange: {
    iconColor: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    ring: "ring-orange-100 dark:ring-orange-900/30",
  },
  purple: {
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    ring: "ring-purple-100 dark:ring-purple-900/30",
  },
};

function StatCard({
  icon,
  label,
  value,
  subtitle,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle?: string;
  tone: keyof typeof TONE;
}) {
  const t = TONE[tone];
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn("rounded-lg p-2.5", t.iconBg)}>
            <span className={t.iconColor}>{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {label}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white leading-tight mt-0.5">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Card por tratamento — drafts vs concluídos
// ============================================================

function InventarioRow({
  item,
  onDelete,
}: {
  item: any;
  onDelete: () => void;
}) {
  const isDraft = !!item.isDraft;
  const serviceName = cleanField(item.serviceName);
  const personalData = cleanField(item.personalData);
  const dataCategory = cleanField(item.dataCategory);
  const legalBasis = cleanField(item.legalBasis);
  const purpose = cleanField(item.purpose);

  // Progresso só pra drafts (concluídos = 100% por definição)
  const progress = isDraft
    ? computeProgress(item.formAnswers)
    : { filledSections: 7, totalSections: 7, filledFields: 0, totalFields: 0, pct: 100 };

  return (
    <div
      className={cn(
        "border rounded-lg p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
        "border-l-4",
        isDraft
          ? "border-amber-400 dark:border-amber-500 border-y-amber-100 border-r-amber-100 dark:border-y-amber-900/40 dark:border-r-amber-900/40"
          : "border-emerald-500 dark:border-emerald-500 border-y-emerald-100 border-r-emerald-100 dark:border-y-emerald-900/40 dark:border-r-emerald-900/40"
      )}
    >
      <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
        {/* Bloco esquerdo — info principal */}
        <div className="flex-1 min-w-0">
          {/* Título */}
          <div className="flex items-center gap-2 mb-1">
            {isDraft ? (
              <FileEdit className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <h3
              className={cn(
                "font-semibold text-lg truncate",
                serviceName
                  ? "text-gray-900 dark:text-white"
                  : "italic text-gray-400 dark:text-gray-500"
              )}
            >
              {serviceName || "Mapeamento sem nome ainda"}
            </h3>
          </div>

          {isDraft ? (
            // ===== DRAFT: progresso, sem badges vazios =====
            <div className="ml-7 space-y-2">
              <div className="flex items-center gap-2">
                <Progress value={progress.pct} className="h-2 flex-1 max-w-md" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300 whitespace-nowrap">
                  {progress.filledSections} de {progress.totalSections} seções
                  · {progress.pct}%
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {progress.filledFields} de {progress.totalFields} perguntas
                respondidas
              </p>
            </div>
          ) : (
            // ===== CONCLUÍDO: dados resumo com ícones =====
            <div className="ml-7 space-y-2">
              {personalData && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {personalData}
                </p>
              )}
              <div className="flex items-center gap-3 text-sm flex-wrap">
                {dataCategory && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <Tags className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="truncate max-w-[180px]">
                          {dataCategory}
                        </span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Categoria de dados</TooltipContent>
                  </Tooltip>
                )}
                {legalBasis && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <Scale className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="truncate max-w-[180px]">
                          {legalBasis}
                        </span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Base legal LGPD</TooltipContent>
                  </Tooltip>
                )}
                {purpose && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <span className="truncate max-w-[260px]">
                          {purpose}
                        </span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Finalidade do tratamento</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bloco direito — ações */}
        <div className="flex items-center gap-2 shrink-0 ml-7 md:ml-0">
          {isDraft ? (
            <Button
              asChild
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Link href={`/dashboard/inventario/${item.id}/editar`}>
                <PlayCircle className="h-4 w-4 mr-1.5" />
                Continuar
              </Link>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-950/30"
                >
                  <Link href={`/dashboard/inventario/${item.id}/editar`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar mapeamento</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={onDelete}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
