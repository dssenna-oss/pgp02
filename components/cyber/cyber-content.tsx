"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Loader2,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  type CyberControl,
  type CyberCategory,
  cyberFunctionLabel,
} from "@/lib/cyber-catalog";
import {
  type CyberAnswerDTO,
  type CyberScore,
  type CyberStats,
  cyberLevelLabel,
} from "@/lib/cyber-helpers";

interface ApiResponse {
  catalog: {
    controls: CyberControl[];
    categories: CyberCategory[];
  };
  answers: CyberAnswerDTO[];
  score: CyberScore;
  stats: CyberStats;
}

export default function CyberContent() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFn, setOpenFn] = useState<string | null>("ID");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/cyber", { cache: "no-store" });
        if (r.ok) setData(await r.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      </div>

      {/* HERO SCORE */}
      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
          <ScoreCircle score={score.overall} />
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold">Score atual de maturidade</h2>
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
            </div>
            <p className="text-sm text-muted-foreground">
              {score.answered === 0 ? (
                <>Nenhum controle respondido ainda. Comece pela função <strong>Identificar</strong>.</>
              ) : (
                <>Sua organização está no estágio <strong>{cyberLevelLabel(score.level)}</strong>.</>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
              {score.byFunction.map((f) => (
                <FunctionTile key={f.function} fn={f} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AVISO Editor em Construção */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4 flex items-start gap-3">
        <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Editor de respostas em construção
          </p>
          <p className="text-amber-800 dark:text-amber-300 mt-1">
            A tela de responder cada controle (com toggle modo guiado/lista, tooltips, opções "delegar à TI" e "não se aplica", e pré-população automática dos checkpoints anteriores) chega na <strong>Fatia 2</strong>. Por enquanto, você consegue ver o catálogo completo organizado por função.
          </p>
        </div>
      </div>

      {/* CATÁLOGO POR FUNÇÃO (read-only nesta fatia) */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Catálogo de controles</h2>
        {(["ID", "PR", "DE", "RS", "RC"] as const).map((fnCode) => {
          const fnScore = score.byFunction.find((s) => s.function === fnCode);
          const isOpen = openFn === fnCode;
          const fnControls = catalog.controls.filter((c) => c.function === fnCode);
          const fnCategories = catalog.categories.filter((c) => c.function === fnCode);
          return (
            <Card key={fnCode}>
              <button
                type="button"
                onClick={() => setOpenFn(isOpen ? null : fnCode)}
                className="w-full p-4 flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-2.5 h-10 rounded-full ${functionColor(fnCode, fnScore?.score ?? 0)}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-2">
                      {fnCode}. {cyberFunctionLabel(fnCode)}
                      <span className="text-xs text-muted-foreground font-normal">
                        · {fnControls.length} controles · {fnCategories.length} categorias
                      </span>
                    </div>
                    {fnScore && fnScore.answered > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {fnScore.answered}/{fnScore.totalControls} respondidos · {fnScore.aderente} aderentes · {fnScore.parcial} parciais · {fnScore.naoAderente} não aderentes
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-bold ${scoreColor(fnScore?.score ?? 0)}`}>
                      {fnScore?.score ?? 0}%
                    </div>
                    <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-1">
                      <div
                        className={`h-full rounded-full ${functionColor(fnCode, fnScore?.score ?? 0)}`}
                        style={{ width: `${fnScore?.score ?? 0}%` }}
                      />
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
                    const catControls = fnControls.filter((c) =>
                      c.code.startsWith(cat.code + "-")
                    );
                    if (catControls.length === 0) return null;
                    return (
                      <div key={cat.code} className="space-y-1">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-3">
                          {cat.code} — {cat.label}{" "}
                          <span className="font-normal text-muted-foreground">
                            ({cat.description})
                          </span>
                        </div>
                        {catControls.map((c) => {
                          const a = data.answers.find(
                            (x) => x.controlCode === c.code
                          );
                          return (
                            <div
                              key={c.code}
                              className="flex items-start gap-2 px-2 py-1.5 rounded text-xs hover:bg-slate-50 dark:hover:bg-slate-900/40"
                            >
                              <AnswerIcon aderencia={a?.aderencia ?? null} />
                              <span className="font-mono text-slate-500 flex-shrink-0">
                                {c.code}
                              </span>
                              <span className="text-[10px] flex-shrink-0">
                                {c.audience === "JURIDICO" && "👤"}
                                {c.audience === "TI" && "💻"}
                                {c.audience === "AMBOS" && "🤝"}
                              </span>
                              <span className="flex-1 text-slate-700 dark:text-slate-300">
                                {c.question}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="text-center text-xs text-muted-foreground py-4">
        80 controles · 5 funções · 23 categorias · Framework NIST CSF v1.1
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function ScoreCircle({ score }: { score: number }) {
  const dashoffset = 264 - (264 * score) / 100;
  return (
    <div className="text-center">
      <div className="relative w-32 h-32 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="#e2e8f0"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="url(#cyberGrad)"
            strokeWidth="10"
            fill="none"
            strokeDasharray="264"
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
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

function FunctionTile({
  fn,
}: {
  fn: { function: string; label: string; score: number };
}) {
  return (
    <div
      className={`text-center p-2 rounded-lg ${tileBg(fn.score)}`}
    >
      <div className="text-xs text-muted-foreground">{fn.label}</div>
      <div className={`text-lg font-bold ${scoreColor(fn.score)}`}>
        {fn.score}%
      </div>
    </div>
  );
}

function AnswerIcon({ aderencia }: { aderencia: string | null }) {
  switch (aderencia) {
    case "ADERENTE":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />;
    case "PARCIAL":
      return <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />;
    case "NAO_ADERENTE":
      return <XCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0 mt-0.5" />;
    case "DELEGADO_TI":
      return <ArrowRight className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />;
    default:
      return <div className="h-3.5 w-3.5 rounded-full border border-slate-300 dark:border-slate-600 flex-shrink-0 mt-0.5" />;
  }
}

function functionColor(fn: string, score: number): string {
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

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-700 dark:text-emerald-300";
  if (score >= 40) return "text-amber-700 dark:text-amber-300";
  if (score === 0) return "text-slate-500";
  return "text-red-700 dark:text-red-300";
}
