// POST /api/curso/forum-aberto { turmaId, ativo }
//
// Liga/desliga o Fórum da turma (suporte pós-curso). Quando ligado, o login do
// participante deixa de ser bloqueado pela data limite (acessoFim). Admin-only —
// só o facilitador controla.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { ensureColunaForumAberto } from "@/lib/coluna-forum-aberto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const body = (await req.json()) as { turmaId?: string; ativo?: boolean };
  if (!body.turmaId || typeof body.ativo !== "boolean") {
    return NextResponse.json({ error: "turmaId e ativo (boolean) obrigatórios" }, { status: 400 });
  }

  await ensureColunaForumAberto();
  await prisma.cursoTurma.update({
    where: { id: body.turmaId },
    data: { forumAberto: body.ativo },
  });

  return NextResponse.json({ ok: true, forumAberto: body.ativo });
}
