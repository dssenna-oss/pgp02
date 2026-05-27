"use server";

// Server actions do Termômetro Institucional (Fase Preliminar).

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureColunasFasePreliminar } from "@/lib/coluna-fase-preliminar";
import {
  calcularScoreTermometro,
  DIMENSOES_TERMOMETRO,
  type NivelTermometro,
  type TermometroSalvo,
} from "@/lib/termometro-perguntas";
import { revalidatePath } from "next/cache";

type Momento = "INICIO" | "FIM";

async function requireCompany() {
  const session = await getSession();
  const companyId = session?.user?.companyId;
  const userName = session?.user?.name || "Desconhecido";
  if (!companyId) throw new Error("Sem empresa associada");
  return { companyId, userName };
}

// Lê o estado atual dos 2 termômetros da company.
// ADMIN sem companyId vê tudo vazio (não crasha) — banner de preview
// explica a situação. Salvar continua bloqueado nos guards do salvarTermometro.
export async function getTermometro(): Promise<{
  inicio: TermometroSalvo | null;
  fim: TermometroSalvo | null;
}> {
  await ensureColunasFasePreliminar();
  const session = await getSession();
  const companyId = session?.user?.companyId;
  if (!companyId) return { inicio: null, fim: null };
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { termometroInicio: true, termometroFim: true },
  });
  return {
    inicio: (company?.termometroInicio as TermometroSalvo | null) ?? null,
    fim: (company?.termometroFim as TermometroSalvo | null) ?? null,
  };
}

// Persiste o termômetro (inicial ou final). Valida cada dimensão antes.
export async function salvarTermometro(
  momento: Momento,
  respostas: Record<string, NivelTermometro>,
): Promise<{ ok: true; score: number } | { ok: false; error: string }> {
  try {
    await ensureColunasFasePreliminar();
    const { companyId, userName } = await requireCompany();

    // Valida: cada dimensão precisa ter resposta válida.
    const dimensoes: TermometroSalvo["dimensoes"] = [];
    for (const dim of DIMENSOES_TERMOMETRO) {
      const escolhida = respostas[dim.id];
      if (!escolhida) {
        return { ok: false, error: `Responda a dimensão "${dim.titulo}".` };
      }
      const opcao = dim.opcoes.find((o) => o.id === escolhida);
      if (!opcao) {
        return { ok: false, error: `Opção inválida em "${dim.titulo}".` };
      }
      dimensoes.push({
        id: dim.id,
        opcaoEscolhida: escolhida,
        pontos: opcao.pontos,
      });
    }
    const score = calcularScoreTermometro(respostas);

    const salvo: TermometroSalvo = {
      dimensoes,
      score,
      finalizadoEm: new Date().toISOString(),
      preenchidoPor: userName,
    };

    await prisma.company.update({
      where: { id: companyId },
      data: momento === "INICIO" ? { termometroInicio: salvo } : { termometroFim: salvo },
    });

    revalidatePath("/dashboard/fase-preliminar/termometro");
    revalidatePath("/dashboard/fase-preliminar");
    return { ok: true, score };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erro ao salvar" };
  }
}
