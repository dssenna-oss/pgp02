"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  Printer,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type MaturityResult,
  maturityLevelLabel,
  maturityLevelBadgeClass,
  phaseStatusBadgeClass,
} from "@/lib/maturidade-pgp";

export default function MaturidadePgpContent() {
  const [data, setData] = useState<MaturityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/maturidade-pgp", { cache: "no-store" });
        if (r.status === 403) {
          setForbidden(true);
          return;
        }
        if (r.ok) {
          setData(await r.json());
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Carregando painel de maturidade…
      </div>
    );
  }

  if (forbidden) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-amber-500" />
          <p className="text-lg font-medium">Acesso restrito ao DPO</p>
          <p className="text-sm text-muted-foreground">
            Esta tela é trabalhada pelo Encarregado da organização.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Erro ao carregar dados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      {/* Header com explicação institucional */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-violet-100 dark:bg-violet-950/40 p-2 rounded-lg">
            <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Maturidade do PGP
            </h1>
            <p className="text-sm text-muted-foreground">
              Painel executivo do Programa de Governança em Privacidade
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            window.open("/dashboard/maturidade-pgp/pdf?autoprint=1", "_blank")
          }
          title="Abre versão pra impressão / salvar como PDF"
        >
          <Printer className="h-4 w-4 mr-2" />
          Exportar relatório executivo (PDF)
        </Button>
      </div>

      {/* Hero — Score + Nível */}
      <Card className="border-2 border-violet-200 dark:border-violet-900 bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex flex-col items-center md:items-start">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Score consolidado
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "text-6xl font-bold tabular-nums",
                    data.score >= 70
                      ? "text-emerald-600 dark:text-emerald-400"
                      : data.score >= 50
                        ? "text-blue-600 dark:text-blue-400"
                        : data.score >= 25
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400",
                  )}
                >
                  {data.score}
                </span>
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Badge
                variant="outline"
                className={cn("text-sm px-3 py-1", maturityLevelBadgeClass(data.levelColor))}
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                Nível {maturityLevelLabel(data.level)}
              </Badge>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {data.levelDescription}
              </p>
              <p className="text-xs italic text-muted-foreground">
                <strong>O PGP é um programa contínuo</strong> (não um projeto). Esta tela mostra o estado atual do programa e evolui à medida que os instrumentos são preenchidos e revisados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pilares do score */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-violet-500" />
          Composição do score
          <span className="text-xs font-normal text-muted-foreground">
            — pesos: Diagnóstico 40% · Plano 20% · Políticas 15% · RIPDs 15% · Terceiros 10%
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {data.pillars.map((p) => (
            <Card key={p.key} className="border-l-4 border-l-violet-400">
              <CardContent className="p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {p.label}
                  </p>
                  <Badge variant="outline" className="text-[10px]">
                    {p.weight}%
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums">
                    {p.score}
                  </span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {p.rationale}
                </p>
                <div className="text-[10px] text-violet-700 dark:text-violet-300 font-medium">
                  Contribui {p.contribution.toFixed(1)} pts
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pendências críticas */}
      {data.criticalPending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Pendências críticas ({data.criticalPending.length})
          </h2>
          <div className="space-y-2">
            {data.criticalPending.map((p, i) => (
              <Card
                key={i}
                className={cn(
                  "border-l-4",
                  p.severity === "alta"
                    ? "border-l-red-400 bg-red-50/50 dark:bg-red-950/20"
                    : "border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/20",
                )}
              >
                <CardContent className="p-3 flex items-center justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        p.severity === "alta"
                          ? "bg-red-100 text-red-800 border-red-300"
                          : "bg-amber-100 text-amber-800 border-amber-300",
                      )}
                    >
                      {p.severity === "alta" ? "Alta" : "Média"}
                    </Badge>
                    <p className="text-sm flex-1">{p.message}</p>
                  </div>
                  {p.href && (
                    <Button asChild size="sm" variant="ghost">
                      <Link href={p.href}>
                        Resolver
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Status das 8 fases (Preliminar + 1 a 7) */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          As 7 Fases do PGP em ação
          <span className="text-xs font-normal text-muted-foreground">
            — cada fase com KPIs reais e link pra tela específica
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {data.phases.map((phase) => (
            <Card
              key={phase.id}
              className={cn(
                "border-l-4 transition-shadow hover:shadow-md",
                phase.statusColor === "success" && "border-l-emerald-500",
                phase.statusColor === "warning" && "border-l-amber-500",
                phase.statusColor === "danger" && "border-l-red-500",
                phase.statusColor === "neutral" && "border-l-gray-300",
              )}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {phase.number === 0 ? "Fase Preliminar" : `Fase ${phase.number}`}
                    </p>
                    <p className="font-semibold text-sm truncate">{phase.description}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", phaseStatusBadgeClass(phase.statusColor))}
                  >
                    {phase.statusLabel}
                  </Badge>
                </div>

                {/* Barra de progresso */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      phase.statusColor === "success" && "bg-emerald-500",
                      phase.statusColor === "warning" && "bg-amber-500",
                      phase.statusColor === "danger" && "bg-red-500",
                      phase.statusColor === "neutral" && "bg-gray-400",
                    )}
                    style={{ width: `${phase.progress}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground text-right">
                  {phase.progress}% de progresso
                </div>

                {/* KPIs */}
                <div className="space-y-1 pt-1">
                  {phase.kpis.map((kpi, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between text-xs",
                        kpi.highlight && "font-semibold text-gray-900 dark:text-white",
                      )}
                    >
                      <span className="text-muted-foreground">{kpi.label}</span>
                      <span className="tabular-nums">{kpi.value}</span>
                    </div>
                  ))}
                </div>

                {/* Link pra fase */}
                <Button asChild size="sm" variant="ghost" className="w-full justify-between mt-2">
                  <Link href={phase.href}>
                    Abrir fase
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Rodapé com link pra Política do PGP */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-200">
                Política do PGP
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Documento mater que formaliza o programa. Use o template em Políticas pra criar/publicar.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="self-start sm:self-auto">
            <Link href="/dashboard/politicas">
              Abrir Políticas
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs italic text-muted-foreground text-center">
        Painel calculado em {new Date(data.computedAt).toLocaleString("pt-BR")} —
        atualiza a cada acesso.
      </p>
    </div>
  );
}
