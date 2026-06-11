// POST /api/curso/quiz-liberar { turmaId, liberado }
//
// Trava de largada do Quiz Diagnóstico. liberado=false (estado inicial): quem
// abrir o quiz fica numa tela de espera; liberado=true: todos entram juntos
// (o celular do aluno entra sozinho via polling do /api/quiz/start).
// Admin-only — só o facilitador controla a largada.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { ensureColunaQuizLiberado } from "@/lib/coluna-quiz-liberado";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const body = (await req.json()) as { turmaId?: string; liberado?: boolean };
  if (!body.turmaId || typeof body.liberado !== "boolean") {
    return NextResponse.json({ error: "turmaId e liberado (boolean) obrigatórios" }, { status: 400 });
  }

  await ensureColunaQuizLiberado();
  await prisma.cursoTurma.update({
    where: { id: body.turmaId },
    data: { quizLiberado: body.liberado },
  });

  return NextResponse.json({ ok: true, quizLiberado: body.liberado });
}
