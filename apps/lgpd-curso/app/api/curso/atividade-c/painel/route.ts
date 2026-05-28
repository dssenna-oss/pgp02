// GET /api/curso/atividade-c/painel?turmaId=X&atividadeId=Y
//
// Modalidade C — Onda 2. Resultado AGREGADO de uma atividade numa turma, pro
// painel do facilitador e pro cartaz (telão). Admin only.
//   - agregado: visão da turma inteira (lib/atividades-c.ts → agregarAtividade)
//   - porGrupo: quantos de cada grupo já responderam (pra o facilitador cobrar)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { ensureTabelaAtividadesC } from "@/lib/colunas-atividades-c";
import { getAtividadeC, agregarAtividade } from "@/lib/atividades-c";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const turmaId = req.nextUrl.searchParams.get("turmaId");
  const atividadeId = req.nextUrl.searchParams.get("atividadeId");
  if (!turmaId || !atividadeId) {
    return NextResponse.json({ error: "turmaId e atividadeId obrigatórios" }, { status: 400 });
  }
  const at = getAtividadeC(atividadeId);
  if (!at) return NextResponse.json({ error: "Atividade não encontrada" }, { status: 404 });

  try {
    await ensureTabelaAtividadesC();

    const [respostas, grupos] = await Promise.all([
      prisma.cursoAtividadeResposta.findMany({
        where: { turmaId, atividadeId },
        select: { resposta: true, companyId: true },
      }),
      prisma.cursoGrupo.findMany({
        where: { turmaId },
        select: { companyId: true, numero: true, orgao: true },
        orderBy: { numero: "asc" },
      }),
    ]);

    const agregado = agregarAtividade(at, respostas);

    const contagem: Record<string, number> = {};
    for (const r of respostas) contagem[r.companyId] = (contagem[r.companyId] || 0) + 1;
    const porGrupo = grupos.map((g) => ({
      numero: g.numero,
      orgao: g.orgao,
      respondentes: contagem[g.companyId] || 0,
    }));

    return NextResponse.json({
      atividade: {
        id: at.id,
        titulo: at.titulo,
        fase: at.fase,
        emoji: at.emoji,
        tipo: at.tipo,
        modo: at.tipo === "opcoes" ? at.modo : undefined,
        contexto: at.contexto,
      },
      agregado,
      porGrupo,
      geradoEm: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[atividade-c/painel]", e);
    return NextResponse.json({ error: e.message || "Erro" }, { status: 500 });
  }
}
