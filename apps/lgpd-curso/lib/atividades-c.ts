// =============================================================================
// Modalidade C — Onda 2: "Modo Atividade" (o celular leve)
// =============================================================================
// Micro-toques no celular cujo resultado agregado o facilitador projeta no
// telão. Complementa os cards físicos: a produção pesada é nos cards; aqui o
// grupo registra DECISÕES rápidas (votar, classificar, ordenar) que viram um
// resultado coletivo ao vivo.
//
// Acesso: participante logado pelo crachá (papel + grupo), igual à Modalidade
// A. Cada resposta fica atrelada a userId + companyId (grupo) + turma — o
// painel agrega por turma (e dá pra ver por grupo).
//
// 4 atividades (a da Fase 6 é um trio), 6 sub-atividades no total. Todas usam
// 2 formatos uniformes: `opcoes` (toca uma opção por item) e `ordenar`
// (coloca uma lista na ordem certa).

import {
  CRITERIOS_PRIORIZACAO,
  PONTOS_MAXIMO_POR_PROCESSO,
  faixaPriorizacao,
} from "./criterios-priorizacao";

// -----------------------------------------------------------------------------
// TIPOS
// -----------------------------------------------------------------------------

export type OpcaoItem = {
  id: string;
  rotulo: string;
  pontos?: number; // modo "escala" — pondera o score
  correta?: boolean; // modo "gabarito" — marca a resposta certa
};

export type ItemOpcoes = {
  id: string;
  enunciado: string;
  hint?: string;
  opcoes: OpcaoItem[];
};

export type ItemOrdenavel = {
  id: string;
  rotulo: string;
  detalhe?: string;
};

// modo do formato `opcoes`:
//   escala       → pontuação por opção (Priorização): mostra média + faixa
//   gabarito     → tem resposta certa: mostra % de acerto
//   voto         → sem certo/errado: mostra distribuição (a "opinião da turma")
//   balanceamento→ sequência sim/não; aprovado só se TODAS forem a resposta-chave
export type ModoOpcoes = "escala" | "gabarito" | "voto" | "balanceamento";

type Base = {
  id: string;
  fase: string;
  faseCor: string; // classes tailwind (border + texto) pro chip da fase
  emoji: string;
  titulo: string;
  instrucao: string;
  contexto?: string;
};

export type AtividadeOpcoes = Base & {
  tipo: "opcoes";
  modo: ModoOpcoes;
  itens: ItemOpcoes[];
  // só no modo balanceamento: id da opção que precisa ser escolhida em TODOS
  // os itens pra dar "aprovado"
  balanceamento?: { opcaoAprovaId: string; rotuloAprovado: string; rotuloReprovado: string };
};

export type AtividadeOrdenar = Base & {
  tipo: "ordenar";
  // a ordem correta é a ORDEM DO ARRAY abaixo; o runner embaralha pra exibir
  itens: ItemOrdenavel[];
};

export type AtividadeC = AtividadeOpcoes | AtividadeOrdenar;

// -----------------------------------------------------------------------------
// CATÁLOGO
// -----------------------------------------------------------------------------

const COR_F2 = "border-amber-300 text-amber-700";
const COR_F3 = "border-blue-300 text-blue-700";
const COR_F4 = "border-amber-400 text-amber-800";
const COR_F6 = "border-purple-300 text-purple-700";
const COR_ESTRUTURA = "border-indigo-300 text-indigo-700";

// ─── Estrutura da LGPD — Ordenar as 7 seções (ordenar) ──────────────────────
// Jogo de memorização: os 65 artigos divididos em 7 blocos temáticos (metáforas
// do Guia Visual). Complementa os cards físicos imprimíveis (Kit das 7 Seções).
// A ordem do array = a ordem correta da lei (Arts. 1º → 65).
const SECOES_LGPD: AtividadeOrdenar = {
  id: "secoes-lgpd",
  fase: "Estrutura da LGPD",
  faseCor: COR_ESTRUTURA,
  emoji: "🃏",
  titulo: "Ordene as 7 seções da LGPD",
  contexto: "Os 65 artigos em 7 blocos temáticos — a jornada da lei",
  instrucao:
    "Seu grupo recebeu 7 cards, um por bloco da LGPD. Coloque-os na ordem em que aparecem na lei (do Art. 1º ao 65). Use as setas ou arraste. O telão mostra quantos grupos acertaram a sequência.",
  tipo: "ordenar",
  itens: [
    { id: "s1", rotulo: "🗺️ O Território e as Regras do Jogo", detalhe: "Arts. 1º a 6º · Objeto, fundamentos, princípios e definições" },
    { id: "s2", rotulo: "🔑 O Pedágio e as Chaves de Acesso", detalhe: "Arts. 7º a 16 · Bases legais, consentimento e dados sensíveis" },
    { id: "s3", rotulo: "🦸 O Herói da História", detalhe: "Arts. 17 a 22 · Os direitos do titular dos dados" },
    { id: "s4", rotulo: "🏛️ A Casa de Vidro", detalhe: "Arts. 23 a 32 · Tratamento de dados pelo Poder Público" },
    { id: "s5", rotulo: "🛂 O Passaporte e a Linha de Produção", detalhe: "Arts. 33 a 40 · Transferência internacional e agentes de tratamento" },
    { id: "s6", rotulo: "🏰 O Quartel de Segurança", detalhe: "Arts. 41 a 51 · Encarregado (DPO), segurança e boas práticas" },
    { id: "s7", rotulo: "⚖️ O Juízo Final", detalhe: "Arts. 52 a 65 · Fiscalização, sanções e disposições finais" },
  ],
};

// ─── Fase 2 — Priorização (escala) ──────────────────────────────────────────
// Reaproveita os 6 critérios da Res. CD/ANPD nº 2/2022. Processo-exemplo único
// (o trabalho por processo real é nos cards físicos) pra ser um toque rápido.
const PRIORIZACAO_F2: AtividadeOpcoes = {
  id: "priorizacao-f2",
  fase: "Fase 2 — Diagnóstico Inicial",
  faseCor: COR_F2,
  emoji: "📊",
  titulo: "Priorização — vote o risco de cada critério",
  contexto: "Processo-exemplo: Atendimento no Posto de Saúde (UBS)",
  instrucao:
    "Pensando no Atendimento no Posto de Saúde, toque o nível (Baixo / Médio / Alto) em cada um dos 6 critérios. O resultado da turma aparece no telão — quanto maior o score, mais prioritário o processo.",
  tipo: "opcoes",
  modo: "escala",
  itens: CRITERIOS_PRIORIZACAO.map((c) => ({
    id: c.id,
    enunciado: `${c.emoji} ${c.titulo}`,
    hint: c.hint,
    opcoes: c.opcoes.map((o) => ({ id: o.id, rotulo: o.rotulo, pontos: o.pontos })),
  })),
};

// ─── Fase 3 — Classificação (gabarito): base legal + é sensível? ────────────
const B = (id: string) => id; // legibilidade
const CLASSIFICACAO_F3: AtividadeOpcoes = {
  id: "classificacao-f3",
  fase: "Fase 3 — Mapeamento e Análise de Riscos",
  faseCor: COR_F3,
  emoji: "⚖️",
  titulo: "Classifique: qual base legal? é dado sensível?",
  instrucao:
    "Para cada situação, toque a resposta que você acha correta. No telão aparece o % de acerto da turma — errar aqui faz parte do aprendizado.",
  tipo: "opcoes",
  modo: "gabarito",
  itens: [
    {
      id: "bl-folha",
      enunciado: "Folha de pagamento dos servidores. Qual a base legal mais adequada?",
      hint: "É uma obrigação que a lei impõe ao órgão.",
      opcoes: [
        { id: B("c"), rotulo: "Art. 7º I — Consentimento" },
        { id: B("ol"), rotulo: "Art. 7º II — Cumprimento de obrigação legal", correta: true },
        { id: B("pp"), rotulo: "Art. 7º III — Execução de política pública" },
        { id: B("li"), rotulo: "Art. 7º IX — Legítimo interesse" },
      ],
    },
    {
      id: "bl-ubs",
      enunciado: "Atendimento de saúde na UBS (programa público). Qual a base legal?",
      hint: "É a execução de uma política pública de saúde.",
      opcoes: [
        { id: B("c"), rotulo: "Art. 7º I — Consentimento" },
        { id: B("ol"), rotulo: "Art. 7º II — Cumprimento de obrigação legal" },
        { id: B("pp"), rotulo: "Art. 7º III — Execução de política pública", correta: true },
        { id: B("li"), rotulo: "Art. 7º IX — Legítimo interesse" },
      ],
    },
    {
      id: "bl-news",
      enunciado: "Newsletter institucional OPCIONAL, que o cidadão escolhe receber. Base legal?",
      hint: "Tratamento facultativo, o cidadão pode optar por não receber.",
      opcoes: [
        { id: B("c"), rotulo: "Art. 7º I — Consentimento", correta: true },
        { id: B("ol"), rotulo: "Art. 7º II — Cumprimento de obrigação legal" },
        { id: B("pp"), rotulo: "Art. 7º III — Execução de política pública" },
        { id: B("li"), rotulo: "Art. 7º IX — Legítimo interesse" },
      ],
    },
    {
      id: "sens-prontuario",
      enunciado: "Prontuário médico (dados de saúde). É dado SENSÍVEL?",
      hint: "Art. 5º II da LGPD.",
      opcoes: [
        { id: B("sim"), rotulo: "Sim, é sensível", correta: true },
        { id: B("nao"), rotulo: "Não, é dado comum" },
      ],
    },
    {
      id: "sens-cpf",
      enunciado: "CPF do contribuinte. É dado SENSÍVEL?",
      hint: "Pense: o CPF revela saúde, religião, opinião política, vida sexual?",
      opcoes: [
        { id: B("sim"), rotulo: "Sim, é sensível" },
        { id: B("nao"), rotulo: "Não, é dado pessoal comum", correta: true },
      ],
    },
    {
      id: "sens-sindicato",
      enunciado: "Filiação sindical de um servidor. É dado SENSÍVEL?",
      hint: "Art. 5º II — filiação a sindicato é uma das categorias listadas.",
      opcoes: [
        { id: B("sim"), rotulo: "Sim, é sensível", correta: true },
        { id: B("nao"), rotulo: "Não, é dado comum" },
      ],
    },
  ],
};

// ─── Fase 4 — Aderência GAP (voto, sem gabarito) ────────────────────────────
const ADERENCIA_OPCOES: OpcaoItem[] = [
  { id: "aderente", rotulo: "✅ Aderente" },
  { id: "parcial", rotulo: "🟡 Parcial" },
  { id: "nao", rotulo: "🔴 Não aderente" },
];
const ADERENCIA_F4: AtividadeOpcoes = {
  id: "aderencia-f4",
  fase: "Fase 4 — Análise de Conformidade (GAP)",
  faseCor: COR_F4,
  emoji: "🔎",
  titulo: "Aderência — como está o seu órgão hoje?",
  instrucao:
    "Para cada controle, vote como você AVALIA a situação real do seu órgão hoje. Não há certo ou errado — o telão mostra o retrato da turma. Cada 'Não aderente' vira uma ação na Fase 5.",
  tipo: "opcoes",
  modo: "voto",
  itens: [
    { id: "c1", enunciado: "Encarregado (DPO) designado por ato formal publicado?", opcoes: ADERENCIA_OPCOES },
    { id: "c2", enunciado: "Inventário de processos atualizado nos últimos 12 meses?", opcoes: ADERENCIA_OPCOES },
    { id: "c3", enunciado: "Base legal documentada para cada processo?", opcoes: ADERENCIA_OPCOES },
    { id: "c4", enunciado: "Cláusulas de LGPD nos contratos com operadores (art. 39)?", opcoes: ADERENCIA_OPCOES },
    { id: "c5", enunciado: "Canal para o cidadão exercer direitos (DSR) divulgado?", opcoes: ADERENCIA_OPCOES },
    { id: "c6", enunciado: "Aviso de Privacidade publicado no portal (art. 9º)?", opcoes: ADERENCIA_OPCOES },
    { id: "c7", enunciado: "Plano de Resposta a Incidentes (PRI) formalizado?", opcoes: ADERENCIA_OPCOES },
    { id: "c8", enunciado: "Equipe capacitada em LGPD nos últimos 12 meses?", opcoes: ADERENCIA_OPCOES },
  ],
};

// ─── Fase 6 — Ordenar o RIPD (ordenar) ──────────────────────────────────────
const RIPD_ORDEM_F6: AtividadeOrdenar = {
  id: "ripd-ordem-f6",
  fase: "Fase 6 — Execução",
  faseCor: COR_F6,
  emoji: "🗂️",
  titulo: "Monte o RIPD na ordem certa",
  contexto: "Relatório de Impacto à Proteção de Dados (Guia ANPD)",
  instrucao:
    "As 8 seções do RIPD estão fora de ordem. Arraste (ou use as setas) para colocá-las na sequência lógica de um relatório de impacto. O telão mostra quantos grupos acertaram a ordem.",
  tipo: "ordenar",
  itens: [
    { id: "r1", rotulo: "Identificação do controlador e do Encarregado", detalhe: "Quem responde pelo tratamento" },
    { id: "r2", rotulo: "Descrição do tratamento", detalhe: "Natureza, escopo, contexto e finalidade" },
    { id: "r3", rotulo: "Necessidade e proporcionalidade", detalhe: "O tratamento é necessário e adequado?" },
    { id: "r4", rotulo: "Identificação dos riscos aos titulares", detalhe: "O que pode dar errado para as pessoas" },
    { id: "r5", rotulo: "Medidas de segurança e salvaguardas", detalhe: "Controles técnicos e organizacionais" },
    { id: "r6", rotulo: "Mecanismos de mitigação dos riscos", detalhe: "Como reduzir cada risco identificado" },
    { id: "r7", rotulo: "Consulta às partes interessadas", detalhe: "Titulares e, se aplicável, a ANPD" },
    { id: "r8", rotulo: "Conclusão e parecer do Encarregado", detalhe: "Decisão final sobre seguir ou não" },
  ],
};

// ─── Fase 6 — Ordenar a Política (ordenar) ──────────────────────────────────
const POLITICA_ORDEM_F6: AtividadeOrdenar = {
  id: "politica-ordem-f6",
  fase: "Fase 6 — Execução",
  faseCor: COR_F6,
  emoji: "📜",
  titulo: "Monte a Política de Privacidade na ordem certa",
  instrucao:
    "Coloque as seções da Política de Privacidade na sequência que faz sentido para o leitor. O telão mostra os grupos que acertaram.",
  tipo: "ordenar",
  itens: [
    { id: "p1", rotulo: "Apresentação e objetivo", detalhe: "Por que esta política existe" },
    { id: "p2", rotulo: "Abrangência e definições", detalhe: "A quem se aplica e os termos usados" },
    { id: "p3", rotulo: "Princípios e bases legais", detalhe: "Como o órgão trata dados e com que amparo" },
    { id: "p4", rotulo: "Direitos dos titulares", detalhe: "O que o cidadão pode exercer" },
    { id: "p5", rotulo: "Medidas de segurança", detalhe: "Como os dados são protegidos" },
    { id: "p6", rotulo: "Vigência e revisão", detalhe: "Desde quando vale e quando é revista" },
  ],
};

// ─── Fase 6 — Balanceamento do Legítimo Interesse (balanceamento) ───────────
const BALANCEAMENTO_F6: AtividadeOpcoes = {
  id: "balanceamento-f6",
  fase: "Fase 6 — Execução",
  faseCor: COR_F6,
  emoji: "⚖️",
  titulo: "Teste de balanceamento do Legítimo Interesse",
  contexto: "Lembrete: no setor público o legítimo interesse é EXCEPCIONAL (Art. 7º IX).",
  instrucao:
    "Responda Sim/Não às 4 etapas do teste. Só se TODAS forem 'Sim' o legítimo interesse pode ser usado. O telão mostra quantos grupos concluíram que 'pode usar'.",
  tipo: "opcoes",
  modo: "balanceamento",
  balanceamento: { opcaoAprovaId: "sim", rotuloAprovado: "Pode usar legítimo interesse", rotuloReprovado: "Não pode — use outra base ou reavalie" },
  itens: [
    {
      id: "bal-1",
      enunciado: "1. Finalidade legítima: há um interesse concreto, lícito e específico?",
      opcoes: [
        { id: "sim", rotulo: "Sim" },
        { id: "nao", rotulo: "Não" },
      ],
    },
    {
      id: "bal-2",
      enunciado: "2. Necessidade: não existe meio menos invasivo de atingir essa finalidade?",
      opcoes: [
        { id: "sim", rotulo: "Sim" },
        { id: "nao", rotulo: "Não" },
      ],
    },
    {
      id: "bal-3",
      enunciado: "3. Balanceamento: os direitos e a expectativa do titular NÃO se sobrepõem ao interesse?",
      opcoes: [
        { id: "sim", rotulo: "Sim" },
        { id: "nao", rotulo: "Não" },
      ],
    },
    {
      id: "bal-4",
      enunciado: "4. Salvaguardas: há medidas para mitigar riscos (transparência, opt-out, segurança)?",
      opcoes: [
        { id: "sim", rotulo: "Sim" },
        { id: "nao", rotulo: "Não" },
      ],
    },
  ],
};

export const ATIVIDADES_C: AtividadeC[] = [
  SECOES_LGPD,
  PRIORIZACAO_F2,
  CLASSIFICACAO_F3,
  ADERENCIA_F4,
  RIPD_ORDEM_F6,
  POLITICA_ORDEM_F6,
  BALANCEAMENTO_F6,
];

export function getAtividadeC(id: string): AtividadeC | undefined {
  return ATIVIDADES_C.find((a) => a.id === id);
}

// -----------------------------------------------------------------------------
// FORMATO DA RESPOSTA SALVA (Json na tabela)
// -----------------------------------------------------------------------------
//   opcoes:  { escolhas: { [itemId]: opcaoId } }
//   ordenar: { ordem: [itemId, itemId, ...] }
export type RespostaOpcoes = { escolhas: Record<string, string> };
export type RespostaOrdenar = { ordem: string[] };
export type RespostaAtividade = RespostaOpcoes | RespostaOrdenar;

// -----------------------------------------------------------------------------
// FEEDBACK INDIVIDUAL (o que o participante vê ao enviar)
// -----------------------------------------------------------------------------
export type FeedbackIndividual = {
  // escala: score + faixa
  score?: number;
  scoreMax?: number;
  faixa?: { label: string; cor: string };
  // gabarito: acertos
  acertos?: number;
  totalGabarito?: number;
  // balanceamento: veredito
  veredito?: { aprovado: boolean; rotulo: string };
  // ordenar: acertou a ordem exata?
  ordemExata?: boolean;
  posicoesCorretas?: number;
  totalPosicoes?: number;
};

export function calcularFeedback(at: AtividadeC, resp: RespostaAtividade): FeedbackIndividual {
  if (at.tipo === "ordenar") {
    const ordem = (resp as RespostaOrdenar).ordem || [];
    const correta = at.itens.map((i) => i.id);
    let pos = 0;
    for (let i = 0; i < correta.length; i++) {
      if (ordem[i] === correta[i]) pos++;
    }
    return {
      ordemExata: pos === correta.length,
      posicoesCorretas: pos,
      totalPosicoes: correta.length,
    };
  }

  const escolhas = (resp as RespostaOpcoes).escolhas || {};
  if (at.modo === "escala") {
    let score = 0;
    for (const item of at.itens) {
      const op = item.opcoes.find((o) => o.id === escolhas[item.id]);
      if (op?.pontos) score += op.pontos;
    }
    return { score, scoreMax: PONTOS_MAXIMO_POR_PROCESSO, faixa: faixaPriorizacao(score) };
  }
  if (at.modo === "gabarito") {
    let acertos = 0;
    for (const item of at.itens) {
      const op = item.opcoes.find((o) => o.id === escolhas[item.id]);
      if (op?.correta) acertos++;
    }
    return { acertos, totalGabarito: at.itens.length };
  }
  if (at.modo === "balanceamento" && at.balanceamento) {
    const aprovado = at.itens.every((item) => escolhas[item.id] === at.balanceamento!.opcaoAprovaId);
    return {
      veredito: {
        aprovado,
        rotulo: aprovado ? at.balanceamento.rotuloAprovado : at.balanceamento.rotuloReprovado,
      },
    };
  }
  // voto — sem feedback de acerto
  return {};
}

// -----------------------------------------------------------------------------
// AGREGAÇÃO (painel do facilitador / telão)
// -----------------------------------------------------------------------------
export type DistribuicaoOpcao = {
  opcaoId: string;
  rotulo: string;
  n: number;
  perc: number;
  correta?: boolean;
  pontos?: number;
};
export type ResultadoItemOpcoes = {
  itemId: string;
  enunciado: string;
  respondentes: number;
  distribuicao: DistribuicaoOpcao[];
  percAcerto?: number; // gabarito
  mediaPontos?: number; // escala
};
export type ResultadoPosicao = {
  posicao: number; // 1-based
  rotuloCorreto: string;
  percCorreto: number;
};
export type AgregadoAtividade = {
  atividadeId: string;
  titulo: string;
  tipo: "opcoes" | "ordenar";
  modo?: ModoOpcoes;
  respondentes: number;
  // opcoes
  itens?: ResultadoItemOpcoes[];
  scoreMedio?: number; // escala
  scoreMax?: number;
  faixaMedia?: { label: string; cor: string };
  acertoMedio?: number; // gabarito (% médio entre respondentes)
  balanceamento?: { aprovados: number; reprovados: number; percAprovado: number };
  // ordenar
  ordenar?: { percExato: number; porPosicao: ResultadoPosicao[] };
};

type RespostaBruta = { resposta: any };

export function agregarAtividade(at: AtividadeC, respostas: RespostaBruta[]): AgregadoAtividade {
  const respondentes = respostas.length;

  if (at.tipo === "ordenar") {
    const correta = at.itens.map((i) => i.id);
    let exatos = 0;
    const acertosPorPos = new Array(correta.length).fill(0);
    for (const r of respostas) {
      const ordem: string[] = r.resposta?.ordem || [];
      let pos = 0;
      for (let i = 0; i < correta.length; i++) {
        if (ordem[i] === correta[i]) {
          pos++;
          acertosPorPos[i]++;
        }
      }
      if (pos === correta.length) exatos++;
    }
    return {
      atividadeId: at.id,
      titulo: at.titulo,
      tipo: "ordenar",
      respondentes,
      ordenar: {
        percExato: respondentes > 0 ? Math.round((exatos / respondentes) * 100) : 0,
        porPosicao: correta.map((id, i) => ({
          posicao: i + 1,
          rotuloCorreto: at.itens[i].rotulo,
          percCorreto: respondentes > 0 ? Math.round((acertosPorPos[i] / respondentes) * 100) : 0,
        })),
      },
    };
  }

  // opcoes
  const itensRes: ResultadoItemOpcoes[] = at.itens.map((item) => {
    const counts: Record<string, number> = {};
    for (const o of item.opcoes) counts[o.id] = 0;
    let resp = 0;
    let acertos = 0;
    let somaPontos = 0;
    for (const r of respostas) {
      const esc = r.resposta?.escolhas?.[item.id];
      if (esc && esc in counts) {
        counts[esc]++;
        resp++;
        const op = item.opcoes.find((o) => o.id === esc);
        if (op?.correta) acertos++;
        if (op?.pontos) somaPontos += op.pontos;
      }
    }
    const distribuicao: DistribuicaoOpcao[] = item.opcoes.map((o) => ({
      opcaoId: o.id,
      rotulo: o.rotulo,
      n: counts[o.id],
      perc: resp > 0 ? Math.round((counts[o.id] / resp) * 100) : 0,
      correta: o.correta,
      pontos: o.pontos,
    }));
    return {
      itemId: item.id,
      enunciado: item.enunciado,
      respondentes: resp,
      distribuicao,
      percAcerto: at.modo === "gabarito" && resp > 0 ? Math.round((acertos / resp) * 100) : undefined,
      mediaPontos: at.modo === "escala" && resp > 0 ? Math.round((somaPontos / resp) * 10) / 10 : undefined,
    };
  });

  const base: AgregadoAtividade = {
    atividadeId: at.id,
    titulo: at.titulo,
    tipo: "opcoes",
    modo: at.modo,
    respondentes,
    itens: itensRes,
  };

  if (at.modo === "escala") {
    // score médio por respondente
    let soma = 0;
    for (const r of respostas) {
      let s = 0;
      for (const item of at.itens) {
        const op = item.opcoes.find((o) => o.id === r.resposta?.escolhas?.[item.id]);
        if (op?.pontos) s += op.pontos;
      }
      soma += s;
    }
    const medio = respondentes > 0 ? Math.round((soma / respondentes) * 10) / 10 : 0;
    base.scoreMedio = medio;
    base.scoreMax = PONTOS_MAXIMO_POR_PROCESSO;
    base.faixaMedia = faixaPriorizacao(Math.round(medio));
  } else if (at.modo === "gabarito") {
    let somaPerc = 0;
    let comResposta = 0;
    for (const r of respostas) {
      let acertos = 0;
      let total = 0;
      for (const item of at.itens) {
        const esc = r.resposta?.escolhas?.[item.id];
        if (!esc) continue;
        total++;
        if (item.opcoes.find((o) => o.id === esc)?.correta) acertos++;
      }
      if (total > 0) {
        somaPerc += (acertos / total) * 100;
        comResposta++;
      }
    }
    base.acertoMedio = comResposta > 0 ? Math.round(somaPerc / comResposta) : 0;
  } else if (at.modo === "balanceamento" && at.balanceamento) {
    let aprovados = 0;
    for (const r of respostas) {
      const ok = at.itens.every(
        (item) => r.resposta?.escolhas?.[item.id] === at.balanceamento!.opcaoAprovaId,
      );
      if (ok) aprovados++;
    }
    base.balanceamento = {
      aprovados,
      reprovados: respondentes - aprovados,
      percAprovado: respondentes > 0 ? Math.round((aprovados / respondentes) * 100) : 0,
    };
  }

  return base;
}

// Valida (de forma tolerante) o payload recebido do cliente antes de salvar.
export function validarResposta(at: AtividadeC, resp: any): RespostaAtividade | null {
  if (at.tipo === "ordenar") {
    const ordem = resp?.ordem;
    if (!Array.isArray(ordem)) return null;
    const ids = new Set(at.itens.map((i) => i.id));
    const filtrada = ordem.filter((x: any) => typeof x === "string" && ids.has(x));
    // precisa conter exatamente todos os itens (uma vez cada)
    if (filtrada.length !== at.itens.length || new Set(filtrada).size !== at.itens.length) return null;
    return { ordem: filtrada };
  }
  const escolhas = resp?.escolhas;
  if (!escolhas || typeof escolhas !== "object") return null;
  const limpo: Record<string, string> = {};
  for (const item of at.itens) {
    const v = escolhas[item.id];
    if (typeof v === "string" && item.opcoes.some((o) => o.id === v)) {
      limpo[item.id] = v;
    }
  }
  if (Object.keys(limpo).length === 0) return null;
  return { escolhas: limpo };
}
