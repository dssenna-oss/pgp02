/**
 * Engine pura de cálculo de maturidade do PGP (Checkpoint 15 / Opção 1).
 *
 * Junta os indicadores das 7 Fases do programa num **score único 0-100**
 * + status detalhado por fase, pra alimentar o Painel de Maturidade do
 * PGP (`/dashboard/maturidade-pgp`).
 *
 * Pesos do score consolidado (decisão da sessão 2026-05-05):
 *   - Diagnóstico de Privacidade: 40%
 *   - Plano de Ação em dia:        20%
 *   - Políticas publicadas:        15%
 *   - RIPDs aprovados:             15%
 *   - Terceiros adequados:         10%
 *
 * Engine pura — não depende de Prisma. A API que carrega os dados
 * vive em `app/api/maturidade-pgp/route.ts` e injeta as entradas.
 */

// ============================================================
// Entradas (dados crus de cada fase)
// ============================================================

export interface MaturityInput {
  /** Diagnóstico de Privacidade — score 0-100 (Checkpoint 10). */
  diagnosticoScore: number | null;

  /** Inventário de processos. */
  inventario: {
    total: number;
    aprovados: number;
    rascunhos: number;
    submetidos: number;
  };

  /** Análise de Riscos. */
  riscos: {
    totalProcessos: number;
    processosAnalisados: number;
    riscosAlto: number;
    riscosMedio: number;
    riscosBaixo: number;
    riscosIdentificadosSemMitigacao: number;
  };

  /** GAP Analysis. */
  gap: {
    totalControles: number; // 119
    respondidos: number;
    aderentes: number;
    parciais: number;
    naoAderentes: number;
  };

  /** Plano de Ação. */
  plano: {
    total: number;
    emAberto: number;
    concluidas: number;
    atrasadas: number;
    vencendo7d: number;
  };

  /** Políticas LGPD (Checkpoint 12). */
  politicas: {
    total: number;
    publicadas: number;
    rascunhos: number;
    /** Existe a Política do PGP (mater)? Conta separado pra evidenciar. */
    hasPoliticaPgp: boolean;
  };

  /** RIPDs (Checkpoint 13). */
  ripd: {
    total: number;
    aprovados: number;
    emRevisao: number;
    rascunhos: number;
  };

  /** Operadores / Terceiros (Checkpoint 14). */
  terceiros: {
    total: number;
    adequados: number;
    emAdequacao: number;
    naoAvaliados: number;
    riscoAlto: number;
    semContrato: number;
  };

  /** Equipe (Fase 1). */
  equipe: {
    totalUsuarios: number;
    dpos: number;
    contribuidores: number;
    hasDpoCadastrado: boolean;
  };

  /** Incidentes (Checkpoint 16). Alimenta a Fase 7 e pendências
   * críticas. Não vira pilar separado pra não rebalancear pesos. */
  incidentes: {
    total: number;
    /** Em aberto: tudo exceto ENCERRADO e FALSO_POSITIVO */
    emAberto: number;
    encerrados: number;
    /** Severidade ALTO/MEDIO sem comunicação ANPD (obrigatoriedade legal) */
    pendingAnpd: number;
    /** Prazo regressivo crítico (<24h ou vencido) */
    criticalDeadline: number;
    /** Vencidos (passou dos 72h sem comunicar ANPD) */
    overdueDeadline: number;
  };

  /** LIA — Avaliações de Legítimo Interesse (Checkpoint 21). Não vira pilar
   * separado pra não rebalancear pesos; aparece como pendências críticas. */
  lia: {
    total: number;
    aprovadas: number;
    rascunhos: number;
    emRevisao: number;
    /** LIAs com bloqueio estrutural (Art. 11/14 detectado). Crítico. */
    bloqueadas: number;
    /** Processos APROVADOS que usam Art. 7º IX e ainda NÃO têm LIA cadastrada. */
    semLia: number;
  };
}

// ============================================================
// Saídas
// ============================================================

export type MaturityLevel = "INICIANTE" | "EM_DESENVOLVIMENTO" | "INTERMEDIARIO" | "AVANCADO" | "EXEMPLAR";

export interface PillarScore {
  /** Identificador do pilar. */
  key: "diagnostico" | "plano" | "politicas" | "ripd" | "terceiros";
  label: string;
  /** Score do pilar (0-100). */
  score: number;
  /** Peso do pilar no consolidado (em %, soma 100). */
  weight: number;
  /** Contribuição absoluta pro consolidado (score × weight / 100). */
  contribution: number;
  /** Texto curto explicando o cálculo do pilar pro user. */
  rationale: string;
}

export interface PhaseStatus {
  /** ID da fase: "preliminar" | "1" | "2" | ... | "7". */
  id: string;
  /** Número (0 = preliminar; 1-7 = fases regulares). */
  number: number;
  /** Nome curto. */
  name: string;
  /** Descrição da fase. */
  description: string;
  /** % de progresso da fase (0-100, derivado dos KPIs específicos). */
  progress: number;
  /** Status textual ("Não iniciada" / "Em andamento" / "Em dia" / "Atenção"). */
  statusLabel: string;
  /** Cor visual: neutral / warning / success / danger. */
  statusColor: "neutral" | "warning" | "success" | "danger";
  /** KPIs principais da fase (chave-valor) pra exibir no card. */
  kpis: ReadonlyArray<{ label: string; value: string | number; highlight?: boolean }>;
  /** Link pra tela de detalhe da fase. */
  href: string;
}

export interface MaturityResult {
  /** Score consolidado 0-100. */
  score: number;
  /** Nível qualitativo (mostra na hero da tela). */
  level: MaturityLevel;
  /** Cor da tarja do nível. */
  levelColor: "red" | "amber" | "blue" | "emerald" | "violet";
  /** Texto curto descrevendo o nível. */
  levelDescription: string;
  /** Pilares do score. */
  pillars: ReadonlyArray<PillarScore>;
  /** Status de cada uma das 8 fases (preliminar + 7 regulares). */
  phases: ReadonlyArray<PhaseStatus>;
  /** Pendências críticas que reduzem o score. */
  criticalPending: ReadonlyArray<{ severity: "alta" | "media"; message: string; href?: string }>;
  /** Quando o cálculo foi feito (ISO). */
  computedAt: string;
}

// ============================================================
// Cálculo
// ============================================================

const WEIGHTS = {
  diagnostico: 40,
  plano: 20,
  politicas: 15,
  ripd: 15,
  terceiros: 10,
} as const;

export function computePgpMaturity(input: MaturityInput): MaturityResult {
  // 1) Pilares
  const pillars: PillarScore[] = [
    pillarDiagnostico(input),
    pillarPlano(input),
    pillarPoliticas(input),
    pillarRipd(input),
    pillarTerceiros(input),
  ];

  // 2) Score consolidado (média ponderada das contribuições)
  const score = Math.round(
    pillars.reduce((acc, p) => acc + p.contribution, 0)
  );

  // 3) Nível
  const { level, levelColor, levelDescription } = computeLevel(score);

  // 4) Status das fases
  const phases = computePhases(input);

  // 5) Pendências críticas
  const criticalPending = computeCriticalPending(input);

  return {
    score,
    level,
    levelColor,
    levelDescription,
    pillars,
    phases,
    criticalPending,
    computedAt: new Date().toISOString(),
  };
}

// ----- Pilares -----

function pillarDiagnostico(i: MaturityInput): PillarScore {
  const score = i.diagnosticoScore ?? 0;
  return {
    key: "diagnostico",
    label: "Diagnóstico de Privacidade",
    score,
    weight: WEIGHTS.diagnostico,
    contribution: (score * WEIGHTS.diagnostico) / 100,
    rationale:
      i.diagnosticoScore == null
        ? "Diagnóstico ainda não calculado — score conta como 0."
        : `Score de ${score}/100 do Diagnóstico (Checkpoint 10), composto por GAP (40%), Riscos (30%), Bases Legais (20%) e Inventário (10%).`,
  };
}

function pillarPlano(i: MaturityInput): PillarScore {
  // Score do pilar Plano:
  //   - Sem ações: 0
  //   - Tudo concluído: 100
  //   - Caso geral: % concluídas - penalidade por atrasadas
  const total = i.plano.total;
  let score = 0;
  if (total > 0) {
    const concluidasPct = (i.plano.concluidas / total) * 100;
    const atrasadasPenalty = Math.min(30, (i.plano.atrasadas / total) * 100);
    score = Math.max(0, Math.round(concluidasPct - atrasadasPenalty));
  }
  return {
    key: "plano",
    label: "Plano de Ação em dia",
    score,
    weight: WEIGHTS.plano,
    contribution: (score * WEIGHTS.plano) / 100,
    rationale:
      total === 0
        ? "Nenhuma ação cadastrada no Plano — score 0."
        : `${i.plano.concluidas} de ${total} ações concluídas (${Math.round((i.plano.concluidas / total) * 100)}%); penalidade de até 30 pts por ${i.plano.atrasadas} atrasada(s).`,
  };
}

function pillarPoliticas(i: MaturityInput): PillarScore {
  // Pilar Políticas:
  //   - Política do PGP existir conta 30 pts (é o documento mater)
  //   - +10 pts por política publicada (até 70)
  //   - Total máx 100
  let score = 0;
  if (i.politicas.hasPoliticaPgp) score += 30;
  score += Math.min(70, i.politicas.publicadas * 10);
  score = Math.min(100, score);
  return {
    key: "politicas",
    label: "Políticas publicadas",
    score,
    weight: WEIGHTS.politicas,
    contribution: (score * WEIGHTS.politicas) / 100,
    rationale: i.politicas.hasPoliticaPgp
      ? `Política do PGP ✓ (+30 pts) · ${i.politicas.publicadas} polítca(s) publicada(s) (+${Math.min(70, i.politicas.publicadas * 10)} pts).`
      : `Política do PGP ainda não criada — falta o documento mater. ${i.politicas.publicadas} outra(s) publicada(s).`,
  };
}

function pillarRipd(i: MaturityInput): PillarScore {
  // Pilar RIPD:
  //   - Sem nenhum RIPD: 0
  //   - 1 RIPD aprovado: 50
  //   - 2+ aprovados: 100
  let score = 0;
  if (i.ripd.aprovados >= 2) score = 100;
  else if (i.ripd.aprovados === 1) score = 50;
  else if (i.ripd.total > 0) score = 20; // tem rascunho/em revisão = começou
  return {
    key: "ripd",
    label: "RIPDs aprovados",
    score,
    weight: WEIGHTS.ripd,
    contribution: (score * WEIGHTS.ripd) / 100,
    rationale:
      i.ripd.total === 0
        ? "Nenhum RIPD criado — recomendado para processos de alto risco."
        : `${i.ripd.aprovados} RIPD(s) aprovado(s), ${i.ripd.emRevisao} em revisão, ${i.ripd.rascunhos} em rascunho.`,
  };
}

function pillarTerceiros(i: MaturityInput): PillarScore {
  // Pilar Terceiros:
  //   - Sem terceiros: 70 (não aplicável é OK)
  //   - Caso geral: % adequados - penalidade por risco alto / sem contrato
  const total = i.terceiros.total;
  let score = 70; // default neutro
  if (total > 0) {
    const adequadosPct = (i.terceiros.adequados / total) * 100;
    const altoRiscoPenalty = Math.min(20, (i.terceiros.riscoAlto / total) * 100);
    const semContratoPenalty = Math.min(20, (i.terceiros.semContrato / total) * 100);
    score = Math.max(0, Math.round(adequadosPct - altoRiscoPenalty - semContratoPenalty));
  }
  return {
    key: "terceiros",
    label: "Terceiros adequados",
    score,
    weight: WEIGHTS.terceiros,
    contribution: (score * WEIGHTS.terceiros) / 100,
    rationale:
      total === 0
        ? "Nenhum terceiro cadastrado — pilar parte de score neutro (70)."
        : `${i.terceiros.adequados} de ${total} terceiro(s) adequado(s); ${i.terceiros.riscoAlto} de risco ALTO, ${i.terceiros.semContrato} sem contrato.`,
  };
}

// ----- Nível qualitativo -----

function computeLevel(score: number): {
  level: MaturityLevel;
  levelColor: MaturityResult["levelColor"];
  levelDescription: string;
} {
  if (score >= 85) {
    return {
      level: "EXEMPLAR",
      levelColor: "violet",
      levelDescription:
        "Programa maduro e referencial. Mantém ciclo PDCA ativo, instrumentos íntegros e evidências completas.",
    };
  }
  if (score >= 70) {
    return {
      level: "AVANCADO",
      levelColor: "emerald",
      levelDescription:
        "Programa em estágio avançado. Maioria dos instrumentos operacionais e revisados. Foco em refinos.",
    };
  }
  if (score >= 50) {
    return {
      level: "INTERMEDIARIO",
      levelColor: "blue",
      levelDescription:
        "Programa em estágio intermediário. Estrutura básica funcionando, mas há pilares importantes a fortalecer.",
    };
  }
  if (score >= 25) {
    return {
      level: "EM_DESENVOLVIMENTO",
      levelColor: "amber",
      levelDescription:
        "Programa em desenvolvimento. Primeiros instrumentos no ar, mas vários pilares ainda iniciais.",
    };
  }
  return {
    level: "INICIANTE",
    levelColor: "red",
    levelDescription:
      "Programa em estágio inicial. Foco em criar os instrumentos básicos: Inventário, Diagnóstico, Política do PGP.",
  };
}

// ----- Fases -----

function computePhases(i: MaturityInput): PhaseStatus[] {
  const totalGap = i.gap.totalControles || 119;

  return [
    // Fase Preliminar — Sensibilização
    {
      id: "preliminar",
      number: 0,
      name: "Fase Preliminar",
      description: "Sensibilização e engajamento",
      progress: i.equipe.hasDpoCadastrado ? 100 : 0,
      statusLabel: i.equipe.hasDpoCadastrado ? "Concluída" : "Não iniciada",
      statusColor: i.equipe.hasDpoCadastrado ? "success" : "neutral",
      kpis: [
        { label: "DPO designado", value: i.equipe.hasDpoCadastrado ? "Sim" : "Não", highlight: true },
      ],
      href: "/dashboard/fase-preliminar",
    },

    // Fase 1 — Formação das Equipes
    {
      id: "1",
      number: 1,
      name: "Fase 1",
      description: "Formação das equipes",
      progress: i.equipe.totalUsuarios > 1 ? 100 : i.equipe.totalUsuarios === 1 ? 40 : 0,
      statusLabel: i.equipe.totalUsuarios > 1 ? "Em dia" : i.equipe.totalUsuarios === 1 ? "Em andamento" : "Não iniciada",
      statusColor: i.equipe.totalUsuarios > 1 ? "success" : i.equipe.totalUsuarios === 1 ? "warning" : "neutral",
      kpis: [
        { label: "Usuários", value: i.equipe.totalUsuarios },
        { label: "DPO(s)", value: i.equipe.dpos },
        { label: "Contribuidor(es)", value: i.equipe.contribuidores },
      ],
      href: "/dashboard/fase-1",
    },

    // Fase 2 — Diagnóstico Inicial
    {
      id: "2",
      number: 2,
      name: "Fase 2",
      description: "Diagnóstico inicial",
      progress: i.diagnosticoScore != null ? Math.min(100, i.diagnosticoScore) : 0,
      statusLabel:
        i.diagnosticoScore == null
          ? "Não iniciada"
          : i.diagnosticoScore >= 70
            ? "Em dia"
            : i.diagnosticoScore >= 40
              ? "Em andamento"
              : "Atenção",
      statusColor:
        i.diagnosticoScore == null
          ? "neutral"
          : i.diagnosticoScore >= 70
            ? "success"
            : i.diagnosticoScore >= 40
              ? "warning"
              : "danger",
      kpis: [
        { label: "Score Diagnóstico", value: i.diagnosticoScore != null ? `${i.diagnosticoScore}/100` : "—", highlight: true },
      ],
      href: "/dashboard/diagnostico",
    },

    // Fase 3 — Mapeamento + Análise de Riscos
    {
      id: "3",
      number: 3,
      name: "Fase 3",
      description: "Mapeamento e Análise de Riscos",
      progress: (() => {
        if (i.inventario.total === 0) return 0;
        const aprovPct = (i.inventario.aprovados / i.inventario.total) * 100;
        const analyzedPct = i.riscos.totalProcessos > 0 ? (i.riscos.processosAnalisados / i.riscos.totalProcessos) * 100 : 0;
        return Math.round((aprovPct + analyzedPct) / 2);
      })(),
      statusLabel:
        i.inventario.aprovados === 0
          ? i.inventario.total === 0
            ? "Não iniciada"
            : "Em andamento"
          : i.riscos.processosAnalisados === i.riscos.totalProcessos
            ? "Em dia"
            : "Em andamento",
      statusColor:
        i.inventario.aprovados === 0
          ? i.inventario.total === 0
            ? "neutral"
            : "warning"
          : i.riscos.processosAnalisados === i.riscos.totalProcessos
            ? "success"
            : "warning",
      kpis: [
        { label: "Processos aprovados", value: i.inventario.aprovados },
        { label: "Riscos identificados", value: i.riscos.riscosAlto + i.riscos.riscosMedio + i.riscos.riscosBaixo },
        ...(i.riscos.riscosAlto > 0 ? [{ label: "Risco ALTO", value: i.riscos.riscosAlto, highlight: true }] : []),
      ],
      href: "/dashboard/inventario",
    },

    // Fase 4 — GAP Analysis
    {
      id: "4",
      number: 4,
      name: "Fase 4",
      description: "GAP Analysis (119 controles)",
      progress: Math.round((i.gap.respondidos / totalGap) * 100),
      statusLabel:
        i.gap.respondidos === 0
          ? "Não iniciada"
          : i.gap.respondidos === totalGap
            ? "Em dia"
            : "Em andamento",
      statusColor:
        i.gap.respondidos === 0 ? "neutral" : i.gap.respondidos === totalGap ? "success" : "warning",
      kpis: [
        { label: "Respondidos", value: `${i.gap.respondidos}/${totalGap}`, highlight: true },
        { label: "Aderentes", value: i.gap.aderentes },
        ...(i.gap.naoAderentes > 0 ? [{ label: "Não aderentes", value: i.gap.naoAderentes }] : []),
      ],
      href: "/dashboard/gap-analysis",
    },

    // Fase 5 — Plano de Ação
    {
      id: "5",
      number: 5,
      name: "Fase 5",
      description: "Plano de Ação",
      progress: i.plano.total > 0 ? Math.round((i.plano.concluidas / i.plano.total) * 100) : 0,
      statusLabel:
        i.plano.total === 0
          ? "Não iniciada"
          : i.plano.atrasadas > 0
            ? "Atenção"
            : i.plano.emAberto === 0
              ? "Em dia"
              : "Em andamento",
      statusColor:
        i.plano.total === 0
          ? "neutral"
          : i.plano.atrasadas > 0
            ? "danger"
            : i.plano.emAberto === 0
              ? "success"
              : "warning",
      kpis: [
        { label: "Em aberto", value: i.plano.emAberto },
        { label: "Concluídas", value: i.plano.concluidas },
        ...(i.plano.atrasadas > 0 ? [{ label: "Atrasadas", value: i.plano.atrasadas, highlight: true }] : []),
      ],
      href: "/dashboard/plano-acao",
    },

    // Fase 6 — Execução (Políticas + RIPD + Terceiros)
    {
      id: "6",
      number: 6,
      name: "Fase 6",
      description: "Execução: Políticas, RIPD, Terceiros",
      progress: (() => {
        const polScore = i.politicas.hasPoliticaPgp ? 50 : 0;
        const ripdScore = i.ripd.aprovados > 0 ? 25 : 0;
        const tercScore = i.terceiros.total === 0 ? 25 : Math.round((i.terceiros.adequados / i.terceiros.total) * 25);
        return polScore + ripdScore + tercScore;
      })(),
      statusLabel: i.politicas.hasPoliticaPgp && i.ripd.aprovados > 0 ? "Em dia" : "Em andamento",
      statusColor: i.politicas.hasPoliticaPgp && i.ripd.aprovados > 0 ? "success" : "warning",
      kpis: [
        { label: "Política do PGP", value: i.politicas.hasPoliticaPgp ? "Sim" : "Não", highlight: !i.politicas.hasPoliticaPgp },
        { label: "Políticas publicadas", value: i.politicas.publicadas },
        { label: "RIPDs aprovados", value: i.ripd.aprovados },
        { label: "Terceiros adequados", value: `${i.terceiros.adequados}/${i.terceiros.total || 0}` },
      ],
      href: "/dashboard/fase-6",
    },

    // Fase 7 — Monitoramento (Incidentes — Checkpoint 16)
    {
      id: "7",
      number: 7,
      name: "Fase 7",
      description: "Monitoramento contínuo (Incidentes)",
      progress: (() => {
        const inc = i.incidentes;
        // Sem incidentes = 70 (pilar neutro: monitoramento ativo mas sem
        // ocorrências — equivalente a "operando bem"). Com incidentes:
        // - 100 se todos encerrados ou falsos positivos
        // - Penalidade por overdue (deadline ANPD vencido) e pending
        if (inc.total === 0) return 70;
        const closedPct = ((inc.encerrados) / inc.total) * 100;
        const overduePenalty = Math.min(40, inc.overdueDeadline * 20);
        const criticalPenalty = Math.min(
          20,
          (inc.criticalDeadline - inc.overdueDeadline) * 10
        );
        return Math.max(
          0,
          Math.round(closedPct - overduePenalty - criticalPenalty)
        );
      })(),
      statusLabel:
        i.incidentes.overdueDeadline > 0
          ? "Atenção"
          : i.incidentes.criticalDeadline > 0
            ? "Atenção"
            : i.incidentes.emAberto > 0
              ? "Em andamento"
              : i.incidentes.total > 0
                ? "Em dia"
                : "Sem ocorrências",
      statusColor:
        i.incidentes.overdueDeadline > 0
          ? "danger"
          : i.incidentes.criticalDeadline > 0
            ? "warning"
            : i.incidentes.emAberto > 0
              ? "warning"
              : i.incidentes.total > 0
                ? "success"
                : "neutral",
      kpis: [
        { label: "Total registrados", value: i.incidentes.total },
        { label: "Em aberto", value: i.incidentes.emAberto },
        ...(i.incidentes.criticalDeadline > 0
          ? [
              {
                label: "Prazo crítico",
                value: i.incidentes.criticalDeadline,
                highlight: true,
              },
            ]
          : []),
        ...(i.incidentes.overdueDeadline > 0
          ? [
              {
                label: "ANPD vencido",
                value: i.incidentes.overdueDeadline,
                highlight: true,
              },
            ]
          : []),
        ...(i.incidentes.encerrados > 0
          ? [{ label: "Encerrados", value: i.incidentes.encerrados }]
          : []),
      ],
      href: "/dashboard/incidentes",
    },
  ];
}

// ----- Pendências críticas -----

function computeCriticalPending(
  i: MaturityInput
): MaturityResult["criticalPending"] {
  const out: Array<{ severity: "alta" | "media"; message: string; href?: string }> = [];

  if (!i.equipe.hasDpoCadastrado) {
    out.push({
      severity: "alta",
      message: "Encarregado (DPO) ainda não foi designado formalmente.",
      href: "/dashboard/empresa",
    });
  }

  if (!i.politicas.hasPoliticaPgp) {
    out.push({
      severity: "alta",
      message: "Política do PGP (documento mater) ainda não foi criada.",
      href: "/dashboard/politicas",
    });
  }

  if (i.plano.atrasadas > 0) {
    out.push({
      severity: "alta",
      message: `${i.plano.atrasadas} ação(ões) atrasada(s) no Plano de Ação.`,
      href: "/dashboard/plano-acao",
    });
  }

  if (i.riscos.riscosIdentificadosSemMitigacao > 0) {
    out.push({
      severity: "alta",
      message: `${i.riscos.riscosIdentificadosSemMitigacao} risco(s) identificado(s) sem plano de mitigação.`,
      href: "/dashboard/riscos",
    });
  }

  if (i.terceiros.semContrato > 0) {
    out.push({
      severity: "alta",
      message: `${i.terceiros.semContrato} terceiro(s) sem contrato celebrado.`,
      href: "/dashboard/terceiros",
    });
  }

  if (i.terceiros.naoAvaliados > 0) {
    out.push({
      severity: "media",
      message: `${i.terceiros.naoAvaliados} terceiro(s) ainda não avaliado(s) (status pré-LGPD).`,
      href: "/dashboard/terceiros",
    });
  }

  if (i.gap.respondidos < (i.gap.totalControles || 119)) {
    const missing = (i.gap.totalControles || 119) - i.gap.respondidos;
    out.push({
      severity: "media",
      message: `${missing} controle(s) do GAP Analysis ainda não respondido(s).`,
      href: "/dashboard/gap-analysis",
    });
  }

  if (i.diagnosticoScore == null) {
    out.push({
      severity: "media",
      message: "Diagnóstico de Privacidade ainda não foi calculado.",
      href: "/dashboard/diagnostico",
    });
  }

  // Incidentes (Checkpoint 16) — prazo legal regressivo é o mais urgente
  if (i.incidentes.overdueDeadline > 0) {
    out.push({
      severity: "alta",
      message: `${i.incidentes.overdueDeadline} incidente(s) com prazo de comunicação à ANPD VENCIDO (Art. 48 LGPD).`,
      href: "/dashboard/incidentes",
    });
  } else if (i.incidentes.criticalDeadline > 0) {
    out.push({
      severity: "alta",
      message: `${i.incidentes.criticalDeadline} incidente(s) com prazo crítico (≤24h) pra comunicar a ANPD.`,
      href: "/dashboard/incidentes",
    });
  }

  if (i.incidentes.pendingAnpd > i.incidentes.criticalDeadline) {
    const additional = i.incidentes.pendingAnpd - i.incidentes.criticalDeadline;
    out.push({
      severity: "media",
      message: `${additional} incidente(s) de severidade ALTO/MEDIO sem comunicação à ANPD.`,
      href: "/dashboard/incidentes",
    });
  }

  // LIA (Checkpoint 21) — bloqueio estrutural é o pior caso (base legal
  // errada); ausência de LIA pra processo 7º IX vem em seguida.
  if (i.lia.bloqueadas > 0) {
    out.push({
      severity: "alta",
      message: `${i.lia.bloqueadas} LIA(s) com bloqueio estrutural — processo usa Art. 7º IX mas trata dados sensíveis ou de crianças/adolescentes (Art. 11/14). Mude a base legal.`,
      href: "/dashboard/lia",
    });
  }
  if (i.lia.semLia > 0) {
    out.push({
      severity: "alta",
      message: `${i.lia.semLia} processo(s) usam Art. 7º IX (legítimo interesse) sem LIA documentada (Art. 10 §3º LGPD).`,
      href: "/dashboard/lia",
    });
  }
  if (i.lia.emRevisao > 0) {
    out.push({
      severity: "media",
      message: `${i.lia.emRevisao} LIA(s) aguardando revisão do DPO.`,
      href: "/dashboard/lia",
    });
  }

  return out;
}

// ============================================================
// Helpers de UI (labels)
// ============================================================

export function maturityLevelLabel(level: MaturityLevel): string {
  switch (level) {
    case "INICIANTE":          return "Iniciante";
    case "EM_DESENVOLVIMENTO": return "Em desenvolvimento";
    case "INTERMEDIARIO":      return "Intermediário";
    case "AVANCADO":           return "Avançado";
    case "EXEMPLAR":           return "Exemplar";
  }
}

export function maturityLevelBadgeClass(c: MaturityResult["levelColor"]): string {
  switch (c) {
    case "violet":
      return "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800";
    case "emerald":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    case "blue":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "amber":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "red":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
  }
}

export function phaseStatusBadgeClass(c: PhaseStatus["statusColor"]): string {
  switch (c) {
    case "success":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800";
    case "warning":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800";
    case "danger":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800";
    case "neutral":
      return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700";
  }
}
