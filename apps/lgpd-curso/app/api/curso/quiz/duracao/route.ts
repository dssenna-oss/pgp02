// POST /api/curso/quiz/duracao { turmaId, minutos: number | null }
// Define (ou remove) o limite de tempo do quiz da turma. Admin-only.
//
// minutos = número positivo → quando o participante começar o quiz,
//   ele tem N minutos a partir do startedAt dele. Ao bater na hora, o
//   cliente bloqueia próximas perguntas, mostra "Tempo esgotado" e
//   submete automático o que tem.
// minutos = null → sem limite (comportamento legado).
//
// Mexe SÓ na config — respostas em andamento usam o deadline calculado
// no momento do /quiz/start delas, então mudança de duração afeta apenas
// participantes que começarem DEPOIS do POST. Evita confusão de gente
// que já estava respondendo.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { ensureColunaQuizDuracao } from "@/lib/coluna-quiz-duracao";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  try {
    await ensureColunaQuizDuracao();

    const body = await req.json();
    const turmaId = String(body?.turmaId || "").trim();
    const minutosRaw = body?.minutos;

    if (!turmaId) {
      return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });
    }

    let minutos: number | null = null;
    if (minutosRaw !== null && minutosRaw !== undefined && minutosRaw !== "") {
      const n = Number(minutosRaw);
      if (!Number.isFinite(n) || n < 1 || n > 600) {
        return NextResponse.json(
          { error: "minutos deve ser entre 1 e 600 (ou null pra remover)" },
          { status: 400 }
        );
      }
      minutos = Math.round(n);
    }

    const turma = await prisma.cursoTurma.update({
      where: { id: turmaId },
      data: { quizDuracaoMinutos: minutos },
      select: { id: true, nome: true, quizDuracaoMinutos: true },
    });

    return NextResponse.json({
      ok: true,
      turma: { id: turma.id, nome: turma.nome, quizDuracaoMinutos: turma.quizDuracaoMinutos },
    });
  } catch (e: any) {
    console.error("[quiz/duracao]", e);
    return NextResponse.json({ error: e.message || "Erro" }, { status: 500 });
  }
}
