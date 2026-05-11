
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
  ShieldAlert,
  ListChecks,
  FileText,
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
import {
  inventoryStatusLabel,
  inventoryStatusColor,
  INVENTORY_STATUS,
  isDPO,
} from "@/lib/auth-helpers";

interface InventarioContentProps {
  session?: any;
}

const PLACEHOLDER = "[Em preenchimento]";

type StatusFilter =
  | "all"
  | "RASCUNHO"
  | "SUBMETIDO"
  | "EM_REVISAO"
  | "APROVADO"
  | "DEVOLVIDO";
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
  const userIsDPO = isDPO(session?.user?.role);
  const [searchTerm, setSearchTerm] = useState("");
  const [inventarios, setInventarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [setorFilter, setSetorFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  /** Quando setado, abre dialog pra DPO digitar comentário antes de devolver. */
  const [devolverTarget, setDevolverTarget] = useState<any | null>(null);
  const [devolverComment, setDevolverComment] = useState("");
  const [devolvendo, setDevolvendo] = useState(false);

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

  /**
   * Mudança de status genérica — chama PATCH /api/inventario/[id]/status.
   * Usado pra Iniciar revisão e Aprovar (Devolver tem flow próprio com
   * comentário, vai pelo handleDevolver).
   */
  const changeStatus = async (id: string, status: string) => {
    try {
      const r = await fetch(`/api/inventario/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error ?? "Erro ao mudar status");
        return;
      }
      const labels: Record<string, string> = {
        EM_REVISAO: "Marcado em revisão",
        APROVADO: "Processo aprovado!",
        SUBMETIDO: "Re-submetido pra revisão do DPO",
      };
      toast.success(labels[status] ?? "Status atualizado");
      loadInventarios();
    } catch {
      toast.error("Erro de rede");
    }
  };

  const handleDevolver = async () => {
    if (!devolverTarget || !devolverComment.trim()) return;
    setDevolvendo(true);
    try {
      const r = await fetch(
        `/api/inventario/${devolverTarget.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "DEVOLVIDO",
            comment: devolverComment.trim(),
          }),
        }
      );
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error ?? "Erro ao devolver");
        return;
      }
      toast.success("Processo devolvido pra ajustes");
      setDevolverTarget(null);
      setDevolverComment("");
      loadInventarios();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setDevolvendo(false);
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
      Status: inventoryStatusLabel(item.status ?? (item.isDraft ? "RASCUNHO" : "APROVADO")),
      Setor: item.setor ?? item.createdBy?.setor ?? "",
      "Criado por": item.createdBy?.name ?? "",
      "Data de Criação": new Date(item.createdAt).toLocaleDateString("pt-BR"),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventário de Dados");

    const colWidths = [
      { wch: 30 }, { wch: 25 }, { wch: 40 }, { wch: 25 }, { wch: 40 },
      { wch: 25 }, { wch: 30 }, { wch: 25 }, { wch: 35 }, { wch: 40 },
      { wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 15 },
    ];
    ws["!cols"] = colWidths;

    const timestamp = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `inventario-dados-pessoais-${timestamp}.xlsx`);

    toast.success("Arquivo Excel exportado com sucesso!");
  };

  /** Status efetivo de um item — preferindo `status` (novo) sobre `isDraft` (legado). */
  const itemStatus = (item: any): string =>
    item.status ?? (item.isDraft ? "RASCUNHO" : "APROVADO");
  /** Setor efetivo — pode estar no item, ou no `createdBy.setor`. */
  const itemSetor = (item: any): string =>
    item.setor ?? item.createdBy?.setor ?? "";

  const filteredInventarios = useMemo(() => {
    const search = searchTerm.toLowerCase();
    let list = inventarios.filter((item) => {
      // Status filter — exato (5 estados possíveis)
      if (statusFilter !== "all" && itemStatus(item) !== statusFilter) {
        return false;
      }
      // Setor filter
      if (setorFilter !== "all" && itemSetor(item) !== setorFilter) return false;

      // Search filter
      if (!search) return true;
      return (
        cleanField(item.serviceName).toLowerCase().includes(search) ||
        cleanField(item.dataCategory).toLowerCase().includes(search) ||
        cleanField(item.personalData).toLowerCase().includes(search) ||
        cleanField(item.legalBasis).toLowerCase().includes(search) ||
        cleanField(item.purpose).toLowerCase().includes(search) ||
        itemSetor(item).toLowerCase().includes(search) ||
        (item.createdBy?.name ?? "").toLowerCase().includes(search)
      );
    });

    // Sort
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
  }, [inventarios, searchTerm, statusFilter, setorFilter, sortBy]);

  /** Lista de setores distintos pra popular o filtro. */
  const distinctSetores = useMemo(() => {
    const s = new Set<string>();
    for (const item of inventarios) {
      const sec = itemSetor(item);
      if (sec) s.add(sec);
    }
    return [...s].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [inventarios]);

  // Estatísticas — conta valores reais e agrupa por status
  const stats = useMemo(() => {
    const real = inventarios;
    const cats = new Set<string>();
    const purp = new Set<string>();
    const legal = new Set<string>();
    const byStatus: Record<string, number> = {
      RASCUNHO: 0,
      SUBMETIDO: 0,
      EM_REVISAO: 0,
      APROVADO: 0,
      DEVOLVIDO: 0,
    };
    for (const i of real) {
      const c = cleanField(i.dataCategory);
      const p = cleanField(i.purpose);
      const l = cleanField(i.legalBasis);
      if (c) cats.add(c);
      if (p) purp.add(p);
      if (l) legal.add(l);
      const s = itemStatus(i);
      if (byStatus[s] !== undefined) byStatus[s]++;
    }
    return {
      total: real.length,
      // Mantém done/draft pra compat dos cards de stats no topo
      done: byStatus.APROVADO,
      draft: byStatus.RASCUNHO,
      byStatus,
      categories: cats.size,
      purposes: purp.size,
      legalBases: legal.size,
    };
  }, [inventarios]);

  const isFiltered =
    !!searchTerm ||
    statusFilter !== "all" ||
    setorFilter !== "all" ||
    sortBy !== "recent";

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
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <Button asChild size="lg" className="shadow-md flex-1 sm:flex-initial">
              <Link href="/dashboard/inventario/novo">
                <Plus className="h-4 w-4 mr-2" />
                Novo Mapeamento
              </Link>
            </Button>
            {userIsDPO ? (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-900/40 dark:hover:bg-emerald-950/30 flex-1 sm:flex-initial"
                title="XLSX consolidado no formato oficial (3 abas: INVENTÁRIO + RISCOS + VISÃO DE RISCOS)"
              >
                <a href="/api/inventario/export" download>
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                  Exportar Excel (modelo oficial)
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={exportToExcel}
                className="border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-900/40 dark:hover:bg-emerald-950/30 flex-1 sm:flex-initial"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                Exportar Excel
              </Button>
            )}
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

          {/* Tabs principais — os 3 status mais comuns ficam à mão.
              Estados intermediários (Submetido / Em Revisão / Devolvido)
              ficam no Select avançado abaixo. */}
          <Tabs
            value={
              statusFilter === "all" ||
              statusFilter === "RASCUNHO" ||
              statusFilter === "APROVADO"
                ? statusFilter
                : "advanced"
            }
            onValueChange={(v) => {
              if (v === "advanced") return; // visual-only — usar Select
              setStatusFilter(v as StatusFilter);
            }}
            className="max-w-full overflow-x-auto -mx-1 px-1"
          >
            <TabsList className="w-max">
              <TabsTrigger value="all">
                Todos
                <Badge variant="secondary" className="ml-2">
                  {stats.total}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="APROVADO">
                Aprovados
                <Badge variant="secondary" className="ml-2">
                  {stats.byStatus.APROVADO}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="RASCUNHO">
                Rascunhos
                <Badge variant="secondary" className="ml-2">
                  {stats.byStatus.RASCUNHO}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filtro de Status avançado — pra DPO ver Submetido / Em Revisão /
              Devolvido. Sincronizado com as tabs acima. */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Todos os status ({stats.total})
              </SelectItem>
              <SelectItem value={INVENTORY_STATUS.RASCUNHO}>
                Rascunho ({stats.byStatus.RASCUNHO})
              </SelectItem>
              <SelectItem value={INVENTORY_STATUS.SUBMETIDO}>
                Submetido ({stats.byStatus.SUBMETIDO})
              </SelectItem>
              <SelectItem value={INVENTORY_STATUS.EM_REVISAO}>
                Em revisão ({stats.byStatus.EM_REVISAO})
              </SelectItem>
              <SelectItem value={INVENTORY_STATUS.APROVADO}>
                Aprovado ({stats.byStatus.APROVADO})
              </SelectItem>
              <SelectItem value={INVENTORY_STATUS.DEVOLVIDO}>
                Devolvido ({stats.byStatus.DEVOLVIDO})
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de Setor — só faz sentido se houver setores
              cadastrados (em geral aparecem quando contribuidores criam
              processos). Pra DPO especialmente útil. */}
          {distinctSetores.length > 0 && (
            <Select value={setorFilter} onValueChange={setSetorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os setores</SelectItem>
                {distinctSetores.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[170px]">
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
                    showCreatorInfo={userIsDPO}
                    isUserDPO={userIsDPO}
                    currentUserId={session?.user?.id}
                    onDelete={() => setDeleteId(item.id)}
                    onStatusChange={changeStatus}
                    onDevolverClick={(it) => setDevolverTarget(it)}
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

        {/* ===== Dialog: Devolver com comentário ===== */}
        <AlertDialog
          open={!!devolverTarget}
          onOpenChange={(open) => {
            if (!open) {
              setDevolverTarget(null);
              setDevolverComment("");
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Devolver pra ajustes?</AlertDialogTitle>
              <AlertDialogDescription>
                O processo voltará pro contribuidor com o seu comentário,
                pra ele ajustar e re-submeter. O comentário é{" "}
                <strong>obrigatório</strong> — explique o que precisa mudar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <textarea
              className="w-full mt-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Ex: Faltou detalhar a finalidade do tratamento e indicar quais dados sensíveis são coletados."
              value={devolverComment}
              onChange={(e) => setDevolverComment(e.target.value)}
              disabled={devolvendo}
            />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={devolvendo}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDevolver}
                disabled={!devolverComment.trim() || devolvendo}
                className="bg-red-600 hover:bg-red-700"
              >
                {devolvendo ? "Devolvendo..." : "Devolver"}
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
  showCreatorInfo,
  isUserDPO,
  currentUserId,
  onDelete,
  onStatusChange,
  onDevolverClick,
}: {
  item: any;
  showCreatorInfo: boolean;
  isUserDPO: boolean;
  currentUserId: string | null | undefined;
  onDelete: () => void;
  onStatusChange: (id: string, status: string) => void;
  onDevolverClick: (item: any) => void;
}) {
  // Status efetivo (preferindo `status` novo sobre `isDraft` legado)
  const status: string =
    item.status ?? (item.isDraft ? "RASCUNHO" : "APROVADO");
  const isDraft = status === "RASCUNHO";
  const isApproved = status === "APROVADO";
  const serviceName = cleanField(item.serviceName);
  const personalData = cleanField(item.personalData);
  const dataCategory = cleanField(item.dataCategory);
  const legalBasis = cleanField(item.legalBasis);
  const purpose = cleanField(item.purpose);
  const setor = item.setor ?? item.createdBy?.setor ?? "";
  const creatorName = item.createdBy?.name ?? null;

  // Nome de exibição: se o user já preencheu o nome do processo, usa.
  // Senão, monta um label útil tipo "Rascunho do RH · 03/05" pra
  // distinguir múltiplos rascunhos sem nome no mesmo dia/setor.
  const displayName = serviceName
    ? serviceName
    : (() => {
        const baseLabel =
          status === "RASCUNHO" ? "Rascunho" : "Mapeamento";
        const setorPart = setor ? ` do ${setor}` : "";
        const dateSrc = item.updatedAt ?? item.createdAt;
        const datePart = dateSrc
          ? ` · ${new Date(dateSrc).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            })}`
          : "";
        return `${baseLabel}${setorPart}${datePart}`;
      })();

  const statusColor = inventoryStatusColor(status);

  // Progresso só pra drafts (concluídos = 100% por definição)
  const progress = isDraft
    ? computeProgress(item.formAnswers)
    : { filledSections: 7, totalSections: 7, filledFields: 0, totalFields: 0, pct: 100 };

  // Cor da borda esquerda — agora baseada no status
  // (cobre os 5 estados, não só draft/approved)
  const leftBorderClass: Record<string, string> = {
    RASCUNHO: "border-l-amber-400 dark:border-l-amber-500",
    SUBMETIDO: "border-l-blue-500 dark:border-l-blue-400",
    EM_REVISAO: "border-l-amber-500 dark:border-l-amber-400",
    APROVADO: "border-l-emerald-500 dark:border-l-emerald-500",
    DEVOLVIDO: "border-l-red-500 dark:border-l-red-500",
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
        "border-l-4",
        leftBorderClass[status] ?? "border-l-gray-400"
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
        {/* Bloco esquerdo — info principal */}
        <div className="flex-1 min-w-0">
          {/* Título + badge de status */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {isDraft ? (
              <FileEdit className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : isApproved ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <FileEdit className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
            )}
            <h3
              className={cn(
                "font-semibold text-lg truncate",
                serviceName
                  ? "text-gray-900 dark:text-white"
                  : "italic text-gray-500 dark:text-gray-400"
              )}
            >
              {displayName}
            </h3>
            {/* Badge de status — sempre visível, com cores do helper */}
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-normal",
                statusColor.bg,
                statusColor.text,
                statusColor.border
              )}
            >
              {inventoryStatusLabel(status)}
            </Badge>
          </div>

          {/* Metadados de contexto: setor + criador (só visível pro DPO,
              ou se o user é o próprio criador). Útil pro DPO entender de
              onde veio o processo. */}
          {(showCreatorInfo || creatorName || setor) && (showCreatorInfo) && (
            <div className="ml-7 mb-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
              {setor && (
                <span className="inline-flex items-center gap-1">
                  <span className="font-medium">Setor:</span> {setor}
                </span>
              )}
              {creatorName && (
                <span className="inline-flex items-center gap-1">
                  <span className="font-medium">Criado por:</span>{" "}
                  {creatorName}
                </span>
              )}
            </div>
          )}

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
                        <span className="truncate max-w-[140px] sm:max-w-[180px]">
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
                        <span className="truncate max-w-[140px] sm:max-w-[180px]">
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
                        <span className="truncate max-w-[200px] sm:max-w-[260px]">
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

        {/* Bloco direito — ações (variam conforme status + papel) */}
        <div className="flex items-center gap-2 ml-7 md:ml-0 md:shrink-0 flex-wrap">
          {/* DPO vê ações de aprovação pra processos pendentes */}
          {isUserDPO && status === "SUBMETIDO" && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(item.id, "EM_REVISAO")}
                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    Iniciar revisão
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Marcar como Em Revisão</TooltipContent>
              </Tooltip>
              <Button
                size="sm"
                onClick={() => onStatusChange(item.id, "APROVADO")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDevolverClick(item)}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                Devolver
              </Button>
            </>
          )}
          {isUserDPO && status === "EM_REVISAO" && (
            <>
              <Button
                size="sm"
                onClick={() => onStatusChange(item.id, "APROVADO")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDevolverClick(item)}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                Devolver
              </Button>
            </>
          )}

          {/* Continuar (Rascunho) */}
          {isDraft && (
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
          )}

          {/* Ajustar e re-submeter (Devolvido — para o criador) */}
          {status === "DEVOLVIDO" && item.createdById === currentUserId && (
            <Button
              asChild
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href={`/dashboard/inventario/${item.id}/editar`}>
                <Edit className="h-4 w-4 mr-1.5" />
                Ajustar e re-submeter
              </Link>
            </Button>
          )}

          {/* Editar (Aprovado / Submetido / Em Revisão — pra DPO) */}
          {!isDraft && status !== "DEVOLVIDO" && (
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

          {/* Bases Legais — botão dedicado pra DPO complementar.
              Indicador visual: borda roxa cheia se já preenchido, vazia se pendente. */}
          {isUserDPO && !isDraft && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className={cn(
                    item.legalReviewedAt
                      ? "border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 dark:border-purple-800 dark:text-purple-300 dark:bg-purple-950/30"
                      : "border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-950/20"
                  )}
                >
                  <Link href={`/dashboard/inventario/${item.id}/bases-legais`}>
                    <Scale className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {item.legalReviewedAt
                  ? "Bases Legais preenchidas — clique pra revisar"
                  : "Preencher Bases Legais"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Aviso de Privacidade do serviço — atalho pra DPO gerar/editar
              o documento público (Art. 9º LGPD). Só pra processos APROVADO. */}
          {isUserDPO && isApproved && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-900/50 dark:text-violet-300 dark:hover:bg-violet-950/30"
                >
                  <Link
                    href={`/dashboard/avisos-privacidade?inv=${item.id}`}
                    aria-label="Aviso de Privacidade"
                  >
                    <FileText className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Aviso de Privacidade do serviço</TooltipContent>
            </Tooltip>
          )}

          {/* Tarefas vinculadas — botão pra ver SUAS tarefas (do user atual)
              que estão linkadas a este processo. Aparece em qualquer status
              (não só APROVADO) — qualquer user pode planejar tarefas. */}
          {!isDraft && (item.myOpenTasksCount ?? 0) > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950/30"
                >
                  <Link href={`/dashboard/tarefas?processId=${item.id}`}>
                    <ListChecks className="h-4 w-4" />
                    <span className="ml-1 text-xs font-bold">
                      {item.myOpenTasksCount}
                    </span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {item.myOpenTasksCount === 1
                  ? "Você tem 1 tarefa aberta vinculada a esse processo"
                  : `Você tem ${item.myOpenTasksCount} tarefas abertas vinculadas a esse processo`}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Análise de Riscos — só pra processos APROVADOS, DPO-only.
              Borda vermelha cheia se há ≥1 risco identificado, vazia se ainda
              não foi feita análise (zero ProcessRisk). */}
          {isUserDPO && isApproved && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className={cn(
                    (item.processRisks?.length ?? 0) > 0
                      ? "border-red-300 text-red-700 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:bg-red-950/30"
                      : "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/20"
                  )}
                >
                  <Link href={`/dashboard/inventario/${item.id}/analise-riscos`}>
                    <ShieldAlert className="h-4 w-4" />
                    {(item.processRisks?.length ?? 0) > 0 && (
                      <span className="ml-1 text-xs font-bold">
                        {item.processRisks.length}
                      </span>
                    )}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {(item.processRisks?.length ?? 0) > 0
                  ? `${item.processRisks.length} risco(s) identificado(s) — clique pra revisar`
                  : "Analisar Riscos"}
              </TooltipContent>
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

      {/* Banner do comentário do DPO em processos DEVOLVIDOS */}
      {status === "DEVOLVIDO" && item.reviewComment && (
        <div className="mt-3 ml-7 rounded-md border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 p-3">
          <p className="text-xs uppercase font-bold tracking-wide text-red-700 dark:text-red-300 mb-1">
            Devolvido pra ajustes — comentário do DPO:
          </p>
          <p className="text-sm text-red-900 dark:text-red-100 whitespace-pre-line">
            {item.reviewComment}
          </p>
        </div>
      )}
    </div>
  );
}
