"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  ShieldAlert,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Target,
  CalendarDays,
  FileText,
  FileCheck2,
  Handshake,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  Users,
  UserCheck,
  GraduationCap,
  Scale,
  Shield,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Renderiza os mini-apps nativos da fase passada (Inventário, Análise de
 * Riscos, GAP, etc.). Cada fase tem seu conjunto.
 *
 * Hoje suporta:
 *   - entendendo-pgp → Maturidade do PGP + Política do PGP (Checkpoint 15 / Opção 1)
 *   - preliminar → Capacitação LGPD (Checkpoint 18)
 *   - fase-1 → Formação das Equipes (Contribuidores)
 *   - fase-2 → Diagnóstico de Privacidade (Checkpoint 10)
 *   - fase-3 → Inventário + Análise de Riscos
 *   - fase-4 → GAP Analysis
 *   - fase-5 → Plano de Ação institucional
 *   - fase-6 → Políticas LGPD + RIPD institucional + Gestão de Terceiros
 *   - fase-7 → Incidentes (Checkpoint 16 / G1)
 *
 * Pra adicionar uma nova fase, basta criar uma branch no switch principal
 * que renderize os cards relevantes (idealmente em arquivos separados quando
 * crescer demais).
 *
 * Usa o componente <ToolCard> reusável pros cards individuais. Ele calcula
 * cor da borda esquerda baseada em progresso (cinza → âmbar → verde) e
 * suporta ações primária/secundária.
 */
export default function PhaseNativeTools({ phase }: { phase: string }) {
  if (phase === "entendendo-pgp") {
    return <EntendendoPgpTools />;
  }
  if (phase === "preliminar") {
    return <FasePreliminarTools />;
  }
  if (phase === "fase-1") {
    return <Fase1Tools />;
  }
  if (phase === "fase-2") {
    return <Fase2Tools />;
  }
  if (phase === "fase-3") {
    return <Fase3Tools />;
  }
  if (phase === "fase-4") {
    return <Fase4Tools />;
  }
  if (phase === "fase-5") {
    return <Fase5Tools />;
  }
  if (phase === "fase-6") {
    return <Fase6Tools />;
  }
  if (phase === "fase-7") {
    return <Fase7Tools />;
  }
  // Outras fases ainda sem mini-apps nativos.
  return null;
}

/** Indica se uma fase tem ferramentas nativas (pra `PhasePracticalLinks`
 * decidir se mostra ou não a mensagem "nenhum link adicionado"). */
export function phaseHasNativeTools(phase: string): boolean {
  return (
    phase === "entendendo-pgp" ||
    phase === "preliminar" ||
    phase === "fase-1" ||
    phase === "fase-2" ||
    phase === "fase-3" ||
    phase === "fase-4" ||
    phase === "fase-5" ||
    phase === "fase-6" ||
    phase === "fase-7"
  );
}

// ============================================================
// Entendendo o PGP — Maturidade + Política do PGP (Checkpoint 15 / Opção 1)
// ============================================================

interface MaturityResp {
  score: number;
  level: string;
  levelDescription: string;
  phases: Array<{ statusColor: string }>;
}

interface PoliticasMinResp {
  items: Array<{ id: string; type: string; status: string }>;
}

function EntendendoPgpTools() {
  const [maturity, setMaturity] = useState<MaturityResp | null>(null);
  const [politicas, setPoliticas] = useState<PoliticasMinResp | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [rMat, rPol] = await Promise.all([
          fetch("/api/maturidade-pgp", { cache: "no-store" }),
          fetch("/api/politicas", { cache: "no-store" }),
        ]);
        if (rMat.status === 403) {
          setForbidden(true);
        } else if (rMat.ok) {
          setMaturity(await rMat.json());
        }
        if (rPol.ok) {
          setPoliticas(await rPol.json());
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // C3 — quantas das 8 fases (preliminar + 7) já têm evidência (não-neutral)
  const fasesComEvidencia = maturity
    ? maturity.phases.filter((p) => p.statusColor !== "neutral").length
    : 0;
  const totalFases = maturity?.phases.length ?? 8;

  // Política do PGP: existe alguma policy do tipo POLITICA_PGP?
  const politicaPgp = politicas?.items.find((p) => p.type === "POLITICA_PGP");
  const politicaPgpPublicada =
    politicaPgp && politicaPgp.status === "PUBLICADA";

  // Cor do card Maturidade
  const maturityColor: ToolCardColor = forbidden
    ? "neutral"
    : maturity == null
      ? "neutral"
      : maturity.score >= 70
        ? "success"
        : maturity.score >= 25
          ? "warning"
          : "neutral";

  // Cor do card Política do PGP
  const politicaColor: ToolCardColor = forbidden
    ? "neutral"
    : politicaPgpPublicada
      ? "success"
      : politicaPgp
        ? "warning"
        : "neutral";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Card 1: Maturidade do PGP */}
      <ToolCard
        icon={<Sparkles className="h-6 w-6" />}
        iconColor="text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/40"
        title="Maturidade do PGP"
        description="Painel executivo do Programa de Governança em Privacidade — score consolidado, status de cada uma das 7 Fases e pendências críticas. Pra DPO levar à diretoria/auditoria/ANPD."
        progressColor={maturityColor}
        loading={loading}
        primaryAction={{
          label: maturity ? "Abrir painel" : "Calcular maturidade",
          href: "/dashboard/maturidade-pgp",
        }}
        stats={
          forbidden
            ? []
            : maturity
              ? [
                  {
                    label: `nível ${maturity.level.toLowerCase().replace(/_/g, " ")}`,
                    value: `${maturity.score}/100`,
                    color:
                      maturity.score >= 70
                        ? "emerald"
                        : maturity.score >= 25
                          ? "amber"
                          : "red",
                    icon: <TrendingUp className="h-3.5 w-3.5" />,
                  },
                  {
                    label: `de ${totalFases} Fases com evidências`,
                    value: fasesComEvidencia,
                    color: "default",
                    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                  },
                ]
              : []
        }
        emptyHint={
          forbidden
            ? "Esta tela é trabalhada pelo DPO da organização."
            : !maturity
              ? "Calcule a maturidade pra ver score consolidado das 7 Fases e pendências críticas."
              : undefined
        }
      />

      {/* Card 2: Política do PGP (documento mater) */}
      <ToolCard
        icon={<FileText className="h-6 w-6" />}
        iconColor="text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/40"
        title="Política do PGP"
        description="Documento mater que formaliza o programa — declara escopo, governança, papéis, ciclo de revisão e referencia os outros instrumentos como anexos. Base: Art. 50 da LGPD + Resolução CD/ANPD nº 2/2022."
        progressColor={politicaColor}
        loading={loading}
        primaryAction={{
          label: politicaPgp
            ? politicaPgpPublicada
              ? "Abrir Política do PGP"
              : "Continuar (rascunho)"
            : "Criar Política do PGP",
          href: politicaPgp
            ? `/dashboard/politicas/${politicaPgp.id}`
            : "/dashboard/politicas",
        }}
        stats={
          forbidden
            ? []
            : politicaPgp
              ? [
                  {
                    label: politicaPgpPublicada
                      ? "publicada — formaliza o PGP"
                      : "em rascunho",
                    value: politicaPgpPublicada ? "Sim" : "Pendente",
                    color: politicaPgpPublicada ? "emerald" : "amber",
                    icon: politicaPgpPublicada ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    ),
                  },
                ]
              : []
        }
        emptyHint={
          forbidden
            ? "Esta tela é trabalhada pelo DPO da organização."
            : !politicaPgp
              ? "Crie o documento mater do programa a partir do template oficial em Políticas. Sem ele, o programa não tem declaração formal."
              : undefined
        }
      />
    </div>
  );
}

// ============================================================
// Fase Preliminar — Capacitação LGPD (Checkpoint 18)
// ============================================================

interface CapacitacaoResp {
  items: Array<{ id: string; status: string; eixo: string; audience: string }>;
  stats: {
    total: number;
    byStatus: { PLANEJADO: number; REALIZADO: number; CANCELADO: number };
    nextScheduled: { title: string; scheduledAt: string } | null;
    eixosCovered: number;
    audiencesCovered: number;
    withEvidence: number;
  };
}

function FasePreliminarTools() {
  const [data, setData] = useState<CapacitacaoResp | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/capacitacao", { cache: "no-store" });
        if (res.ok) {
          setData(await res.json());
        } else if (res.status === 403) {
          setForbidden(true);
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = data?.stats.total ?? 0;
  const realizados = data?.stats.byStatus.REALIZADO ?? 0;
  const planejados = data?.stats.byStatus.PLANEJADO ?? 0;
  const eixosCovered = data?.stats.eixosCovered ?? 0;
  const audiencesCovered = data?.stats.audiencesCovered ?? 0;
  const withEvidence = data?.stats.withEvidence ?? 0;
  const next = data?.stats.nextScheduled ?? null;

  // Cor:
  //   - neutral: zero eventos
  //   - success: 5/5 eixos cobertos com pelo menos 1 realizado
  //   - warning: tem eventos mas faltam eixos
  const color: ToolCardColor = forbidden
    ? "neutral"
    : total === 0
      ? "neutral"
      : eixosCovered === 5
        ? "success"
        : "warning";

  return (
    <div className="grid grid-cols-1 gap-4">
      <ToolCard
        icon={<GraduationCap className="h-6 w-6" />}
        iconColor="text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40"
        title="Capacitação LGPD"
        description="Registro temporal de evidências do programa de capacitação. Organizado em 5 eixos: Onboarding, Pílulas de Conhecimento, Prática/Gamificação, Departamental e Monitoramento. Base: Art. 41§2º I, 50, 6º VIII, 52§1º VIII LGPD."
        progressColor={color}
        loading={loading}
        primaryAction={{
          label: total > 0 ? "Abrir Capacitação" : "Iniciar programa",
          href: "/dashboard/capacitacao",
        }}
        stats={
          forbidden
            ? []
            : data && total > 0
              ? [
                  {
                    label: "evento(s) cadastrado(s)",
                    value: total,
                    icon: <GraduationCap className="h-3.5 w-3.5" />,
                  },
                  {
                    label: "realizado(s)",
                    value: realizados,
                    color: realizados > 0 ? "emerald" : "default",
                    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                  },
                  ...(planejados > 0
                    ? [
                        {
                          label: "planejado(s)",
                          value: planejados,
                          color: "blue" as const,
                          icon: <Clock className="h-3.5 w-3.5" />,
                        },
                      ]
                    : []),
                  {
                    label: "eixos cobertos (de 5)",
                    value: eixosCovered,
                    color: eixosCovered === 5 ? ("emerald" as const) : ("amber" as const),
                    icon: <Target className="h-3.5 w-3.5" />,
                  },
                  ...(audiencesCovered > 0
                    ? [
                        {
                          label: "públicos atendidos (de 7)",
                          value: audiencesCovered,
                          color: audiencesCovered >= 5 ? ("emerald" as const) : ("blue" as const),
                          icon: <Users className="h-3.5 w-3.5" />,
                        },
                      ]
                    : []),
                  ...(withEvidence > 0
                    ? [
                        {
                          label: "com evidência anexada",
                          value: withEvidence,
                          color: "emerald" as const,
                          icon: <FileText className="h-3.5 w-3.5" />,
                        },
                      ]
                    : []),
                  ...(next
                    ? [
                        {
                          label: `próxima: ${next.title.slice(0, 40)}${next.title.length > 40 ? "…" : ""}`,
                          value: new Date(next.scheduledAt).toLocaleDateString("pt-BR"),
                          color: "blue" as const,
                          icon: <CalendarDays className="h-3.5 w-3.5" />,
                        },
                      ]
                    : []),
                ]
              : []
        }
        emptyHint={
          forbidden
            ? "Esta tela é trabalhada pelo DPO da organização."
            : total === 0
              ? "Nenhum evento cadastrado. Use \"Importar checklist\" na tela de Capacitação pra gerar 18 tarefas dos 5 eixos, ou cadastre o primeiro evento manualmente."
              : undefined
        }
      />
    </div>
  );
}

// ============================================================
// Fase 1 — Formação das Equipes (Contribuidores)
// ============================================================

interface ContribuidoresResp {
  contribuidores: Array<{
    id: string;
    name: string | null;
    email: string;
    setor: string | null;
    isActive: boolean;
    _count: { createdInventories: number };
  }>;
}

function Fase1Tools() {
  const [data, setData] = useState<ContribuidoresResp | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dpo/contribuidores", { cache: "no-store" });
        if (res.ok) {
          setData(await res.json());
        } else if (res.status === 403) {
          setForbidden(true);
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = data?.contribuidores.length ?? 0;
  const ativos = data?.contribuidores.filter((c) => c.isActive).length ?? 0;
  const participaram = data?.contribuidores.filter(
    (c) => c._count.createdInventories > 0,
  ).length ?? 0;
  const inativos = total - ativos;

  // Quantos setores diferentes têm contribuidores cadastrados (cobertura)
  const setoresCobertos = data
    ? new Set(
        data.contribuidores
          .filter((c) => c.isActive && c.setor)
          .map((c) => c.setor),
      ).size
    : 0;

  // Cor da borda esquerda:
  //   - neutral: 0 contribuidores
  //   - success: tem ativos E pelo menos 1 já participou do Inventário
  //   - warning: tem ativos mas ninguém participou ainda OU tem inativos
  const color: ToolCardColor = forbidden
    ? "neutral"
    : total === 0
      ? "neutral"
      : ativos > 0 && participaram > 0
        ? "success"
        : "warning";

  return (
    <div className="grid grid-cols-1 gap-4">
      <ToolCard
        icon={<Users className="h-6 w-6" />}
        iconColor="text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40"
        title="Formação das Equipes"
        description="Cadastro dos colaboradores que vão atuar no programa — contribuidores responsáveis por mapear os processos do próprio setor no Inventário. O DPO Principal/Substituto cria as contas e o sistema gera senha temporária de primeiro acesso."
        progressColor={color}
        loading={loading}
        primaryAction={{
          label: total > 0 ? "Gerenciar contribuidores" : "Cadastrar primeiro contribuidor",
          href: "/dashboard/contribuidores",
        }}
        stats={
          forbidden
            ? []
            : data && total > 0
              ? [
                  {
                    label: "contribuidor(es) cadastrado(s)",
                    value: total,
                    icon: <Users className="h-3.5 w-3.5" />,
                  },
                  {
                    label: "ativo(s)",
                    value: ativos,
                    color: ativos > 0 ? "emerald" : "default",
                    icon: <UserCheck className="h-3.5 w-3.5" />,
                  },
                  ...(participaram > 0
                    ? [
                        {
                          label: "já participaram do Inventário",
                          value: participaram,
                          color: "emerald" as const,
                          icon: <ClipboardList className="h-3.5 w-3.5" />,
                        },
                      ]
                    : []),
                  ...(setoresCobertos > 0
                    ? [
                        {
                          label: `setor(es) com contribuidor`,
                          value: setoresCobertos,
                          color: "blue" as const,
                          icon: <Target className="h-3.5 w-3.5" />,
                        },
                      ]
                    : []),
                  ...(inativos > 0
                    ? [
                        {
                          label: "inativo(s)",
                          value: inativos,
                          color: "amber" as const,
                          icon: <AlertCircle className="h-3.5 w-3.5" />,
                        },
                      ]
                    : []),
                ]
              : []
        }
        emptyHint={
          forbidden
            ? "Esta tela é trabalhada pelo DPO da organização."
            : total === 0
              ? "Nenhum contribuidor cadastrado. Cadastre pelo menos 1 colaborador por setor pra delegar o mapeamento dos processos no Inventário."
              : ativos > 0 && participaram === 0
                ? undefined
                : undefined
        }
      />
    </div>
  );
}

// ============================================================
// Fase 2 — Diagnóstico de Privacidade (Checkpoint 10)
// ============================================================

interface DiagnosticoResp {
  score: {
    overall: number | null;
    sub: Record<
      "INVENTARIO" | "BASES" | "RISCOS" | "GAP",
      { value: number | null; detail: string; label: string; weight: number }
    >;
    maturityLabel: string;
  };
  recommendations: Array<{ priority: "ALTA" | "MEDIA" | "BAIXA" }>;
  raw: {
    totalProcessos: number;
    aprovados: number;
    riscosAlto: number;
    gapNaoAderente: number;
  };
}

function Fase2Tools() {
  const [diag, setDiag] = useState<DiagnosticoResp | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/diagnostico", { cache: "no-store" });
        if (res.ok) {
          setDiag(await res.json());
        } else if (res.status === 403) {
          setForbidden(true);
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const overall = diag?.score.overall ?? null;
  const maturity = diag?.score.maturityLabel ?? "—";
  const recs = diag?.recommendations.length ?? 0;
  const recsAlta = diag?.recommendations.filter((r) => r.priority === "ALTA").length ?? 0;

  // Identifica o pilar mais crítico (menor score) pra destacar
  const subScores = diag
    ? Object.values(diag.score.sub).filter((s) => s.value != null) as Array<{
        value: number;
        label: string;
      }>
    : [];
  const pilarCritico = subScores.length > 0
    ? subScores.reduce((min, s) => (s.value < min.value ? s : min), subScores[0])
    : null;

  // Cor da borda esquerda do card
  const color: ToolCardColor = forbidden
    ? "neutral"
    : overall == null
      ? "neutral"
      : overall >= 70
        ? "success"
        : overall >= 40
          ? "warning"
          : "warning";

  // Cor do score no stat (vermelho < 40, amber 40-70, verde >= 70)
  const scoreColor: StatColor = overall == null
    ? "default"
    : overall >= 70
      ? "emerald"
      : overall >= 40
        ? "amber"
        : "red";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ToolCard
        icon={<BarChart3 className="h-6 w-6" />}
        iconColor="text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/40"
        title="Diagnóstico de Privacidade"
        description="Score consolidado (0-100) baseado em 4 pilares: GAP Analysis (40%), Análise de Riscos (30%), Bases Legais (20%) e Inventário (10%). Mostra a maturidade da organização e gera recomendações priorizadas pro Plano de Ação."
        progressColor={color}
        loading={loading}
        primaryAction={{
          label: overall != null ? "Abrir Diagnóstico" : "Calcular diagnóstico",
          href: "/dashboard/diagnostico",
        }}
        stats={
          forbidden
            ? []
            : diag && overall != null
              ? [
                  {
                    label: `maturidade: ${maturity.toLowerCase()}`,
                    value: `${overall}/100`,
                    color: scoreColor,
                    icon: <TrendingUp className="h-3.5 w-3.5" />,
                  },
                  ...(pilarCritico
                    ? [
                        {
                          label: `pilar mais fraco: ${pilarCritico.label}`,
                          value: `${pilarCritico.value}%`,
                          color: pilarCritico.value < 50 ? ("red" as const) : ("amber" as const),
                          icon: <Target className="h-3.5 w-3.5" />,
                        },
                      ]
                    : []),
                  ...(recs > 0
                    ? [
                        {
                          label: `recomendação(ões)${recsAlta > 0 ? ` (${recsAlta} prioridade alta)` : ""}`,
                          value: recs,
                          color: recsAlta > 0 ? ("amber" as const) : ("default" as const),
                          icon: <Lightbulb className="h-3.5 w-3.5" />,
                        },
                      ]
                    : []),
                ]
              : []
        }
        emptyHint={
          forbidden
            ? "Esta tela é trabalhada pelo DPO da organização."
            : overall == null
              ? "Sem dados suficientes ainda. Comece pelo Inventário (Fase 3) e depois GAP Analysis (Fase 4) — o diagnóstico é gerado automaticamente."
              : undefined
        }
      />
      <CyberCardTools />
    </div>
  );
}

// CyberCardTools — Maturidade Cibernética (Checkpoint 22 / Fatia 1)
// Companheiro do Diagnóstico de Privacidade na Fase 2.
function CyberCardTools() {
  const [data, setData] = useState<{
    score: { overall: number; level: string; answered: number; totalControls: number };
    stats: { delegatedToTi: number; blockedQuestions: number };
  } | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cyber", { cache: "no-store" });
        if (res.ok) setData(await res.json());
        else if (res.status === 403) setForbidden(true);
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const overall = data?.score.overall ?? null;
  const answered = data?.score.answered ?? 0;
  const total = data?.score.totalControls ?? 80;
  const blocked = data?.stats.blockedQuestions ?? 0;

  const color: ToolCardColor = forbidden
    ? "neutral"
    : overall == null || answered === 0
      ? "neutral"
      : overall >= 70
        ? "success"
        : "warning";

  return (
    <ToolCard
      icon={<Shield className="h-6 w-6" />}
      iconColor="text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/40"
      title="Maturidade Cibernética"
      description="Avaliação NIST CSF (80 controles em 5 funções: Identificar, Proteger, Detectar, Responder, Recuperar). Mede a postura de segurança da informação da organização e complementa o Diagnóstico de Privacidade."
      progressColor={color}
      loading={loading}
      primaryAction={{
        label: answered > 0 ? "Continuar avaliação" : "Iniciar avaliação",
        href: "/dashboard/maturidade-cyber",
      }}
      stats={
        forbidden
          ? []
          : data && answered > 0
            ? [
                {
                  label: "score NIST",
                  value: `${overall}/100`,
                  color: (overall ?? 0) >= 70 ? "emerald" : (overall ?? 0) >= 40 ? "amber" : "red",
                  icon: <TrendingUp className="h-3.5 w-3.5" />,
                },
                {
                  label: "respondidos",
                  value: `${answered}/${total}`,
                  color: "default",
                  icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                },
                ...(blocked > 0
                  ? [
                      {
                        label: "não aderentes",
                        value: blocked,
                        color: "red" as const,
                        icon: <AlertCircle className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
              ]
            : []
      }
      emptyHint={
        forbidden
          ? "Esta tela é trabalhada pelo DPO da organização."
          : answered === 0
            ? "Avaliação ainda não iniciada. Os 80 controles cobrem práticas de segurança da informação complementares ao GAP Analysis (que mede LGPD)."
            : undefined
      }
    />
  );
}

// ============================================================
// Fase 3 — Inventário + Análise de Riscos
// ============================================================

interface InventoryItem {
  id: string;
  status: string;
  isDraft?: boolean;
  serviceName: string;
  updatedAt: string;
}

interface RiscosResponse {
  items: Array<{ id: string; analyzed: boolean; totalRisks: number }>;
  stats: {
    totalProcesses: number;
    analyzedCount: number;
    pendingCount: number;
    totalRisks: number;
  };
}

function Fase3Tools() {
  const [inv, setInv] = useState<InventoryItem[] | null>(null);
  const [riscos, setRiscos] = useState<RiscosResponse | null>(null);
  const [riscosForbidden, setRiscosForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Inventário: todos os papéis têm acesso (filtrado server-side)
        const invRes = await fetch("/api/inventario");
        if (invRes.ok) {
          setInv(await invRes.json());
        }

        // Riscos: só DPO. Contribuidor recebe 403 → mostra estado limitado.
        const rRes = await fetch("/api/riscos");
        if (rRes.ok) {
          setRiscos(await rRes.json());
        } else if (rRes.status === 403) {
          setRiscosForbidden(true);
        }
      } catch {
        // silencioso — UI mostra estado de erro genérico
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Stats do Inventário
  const invStats = (() => {
    if (!inv) return null;
    const aprovados = inv.filter((i) => i.status === "APROVADO").length;
    const rascunhos = inv.filter(
      (i) => i.status === "RASCUNHO" || i.isDraft
    ).length;
    const submetidos = inv.filter((i) => i.status === "SUBMETIDO").length;
    const emRevisao = inv.filter((i) => i.status === "EM_REVISAO").length;
    const devolvidos = inv.filter((i) => i.status === "DEVOLVIDO").length;
    const ultimoRascunho = inv
      .filter((i) => i.status === "RASCUNHO" || i.isDraft)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];
    return {
      total: inv.length,
      aprovados,
      rascunhos,
      submetidos,
      emRevisao,
      devolvidos,
      ultimoRascunho,
    };
  })();

  // Cor de progresso do card Inventário
  const invColor: ToolCardColor = !invStats || invStats.total === 0
    ? "neutral"
    : invStats.aprovados > 0
    ? "success"
    : "warning";

  // Cor de progresso do card Análise de Riscos
  const riscosColor: ToolCardColor = riscosForbidden
    ? "neutral"
    : !riscos || riscos.stats.totalProcesses === 0
    ? "neutral"
    : riscos.stats.pendingCount === 0
    ? "success"
    : "warning";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Ordem segue o fluxo natural: descobrir → mapear → analisar.
          1) Sugerir processos (a partir da Carta de Serviços — Lei 13.460)
          2) Inventário de Dados
          3) Análise de Riscos */}

      {/* ===== Card Sugerir processos da Carta de Serviços (DPO-only) ===== */}
      {!riscosForbidden && (
        <ToolCard
          icon={<Sparkles className="h-6 w-6" />}
          iconColor="text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/40"
          title="Sugerir processos da Carta"
          description="A IA varre a Carta de Serviços da instituição (Lei 13.460/2017) e sugere quais processos devem entrar no Inventário."
          progressColor="neutral"
          loading={loading}
          primaryAction={{
            label: "Abrir sugestão",
            href: "/dashboard/inventario/sugerir-da-carta",
          }}
          stats={[]}
          emptyHint="Cobre serviços ao cidadão (SIC, Ouvidoria, RH, atendimento). Você revisa antes de criar os rascunhos."
        />
      )}

      {/* ===== Card Inventário ===== */}
      <ToolCard
        icon={<ClipboardList className="h-6 w-6" />}
        iconColor="text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/40"
        title="Inventário de Dados"
        description="Mapeie cada processo de tratamento de dados pessoais da organização."
        progressColor={invColor}
        loading={loading}
        primaryAction={{
          label:
            invStats && invStats.total > 0
              ? "Abrir Inventário"
              : "Iniciar Inventário",
          href: "/dashboard/inventario",
        }}
        secondaryAction={
          invStats?.ultimoRascunho
            ? {
                label: "Continuar último rascunho",
                href: `/dashboard/inventario/${invStats.ultimoRascunho.id}/editar`,
                icon: <PlayCircle className="h-4 w-4" />,
              }
            : undefined
        }
        stats={
          invStats && invStats.total > 0
            ? [
                {
                  label: "processos",
                  value: invStats.total,
                  icon: <ClipboardList className="h-3.5 w-3.5" />,
                },
                {
                  label: "aprovados",
                  value: invStats.aprovados,
                  color: "emerald",
                  icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                },
                {
                  label: "rascunhos",
                  value: invStats.rascunhos,
                  color: "amber",
                  icon: <Clock className="h-3.5 w-3.5" />,
                },
                ...(invStats.submetidos + invStats.emRevisao > 0
                  ? [
                      {
                        label: "em revisão",
                        value: invStats.submetidos + invStats.emRevisao,
                        color: "blue" as const,
                        icon: <AlertCircle className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
                ...(invStats.devolvidos > 0
                  ? [
                      {
                        label: "devolvidos",
                        value: invStats.devolvidos,
                        color: "red" as const,
                        icon: <AlertCircle className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
              ]
            : []
        }
        emptyHint="Você ainda não cadastrou nenhum processo. Comece pelo primeiro mapeamento."
      />

      {/* ===== Card Análise de Riscos ===== */}
      <ToolCard
        icon={<ShieldAlert className="h-6 w-6" />}
        iconColor="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/40"
        title="Análise de Riscos"
        description="Identifique os riscos LGPD em cada processo aprovado e classifique seu nível."
        progressColor={riscosColor}
        loading={loading}
        primaryAction={{
          label:
            riscos && riscos.stats.totalProcesses > 0
              ? "Abrir Análise de Riscos"
              : "Abrir painel",
          href: "/dashboard/riscos",
        }}
        stats={
          riscosForbidden
            ? []
            : riscos && riscos.stats.totalProcesses > 0
            ? [
                {
                  label: "processos aprovados",
                  value: riscos.stats.totalProcesses,
                  icon: <ClipboardList className="h-3.5 w-3.5" />,
                },
                {
                  label: "analisados",
                  value: riscos.stats.analyzedCount,
                  color: "emerald",
                  icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                },
                ...(riscos.stats.pendingCount > 0
                  ? [
                      {
                        label: "pendentes",
                        value: riscos.stats.pendingCount,
                        color: "amber" as const,
                        icon: <Clock className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
                ...(riscos.stats.totalRisks > 0
                  ? [
                      {
                        label: "riscos identificados",
                        value: riscos.stats.totalRisks,
                        color: "red" as const,
                        icon: <AlertCircle className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
              ]
            : []
        }
        emptyHint={
          riscosForbidden
            ? "Esta tela é trabalhada pelo DPO da organização."
            : !riscos || riscos.stats.totalProcesses === 0
            ? "Aprove pelo menos 1 processo no Inventário pra começar a Análise de Riscos."
            : undefined
        }
      />
    </div>
  );
}

// ============================================================
// Fase 4 — GAP Analysis
// ============================================================

interface GapResp {
  answers: Array<{ controlCode: string; autoSuggested: boolean }>;
  stats: {
    total: number;
    answered: number;
    confirmed: number;
    autoSuggested: number;
    byAderencia: Record<string, number>;
  };
  suggestions: Record<string, unknown> | null;
}

function Fase4Tools() {
  const [gap, setGap] = useState<GapResp | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/gap?withSuggestions=1");
        if (res.ok) {
          setGap(await res.json());
        } else if (res.status === 403) {
          setForbidden(true);
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = gap?.stats.total ?? 119;
  const answered = gap?.stats.answered ?? 0;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  // Cor da borda esquerda do card
  const color: ToolCardColor = forbidden
    ? "neutral"
    : answered === 0
      ? "neutral"
      : answered === total
        ? "success"
        : "warning";

  const naoAderente = gap?.stats.byAderencia.NAO_ADERENTE ?? 0;
  const sugestoes = gap?.suggestions ? Object.keys(gap.suggestions).length : 0;

  return (
    <div className="grid grid-cols-1 gap-4">
      <ToolCard
        icon={<ClipboardList className="h-6 w-6" />}
        iconColor="text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40"
        title="GAP Analysis"
        description="Diagnóstico macro de adequação à LGPD: 119 controles em 28 domínios, baseados no template oficial LGPD PRO."
        progressColor={color}
        loading={loading}
        primaryAction={{
          label: answered > 0 ? "Continuar diagnóstico" : "Iniciar diagnóstico",
          href: "/dashboard/gap-analysis",
        }}
        stats={
          forbidden
            ? []
            : gap
              ? [
                  {
                    label: `de ${total} controles respondidos (${pct}%)`,
                    value: answered,
                    icon: <ClipboardList className="h-3.5 w-3.5" />,
                  },
                  {
                    label: "confirmados pelo DPO",
                    value: gap.stats.confirmed,
                    color: "emerald",
                    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                  },
                  ...(naoAderente > 0
                    ? [
                        {
                          label: "não aderente(s)",
                          value: naoAderente,
                          color: "red" as const,
                          icon: <AlertCircle className="h-3.5 w-3.5" />,
                        },
                      ]
                    : []),
                  ...(sugestoes > 0
                    ? [
                        {
                          label: "sugestão(ões) auto pendente(s)",
                          value: sugestoes,
                          color: "amber" as const,
                          icon: <Clock className="h-3.5 w-3.5" />,
                        },
                      ]
                    : []),
                ]
              : []
        }
        emptyHint={
          forbidden
            ? "Esta tela é trabalhada pelo DPO da organização."
            : answered === 0
              ? "Você ainda não começou. Abra o GAP pra ver as sugestões automáticas vindas do Inventário."
              : undefined
        }
      />
    </div>
  );
}

// ============================================================
// Fase 5 — Plano de Ação institucional
// ============================================================

interface PlanoAcaoResp {
  items: Array<{ id: string; status: string; priority: string; origin: string }>;
  stats: {
    total: number;
    byStatus: { A_FAZER: number; EM_ANDAMENTO: number; CONCLUIDA: number; CANCELADA: number };
    byPriority: { ALTA: number; MEDIA: number; BAIXA: number };
    byOrigin: { MANUAL: number; GAP: number; RISCO: number; BASES: number };
    overdue: number;
    dueSoon: number;
  };
}

function Fase5Tools() {
  const [plano, setPlano] = useState<PlanoAcaoResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Plano de Ação é visível pra DPO (tudo) e Contribuidor (próprias)
        // — sempre 200, sem 403. UI mostra contagens conforme escopo.
        const res = await fetch("/api/plano-acao");
        if (res.ok) setPlano(await res.json());
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = plano?.stats.total ?? 0;
  const emAberto =
    (plano?.stats.byStatus.A_FAZER ?? 0) +
    (plano?.stats.byStatus.EM_ANDAMENTO ?? 0);
  const concluidas = plano?.stats.byStatus.CONCLUIDA ?? 0;
  const overdue = plano?.stats.overdue ?? 0;
  const dueSoon = plano?.stats.dueSoon ?? 0;

  // Cor de progresso:
  //   - neutral: sem ações
  //   - success: total > 0 e nada em aberto (tudo concluído/cancelado)
  //   - warning: tem coisas em aberto
  const color: ToolCardColor =
    total === 0 ? "neutral" : emAberto === 0 ? "success" : "warning";

  return (
    <div className="grid grid-cols-1 gap-4">
      <ToolCard
        icon={<Target className="h-6 w-6" />}
        iconColor="text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/40"
        title="Plano de Ação"
        description="Lista oficial das ações da organização pra adequação à LGPD — com responsável formal, prazo e prioridade. Aceita import automático de gaps, riscos e bases legais pendentes."
        progressColor={color}
        loading={loading}
        primaryAction={{
          label: total > 0 ? "Abrir Plano de Ação" : "Iniciar Plano de Ação",
          href: "/dashboard/plano-acao",
        }}
        stats={
          plano && total > 0
            ? [
                {
                  label: "ações totais",
                  value: total,
                  icon: <Target className="h-3.5 w-3.5" />,
                },
                {
                  label: "em aberto",
                  value: emAberto,
                  color: "amber",
                  icon: <Clock className="h-3.5 w-3.5" />,
                },
                {
                  label: "concluídas",
                  value: concluidas,
                  color: "emerald",
                  icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                },
                ...(overdue > 0
                  ? [
                      {
                        label: "atrasadas",
                        value: overdue,
                        color: "red" as const,
                        icon: <AlertCircle className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
                ...(dueSoon > 0
                  ? [
                      {
                        label: "vencendo (7d)",
                        value: dueSoon,
                        color: "amber" as const,
                        icon: <CalendarDays className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
              ]
            : []
        }
        emptyHint={
          total === 0
            ? "Nenhuma ação cadastrada. Use \"Importar pendentes\" pra criar ações automaticamente a partir do GAP, Riscos e Bases Legais."
            : undefined
        }
      />
    </div>
  );
}

// ============================================================
// Fase 6 — Políticas LGPD + RIPD institucional
// ============================================================

interface PoliticasResp {
  items: Array<{ id: string; status: string; type: string; currentContent: string; publishedContent: string | null }>;
  stats: {
    total: number;
    byStatus: { RASCUNHO: number; PUBLICADA: number; ARQUIVADA: number };
    outdated: number;
  };
}

interface RipdResp {
  items: Array<{ id: string; status: string; createdBy: { id: string } | null }>;
  stats: {
    total: number;
    byStatus: { RASCUNHO: number; EM_REVISAO: number; APROVADO: number; ARQUIVADO: number };
    awaitingReview: number;
    myDrafts: number;
  };
}

interface LiaResp {
  items: Array<{
    id: string;
    status: string;
    blocked: boolean;
    completeness: number;
    createdBy: { id: string } | null;
  }>;
  stats: {
    total: number;
    byStatus: { RASCUNHO: number; EM_REVISAO: number; APROVADO: number; ARQUIVADO: number };
    awaitingReview: number;
    myDrafts: number;
    blocked: number;
  };
}

function Fase6Tools() {
  // Ordem reflete a sequência de dependência da Fase 6:
  //   1) RIPD — pré-requisito pra processos de alto risco (Art. 38 LGPD).
  //      A Política institucional cita conclusões dos RIPDs aprovados.
  //   2) LIA — pré-requisito quando o tratamento usa Art. 7º IX
  //      (legítimo interesse). Também alimenta as Políticas.
  //   3) Gestão de Terceiros — base contratual (DPA/cláusulas LGPD)
  //      precisa estar mapeada antes da Política consolidar a postura.
  //   4) Políticas LGPD — documento consolidador que se apoia em RIPDs +
  //      LIAs + relação com Operadores.
  // Mesma lógica de subOrder usada no card "Próximas etapas" (CP28).
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <RipdCardTools />
      <LiaCardTools />
      <TerceirosCardTools />
      <AvisoPrivacidadeCard />
      <PoliticasCard />
      <AvisosServicoCard />
      <TermosConsentimentoCard />
      <DireitosTitularCardTools />
    </div>
  );
}

// ============================================================
// DireitosTitularCardTools — Requisições de Direitos do Titular
// (arts. 18, 19, 20 da LGPD — prazo 15 dias corridos)
// ============================================================

interface DsrCountersResponse {
  pendentes: number;
  vencidas: number;
  criticas: number;
}

function DireitosTitularCardTools() {
  const { data: session } = useSession();
  const companyId = session?.user?.companyId || null;
  const [dsr, setDsr] = useState<DsrCountersResponse | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/direitos-titulares/contadores");
        if (r.ok) {
          setDsr(await r.json());
        } else if (r.status === 401 || r.status === 403) {
          setForbidden(true);
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pendentes = dsr?.pendentes ?? 0;
  const vencidas = dsr?.vencidas ?? 0;
  const criticas = dsr?.criticas ?? 0;

  const color: ToolCardColor = forbidden
    ? "neutral"
    : !dsr
      ? "neutral"
      : vencidas > 0 || criticas > 0
        ? "warning"
        : pendentes === 0
          ? "success"
          : "neutral";

  return (
    <ToolCard
      icon={<UserCheck className="h-6 w-6" />}
      iconColor="text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/40"
      title="Direitos do Titular"
      description="Atenda requisições do art. 18 da LGPD (acesso, correção, eliminação, portabilidade etc.) com prazo legal de 15 dias corridos. Inclui art. 19 (explicações) e art. 20 (revisão de decisão automatizada)."
      progressColor={color}
      loading={loading}
      primaryAction={{
        label:
          pendentes > 0
            ? `Abrir painel (${pendentes} pendente${pendentes === 1 ? "" : "s"})`
            : "Abrir painel",
        href: "/dashboard/requisicoes-titulares",
      }}
      secondaryAction={
        companyId
          ? {
              label: "Formulário público",
              href: `/direitos-titulares/${companyId}`,
              icon: <ExternalLink className="h-4 w-4" />,
            }
          : undefined
      }
      stats={
        forbidden
          ? []
          : pendentes > 0
            ? [
                {
                  label: "pendentes",
                  value: pendentes,
                  color: "amber",
                  icon: <Clock className="h-3.5 w-3.5" />,
                },
                ...(criticas > 0
                  ? [
                      {
                        label: "prazo crítico (≤3d)",
                        value: criticas,
                        color: "amber" as const,
                        icon: <AlertCircle className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
                ...(vencidas > 0
                  ? [
                      {
                        label: "vencidas",
                        value: vencidas,
                        color: "red" as const,
                        icon: <AlertCircle className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
              ]
            : dsr
              ? [
                  {
                    label: "tudo em dia",
                    value: "✓",
                    color: "emerald",
                    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                  },
                ]
              : []
      }
      emptyHint={
        forbidden
          ? "Esta tela é trabalhada pelo DPO da organização."
          : !dsr
            ? "Carregando dados das requisições."
            : undefined
      }
    />
  );
}

// ============================================================
// TermosConsentimentoCard — Termo de Consentimento do Titular (2026-05-10)
// ============================================================

interface TermosConsentResp {
  items: Array<{
    status: string;
    acceptedCount: number;
  }>;
  stats: {
    total: number;
    published: number;
    draft: number;
    archived: number;
    totalAccepts: number;
    approvedProcesses: number;
  };
}

interface ConsentStatusResp {
  stats: { missingTerm: number; totalConsentProcesses: number };
}

function TermosConsentimentoCard() {
  const [data, setData] = useState<TermosConsentResp | null>(null);
  const [missing, setMissing] = useState<number>(0);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch("/api/consent-terms"),
          fetch("/api/inventario/consent-status").catch(() => null),
        ]);
        if (r1.status === 403) {
          setForbidden(true);
        } else if (r1.ok) {
          setData(await r1.json());
        }
        if (r2 && r2.ok) {
          const j: ConsentStatusResp = await r2.json();
          setMissing(j.stats?.missingTerm ?? 0);
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = data?.stats.total ?? 0;
  const publicados = data?.stats.published ?? 0;
  const rascunhos = data?.stats.draft ?? 0;
  const accepts = data?.stats.totalAccepts ?? 0;

  const color: ToolCardColor = forbidden
    ? "neutral"
    : missing > 0
      ? "warning"
      : publicados > 0
        ? "success"
        : "neutral";

  return (
    <ToolCard
      icon={<FileText className="h-6 w-6" />}
      iconColor="text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/40"
      title="Termos de Consentimento"
      description="Coleta formal do consentimento do titular (Art. 8º LGPD). Catálogo de 5 modelos institucionais + URL pública com aceite digital e evidência (IP, data, versão)."
      progressColor={color}
      loading={loading}
      primaryAction={{
        label: total > 0 ? "Abrir Termos" : "Criar primeiro termo",
        href: "/dashboard/termos-consentimento",
      }}
      stats={
        forbidden
          ? []
          : data && total > 0
            ? [
                {
                  label: "termos",
                  value: total,
                  icon: <FileText className="h-3.5 w-3.5" />,
                },
                {
                  label: "publicados",
                  value: publicados,
                  color: "emerald",
                  icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                },
                ...(rascunhos > 0
                  ? [
                      {
                        label: "em rascunho",
                        value: rascunhos,
                        color: "amber" as const,
                        icon: <Clock className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
                ...(accepts > 0
                  ? [
                      {
                        label: "aceites",
                        value: accepts,
                        color: "emerald" as const,
                        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
                ...(missing > 0
                  ? [
                      {
                        label: "sem termo (consent)",
                        value: missing,
                        color: "red" as const,
                        icon: <AlertCircle className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
              ]
            : missing > 0
              ? [
                  {
                    label: "processos consent. sem termo",
                    value: missing,
                    color: "amber" as const,
                    icon: <AlertCircle className="h-3.5 w-3.5" />,
                  },
                ]
              : []
      }
      emptyHint={
        forbidden
          ? "Esta tela é trabalhada pelo DPO da organização."
          : missing > 0
            ? `Há ${missing} processo${missing === 1 ? "" : "s"} aprovado${missing === 1 ? "" : "s"} usando Consentimento como base legal sem termo associado.`
            : total === 0
              ? "Crie a partir de 1 dos 5 modelos (Geral, Sensíveis, Menor, Imagem/Voz, Comunicação)."
              : undefined
      }
    />
  );
}

// ============================================================
// AvisosServicoCard — Aviso de Privacidade por Serviço (Checkpoint Avisos, 2026-05-10)
// ============================================================

interface AvisosResp {
  items: Array<{
    inventoryId: string;
    inventoryStatus: string;
    notice: { status: string; outdated: boolean } | null;
  }>;
}

function AvisosServicoCard() {
  const [data, setData] = useState<AvisosResp | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/avisos-privacidade");
        if (res.ok) {
          setData(await res.json());
        } else if (res.status === 403) {
          setForbidden(true);
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const aprovados = data?.items.filter((i) => i.inventoryStatus === "APROVADO").length ?? 0;
  const publicados = data?.items.filter((i) => i.notice?.status === "PUBLICADO").length ?? 0;
  const rascunhos = data?.items.filter((i) => i.notice?.status === "RASCUNHO").length ?? 0;
  const desatualizados = data?.items.filter((i) => i.notice?.outdated === true).length ?? 0;
  const semAviso = (data?.items ?? []).filter(
    (i) => i.inventoryStatus === "APROVADO" && !i.notice,
  ).length;

  const color: ToolCardColor = forbidden
    ? "neutral"
    : aprovados === 0
      ? "neutral"
      : publicados > 0 && desatualizados === 0 && semAviso === 0 && rascunhos === 0
        ? "success"
        : "warning";

  return (
    <ToolCard
      icon={<FileText className="h-6 w-6" />}
      iconColor="text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/40"
      title="Aviso de Privacidade por Serviço"
      description="Documento público que cada serviço entrega ao cidadão (Art. 9º LGPD). Gerado automaticamente do Inventário; você ajusta seções e adiciona observações antes de publicar em URL pública."
      progressColor={color}
      loading={loading}
      primaryAction={{
        label: aprovados > 0 ? "Abrir Avisos por Serviço" : "Aprove processos primeiro",
        href: "/dashboard/avisos-privacidade",
      }}
      stats={
        forbidden
          ? []
          : data && aprovados > 0
            ? [
                {
                  label: "aprovados",
                  value: aprovados,
                  icon: <FileText className="h-3.5 w-3.5" />,
                },
                {
                  label: "publicados",
                  value: publicados,
                  color: "emerald",
                  icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                },
                ...(rascunhos > 0
                  ? [
                      {
                        label: "em rascunho",
                        value: rascunhos,
                        color: "amber" as const,
                        icon: <Clock className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
                ...(desatualizados > 0
                  ? [
                      {
                        label: "desatualizados",
                        value: desatualizados,
                        color: "red" as const,
                        icon: <AlertCircle className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
                ...(semAviso > 0
                  ? [
                      {
                        label: "sem aviso ainda",
                        value: semAviso,
                        icon: <Clock className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
              ]
            : []
      }
      emptyHint={
        forbidden
          ? "Esta tela é trabalhada pelo DPO da organização."
          : aprovados === 0
            ? "Avisos só são gerados pra processos APROVADO no Inventário. Aprove no editor pra liberar."
            : undefined
      }
    />
  );
}

function PoliticasCard() {
  const [pol, setPol] = useState<PoliticasResp | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/politicas");
        if (res.ok) {
          setPol(await res.json());
        } else if (res.status === 403) {
          setForbidden(true);
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = pol?.stats.total ?? 0;
  const publicadas = pol?.stats.byStatus.PUBLICADA ?? 0;
  const rascunhos = pol?.stats.byStatus.RASCUNHO ?? 0;
  const outdated = pol?.stats.outdated ?? 0;

  // Cor: neutral = nada; success = pelo menos 1 publicada e nenhuma com
  // mudanças não publicadas; warning = tem rascunho ou divergência.
  const color: ToolCardColor = forbidden
    ? "neutral"
    : total === 0
      ? "neutral"
      : publicadas > 0 && outdated === 0 && rascunhos === 0
        ? "success"
        : "warning";

  return (
    <ToolCard
      icon={<FileText className="h-6 w-6" />}
      iconColor="text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/40"
      title="Políticas LGPD"
      description="Aviso de privacidade, termos de uso, política de cookies e outras. Templates oficiais já preenchidos com os dados da sua organização, prontos pra publicar em URL pública."
      progressColor={color}
      loading={loading}
      primaryAction={{
        label: total > 0 ? "Abrir Políticas" : "Criar primeira política",
        href: "/dashboard/politicas",
      }}
      stats={
        forbidden
          ? []
          : pol && total > 0
            ? [
                {
                  label: "políticas",
                  value: total,
                  icon: <FileText className="h-3.5 w-3.5" />,
                },
                {
                  label: "publicadas",
                  value: publicadas,
                  color: "emerald",
                  icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                },
                ...(rascunhos > 0
                  ? [
                      {
                        label: "em rascunho",
                        value: rascunhos,
                        color: "amber" as const,
                        icon: <Clock className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
                ...(outdated > 0
                  ? [
                      {
                        label: "com mudanças não publicadas",
                        value: outdated,
                        color: "red" as const,
                        icon: <AlertCircle className="h-3.5 w-3.5" />,
                      },
                    ]
                  : []),
              ]
            : []
      }
      emptyHint={
        forbidden
          ? "Esta tela é trabalhada pelo DPO da organização."
          : total === 0
            ? "Comece pelos 3 mais comuns: Aviso de Privacidade, Termos de Uso e Política de Cookies."
            : undefined
      }
    />
  );
}

// ============================================================
// AvisoPrivacidadeCard — destaque institucional do Aviso de
// Privacidade externo (D5 do cardápio Aviso). Reaproveita a API
// /api/politicas e foca apenas no item type=AVISO_PRIVACIDADE_EXTERNO.
// Mostra status (sem · rascunho · publicado), abre direto no editor
// quando existe e oferece "Ver URL pública" quando está publicado.
// ============================================================

interface AvisoPolicyItem {
  id: string;
  type: string;
  status: string;
  publicUrl: string | null;
  publishedAt: string | null;
  currentContent: string;
  publishedContent: string | null;
}

function AvisoPrivacidadeCard() {
  const [items, setItems] = useState<AvisoPolicyItem[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/politicas");
        if (res.ok) {
          const data = await res.json();
          setItems(
            (data.items ?? []).filter(
              (p: AvisoPolicyItem) => p.type === "AVISO_PRIVACIDADE_EXTERNO",
            ),
          );
        } else if (res.status === 403) {
          setForbidden(true);
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Pega o aviso publicado (preferido) ou o rascunho mais recente.
  const publicado = items?.find((p) => p.status === "PUBLICADA") ?? null;
  const rascunho = items?.find((p) => p.status === "RASCUNHO") ?? null;
  const aviso = publicado ?? rascunho ?? null;
  const outdated =
    publicado &&
    publicado.publishedContent !== null &&
    publicado.currentContent !== publicado.publishedContent;

  const color: ToolCardColor = forbidden
    ? "neutral"
    : !aviso
      ? "neutral"
      : publicado && !outdated
        ? "success"
        : "warning";

  const stats: Stat[] = forbidden
    ? []
    : !aviso
      ? []
      : publicado
        ? [
            {
              label: "publicado",
              value:
                publicado.publishedAt
                  ? new Date(publicado.publishedAt).toLocaleDateString("pt-BR")
                  : "sim",
              color: "emerald",
              icon: <CheckCircle2 className="h-3.5 w-3.5" />,
            },
            ...(outdated
              ? [
                  {
                    label: "rascunho mais novo",
                    value: "atualize a publicação",
                    color: "amber" as const,
                    icon: <AlertCircle className="h-3.5 w-3.5" />,
                  },
                ]
              : []),
          ]
        : [
            {
              label: "rascunho",
              value: "aguardando publicação",
              color: "amber",
              icon: <Clock className="h-3.5 w-3.5" />,
            },
          ];

  const primaryAction = aviso
    ? {
        label: publicado ? "Abrir Aviso publicado" : "Concluir rascunho",
        href: `/dashboard/politicas/${aviso.id}`,
      }
    : {
        label: "Criar do template",
        href: "/dashboard/politicas?novo=AVISO_PRIVACIDADE_EXTERNO",
      };

  const secondaryAction =
    publicado && publicado.publicUrl
      ? {
          label: "Ver URL pública",
          href: publicado.publicUrl,
          icon: <ExternalLink className="h-3.5 w-3.5" />,
        }
      : undefined;

  return (
    <ToolCard
      icon={<Shield className="h-6 w-6" />}
      iconColor="text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/40"
      title="Aviso de Privacidade"
      description="Documento público institucional (Art. 9º LGPD) no formato ANPD — 12 seções estruturadas, com link pro formulário público de Direitos do Titular e pra Política de Cookies. Versionado, exportável em DOCX/PDF e publicado em URL pública pra titulares."
      progressColor={color}
      loading={loading}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
      stats={stats}
      emptyHint={
        forbidden
          ? "Esta tela é trabalhada pelo DPO da organização."
          : !aviso
            ? "Sem Aviso de Privacidade publicado. Crie do template oficial ANPD — já vem preenchido com os dados da sua organização."
            : undefined
      }
    />
  );
}

// ============================================================
// RipdCardTools — RIPD institucional (vizinho do PoliticasCard)
// ============================================================

function RipdCardTools() {
  const [ripd, setRipd] = useState<RipdResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // RIPD é visível pra DPO + Contribuidor (escopo filtrado server-side)
        const res = await fetch("/api/ripd");
        if (res.ok) setRipd(await res.json());
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = ripd?.stats.total ?? 0;
  const aprovados = ripd?.stats.byStatus.APROVADO ?? 0;
  const rascunhos = ripd?.stats.byStatus.RASCUNHO ?? 0;
  const emRevisao = ripd?.stats.byStatus.EM_REVISAO ?? 0;

  // Cor: neutral=zero; success=tem aprovado e nada em revisão/rascunho;
  // warning=tem itens pendentes
  const color: ToolCardColor =
    total === 0
      ? "neutral"
      : aprovados > 0 && rascunhos === 0 && emRevisao === 0
        ? "success"
        : "warning";

  return (
    <ToolCard
      icon={<FileCheck2 className="h-6 w-6" />}
      iconColor="text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/40"
      title="RIPD"
      description="Relatório de Impacto à Proteção de Dados — documento institucional exigido pela LGPD pra processos de alto risco. 8 seções estruturadas, pré-populadas a partir do Inventário, Riscos, GAP e Plano de Ação."
      progressColor={color}
      loading={loading}
      primaryAction={{
        label: total > 0 ? "Abrir RIPDs" : "Criar primeiro RIPD",
        href: "/dashboard/ripd",
      }}
      stats={
        ripd && total > 0
          ? [
              {
                label: "RIPDs",
                value: total,
                icon: <FileCheck2 className="h-3.5 w-3.5" />,
              },
              {
                label: "aprovados",
                value: aprovados,
                color: "emerald",
                icon: <CheckCircle2 className="h-3.5 w-3.5" />,
              },
              ...(emRevisao > 0
                ? [
                    {
                      label: "em revisão",
                      value: emRevisao,
                      color: "blue" as const,
                      icon: <Clock className="h-3.5 w-3.5" />,
                    },
                  ]
                : []),
              ...(rascunhos > 0
                ? [
                    {
                      label: "em rascunho",
                      value: rascunhos,
                      color: "amber" as const,
                      icon: <AlertCircle className="h-3.5 w-3.5" />,
                    },
                  ]
                : []),
            ]
          : []
      }
      emptyHint={
        total === 0
          ? "Crie o RIPD pros processos de alto risco: cadastre, vincule a um processo aprovado do Inventário e o documento nasce 80% pré-preenchido."
          : undefined
      }
    />
  );
}

// ============================================================
// LiaCardTools — Avaliação de Legítimo Interesse (4º card Fase 6, CP21)
// ============================================================

function LiaCardTools() {
  const [data, setData] = useState<LiaResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // LIA visível pra DPO + Contribuidor (escopo aplicado server-side)
        const res = await fetch("/api/lia");
        if (res.ok) setData(await res.json());
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = data?.stats.total ?? 0;
  const aprovadas = data?.stats.byStatus.APROVADO ?? 0;
  const emRevisao = data?.stats.byStatus.EM_REVISAO ?? 0;
  const rascunhos = data?.stats.byStatus.RASCUNHO ?? 0;
  const blocked = data?.stats.blocked ?? 0;

  // Cor: warning se há LIA bloqueada (Art. 11/14) ou pendências; success
  // se tem aprovada e nada pendente; neutral se vazio.
  const color: ToolCardColor =
    total === 0
      ? "neutral"
      : blocked > 0
        ? "warning"
        : aprovadas > 0 && rascunhos === 0 && emRevisao === 0
          ? "success"
          : "warning";

  return (
    <ToolCard
      icon={<Scale className="h-6 w-6" />}
      iconColor="text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/40"
      title="LIA"
      description="Avaliação de Legítimo Interesse — exigida pelo Art. 10 §3º LGPD pra qualquer tratamento que use Art. 7º IX como base legal. 3 etapas estruturadas (Finalidade · Necessidade · Balanceamento) com workflow de aprovação."
      progressColor={color}
      loading={loading}
      primaryAction={{
        label: total > 0 ? "Abrir LIAs" : "Criar primeira LIA",
        href: "/dashboard/lia",
      }}
      stats={
        data && total > 0
          ? [
              {
                label: "LIAs",
                value: total,
                icon: <Scale className="h-3.5 w-3.5" />,
              },
              {
                label: "aprovadas",
                value: aprovadas,
                color: "emerald",
                icon: <CheckCircle2 className="h-3.5 w-3.5" />,
              },
              ...(emRevisao > 0
                ? [
                    {
                      label: "em revisão",
                      value: emRevisao,
                      color: "blue" as const,
                      icon: <Clock className="h-3.5 w-3.5" />,
                    },
                  ]
                : []),
              ...(rascunhos > 0
                ? [
                    {
                      label: "em rascunho",
                      value: rascunhos,
                      color: "amber" as const,
                      icon: <AlertCircle className="h-3.5 w-3.5" />,
                    },
                  ]
                : []),
              ...(blocked > 0
                ? [
                    {
                      label: "bloqueadas (Art. 11/14)",
                      value: blocked,
                      color: "red" as const,
                      icon: <AlertTriangle className="h-3.5 w-3.5" />,
                    },
                  ]
                : []),
            ]
          : []
      }
      emptyHint={
        total === 0
          ? "Pra cada processo do Inventário que use legítimo interesse como base, cadastre uma LIA. O sistema bloqueia automaticamente a aprovação se o processo tiver dados sensíveis ou de crianças/adolescentes."
          : blocked > 0
            ? "Há LIAs apontando dados sensíveis ou de crianças. Mude a base legal desses processos antes de aprovar."
            : undefined
      }
    />
  );
}

// ============================================================
// TerceirosCardTools — Gestão de Terceiros (3º card Fase 6, Checkpoint 14 G4)
// ============================================================

interface TerceirosResp {
  items: Array<{
    id: string;
    relationType: string;
    contractRiskClass: string;
    contractStatus: string;
  }>;
  stats: {
    total: number;
    byRelation: Record<string, number>;
    byRiskClass: Record<string, number>;
    byContractStatus: Record<string, number>;
    expiringSoon: number;
    needsAttention: number;
  };
}

function TerceirosCardTools() {
  const [data, setData] = useState<TerceirosResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Visível pra DPO + Contribuidor (escopo aplicado server-side)
        const res = await fetch("/api/operadores");
        if (res.ok) setData(await res.json());
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = data?.stats.total ?? 0;
  const alto = data?.stats.byRiskClass.ALTO ?? 0;
  const needsAttention = data?.stats.needsAttention ?? 0;
  const expiringSoon = data?.stats.expiringSoon ?? 0;

  // Cor: neutral=zero; warning=tem pendência crítica ou risco alto;
  // success=tudo ok
  const color: ToolCardColor =
    total === 0
      ? "neutral"
      : needsAttention > 0 || alto > 0 || expiringSoon > 0
        ? "warning"
        : "success";

  return (
    <ToolCard
      icon={<Handshake className="h-6 w-6" />}
      iconColor="text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/40"
      title="Gestão de Terceiros"
      description="Cadastro de operadores com régua de risco ANPD, cláusulas contratuais automáticas e formulário público de avaliação Cyber+LGPD enviado ao próprio terceiro."
      progressColor={color}
      loading={loading}
      primaryAction={{
        label: total > 0 ? "Abrir Gestão de Terceiros" : "Cadastrar primeiro terceiro",
        href: "/dashboard/terceiros",
      }}
      stats={
        data && total > 0
          ? [
              {
                label: "terceiros",
                value: total,
                icon: <Handshake className="h-3.5 w-3.5" />,
              },
              ...(alto > 0
                ? [
                    {
                      label: "risco ALTO",
                      value: alto,
                      color: "red" as const,
                      icon: <AlertCircle className="h-3.5 w-3.5" />,
                    },
                  ]
                : []),
              ...(needsAttention > 0
                ? [
                    {
                      label: "vencidos / sem contrato",
                      value: needsAttention,
                      color: "red" as const,
                      icon: <AlertCircle className="h-3.5 w-3.5" />,
                    },
                  ]
                : []),
              ...(expiringSoon > 0
                ? [
                    {
                      label: "vencendo (90d)",
                      value: expiringSoon,
                      color: "amber" as const,
                      icon: <Clock className="h-3.5 w-3.5" />,
                    },
                  ]
                : []),
            ]
          : []
      }
      emptyHint={
        total === 0
          ? "Cadastre os fornecedores que tratam dados pessoais. A régua ANPD classifica cada contrato (alto/médio/baixo) e sugere a cláusula adequada."
          : undefined
      }
    />
  );
}

// ============================================================
// Fase 7 — Incidentes (Checkpoint 16 / G1)
// ============================================================

interface IncidentsResponse {
  items: Array<{
    id: string;
    severity: string;
    status: string;
    anpdNotifiedAt: string | null;
    anpdCommunicationRequired: boolean;
    anpdDeadline: { level: "OK" | "WARN" | "CRITICAL" } | null;
  }>;
  stats: {
    total: number;
    open: number;
    closed: number;
    falsePositives: number;
    pendingAnpd: number;
    criticalDeadline: number;
  };
}

function Fase7Tools() {
  const [data, setData] = useState<IncidentsResponse | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/incidents");
        if (r.ok) {
          setData(await r.json());
        } else if (r.status === 403) {
          setForbidden(true);
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = data?.stats;
  const total = stats?.total ?? 0;
  const open = stats?.open ?? 0;
  const critical = stats?.criticalDeadline ?? 0;

  // Cor da borda esquerda: vermelho se prazo crítico, âmbar se há abertos,
  // verde se tudo encerrado, cinza se vazio.
  const color: ToolCardColor =
    forbidden || total === 0
      ? "neutral"
      : critical > 0
        ? "warning"
        : open === 0
          ? "success"
          : "warning";

  return (
    <div className="grid grid-cols-1 gap-4">
      <ToolCard
        icon={<AlertTriangle className="h-6 w-6" />}
        iconColor="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/40"
        title="Incidentes de Segurança"
        description="Resposta a incidentes envolvendo dados pessoais (Art. 48 LGPD · prazo de 3 dias úteis pra ANPD)."
        progressColor={color}
        loading={loading}
        primaryAction={{
          label:
            total > 0 ? "Abrir Incidentes" : "Registrar primeiro incidente",
          href: "/dashboard/incidentes",
        }}
        stats={
          forbidden
            ? []
            : total > 0
              ? [
                  {
                    label: "registrados",
                    value: total,
                    icon: <AlertTriangle className="h-3.5 w-3.5" />,
                  },
                  {
                    label: "em aberto",
                    value: open,
                    color: open > 0 ? "amber" : "default",
                    icon: <Clock className="h-3.5 w-3.5" />,
                  },
                  ...(critical > 0
                    ? [
                        {
                          label: "prazo crítico",
                          value: critical,
                          color: "red" as const,
                          icon: <AlertCircle className="h-3.5 w-3.5" />,
                        },
                      ]
                    : []),
                  ...(stats && stats.closed > 0
                    ? [
                        {
                          label: "encerrados",
                          value: stats.closed,
                          color: "emerald" as const,
                          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                        },
                      ]
                    : []),
                ]
              : []
        }
        emptyHint={
          forbidden
            ? "Esta tela é trabalhada pelo DPO da organização."
            : total === 0
              ? "Nenhum incidente registrado. Abra a tela e use 'Registrar incidente' pra documentar o primeiro caso."
              : undefined
        }
      />
    </div>
  );
}

// ============================================================
// ToolCard — componente reusável pros cards de mini-app
// ============================================================

type ToolCardColor = "neutral" | "warning" | "success";
type StatColor = "default" | "emerald" | "amber" | "blue" | "red";

interface Stat {
  label: string;
  value: number | string;
  color?: StatColor;
  icon?: React.ReactNode;
}

interface ToolCardProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
  progressColor: ToolCardColor;
  loading?: boolean;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string; icon?: React.ReactNode };
  stats: Stat[];
  emptyHint?: string;
}

const STAT_COLOR_CLASSES: Record<StatColor, string> = {
  default: "text-gray-700 dark:text-gray-300",
  emerald: "text-emerald-700 dark:text-emerald-300",
  amber: "text-amber-700 dark:text-amber-300",
  blue: "text-blue-700 dark:text-blue-300",
  red: "text-red-700 dark:text-red-300",
};

const PROGRESS_BORDER: Record<ToolCardColor, string> = {
  neutral: "border-l-gray-300 dark:border-l-gray-700",
  warning: "border-l-amber-400 dark:border-l-amber-500",
  success: "border-l-emerald-500 dark:border-l-emerald-500",
};

function ToolCard({
  icon,
  iconColor,
  title,
  description,
  progressColor,
  loading,
  primaryAction,
  secondaryAction,
  stats,
  emptyHint,
}: ToolCardProps) {
  return (
    <div
      className={cn(
        "border rounded-lg p-4 bg-white dark:bg-gray-950 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-900/30",
        "border-l-4",
        PROGRESS_BORDER[progressColor]
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("p-2 rounded-lg shrink-0", iconColor)}>{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="text-xs text-gray-400 mb-3">Carregando…</div>
      ) : stats.length > 0 ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3 text-sm">
          {stats.map((s, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center gap-1.5",
                STAT_COLOR_CLASSES[s.color ?? "default"]
              )}
            >
              {s.icon}
              <strong className="font-bold">{s.value}</strong>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {s.label}
              </span>
            </span>
          ))}
        </div>
      ) : emptyHint ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-3">
          {emptyHint}
        </p>
      ) : null}

      {/* Ações */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button asChild size="sm">
          <Link href={primaryAction.href}>
            {primaryAction.label}
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </Button>
        {secondaryAction && (
          <Button asChild variant="outline" size="sm">
            <Link href={secondaryAction.href}>
              {secondaryAction.icon}
              <span className={secondaryAction.icon ? "ml-1.5" : ""}>
                {secondaryAction.label}
              </span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
