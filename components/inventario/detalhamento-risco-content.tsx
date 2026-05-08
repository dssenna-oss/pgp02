"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ShieldAlert,
  Scale,
  AlertTriangle,
  Lightbulb,
  ListChecks,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  RISCOS_BY_CODE,
  RISK_PROBABILITY,
  RISK_IMPACT,
  RISK_STATUS,
  riskStatusLabel,
  computeSeverity,
  severityLabel,
  severityBadgeClass,
  probabilityLabel,
  impactLabel,
  formatRiskTitle,
  PROBABILITY_HINTS,
  IMPACT_HINTS,
  decodeSeverity,
  type RiskCode,
  type RiskProbability,
  type RiskImpact,
  type RiskSeverity,
} from "@/lib/riscos-catalog";
import AddToActionPlanButton from "@/components/plano-acao/add-to-action-plan-button";

interface Props {
  invId: string;
  riskCode: string;
}

interface RiskDetailResponse {
  process: { id: string; serviceName: string; setor: string | null };
  catalog: (typeof RISCOS_BY_CODE)[RiskCode];
  risk: {
    id: string;
    riskCode: string;
    status: string;
    description: string | null;
    autoSuggested: boolean;
    mitigationPlan: string | null;
    legalBasisRef: string | null;
    severity: RiskSeverity | null;
    probability: RiskProbability | null;
    impact: RiskImpact | null;
    identifiedAt: string;
    reviewedAt: string | null;
    identifiedBy: { name: string | null; email: string } | null;
    reviewedBy: { name: string | null; email: string } | null;
  };
}

export default function DetalhamentoRiscoContent({ invId, riskCode }: Props) {
  const [data, setData] = useState<RiskDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Estado local dos campos editáveis
  const [probability, setProbability] = useState<RiskProbability | null>(null);
  const [impact, setImpact] = useState<RiskImpact | null>(null);
  const [mitigationPlan, setMitigationPlan] = useState("");
  const [legalBasisRef, setLegalBasisRef] = useState("");
  const [status, setStatus] = useState<string>(RISK_STATUS.IDENTIFICADO);
  // Lista de "recomendações marcáveis" do catálogo — armazenada em JSON
  // dentro do mitigationPlan na forma "[x] item\n[ ] item2\n\nTexto livre…"
  const [checkedRecs, setCheckedRecs] = useState<Set<number>>(new Set());

  const refresh = async () => {
    const r = await fetch(
      `/api/inventario/${invId}/risco/${riskCode}`,
      { cache: "no-store" },
    );
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error ?? "Erro ao carregar");
      return;
    }
    const j = (await r.json()) as RiskDetailResponse;
    setData(j);
    setProbability(j.risk.probability);
    setImpact(j.risk.impact);
    setLegalBasisRef(j.risk.legalBasisRef ?? "");
    setStatus(j.risk.status);
    // Parse do mitigationPlan: pode ter checkboxes "[x] " no começo de
    // cada linha + texto livre no final separado por \n\n
    const plan = j.risk.mitigationPlan ?? "";
    const { recsChecked, free } = parsePlan(plan, j.catalog.help.recomendacoes.length);
    setCheckedRecs(recsChecked);
    setMitigationPlan(free);
  };

  useEffect(() => {
    refresh();
  }, [invId, riskCode]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center space-y-4">
        <p className="text-red-600">{error}</p>
        <Button asChild variant="outline">
          <Link href={`/dashboard/inventario/${invId}/analise-riscos`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar pra Análise de Riscos
          </Link>
        </Button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center text-gray-500">
        Carregando detalhamento do risco...
      </div>
    );
  }

  const { process: proc, catalog, risk } = data;
  const computedSeverity =
    probability && impact ? computeSeverity(probability, impact) : null;

  // Serializa de volta o mitigationPlan: marca checkbox + texto livre
  const buildPlanString = (): string => {
    const lines = catalog.help.recomendacoes.map(
      (rec, i) => `[${checkedRecs.has(i) ? "x" : " "}] ${rec}`,
    );
    const checkedBlock = lines.join("\n");
    const free = mitigationPlan.trim();
    if (!checkedBlock && !free) return "";
    if (!free) return checkedBlock;
    if (!checkedBlock) return free;
    return `${checkedBlock}\n\n${free}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: any = {
        mitigationPlan: buildPlanString(),
        legalBasisRef: legalBasisRef.trim() || null,
        status,
      };
      if (probability && impact) {
        body.probability = probability;
        body.impact = impact;
      } else {
        body.clearSeverity = true;
      }
      const r = await fetch(`/api/inventario/${invId}/risco/${riskCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json();
        toast.error(err.error ?? "Erro ao salvar");
        return;
      }
      toast.success("Detalhamento salvo");
      refresh();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <Button asChild variant="outline" size="sm" className="mt-1">
          <Link href={`/dashboard/inventario/${invId}/analise-riscos`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
        </Button>
        <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2.5 mt-1">
          <ShieldAlert className="h-7 w-7 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {catalog.fullLabel}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Processo: <strong>{proc.serviceName}</strong>
            {proc.setor && <span className="text-gray-500"> · {proc.setor}</span>}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge
              variant="outline"
              className="text-[10px] font-mono text-gray-500 dark:text-gray-400"
              title="Código do risco no catálogo"
            >
              {risk.riskCode}
            </Badge>
            {computedSeverity && (
              <Badge
                variant="outline"
                className={cn("text-[10px]", severityBadgeClass(computedSeverity))}
              >
                Severidade: {severityLabel(computedSeverity)}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              {riskStatusLabel(status)}
            </Badge>
            {risk.autoSuggested && (
              <Badge
                variant="outline"
                className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
              >
                Sugerido auto
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Bloco metodológico (read-only do catálogo) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReadCard
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Fato"
          tone="amber"
          text={catalog.help.fato}
        />
        <ReadCard
          icon={<Scale className="h-4 w-4" />}
          title="Fundamento legal"
          tone="blue"
          text={catalog.help.fundamentoLegal}
        />
        <ReadCard
          icon={<XCircle className="h-4 w-4" />}
          title="Risco identificado"
          tone="red"
          text={catalog.help.riscoIdentificado}
        />
        <ReadCard
          icon={<Lightbulb className="h-4 w-4" />}
          title="Recomendações da metodologia"
          tone="emerald"
          listItems={catalog.help.recomendacoes}
        />
      </div>

      {/* Classificação — matriz interativa */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Classificação do risco
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Escolha Probabilidade e Impacto. A Severidade final é
              calculada automaticamente pela matriz oficial 3×3.
            </p>
          </div>
          <SeverityMatrixPicker
            probability={probability}
            impact={impact}
            onChange={(p, i) => {
              setProbability(p);
              setImpact(i);
            }}
          />
          {computedSeverity && (
            <div className="text-center">
              <Badge
                variant="outline"
                className={cn(
                  "text-base px-3 py-1.5",
                  severityBadgeClass(computedSeverity),
                )}
              >
                Severidade: {severityLabel(computedSeverity)}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plano de mitigação */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Plano de mitigação
            </h2>
          </div>
          {/* Recomendações marcáveis */}
          {catalog.help.recomendacoes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Marque as recomendações da metodologia que serão aplicadas:
              </p>
              {catalog.help.recomendacoes.map((rec, i) => {
                const checked = checkedRecs.has(i);
                return (
                  <label
                    key={i}
                    className={cn(
                      "flex items-start gap-2 text-sm p-2 rounded border cursor-pointer transition-colors",
                      checked
                        ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800"
                        : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(checkedRecs);
                        if (e.target.checked) next.add(i);
                        else next.delete(i);
                        setCheckedRecs(next);
                      }}
                      className="mt-0.5"
                    />
                    <span className="text-gray-900 dark:text-gray-100">{rec}</span>
                  </label>
                );
              })}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Notas adicionais e medidas específicas
            </label>
            <Textarea
              value={mitigationPlan}
              onChange={(e) => setMitigationPlan(e.target.value)}
              rows={4}
              placeholder="Descreva ações concretas, prazos, responsáveis, sistemas envolvidos..."
              maxLength={5000}
            />
          </div>
        </CardContent>
      </Card>

      {/* Referência legal específica + Status */}
      <Card>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Referência legal específica (opcional)
            </label>
            <Input
              value={legalBasisRef}
              onChange={(e) => setLegalBasisRef(e.target.value)}
              placeholder='Ex: "Art. 7º, IX da LGPD; LIA aprovada em 2026-Q1"'
              maxLength={500}
            />
            <p className="text-[10px] text-gray-500">
              Complementa o fundamento geral do catálogo. Útil pra registrar
              parecer jurídico, número de LIA, etc.
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Status do risco
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RISK_STATUS.IDENTIFICADO}>
                  Identificado
                </SelectItem>
                <SelectItem value={RISK_STATUS.EM_MITIGACAO}>
                  Em mitigação
                </SelectItem>
                <SelectItem value={RISK_STATUS.ACEITO}>
                  Aceito pela organização
                </SelectItem>
                <SelectItem value={RISK_STATUS.ELIMINADO}>
                  Eliminado
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Auditoria */}
      <Card className="bg-gray-50/50 dark:bg-gray-900/30">
        <CardContent className="p-4 text-xs text-gray-600 dark:text-gray-400 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <strong>Identificado:</strong>{" "}
            {risk.identifiedBy?.name ?? risk.identifiedBy?.email ?? "—"} em{" "}
            {new Date(risk.identifiedAt).toLocaleString("pt-BR")}
          </div>
          {risk.reviewedAt && (
            <div>
              <strong>Última revisão:</strong>{" "}
              {risk.reviewedBy?.name ?? risk.reviewedBy?.email ?? "—"} em{" "}
              {new Date(risk.reviewedAt).toLocaleString("pt-BR")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-2 sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 -mx-4 px-4 py-3 flex-wrap">
        <Button asChild variant="ghost">
          <Link href={`/dashboard/inventario/${invId}/analise-riscos`}>
            Cancelar
          </Link>
        </Button>
        {/* Adicionar ao Plano de Ação institucional — só se ainda
            IDENTIFICADO (não faz sentido pra ACEITO/ELIMINADO/MITIGAÇÃO). */}
        {risk.status === RISK_STATUS.IDENTIFICADO && (
          <AddToActionPlanButton
            title={`Tratar risco "${formatRiskTitle(risk.riskCode)}" em "${proc.serviceName}"`}
            description={
              probability && impact
                ? `Risco classificado como ${severityLabel(computedSeverity)}, status Identificado. Detalhe da matriz: Probabilidade ${probabilityLabel(probability)}, Impacto ${impactLabel(impact)}.`
                : "Risco identificado sem severidade classificada. Definir matriz Probabilidade × Impacto e plano de mitigação."
            }
            origin="RISCO"
            refRiskId={risk.id}
            refInventoryId={invId}
            priority={
              computedSeverity === "ALTO"
                ? "ALTA"
                : computedSeverity === "MEDIO"
                  ? "MEDIA"
                  : "BAIXA"
            }
          />
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Salvar detalhamento
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Read-only card pra blocos do catálogo
// ============================================================

const TONE_CLS: Record<string, string> = {
  amber: "border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/10",
  blue: "border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/10",
  red: "border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/10",
  emerald:
    "border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/10",
};

const TONE_ICON_CLS: Record<string, string> = {
  amber: "text-amber-600 dark:text-amber-400",
  blue: "text-blue-600 dark:text-blue-400",
  red: "text-red-600 dark:text-red-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
};

function ReadCard({
  icon,
  title,
  tone,
  text,
  listItems,
}: {
  icon: React.ReactNode;
  title: string;
  tone: "amber" | "blue" | "red" | "emerald";
  text?: string;
  listItems?: string[];
}) {
  return (
    <Card className={cn("border", TONE_CLS[tone])}>
      <CardContent className="p-4 space-y-2">
        <div className={cn("flex items-center gap-2", TONE_ICON_CLS[tone])}>
          {icon}
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            {title}
          </h3>
        </div>
        {text && (
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            {text}
          </p>
        )}
        {listItems && listItems.length > 0 && (
          <ul className="text-sm text-gray-800 dark:text-gray-200 space-y-1 list-disc list-inside">
            {listItems.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Matriz interativa Probabilidade × Impacto
// ============================================================

const PROB_ORDER: RiskProbability[] = ["BAIXA", "MEDIA", "ALTA"];
const IMP_ORDER: RiskImpact[] = ["BAIXO", "MEDIO", "ALTO"];

function SeverityMatrixPicker({
  probability,
  impact,
  onChange,
}: {
  probability: RiskProbability | null;
  impact: RiskImpact | null;
  onChange: (p: RiskProbability, i: RiskImpact) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full max-w-md mx-auto border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-24"></th>
              {IMP_ORDER.map((i) => (
                <th
                  key={i}
                  className="text-xs font-medium text-gray-700 dark:text-gray-300 p-1"
                  title={IMPACT_HINTS[i]}
                >
                  {impactLabel(i)}
                </th>
              ))}
            </tr>
            <tr>
              <th></th>
              <th
                colSpan={3}
                className="text-[10px] font-normal text-gray-500 pb-1"
              >
                Impacto →
              </th>
            </tr>
          </thead>
          <tbody>
            {[...PROB_ORDER].reverse().map((p) => (
              <tr key={p}>
                <th
                  className="text-xs font-medium text-gray-700 dark:text-gray-300 text-right pr-2"
                  title={PROBABILITY_HINTS[p]}
                >
                  {probabilityLabel(p)}
                </th>
                {IMP_ORDER.map((i) => {
                  const sev = computeSeverity(p, i);
                  const isSelected = probability === p && impact === i;
                  return (
                    <td key={i} className="p-0">
                      <button
                        type="button"
                        onClick={() => onChange(p, i)}
                        className={cn(
                          "w-full h-12 rounded text-xs font-medium border-2 transition-all",
                          sev === "ALTO"
                            ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                            : sev === "MEDIO"
                              ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
                              : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
                          isSelected
                            ? "ring-2 ring-offset-1 ring-gray-900 dark:ring-white"
                            : "hover:opacity-80",
                        )}
                        title={`Probabilidade ${probabilityLabel(p)} + Impacto ${impactLabel(i)} = ${severityLabel(sev)}`}
                      >
                        {severityLabel(sev)[0]}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <th></th>
              <th
                colSpan={3}
                className="text-[10px] font-normal text-gray-500 pt-1"
              >
                ↑ Probabilidade
              </th>
            </tr>
          </tbody>
        </table>
      </div>
      {probability && impact && (
        <div className="text-center text-xs text-gray-600 dark:text-gray-400">
          Selecionado: <strong>{probabilityLabel(probability)}</strong> ×{" "}
          <strong>{impactLabel(impact)}</strong>
        </div>
      )}
      {!probability && !impact && (
        <p className="text-center text-xs text-gray-500 italic">
          Clique numa célula da matriz pra escolher Probabilidade × Impacto
        </p>
      )}
    </div>
  );
}

// ============================================================
// Parser do mitigationPlan persistido
// ============================================================

interface ParsedPlan {
  recsChecked: Set<number>;
  free: string;
}

function parsePlan(raw: string, recCount: number): ParsedPlan {
  const result: ParsedPlan = { recsChecked: new Set(), free: "" };
  if (!raw) return result;
  const lines = raw.split("\n");
  let consumedRecs = 0;
  const freeLines: string[] = [];
  let inFreeBlock = false;
  for (const line of lines) {
    if (!inFreeBlock) {
      const m = line.match(/^\[(x| )\]\s+/i);
      if (m && consumedRecs < recCount) {
        if (m[1].toLowerCase() === "x") result.recsChecked.add(consumedRecs);
        consumedRecs++;
        continue;
      }
      // Acabou bloco de checkboxes — entra no texto livre
      inFreeBlock = true;
    }
    freeLines.push(line);
  }
  result.free = freeLines.join("\n").replace(/^\n+/, "").trim();
  return result;
}
