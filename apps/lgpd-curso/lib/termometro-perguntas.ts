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

// As 5 faixas qualitativas, em ORDEM CRESCENTE de maturidade. `min` = score
// mínimo (inclusive) pra cair na faixa. A ordem importa: o painel do
// facilitador monta a distribuição da turma (histograma) a partir deste array.
export type FaixaTermometro = {
  id: string;
  min: number;
  label: string;
  cor: string; // gray | orange | amber | blue | emerald
  descricao: string;
};

export const FAIXAS_TERMOMETRO: FaixaTermometro[] = [
  { id: "partida",         min: 0,  label: "Diagnóstico de Partida",        cor: "gray",    descricao: "Quase nada estruturado — exatamente por isso estão aqui." },
  { id: "inicial",         min: 20, label: "Maturidade Inicial",            cor: "orange",  descricao: "Pontos de partida identificados — agora é começar com método." },
  { id: "desenvolvimento", min: 40, label: "Maturidade em Desenvolvimento", cor: "amber",   descricao: "Caminho iniciado — precisa estruturar mais o trabalho." },
  { id: "estabelecida",    min: 60, label: "Maturidade Estabelecida",       cor: "blue",    descricao: "Boa base institucional — falta consolidar práticas em alguns pontos." },
  { id: "avancada",        min: 80, label: "Maturidade Avançada",           cor: "emerald", descricao: "Órgão referência — adequação consolidada com cultura forte." },
];

// Faixa qualitativa de um score (feedback pós-preenchimento + agregação).
export function faixaQualitativa(score: number): FaixaTermometro {
  for (let i = FAIXAS_TERMOMETRO.length - 1; i >= 0; i--) {
    if (score >= FAIXAS_TERMOMETRO[i].min) return FAIXAS_TERMOMETRO[i];
  }
  return FAIXAS_TERMOMETRO[0];
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

// === Agregado da TURMA (painel + telão do facilitador) ===
// Termômetro é INDIVIDUAL: cada participante avalia o próprio órgão real. O
// facilitador NÃO vê nome-a-nome (é auto-percepção pessoal) — só o panorama
// anônimo da turma: distribuição por faixa, médias e o salto médio.

// Uma barra do histograma de distribuição (quantos participantes em cada faixa).
export type DistribuicaoFaixa = { faixaId: string; label: string; cor: string; n: number };

export type TurmaTermometro = {
  totalParticipantes: number; // quantos participantes (users) há na turma
  preenchidosInicio: number; // quantos responderam o INÍCIO
  preenchidosFim: number; // quantos responderam o FIM
  mediaInicio: number | null; // média dos scores de início (0-100)
  mediaFim: number | null; // média dos scores de fim
  distInicio: DistribuicaoFaixa[]; // contagem por faixa (início)
  distFim: DistribuicaoFaixa[]; // contagem por faixa (fim)
  comAmbos: number; // quantos têm início E fim (base do salto)
  saltoMedio: number | null; // média de (fim - início) entre os que têm ambos
};

// Conta quantos scores caem em cada faixa, devolvendo SEMPRE as 5 faixas (zeros
// inclusos) na ordem crescente — pra desenhar o histograma estável.
export function distribuicaoPorFaixa(scores: number[]): DistribuicaoFaixa[] {
  const base = FAIXAS_TERMOMETRO.map((f) => ({ faixaId: f.id, label: f.label, cor: f.cor, n: 0 }));
  for (const s of scores) {
    const faixa = faixaQualitativa(s);
    const slot = base.find((b) => b.faixaId === faixa.id);
    if (slot) slot.n += 1;
  }
  return base;
}

function media(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

// Monta o agregado da turma a partir dos pares (início, fim) de cada
// participante. `scoresInicio`/`scoresFim` já vêm filtrados (só quem respondeu);
// `saltos` são os deltas de quem respondeu AMBOS os momentos.
export function montarTurmaTermometro(args: {
  totalParticipantes: number;
  scoresInicio: number[];
  scoresFim: number[];
  saltos: number[];
}): TurmaTermometro {
  return {
    totalParticipantes: args.totalParticipantes,
    preenchidosInicio: args.scoresInicio.length,
    preenchidosFim: args.scoresFim.length,
    mediaInicio: media(args.scoresInicio),
    mediaFim: media(args.scoresFim),
    distInicio: distribuicaoPorFaixa(args.scoresInicio),
    distFim: distribuicaoPorFaixa(args.scoresFim),
    comAmbos: args.saltos.length,
    saltoMedio: media(args.saltos),
  };
}
