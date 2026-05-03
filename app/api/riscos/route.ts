import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";

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
        select: { riskCode: true, status: true, autoSuggested: true },
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

  return NextResponse.json({
    items,
    stats: {
      totalProcesses,
      analyzedCount,
      pendingCount: totalProcesses - analyzedCount,
      totalRisks,
      byCode,
    },
  });
}
