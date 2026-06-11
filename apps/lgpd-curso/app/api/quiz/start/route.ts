// POST /api/quiz/start
// Cria uma QuizResponse anônima e devolve as perguntas (sem revelar resposta correta).
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
import { ensureColunaQuizDuracao } from "@/lib/coluna-quiz-duracao";
import { perguntasPublicas, TOTAL_PERGUNTAS } from "@/lib/quiz-perguntas";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    await ensureTabelaQuiz();
    await ensureColunaQuizDuracao();

    const body = await req.json();
    const turmaSlug = String(body?.turmaSlug || "").trim();
    const uuid = String(body?.uuid || "").trim();

    if (!turmaSlug || !uuid) {
      return NextResponse.json({ error: "turmaSlug e uuid são obrigatórios" }, { status: 400 });
    }

    const turma = await prisma.cursoTurma.findFirst({
      where: { slug: turmaSlug },
      select: { id: true, nome: true, cidade: true, status: true, quizDuracaoMinutos: true },
    });
    if (!turma) {
      return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
    }
    if (turma.status !== "ATIVA") {
      return NextResponse.json({ error: "Turma encerrada — quiz indisponível" }, { status: 403 });
    }

    // Cria ou recupera a QuizResponse existente.
    // O upsert do Prisma NÃO é atômico (select+insert): dois starts simultâneos
    // do MESMO cliente (retry do celular, efeito duplo do React em dev) podem
    // ambos tentar criar — o perdedor estoura P2002. Nesse caso a linha já
    // existe; repetir o upsert cai no caminho de update e devolve o estado.
    const argsUpsert = {
      where: { turmaId_uuid: { turmaId: turma.id, uuid } },
      update: {},
      create: { turmaId: turma.id, uuid },
      select: { id: true, startedAt: true, finishedAt: true, scoreTotal: true, scorePorCategoria: true },
    } as const;
    let resposta;
    try {
      resposta = await prisma.quizResponse.upsert(argsUpsert);
    } catch (e: any) {
      if (e?.code !== "P2002") throw e;
      resposta = await prisma.quizResponse.upsert(argsUpsert);
    }

    // Calcula deadline se a turma tem duração configurada.
    // Decisão UX (2026-05-25): timer POR participante (cada um tem o mesmo
    // tempo desde o seu próprio startedAt) — mais justo que cronômetro global.
    // Null = sem timer (comportamento legado).
    const deadline = turma.quizDuracaoMinutos
      ? new Date(
          resposta.startedAt.getTime() + turma.quizDuracaoMinutos * 60 * 1000
        ).toISOString()
      : null;

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
      // Timer: deadline ISO ou null. O cliente respeita silenciosamente
      // (sem UI) — quando bater na hora, submete automático.
      deadline,
      duracaoMinutos: turma.quizDuracaoMinutos,
    });
  } catch (e: any) {
    console.error("[quiz/start]", e);
    return NextResponse.json({ error: e.message || "Erro" }, { status: 500 });
  }
}
