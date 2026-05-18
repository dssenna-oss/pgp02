// POST /api/curso/disparar-dsr { turmaId, orgao: "PM" | "CM" }
// Cria automaticamente 2 DsrRequest com disparoFacilitador=true em TODOS os
// grupos do órgão. Cada grupo recebe os 2 cenários do seu órgão.
// Idempotente por (grupo, titularNome+tipoSolicitacao): não duplica se
// o facilitador clicar 2x.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { CENARIOS_DSR } from "@/lib/dsr-game";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const { turmaId, orgao } = await req.json();
  if (!turmaId) return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });
  if (!["PM", "CM"].includes(orgao)) return NextResponse.json({ error: "orgao deve ser PM ou CM" }, { status: 400 });

  const cenariosOrgao = CENARIOS_DSR.filter((c) => c.orgao === orgao);
  if (cenariosOrgao.length === 0) {
    return NextResponse.json({ error: `Sem cenários cadastrados pro órgão ${orgao}` }, { status: 500 });
  }

  const grupos = await prisma.cursoGrupo.findMany({
    where: { turmaId, orgao },
    select: { companyId: true, numero: true },
  });
  if (grupos.length === 0) {
    return NextResponse.json({ error: `Nenhum grupo ${orgao} na turma` }, { status: 404 });
  }

  const criados: Array<{ grupo: number; cenario: string; dsrId: string; jaExistia: boolean }> = [];
  for (const g of grupos) {
    for (const c of cenariosOrgao) {
      // Idempotência: se já existe DSR disparado igual nesse grupo, pula
      const existente = await prisma.dsrRequest.findFirst({
        where: {
          companyId: g.companyId,
          disparoFacilitador: true,
          titularNome: c.titularNome,
          tipoSolicitacao: c.tipoSolicitacao,
        },
        select: { id: true },
      });
      if (existente) {
        criados.push({ grupo: g.numero, cenario: c.titularNome, dsrId: existente.id, jaExistia: true });
        continue;
      }
      const dsr = await prisma.dsrRequest.create({
        data: {
          companyId: g.companyId,
          titularNome: c.titularNome,
          titularContato: c.titularContato,
          tipoSolicitacao: c.tipoSolicitacao,
          descricao: c.descricao,
          status: "ABERTA",
          disparoFacilitador: true,
          gameAction: null,
        },
        select: { id: true },
      });
      criados.push({ grupo: g.numero, cenario: c.titularNome, dsrId: dsr.id, jaExistia: false });
    }
  }

  return NextResponse.json({
    ok: true,
    orgao,
    totalCenarios: cenariosOrgao.length,
    totalGrupos: grupos.length,
    dsrsCriados: criados,
    disparadoEm: new Date().toISOString(),
  });
}
