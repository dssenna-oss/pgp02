// Painel de Condução — overlay sobre o ROTEIRO (Modalidade C) que liga cada
// momento do curso às AÇÕES do app (telão, Modo Cards, disparos) e ao STATUS ao
// vivo ("posso avançar?"). Não cria endpoints novos — só mapeia o que já existe.

import { ROTEIRO, type MomentoRoteiro } from "./modalidade-c-conteudo";

export type AcaoConducao =
  | { kind: "telao-atividade"; atividadeId: string; label: string }
  | { kind: "telao-termometro"; label: string }
  | { kind: "telao-quiz"; label: string }
  | { kind: "telao-quiz-resultado"; label: string }
  | { kind: "telao-placar"; label: string }
  | { kind: "disparar-dsr"; label: string }
  | { kind: "disparar-incidente"; label: string }
  | { kind: "fechamento"; label: string };

export type StatusConducao =
  | { kind: "atividade"; atividadeId: string; label: string }
  | { kind: "termometro"; fase: "inicio" | "fim"; label: string }
  | { kind: "online"; label: string };

export type MomentoConducao = MomentoRoteiro & {
  acoes: AcaoConducao[];
  status: StatusConducao[];
  dica?: string;
};

// Mapa por número de momento (1-15). Momentos só de cards/presencial ficam sem
// ação de app (o painel mostra "nenhuma ação no app neste momento").
const MAPA: Record<number, { acoes: AcaoConducao[]; status: StatusConducao[]; dica?: string }> = {
  1: {
    acoes: [],
    status: [{ kind: "online", label: "Participantes online" }],
    dica: "Decida A/B/C pela infraestrutura. Na dúvida, use a Modalidade C (ligue o Modo Cards no atalho acima).",
  },
  2: {
    acoes: [
      { kind: "telao-quiz", label: "Abrir Quiz Diagnóstico" },
      { kind: "telao-quiz-resultado", label: "Resultado do Quiz" },
    ],
    status: [{ kind: "online", label: "Participantes online" }],
    dica: "Projete o QR (todos respondem) e, no fim, projete o Resultado do Quiz pra comentar com a turma.",
  },
  3: {
    acoes: [{ kind: "telao-termometro", label: "Abrir Termômetro no telão" }],
    status: [{ kind: "termometro", fase: "inicio", label: "Termômetro (início)" }],
  },
  4: { acoes: [], status: [], dica: "Momento de slides + cards (discussão da Carta). Sem ação no app." },
  5: { acoes: [], status: [], dica: "Momento de cards (Ato de Designação do DPO). Sem ação no app." },
  6: {
    acoes: [{ kind: "telao-atividade", atividadeId: "priorizacao-f2", label: "Abrir votação de Priorização" }],
    status: [{ kind: "atividade", atividadeId: "priorizacao-f2", label: "Priorização (votação)" }],
  },
  7: {
    acoes: [{ kind: "telao-atividade", atividadeId: "classificacao-f3", label: "Abrir Classificação (base legal)" }],
    status: [{ kind: "atividade", atividadeId: "classificacao-f3", label: "Classificação (base legal)" }],
    dica: "O Inventário e os Riscos são montados nos cards físicos (fichas). Acompanhe o fluxo na mesa.",
  },
  8: {
    acoes: [{ kind: "telao-atividade", atividadeId: "aderencia-f4", label: "Abrir votação de Aderência (GAP)" }],
    status: [{ kind: "atividade", atividadeId: "aderencia-f4", label: "Aderência (GAP)" }],
  },
  9: { acoes: [], status: [], dica: "Momento de cards (Plano de Ação). Sem ação no app." },
  10: {
    acoes: [
      { kind: "telao-atividade", atividadeId: "ripd-ordem-f6", label: "Abrir RIPD (ordenar seções)" },
      { kind: "telao-atividade", atividadeId: "politica-ordem-f6", label: "Abrir Política (ordenar)" },
      { kind: "telao-atividade", atividadeId: "balanceamento-f6", label: "Abrir Balanceamento (LI)" },
      { kind: "disparar-dsr", label: "Disparar DSR Surpresa" },
    ],
    status: [{ kind: "atividade", atividadeId: "ripd-ordem-f6", label: "RIPD (ordenar)" }],
    dica: "No meio da fase, entregue o card DSR Surpresa e dispare no app.",
  },
  11: {
    acoes: [{ kind: "disparar-incidente", label: "Disparar Incidente (cronômetro 72h)" }],
    status: [],
    dica: "Leia o card do Incidente em voz alta e ligue o clima de tensão.",
  },
  12: {
    acoes: [{ kind: "telao-placar", label: "Abrir pódio / placar no telão" }],
    status: [],
  },
  13: {
    acoes: [{ kind: "telao-termometro", label: "Abrir Termômetro (evolução)" }],
    status: [{ kind: "termometro", fase: "fim", label: "Termômetro (fim)" }],
  },
  14: {
    acoes: [{ kind: "telao-termometro", label: "Projetar a evolução do Termômetro" }],
    status: [],
    dica: "Conecte a evolução do Termômetro (início × fim) com o que o grupo viveu.",
  },
  15: {
    acoes: [{ kind: "fechamento", label: "Relatório, certificados e entrega" }],
    status: [],
  },
};

export const ROTEIRO_CONDUCAO: MomentoConducao[] = ROTEIRO.map((m) => ({
  ...m,
  acoes: MAPA[m.numero]?.acoes ?? [],
  status: MAPA[m.numero]?.status ?? [],
  dica: MAPA[m.numero]?.dica,
}));

// Minutos sugeridos a partir da string "35 min" / "120 min".
export function minutosDoMomento(duracao: string): number {
  const n = parseInt(duracao, 10);
  return Number.isFinite(n) ? n : 0;
}
