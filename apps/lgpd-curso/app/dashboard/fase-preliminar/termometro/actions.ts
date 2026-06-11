"use server";

// Server actions do Termômetro Institucional (Fase Preliminar).
// INDIVIDUAL: cada participante avalia a maturidade da PRÓPRIA instituição
// real. Início ↔ fim amarram pelo user.id (o crachá identifica a pessoa) —
// diferente do Quiz, que é anônimo por dispositivo. Armazenado em
// termometro_respostas (1 linha por user × momento), não mais na company.

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureTabelaTermometro } from "@/lib/colunas-termometro";
import { ensureColunaTermometroLiberado } from "@/lib/coluna-termometro-liberado";
import {
  calcularScoreTermometro,
  DIMENSOES_TERMOMETRO,
  type NivelTermometro,
  type TermometroSalvo,
} from "@/lib/termometro-perguntas";
import { revalidatePath } from "next/cache";

type Momento = "INICIO" | "FIM";

// Converte uma linha da tabela no shape TermometroSalvo que o runner consome.
function linhaParaSalvo(row: {
  dimensoes: unknown;
  score: number;
  finalizadoEm: Date;
} | null): TermometroSalvo | null {
  if (!row) return null;
  return {
    dimensoes: (row.dimensoes as TermometroSalvo["dimensoes"]) ?? [],
    score: row.score,
    finalizadoEm: row.finalizadoEm.toISOString(),
  };
}

// Lê os 2 termômetros (início/fim) DO PRÓPRIO usuário logado.
// ADMIN/sem sessão vê vazio (não crasha) — banner de preview explica.
export async function getTermometro(): Promise<{
  inicio: TermometroSalvo | null;
  fim: TermometroSalvo | null;
  liberado: boolean;
  isAdmin: boolean;
}> {
  await ensureTabelaTermometro();
  await ensureColunaTermometroLiberado();
  const session = await getSession();
  const userId = session?.user?.id;
  const companyId = session?.user?.companyId;
  const isAdmin = session?.user?.role === "ADMIN";
  if (!userId) return { inicio: null, fim: null, liberado: isAdmin, isAdmin };

  const rows = await prisma.termometroResposta.findMany({
    where: { userId, momento: { in: ["INICIO", "FIM"] } },
    select: { momento: true, dimensoes: true, score: true, finalizadoEm: true },
  });
  const inicio = rows.find((r) => r.momento === "INICIO") ?? null;
  const fim = rows.find((r) => r.momento === "FIM") ?? null;

  // Largada conjunta: o facilitador (ADMIN) sempre vê; o participante depende
  // da trava da turma. Sem grupo/turma → destravado (não prende por bug).
  let liberado = isAdmin;
  if (!isAdmin && companyId) {
    const grupo = await prisma.cursoGrupo.findUnique({
      where: { companyId },
      select: { turma: { select: { termometroLiberado: true } } },
    });
    liberado = grupo?.turma?.termometroLiberado ?? false;
  }

  return { inicio: linhaParaSalvo(inicio), fim: linhaParaSalvo(fim), liberado, isAdmin };
}

// Persiste o termômetro (inicial ou final) do usuário logado. Valida cada
// dimensão e faz upsert por (userId, momento) — refazer sobrescreve.
export async function salvarTermometro(
  momento: Momento,
  respostas: Record<string, NivelTermometro>,
): Promise<{ ok: true; score: number } | { ok: false; error: string }> {
  try {
    await ensureTabelaTermometro();
    await ensureColunaTermometroLiberado();
    const session = await getSession();
    const userId = session?.user?.id;
    const companyId = session?.user?.companyId;
    const papel = session?.user?.papel ?? null;
    if (!userId) return { ok: false, error: "Faça login para salvar." };
    if (!companyId) {
      return { ok: false, error: "Só participantes de um grupo preenchem o Termômetro." };
    }

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
      dimensoes.push({ id: dim.id, opcaoEscolhida: escolhida, pontos: opcao.pontos });
    }
    const score = calcularScoreTermometro(respostas);

    // turmaId vem do grupo do participante (1 company = 1 grupo).
    const grupo = await prisma.cursoGrupo.findUnique({
      where: { companyId },
      select: { turmaId: true, turma: { select: { termometroLiberado: true } } },
    });
    if (!grupo) {
      return { ok: false, error: "Grupo não encontrado para este participante." };
    }
    // Largada conjunta: participante só grava quando o facilitador liberar.
    if (!grupo.turma?.termometroLiberado) {
      return { ok: false, error: "O Termômetro ainda não foi liberado. Aguarde o facilitador dar a largada. 🏁" };
    }

    await prisma.termometroResposta.upsert({
      where: { userId_momento: { userId, momento } },
      create: {
        turmaId: grupo.turmaId,
        companyId,
        userId,
        papel,
        momento,
        dimensoes,
        score,
      },
      update: {
        dimensoes,
        score,
        finalizadoEm: new Date(),
        // mantém turma/grupo/papel atualizados caso algo tenha mudado
        turmaId: grupo.turmaId,
        companyId,
        papel,
      },
    });

    revalidatePath("/dashboard/fase-preliminar/termometro");
    revalidatePath("/dashboard/fase-preliminar");
    return { ok: true, score };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erro ao salvar" };
  }
}
