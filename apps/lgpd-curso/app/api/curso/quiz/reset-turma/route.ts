// POST /api/curso/quiz/reset-turma { turmaId }
// Apaga TODAS as respostas (quiz_responses) de uma turma — usado pelo
// facilitador depois de um quiz de teste pra começar o curso real do zero.
//
// Admin-only. O participante segue precisando limpar o localStorage do
// próprio dispositivo (ou usar aba anônima) pra responder de novo —
// esta rota mexe SÓ no banco.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const { turmaId } = await req.json();
  if (!turmaId) {
    return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });
  }

  // Confirma que a turma existe — evita "apagar quiz de turma inexistente"
  // dar falsa sensação de sucesso.
  const turma = await prisma.cursoTurma.findUnique({
    where: { id: turmaId },
    select: { id: true, nome: true },
  });
  if (!turma) {
    return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
  }

  const { count } = await prisma.quizResponse.deleteMany({
    where: { turmaId },
  });

  return NextResponse.json({
    ok: true,
    turmaNome: turma.nome,
    deletedCount: count,
  });
}
