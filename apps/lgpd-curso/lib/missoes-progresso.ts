// Progresso do grupo nas 8 missões — usado pela sidebar pra mostrar ticks ✓
// ao lado de cada mini-app, ajudando o participante a ver onde está.
//
// Critério "done" por missão:
//   M1 (Inventário)  — pelo menos 2 processos APROVADOS (curso vem com 2 pré-cadastrados)
//   M2 (Riscos)      — pelo menos 1 risco registrado
//   M3 (GAP)         — todos os 10 controles respondidos
//   M4a (RIPD)       — pelo menos 1 RIPD APROVADO
//   M4a (Terceiros)  — pelo menos 1 operador cadastrado
//   M4a (DSR)        — pelo menos 1 solicitação registrada
//   M4b (Aviso)      — Aviso com status PUBLICADO
//   M5 (Incidentes)  — pelo menos 1 incidente movido de RASCUNHO

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";

export type MissoesProgresso = {
  m1: boolean;
  m2: boolean;
  m3: boolean;
  m4a_ripd: boolean;
  m4a_terceiros: boolean;
  m4a_dsr: boolean;
  m4b: boolean;
  m5: boolean;
};

const EMPTY: MissoesProgresso = {
  m1: false, m2: false, m3: false,
  m4a_ripd: false, m4a_terceiros: false, m4a_dsr: false,
  m4b: false, m5: false,
};

export async function getMissoesProgresso(): Promise<MissoesProgresso> {
  const session = await getSession();
  const companyId = session?.user?.companyId;
  if (!companyId) return EMPTY;

  const [invs, qtdRiscosAprovados, qtdGap, qtdRipdsAprovados, qtdOperadores, qtdDsr, aviso, incidentes] = await Promise.all([
    prisma.dataInventory.findMany({ where: { companyId }, select: { status: true } }),
    prisma.processRisk.count({ where: { companyId, status: "APROVADO" } }),
    prisma.gapAnswer.count({ where: { companyId } }),
    prisma.ripd.count({ where: { companyId, status: "APROVADO" } }),
    prisma.operator.count({ where: { companyId } }),
    prisma.dsrRequest.count({ where: { companyId } }),
    prisma.policy.findFirst({
      where: { companyId, slug: "aviso-privacidade" },
      select: { status: true },
    }),
    prisma.incident.findMany({ where: { companyId }, select: { status: true } }),
  ]);

  return {
    m1: invs.length >= 2 && invs.every((i) => i.status === "APROVADO"),
    m2: qtdRiscosAprovados > 0,
    m3: qtdGap >= 10,
    m4a_ripd: qtdRipdsAprovados > 0,
    m4a_terceiros: qtdOperadores > 0,
    m4a_dsr: qtdDsr > 0,
    m4b: aviso?.status === "PUBLICADO",
    m5: incidentes.some((i) => i.status && i.status !== "RASCUNHO"),
  };
}
