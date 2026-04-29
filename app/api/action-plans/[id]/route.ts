
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    const actionPlan = await prisma.actionPlan.update({
      where: { id: params.id },
      data: {
        action: body.action,
        description: body.description,
        objective: body.objective,
        responsibleArea: body.responsibleArea,
        responsible: body.responsible,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        priority: body.priority,
        status: body.status,
        progress: body.progress,
        resources: body.resources || "",
        budget: body.budget ? parseFloat(body.budget) : null,
      },
    });

    return NextResponse.json(actionPlan);
  } catch (error) {
    console.error("Erro ao atualizar plano de ação:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar plano de ação" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await prisma.actionPlan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir plano de ação:", error);
    return NextResponse.json(
      { error: "Erro ao excluir plano de ação" },
      { status: 500 }
    );
  }
}
