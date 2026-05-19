// POST /api/curso/marcar-proximo-curso
// Marca uma turma como "próximo curso" (ícone 🎯). Apenas 1 turma pode
// ter proximoCurso=true ao mesmo tempo — outras são desmarcadas em transação.
//
// Body: { turmaId: string, marcar: boolean }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const turmaId = String(body.turmaId || "");
  const marcar = !!body.marcar;

  if (!turmaId) return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });

  const turma = await prisma.cursoTurma.findUnique({
    where: { id: turmaId },
    select: { id: true, nome: true },
  });
  if (!turma) return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });

  if (marcar) {
    // Desmarca todas as outras e marca essa — transação atômica
    await prisma.$transaction([
      prisma.cursoTurma.updateMany({
        where: { proximoCurso: true, id: { not: turmaId } },
        data: { proximoCurso: false },
      }),
      prisma.cursoTurma.update({
        where: { id: turmaId },
        data: { proximoCurso: true },
      }),
    ]);
  } else {
    await prisma.cursoTurma.update({
      where: { id: turmaId },
      data: { proximoCurso: false },
    });
  }

  return NextResponse.json({ ok: true, turma: turma.nome, marcar });
}
