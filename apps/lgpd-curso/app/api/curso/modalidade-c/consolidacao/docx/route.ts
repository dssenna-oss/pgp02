// GET /api/curso/modalidade-c/consolidacao/docx?turmaId=X
//
// Modalidade C — Onda 3. Relatório de Consolidação (zero digitação): junta o
// resultado agregado de TODAS as atividades de celular (Onda 2) de uma turma e
// fecha com o guia do que levar/preencher na família de documentos.
//
// Admin-only (material de encerramento do facilitador).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { Packer } from "docx";
import { ensureTabelaAtividadesC } from "@/lib/colunas-atividades-c";
import { ATIVIDADES_C, agregarAtividade, type AgregadoAtividade } from "@/lib/atividades-c";
import { gerarRelatorioConsolidacao } from "@/lib/modalidade-c-consolidacao";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return new NextResponse(e.message, { status: 403 });
  }

  const turmaId = req.nextUrl.searchParams.get("turmaId");
  if (!turmaId) return new NextResponse("turmaId obrigatório", { status: 400 });

  try {
    await ensureTabelaAtividadesC();

    const [turma, respostas] = await Promise.all([
      prisma.cursoTurma.findUnique({
        where: { id: turmaId },
        select: { nome: true, cidade: true },
      }),
      prisma.cursoAtividadeResposta.findMany({
        where: { turmaId },
        select: { atividadeId: true, resposta: true },
      }),
    ]);
    if (!turma) return new NextResponse("Turma não encontrada", { status: 404 });

    // agrupa respostas por atividade e agrega cada uma
    const porAtividade: Record<string, { resposta: any }[]> = {};
    for (const r of respostas) {
      (porAtividade[r.atividadeId] ??= []).push({ resposta: r.resposta });
    }
    const agregados: Record<string, AgregadoAtividade> = {};
    for (const at of ATIVIDADES_C) {
      agregados[at.id] = agregarAtividade(at, porAtividade[at.id] ?? []);
    }

    const documento = gerarRelatorioConsolidacao({
      turma: { nome: turma.nome, cidade: turma.cidade },
      agregados,
    });

    const buffer = await Packer.toBuffer(documento);
    const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    const nomeArquivo = `Modalidade_C_Relatorio_Consolidacao_${turma.nome.replace(/[^a-zA-Z0-9]+/g, "_")}.docx`;
    return new NextResponse(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (e: any) {
    console.error("[modalidade-c/consolidacao]", e);
    return new NextResponse(e.message || "Erro", { status: 500 });
  }
}
