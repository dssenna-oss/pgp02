// POST /api/curso/reset-turma { turmaId }
// Deleta a turma específica + cascata (CursoGrupo → Company → users/inventários/etc).
// Não afeta outras turmas.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

// Cascata pode deletar dezenas de registros. Folga pra Neon dormindo.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const { turmaId } = await req.json();
  if (!turmaId) return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });

  const turma = await prisma.cursoTurma.findUnique({
    where: { id: turmaId },
    include: { grupos: true },
  });
  if (!turma) return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });

  // Para cada grupo, deletar a Company associada (cascata cuida do resto)
  for (const g of turma.grupos) {
    await prisma.company.delete({ where: { id: g.companyId } });
  }
  // Deletar a turma
  await prisma.cursoTurma.delete({ where: { id: turmaId } });

  return NextResponse.json({ ok: true });
}
