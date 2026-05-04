import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { decodeSeverity } from "@/lib/riscos-catalog";

/**
 * GET /api/riscos
 *
 * Lista consolidada da Análise de Riscos (DPO-only): traz todos os
 * processos APROVADOS da organização com a contagem de riscos
 * identificados em cada um. Alimenta a tela `/dashboard/riscos`.
 */
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user?.companyId) {
    return NextResponse.json(
      { error: "Empresa não encontrada" },
      { status: 404 }
    );
  }
  if (!isDPO(user.role)) {
    return NextResponse.json(
      { error: "Apenas DPO acessa a Análise de Riscos" },
      { status: 403 }
    );
  }

  const processes = await prisma.dataInventory.findMany({
    where: { companyId: user.companyId, status: "APROVADO" },
    select: {
      id: true,
      serviceName: true,
      setor: true,
      legalReviewedAt: true,
      reviewedAt: true,
      createdBy: { select: { name: true, email: true } },
      processRisks: {
        select: {
          riskCode: true,
          status: true,
          autoSuggested: true,
          severityLevel: true,
        },
      },
    },
    orderBy: { reviewedAt: "desc" },
  });

  const items = processes.map((p) => {
    const total = p.processRisks.length;
    const byStatus = p.processRisks.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    // Severidades por processo (decodificadas do campo severityLevel
    // — a estrutura encoded é "P:M;I:A;S:ALTO" mas o consumidor só
    // precisa do nível final pra agregar)
    const bySeverity = { ALTO: 0, MEDIO: 0, BAIXO: 0, NONE: 0 };
    for (const r of p.processRisks) {
      const dec = decodeSeverity(r.severityLevel);
      const sev = dec?.severity;
      if (sev === "ALTO") bySeverity.ALTO += 1;
      else if (sev === "MEDIO") bySeverity.MEDIO += 1;
      else if (sev === "BAIXO") bySeverity.BAIXO += 1;
      else bySeverity.NONE += 1;
    }
    return {
      id: p.id,
      serviceName: p.serviceName,
      setor: p.setor,
      legalReviewedAt: p.legalReviewedAt,
      approvedAt: p.reviewedAt,
      createdBy: p.createdBy,
      totalRisks: total,
      analyzed: total > 0,
      byStatus,
      bySeverity,
      codes: p.processRisks.map((r) => r.riskCode),
    };
  });

  // Estatísticas agregadas
  const totalProcesses = items.length;
  const analyzedCount = items.filter((i) => i.analyzed).length;
  const totalRisks = items.reduce((acc, i) => acc + i.totalRisks, 0);

  // Contagem por código
  const byCode: Record<string, number> = {};
  for (const item of items) {
    for (const c of item.codes) {
      byCode[c] = (byCode[c] ?? 0) + 1;
    }
  }

  // Contagem agregada por severidade (todos os processos somados)
  const bySeverity = { ALTO: 0, MEDIO: 0, BAIXO: 0, NONE: 0 };
  for (const item of items) {
    bySeverity.ALTO += item.bySeverity.ALTO;
    bySeverity.MEDIO += item.bySeverity.MEDIO;
    bySeverity.BAIXO += item.bySeverity.BAIXO;
    bySeverity.NONE += item.bySeverity.NONE;
  }

  return NextResponse.json({
    items,
    stats: {
      totalProcesses,
      analyzedCount,
      pendingCount: totalProcesses - analyzedCount,
      totalRisks,
      byCode,
      bySeverity,
    },
  });
}
