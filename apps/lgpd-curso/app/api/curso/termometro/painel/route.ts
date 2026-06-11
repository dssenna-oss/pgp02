// GET /api/curso/termometro/painel?turmaId=X
// Panorama ANÔNIMO do Termômetro Institucional da turma. O Termômetro é
// INDIVIDUAL (cada participante avalia o próprio órgão real), então o
// facilitador vê só o agregado — distribuição por faixa, médias e salto médio
// (início × fim) — nunca nome-a-nome. Usado no painel "Atividades ao vivo",
// no cartaz de projeção e no Painel de Condução.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { montarTurmaTermometro } from "@/lib/termometro-perguntas";
import { ensureTabelaTermometro } from "@/lib/colunas-termometro";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const turmaId = req.nextUrl.searchParams.get("turmaId");
  if (!turmaId) return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });

  await ensureTabelaTermometro();

  const turma = await prisma.cursoTurma.findUnique({
    where: { id: turmaId },
    include: { grupos: { select: { companyId: true } } },
  });
  if (!turma) return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });

  const companyIds = turma.grupos.map((g) => g.companyId).filter(Boolean);

  // Quantos participantes a turma tem (denominador do "X de Y preencheram").
  const totalParticipantes = companyIds.length
    ? await prisma.user.count({ where: { companyId: { in: companyIds } } })
    : 0;

  // Todas as respostas da turma em 1 query (turmaId desnormalizado, indexado).
  const respostas = await prisma.termometroResposta.findMany({
    where: { turmaId },
    select: { userId: true, momento: true, score: true },
  });

  // Agrupa por participante pra calcular o salto (fim − início) de quem fez os dois.
  const porUser = new Map<string, { inicio?: number; fim?: number }>();
  for (const r of respostas) {
    const slot = porUser.get(r.userId) ?? {};
    if (r.momento === "INICIO") slot.inicio = r.score;
    else if (r.momento === "FIM") slot.fim = r.score;
    porUser.set(r.userId, slot);
  }

  const scoresInicio: number[] = [];
  const scoresFim: number[] = [];
  const saltos: number[] = [];
  for (const { inicio, fim } of porUser.values()) {
    if (typeof inicio === "number") scoresInicio.push(inicio);
    if (typeof fim === "number") scoresFim.push(fim);
    if (typeof inicio === "number" && typeof fim === "number") saltos.push(fim - inicio);
  }

  const turmaTermometro = montarTurmaTermometro({
    totalParticipantes,
    scoresInicio,
    scoresFim,
    saltos,
  });

  return NextResponse.json(turmaTermometro);
}
