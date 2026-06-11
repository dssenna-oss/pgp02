// Termômetro — auto-diagnóstico INDIVIDUAL em 2 blocos:
//
//   PESSOAL (3 perguntas)       → "quanto EU conheço a LGPD hoje?"
//   INSTITUIÇÃO (7 perguntas)   → "em que etapa da jornada o MEU órgão real está?"
//
// As 7 perguntas institucionais espelham as Fases do PGP (Preliminar + 1-7),
// mas em linguagem do dia-a-dia — a maioria dos participantes chega sem nunca
// ter lido a LGPD, então a pergunta descreve a ATIVIDADE concreta e o nome da
// fase aparece só como etiqueta discreta (hint). O 1º nível de cada pergunta é
// sempre acolhedor ("ainda não paramos pra pensar nisso") — começar do zero é
// o esperado, e ler as 4 opções já ensina o que é aquela etapa.
//
// Aplicado no INÍCIO do curso e repetido no FIM: o salto pessoal mostra a
// evolução da consciência; o retrato institucional vira o mapa do "o que fazer
// quando eu voltar pro meu órgão". Scores SEPARADOS (0-100 cada, normalizados)
// — misturar poluiria a leitura: uma pessoa que aprendeu muito não faz a
// instituição dela melhorar.
//
// Decisão UX: opções fechadas em vez de texto livre — economiza tempo (curso
// tem horas cronometradas) e padroniza o vocabulário pro debrief.

export type NivelTermometro = "inicial" | "desenvolvimento" | "estabelecido" | "avancado";

export type BlocoTermometro = "pessoal" | "instituicao";

export type OpcaoTermometro = {
  id: NivelTermometro;
  rotulo: string;
  pontos: number;
  descricao: string;
};

export type DimensaoTermometro = {
  id: string;
  bloco: BlocoTermometro;
  emoji: string;
  titulo: string;
  hint: string; // 1 linha abaixo do título — nas institucionais, a etiqueta "No curso: Fase X"
  opcoes: OpcaoTermometro[];
};

// Helper: monta as 4 opções (5/10/15/20 pts). Cada opção tem rótulo curto
// (resumo) + frase completa — a frase é o conteúdo aprovado, o rótulo só
// facilita a leitura rápida no celular.
function ops(
  niveis: [
    [string, string],
    [string, string],
    [string, string],
    [string, string],
  ],
): OpcaoTermometro[] {
  const ids: NivelTermometro[] = ["inicial", "desenvolvimento", "estabelecido", "avancado"];
  const pontos = [5, 10, 15, 20];
  return niveis.map(([rotulo, descricao], i) => ({
    id: ids[i],
    rotulo,
    pontos: pontos[i],
    descricao,
  }));
}

export const DIMENSOES_TERMOMETRO: DimensaoTermometro[] = [
  // ───────────────────────── BLOCO 1 — SOBRE VOCÊ ─────────────────────────
  {
    id: "p_contato",
    bloco: "pessoal",
    emoji: "📖",
    titulo: "Qual o seu contato com a LGPD até hoje?",
    hint: "Auto-percepção sincera — não é prova.",
    opcoes: ops([
      ["Nunca ouvi falar", "Nunca tinha ouvido falar (ou só de nome) — e tá tudo bem!"],
      ["Já ouvi falar", "Já ouvi falar, mas nunca li nem estudei."],
      ["Conheço o básico", "Conheço o básico — já li materiais ou assisti palestra/curso rápido."],
      ["Conheço bem", "Conheço bem — estudei e já uso no trabalho."],
    ]),
  },
  {
    id: "p_dia_a_dia",
    bloco: "pessoal",
    emoji: "💼",
    titulo: "No seu trabalho, você saberia dizer o que pode e o que não pode fazer com dados de pessoas?",
    hint: "Pense nas suas tarefas reais: cadastros, processos, atendimentos.",
    opcoes: ops([
      ["Ainda não saberia", "Ainda não saberia — nunca precisei pensar nisso."],
      ["Só intuição", "Tenho intuição do certo/errado, mas não sei o que a lei diz."],
      ["Sei o essencial", "Sei o essencial pro meu setor."],
      ["Sei com segurança", "Sei com segurança — inclusive oriento colegas."],
    ]),
  },
  {
    id: "p_incidente",
    bloco: "pessoal",
    emoji: "🚨",
    titulo: "Se acontecer um problema com dados pessoais (vazamento, reclamação de cidadão), você sabe o que fazer?",
    hint: "Vazamento, uso indevido, reclamação de um cidadão…",
    opcoes: ops([
      ["Não faria ideia", "Não faria ideia por onde começar."],
      ["Avisaria o chefe", "Avisaria meu chefe e esperaria orientação."],
      ["Sei os primeiros passos", "Sei os primeiros passos e a quem comunicar."],
      ["Sei o procedimento", "Sei o procedimento, os prazos e quem aciona quem."],
    ]),
  },

  // ────────────────── BLOCO 2 — SOBRE A SUA INSTITUIÇÃO ──────────────────
  {
    id: "i_gestao",
    bloco: "instituicao",
    emoji: "🏛️",
    titulo: "Os chefes (prefeito/presidente, secretários, diretores) compram a ideia de proteger dados?",
    hint: "No curso: Fase Preliminar — engajar quem decide.",
    opcoes: ops([
      ["Não olham pra isso", "A direção ainda não olha pra esse assunto."],
      ["Acham importante", "Acham importante, mas não priorizam (sem tempo nem verba)."],
      ["Apoiam oficialmente", "Apoiam de forma oficial (assinam atos, cobram o tema em reuniões)."],
      ["Puxam o tema", "Puxam o tema na frente — cobram resultados e tratam como prioridade."],
    ]),
  },
  {
    id: "i_encarregado",
    bloco: "instituicao",
    emoji: "👤",
    titulo: "Tem alguém responsável por proteção de dados no órgão?",
    hint: "No curso: Fase 1 — Encarregado e equipes de trabalho.",
    opcoes: ops([
      ["Ninguém ainda", "Ainda não temos ninguém responsável por isso."],
      ["Alguém informal", "Alguém cuida do tema informalmente, sem nomeação oficial."],
      ["Nomeado oficialmente", "Temos um responsável nomeado por portaria/ato."],
      ["Responsável + equipe", "Responsável + equipe/comitê com rotina e apoio definidos."],
    ]),
  },
  {
    id: "i_inventario",
    bloco: "instituicao",
    emoji: "🗂️",
    titulo: "Vocês sabem quais dados de pessoas o órgão usa e onde ficam guardados?",
    hint: "No curso: Fase 2 — Diagnóstico inicial (Inventário de Dados).",
    opcoes: ops([
      ["Ainda não levantamos", "Ainda não paramos pra levantar isso."],
      ["Só uma noção", "Temos uma noção, mas nada anotado nem organizado."],
      ["Principais mapeados", "Já mapeamos os principais cadastros e sistemas."],
      ["Mapa completo", "Sabemos exatamente quais dados, de quem, pra quê e por quanto tempo."],
    ]),
  },
  {
    id: "i_riscos",
    bloco: "instituicao",
    emoji: "⚠️",
    titulo: "Vocês avaliam os riscos antes de usar dados delicados (saúde, crianças, etc.)?",
    hint: "No curso: Fase 3 — Mapeamento e Análise de Riscos.",
    opcoes: ops([
      ["Sem esse hábito", "Ainda não temos o hábito de avaliar riscos antes de usar dados."],
      ["Só quando salta aos olhos", "Pensamos quando \"salta aos olhos\", mas sem método."],
      ["Nos casos delicados", "Avaliamos os riscos nos usos mais delicados de dados."],
      ["Método padrão", "Temos um jeito padrão de avaliar e anotar os riscos antes de agir."],
    ]),
  },
  {
    id: "i_gap",
    bloco: "instituicao",
    emoji: "🔍",
    titulo: "Vocês já compararam o que fazem hoje com o que a Lei exige, pra achar o que falta?",
    hint: "No curso: Fase 4 — GAP Analysis (o que falta pra cumprir).",
    opcoes: ops([
      ["Não sabemos o que falta", "Ainda não sabemos ao certo o que a LGPD exige de nós."],
      ["Ideia geral", "Temos uma ideia geral, mas nunca checamos ponto a ponto."],
      ["Levantamento feito", "Já fizemos um levantamento do que falta pra cumprir a Lei."],
      ["Lista priorizada", "Temos a lista de pendências priorizada e atualizada."],
    ]),
  },
  {
    id: "i_plano",
    bloco: "instituicao",
    emoji: "🛠️",
    titulo: "Existe um plano com prazos pra resolver o que falta — e ele sai do papel?",
    hint: "No curso: Fases 5 e 6 — Plano de Ação e Execução.",
    opcoes: ops([
      ["Sem plano ainda", "Ainda não temos um plano pra isso."],
      ["Boas intenções", "Temos boas intenções, mas nada escrito com prazos."],
      ["Plano escrito", "Existe um plano com responsáveis e prazos."],
      ["Em execução", "O plano está em execução e as medidas vão sendo concluídas."],
    ]),
  },
  {
    id: "i_monitoramento",
    bloco: "instituicao",
    emoji: "🔄",
    titulo: "Depois de ajustar, vocês acompanham e revisam de tempos em tempos?",
    hint: "No curso: Fase 7 — Monitoramento Contínuo e Melhoria.",
    opcoes: ops([
      ["Não revisamos", "Ainda não revisamos depois que resolvemos algo."],
      ["Só quando dá problema", "Olhamos de novo só quando aparece um problema."],
      ["Revisão combinada", "Revisamos de tempos em tempos, de forma combinada."],
      ["Com indicadores", "Acompanhamos com indicadores e melhoramos continuamente."],
    ]),
  },
];

export const DIMENSOES_PESSOAIS = DIMENSOES_TERMOMETRO.filter((d) => d.bloco === "pessoal");
export const DIMENSOES_INSTITUICAO = DIMENSOES_TERMOMETRO.filter((d) => d.bloco === "instituicao");

// Ambos os scores são NORMALIZADOS pra 0-100 (o nº de perguntas difere por
// bloco: 3 pessoais × 20 = 60 brutos; 7 institucionais × 20 = 140 brutos).
export const SCORE_MAXIMO = 100;

// === Faixas qualitativas ===
// Duas escalas de rótulo (a régua 0-100 é a mesma): a INSTITUCIONAL fala de
// maturidade do órgão; a PESSOAL fala da jornada de quem aprende — "Maturidade
// Estabelecida" soaria estranho pra uma pessoa.
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

export const FAIXAS_PESSOAIS: FaixaTermometro[] = [
  { id: "primeiro_contato", min: 0,  label: "Primeiro contato",          cor: "gray",    descricao: "Você está começando agora — o curso é exatamente pra isso." },
  { id: "despertar",        min: 20, label: "Conhecimento inicial",      cor: "orange",  descricao: "Já ouviu os termos — agora é organizar as ideias." },
  { id: "construcao",       min: 40, label: "Conhecimento em construção", cor: "amber",   descricao: "Base formada — faltam as conexões com a prática." },
  { id: "dominio",          min: 60, label: "Bom domínio",               cor: "blue",    descricao: "Você navega bem pelo tema no dia-a-dia." },
  { id: "multiplicador",    min: 80, label: "Multiplicador",             cor: "emerald", descricao: "Domínio forte — você pode orientar colegas." },
];

// Faixa de um score numa escala (default: institucional).
export function faixaDe(score: number, faixas: FaixaTermometro[]): FaixaTermometro {
  for (let i = faixas.length - 1; i >= 0; i--) {
    if (score >= faixas[i].min) return faixas[i];
  }
  return faixas[0];
}

export function faixaQualitativa(score: number): FaixaTermometro {
  return faixaDe(score, FAIXAS_TERMOMETRO);
}

export function faixaPessoal(score: number): FaixaTermometro {
  return faixaDe(score, FAIXAS_PESSOAIS);
}

// Tipos pro JSON salvo em termometro_respostas.dimensoes + score/scorePessoal
export type TermometroSalvo = {
  dimensoes: Array<{
    id: string;
    opcaoEscolhida: NivelTermometro;
    pontos: number;
  }>;
  score: number; // INSTITUCIONAL normalizado 0-100
  scorePessoal: number; // PESSOAL normalizado 0-100
  finalizadoEm: string; // ISO
};

// Calcula os 2 scores (normalizados 0-100) a partir das respostas.
export function calcularScoresTermometro(
  respostas: Record<string, NivelTermometro>,
): { instituicao: number; pessoal: number } {
  function somaBloco(dims: DimensaoTermometro[]): number {
    let soma = 0;
    let max = 0;
    for (const dim of dims) {
      max += 20;
      const escolhida = respostas[dim.id];
      if (!escolhida) continue;
      const opcao = dim.opcoes.find((o) => o.id === escolhida);
      if (opcao) soma += opcao.pontos;
    }
    return max > 0 ? Math.round((soma / max) * 100) : 0;
  }
  return {
    pessoal: somaBloco(DIMENSOES_PESSOAIS),
    instituicao: somaBloco(DIMENSOES_INSTITUICAO),
  };
}

// === Agregado da TURMA (painel + telão do facilitador) ===
// Termômetro é INDIVIDUAL: o facilitador NÃO vê nome-a-nome (é auto-percepção
// pessoal) — só o panorama anônimo, em 2 leituras: PERFIL DA TURMA (quanto as
// pessoas conhecem a LGPD — calibra o ritmo do curso) e PANORAMA DAS
// INSTITUIÇÕES (em que etapa da jornada os órgãos reais estão).

// Uma barra do histograma de distribuição (quantos participantes em cada faixa).
export type DistribuicaoFaixa = { faixaId: string; label: string; cor: string; n: number };

// Agregado de UM bloco (pessoal OU instituição).
export type BlocoTurmaTermometro = {
  mediaInicio: number | null;
  mediaFim: number | null;
  distInicio: DistribuicaoFaixa[];
  distFim: DistribuicaoFaixa[];
  saltoMedio: number | null; // média de (fim − início) entre quem tem ambos
};

export type TurmaTermometro = {
  totalParticipantes: number; // quantos participantes (users) há na turma
  preenchidosInicio: number; // quantos responderam o INÍCIO
  preenchidosFim: number; // quantos responderam o FIM
  comAmbos: number; // quantos têm início E fim (base do salto)
  pessoal: BlocoTurmaTermometro;
  instituicao: BlocoTurmaTermometro;
};

// Conta quantos scores caem em cada faixa da escala dada, devolvendo SEMPRE as
// 5 faixas (zeros inclusos) na ordem crescente — pro histograma ficar estável.
export function distribuicaoPorFaixa(
  scores: number[],
  faixas: FaixaTermometro[] = FAIXAS_TERMOMETRO,
): DistribuicaoFaixa[] {
  const base = faixas.map((f) => ({ faixaId: f.id, label: f.label, cor: f.cor, n: 0 }));
  for (const s of scores) {
    const faixa = faixaDe(s, faixas);
    const slot = base.find((b) => b.faixaId === faixa.id);
    if (slot) slot.n += 1;
  }
  return base;
}

function media(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export type ScoresBlocoArgs = {
  scoresInicio: number[];
  scoresFim: number[];
  saltos: number[];
};

function montarBloco(args: ScoresBlocoArgs, faixas: FaixaTermometro[]): BlocoTurmaTermometro {
  return {
    mediaInicio: media(args.scoresInicio),
    mediaFim: media(args.scoresFim),
    distInicio: distribuicaoPorFaixa(args.scoresInicio, faixas),
    distFim: distribuicaoPorFaixa(args.scoresFim, faixas),
    saltoMedio: media(args.saltos),
  };
}

// Monta o agregado da turma. Os arrays já vêm filtrados (só quem respondeu);
// `saltos` são os deltas de quem respondeu AMBOS os momentos.
export function montarTurmaTermometro(args: {
  totalParticipantes: number;
  preenchidosInicio: number;
  preenchidosFim: number;
  comAmbos: number;
  pessoal: ScoresBlocoArgs;
  instituicao: ScoresBlocoArgs;
}): TurmaTermometro {
  return {
    totalParticipantes: args.totalParticipantes,
    preenchidosInicio: args.preenchidosInicio,
    preenchidosFim: args.preenchidosFim,
    comAmbos: args.comAmbos,
    pessoal: montarBloco(args.pessoal, FAIXAS_PESSOAIS),
    instituicao: montarBloco(args.instituicao, FAIXAS_TERMOMETRO),
  };
}
