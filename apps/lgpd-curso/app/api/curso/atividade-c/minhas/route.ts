// GET /api/curso/atividade-c/minhas
//
// Modalidade C — Onda 2. Retorna as respostas do PRÓPRIO participante (todas as
// atividades), pra o hub mostrar o que já foi feito e o runner pré-preencher.
// Mapa { [atividadeId]: resposta }.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureTabelaAtividadesC } from "@/lib/colunas-atividades-c";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ respostas: {} });

  await ensureTabelaAtividadesC();
  const linhas = await prisma.cursoAtividadeResposta.findMany({
    where: { userId: session.user.id },
    select: { atividadeId: true, resposta: true },
  });

  const respostas: Record<string, any> = {};
  for (const l of linhas) respostas[l.atividadeId] = l.resposta;
  return NextResponse.json({ respostas });
}
