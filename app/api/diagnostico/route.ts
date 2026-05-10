export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { buildDiagnostico } from "@/lib/diagnostico-scoring";

/**
 * GET /api/diagnostico
 *
 * Consolidador do Diagnóstico de Privacidade (Checkpoint 10).
 * Puxa dados de TODOS os checkpoints (Inventário + Bases Legais +
 * Riscos + GAP) e devolve scores agregados + recomendações
 * priorizadas.
 *
 * Acesso: apenas DPO. Resposta sempre "ao vivo" (force-dynamic).
 */
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, companyId: true },
  });
  if (!user?.companyId) {
    return NextResponse.json(
      { error: "Empresa não encontrada" },
      { status: 404 },
    );
  }
  if (!isDPO(user.role)) {
    return NextResponse.json(
      { error: "Apenas DPO acessa o Diagnóstico de Privacidade" },
      { status: 403 },
    );
  }

  // 3 queries em paralelo: inventário (com bases), riscos, respostas GAP
  const [inventories, risks, gapAnswers] = await Promise.all([
    prisma.dataInventory.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        serviceName: true,
        setor: true,
        status: true,
        dataCategory: true,
        legalBasis: true,
        legalBasisSensitive: true,
        legalBasisComments: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.processRisk.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        dataInventoryId: true,
        riskCode: true,
        status: true,
        severityLevel: true,
        mitigationPlan: true,
      },
    }),
    prisma.gapAnswer.findMany({
      where: { companyId: user.companyId },
      select: {
        controlCode: true,
        aderencia: true,
        mapeamento: true,
        pontoMelhoria: true,
      },
    }),
  ]);

  const approvedCount = inventories.filter((i) => i.status === "APROVADO").length;
  const inventoryNameById: Record<string, string> = {};
  for (const i of inventories) inventoryNameById[i.id] = i.serviceName;

  const out = buildDiagnostico({
    inventories,
    risks,
    gapAnswers,
    approvedCount,
    inventoryNameById,
  });

  return NextResponse.json(out);
}
