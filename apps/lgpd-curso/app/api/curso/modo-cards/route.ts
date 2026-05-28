// POST /api/curso/modo-cards { turmaId, ativo }
//
// Liga/desliga o Modo Cards (Modalidade C) de uma turma. Quando ligado, as
// fases de produção ficam em modo leitura pra todos os participantes (produção
// nos cards físicos). Admin-only — só o facilitador controla.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { ensureColunaModoCards } from "@/lib/coluna-modo-cards";

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

  await ensureColunaModoCards();
  await prisma.cursoTurma.update({
    where: { id: body.turmaId },
    data: { modoCards: body.ativo },
  });

  return NextResponse.json({ ok: true, modoCards: body.ativo });
}
