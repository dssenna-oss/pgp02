// GET /api/curso/termometro/painel?turmaId=X
// Retorna os scores do Termômetro Institucional (início + fim) de cada grupo
// da turma. Usado pelo painel "Atividades ao vivo" e pelo cartaz de projeção.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { faixaQualitativa } from "@/lib/termometro-perguntas";
import { ensureColunasFasePreliminar } from "@/lib/coluna-fase-preliminar";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const turmaId = req.nextUrl.searchParams.get("turmaId");
  if (!turmaId) return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });

  // Garante que as colunas termometroInicio/Fim existem no banco antes de ler.
  await ensureColunasFasePreliminar();

  const turma = await prisma.cursoTurma.findUnique({
    where: { id: turmaId },
    include: {
      grupos: {
        orderBy: { numero: "asc" },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              orgao: true,
              termometroInicio: true,
              termometroFim: true,
            },
          },
        },
      },
    },
  });

  if (!turma) return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });

  const grupos = turma.grupos.map((g) => {
    const ini = g.company.termometroInicio as any;
    const fim = g.company.termometroFim as any;
    const scoreIni: number | null = ini?.score ?? null;
    const scoreFim: number | null = fim?.score ?? null;
    return {
      grupoId: g.id,
      numero: g.numero,
      orgao: g.company.orgao ?? "PM",
      nomeGrupo: g.company.name,
      inicio: scoreIni !== null ? { score: scoreIni, faixa: faixaQualitativa(scoreIni) } : null,
      fim: scoreFim !== null ? { score: scoreFim, faixa: faixaQualitativa(scoreFim) } : null,
    };
  });

  return NextResponse.json({
    grupos,
    preenchidos: grupos.filter((g) => g.inicio).length,
    concluidos: grupos.filter((g) => g.fim).length,
    total: grupos.length,
  });
}
