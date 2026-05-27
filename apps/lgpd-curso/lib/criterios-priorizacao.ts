// Critérios de Priorização de Processos pra Fase 2 do PGP.
//
// Base: Resolução CD/ANPD nº 2, de 27/01/2022 (alto risco / agentes de
// pequeno porte) + boas práticas de privacy-by-design.
//
// 6 critérios × 3 níveis (Baixo/Médio/Alto = 1/2/3 pts).
// Score máximo: 6 × 3 = 18. Faixas: 0-6 BAIXA · 7-12 MÉDIA · 13-18 ALTA.

export type NivelCriterio = "baixo" | "medio" | "alto";

export type OpcaoCriterio = {
  id: NivelCriterio;
  rotulo: string;
  pontos: number;
  descricao: string;
};

export type CriterioPriorizacao = {
  id: string;
  emoji: string;
  titulo: string;
  hint: string;
  opcoes: OpcaoCriterio[];
};

function crit(
  id: string,
  emoji: string,
  titulo: string,
  hint: string,
  desc: [string, string, string],
): CriterioPriorizacao {
  return {
    id,
    emoji,
    titulo,
    hint,
    opcoes: [
      { id: "baixo", rotulo: "Baixo", pontos: 1, descricao: desc[0] },
      { id: "medio", rotulo: "Médio", pontos: 2, descricao: desc[1] },
      { id: "alto",  rotulo: "Alto",  pontos: 3, descricao: desc[2] },
    ],
  };
}

export const CRITERIOS_PRIORIZACAO: CriterioPriorizacao[] = [
  crit(
    "volume",
    "👥",
    "Volume de titulares afetados",
    "Quantas pessoas têm dados tratados por este processo?",
    [
      "Até 100 titulares — alcance pontual",
      "De 100 a 1.000 titulares — alcance considerável",
      "Mais de 1.000 titulares — grande volume",
    ],
  ),
  crit(
    "sensibilidade",
    "🔒",
    "Sensibilidade dos dados",
    "Os dados tratados se enquadram no Art. 5º II da LGPD (sensíveis)?",
    [
      "Dados cadastrais comuns (nome, CPF, endereço)",
      "Dados pessoais que podem expor a privacidade ou intimidade",
      "Dados sensíveis: saúde, opinião política, religiosa, biométricos, sexuais",
    ],
  ),
  crit(
    "vulneraveis",
    "👶",
    "Vulnerabilidade dos titulares",
    "Há tratamento de dados de crianças, adolescentes, idosos ou outros vulneráveis?",
    [
      "Apenas adultos plenamente capazes",
      "Eventualmente menores, idosos ou vulneráveis",
      "Tratamento sistemático de dados de vulneráveis (crianças, adolescentes, idosos)",
    ],
  ),
  crit(
    "exposicao",
    "📣",
    "Exposição pública dos dados",
    "Os dados são publicizados ou compartilhados com público amplo?",
    [
      "Dados restritos à área que coleta",
      "Compartilhamento limitado entre setores ou parceiros",
      "Publicação ampla (portal, transmissão pública, redes sociais)",
    ],
  ),
  crit(
    "tecnologias",
    "🤖",
    "Uso de tecnologias inovadoras",
    "Há IA, decisões automatizadas, biometria ou tecnologias emergentes?",
    [
      "Apenas registros/planilhas tradicionais",
      "Sistemas digitais convencionais (formulários, BD relacional)",
      "Tecnologias inovadoras: IA, biometria, decisões automatizadas com efeitos jurídicos",
    ],
  ),
  crit(
    "compartilhamentos",
    "🤝",
    "Compartilhamentos com terceiros",
    "O processo envolve compartilhamento de dados com operadores ou outros controladores?",
    [
      "Sem compartilhamento ou apenas interno",
      "Compartilhamento pontual com 1-2 operadores/órgãos",
      "Múltiplos compartilhamentos ou transferência internacional",
    ],
  ),
];

export const PONTOS_MAXIMO_POR_PROCESSO = CRITERIOS_PRIORIZACAO.length * 3; // 18

export function faixaPriorizacao(score: number): { label: string; cor: string } {
  if (score >= 13) return { label: "Alta prioridade", cor: "red" };
  if (score >= 7)  return { label: "Média prioridade", cor: "amber" };
  return { label: "Baixa prioridade", cor: "emerald" };
}

// Tipos pro JSON salvo
export type PriorizacaoProcessoSalva = {
  processoId: string;
  criterios: Record<string, NivelCriterio>;
  score: number;
  justificativa: string;
};

export type PriorizacaoSalva = {
  processos: PriorizacaoProcessoSalva[];
  atualizadoEm: string;
};

export function calcularScorePriorizacao(criterios: Record<string, NivelCriterio>): number {
  let s = 0;
  for (const c of CRITERIOS_PRIORIZACAO) {
    const escolhido = criterios[c.id];
    if (!escolhido) continue;
    const op = c.opcoes.find((o) => o.id === escolhido);
    if (op) s += op.pontos;
  }
  return s;
}
