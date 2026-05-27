"use server";

// Server actions do quiz "Caça às Pegadinhas" — missão de Encerramento.
//
// 8 pegadinhas (2 nos processos do órgão do grupo + 6 erros plantados no Aviso).
// Grupo decide pra cada uma se identifica problema ou não, com observação opcional.
// Após submeter, vê o gabarito completo com descrição pedagógica + artigo LGPD.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureColunaOlhoClinico } from "@/lib/coluna-olho-clinico";
import {
  PEGADINHAS_PROCESSOS,
  type PegadinhaProcessoId,
} from "@/lib/processos-pegadinhas";
import { CATALOGO_ERROS_PLANTADOS, type ErroPlantadoId } from "@/lib/aviso-erros-plantados";
import { revalidatePath } from "next/cache";

export type RespostaQuiz = {
  pegadinhaId: PegadinhaProcessoId | ErroPlantadoId;
  tipo: "PROCESSO" | "AVISO";
  detectou: "SIM" | "NAO" | "NAO_SEI";
  observacao: string;
};

export type QuizSalvo = {
  respostas: RespostaQuiz[];
  score: number;
  total: number;
  finalizadoEm: string;
};

export type QuizEstado = {
  orgao: "PM" | "CM" | null;
  quizSalvo: QuizSalvo | null;
  bloqueado?: boolean;
  motivoBloqueio?: string;
};

// Lê o estado do quiz pro grupo logado.
// ADMIN sem company vê tudo vazio (não crasha) — banner explica.
export async function getQuizState(): Promise<QuizEstado> {
  await ensureColunaOlhoClinico();
  const session = await getSession();
  const companyId = session?.user?.companyId;
  if (!companyId) {
    return { orgao: null, quizSalvo: null, bloqueado: true, motivoBloqueio: "Sem grupo associado" };
  }
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { orgao: true, olhoClinicoQuiz: true },
  });
  const orgao = (company?.orgao === "CM" ? "CM" : company?.orgao === "PM" ? "PM" : null) as "PM" | "CM" | null;
  return {
    orgao,
    quizSalvo: (company?.olhoClinicoQuiz as QuizSalvo | null) ?? null,
  };
}

// Persiste o quiz. Idempotente — chamadas posteriores sobrescrevem.
// Aberto a DPO + Contribuidores do grupo (qualquer um pode submeter).
export async function submeterQuiz(
  respostas: RespostaQuiz[],
): Promise<{ ok: true; score: number; total: number } | { ok: false; error: string }> {
  try {
    await ensureColunaOlhoClinico();
    const session = await getSession();
    const companyId = session?.user?.companyId;
    if (!companyId) {
      return { ok: false, error: "Sem grupo associado — faça login como participante do grupo" };
    }

    if (!Array.isArray(respostas) || respostas.length === 0) {
      return { ok: false, error: "Responda pelo menos uma pegadinha antes de submeter" };
    }

    // Valida IDs e tipos
    const idsValidosProcessos = new Set<string>(PEGADINHAS_PROCESSOS.map((p) => p.id));
    const idsValidosAviso = new Set<string>(CATALOGO_ERROS_PLANTADOS.map((e) => e.id));
    const respostasNorm: RespostaQuiz[] = [];
    for (const r of respostas) {
      const id = r.pegadinhaId as string;
      const valido = (r.tipo === "PROCESSO" && idsValidosProcessos.has(id)) ||
        (r.tipo === "AVISO" && idsValidosAviso.has(id));
      if (!valido) continue;
      if (!["SIM", "NAO", "NAO_SEI"].includes(r.detectou)) continue;
      respostasNorm.push({
        pegadinhaId: r.pegadinhaId,
        tipo: r.tipo,
        detectou: r.detectou,
        observacao: typeof r.observacao === "string" ? r.observacao.trim().slice(0, 1000) : "",
      });
    }
    if (respostasNorm.length === 0) {
      return { ok: false, error: "Nenhuma resposta válida" };
    }

    // Score = quantas detectou=SIM (todas as 8 são pegadinhas reais)
    const score = respostasNorm.filter((r) => r.detectou === "SIM").length;
    const total = respostasNorm.length;

    const salvo: QuizSalvo = {
      respostas: respostasNorm,
      score,
      total,
      finalizadoEm: new Date().toISOString(),
    };

    await prisma.company.update({
      where: { id: companyId },
      data: { olhoClinicoQuiz: salvo as any },
    });

    revalidatePath("/dashboard/caca-pegadinhas");
    revalidatePath("/dashboard");
    return { ok: true, score, total };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erro ao salvar" };
  }
}

// Reabre o quiz pra refazer (apaga o salvo).
export async function refazerQuiz(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await ensureColunaOlhoClinico();
    const session = await getSession();
    const companyId = session?.user?.companyId;
    if (!companyId) return { ok: false, error: "Sem grupo associado" };
    await prisma.company.update({
      where: { id: companyId },
      data: { olhoClinicoQuiz: Prisma.JsonNull },
    });
    revalidatePath("/dashboard/caca-pegadinhas");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erro ao refazer" };
  }
}
