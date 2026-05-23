// POST /api/quiz/start
// Cria uma QuizResponse anônima e devolve as 30 perguntas (sem revelar resposta correta).
// Identificação 100% via UUID gerado no cliente (localStorage). Sem auth.
//
// Body: { turmaSlug: string, uuid: string }
// Retorna: { questaoIds: [...], perguntas: [{ qid, categoria, enunciado, alternativas }] }
//
// Idempotente: se já existe uma QuizResponse com este (turmaId, uuid), devolve
// o estado atual (pra suportar refresh do navegador).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureTabelaQuiz } from "@/lib/colunas-quiz";
import { perguntasPublicas, TOTAL_PERGUNTAS } from "@/lib/quiz-perguntas";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    await ensureTabelaQuiz();

    const body = await req.json();
    const turmaSlug = String(body?.turmaSlug || "").trim();
    const uuid = String(body?.uuid || "").trim();

    if (!turmaSlug || !uuid) {
      return NextResponse.json({ error: "turmaSlug e uuid são obrigatórios" }, { status: 400 });
    }

    const turma = await prisma.cursoTurma.findFirst({
      where: { slug: turmaSlug },
      select: { id: true, nome: true, cidade: true, status: true },
    });
    if (!turma) {
      return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
    }
    if (turma.status !== "ATIVA") {
      return NextResponse.json({ error: "Turma encerrada — quiz indisponível" }, { status: 403 });
    }

    // Cria ou recupera a QuizResponse existente
    const resposta = await prisma.quizResponse.upsert({
      where: {
        turmaId_uuid: {
          turmaId: turma.id,
          uuid,
        },
      },
      update: {},
      create: {
        turmaId: turma.id,
        uuid,
      },
      select: { id: true, finishedAt: true, scoreTotal: true, scorePorCategoria: true },
    });

    return NextResponse.json({
      turma: { nome: turma.nome, cidade: turma.cidade },
      perguntas: perguntasPublicas(),
      total: TOTAL_PERGUNTAS,
      // Se a pessoa já tinha respondido, devolve o resultado pra ela poder rever
      jaRespondeu: !!resposta.finishedAt,
      resultadoSalvo: resposta.finishedAt
        ? {
            scoreTotal: resposta.scoreTotal,
            scorePorCategoria: resposta.scorePorCategoria,
          }
        : null,
    });
  } catch (e: any) {
    console.error("[quiz/start]", e);
    return NextResponse.json({ error: e.message || "Erro" }, { status: 500 });
  }
}
