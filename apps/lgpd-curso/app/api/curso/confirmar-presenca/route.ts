// POST /api/curso/confirmar-presenca
// Rota pública usada pela página /confirmar/[turmaId] — o inscrito informa
// o e-mail e fica marcado como presença confirmada. Sem auth: o link é
// distribuído por e-mail aos inscritos.
//
// Body: { turmaId, email }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureColunasControleTurma } from "@/lib/colunas-controle-turma";
import { normalizarParticipantes } from "@/lib/participantes-turma";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const turmaId = String(body.turmaId || "");
  const email = String(body.email || "").trim().toLowerCase();
  if (!turmaId) return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "Informe seu e-mail." }, { status: 400 });

  await ensureColunasControleTurma();

  const turma = await prisma.cursoTurma.findUnique({
    where: { id: turmaId },
    select: { id: true, nome: true, participantes: true },
  });
  if (!turma) return NextResponse.json({ error: "Turma não encontrada." }, { status: 404 });

  const participantes = normalizarParticipantes(turma.participantes);
  const idx = participantes.findIndex((p) => p.email === email);
  if (idx === -1) {
    return NextResponse.json(
      {
        error:
          "Este e-mail não está na lista de inscritos desta turma. Confira se digitou corretamente ou fale com o facilitador.",
      },
      { status: 404 },
    );
  }

  const jaConfirmado = participantes[idx].confirmado;
  if (!jaConfirmado) {
    participantes[idx] = {
      ...participantes[idx],
      confirmado: true,
      confirmadoEm: new Date().toISOString(),
    };
    await prisma.cursoTurma.update({
      where: { id: turmaId },
      data: { participantes: participantes as any },
    });
  }

  return NextResponse.json({ ok: true, jaConfirmado, turma: turma.nome });
}
