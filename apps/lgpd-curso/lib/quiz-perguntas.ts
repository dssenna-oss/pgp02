// Banco estático das 30 perguntas do Quiz Diagnóstico de LGPD.
// Curado pelo facilitador (DPO de profissão) em 23/Mai/2026.
//
// Estrutura: 5 categorias × distribuição variável (total 30):
//   - principios (6): Princípios da LGPD
//   - bases_legais (5): Bases legais Arts. 7º e 11
//   - personagens (7): Controlador, Operador, Encarregado, Titular, ANPD
//   - direitos_titular (6): Arts. 18 e 19 LGPD
//   - fases_pgp (6): As 8 fases do PGP institucional
//
// Aplicação: URL pública /quiz/[turmaSlug] no início do curso, anônima.
// Cada participante responde 1x; resultados agregados aparecem no
// /facilitador/quiz pra calibrar a apresentação teórica.

export type CategoriaQuiz =
  | "principios"
  | "bases_legais"
  | "personagens"
  | "direitos_titular"
  | "fases_pgp";

export type Pergunta = {
  qid: string;          // identificador estável (q01, q02, ...)
  categoria: CategoriaQuiz;
  enunciado: string;
  alternativas: string[]; // 4 alternativas
  correta: number;        // índice 0-3
};

export const CATEGORIAS: Record<CategoriaQuiz, { rotulo: string; emoji: string; icone: string }> = {
  principios:       { rotulo: "Princípios da LGPD",   emoji: "📚", icone: "Lightbulb" },
  bases_legais:     { rotulo: "Bases Legais",         emoji: "⚖️", icone: "Scale" },
  personagens:      { rotulo: "Personagens",          emoji: "👥", icone: "Users" },
  direitos_titular: { rotulo: "Direitos do Titular",  emoji: "🛡️", icone: "Shield" },
  fases_pgp:        { rotulo: "Fases do PGP",         emoji: "🚩", icone: "Flag" },
};

export const PERGUNTAS: Pergunta[] = [
  // ─── PRINCÍPIOS DA LGPD (6) ──────────────────────────────────────────
  {
    qid: "q01",
    categoria: "principios",
    enunciado: "Qual desses é um princípio da LGPD?",
    alternativas: ["Lucratividade", "Minimização", "Reciprocidade", "Confidencialidade contratual"],
    correta: 1,
  },
  {
    qid: "q02",
    categoria: "principios",
    enunciado: "O princípio da finalidade significa:",
    alternativas: [
      "Coletar dados pra qualquer uso futuro",
      "Tratar dados apenas para propósito legítimo, específico e informado",
      "Reter dados o máximo possível",
      "Compartilhar livremente com parceiros",
    ],
    correta: 1,
  },
  {
    qid: "q03",
    categoria: "principios",
    enunciado: "\"Minimização\" no contexto LGPD significa:",
    alternativas: [
      "Reduzir custos do tratamento",
      "Coletar apenas dados necessários ao propósito declarado",
      "Comprimir bancos de dados",
      "Limitar funcionários com acesso",
    ],
    correta: 1,
  },
  {
    qid: "q04",
    categoria: "principios",
    enunciado: "Qual princípio garante ao titular poder consultar quais dados são tratados sobre ele?",
    alternativas: ["Segurança", "Adequação", "Transparência", "Prevenção"],
    correta: 2,
  },
  {
    qid: "q22",
    categoria: "principios",
    enunciado: "\"Não discriminação\" como princípio LGPD significa que:",
    alternativas: [
      "Todos os cidadãos pagam mesma taxa",
      "Dados não podem ser usados para fins discriminatórios ilícitos ou abusivos",
      "Tratamento deve ser igual entre setores",
      "Acesso aos dados é universal",
    ],
    correta: 1,
  },
  {
    qid: "q23",
    categoria: "principios",
    enunciado: "O princípio da \"responsabilização e prestação de contas\" (accountability) exige:",
    alternativas: [
      "Demonstrar adoção de medidas eficazes capazes de comprovar a observância da LGPD",
      "Pagar multas em caso de descumprimento",
      "Notificar a ANPD anualmente",
      "Publicar relatório financeiro",
    ],
    correta: 0,
  },

  // ─── BASES LEGAIS (5) ────────────────────────────────────────────────
  {
    qid: "q05",
    categoria: "bases_legais",
    enunciado: "Quando o consentimento NÃO é a base legal apropriada?",
    alternativas: [
      "Newsletter de marketing",
      "Atendimento médico em pronto-socorro de emergência",
      "Cadastro voluntário em programa de fidelidade",
      "Pesquisa de satisfação opt-in",
    ],
    correta: 1,
  },
  {
    qid: "q07",
    categoria: "bases_legais",
    enunciado: "Quantas bases legais existem para dados pessoais COMUNS (Art. 7º LGPD)?",
    alternativas: ["5", "7", "10", "15"],
    correta: 2,
  },
  {
    qid: "q08",
    categoria: "bases_legais",
    enunciado: "Para tratar dados pessoais SENSÍVEIS, quais bases legais aplicam?",
    alternativas: [
      "As mesmas dos dados comuns",
      "Apenas consentimento",
      "Apenas as do Art. 11 LGPD",
      "Qualquer uma desde que justificada",
    ],
    correta: 2,
  },
  {
    qid: "q25",
    categoria: "bases_legais",
    enunciado: "A base legal \"obrigação legal ou regulatória\" significa:",
    alternativas: [
      "Decisão da diretoria",
      "Cumprimento de lei ou regulamento aplicável ao controlador",
      "Termo de serviço unilateral",
      "Acordo verbal",
    ],
    correta: 1,
  },
  {
    qid: "q26",
    categoria: "bases_legais",
    enunciado: "O \"legítimo interesse\" só pode ser usado:",
    alternativas: [
      "Por empresa privada",
      "Para fins econômicos exclusivos",
      "Após teste de balanceamento que demonstre prevalência sobre direitos do titular",
      "Em situações de emergência",
    ],
    correta: 2,
  },

  // ─── PERSONAGENS (7) ─────────────────────────────────────────────────
  {
    qid: "q09",
    categoria: "personagens",
    enunciado: "O CONTROLADOR é:",
    alternativas: [
      "Quem trata dados em nome de outro",
      "Quem decide finalidade e meios do tratamento",
      "A pessoa física dona dos dados",
      "A autoridade nacional",
    ],
    correta: 1,
  },
  {
    qid: "q10",
    categoria: "personagens",
    enunciado: "Quem é o ENCARREGADO (DPO)?",
    alternativas: [
      "O dono da empresa",
      "Servidor responsável pela infraestrutura de TI",
      "Pessoa indicada pelo controlador para atuar como canal entre titulares, ANPD e organização",
      "Auditor externo contratado para conformidade",
    ],
    correta: 2,
  },
  {
    qid: "q11",
    categoria: "personagens",
    enunciado: "O TITULAR dos dados é:",
    alternativas: [
      "A organização que coleta",
      "A pessoa natural a quem os dados se referem",
      "O sistema que armazena",
      "O fornecedor de software",
    ],
    correta: 1,
  },
  {
    qid: "q12",
    categoria: "personagens",
    enunciado: "O OPERADOR pode tratar dados pessoais:",
    alternativas: [
      "Como preferir",
      "Conforme instruções do controlador",
      "Vendendo a terceiros, desde que anonimizados",
      "Apenas se for órgão público",
    ],
    correta: 1,
  },
  {
    qid: "q29",
    categoria: "personagens",
    enunciado: "O CONTROLADOR CONJUNTO acontece quando:",
    alternativas: [
      "Há mais de um operador",
      "Dois controladores decidem em conjunto finalidades e meios",
      "A empresa terceiriza armazenamento",
      "Há terceirização de TI",
    ],
    correta: 1,
  },
  {
    qid: "q30",
    categoria: "personagens",
    enunciado: "O ENCARREGADO (DPO) deve ser:",
    alternativas: [
      "Sempre advogado",
      "Sempre interno à organização",
      "Pode ser pessoa interna OU contratada externamente",
      "Sempre fiscalizado pela ANPD",
    ],
    correta: 2,
  },
  {
    qid: "q31",
    categoria: "personagens",
    enunciado: "Em órgãos públicos, a ANPD recomenda que o ENCARREGADO seja:",
    alternativas: [
      "Sempre o secretário-executivo",
      "Servidor com poder de decisão e acesso à alta gestão",
      "Apenas terceirizado",
      "Estagiário sob supervisão",
    ],
    correta: 1,
  },

  // ─── DIREITOS DO TITULAR (6) ─────────────────────────────────────────
  {
    qid: "q14",
    categoria: "direitos_titular",
    enunciado: "O prazo legal para responder a uma solicitação de exercício de direitos é:",
    alternativas: ["5 dias úteis", "10 dias corridos", "15 dias úteis", "30 dias corridos"],
    correta: 2,
  },
  {
    qid: "q16",
    categoria: "direitos_titular",
    enunciado: "O direito de \"eliminação\" NÃO se aplica quando:",
    alternativas: [
      "O titular pediu por escrito",
      "Há obrigação legal de retenção pelo controlador",
      "Os dados estão duplicados",
      "Faz mais de 1 ano da coleta",
    ],
    correta: 1,
  },
  {
    qid: "q33",
    categoria: "direitos_titular",
    enunciado: "O direito de \"REVOGAÇÃO do consentimento\" significa:",
    alternativas: [
      "Cancelar matrícula no curso",
      "Retirar a autorização para o tratamento, com efeito futuro",
      "Anular contrato com a Instituição",
      "Receber indenização automática",
    ],
    correta: 1,
  },
  {
    qid: "q34",
    categoria: "direitos_titular",
    enunciado: "O direito de \"OPOSIÇÃO\" se aplica quando:",
    alternativas: [
      "O titular discorda da decisão judicial",
      "O tratamento é com base no legítimo interesse e o titular contesta",
      "O órgão erra a finalidade declarada",
      "Não há base legal informada",
    ],
    correta: 1,
  },
  {
    qid: "q35",
    categoria: "direitos_titular",
    enunciado: "O direito de \"informação sobre compartilhamentos\" garante saber:",
    alternativas: [
      "Apenas os compartilhamentos comerciais",
      "Com quais entes públicos e privados os dados são compartilhados",
      "Apenas operadores",
      "Só compartilhamentos via API",
    ],
    correta: 1,
  },
  {
    qid: "q36",
    categoria: "direitos_titular",
    enunciado: "Quando os direitos podem ser exercidos pelo TITULAR?",
    alternativas: [
      "Apenas durante o tratamento ativo",
      "A qualquer momento, mediante requisição",
      "Apenas no momento da coleta",
      "Apenas após autorização da ANPD",
    ],
    correta: 1,
  },

  // ─── FASES DO PGP (6) ────────────────────────────────────────────────
  {
    qid: "q17",
    categoria: "fases_pgp",
    enunciado: "Em qual fase do PGP se faz o Inventário de Dados?",
    alternativas: [
      "Fase Preliminar (capacitação)",
      "Fase 1 (designação do DPO)",
      "Fase 3 — Mapeamento",
      "Fase 6 — Execução",
    ],
    correta: 2,
  },
  {
    qid: "q18",
    categoria: "fases_pgp",
    enunciado: "O RIPD (Relatório de Impacto à Proteção de Dados) é elaborado:",
    alternativas: [
      "Antes de qualquer tratamento",
      "Quando há alto risco ao titular",
      "Anualmente, sempre",
      "Apenas após incidente",
    ],
    correta: 1,
  },
  {
    qid: "q19",
    categoria: "fases_pgp",
    enunciado: "A Comunicação à ANPD em caso de incidente segue:",
    alternativas: [
      "Resolução CD/ANPD nº 15/2024",
      "Decreto 9.637/2018",
      "Marco Civil da Internet",
      "Código de Defesa do Consumidor",
    ],
    correta: 0,
  },
  {
    qid: "q38",
    categoria: "fases_pgp",
    enunciado: "A formação do COMITÊ DE GOVERNANÇA acontece em qual fase?",
    alternativas: ["Preliminar", "Fase 1", "Fase 3", "Fase 6"],
    correta: 1,
  },
  {
    qid: "q39",
    categoria: "fases_pgp",
    enunciado: "O \"GAP Analysis\" mede:",
    alternativas: [
      "Custos da adequação",
      "Distância entre estado atual e requisitos da LGPD",
      "Volume de incidentes anuais",
      "Faturamento da Instituição",
    ],
    correta: 1,
  },
  {
    qid: "q40",
    categoria: "fases_pgp",
    enunciado: "A Fase 6 (Execução) tipicamente entrega:",
    alternativas: [
      "Multa institucional",
      "Política/Aviso de Privacidade publicado, RIPDs realizados, contratos atualizados, treinamentos executados",
      "Apenas certificado ANPD",
      "Dossiês individuais",
    ],
    correta: 1,
  },
];

// Total esperado = 30. Mantém ordem por categoria (não embaralha — o
// participante percorre Princípios → Bases → Personagens → Direitos → Fases).
export const TOTAL_PERGUNTAS = PERGUNTAS.length;

// Helper: agrupa perguntas pra contagem por categoria
export function perguntasPorCategoria(): Record<CategoriaQuiz, Pergunta[]> {
  const grupos: Record<CategoriaQuiz, Pergunta[]> = {
    principios: [],
    bases_legais: [],
    personagens: [],
    direitos_titular: [],
    fases_pgp: [],
  };
  for (const p of PERGUNTAS) grupos[p.categoria].push(p);
  return grupos;
}

// Helper: lookup rápido por qid
export function getPergunta(qid: string): Pergunta | undefined {
  return PERGUNTAS.find((p) => p.qid === qid);
}

// Visão "pública" — usada no client durante o quiz; OMITE o índice da resposta correta.
export type PerguntaPublica = Omit<Pergunta, "correta">;
export function perguntasPublicas(): PerguntaPublica[] {
  return PERGUNTAS.map(({ correta: _correta, ...rest }) => rest);
}
