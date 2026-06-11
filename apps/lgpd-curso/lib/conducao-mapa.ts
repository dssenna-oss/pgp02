// Painel de Condução — overlay sobre o ROTEIRO (Modalidade C) que liga cada
// momento do curso às AÇÕES do app (telão, Modo Cards, disparos) e ao STATUS ao
// vivo ("posso avançar?"). Não cria endpoints novos — só mapeia o que já existe.

import { ROTEIRO, type MomentoRoteiro } from "./modalidade-c-conteudo";

export type AcaoConducao =
  | { kind: "telao-atividade"; atividadeId: string; label: string }
  // Slides/conteúdos do curso no Telão Comandado (ids em lib/conteudos-telao.ts)
  | { kind: "telao-conteudo"; conteudoId: string; label: string }
  | { kind: "telao-termometro"; label: string }
  | { kind: "liberar-termometro"; label: string }
  | { kind: "telao-quiz"; label: string }
  | { kind: "telao-quiz-resultado"; label: string }
  | { kind: "liberar-quiz"; label: string }
  | { kind: "telao-placar"; label: string }
  | { kind: "disparar-dsr"; label: string }
  | { kind: "disparar-incidente"; label: string }
  | { kind: "fechamento"; label: string };

export type StatusConducao =
  | { kind: "atividade"; atividadeId: string; label: string }
  | { kind: "termometro"; fase: "inicio" | "fim"; label: string }
  | { kind: "quiz"; label: string }
  | { kind: "online"; label: string };

// Dispositivo/meio que VOCÊ (facilitador) usa no momento: comanda pelo celular
// (Painel), opera direto no notebook (slides não-comandáveis) ou conduz na sala.
export type DispositivoVoce = "celular" | "notebook" | "sala";
// Meio que os ALUNOS usam: o celular deles, material impresso (cards) ou
// discussão/oral.
export type DispositivoAluno = "celular" | "impresso" | "discussao";

export type MomentoConducao = MomentoRoteiro & {
  acoes: AcaoConducao[];
  status: StatusConducao[];
  dica?: string;
  voceUsa: DispositivoVoce[];
  alunoUsa: DispositivoAluno[];
};

// Mapa por número de momento (1-16). `voceUsa`/`alunoUsa` alimentam os chips de
// dispositivo no card do momento (quem faz o quê, em qual meio). Momentos só de
// cards/presencial ficam sem ação de app.
const MAPA: Record<
  number,
  {
    acoes: AcaoConducao[];
    status: StatusConducao[];
    dica?: string;
    voceUsa: DispositivoVoce[];
    alunoUsa: DispositivoAluno[];
  }
> = {
  1: {
    acoes: [],
    status: [{ kind: "online", label: "Participantes online" }],
    dica: "Decida A/B/C pela infraestrutura. Na dúvida, use a Modalidade C (ligue o Modo Cards no atalho acima).",
    voceUsa: ["sala"],
    alunoUsa: ["impresso"],
  },
  2: {
    acoes: [
      { kind: "telao-quiz", label: "Abrir Quiz Diagnóstico" },
      { kind: "liberar-quiz", label: "Liberar quiz" },
      { kind: "telao-quiz-resultado", label: "Resultado do Quiz" },
    ],
    status: [
      { kind: "quiz", label: "Quiz Diagnóstico" },
      { kind: "online", label: "Participantes online" },
    ],
    dica: "Sequência: projete o QR → espere todos na tela 'aguarde' → LIBERE o quiz (largada conjunta) → no fim, projete o Resultado pra comentar.",
    voceUsa: ["celular"],
    alunoUsa: ["celular"],
  },
  3: {
    acoes: [
      { kind: "liberar-termometro", label: "Liberar Termômetro (largada)" },
      { kind: "telao-termometro", label: "Abrir Termômetro no telão" },
    ],
    status: [{ kind: "termometro", fase: "inicio", label: "Termômetro (início)" }],
    voceUsa: ["celular"],
    alunoUsa: ["celular"],
  },
  4: {
    acoes: [
      { kind: "telao-conteudo", conteudoId: "conteudos-didaticos", label: "Conteúdos Didáticos no telão" },
      { kind: "telao-conteudo", conteudoId: "entendendo-pgp", label: "Entendendo o PGP no telão" },
      { kind: "telao-conteudo", conteudoId: "historico-lgpd", label: "Histórico da LGPD no telão" },
      { kind: "telao-conteudo", conteudoId: "estrutura-lgpd", label: "Estrutura da LGPD no telão" },
    ],
    status: [],
    dica: "Siga os botões acima na ordem (tudo pelo celular). Desafios LGPD: dropdown '📺 Slides e conteúdos…' → escolha a faixa (1-11 … 51-65); os grupos respondem no celular.",
    voceUsa: ["celular"],
    alunoUsa: ["celular", "impresso"],
  },
  5: {
    acoes: [
      { kind: "telao-conteudo", conteudoId: "fase-preliminar", label: "Fase Preliminar no telão" },
    ],
    status: [],
    dica: "Projete a Fase Preliminar (sensibilização) e conduza a discussão da Carta nos cards.",
    voceUsa: ["celular", "sala"],
    alunoUsa: ["impresso", "discussao"],
  },
  6: {
    acoes: [
      { kind: "telao-conteudo", conteudoId: "fase-1", label: "Fase 1 (art. 41) no telão" },
    ],
    status: [],
    dica: "Projete a Fase 1 (art. 41) e conduza o Ato de Designação nos cards.",
    voceUsa: ["celular", "sala"],
    alunoUsa: ["impresso"],
  },
  7: {
    acoes: [
      { kind: "telao-conteudo", conteudoId: "fase-2", label: "Fase 2 (priorização) no telão" },
      { kind: "telao-atividade", atividadeId: "priorizacao-f2", label: "Abrir votação de Priorização" },
    ],
    status: [{ kind: "atividade", atividadeId: "priorizacao-f2", label: "Priorização (votação)" }],
    voceUsa: ["celular", "sala"],
    alunoUsa: ["impresso", "celular"],
  },
  8: {
    acoes: [
      { kind: "telao-conteudo", conteudoId: "fase-3", label: "Fase 3 (Inventário) no telão" },
      { kind: "telao-atividade", atividadeId: "classificacao-f3", label: "Abrir Classificação (base legal)" },
    ],
    status: [{ kind: "atividade", atividadeId: "classificacao-f3", label: "Classificação (base legal)" }],
    dica: "O Inventário e os Riscos são montados nos cards físicos (fichas). Acompanhe o fluxo na mesa.",
    voceUsa: ["celular", "sala"],
    alunoUsa: ["impresso", "celular"],
  },
  9: {
    acoes: [
      { kind: "telao-conteudo", conteudoId: "fase-4", label: "Fase 4 (GAP) no telão" },
      { kind: "telao-atividade", atividadeId: "aderencia-f4", label: "Abrir votação de Aderência (GAP)" },
    ],
    status: [{ kind: "atividade", atividadeId: "aderencia-f4", label: "Aderência (GAP)" }],
    voceUsa: ["celular", "sala"],
    alunoUsa: ["impresso", "celular"],
  },
  10: {
    acoes: [
      { kind: "telao-conteudo", conteudoId: "fase-5", label: "Fase 5 (Plano de Ação) no telão" },
    ],
    status: [],
    dica: "Projete a Fase 5 e conduza os cards de ação na mesa.",
    voceUsa: ["celular", "sala"],
    alunoUsa: ["impresso"],
  },
  11: {
    acoes: [
      { kind: "telao-conteudo", conteudoId: "fase-6", label: "Fase 6 (instrumentos) no telão" },
      { kind: "telao-atividade", atividadeId: "ripd-ordem-f6", label: "Abrir RIPD (ordenar seções)" },
      { kind: "telao-atividade", atividadeId: "politica-ordem-f6", label: "Abrir Política (ordenar)" },
      { kind: "telao-atividade", atividadeId: "balanceamento-f6", label: "Abrir Balanceamento (LI)" },
      { kind: "disparar-dsr", label: "Disparar DSR Surpresa" },
    ],
    status: [{ kind: "atividade", atividadeId: "ripd-ordem-f6", label: "RIPD (ordenar)" }],
    dica: "No meio da fase, entregue o card DSR Surpresa e dispare no app.",
    voceUsa: ["celular", "sala"],
    alunoUsa: ["celular", "impresso"],
  },
  12: {
    acoes: [
      { kind: "telao-conteudo", conteudoId: "fase-7", label: "Fase 7 (incidentes) no telão" },
      { kind: "disparar-incidente", label: "Disparar Incidente (cronômetro 72h)" },
    ],
    status: [],
    dica: "Leia o card do Incidente em voz alta e ligue o clima de tensão.",
    voceUsa: ["celular", "sala"],
    alunoUsa: ["impresso"],
  },
  13: {
    acoes: [{ kind: "telao-placar", label: "Abrir pódio / placar no telão" }],
    status: [],
    voceUsa: ["celular"],
    alunoUsa: ["celular"],
  },
  14: {
    acoes: [
      { kind: "liberar-termometro", label: "Liberar Termômetro final (largada)" },
      { kind: "telao-termometro", label: "Abrir Termômetro (evolução)" },
    ],
    status: [{ kind: "termometro", fase: "fim", label: "Termômetro (fim)" }],
    voceUsa: ["celular"],
    alunoUsa: ["celular"],
  },
  15: {
    acoes: [{ kind: "telao-termometro", label: "Projetar a evolução do Termômetro" }],
    status: [],
    dica: "Conecte a evolução do Termômetro (início × fim) com o que o grupo viveu.",
    voceUsa: ["sala"],
    alunoUsa: ["discussao"],
  },
  16: {
    acoes: [{ kind: "fechamento", label: "Relatório, certificados e entrega" }],
    status: [],
    voceUsa: ["notebook", "sala"],
    alunoUsa: ["discussao"],
  },
};

export const ROTEIRO_CONDUCAO: MomentoConducao[] = ROTEIRO.map((m) => ({
  ...m,
  acoes: MAPA[m.numero]?.acoes ?? [],
  status: MAPA[m.numero]?.status ?? [],
  dica: MAPA[m.numero]?.dica,
  voceUsa: MAPA[m.numero]?.voceUsa ?? [],
  alunoUsa: MAPA[m.numero]?.alunoUsa ?? [],
}));

// Minutos sugeridos a partir da string "35 min" / "120 min".
export function minutosDoMomento(duracao: string): number {
  const n = parseInt(duracao, 10);
  return Number.isFinite(n) ? n : 0;
}
