/**
 * Fase 2 — Diagnóstico de Privacidade.
 *
 * Calcula AO VIVO uma nota 0-100 de adequação à LGPD a partir dos dados que
 * as outras fases já mantêm (sem schema novo, sem questionário). 4 pilares
 * ponderados (pesos definidos com o user 2026-05-31):
 *   GAP 40% · Riscos 30% · Bases legais 10% · Inventário 20%
 *
 * Pilar sem dados conta como 0 (sinaliza "comece por aqui"), mas a UI mostra
 * "sem dados" pra não confundir com baixo desempenho.
 */

import { prisma } from "@/lib/prisma";
import { scoreGeral, type RespostaMap } from "@/lib/gap-score";

export type PilarDiag = {
  key: "gap" | "riscos" | "bases" | "inventario";
  label: string;
  score: number; // 0-100
  weight: number; // 0-1
  semDados: boolean;
  detail: string;
  href: string;
};

export type Diagnostico = {
  overall: number; // 0-100
  nivel: { label: string; faixa: string; cor: string };
  pilares: PilarDiag[];
  recomendacoes: { texto: string; href: string }[];
};

const PESOS = { gap: 0.4, riscos: 0.3, bases: 0.1, inventario: 0.2 };

function nivelDe(score: number): Diagnostico["nivel"] {
  if (score <= 25) return { label: "Inicial", faixa: "0–25", cor: "text-red-600" };
  if (score <= 50) return { label: "Em desenvolvimento", faixa: "26–50", cor: "text-amber-600" };
  if (score <= 75) return { label: "Intermediário", faixa: "51–75", cor: "text-blue-600" };
  return { label: "Avançado", faixa: "76–100", cor: "text-emerald-600" };
}

export async function calcularDiagnostico(): Promise<Diagnostico> {
  const [gapAnswers, riscos, inventario] = await Promise.all([
    prisma.gapAnswer.findMany({ select: { controlCode: true, aderencia: true } }),
    prisma.processRisk.findMany({ select: { status: true } }),
    prisma.dataInventory.findMany({ select: { status: true, baseLegal: true } }),
  ]);

  // ---- Pilar GAP: aderência dos controles avaliados ----
  const respostas: RespostaMap = {};
  for (const g of gapAnswers) respostas[g.controlCode] = { aderencia: g.aderencia };
  const gap = scoreGeral(respostas);
  const gapSemDados = gap.respondidos === 0;
  const gapScore = gap.score ?? 0;

  // ---- Pilar Riscos: % de riscos já tratados/aceitos (não-abertos) ----
  const riscosSemDados = riscos.length === 0;
  const riscosTratados = riscos.filter((r) => r.status !== "ABERTO").length;
  const riscosScore = riscosSemDados ? 0 : Math.round((riscosTratados / riscos.length) * 100);

  // ---- Pilar Bases legais: % de processos com base legal preenchida ----
  const invSemDados = inventario.length === 0;
  const comBase = inventario.filter((i) => (i.baseLegal ?? "").trim().length > 0).length;
  const basesScore = invSemDados ? 0 : Math.round((comBase / inventario.length) * 100);

  // ---- Pilar Inventário: % concluído (EM_REVISAO conta meio) ----
  const invConcluido = inventario.reduce((acc, i) => {
    if (i.status === "CONCLUIDO") return acc + 1;
    if (i.status === "EM_REVISAO") return acc + 0.5;
    return acc;
  }, 0);
  const inventarioScore = invSemDados ? 0 : Math.round((invConcluido / inventario.length) * 100);

  const pilares: PilarDiag[] = [
    {
      key: "gap", label: "GAP — aderência aos controles", weight: PESOS.gap,
      score: gapScore, semDados: gapSemDados,
      detail: gapSemDados ? "GAP ainda não iniciado" : `${gap.aderentes} aderentes · ${gap.parciais} parciais · ${gap.naoAderentes} não aderentes (de ${gap.respondidos} avaliados)`,
      href: "/dashboard/gap",
    },
    {
      key: "riscos", label: "Riscos — tratamento", weight: PESOS.riscos,
      score: riscosScore, semDados: riscosSemDados,
      detail: riscosSemDados ? "Nenhum risco mapeado" : `${riscosTratados} de ${riscos.length} riscos tratados/aceitos`,
      href: "/dashboard/riscos",
    },
    {
      key: "bases", label: "Bases legais definidas", weight: PESOS.bases,
      score: basesScore, semDados: invSemDados,
      detail: invSemDados ? "Inventário vazio" : `${comBase} de ${inventario.length} processos com base legal`,
      href: "/dashboard/inventario",
    },
    {
      key: "inventario", label: "Inventário concluído", weight: PESOS.inventario,
      score: inventarioScore, semDados: invSemDados,
      detail: invSemDados ? "Inventário vazio" : `${inventario.filter((i) => i.status === "CONCLUIDO").length} concluídos de ${inventario.length} processos`,
      href: "/dashboard/inventario",
    },
  ];

  const overall = Math.round(pilares.reduce((acc, p) => acc + p.score * p.weight, 0));

  // Recomendações: pilares mais fracos (score < 60), ordenados por impacto (peso × lacuna).
  const recomendacoes = pilares
    .filter((p) => p.score < 60)
    .sort((a, b) => b.weight * (100 - b.score) - a.weight * (100 - a.score))
    .map((p) => ({
      texto:
        p.key === "gap" ? (p.semDados ? "Inicie o GAP Analysis para medir a aderência aos 119 controles." : "Avance no GAP Analysis — ainda há controles não aderentes.")
        : p.key === "riscos" ? (p.semDados ? "Faça a Análise de Riscos dos processos do Inventário." : "Trate os riscos ainda em aberto na Análise de Riscos.")
        : p.key === "bases" ? "Preencha a base legal dos processos no Inventário."
        : "Conclua o mapeamento dos processos no Inventário.",
      href: p.href,
    }));

  return { overall, nivel: nivelDe(overall), pilares, recomendacoes };
}
