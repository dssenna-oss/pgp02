// GET /api/curso/painel-facilitador?turmaId=X
// Retorna estado ao vivo dos grupos da turma (KPIs + score + timeline + SOS).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { calcularMaturidade, KpisGrupo } from "@/lib/maturidade";
import { montarTimeline } from "@/lib/timeline";

// Endpoint chamado em loop (3s) pelo painel — primeira chamada pós-suspend
// pode esperar 10-20s o Neon acordar + retry do Prisma. Folga generosa.
export const maxDuration = 30;

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

  const pacoteGapCustomizado = (turma.gapPacote?.length || 0) > 0;

  const grupoIds = turma.grupos.map((g) => g.id);

  // SOS ativos (PENDING + ATTENDED) — todos da turma em 1 query
  const sosAtivosRaw = grupoIds.length
    ? await prisma.assistanceRequest.findMany({
        where: { grupoId: { in: grupoIds }, status: { in: ["PENDING", "ATTENDED"] } },
        orderBy: { createdAt: "asc" },
      }).catch(() => [] as any[]) // se tabela ainda não migrou, não quebra
    : [];

  const sosPorGrupo = new Map<string, typeof sosAtivosRaw>();
  for (const s of sosAtivosRaw) {
    const arr = sosPorGrupo.get(s.grupoId) || [];
    arr.push(s);
    sosPorGrupo.set(s.grupoId, arr);
  }

  // Tentativas de pular fase (PENDING) — DPO clicou em ação de Fase 5/6/7
  // sem fechar GAP. Facilitador é alertado pra reforçar a sequência.
  const skipsAtivosRaw = grupoIds.length
    ? await prisma.phaseSkipAttempt.findMany({
        where: { grupoId: { in: grupoIds }, status: "PENDING" },
        orderBy: { createdAt: "asc" },
      }).catch(() => [] as any[])
    : [];

  const skipsPorGrupo = new Map<string, typeof skipsAtivosRaw>();
  for (const s of skipsAtivosRaw) {
    const arr = skipsPorGrupo.get(s.grupoId) || [];
    arr.push(s);
    skipsPorGrupo.set(s.grupoId, arr);
  }

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
        select: { status: true, createdAt: true, updatedAt: true },
      }),
      prisma.processRisk.findMany({
        where: { companyId: cid },
        select: { status: true, createdAt: true, updatedAt: true },
      }),
      prisma.gapAnswer.findMany({
        where: { companyId: cid },
        select: { resposta: true, createdAt: true, updatedAt: true },
      }),
      prisma.ripd.findMany({
        where: { companyId: cid },
        select: { status: true, createdAt: true, updatedAt: true },
      }),
      prisma.operator.findMany({
        where: { companyId: cid },
        include: { contracts: { select: { clausulasLgpd: true } } },
      }),
      prisma.dsrRequest.findMany({
        where: { companyId: cid },
        select: { createdAt: true, updatedAt: true },
      }),
      prisma.policy.findFirst({
        where: { companyId: cid, slug: "aviso-privacidade" },
        select: { status: true, publicSlug: true, createdAt: true, updatedAt: true },
      }),
      prisma.incident.findMany({
        where: { companyId: cid },
        select: { comunicadoAnpd: true, comunicadoTitular: true, createdAt: true, updatedAt: true, status: true },
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
      riscos: {
        total: riscos.length,
        aprovados: riscos.filter((r) => r.status === "APROVADO").length,
        submetidos: riscos.filter((r) => r.status === "SUBMETIDO").length,
      },
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
      dsr: { total: dsr.length },
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

    // Timeline das 7 missões + tempos
    const timeline = montarTimeline({
      inventarios: invList,
      riscos,
      gapAnswers: gap,
      ripds,
      operadores: operadores.map((o) => ({ createdAt: o.createdAt, updatedAt: o.updatedAt })),
      dsrs: dsr,
      aviso: aviso ? { status: aviso.status, createdAt: aviso.createdAt, updatedAt: aviso.updatedAt } : null,
      incidentes,
    });

    // SOS deste grupo (pendentes/atendidos)
    const sos = (sosPorGrupo.get(grupo.id) || []).map((s) => ({
      id: s.id,
      status: s.status,
      requestedByName: s.requestedByName,
      createdAt: s.createdAt.toISOString(),
      attendedAt: s.attendedAt ? s.attendedAt.toISOString() : null,
    }));

    // Tentativas de pular fase ativas
    const phaseSkips = (skipsPorGrupo.get(grupo.id) || []).map((s) => ({
      id: s.id,
      faseTentada: s.faseTentada,
      acaoTentada: s.acaoTentada,
      requestedByName: s.requestedByName,
      createdAt: s.createdAt.toISOString(),
    }));

    result.push({
      grupoId: grupo.id,
      numero: grupo.numero,
      orgao: grupo.orgao,
      companyName: grupo.company.name,
      kpis,
      score: calcularMaturidade(kpis),
      ultimaAtividade,
      timeline,
      sos,
      phaseSkips,
    });
  }

  return NextResponse.json({
    turma: {
      id: turma.id,
      nome: turma.nome,
      cidade: turma.cidade,
      pacoteGapCustomizado,
      pacoteGapTamanho: pacoteGapCustomizado ? turma.gapPacote.length : 10,
    },
    grupos: result,
    geradoEm: new Date().toISOString(),
  });
}
