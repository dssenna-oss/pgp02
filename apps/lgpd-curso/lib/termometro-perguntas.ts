// Termômetro Institucional — auto-diagnóstico de maturidade LGPD percebida.
// Aplicado pelo grupo na FASE PRELIMINAR (início do curso) e repetido na
// REFLEXÃO FINAL (fim do curso) pra evidenciar a evolução.
//
// 5 dimensões × 4 opções fechadas (escala qualitativa Inicial → Avançado).
// Cada opção = 5/10/15/20 pontos. Score máximo = 100 (5 × 20).
//
// Decisão UX: opções fechadas em vez de texto livre — economiza tempo
// (curso tem 3h cronometradas; cada minuto importa) e padroniza o
// vocabulário pra comparação entre grupos no debrief.

export type NivelTermometro = "inicial" | "desenvolvimento" | "estabelecido" | "avancado";

export type OpcaoTermometro = {
  id: NivelTermometro;
  rotulo: string;
  pontos: number;
  descricao: string;
};

export type DimensaoTermometro = {
  id: string;
  emoji: string;
  titulo: string;
  hint: string; // 1 linha que aparece abaixo do título
  opcoes: OpcaoTermometro[];
};

// Helper pra evitar repetir os 4 níveis padrão. Só muda a descrição de cada.
function dim(
  id: string,
  emoji: string,
  titulo: string,
  hint: string,
  desc: [string, string, string, string],
): DimensaoTermometro {
  return {
    id,
    emoji,
    titulo,
    hint,
    opcoes: [
      { id: "inicial",         rotulo: "Inicial",          pontos: 5,  descricao: desc[0] },
      { id: "desenvolvimento", rotulo: "Em desenvolvimento", pontos: 10, descricao: desc[1] },
      { id: "estabelecido",    rotulo: "Estabelecido",     pontos: 15, descricao: desc[2] },
      { id: "avancado",        rotulo: "Avançado",         pontos: 20, descricao: desc[3] },
    ],
  };
}

export const DIMENSOES_TERMOMETRO: DimensaoTermometro[] = [
  dim(
    "conhecimento",
    "📚",
    "Conhecimento geral sobre LGPD da equipe",
    "Qual o nível médio de conhecimento dos servidores envolvidos no tratamento de dados?",
    [
      "A maioria da equipe nunca ouviu falar de LGPD, ou tem percepção bem vaga sobre o assunto.",
      "Alguns servidores conhecem o básico da LGPD, mas é minoria — o conhecimento não é compartilhado.",
      "Boa parte da equipe sabe o essencial: direitos do titular, bases legais, prazos da Lei.",
      "Equipe foi capacitada formalmente nos últimos 12 meses — há domínio prático do tema.",
    ],
  ),
  dim(
    "apoio_gestao",
    "🏛",
    "Apoio percebido da Alta Gestão",
    "Como você percebe o engajamento dos principais gestores (Prefeito/Presidente, secretários)?",
    [
      "A Alta Gestão desconhece ou minimiza a importância — LGPD não está na agenda institucional.",
      "Reconhece como importante, mas não prioriza — sem orçamento ou tempo dedicado pro tema.",
      "Apoia formalmente (portaria, ato de nomeação do Encarregado, reuniões periódicas com Comitê).",
      "Patrocina ativamente — cobra resultados, integra LGPD à agenda estratégica do órgão.",
    ],
  ),
  dim(
    "cultura",
    "🌱",
    "Cultura de proteção de dados",
    "Como os dados pessoais são tratados no dia-a-dia, fora do que está formalizado?",
    [
      "Dados são tratados sem critério — senhas compartilhadas, planilhas abertas, papéis sobre a mesa.",
      "Há consciência pontual de alguns servidores, mas a prática é inconsistente entre setores.",
      "Práticas mínimas adotadas e respeitadas (controle de acesso, descarte seguro, sigilo).",
      "Cultura institucional consolidada — proteção de dados é parte do DNA do órgão.",
    ],
  ),
  dim(
    "recursos",
    "💼",
    "Recursos disponíveis (humanos, financeiros, tecnológicos)",
    "Quanto o órgão investe em pessoas, ferramentas e orçamento dedicados à adequação?",
    [
      "Praticamente zero — sem orçamento, sem ferramentas próprias, sem servidores dedicados ao tema.",
      "Algumas pessoas em tempo parcial cuidam, sem ferramentas próprias nem orçamento previsto.",
      "Equipe definida, orçamento previsto pra próximo exercício, ferramentas básicas implantadas.",
      "Equipe dedicada exclusiva, orçamento robusto, ferramentas especializadas (sistemas, consultoria).",
    ],
  ),
  dim(
    "urgencia",
    "⏱",
    "Urgência institucional percebida",
    "Quão prioritária é a adequação à LGPD na lista de prioridades do órgão?",
    [
      "Não é prioridade — outros assuntos vêm sempre primeiro; LGPD fica pra depois.",
      "Reconhecida como importante, mas sem prazo definido ou marcos institucionais.",
      "Há cronograma e marcos institucionais formalizados — adequação tem data pra concluir.",
      "Prioridade máxima — equipe mobilizada com metas claras e cobrança periódica de avanços.",
    ],
  ),
];

export const SCORE_MAXIMO = DIMENSOES_TERMOMETRO.length * 20; // 100

// Faixas qualitativas pro feedback pós-preenchimento (e pro debrief comparativo)
export function faixaQualitativa(score: number): { label: string; cor: string; descricao: string } {
  if (score >= 80) return { label: "Maturidade Avançada", cor: "emerald", descricao: "Órgão referência — adequação consolidada com cultura forte." };
  if (score >= 60) return { label: "Maturidade Estabelecida", cor: "blue", descricao: "Boa base institucional — falta consolidar práticas em alguns pontos." };
  if (score >= 40) return { label: "Maturidade em Desenvolvimento", cor: "amber", descricao: "Caminho iniciado — precisa estruturar mais o trabalho." };
  if (score >= 20) return { label: "Maturidade Inicial", cor: "orange", descricao: "Pontos de partida identificados — agora é começar com método." };
  return { label: "Diagnóstico de Partida", cor: "gray", descricao: "Quase nada estruturado — exatamente por isso vocês estão aqui." };
}

// Tipos pro JSON salvo na Company.termometroInicio / termometroFim
export type TermometroSalvo = {
  dimensoes: Array<{
    id: string;
    opcaoEscolhida: NivelTermometro;
    pontos: number;
  }>;
  score: number;
  finalizadoEm: string; // ISO
  preenchidoPor?: string; // nome do user que finalizou (opcional, descritivo)
};

// Calcula score a partir das respostas
export function calcularScoreTermometro(
  respostas: Record<string, NivelTermometro>,
): number {
  let soma = 0;
  for (const dim of DIMENSOES_TERMOMETRO) {
    const escolhida = respostas[dim.id];
    if (!escolhida) continue;
    const opcao = dim.opcoes.find((o) => o.id === escolhida);
    if (opcao) soma += opcao.pontos;
  }
  return soma;
}
