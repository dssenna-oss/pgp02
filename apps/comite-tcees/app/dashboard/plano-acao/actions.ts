"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { GAP_CONTROLS } from "@/lib/gap-catalog";
import { nivelRisco } from "@/lib/comite-ui";

export type AcaoInput = {
  id?: string;
  acao: string;
  descricao?: string;
  origem?: string;
  responsavel?: string;
  prazo?: string; // YYYY-MM-DD
  prioridade: string;
  status: string;
};

const PRIO = ["BAIXA", "MEDIA", "ALTA"];
const STATUS = ["A_FAZER", "EM_ANDAMENTO", "CONCLUIDA"];

export async function salvarAcao(input: AcaoInput) {
  await requireSession();
  if (!input.acao?.trim()) throw new Error("Descreva a ação.");
  const dados = {
    acao: input.acao.trim(),
    descricao: input.descricao?.trim() || null,
    origem: input.origem || "MANUAL",
    responsavel: input.responsavel?.trim() || null,
    prazo: input.prazo ? new Date(`${input.prazo}T12:00:00`) : null,
    prioridade: PRIO.includes(input.prioridade) ? input.prioridade : "MEDIA",
    status: STATUS.includes(input.status) ? input.status : "A_FAZER",
  };
  if (input.id) {
    await prisma.actionPlan.update({ where: { id: input.id }, data: dados });
  } else {
    const max = await prisma.actionPlan.aggregate({ _max: { ordem: true } });
    await prisma.actionPlan.create({ data: { ...dados, ordem: (max._max.ordem ?? 0) + 1 } });
  }
  revalidatePath("/dashboard/plano-acao");
  return { ok: true };
}

export async function excluirAcao(id: string) {
  await requireSession();
  await prisma.actionPlan.delete({ where: { id } });
  revalidatePath("/dashboard/plano-acao");
  return { ok: true };
}

/** Importa lacunas do GAP: controles Não aderente / Parcial viram ações. Idempotente. */
export async function importarDoGap() {
  await requireSession();
  const [answers, jaImportadas] = await Promise.all([
    prisma.gapAnswer.findMany({ where: { aderencia: { in: ["NAO_ADERENTE", "PARCIAL"] } } }),
    prisma.actionPlan.findMany({ where: { origem: "GAP" }, select: { origemRef: true } }),
  ]);
  const refs = new Set(jaImportadas.map((a) => a.origemRef));
  const byCode = new Map(GAP_CONTROLS.map((c) => [c.code, c]));

  let max = (await prisma.actionPlan.aggregate({ _max: { ordem: true } }))._max.ordem ?? 0;
  const novas = answers
    .filter((a) => !refs.has(a.controlCode))
    .map((a) => {
      const ctrl = byCode.get(a.controlCode);
      const q = ctrl?.question ?? "";
      return {
        origem: "GAP",
        origemRef: a.controlCode,
        acao: a.pontoMelhoria?.trim() || `Adequar controle ${a.controlCode}: ${q.slice(0, 120)}`,
        descricao: ctrl ? `${ctrl.domain} — ${q}` : null,
        prioridade: a.aderencia === "NAO_ADERENTE" ? "ALTA" : "MEDIA",
        status: "A_FAZER",
        ordem: ++max,
      };
    });
  if (novas.length) await prisma.actionPlan.createMany({ data: novas });
  revalidatePath("/dashboard/plano-acao");
  return { ok: true, criadas: novas.length };
}

/** Importa recomendações da Análise de Riscos (riscos não tratados). Idempotente. */
export async function importarDosRiscos() {
  await requireSession();
  const [riscos, jaImportadas] = await Promise.all([
    prisma.processRisk.findMany({ where: { status: { not: "TRATADO" } }, include: { inventory: { select: { nome: true } } } }),
    prisma.actionPlan.findMany({ where: { origem: "RISCO" }, select: { origemRef: true } }),
  ]);
  const refs = new Set(jaImportadas.map((a) => a.origemRef));

  let max = (await prisma.actionPlan.aggregate({ _max: { ordem: true } }))._max.ordem ?? 0;
  const novas = riscos
    .filter((r) => !refs.has(r.id))
    .map((r) => {
      const nv = nivelRisco(r.probabilidade, r.impacto);
      const tratamento = r.recomendacao?.trim() || `Tratar risco: ${r.descricao}`;
      return {
        origem: "RISCO",
        origemRef: r.id,
        // Prefixa com o nome do processo pra cada ação ser distinguível
        // (vários riscos podem ter a mesma recomendação genérica).
        acao: `${r.inventory.nome} — ${tratamento}`,
        descricao: r.descricao,
        prioridade: nv.nivel === "ALTO" ? "ALTA" : nv.nivel === "MEDIO" ? "MEDIA" : "BAIXA",
        status: "A_FAZER",
        ordem: ++max,
      };
    });
  if (novas.length) await prisma.actionPlan.createMany({ data: novas });
  revalidatePath("/dashboard/plano-acao");
  return { ok: true, criadas: novas.length };
}
