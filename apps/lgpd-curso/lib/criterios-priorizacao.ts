// Critérios de Priorização — Resolução CD/ANPD nº 2, de 27/01/2022.
//
// A Resolução estrutura o ALTO RISCO em 2 critérios que se combinam (regra
// "1+1"): o tratamento é de alto risco quando atende a pelo menos UM critério
// GERAL **E** a pelo menos UM critério ESPECÍFICO.
//
//   • Critério GERAL (larga escala) — 3 fatores; atendido se ≥1 marcado:
//       a) número significativo de titulares · b) volume de dados ·
//       c) duração, frequência e extensão geográfica.
//   • Critério ESPECÍFICO — 4 hipóteses; atendido se ≥1 marcada:
//       a) tecnologias emergentes/inovadoras · b) vigilância de zonas públicas ·
//       c) decisões unicamente automatizadas/profiling · d) dados sensíveis ou
//       de crianças, adolescentes e idosos.
//
// Aqui o participante MARCA a presença de cada fator (Aplica / Não aplica) em
// cada processo — não há gradação. A prioridade vem do veredito de alto risco
// + do número de critérios marcados.

export type NivelCriterio = "sim" | "nao"; // presença: "sim" = aplica
export type GrupoCriterio = "geral" | "especifico";

export type OpcaoCriterio = {
  id: NivelCriterio;
  rotulo: string;
  pontos: number;
};

export type CriterioPriorizacao = {
  id: string;
  grupo: GrupoCriterio;
  emoji: string;
  titulo: string;
  hint: string; // redação do fator conforme a Resolução
  opcoes: OpcaoCriterio[];
};

function crit(
  id: string,
  grupo: GrupoCriterio,
  emoji: string,
  titulo: string,
  hint: string,
): CriterioPriorizacao {
  return {
    id,
    grupo,
    emoji,
    titulo,
    hint,
    opcoes: [
      { id: "sim", rotulo: "Aplica", pontos: 1 },
      { id: "nao", rotulo: "Não aplica", pontos: 0 },
    ],
  };
}

export const CRITERIOS_PRIORIZACAO: CriterioPriorizacao[] = [
  // ── Critério GERAL — larga escala (atendido se ≥1 fator marcado) ──────────
  crit(
    "g-titulares",
    "geral",
    "👥",
    "Número significativo de titulares",
    "O tratamento abrange um número significativo de titulares de dados.",
  ),
  crit(
    "g-volume",
    "geral",
    "🗂️",
    "Volume de dados envolvidos",
    "O tratamento envolve volume significativo de dados pessoais.",
  ),
  crit(
    "g-extensao",
    "geral",
    "🌍",
    "Duração, frequência e extensão geográfica",
    "Considera a duração, a frequência e a extensão geográfica do tratamento realizado.",
  ),
  // ── Critério ESPECÍFICO — hipóteses de risco (atendido se ≥1 marcada) ─────
  crit(
    "e-tecnologias",
    "especifico",
    "🤖",
    "Tecnologias emergentes ou inovadoras",
    "Uso de tecnologias emergentes ou inovadoras.",
  ),
  crit(
    "e-vigilancia",
    "especifico",
    "📹",
    "Vigilância de zonas acessíveis ao público",
    "Vigilância ou controle de zonas acessíveis ao público.",
  ),
  crit(
    "e-automatizadas",
    "especifico",
    "⚙️",
    "Decisões unicamente automatizadas / profiling",
    "Decisões tomadas unicamente com base em tratamento automatizado de dados pessoais, inclusive aquelas destinadas a definir o perfil pessoal, profissional, de saúde, de consumo e de crédito ou os aspectos da personalidade do titular.",
  ),
  crit(
    "e-sensiveis",
    "especifico",
    "🔒",
    "Dados sensíveis ou de vulneráveis",
    "Utilização de dados pessoais sensíveis ou de dados pessoais de crianças, de adolescentes e de idosos.",
  ),
];

export const CRITERIOS_GERAIS = CRITERIOS_PRIORIZACAO.filter((c) => c.grupo === "geral");
export const CRITERIOS_ESPECIFICOS = CRITERIOS_PRIORIZACAO.filter((c) => c.grupo === "especifico");

// Cada critério marcado vale 1 ponto; "score" = nº de critérios que se aplicam.
export const PONTOS_MAXIMO_POR_PROCESSO = CRITERIOS_PRIORIZACAO.length; // 7

function marcado(criterios: Record<string, NivelCriterio>, id: string): boolean {
  return criterios?.[id] === "sim";
}

export function geralAtendido(criterios: Record<string, NivelCriterio>): boolean {
  return CRITERIOS_GERAIS.some((c) => marcado(criterios, c.id));
}
export function especificoAtendido(criterios: Record<string, NivelCriterio>): boolean {
  return CRITERIOS_ESPECIFICOS.some((c) => marcado(criterios, c.id));
}

// Regra "1+1": alto risco quando há ≥1 critério geral E ≥1 específico marcados.
export function ehAltoRisco(criterios: Record<string, NivelCriterio>): boolean {
  return geralAtendido(criterios) && especificoAtendido(criterios);
}

export function calcularScorePriorizacao(criterios: Record<string, NivelCriterio>): number {
  return CRITERIOS_PRIORIZACAO.filter((c) => marcado(criterios, c.id)).length;
}

// Faixa por CONTAGEM de critérios marcados (0-7) — usada na agregação do
// telão (Modo Cards). O veredito de alto risco em si vem de ehAltoRisco; esta
// faixa é só um resumo visual de "quantos critérios se aplicam".
export function faixaPriorizacao(score: number): { label: string; cor: string } {
  if (score >= 5) return { label: "Muitos critérios", cor: "red" };
  if (score >= 2) return { label: "Alguns critérios", cor: "amber" };
  return { label: "Poucos critérios", cor: "emerald" };
}

// Veredito do processo, a partir das marcações.
export function vereditoPriorizacao(criterios: Record<string, NivelCriterio>): {
  altoRisco: boolean;
  marcados: number;
  label: string;
  cor: "red" | "gray";
} {
  const altoRisco = ehAltoRisco(criterios);
  return {
    altoRisco,
    marcados: calcularScorePriorizacao(criterios),
    label: altoRisco ? "Alto risco" : "Risco padrão",
    cor: altoRisco ? "red" : "gray",
  };
}

// Tipos pro JSON salvo
export type PriorizacaoProcessoSalva = {
  processoId: string;
  criterios: Record<string, NivelCriterio>;
  score: number; // nº de critérios marcados
  altoRisco: boolean;
  justificativa: string;
};

export type PriorizacaoSalva = {
  processos: PriorizacaoProcessoSalva[];
  atualizadoEm: string;
};
