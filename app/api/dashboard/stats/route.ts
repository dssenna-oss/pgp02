
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { company: true },
    });

    if (!user || !user.companyId) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Contar estatísticas específicas da empresa
    const [
      dataInventories,
      riskAssessments,
      gapAnalyses,
      actionPlans,
      documents,
      incidents
    ] = await Promise.all([
      prisma.dataInventory.count({ where: { companyId: user.companyId } }),
      prisma.riskAssessment.count({ where: { companyId: user.companyId } }),
      prisma.gapAnalysis.count({ where: { companyId: user.companyId } }),
      prisma.actionPlan.count({ where: { companyId: user.companyId } }),
      prisma.document.count({ where: { companyId: user.companyId } }),
      prisma.incident.count({ where: { companyId: user.companyId } })
    ]);

    return NextResponse.json({
      dataInventories,
      riskAssessments,
      gapAnalyses,
      actionPlans,
      documents,
      incidents
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
