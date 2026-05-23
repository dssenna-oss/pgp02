// GET /api/observador/painel?turmaSlug=X
// Endpoint PÚBLICO (sem auth) — visão consolidada da turma pros observadores
// acompanharem pelo celular. Versão SIMPLIFICADA do painel-facilitador:
//
// Inclui:
//   - Lista de grupos com timeline visual + status da missão atual
//   - Score parcial de cada grupo (maturidade)
//   - Última atividade
//   - Turma nome + cidade
//
// EXCLUI (intencionalmente — são pedagógicos pro facilitador, não pro observador):
//   - SOS, phaseSkips, erros plantados
//   - DSR game outros (textos livres dos DPOs)
//   - Detalhes de SOS/incidentes individuais

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularMaturidade, KpisGrupo } from "@/lib/maturidade";
import { montarTimeline } from "@/lib/timeline";

// Polling 5s do cliente; primeira chamada pós-suspend pode esperar Neon acordar.
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const turmaSlug = req.nextUrl.searchParams.get("turmaSlug");
    if (!turmaSlug) {
      return NextResponse.json({ error: "turmaSlug obrigatório" }, { status: 400 });
    }

    const turma = await prisma.cursoTurma.findFirst({
      where: { slug: turmaSlug },
      select: {
        id: true,
        nome: true,
        cidade: true,
        status: true,
        grupos: {
          orderBy: { numero: "asc" },
          include: { company: { select: { id: true, name: true, orgao: true } } },
        },
      },
    });
    if (!turma) {
      return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
    }
    if (turma.status !== "ATIVA") {
      return NextResponse.json({ error: "Turma encerrada" }, { status: 403 });
    }

    const result = [];
    for (const grupo of turma.grupos) {
      const cid = grupo.companyId;

      const [invList, riscos, gap, ripds, operadores, dsr, aviso, incidentes] = await Promise.all([
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
          select: { resposta: true, setorApoio: true, createdAt: true, updatedAt: true },
        }),
        prisma.ripd.findMany({
          where: { companyId: cid },
          select: { status: true, createdAt: true, updatedAt: true },
        }),
        prisma.operator.findMany({
          where: { companyId: cid },
          include: { contracts: { select: { clausulasLgpd: true, createdAt: true, updatedAt: true } } },
        }),
        prisma.dsrRequest.findMany({
          where: { companyId: cid },
          select: { id: true, createdAt: true, updatedAt: true },
        }),
        prisma.policy.findFirst({
          where: { companyId: cid, slug: "aviso-privacidade" },
          select: { status: true, publicSlug: true, createdAt: true, updatedAt: true, conteudoMd: true },
        }),
        prisma.incident.findMany({
          where: { companyId: cid },
          select: { comunicadoAnpd: true, comunicadoTitular: true, createdAt: true, updatedAt: true, status: true },
        }),
      ]);

      // KPIs simplificados — só o que o observador precisa pra entender o progresso
      const gapAderentes = gap.filter((g) => g.resposta === "ADERENTE").length;
      const gapParciais = gap.filter((g) => g.resposta === "PARCIAL").length;
      const gapNaoAderentes = gap.filter((g) => g.resposta === "NAO_ADERENTE").length;
      const gapAcoesPlanejadas = gap.filter((g) => g.resposta === "ACAO_PLANEJADA").length;
      const gapAvaliados = gapAderentes + gapParciais + gapNaoAderentes + gapAcoesPlanejadas;
      const gapScore = gapAvaliados > 0
        ? Math.round(((gapAderentes * 100 + gapParciais * 50) / (gapAvaliados * 100)) * 100)
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
          acoesPlanejadas: gapAcoesPlanejadas,
          apoiosPendentes: gap.filter((g) => g.resposta === "APOIO_PENDENTE").length,
          score: gapScore,
          setoresApoio: {},
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
          conteudoChars: aviso?.conteudoMd?.length || 0,
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

      const timeline = montarTimeline({
        inventarios: invList,
        riscos,
        gapAnswers: gap,
        ripds,
        operadores: operadores.map((o) => ({
          createdAt: o.createdAt,
          updatedAt: o.contracts?.[0]?.updatedAt ?? o.updatedAt,
        })),
        dsrs: dsr,
        aviso: aviso ? { status: aviso.status, createdAt: aviso.createdAt, updatedAt: aviso.updatedAt } : null,
        incidentes,
      });

      result.push({
        grupoId: grupo.id,
        numero: grupo.numero,
        orgao: grupo.orgao,
        companyName: grupo.company.name,
        score: calcularMaturidade(kpis),
        ultimaAtividade,
        timeline,
        // Resumo enxuto pro observador — sem detalhes pedagógicos sensíveis
        resumo: {
          inventario: `${kpis.inventario.aprovados}/${kpis.inventario.total} aprovado(s)`,
          riscos: `${kpis.riscos.aprovados}/${kpis.riscos.total} aprovado(s)`,
          gapScore: kpis.gap.score,
          gapRespondidos: kpis.gap.respondidos,
          ripds: kpis.ripds.aprovados,
          terceiros: kpis.terceiros.comClausula,
          dsr: kpis.dsr.total,
          avisoStatus: kpis.aviso.status,
          incidentes: kpis.incidentes.total,
        },
      });
    }

    return NextResponse.json({
      turma: { nome: turma.nome, cidade: turma.cidade },
      grupos: result,
      geradoEm: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[observador/painel]", e);
    return NextResponse.json({ error: e.message || "Erro" }, { status: 500 });
  }
}
