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
  // forma de exibir as opções no celular: "botoes" (padrão) ou "seletor"
  // (dropdown compacto, pra quando há muitas opções iguais por item — ex.: a
  // Trilha do Conhecimento, onde cada painel escolhe 1 número de artigo).
  apresentacao?: "botoes" | "seletor";
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
const COR_TRILHA = "border-indigo-300 text-indigo-700";

// ─── Trilha do Conhecimento — Desafio dos Artigos (gabarito, seletor) ────────
// Jogo de memorização: cada grupo recebe um CARD (imagem) com vários painéis
// temáticos que descrevem artigos da LGPD SEM mostrar o número. O grupo descobre
// o nº de cada painel e registra no celular (um seletor por painel). O telão
// mostra o acerto da turma. Os cards são imagens prontas (não geramos DOCX).
// A ordem dos painéis abaixo é a MESMA do card impresso (linha a linha).

// Gera as opções de número de artigo (Art. N) pra um painel, marcando a correta.
function opcoesArtigos(nums: number[], correto: number): OpcaoItem[] {
  return nums.map((n) => ({ id: `a${n}`, rotulo: `Art. ${n}`, correta: n === correto }));
}

// Card de teste: Artigos 1 a 11. Cada painel → nº correto (gabarito do user).
const ARTIGOS_1_11 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const TRILHA_1_11: AtividadeOpcoes = {
  id: "trilha-1-11",
  fase: "Trilha do Conhecimento",
  faseCor: COR_TRILHA,
  emoji: "🧭",
  titulo: "Desafio LGPD — Artigos 1 a 11",
  contexto: "Cada painel do card descreve um artigo, mas esconde o número.",
  instrucao:
    "Olhem o card impresso: cada painel descreve um artigo da LGPD sem dizer o número. Descubram qual é e escolham o nº de cada painel abaixo (na mesma ordem do card). O telão mostra quantos grupos acertaram.",
  tipo: "opcoes",
  modo: "gabarito",
  apresentacao: "seletor",
  itens: [
    { id: "p1", enunciado: "O Dicionário da Lei", opcoes: opcoesArtigos(ARTIGOS_1_11, 5) },
    { id: "p2", enunciado: "O Escudo da Personalidade", opcoes: opcoesArtigos(ARTIGOS_1_11, 1) },
    { id: "p3", enunciado: "As Chaves para o Tratamento", opcoes: opcoesArtigos(ARTIGOS_1_11, 7) },
    { id: "p4", enunciado: "Onde a LGPD não Alcança", opcoes: opcoesArtigos(ARTIGOS_1_11, 4) },
    { id: "p5", enunciado: "As Raízes da Proteção", opcoes: opcoesArtigos(ARTIGOS_1_11, 2) },
    { id: "p6", enunciado: "Proteção Redobrada", opcoes: opcoesArtigos(ARTIGOS_1_11, 11) },
    { id: "p7", enunciado: "O Guia da Boa-Fé", opcoes: opcoesArtigos(ARTIGOS_1_11, 6) },
    { id: "p8", enunciado: "As Fronteiras dos Dados", opcoes: opcoesArtigos(ARTIGOS_1_11, 3) },
    { id: "p9", enunciado: "A Vontade do Titular", opcoes: opcoesArtigos(ARTIGOS_1_11, 8) },
    { id: "p10", enunciado: "O Equilíbrio de Interesses", opcoes: opcoesArtigos(ARTIGOS_1_11, 10) },
    { id: "p11", enunciado: "Olhar Aberto", opcoes: opcoesArtigos(ARTIGOS_1_11, 9) },
  ],
};

// Card: Artigos 12 a 20 (9 painéis). Gabarito do user (ordem do card, linha a linha).
const ARTIGOS_12_20 = [12, 13, 14, 15, 16, 17, 18, 19, 20];
const TRILHA_12_20: AtividadeOpcoes = {
  id: "trilha-12-20",
  fase: "Trilha do Conhecimento",
  faseCor: COR_TRILHA,
  emoji: "🧭",
  titulo: "Desafio LGPD — Artigos 12 a 20",
  contexto: "Cada painel do card descreve um artigo, mas esconde o número.",
  instrucao:
    "Olhem o card impresso: cada painel descreve um artigo da LGPD sem dizer o número. Descubram qual é e escolham o nº de cada painel abaixo (na mesma ordem do card). O telão mostra quantos grupos acertaram.",
  tipo: "opcoes",
  modo: "gabarito",
  apresentacao: "seletor",
  itens: [
    { id: "p1", enunciado: "O Princípio da Titularidade", opcoes: opcoesArtigos(ARTIGOS_12_20, 17) },
    { id: "p2", enunciado: "Anonimização e Reversibilidade", opcoes: opcoesArtigos(ARTIGOS_12_20, 12) },
    { id: "p3", enunciado: "Revisão de Decisões de Algoritmos", opcoes: opcoesArtigos(ARTIGOS_12_20, 20) },
    { id: "p4", enunciado: "O Melhor Interesse do Menor", opcoes: opcoesArtigos(ARTIGOS_12_20, 14) },
    { id: "p5", enunciado: "Pesquisa em Saúde Pública", opcoes: opcoesArtigos(ARTIGOS_12_20, 13) },
    { id: "p6", enunciado: "O Catálogo de Direitos", opcoes: opcoesArtigos(ARTIGOS_12_20, 18) },
    { id: "p7", enunciado: "Hipóteses de Término do Tratamento", opcoes: opcoesArtigos(ARTIGOS_12_20, 15) },
    { id: "p8", enunciado: "Conservação Autorizada", opcoes: opcoesArtigos(ARTIGOS_12_20, 16) },
    { id: "p9", enunciado: "Formas e Prazos de Resposta", opcoes: opcoesArtigos(ARTIGOS_12_20, 19) },
  ],
};

// Card: Artigos 21 a 30 (10 painéis). Gabarito do user (ordem do card, linha a linha).
const ARTIGOS_21_30 = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
const TRILHA_21_30: AtividadeOpcoes = {
  id: "trilha-21-30",
  fase: "Trilha do Conhecimento",
  faseCor: COR_TRILHA,
  emoji: "🧭",
  titulo: "Desafio LGPD — Artigos 21 a 30",
  contexto: "Cada painel do card descreve um artigo, mas esconde o número.",
  instrucao:
    "Olhem o card impresso: cada painel descreve um artigo da LGPD sem dizer o número. Descubram qual é e escolham o nº de cada painel abaixo (na mesma ordem do card). O telão mostra quantos grupos acertaram.",
  tipo: "opcoes",
  modo: "gabarito",
  apresentacao: "seletor",
  itens: [
    { id: "p1", enunciado: "Integração e Interoperabilidade", opcoes: opcoesArtigos(ARTIGOS_21_30, 25) },
    { id: "p2", enunciado: "Proteção contra Retaliação", opcoes: opcoesArtigos(ARTIGOS_21_30, 21) },
    { id: "p3", enunciado: "O Olhar da Autoridade Nacional", opcoes: opcoesArtigos(ARTIGOS_21_30, 29) },
    { id: "p4", enunciado: "Regras de Ouro do Poder Público", opcoes: opcoesArtigos(ARTIGOS_21_30, 23) },
    { id: "p5", enunciado: "Comunicação Público-Privado", opcoes: opcoesArtigos(ARTIGOS_21_30, 27) },
    { id: "p6", enunciado: "Justiça Individual e Coletiva", opcoes: opcoesArtigos(ARTIGOS_21_30, 22) },
    { id: "p7", enunciado: "Vedação de Venda de Dados", opcoes: opcoesArtigos(ARTIGOS_21_30, 26) },
    { id: "p8", enunciado: "Livro de Registro de Operações", opcoes: opcoesArtigos(ARTIGOS_21_30, 30) },
    { id: "p9", enunciado: "Os Dois Chapéus das Estatais", opcoes: opcoesArtigos(ARTIGOS_21_30, 24) },
    { id: "p10", enunciado: "O Espaço Vazio (Veto)", opcoes: opcoesArtigos(ARTIGOS_21_30, 28) },
  ],
};

// Card: Artigos 31 a 40 (10 painéis). Card regenerado p/ ficar 1:1 (cada painel
// = 1 artigo do range, sem ambiguidade). Gabarito validado contra a LGPD.
const ARTIGOS_31_40 = [31, 32, 33, 34, 35, 36, 37, 38, 39, 40];
const TRILHA_31_40: AtividadeOpcoes = {
  id: "trilha-31-40",
  fase: "Trilha do Conhecimento",
  faseCor: COR_TRILHA,
  emoji: "🧭",
  titulo: "Desafio LGPD — Artigos 31 a 40",
  contexto: "Cada painel do card descreve um artigo, mas esconde o número.",
  instrucao:
    "Olhem o card impresso: cada painel descreve um artigo da LGPD sem dizer o número. Descubram qual é e escolham o nº de cada painel abaixo (na mesma ordem do card). O telão mostra quantos grupos acertaram.",
  tipo: "opcoes",
  modo: "gabarito",
  apresentacao: "seletor",
  itens: [
    { id: "p1", enunciado: "O Relatório de Impacto (RIPD)", opcoes: opcoesArtigos(ARTIGOS_31_40, 38) },
    { id: "p2", enunciado: "As Portas da Transferência Internacional", opcoes: opcoesArtigos(ARTIGOS_31_40, 33) },
    { id: "p3", enunciado: "O Diário de Bordo do Tratamento", opcoes: opcoesArtigos(ARTIGOS_31_40, 37) },
    { id: "p4", enunciado: "O Selo de Adequação do País", opcoes: opcoesArtigos(ARTIGOS_31_40, 34) },
    { id: "p5", enunciado: "O Operador Segue o Controlador", opcoes: opcoesArtigos(ARTIGOS_31_40, 39) },
    { id: "p6", enunciado: "Cláusulas, BCR e Selos", opcoes: opcoesArtigos(ARTIGOS_31_40, 35) },
    { id: "p7", enunciado: "Informe de Medidas ao Poder Público", opcoes: opcoesArtigos(ARTIGOS_31_40, 31) },
    { id: "p8", enunciado: "Padrões de Interoperabilidade", opcoes: opcoesArtigos(ARTIGOS_31_40, 40) },
    { id: "p9", enunciado: "Mudou a Garantia? Avise a Autoridade", opcoes: opcoesArtigos(ARTIGOS_31_40, 36) },
    { id: "p10", enunciado: "RIPD do Poder Público", opcoes: opcoesArtigos(ARTIGOS_31_40, 32) },
  ],
};

// Card: Artigos 41 a 50 (10 painéis). Card regenerado em SVG p/ ser 1:1 (sem as
// duplicatas do card original e com o painel do 41 = Encarregado). Validado.
const ARTIGOS_41_50 = [41, 42, 43, 44, 45, 46, 47, 48, 49, 50];
const TRILHA_41_50: AtividadeOpcoes = {
  id: "trilha-41-50",
  fase: "Trilha do Conhecimento",
  faseCor: COR_TRILHA,
  emoji: "🧭",
  titulo: "Desafio LGPD — Artigos 41 a 50",
  contexto: "Cada painel do card descreve um artigo, mas esconde o número.",
  instrucao:
    "Olhem o card impresso: cada painel descreve um artigo da LGPD sem dizer o número. Descubram qual é e escolham o nº de cada painel abaixo (na mesma ordem do card). O telão mostra quantos grupos acertaram.",
  tipo: "opcoes",
  modo: "gabarito",
  apresentacao: "seletor",
  itens: [
    { id: "p1", enunciado: "Notificação de Incidentes (Data Breach)", opcoes: opcoesArtigos(ARTIGOS_41_50, 48) },
    { id: "p2", enunciado: "Escudos de Proteção (Excludentes)", opcoes: opcoesArtigos(ARTIGOS_41_50, 43) },
    { id: "p3", enunciado: "Mapa da Governança", opcoes: opcoesArtigos(ARTIGOS_41_50, 50) },
    { id: "p4", enunciado: "O Encarregado (DPO)", opcoes: opcoesArtigos(ARTIGOS_41_50, 41) },
    { id: "p5", enunciado: "Muralha de Segurança", opcoes: opcoesArtigos(ARTIGOS_41_50, 46) },
    { id: "p6", enunciado: "O Termômetro do Risco (Tratamento Irregular)", opcoes: opcoesArtigos(ARTIGOS_41_50, 44) },
    { id: "p7", enunciado: "O Selo de Confidencialidade", opcoes: opcoesArtigos(ARTIGOS_41_50, 47) },
    { id: "p8", enunciado: "Reparação e Solidariedade", opcoes: opcoesArtigos(ARTIGOS_41_50, 42) },
    { id: "p9", enunciado: "Segurança na Concepção (Privacy by Design)", opcoes: opcoesArtigos(ARTIGOS_41_50, 49) },
    { id: "p10", enunciado: "A Ponte com o Consumidor (CDC)", opcoes: opcoesArtigos(ARTIGOS_41_50, 45) },
  ],
};

// Card: Artigos 51 a 65 (11 painéis). Bloco da ANPD — vários artigos têm sufixo
// (55-C, 55-D, 55-J, 58-A), então as opções do seletor são os artigos que de
// fato aparecem no card (não uma faixa numérica). Gabarito fechado com o user.
// Obs.: pelo card do user, o painel "CDC" → 64 (diálogo com outras normas) e o
// painel "Prescrição/Defesa" → 52 (ampla defesa); ambos repetem números do bloco.
const OPCOES_51_65: OpcaoItem[] = [
  { id: "a51", rotulo: "Art. 51" },
  { id: "a52", rotulo: "Art. 52" },
  { id: "a53", rotulo: "Art. 53" },
  { id: "a55c", rotulo: "Art. 55-C" },
  { id: "a55d", rotulo: "Art. 55-D" },
  { id: "a55j", rotulo: "Art. 55-J" },
  { id: "a58a", rotulo: "Art. 58-A" },
  { id: "a60", rotulo: "Art. 60" },
  { id: "a64", rotulo: "Art. 64" },
  { id: "a65", rotulo: "Art. 65" },
];
function opcs5165(corretoId: string): OpcaoItem[] {
  return OPCOES_51_65.map((o) => ({ id: o.id, rotulo: o.rotulo, correta: o.id === corretoId }));
}
const TRILHA_51_65: AtividadeOpcoes = {
  id: "trilha-51-65",
  fase: "Trilha do Conhecimento",
  faseCor: COR_TRILHA,
  emoji: "🧭",
  titulo: "Desafio LGPD — Artigos 51 a 65",
  contexto: "Bloco da ANPD. Cada painel descreve um artigo, mas esconde o número.",
  instrucao:
    "Olhem o card impresso: cada painel descreve um artigo da LGPD sem dizer o número. Descubram qual é e escolham o artigo de cada painel abaixo (na mesma ordem do card). Atenção: aqui há artigos com letra (ex.: 55-C, 58-A). O telão mostra quantos grupos acertaram.",
  tipo: "opcoes",
  modo: "gabarito",
  apresentacao: "seletor",
  itens: [
    { id: "p1", enunciado: "Conselho Diretor da ANPD (5 diretores, mandato de 4 anos)", opcoes: opcs5165("a55d") },
    { id: "p2", enunciado: "Estrutura da Autoridade Nacional", opcoes: opcs5165("a55c") },
    { id: "p3", enunciado: "O Menu de Sanções Administrativas", opcoes: opcs5165("a52") },
    { id: "p4", enunciado: "Proteção de Dados como Direito do Consumidor", opcoes: opcs5165("a64") },
    { id: "p5", enunciado: "Padrões Técnicos e Selos de Confiança", opcoes: opcs5165("a51") },
    { id: "p6", enunciado: "O Conselho Consultivo da Sociedade (CNPD)", opcoes: opcs5165("a58a") },
    { id: "p7", enunciado: "Atualização do Marco Civil da Internet", opcoes: opcs5165("a60") },
    { id: "p8", enunciado: "O Relógio da Prescrição e o Direito de Defesa", opcoes: opcs5165("a52") },
    { id: "p9", enunciado: "A Régua da Dosimetria (Critérios de Cálculo)", opcoes: opcs5165("a53") },
    { id: "p10", enunciado: "Linha do Tempo da Vigência", opcoes: opcs5165("a65") },
    { id: "p11", enunciado: "As Atribuições de Fiscalização e Educação", opcoes: opcs5165("a55j") },
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
  TRILHA_1_11,
  TRILHA_12_20,
  TRILHA_21_30,
  TRILHA_31_40,
  TRILHA_41_50,
  TRILHA_51_65,
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
  apresentacao?: "botoes" | "seletor";
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
    apresentacao: at.apresentacao,
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
