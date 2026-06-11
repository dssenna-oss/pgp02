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
    select: { userId: true, momento: true, score: true, scorePessoal: true },
  });

  // Agrupa por participante pra calcular os saltos (fim − início) de quem fez os dois.
  type Par = { inicioInst?: number; fimInst?: number; inicioPess?: number; fimPess?: number };
  const porUser = new Map<string, Par>();
  for (const r of respostas) {
    const slot = porUser.get(r.userId) ?? {};
    if (r.momento === "INICIO") {
      slot.inicioInst = r.score;
      slot.inicioPess = r.scorePessoal;
    } else if (r.momento === "FIM") {
      slot.fimInst = r.score;
      slot.fimPess = r.scorePessoal;
    }
    porUser.set(r.userId, slot);
  }

  const inst = { scoresInicio: [] as number[], scoresFim: [] as number[], saltos: [] as number[] };
  const pess = { scoresInicio: [] as number[], scoresFim: [] as number[], saltos: [] as number[] };
  let preenchidosInicio = 0;
  let preenchidosFim = 0;
  let comAmbos = 0;
  for (const p of porUser.values()) {
    const temInicio = typeof p.inicioInst === "number";
    const temFim = typeof p.fimInst === "number";
    if (temInicio) {
      preenchidosInicio++;
      inst.scoresInicio.push(p.inicioInst!);
      pess.scoresInicio.push(p.inicioPess ?? 0);
    }
    if (temFim) {
      preenchidosFim++;
      inst.scoresFim.push(p.fimInst!);
      pess.scoresFim.push(p.fimPess ?? 0);
    }
    if (temInicio && temFim) {
      comAmbos++;
      inst.saltos.push(p.fimInst! - p.inicioInst!);
      pess.saltos.push((p.fimPess ?? 0) - (p.inicioPess ?? 0));
    }
  }

  const turmaTermometro = montarTurmaTermometro({
    totalParticipantes,
    preenchidosInicio,
    preenchidosFim,
    comAmbos,
    pessoal: pess,
    instituicao: inst,
  });

  return NextResponse.json(turmaTermometro);
}
