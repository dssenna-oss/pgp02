// GET /api/curso/painel-facilitador?turmaId=X
// Retorna estado ao vivo dos grupos da turma (KPIs + score).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { calcularMaturidade, KpisGrupo } from "@/lib/maturidade";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const turmaId = req.nextUrl.searchParams.get("turmaId");
  if (!turmaId) return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });

  const turma = await prisma.cursoTurma.findUnique({
    where: { id: turmaId },
    include: {
      grupos: {
        orderBy: { numero: "asc" },
        include: { company: { select: { id: true, name: true, orgao: true } } },
      },
    },
  });
  if (!turma) return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });

  const result = [];
  for (const grupo of turma.grupos) {
    const cid = grupo.companyId;

    const [
      invList,
      riscos,
      gap,
      ripds,
      operadores,
      dsr,
      aviso,
      incidentes,
    ] = await Promise.all([
      prisma.dataInventory.findMany({
        where: { companyId: cid },
        select: { status: true, updatedAt: true },
      }),
      prisma.processRisk.count({ where: { companyId: cid } }),
      prisma.gapAnswer.findMany({
        where: { companyId: cid },
        select: { resposta: true },
      }),
      prisma.ripd.findMany({
        where: { companyId: cid },
        select: { status: true, updatedAt: true },
      }),
      prisma.operator.findMany({
        where: { companyId: cid },
        include: { contracts: { select: { clausulasLgpd: true } } },
      }),
      prisma.dsrRequest.count({ where: { companyId: cid } }),
      prisma.policy.findFirst({
        where: { companyId: cid, slug: "aviso-privacidade" },
        select: { status: true, publicSlug: true, updatedAt: true },
      }),
      prisma.incident.findMany({
        where: { companyId: cid },
        select: { comunicadoAnpd: true, comunicadoTitular: true, updatedAt: true, status: true },
      }),
    ]);

    const gapAderentes = gap.filter((g) => g.resposta === "ADERENTE").length;
    const gapParciais = gap.filter((g) => g.resposta === "PARCIAL").length;
    const gapScore = gap.length > 0
      ? Math.round(((gapAderentes * 100 + gapParciais * 50) / 1000) * 100) // /1000 = (10 * 100)
      : 0;

    const kpis: KpisGrupo = {
      inventario: {
        total: invList.length,
        aprovados: invList.filter((i) => i.status === "APROVADO").length,
        submetidos: invList.filter((i) => i.status === "SUBMETIDO").length,
        devolvidos: invList.filter((i) => i.status === "DEVOLVIDO").length,
      },
      riscos: { total: riscos },
      gap: {
        respondidos: gap.length,
        aderentes: gapAderentes,
        parciais: gapParciais,
        score: gapScore,
      },
      ripds: {
        total: ripds.length,
        aprovados: ripds.filter((r) => r.status === "APROVADO").length,
      },
      terceiros: {
        total: operadores.length,
        comClausula: operadores.filter((o) => o.contracts?.[0]?.clausulasLgpd).length,
      },
      dsr: { total: dsr },
      aviso: {
        status: (aviso?.status as any) || null,
        publicSlug: aviso?.publicSlug || null,
      },
      incidentes: {
        total: incidentes.length,
        comunicadosAnpd: incidentes.filter((i) => i.comunicadoAnpd).length,
        comunicadosTitular: incidentes.filter((i) => i.comunicadoTitular).length,
      },
    };

    const ultimasAtividades = [
      ...invList.map((i) => i.updatedAt),
      ...ripds.map((r) => r.updatedAt),
      ...incidentes.map((i) => i.updatedAt),
      aviso?.updatedAt,
    ].filter(Boolean) as Date[];
    const ultimaAtividade = ultimasAtividades.length
      ? new Date(Math.max(...ultimasAtividades.map((d) => d.getTime())))
      : null;

    result.push({
      grupoId: grupo.id,
      numero: grupo.numero,
      orgao: grupo.orgao,
      companyName: grupo.company.name,
      kpis,
      score: calcularMaturidade(kpis),
      ultimaAtividade,
    });
  }

  return NextResponse.json({
    turma: { id: turma.id, nome: turma.nome, cidade: turma.cidade },
    grupos: result,
    geradoEm: new Date().toISOString(),
  });
}
