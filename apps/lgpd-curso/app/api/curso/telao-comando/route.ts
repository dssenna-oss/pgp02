// Telão Comandado (Modalidade C).
//
// POST /api/curso/telao-comando { turmaId, comando }
//   Seta o comando atual do telão da turma. comando ∈
//   "placar" | "quiz" | "quiz-resultado" | "atividade:<id>" (id inclui "termometro") | null.
//   Admin-only — só o facilitador comanda, pelo Painel de Condução.
//
// GET /api/curso/telao-comando?turmaId=<id>
//   Lê o comando atual. A página /telao-vivo/<slug> faz polling deste GET
//   (~3s) e troca o conteúdo do telão sozinha (sem websocket — padrão Vercel).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { ensureColunaTelaoComando } from "@/lib/coluna-telao-comando";

export const dynamic = "force-dynamic";

// Comandos aceitos. Atividade aceita qualquer id (validado pelo telão na hora
// de renderizar) no formato "atividade:<id>".
function comandoValido(c: unknown): c is string | null {
  if (c === null) return true;
  if (typeof c !== "string") return false;
  return c === "placar" || c === "quiz" || c === "quiz-resultado" || c.startsWith("atividade:");
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const body = (await req.json()) as { turmaId?: string; comando?: string | null };
  if (!body.turmaId || !comandoValido(body.comando)) {
    return NextResponse.json(
      { error: "turmaId e comando (placar|quiz|quiz-resultado|atividade:<id>|null) obrigatórios" },
      { status: 400 },
    );
  }

  await ensureColunaTelaoComando();
  await prisma.cursoTurma.update({
    where: { id: body.turmaId },
    data: { telaoComando: body.comando ?? null },
  });

  return NextResponse.json({ ok: true, comando: body.comando ?? null });
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const turmaId = req.nextUrl.searchParams.get("turmaId");
  if (!turmaId) {
    return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });
  }

  await ensureColunaTelaoComando();
  const turma = await prisma.cursoTurma.findUnique({
    where: { id: turmaId },
    select: { telaoComando: true },
  });

  return NextResponse.json({ comando: turma?.telaoComando ?? null });
}
