// POST /api/curso/atividade-c/submit { atividadeId, resposta }
//
// Modalidade C — Onda 2. Participante logado (crachá: papel + grupo) envia a
// resposta de uma atividade leve. Upsert por (userId, atividadeId): reenviar
// sobrescreve. Retorna o feedback individual (score/acertos/veredito/ordem).
// Admin (facilitador) não tem grupo — não participa.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { ensureTabelaAtividadesC } from "@/lib/colunas-atividades-c";
import { getAtividadeC, validarResposta, calcularFeedback } from "@/lib/atividades-c";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(req: NextRequest) {
  let session, companyId: string;
  try {
    ({ session, companyId } = await requireCompany());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
  if (session.user.role === "ADMIN") {
    return NextResponse.json({ error: "Facilitador não participa das atividades" }, { status: 400 });
  }
  // Atividade ao vivo é decisão de GRUPO (1 card/decisão por grupo): só o
  // Encarregado(a) registra pela equipe — evita N envios iguais e agiliza.
  // O crachá de DPO sempre tem role="DPO" (lib/seeds/processos-vegas.ts).
  if (session.user.role !== "DPO") {
    return NextResponse.json(
      { error: "Só o(a) Encarregado(a) do grupo registra as atividades. Combinem a resposta e o DPO envia." },
      { status: 403 },
    );
  }

  const body = (await req.json()) as { atividadeId?: string; resposta?: any };
  const at = body.atividadeId ? getAtividadeC(body.atividadeId) : undefined;
  if (!at) return NextResponse.json({ error: "Atividade não encontrada" }, { status: 404 });

  const limpa = validarResposta(at, body.resposta);
  if (!limpa) return NextResponse.json({ error: "Resposta inválida ou incompleta" }, { status: 400 });

  const grupo = await prisma.cursoGrupo.findUnique({
    where: { companyId },
    select: { turmaId: true },
  });
  if (!grupo) return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });

  await ensureTabelaAtividadesC();
  await prisma.cursoAtividadeResposta.upsert({
    where: { userId_atividadeId: { userId: session.user.id, atividadeId: at.id } },
    create: {
      turmaId: grupo.turmaId,
      companyId,
      userId: session.user.id,
      papel: session.user.papel ?? null,
      atividadeId: at.id,
      resposta: limpa as any,
    },
    update: { resposta: limpa as any },
  });

  return NextResponse.json({ ok: true, feedback: calcularFeedback(at, limpa) });
}
