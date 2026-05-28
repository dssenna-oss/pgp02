// Progresso do grupo nas missões — usado pela sidebar pra mostrar ticks ✓
// ao lado de cada mini-app, ajudando o participante a ver onde está.
//
// Critério "done" por missão:
//   M1 (Inventário)  — pelo menos 2 processos APROVADOS (curso vem com 2 pré-cadastrados)
//   M2 (Riscos)      — pelo menos 1 risco registrado e APROVADO
//   M3 (GAP)         — todos os 10 controles respondidos
//   Plano de Ação    — pelo menos 1 ação registrada (origem RISCO/GAP/MANUAL)
//   M4a (RIPD)       — pelo menos 1 RIPD APROVADO
//   M4a (Terceiros)  — todos os operadores com cláusulas selecionadas
//                      (o curso vem com 2 operadores pré-cadastrados — igual M1,
//                      "existir" não conta; precisa o grupo ter trabalhado neles)
//   M4a (DSR)        — pelo menos 1 solicitação registrada
//   M4b (Aviso)      — Aviso com status PUBLICADO
//   M5 (Incidentes)  — pelo menos 1 incidente movido de RASCUNHO
//   PRI (Documento)  — Policy de slug "pri-resposta-incidentes" com status PUBLICADO

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { turmaEmModoCards } from "@/lib/curso-permissoes";

export type MissoesProgresso = {
  m1: boolean;
  m2: boolean;
  m3: boolean;
  plano_acao: boolean;
  m4a_ripd: boolean;
  m4a_terceiros: boolean;
  m4a_dsr: boolean;
  m4b: boolean;
  m5: boolean;
  pri: boolean;
  // DSR Surpresa: quantos pedidos disparados pelo facilitador ainda estão
  // sem ação do DPO (gameAction = null). Banner/badge usa essa contagem.
  dsrSurpresaPendentes: number;
  // Incidentes: quantos incidentes estão ABERTOS (status != ENCERRADO).
  // Inclui os RASCUNHO disparados pelo facilitador. Banner/badge usa essa
  // contagem pra alertar o DPO em qualquer página do dashboard.
  incidentesEmAberto: number;
  // Modalidade C — Onda 2: quando a turma está em Modo Cards, a sidebar mostra
  // o item "Atividades ao vivo" pro participante (toques leves no celular).
  modoCards: boolean;
};

const EMPTY: MissoesProgresso = {
  m1: false, m2: false, m3: false,
  plano_acao: false,
  m4a_ripd: false, m4a_terceiros: false, m4a_dsr: false,
  m4b: false, m5: false,
  pri: false,
  dsrSurpresaPendentes: 0,
  incidentesEmAberto: 0,
  modoCards: false,
};

export async function getMissoesProgresso(): Promise<MissoesProgresso> {
  const session = await getSession();
  const companyId = session?.user?.companyId;
  if (!companyId) return EMPTY;

  const [invs, qtdRiscosAprovados, qtdGap, qtdAcoes, qtdRipdsAprovados, operadores, qtdDsr, qtdDsrSurpresaPendentes, aviso, incidentes, priDoc, modoCards] = await Promise.all([
    prisma.dataInventory.findMany({ where: { companyId }, select: { status: true } }),
    prisma.processRisk.count({ where: { companyId, status: "APROVADO" } }),
    prisma.gapAnswer.count({ where: { companyId } }),
    prisma.actionPlan.count({ where: { companyId } }),
    prisma.ripd.count({ where: { companyId, status: "APROVADO" } }),
    prisma.operator.findMany({
      where: { companyId },
      select: { contracts: { select: { clausulasSelecionadas: true } } },
    }),
    prisma.dsrRequest.count({ where: { companyId } }),
    // DSR Surpresa pendentes: disparoFacilitador=true + nenhuma ação registrada ainda
    prisma.dsrRequest.count({ where: { companyId, disparoFacilitador: true, gameAction: null } }),
    prisma.policy.findFirst({
      where: { companyId, slug: "aviso-privacidade" },
      select: { status: true },
    }),
    prisma.incident.findMany({ where: { companyId }, select: { status: true } }),
    // Documento do PRI — reusa a tabela Policy com slug fixo (decisão da
    // Fatia 3 da Fase 7, ver actions.ts em /dashboard/pri). Done = PUBLICADO.
    prisma.policy.findFirst({
      where: { companyId, slug: "pri-resposta-incidentes" },
      select: { status: true },
    }),
    turmaEmModoCards(companyId),
  ]);

  return {
    m1: invs.length >= 2 && invs.every((i) => i.status === "APROVADO"),
    m2: qtdRiscosAprovados > 0,
    m3: qtdGap >= 10,
    plano_acao: qtdAcoes > 0,
    m4a_ripd: qtdRipdsAprovados > 0,
    // "Existir operador" não conta — o curso semeia 2 pré-cadastrados.
    // Done = todos os operadores têm cláusulas LGPD selecionadas (o entregável
    // da missão; clausulasSelecionadas nasce vazio no seed).
    m4a_terceiros:
      operadores.length > 0 &&
      operadores.every((o) => (o.contracts?.[0]?.clausulasSelecionadas?.length ?? 0) > 0),
    m4a_dsr: qtdDsr > 0,
    m4b: aviso?.status === "PUBLICADO",
    m5: incidentes.some((i) => i.status && i.status !== "RASCUNHO"),
    pri: priDoc?.status === "PUBLICADO",
    dsrSurpresaPendentes: qtdDsrSurpresaPendentes,
    incidentesEmAberto: incidentes.filter((i) => i.status !== "ENCERRADO").length,
    modoCards,
  };
}
