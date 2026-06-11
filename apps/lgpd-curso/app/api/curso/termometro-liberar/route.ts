// POST /api/curso/termometro-liberar { turmaId, liberado }
//
// Largada conjunta do Termômetro Institucional. liberado=false (estado
// inicial): quem abrir o Termômetro fica numa tela de espera; liberado=true:
// todos entram juntos (a tela do participante se atualiza sozinha via refresh).
// Admin-only — só o facilitador controla a largada.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { ensureColunaTermometroLiberado } from "@/lib/coluna-termometro-liberado";

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

  await ensureColunaTermometroLiberado();
  await prisma.cursoTurma.update({
    where: { id: body.turmaId },
    data: { termometroLiberado: body.liberado },
  });

  return NextResponse.json({ ok: true, termometroLiberado: body.liberado });
}
