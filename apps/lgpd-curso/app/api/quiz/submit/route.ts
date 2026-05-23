// POST /api/quiz/submit
// Recebe as respostas do participante, calcula score e lacunas por categoria,
// persiste em QuizResponse. Devolve o resultado pra mostrar imediatamente.
//
// Body: { turmaSlug, uuid, respostas: [{ qid, selected }] }
// Retorna: { scoreTotal, totalPerguntas, scorePorCategoria: { cat: {correct, total, rotulo, emoji} } }
//
// Server-side calcula a correta pra não confiar no cliente — nunca exposto.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureTabelaQuiz } from "@/lib/colunas-quiz";
import {
  PERGUNTAS,
  CATEGORIAS,
  type CategoriaQuiz,
  TOTAL_PERGUNTAS,
} from "@/lib/quiz-perguntas";

export const maxDuration = 30;

type RespostaInput = { qid: string; selected: number };

export async function POST(req: NextRequest) {
  try {
    await ensureTabelaQuiz();

    const body = await req.json();
    const turmaSlug = String(body?.turmaSlug || "").trim();
    const uuid = String(body?.uuid || "").trim();
    const respostasInput = (body?.respostas as RespostaInput[]) || [];

    if (!turmaSlug || !uuid) {
      return NextResponse.json({ error: "turmaSlug e uuid são obrigatórios" }, { status: 400 });
    }

    const turma = await prisma.cursoTurma.findFirst({
      where: { slug: turmaSlug },
      select: { id: true },
    });
    if (!turma) {
      return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
    }

    // Calcula score server-side
    let scoreTotal = 0;
    const scorePorCategoria: Record<CategoriaQuiz, { correct: number; total: number }> = {
      principios: { correct: 0, total: 0 },
      bases_legais: { correct: 0, total: 0 },
      personagens: { correct: 0, total: 0 },
      direitos_titular: { correct: 0, total: 0 },
      fases_pgp: { correct: 0, total: 0 },
    };

    // Indexa input por qid pra lookup rápido
    const respostasMap = new Map<string, number>();
    for (const r of respostasInput) {
      if (r?.qid && typeof r.selected === "number") {
        respostasMap.set(r.qid, r.selected);
      }
    }

    const respostasFinais: { qid: string; selected: number; correct: boolean; categoria: CategoriaQuiz }[] = [];
    for (const p of PERGUNTAS) {
      const selected = respostasMap.get(p.qid);
      const correct = selected !== undefined && selected === p.correta;
      scorePorCategoria[p.categoria].total += 1;
      if (correct) {
        scoreTotal += 1;
        scorePorCategoria[p.categoria].correct += 1;
      }
      respostasFinais.push({
        qid: p.qid,
        selected: selected ?? -1, // -1 = não respondida
        correct,
        categoria: p.categoria,
      });
    }

    // Persiste
    const salvo = await prisma.quizResponse.upsert({
      where: {
        turmaId_uuid: {
          turmaId: turma.id,
          uuid,
        },
      },
      update: {
        respostas: respostasFinais,
        scoreTotal,
        scorePorCategoria: scorePorCategoria as any,
        finishedAt: new Date(),
      },
      create: {
        turmaId: turma.id,
        uuid,
        respostas: respostasFinais,
        scoreTotal,
        scorePorCategoria: scorePorCategoria as any,
        finishedAt: new Date(),
      },
      select: { id: true, scoreTotal: true, scorePorCategoria: true },
    });

    // Monta lacunas por categoria com rótulos pra exibir ao participante
    const lacunas = (Object.keys(CATEGORIAS) as CategoriaQuiz[]).map((cat) => {
      const meta = CATEGORIAS[cat];
      const dados = scorePorCategoria[cat];
      return {
        categoria: cat,
        rotulo: meta.rotulo,
        emoji: meta.emoji,
        correct: dados.correct,
        total: dados.total,
        // "lacuna" = quando acertou menos da metade da categoria
        ehLacuna: dados.total > 0 && dados.correct < dados.total / 2,
      };
    });

    return NextResponse.json({
      ok: true,
      scoreTotal: salvo.scoreTotal,
      totalPerguntas: TOTAL_PERGUNTAS,
      lacunas,
    });
  } catch (e: any) {
    console.error("[quiz/submit]", e);
    return NextResponse.json({ error: e.message || "Erro" }, { status: 500 });
  }
}
