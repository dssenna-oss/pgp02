
import { NextRequest, NextResponse } from "next/server";
import { ensureUserHasCompany } from "@/lib/ensure-company";
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

    const actionPlans = await prisma.actionPlan.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(actionPlans);
  } catch (error) {
    console.error("Erro ao buscar planos de ação:", error);
    return NextResponse.json(
      { error: "Erro ao buscar planos de ação" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const actionPlan = await prisma.actionPlan.create({
      data: {
        companyId: user.companyId,
        action: body.action,
        description: body.description,
        objective: body.objective,
        responsibleArea: body.responsibleArea,
        responsible: body.responsible,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        priority: body.priority,
        status: body.status || "Não Iniciado",
        progress: body.progress || 0,
        resources: body.resources || "",
        budget: body.budget ? parseFloat(body.budget) : null,
      },
    });

    return NextResponse.json(actionPlan, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar plano de ação:", error);
    return NextResponse.json(
      { error: "Erro ao criar plano de ação" },
      { status: 500 }
    );
  }
}
