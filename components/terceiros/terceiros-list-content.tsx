"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Handshake,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  ShieldAlert,
  Sparkles,
  X,
  FileText,
  Upload,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { isDPO } from "@/lib/auth-helpers";
import {
  type OperatorDTO,
  type OperatorStats,
  RELATION_TYPE,
  CONTRACT_RISK_CLASS,
  relationTypeLabel,
  contractRiskClassLabel,
} from "@/lib/operadores-helpers";
import TerceiroCard from "./terceiro-card";
import TerceiroCreateModal from "./terceiro-create-modal";
import TerceiroPdfImportModal from "./terceiro-pdf-import-modal";

interface ApiResponse {
  items: OperatorDTO[];
  stats: OperatorStats;
}

interface SuggestionItem {
  inventoryId: string;
  serviceName: string;
  sharingText: string;
  suggestedNames: string[];
}

interface SuggestionsResponse {
  items: SuggestionItem[];
}

const RELATION_FILTERS = [
  { value: "ALL", label: "Todas" },
  { value: "OPERADOR", label: "Operador" },
  { value: "CONTROLADOR", label: "Controlador" },
  { value: "CO_CONTROLADOR", label: "Co-controlador" },
  { value: "INDEFINIDO", label: "A classificar" },
] as const;

const RISK_FILTERS = [
  { value: "ALL", label: "Todas" },
  { value: "ALTO", label: "Alto" },
  { value: "MEDIO", label: "Médio" },
  { value: "BAIXO", label: "Baixo" },
] as const;

const COMPLIANCE_FILTERS = [
  { value: "ALL", label: "Todas" },
  { value: "PENDING", label: "Pendentes (não avaliado + em adequação)" },
  { value: "NAO_AVALIADO", label: "Não avaliado" },
  { value: "EM_ADEQUACAO", label: "Em adequação" },
  { value: "ADEQUADO", label: "Adequado" },
  { value: "NAO_APLICAVEL", label: "Não aplicável" },
] as const;

export default function TerceirosListContent() {
  const { data: session } = useSession();
  const userIsDPO = isDPO(session?.user?.role);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [relationFilter, setRelationFilter] = useState<string>("ALL");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [complianceFilter, setComplianceFilter] = useState<string>("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [showPdfImport, setShowPdfImport] = useState(false);

  // Sugestões de auto-import do Inventário (Checkpoint 14 G4)
  const [suggestions, setSuggestions] = useState<SuggestionItem[] | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [prefill, setPrefill] = useState<{
    name: string;
    inventoryId: string;
    activityDescription: string;
  } | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [rOps, rSugg] = await Promise.all([
        fetch("/api/operadores", { cache: "no-store" }),
        fetch("/api/operadores/suggestions", { cache: "no-store" }),
      ]);
      if (!rOps.ok) {
        const err = await rOps.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao carregar operadores");
        return;
      }
      setData(await rOps.json());
      if (rSugg.ok) {
        const j = (await rSugg.json()) as SuggestionsResponse;
        setSuggestions(j.items);
      } else {
        setSuggestions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Excluir "${name}"?\n\nVínculos com processos do Inventário também serão removidos. Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }
    const r = await fetch(`/api/operadores/${id}`, { method: "DELETE" });
    if (!r.ok) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Operador excluído");
    refresh();
  };

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((o) => {
      if (relationFilter !== "ALL" && o.relationType !== relationFilter)
        return false;
      if (riskFilter !== "ALL" && o.contractRiskClass !== riskFilter)
        return false;
      if (complianceFilter !== "ALL") {
        if (complianceFilter === "PENDING") {
          if (
            o.lgpdComplianceStatus !== "NAO_AVALIADO" &&
            o.lgpdComplianceStatus !== "EM_ADEQUACAO"
          ) {
            return false;
          }
        } else if (o.lgpdComplianceStatus !== complianceFilter) {
          return false;
        }
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.name.toLowerCase().includes(q) ||
        (o.tradeName ?? "").toLowerCase().includes(q) ||
        (o.cnpj ?? "").toLowerCase().includes(q)
      );
    });
  }, [data?.items, relationFilter, riskFilter, complianceFilter, search]);

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-950/40 p-2 rounded-lg">
            <Handshake className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Gestão de Terceiros
            </h1>
            <p className="text-sm text-muted-foreground">
              Operadores, contratos e avaliação de risco
            </p>
          </div>
        </div>
        {userIsDPO && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setShowPdfImport(true)}
              title="Sobe um contrato em PDF e extrai os dados via regex"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar PDF
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar terceiro
            </Button>
          </div>
        )}
      </div>

      {/* Banner de atenção (vencidos / sem contrato) */}
      {userIsDPO &&
        data?.stats &&
        data.stats.needsAttention > 0 && (
          <Card className="border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-md flex-shrink-0">
                <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-red-900 dark:text-red-200">
                  {data.stats.needsAttention} terceiro(s) com pendência crítica
                </p>
                <p className="text-sm text-red-800 dark:text-red-300 mt-0.5">
                  Contratos vencidos ou sem contrato celebrado — risco LGPD
                  alto. Renovação ou nova celebração recomendada.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      {/* Banner de sugestões — Inventário→Operador (Checkpoint 14 G4) */}
      {userIsDPO && suggestions && suggestions.length > 0 && showSuggestions && (
        <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-md flex-shrink-0">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-blue-900 dark:text-blue-200">
                  {suggestions.length} processo(s) sugerem operadores não cadastrados
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-0.5">
                  Detectamos processos APROVADOS no Inventário com
                  compartilhamento de dados declarado, mas sem nenhum operador
                  vinculado aqui. Cadastre os terceiros pra fechar o ciclo.
                </p>
                <div className="mt-3 space-y-2">
                  {suggestions.slice(0, 5).map((s) => (
                    <div
                      key={s.inventoryId}
                      className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-md p-3"
                    >
                      <p className="font-medium text-sm">
                        Processo:{" "}
                        <span className="font-semibold">{s.serviceName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        Compartilhamento declarado: "{s.sharingText}"
                      </p>
                      {s.suggestedNames.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {s.suggestedNames.map((name) => (
                            <Button
                              key={name}
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() =>
                                setPrefill({
                                  name,
                                  inventoryId: s.inventoryId,
                                  activityDescription: `Atividade declarada no compartilhamento do processo "${s.serviceName}".`,
                                })
                              }
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Cadastrar "{name}"
                            </Button>
                          ))}
                        </div>
                      )}
                      {s.suggestedNames.length === 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs mt-2"
                          onClick={() =>
                            setPrefill({
                              name: "",
                              inventoryId: s.inventoryId,
                              activityDescription: `Atividade declarada no compartilhamento do processo "${s.serviceName}".`,
                            })
                          }
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Cadastrar terceiro deste processo
                        </Button>
                      )}
                    </div>
                  ))}
                  {suggestions.length > 5 && (
                    <p className="text-xs text-blue-700 dark:text-blue-300 italic">
                      + {suggestions.length - 5} processo(s) com sugestões…
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSuggestions(false)}
                title="Ocultar sugestões"
                className="text-blue-700 dark:text-blue-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banner de adequação LGPD (Checkpoint 14 H1) */}
      {userIsDPO &&
        data?.stats &&
        data.stats.pendingCompliance > 0 && (
          <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-md flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-blue-900 dark:text-blue-200">
                  {data.stats.pendingCompliance} terceiro(s) pendente(s) de
                  adequação LGPD
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-0.5">
                  Contratos pré-LGPD ainda sem avaliação ou em campanha de
                  adequação. Use o botão <strong>"Iniciar adequação"</strong>{" "}
                  no detalhe do operador pra gerar plano de ação.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      {userIsDPO &&
        data?.stats &&
        data.stats.expiringSoon > 0 && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-md flex-shrink-0">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  {data.stats.expiringSoon} contrato(s) vencendo em ≤90 dias
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-300 mt-0.5">
                  Avalie a renovação com antecedência, especialmente os de
                  risco alto.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      {/* KPIs por risco */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            icon={<Building2 className="h-5 w-5 text-blue-600" />}
            label="Total"
            value={data.stats.total}
          />
          <KpiCard
            icon={<AlertCircle className="h-5 w-5 text-red-600" />}
            label="Risco alto"
            value={data.stats.byRiskClass.ALTO ?? 0}
          />
          <KpiCard
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            label="Risco médio"
            value={data.stats.byRiskClass.MEDIO ?? 0}
          />
          <KpiCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            label="Risco baixo"
            value={data.stats.byRiskClass.BAIXO ?? 0}
          />
        </div>
      )}

      {/* Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, fantasia ou CNPJ…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1 ml-1">Posição</p>
            <div className="flex gap-1 flex-wrap">
              {RELATION_FILTERS.map((s) => (
                <Button
                  key={s.value}
                  size="sm"
                  variant={relationFilter === s.value ? "default" : "outline"}
                  onClick={() => setRelationFilter(s.value)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1 ml-1">Risco</p>
            <div className="flex gap-1 flex-wrap">
              {RISK_FILTERS.map((s) => (
                <Button
                  key={s.value}
                  size="sm"
                  variant={riskFilter === s.value ? "default" : "outline"}
                  onClick={() => setRiskFilter(s.value)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1 ml-1">
              Adequação LGPD
            </p>
            <div className="flex gap-1 flex-wrap">
              {COMPLIANCE_FILTERS.map((s) => (
                <Button
                  key={s.value}
                  size="sm"
                  variant={complianceFilter === s.value ? "default" : "outline"}
                  onClick={() => setComplianceFilter(s.value)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Carregando terceiros…
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Handshake className="h-12 w-12 mx-auto text-muted-foreground/50" />
            {(data?.items.length ?? 0) === 0 ? (
              <>
                <p className="text-lg font-medium">Nenhum terceiro cadastrado</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Cadastre os fornecedores, prestadores de serviço e
                  parceiros que tratam dados pessoais. A classificação de
                  posição (Operador / Controlador) e a régua de risco
                  ajudam a escolher a cláusula contratual adequada.
                </p>
                {userIsDPO && (
                  <Button onClick={() => setShowCreate(true)} className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar primeiro terceiro
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum terceiro corresponde aos filtros atuais.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((o) => (
            <TerceiroCard
              key={o.id}
              operator={o}
              canDelete={userIsDPO}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal de criação (manual ou auto-import) */}
      <TerceiroCreateModal
        open={showCreate || prefill !== null}
        onClose={() => {
          setShowCreate(false);
          setPrefill(null);
        }}
        onCreated={(id) => {
          setShowCreate(false);
          setPrefill(null);
          window.location.assign(`/dashboard/terceiros/${id}`);
        }}
        prefillName={prefill?.name}
        linkInventoryId={prefill?.inventoryId}
        linkActivityDescription={prefill?.activityDescription}
      />

      {/* Modal de importação de PDF (Checkpoint 14 H1 / D2) */}
      <TerceiroPdfImportModal
        open={showPdfImport}
        onClose={() => setShowPdfImport(false)}
        onCreated={(id) => {
          setShowPdfImport(false);
          window.location.assign(`/dashboard/terceiros/${id}`);
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
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
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
