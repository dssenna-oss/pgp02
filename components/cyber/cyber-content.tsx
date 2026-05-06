"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Shield,
  Loader2,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  History,
  FileDown,
  Filter,
  Search,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  type CyberControl,
  type CyberCategory,
  type CyberFunction,
  type CyberAudience,
  cyberFunctionLabel,
  cyberAudienceLabel,
  cyberAudienceIcon,
} from "@/lib/cyber-catalog";
import {
  type CyberAnswerDTO,
  type CyberAderencia,
  type CyberScore,
  type CyberStats,
  cyberLevelLabel,
  cyberAderenciaLabel,
} from "@/lib/cyber-helpers";

interface ApiResponse {
  catalog: { controls: CyberControl[]; categories: CyberCategory[] };
  answers: CyberAnswerDTO[];
  score: CyberScore;
  stats: CyberStats;
}

interface PrepopulateResponse {
  suggestions: Array<{
    controlCode: string;
    suggestedAderencia: "ADERENTE" | "PARCIAL";
    evidence: string;
    evidenceFrom: string;
    confidence: "alta" | "media";
  }>;
  summary: { total: number; bySource: Record<string, number>; alreadyAnswered: number };
}

type ViewMode = "list" | "guided";
type AudienceFilter = "all" | CyberAudience;
type StatusFilter = "all" | "answered" | "unanswered" | CyberAderencia;

export default function CyberContent() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ViewMode>("list");
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [openFn, setOpenFn] = useState<string | null>("ID");

  // Pré-população
  const [prepopulateData, setPrepopulateData] = useState<PrepopulateResponse | null>(null);
  const [applyingPrepopulate, setApplyingPrepopulate] = useState(false);

  // Modais
  const [showSnapshots, setShowSnapshots] = useState(false);

  // Modo guiado
  const [guidedIndex, setGuidedIndex] = useState(0);

  useEffect(() => {
    void loadData();
    void loadPrepopulate();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const r = await fetch("/api/cyber", { cache: "no-store" });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }

  async function loadPrepopulate() {
    try {
      const r = await fetch("/api/cyber/prepopulate", { cache: "no-store" });
      if (r.ok) setPrepopulateData(await r.json());
    } catch {
      // silencioso
    }
  }

  async function applyPrepopulate() {
    setApplyingPrepopulate(true);
    try {
      const r = await fetch("/api/cyber/prepopulate", { method: "POST" });
      if (!r.ok) {
        toast.error("Erro ao aplicar pré-população");
        return;
      }
      const j = await r.json();
      toast.success(`${j.created} resposta(s) pré-populada(s) automaticamente`);
      await loadData();
      await loadPrepopulate();
    } finally {
      setApplyingPrepopulate(false);
    }
  }

  async function saveAnswer(
    controlCode: string,
    payload: {
      aderencia: CyberAderencia;
      pontoMelhoria?: string;
      evidence?: string;
      delegatedToId?: string;
    }
  ) {
    const r = await fetch(`/api/cyber/answer/${controlCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao salvar");
      return false;
    }
    await loadData();
    return true;
  }

  async function deleteAnswer(controlCode: string) {
    const r = await fetch(`/api/cyber/answer/${controlCode}`, { method: "DELETE" });
    if (r.ok) await loadData();
  }

  function downloadXlsx() {
    window.open("/api/cyber/export", "_blank");
  }

  // Filtragem
  const filteredControls = useMemo(() => {
    if (!data) return [] as CyberControl[];
    const answersByCode = new Map(data.answers.map((a) => [a.controlCode, a]));
    const q = search.trim().toLowerCase();
    return data.catalog.controls.filter((c) => {
      if (audienceFilter !== "all" && c.audience !== audienceFilter) return false;
      const a = answersByCode.get(c.code);
      if (statusFilter === "answered" && !a) return false;
      if (statusFilter === "unanswered" && a) return false;
      if (
        statusFilter !== "all" &&
        statusFilter !== "answered" &&
        statusFilter !== "unanswered" &&
        a?.aderencia !== statusFilter
      ) {
        return false;
      }
      if (q) {
        const hay = `${c.code} ${c.question} ${c.example}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, audienceFilter, statusFilter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Carregando avaliação…
      </div>
    );
  }
  if (!data) {
    return (
      <div className="container mx-auto py-12 text-center text-muted-foreground">
        Não foi possível carregar.
      </div>
    );
  }

  const { score, stats, catalog } = data;
  const answersByCode = new Map(data.answers.map((a) => [a.controlCode, a]));

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-5">
      {/* HEADER */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 dark:bg-indigo-950/40 p-2.5 rounded-lg">
            <Shield className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Maturidade Cibernética</h1>
            <p className="text-sm text-muted-foreground">
              Avaliação NIST CSF · {catalog.controls.length} controles em 5 funções
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSnapshots(true)} className="gap-1">
            <History className="h-4 w-4" />
            Snapshots
          </Button>
          <Button variant="outline" size="sm" onClick={downloadXlsx} className="gap-1">
            <FileDown className="h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* HERO SCORE */}
      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
          <ScoreCircle score={score.overall} />
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold">Score atual</h2>
              <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
                {cyberLevelLabel(score.level)}
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full">
                {score.answered}/{score.totalControls} respondidos
              </span>
              {stats.delegatedToTi > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                  {stats.delegatedToTi} delegados à TI
                </span>
              )}
              {stats.blockedQuestions > 0 && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                  {stats.blockedQuestions} não aderentes
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
              {score.byFunction.map((f) => (
                <FunctionTile key={f.function} fn={f} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PRÉ-POPULAÇÃO BANNER */}
      {prepopulateData && prepopulateData.suggestions.length > 0 && (
        <Card className="border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-900">
          <CardContent className="p-4 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-violet-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-violet-900 dark:text-violet-200 text-sm">
                {prepopulateData.suggestions.length} sugestão(ões) de pré-população disponível(eis)
              </p>
              <p className="text-xs text-violet-800 dark:text-violet-300 mt-1">
                A partir de dados que você já preencheu em outros checkpoints (
                {Object.entries(prepopulateData.summary.bySource)
                  .map(([src, n]) => `${n} de ${prepopulateBadgeLabel(src)}`)
                  .join(" · ")}
                ), podemos pré-marcar automaticamente esses controles.
              </p>
            </div>
            <Button
              size="sm"
              onClick={applyPrepopulate}
              disabled={applyingPrepopulate}
              className="bg-violet-600 hover:bg-violet-700 gap-1"
            >
              {applyingPrepopulate ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Aplicar pré-população
            </Button>
          </CardContent>
        </Card>
      )}

      {/* TOGGLE MODO + FILTROS */}
      <Card>
        <CardContent className="p-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-medium">Como responder?</span>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1 flex">
              <button
                onClick={() => setMode("list")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs transition",
                  mode === "list"
                    ? "bg-white dark:bg-slate-900 shadow font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50"
                )}
              >
                📋 Modo lista
              </button>
              <button
                onClick={() => {
                  setMode("guided");
                  setGuidedIndex(0);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs transition",
                  mode === "guided"
                    ? "bg-white dark:bg-slate-900 shadow font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50"
                )}
              >
                🧭 Modo guiado
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <Filter className="h-3 w-3" /> Público:
            </span>
            {(["all", "JURIDICO", "TI", "AMBOS"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAudienceFilter(a)}
                className={cn(
                  "px-2.5 py-1 rounded-full transition",
                  audienceFilter === a
                    ? "bg-violet-600 text-white"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                )}
              >
                {a === "all" ? "Tudo" : `${cyberAudienceIcon(a)} ${cyberAudienceLabel(a)}`}
              </button>
            ))}
          </div>
        </CardContent>

        {/* Search + Status filter */}
        <CardContent className="px-3 pb-3 -mt-1 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Buscar por código, palavra-chave…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-8 px-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="all">Todos os status</option>
            <option value="answered">Respondidos</option>
            <option value="unanswered">Não respondidos</option>
            <option value="ADERENTE">Aderentes</option>
            <option value="PARCIAL">Parciais</option>
            <option value="NAO_ADERENTE">Não aderentes</option>
            <option value="NAO_APLICA">Não se aplica</option>
            <option value="DELEGADO_TI">Delegados à TI</option>
          </select>
          <span className="text-xs text-muted-foreground">
            {filteredControls.length} de {catalog.controls.length}
          </span>
        </CardContent>
      </Card>

      {/* CONTEÚDO PRINCIPAL */}
      {mode === "list" ? (
        <ListMode
          catalog={catalog}
          controls={filteredControls}
          answersByCode={answersByCode}
          score={score}
          openFn={openFn}
          setOpenFn={setOpenFn}
          onSave={saveAnswer}
          onDelete={deleteAnswer}
        />
      ) : (
        <GuidedMode
          controls={filteredControls}
          answersByCode={answersByCode}
          index={guidedIndex}
          setIndex={setGuidedIndex}
          onSave={saveAnswer}
        />
      )}

      {/* Modal Snapshots */}
      <SnapshotsModal
        open={showSnapshots}
        onClose={() => setShowSnapshots(false)}
        onCreated={() => loadData()}
      />
    </div>
  );
}

// ============================================================
// MODO LISTA
// ============================================================

function ListMode({
  catalog,
  controls,
  answersByCode,
  score,
  openFn,
  setOpenFn,
  onSave,
  onDelete,
}: {
  catalog: { controls: CyberControl[]; categories: CyberCategory[] };
  controls: CyberControl[];
  answersByCode: Map<string, CyberAnswerDTO>;
  score: CyberScore;
  openFn: string | null;
  setOpenFn: (v: string | null) => void;
  onSave: (
    code: string,
    payload: {
      aderencia: CyberAderencia;
      pontoMelhoria?: string;
      evidence?: string;
      delegatedToId?: string;
    }
  ) => Promise<boolean>;
  onDelete: (code: string) => Promise<void>;
}) {
  // Agrupa por função
  const byFunction = useMemo(() => {
    const m: Record<CyberFunction, CyberControl[]> = { ID: [], PR: [], DE: [], RS: [], RC: [] };
    for (const c of controls) m[c.function].push(c);
    return m;
  }, [controls]);

  return (
    <div className="space-y-3">
      {(["ID", "PR", "DE", "RS", "RC"] as const).map((fnCode) => {
        const fnScore = score.byFunction.find((s) => s.function === fnCode);
        const fnControls = byFunction[fnCode];
        if (fnControls.length === 0) return null;
        const isOpen = openFn === fnCode;
        const fnCategories = catalog.categories.filter((k) => k.function === fnCode);
        return (
          <Card key={fnCode}>
            <button
              type="button"
              onClick={() => setOpenFn(isOpen ? null : fnCode)}
              className="w-full p-4 flex items-center justify-between gap-3 text-left"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-2.5 h-10 rounded-full ${functionColor(fnScore?.score ?? 0)}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold flex items-center gap-2">
                    {fnCode}. {cyberFunctionLabel(fnCode)}
                    <span className="text-xs text-muted-foreground font-normal">
                      · {fnControls.length} de {fnScore?.totalControls ?? 0} no filtro
                    </span>
                  </div>
                  {fnScore && fnScore.answered > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {fnScore.answered}/{fnScore.totalControls} respondidos · {fnScore.aderente} aderentes · {fnScore.parcial} parciais · {fnScore.naoAderente} não aderentes
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-bold ${scoreTextColor(fnScore?.score ?? 0)}`}>
                    {fnScore?.score ?? 0}%
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>
            {isOpen && (
              <CardContent className="border-t pt-4 space-y-2">
                {fnCategories.map((cat) => {
                  const catControls = fnControls.filter((c) => c.code.startsWith(cat.code + "-"));
                  if (catControls.length === 0) return null;
                  return (
                    <div key={cat.code} className="space-y-2">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-3 sticky top-0 bg-white dark:bg-slate-900 py-1">
                        {cat.code} — {cat.label}
                      </div>
                      {catControls.map((c) => (
                        <ControlRow
                          key={c.code}
                          control={c}
                          answer={answersByCode.get(c.code) ?? null}
                          onSave={onSave}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================
// CONTROL ROW (modo lista)
// ============================================================

function ControlRow({
  control,
  answer,
  onSave,
  onDelete,
}: {
  control: CyberControl;
  answer: CyberAnswerDTO | null;
  onSave: (
    code: string,
    payload: {
      aderencia: CyberAderencia;
      pontoMelhoria?: string;
      evidence?: string;
      delegatedToId?: string;
    }
  ) => Promise<boolean>;
  onDelete: (code: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pontoMelhoria, setPontoMelhoria] = useState(answer?.pontoMelhoria ?? "");
  const [evidence, setEvidence] = useState(answer?.evidence ?? "");
  const [saving, setSaving] = useState(false);

  // Re-sincroniza quando o answer muda externamente
  useEffect(() => {
    setPontoMelhoria(answer?.pontoMelhoria ?? "");
    setEvidence(answer?.evidence ?? "");
  }, [answer?.id, answer?.pontoMelhoria, answer?.evidence]);

  async function pickAderencia(a: CyberAderencia) {
    setSaving(true);
    const payload: Parameters<typeof onSave>[1] = { aderencia: a };
    if (pontoMelhoria.trim()) payload.pontoMelhoria = pontoMelhoria;
    if (evidence.trim()) payload.evidence = evidence;
    if (a === "DELEGADO_TI" && answer?.delegatedTo?.id) {
      payload.delegatedToId = answer.delegatedTo.id;
    }
    await onSave(control.code, payload);
    setSaving(false);
  }

  async function saveText() {
    if (!answer) return;
    setSaving(true);
    await onSave(control.code, {
      aderencia: answer.aderencia,
      pontoMelhoria: pontoMelhoria.trim() || undefined,
      evidence: evidence.trim() || undefined,
    });
    setSaving(false);
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-2",
        answer?.aderencia === "ADERENTE" && "border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10 dark:border-emerald-900",
        answer?.aderencia === "PARCIAL" && "border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-900",
        answer?.aderencia === "NAO_ADERENTE" && "border-red-200 bg-red-50/30 dark:bg-red-950/10 dark:border-red-900",
        answer?.aderencia === "NAO_APLICA" && "border-slate-200 bg-slate-50 dark:bg-slate-900/30",
        answer?.aderencia === "DELEGADO_TI" && "border-blue-200 bg-blue-50/30 dark:bg-blue-950/10 dark:border-blue-900",
        !answer && "border-slate-200 dark:border-slate-700"
      )}
    >
      <div className="flex items-start gap-2">
        <span className="text-[10px] flex-shrink-0">{cyberAudienceIcon(control.audience)}</span>
        <span className="font-mono text-[10px] text-slate-500 flex-shrink-0 mt-0.5">{control.code}</span>
        <div className="flex-1 min-w-0">
          <QuestionText control={control} />
          <p className="text-xs text-muted-foreground mt-1">
            <strong>Ex.:</strong> {control.example}
            {answer?.evidenceFrom && (
              <span className="ml-2 text-emerald-700 dark:text-emerald-300 italic">
                ✨ pré-populado de {prepopulateBadgeLabel(answer.evidenceFrom)}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          {expanded ? "−" : "+"}
        </button>
      </div>

      {/* Botões de aderência */}
      <div className="flex flex-wrap gap-1.5 ml-7">
        {(
          [
            { val: "ADERENTE", label: "✓ Aderente", color: "emerald" },
            { val: "PARCIAL", label: "⚠ Parcial", color: "amber" },
            { val: "NAO_ADERENTE", label: "✗ Não aderente", color: "red" },
            { val: "NAO_APLICA", label: "— Não se aplica", color: "slate" },
            { val: "DELEGADO_TI", label: "⏩ Delegar à TI", color: "blue" },
          ] as const
        ).map(({ val, label, color }) => {
          const selected = answer?.aderencia === val;
          return (
            <button
              key={val}
              disabled={saving}
              onClick={() => pickAderencia(val as CyberAderencia)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs border transition disabled:opacity-50",
                selected
                  ? answerSelectedClass(color)
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              {label}
            </button>
          );
        })}
        {answer && (
          <button
            disabled={saving}
            onClick={() => onDelete(control.code)}
            className="text-xs text-muted-foreground hover:text-red-600 px-2"
            title="Limpar resposta"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Expandido: ponto melhoria + evidência */}
      {(expanded || answer?.aderencia === "NAO_ADERENTE" || answer?.aderencia === "PARCIAL") && answer && (
        <div className="ml-7 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {(answer.aderencia === "NAO_ADERENTE" || answer.aderencia === "PARCIAL") && (
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Ponto de melhoria</Label>
              <Textarea
                rows={2}
                value={pontoMelhoria}
                onChange={(e) => setPontoMelhoria(e.target.value)}
                onBlur={saveText}
                placeholder="Qual é o gap específico?"
                className="text-xs"
              />
            </div>
          )}
          {(answer.aderencia === "ADERENTE" || answer.aderencia === "PARCIAL") && (
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Evidência</Label>
              <Textarea
                rows={2}
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                onBlur={saveText}
                placeholder="O que comprova essa aderência? (link, ata, planilha, política…)"
                className="text-xs"
              />
            </div>
          )}
        </div>
      )}

      {/* NIST ref pequeno */}
      {expanded && (
        <p className="ml-7 text-[10px] text-slate-400 font-mono">{control.nistRef}</p>
      )}
    </div>
  );
}

// ============================================================
// MODO GUIADO
// ============================================================

function GuidedMode({
  controls,
  answersByCode,
  index,
  setIndex,
  onSave,
}: {
  controls: CyberControl[];
  answersByCode: Map<string, CyberAnswerDTO>;
  index: number;
  setIndex: (n: number) => void;
  onSave: (
    code: string,
    payload: {
      aderencia: CyberAderencia;
      pontoMelhoria?: string;
      evidence?: string;
      delegatedToId?: string;
    }
  ) => Promise<boolean>;
}) {
  const total = controls.length;
  const safeIndex = Math.min(Math.max(0, index), Math.max(0, total - 1));
  const c = controls[safeIndex];
  const answer = c ? answersByCode.get(c.code) ?? null : null;
  const [pontoMelhoria, setPontoMelhoria] = useState(answer?.pontoMelhoria ?? "");
  const [evidence, setEvidence] = useState(answer?.evidence ?? "");
  const [saving, setSaving] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    setPontoMelhoria(answer?.pontoMelhoria ?? "");
    setEvidence(answer?.evidence ?? "");
    setShowExamples(false);
  }, [c?.code, answer?.id, answer?.pontoMelhoria, answer?.evidence]);

  if (!c) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum controle no filtro atual.
        </CardContent>
      </Card>
    );
  }

  async function pickAderencia(a: CyberAderencia) {
    setSaving(true);
    const payload: Parameters<typeof onSave>[1] = { aderencia: a };
    if (pontoMelhoria.trim()) payload.pontoMelhoria = pontoMelhoria;
    if (evidence.trim()) payload.evidence = evidence;
    await onSave(c.code, payload);
    setSaving(false);
  }

  return (
    <Card className="border-violet-200">
      <CardContent className="p-6 max-w-3xl mx-auto">
        {/* Progresso */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>
            Pergunta <strong className="text-violet-700">{safeIndex + 1}</strong> de <strong>{total}</strong>
          </span>
          <span>
            <span className="font-mono">{c.code}</span> · {cyberFunctionLabel(c.function)}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
            style={{ width: `${((safeIndex + 1) / total) * 100}%` }}
          />
        </div>

        {/* Audience */}
        <div className="mb-3">
          <span className="text-[10px] bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 px-1.5 py-0.5 rounded font-semibold">
            {cyberAudienceIcon(c.audience)} {cyberAudienceLabel(c.audience)}
          </span>
          {answer?.evidenceFrom && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium ml-2">
              ✨ pré-populado de {prepopulateBadgeLabel(answer.evidenceFrom)}
            </span>
          )}
        </div>

        {/* Pergunta */}
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 leading-relaxed">
          <QuestionText control={c} />
        </h3>

        {/* Dica */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400 px-4 py-3 rounded-r mb-4">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            <strong>💡 Dica:</strong> {c.example}
          </p>
        </div>

        <details
          open={showExamples}
          onToggle={(e) => setShowExamples((e.target as HTMLDetailsElement).open)}
          className="mb-4"
        >
          <summary className="cursor-pointer text-xs text-violet-700 dark:text-violet-300 hover:underline">
            Ver referência NIST original
          </summary>
          <p className="text-xs text-muted-foreground italic mt-2 font-mono">{c.nistRef}</p>
        </details>

        {/* Resposta */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {(
            [
              { val: "ADERENTE", icon: "✓", label: "Aderente", color: "emerald" },
              { val: "PARCIAL", icon: "⚠", label: "Parcial", color: "amber" },
              { val: "NAO_ADERENTE", icon: "✗", label: "Não aderente", color: "red" },
              { val: "NAO_APLICA", icon: "—", label: "Não se aplica", color: "slate" },
              { val: "DELEGADO_TI", icon: "⏩", label: "Delegar à TI", color: "blue" },
            ] as const
          ).map(({ val, icon, label, color }) => {
            const selected = answer?.aderencia === val;
            return (
              <button
                key={val}
                disabled={saving}
                onClick={() => pickAderencia(val as CyberAderencia)}
                className={cn(
                  "p-3 rounded-lg border-2 text-center transition disabled:opacity-50",
                  selected
                    ? bigAnswerSelectedClass(color)
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
                )}
              >
                <div className="text-2xl">{icon}</div>
                <div className="text-xs font-medium mt-1">{label}</div>
              </button>
            );
          })}
        </div>

        {/* Texto adicional quando aplicável */}
        {answer && (answer.aderencia === "NAO_ADERENTE" || answer.aderencia === "PARCIAL") && (
          <div className="mb-4 space-y-1">
            <Label className="text-xs">Ponto de melhoria</Label>
            <Textarea
              rows={2}
              value={pontoMelhoria}
              onChange={(e) => setPontoMelhoria(e.target.value)}
              onBlur={() => onSave(c.code, { aderencia: answer.aderencia, pontoMelhoria, evidence })}
              placeholder="Qual o gap específico?"
              className="text-sm"
            />
          </div>
        )}
        {answer && (answer.aderencia === "ADERENTE" || answer.aderencia === "PARCIAL") && (
          <div className="mb-4 space-y-1">
            <Label className="text-xs">Evidência</Label>
            <Textarea
              rows={2}
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              onBlur={() => onSave(c.code, { aderencia: answer.aderencia, pontoMelhoria, evidence })}
              placeholder="O que comprova?"
              className="text-sm"
            />
          </div>
        )}

        {/* Navegação */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          <Button
            variant="outline"
            disabled={safeIndex === 0}
            onClick={() => setIndex(safeIndex - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">{saving ? "💾 Salvando…" : ""}</span>
          <Button
            disabled={safeIndex >= total - 1}
            onClick={() => setIndex(safeIndex + 1)}
            className="gap-1 bg-violet-600 hover:bg-violet-700"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// QUESTION TEXT — substitui termos técnicos por <span> com tooltip
// ============================================================

function QuestionText({ control }: { control: CyberControl }) {
  const text = control.question;
  if (!control.technicalTerms || control.technicalTerms.length === 0) {
    return <>{text}</>;
  }
  // Quebra a string nos termos técnicos
  const parts: Array<{ text: string; tooltip?: string }> = [{ text }];
  for (const t of control.technicalTerms) {
    const next: typeof parts = [];
    for (const p of parts) {
      if (p.tooltip) {
        next.push(p);
        continue;
      }
      const segs = p.text.split(t.term);
      for (let i = 0; i < segs.length; i++) {
        next.push({ text: segs[i] });
        if (i < segs.length - 1) next.push({ text: t.term, tooltip: t.tooltip });
      }
    }
    parts.length = 0;
    parts.push(...next);
  }
  return (
    <>
      {parts.map((p, i) =>
        p.tooltip ? (
          <span
            key={i}
            title={p.tooltip}
            className="border-b border-dotted border-violet-500 cursor-help inline-flex items-center gap-0.5"
          >
            {p.text}
            <HelpCircle className="h-3 w-3 text-violet-500 inline" />
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}

// ============================================================
// SNAPSHOTS MODAL
// ============================================================

interface SnapshotItem {
  id: string;
  name: string;
  description: string | null;
  score: any;
  createdBy: { name: string | null; email: string } | null;
  createdAt: string;
}

function SnapshotsModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [items, setItems] = useState<SnapshotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open]);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/cyber/snapshot", { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        setItems(j.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    if (!name.trim()) {
      toast.error("Informe um nome");
      return;
    }
    setCreating(true);
    try {
      const r = await fetch("/api/cyber/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao criar");
        return;
      }
      toast.success("Snapshot criado");
      setName("");
      setDescription("");
      await load();
      onCreated();
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remover este snapshot? Não dá pra desfazer.")) return;
    const r = await fetch(`/api/cyber/snapshot/${id}`, { method: "DELETE" });
    if (r.ok) await load();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-violet-600" />
            Snapshots da Maturidade
          </DialogTitle>
          <DialogDescription>
            Congele o estado atual da avaliação pra comparar evolução ao longo do tempo
            ou exportar versões históricas pra auditoria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 border-b pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_3fr] gap-2">
            <Input
              placeholder="Nome (ex.: Q1 2026)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button onClick={create} disabled={creating} className="w-full sm:w-auto">
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Criar snapshot do estado atual
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
              Carregando…
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              Nenhum snapshot criado ainda.
            </div>
          ) : (
            items.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold flex items-center gap-2">
                        {s.name}
                        {typeof (s.score as any)?.overall === "number" && (
                          <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                            score {(s.score as any).overall}/100
                          </span>
                        )}
                      </div>
                      {s.description && (
                        <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(s.createdAt).toLocaleString("pt-BR")} ·{" "}
                        {s.createdBy?.name ?? s.createdBy?.email ?? "—"}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(s.id)}
                      className="text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Helpers visuais
// ============================================================

function ScoreCircle({ score }: { score: number }) {
  const dashoffset = 264 - (264 * score) / 100;
  return (
    <div className="text-center">
      <div className="relative w-32 h-32 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" stroke="#e2e8f0" strokeWidth="10" fill="none" />
          <circle
            cx="50" cy="50" r="42"
            stroke="url(#cyberGrad)" strokeWidth="10" fill="none"
            strokeDasharray="264" strokeDashoffset={dashoffset} strokeLinecap="round"
          />
          <defs>
            <linearGradient id="cyberGrad">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold tabular-nums">{score}</div>
          <div className="text-[10px] text-muted-foreground">de 100</div>
        </div>
      </div>
    </div>
  );
}

function FunctionTile({ fn }: { fn: { function: string; label: string; score: number } }) {
  return (
    <div className={`text-center p-2 rounded-lg ${tileBg(fn.score)}`}>
      <div className="text-xs text-muted-foreground">{fn.label}</div>
      <div className={`text-lg font-bold ${scoreTextColor(fn.score)}`}>{fn.score}%</div>
    </div>
  );
}

function functionColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function tileBg(score: number): string {
  if (score >= 70) return "bg-emerald-50 dark:bg-emerald-950/30";
  if (score >= 40) return "bg-amber-50 dark:bg-amber-950/30";
  if (score === 0) return "bg-slate-50 dark:bg-slate-900/30";
  return "bg-red-50 dark:bg-red-950/30";
}

function scoreTextColor(score: number): string {
  if (score >= 70) return "text-emerald-700 dark:text-emerald-300";
  if (score >= 40) return "text-amber-700 dark:text-amber-300";
  if (score === 0) return "text-slate-500";
  return "text-red-700 dark:text-red-300";
}

function answerSelectedClass(color: string): string {
  switch (color) {
    case "emerald":
      return "bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700 font-medium";
    case "amber":
      return "bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700 font-medium";
    case "red":
      return "bg-red-100 text-red-800 border-red-400 dark:bg-red-950/60 dark:text-red-200 dark:border-red-700 font-medium";
    case "blue":
      return "bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700 font-medium";
    case "slate":
    default:
      return "bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 font-medium";
  }
}

function bigAnswerSelectedClass(color: string): string {
  switch (color) {
    case "emerald":
      return "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200";
    case "amber":
      return "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200";
    case "red":
      return "border-red-400 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200";
    case "blue":
      return "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200";
    case "slate":
    default:
      return "border-slate-400 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

function prepopulateBadgeLabel(src: string): string {
  switch (src) {
    case "GAP":         return "GAP Analysis";
    case "INCIDENTES":  return "Incidentes";
    case "CAPACITACAO": return "Capacitação";
    case "TERCEIROS":   return "Terceiros";
    default:            return src;
  }
}
