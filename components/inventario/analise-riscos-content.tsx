"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  RISCOS_CATALOG,
  RISCOS_BY_CODE,
  RISK_STATUS,
  riskStatusLabel,
  riskStatusColor,
  type RiskCode,
  type RiskStatus,
  type RiskSuggestion,
} from "@/lib/riscos-catalog";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  session: any;
}

interface ApiResponse {
  process: {
    id: string;
    serviceName: string;
    status: string;
    setor: string | null;
    legalBasis: string;
    legalBasisSensitive: string | null;
    legalReviewedAt: string | null;
    createdBy: { name: string | null; email: string; setor: string | null } | null;
  };
  risks: Array<{
    id: string;
    riskCode: RiskCode;
    status: RiskStatus;
    description: string | null;
    autoSuggested: boolean;
    severityLevel: string | null;
    identifiedAt: string;
    reviewedAt: string | null;
    identifiedBy?: { name: string | null; email: string } | null;
    reviewedBy?: { name: string | null; email: string } | null;
  }>;
  suggestions: Record<RiskCode, RiskSuggestion>;
}

interface RiskFormState {
  marked: boolean;
  description: string;
  status: RiskStatus;
  autoSuggested: boolean;
  /** Estado server pra detectar mudanças (controle de "salvo"). */
  serverState: {
    marked: boolean;
    description: string | null;
    status: RiskStatus;
  };
}

const STATUS_OPTIONS: ReadonlyArray<{ value: RiskStatus; label: string }> = [
  { value: "IDENTIFICADO", label: "Identificado" },
  { value: "EM_MITIGACAO", label: "Em mitigação" },
  { value: "ACEITO", label: "Aceito pela organização" },
  { value: "ELIMINADO", label: "Eliminado" },
];

export default function AnaliseRiscosContent({ id, session: _session }: Props) {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<Record<RiskCode, RiskFormState>>(
    {} as Record<RiskCode, RiskFormState>
  );

  // ----- Carrega dados -----
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/inventario/${id}/riscos`);
        if (!r.ok) {
          const err = await r.json();
          toast.error(err.error ?? "Erro ao carregar processo");
          router.push("/dashboard/inventario");
          return;
        }
        const json = (await r.json()) as ApiResponse;
        setData(json);

        // Monta estado inicial: combina riscos do banco com sugestões.
        // Sugestões "preselect" pré-marcam itens ainda não persistidos.
        const initial: Record<string, RiskFormState> = {};
        for (const def of RISCOS_CATALOG) {
          const code = def.code;
          const existing = json.risks.find((r) => r.riskCode === code);
          const suggestion = json.suggestions[code];
          if (existing) {
            initial[code] = {
              marked: true,
              description: existing.description ?? "",
              status: existing.status,
              autoSuggested: existing.autoSuggested,
              serverState: {
                marked: true,
                description: existing.description,
                status: existing.status,
              },
            };
          } else if (suggestion?.kind === "preselect") {
            initial[code] = {
              marked: true,
              description: suggestion.suggestedDescription ?? "",
              status: "IDENTIFICADO",
              autoSuggested: true,
              serverState: {
                marked: false,
                description: null,
                status: "IDENTIFICADO",
              },
            };
          } else {
            initial[code] = {
              marked: false,
              description: "",
              status: "IDENTIFICADO",
              autoSuggested: false,
              serverState: {
                marked: false,
                description: null,
                status: "IDENTIFICADO",
              },
            };
          }
        }
        setState(initial as Record<RiskCode, RiskFormState>);
      } catch {
        toast.error("Erro de rede ao carregar análise");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  // ----- Toggle/edit handlers -----
  const setRiskMarked = (code: RiskCode, marked: boolean) => {
    setState((s) => ({
      ...s,
      [code]: { ...s[code], marked, autoSuggested: marked && s[code].autoSuggested },
    }));
  };

  const setRiskDescription = (code: RiskCode, description: string) => {
    setState((s) => ({ ...s, [code]: { ...s[code], description } }));
  };

  const setRiskStatus = (code: RiskCode, status: RiskStatus) => {
    setState((s) => ({ ...s, [code]: { ...s[code], status } }));
  };

  // ----- Mudanças não salvas -----
  const dirty = useMemo(() => {
    return Object.entries(state).some(([_code, st]) => {
      if (st.marked !== st.serverState.marked) return true;
      if (
        st.marked &&
        ((st.description || null) !== st.serverState.description ||
          st.status !== st.serverState.status)
      ) {
        return true;
      }
      return false;
    });
  }, [state]);

  // ----- Aviso ao sair sem salvar -----
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // ----- Save -----
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        risks: RISCOS_CATALOG.map((def) => {
          const st = state[def.code];
          return {
            riskCode: def.code,
            marked: st.marked,
            description: st.description,
            status: st.status,
            autoSuggested: st.autoSuggested,
          };
        }),
      };
      const r = await fetch(`/api/inventario/${id}/riscos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) {
        toast.error(j.error ?? "Erro ao salvar");
        return;
      }
      toast.success("Análise de Riscos salva!");
      // Atualiza serverState pra refletir o que voltou do banco
      setState((prev) => {
        const next = { ...prev };
        for (const def of RISCOS_CATALOG) {
          const existing = (j.risks as any[]).find(
            (r) => r.riskCode === def.code
          );
          next[def.code] = {
            ...next[def.code],
            serverState: {
              marked: !!existing,
              description: existing?.description ?? null,
              status: existing?.status ?? "IDENTIFICADO",
            },
            autoSuggested: existing?.autoSuggested ?? next[def.code].autoSuggested,
          };
        }
        return next;
      });
    } catch {
      toast.error("Erro de rede ao salvar");
    } finally {
      setSaving(false);
    }
  };

  // ----- Stats -----
  const stats = useMemo(() => {
    const marked = Object.values(state).filter((s) => s.marked).length;
    const suggested = data
      ? Object.values(data.suggestions).filter((s) => s?.kind === "preselect")
          .length
      : 0;
    const alerts = data
      ? Object.values(data.suggestions).filter((s) => s?.kind === "alert")
          .length
      : 0;
    return { marked, suggested, alerts, total: 13 };
  }, [state, data]);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Carregando análise de riscos...
      </div>
    );
  }
  if (!data) return null;

  const isApproved = data.process.status === "APROVADO";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/dashboard/inventario">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Voltar pra listagem
          </Link>
        </Button>
        <div className="flex items-start gap-3 flex-wrap">
          <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2.5 mt-1">
            <ShieldAlert className="h-7 w-7 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Análise de Riscos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Marque quais dos 13 tipos de risco LGPD se aplicam a esse
              processo. Cada risco marcado pode ter uma observação curta.
              Esse preenchimento é responsabilidade do DPO — o contribuidor
              não tem acesso a essa tela.
            </p>
          </div>
        </div>
      </div>

      {/* Card de contexto + stats */}
      <Card className="bg-gray-50/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Processo:{" "}
                <span className="font-normal">
                  {data.process.serviceName === "[Em preenchimento]"
                    ? "Sem nome ainda"
                    : data.process.serviceName}
                </span>
              </p>
              {data.process.setor && (
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Setor:</span>{" "}
                  {data.process.setor}
                </p>
              )}
              {data.process.createdBy && (
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Criado por:</span>{" "}
                  {data.process.createdBy.name ??
                    data.process.createdBy.email}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.marked}
                </div>
                <div className="text-xs text-gray-500">de 13 marcados</div>
              </div>
              {stats.suggested > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.suggested}
                  </div>
                  <div className="text-xs text-gray-500">sugestões</div>
                </div>
              )}
              {stats.alerts > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {stats.alerts}
                  </div>
                  <div className="text-xs text-gray-500">alertas</div>
                </div>
              )}
            </div>
          </div>
          {!isApproved && (
            <div className="rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                Esse processo ainda não está APROVADO. A Análise de Riscos só
                pode ser concluída após aprovação do mapeamento.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aviso geral sobre sugestões */}
      {(stats.suggested > 0 || stats.alerts > 0) && (
        <div className="rounded-md border border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20 p-3 text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
          <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            O sistema analisou as respostas do mapeamento e{" "}
            {stats.suggested > 0 && (
              <>
                <strong>pré-marcou {stats.suggested}</strong> risco(s) que
                aparecem como Sim direto no questionário (transferência
                internacional, decisão automatizada, etc.)
              </>
            )}
            {stats.suggested > 0 && stats.alerts > 0 && " e "}
            {stats.alerts > 0 && (
              <>
                colocou <strong>{stats.alerts} alerta(s)</strong> em itens que
                merecem sua avaliação
              </>
            )}
            . Você confirma, ajusta ou desmarca à vontade.
          </div>
        </div>
      )}

      {/* Lista de 13 riscos */}
      <div className="space-y-3">
        {RISCOS_CATALOG.map((def) => {
          const st = state[def.code];
          if (!st) return null;
          const suggestion = data.suggestions[def.code];
          return (
            <RiskRow
              key={def.code}
              code={def.code}
              invId={id}
              marked={st.marked}
              description={st.description}
              status={st.status}
              autoSuggested={st.autoSuggested}
              suggestion={suggestion}
              onToggle={(v) => setRiskMarked(def.code, v)}
              onDescription={(v) => setRiskDescription(def.code, v)}
              onStatus={(v) => setRiskStatus(def.code, v)}
            />
          );
        })}
      </div>

      {/* Footer sticky */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sticky bottom-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 -mx-2 px-2 py-3 rounded-t-lg shadow-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {dirty ? (
            <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-4 w-4" />
              Mudanças não salvas
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Tudo salvo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild variant="outline" className="flex-1 sm:flex-initial">
            <Link href="/dashboard/inventario">Cancelar</Link>
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !dirty || !isApproved}
            className="shadow-md flex-1 sm:flex-initial"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? "Salvando..." : "Salvar Análise"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RiskRow — card de 1 risco
// ============================================================

function RiskRow({
  code,
  invId,
  marked,
  description,
  status,
  autoSuggested,
  suggestion,
  onToggle,
  onDescription,
  onStatus,
}: {
  code: RiskCode;
  invId: string;
  marked: boolean;
  description: string;
  status: RiskStatus;
  autoSuggested: boolean;
  suggestion: RiskSuggestion | undefined;
  onToggle: (v: boolean) => void;
  onDescription: (v: string) => void;
  onStatus: (v: RiskStatus) => void;
}) {
  const def = RISCOS_BY_CODE[code];
  const isAlert = suggestion?.kind === "alert";
  const isPreselect = suggestion?.kind === "preselect";
  const statusColor = riskStatusColor(status);

  return (
    <div
      className={cn(
        "border rounded-lg p-4 transition-all",
        marked
          ? "border-red-300 dark:border-red-800/60 bg-red-50/40 dark:bg-red-950/15 border-l-4 border-l-red-500"
          : isAlert
          ? "border-amber-300 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/15"
          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Switch */}
        <div className="flex-shrink-0 pt-1">
          <Switch checked={marked} onCheckedChange={onToggle} />
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-1">
              {code}
            </span>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base flex-1 min-w-0">
              {def.shortLabel}
            </h3>
            {/* Badge de sugestão */}
            {isPreselect && !marked && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100">
                <Sparkles className="h-3 w-3 mr-1" />
                Sugerido
              </Badge>
            )}
            {isPreselect && marked && autoSuggested && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100">
                <Sparkles className="h-3 w-3 mr-1" />
                Pré-marcado
              </Badge>
            )}
            {isAlert && !marked && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Avaliar
              </Badge>
            )}
            {/* Popover ?  */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                  type="button"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 max-h-[500px] overflow-y-auto" align="end">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-mono text-gray-400">
                      {code} · {def.fullLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
                      Fato
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {def.help.fato}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
                      Fundamento legal
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {def.help.fundamentoLegal}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
                      Risco identificado
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {def.help.riscoIdentificado}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Recomendações
                    </p>
                    <ul className="list-disc ml-4 space-y-1 text-gray-700 dark:text-gray-300">
                      {def.help.recomendacoes.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
            {def.summary}
          </p>

          {/* Razão da sugestão */}
          {suggestion?.kind && (
            <div
              className={cn(
                "ml-7 mt-2 rounded-md p-2 text-xs flex items-start gap-2",
                isPreselect
                  ? "bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40"
                  : "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40"
              )}
            >
              {isPreselect ? (
                <Sparkles className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              )}
              <span>
                <strong>
                  {isPreselect ? "Sistema sugeriu:" : "Avaliar:"}
                </strong>{" "}
                {suggestion.reason}
              </span>
            </div>
          )}

          {/* Quando marcado: textarea + status + bridge pro Checkpoint 6 */}
          {marked && (
            <div className="ml-7 mt-3 space-y-3 border-t border-red-200 dark:border-red-800/30 pt-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Observação curta (opcional)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => onDescription(e.target.value)}
                  placeholder={
                    code === "BV"
                      ? "Ex: Estados Unidos, Irlanda"
                      : code === "CB"
                      ? "Ex: Concessão de empréstimo via algoritmo"
                      : "Detalhe específico desse risco neste processo..."
                  }
                  rows={2}
                  className="text-sm resize-y"
                />
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                    Status:
                  </label>
                  <Select
                    value={status}
                    onValueChange={(v) => onStatus(v as RiskStatus)}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-8 text-xs w-full sm:w-56 max-w-full",
                        statusColor.bg,
                        statusColor.text,
                        statusColor.border
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Detalhamento individual (Checkpoint 6) */}
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  title="Abrir detalhamento (probabilidade, impacto, plano de mitigação)"
                >
                  <Link href={`/dashboard/inventario/${invId}/risco/${code}`}>
                    Detalhar →
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
