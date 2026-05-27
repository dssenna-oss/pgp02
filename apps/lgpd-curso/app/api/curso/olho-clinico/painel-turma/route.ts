// GET /api/curso/olho-clinico/painel-turma?turmaSlug=X
//
// Agrega resultados do quiz "Caça às Pegadinhas" de TODOS os grupos de uma turma.
// Usado pelo Telão (pódio do Olho Clínico) e pelo Painel do Facilitador.
// Admin-only.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { ensureColunaOlhoClinico } from "@/lib/coluna-olho-clinico";
import { PEGADINHAS_PROCESSOS } from "@/lib/processos-pegadinhas";
import { CATALOGO_ERROS_PLANTADOS } from "@/lib/aviso-erros-plantados";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const turmaSlug = req.nextUrl.searchParams.get("turmaSlug");
  if (!turmaSlug) {
    return NextResponse.json({ error: "turmaSlug obrigatório" }, { status: 400 });
  }

  await ensureColunaOlhoClinico();

  const turma = await prisma.cursoTurma.findFirst({
    where: { slug: turmaSlug },
    include: {
      grupos: {
        orderBy: [{ orgao: "asc" }, { numero: "asc" }],
        include: {
          company: {
            select: { id: true, name: true, olhoClinicoQuiz: true },
          },
        },
      },
    },
  });

  if (!turma) {
    return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
  }

  // Agrega resultados por grupo + por pegadinha
  const grupos = turma.grupos.map((g) => {
    const quiz = g.company.olhoClinicoQuiz as any;
    return {
      grupoId: g.id,
      numero: g.numero,
      orgao: g.orgao,
      companyName: g.company.name,
      finalizado: !!quiz?.finalizadoEm,
      score: typeof quiz?.score === "number" ? quiz.score : 0,
      total: typeof quiz?.total === "number" ? quiz.total : 8,
      finalizadoEm: quiz?.finalizadoEm || null,
      respostas: Array.isArray(quiz?.respostas) ? quiz.respostas : [],
    };
  });

  // Por pegadinha: quantos grupos detectaram corretamente
  const todasPegadinhas = [
    ...PEGADINHAS_PROCESSOS.map((p) => ({ id: p.id, tipo: "PROCESSO" as const, rotulo: p.rotuloCurto, orgao: p.orgao })),
    ...CATALOGO_ERROS_PLANTADOS.map((e) => ({ id: e.id, tipo: "AVISO" as const, rotulo: e.rotulo, orgao: null as null })),
  ];

  const porPegadinha = todasPegadinhas.map((p) => {
    let detectaram = 0;
    let naoDetectaram = 0;
    let naoSabem = 0;
    const gruposDetectaram: Array<{ grupoId: string; numero: number; orgao: string }> = [];
    for (const g of grupos) {
      if (!g.finalizado) continue;
      // Filtra por órgão se pegadinha é de processo
      if (p.tipo === "PROCESSO" && p.orgao && g.orgao !== p.orgao) continue;
      const resp = g.respostas.find((r: any) => r.pegadinhaId === p.id);
      if (!resp) continue;
      if (resp.detectou === "SIM") {
        detectaram++;
        gruposDetectaram.push({ grupoId: g.grupoId, numero: g.numero, orgao: g.orgao });
      } else if (resp.detectou === "NAO") naoDetectaram++;
      else if (resp.detectou === "NAO_SEI") naoSabem++;
    }
    return {
      pegadinhaId: p.id,
      tipo: p.tipo,
      rotulo: p.rotulo,
      orgao: p.orgao,
      detectaram,
      naoDetectaram,
      naoSabem,
      gruposDetectaram,
    };
  });

  // Ranking — só grupos que finalizaram
  const ranking = [...grupos]
    .filter((g) => g.finalizado)
    .sort((a, b) => b.score - a.score || a.numero - b.numero)
    .map((g, idx) => ({ ...g, posicao: idx + 1 }));

  return NextResponse.json({
    turma: { nome: turma.nome, slug: turma.slug, cidade: turma.cidade },
    grupos,
    porPegadinha,
    ranking,
  });
}
