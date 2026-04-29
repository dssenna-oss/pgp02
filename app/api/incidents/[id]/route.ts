
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

    const incident = await prisma.incident.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        incidentType: body.incidentType,
        severity: body.severity,
        affectedData: body.affectedData,
        affectedSubjects: body.affectedSubjects ? parseInt(body.affectedSubjects) : null,
        cause: body.cause || "",
        detectionDate: new Date(body.detectionDate),
        containmentActions: body.containmentActions || "",
        correctiveActions: body.correctiveActions || "",
        preventiveActions: body.preventiveActions || "",
        status: body.status,
        reportedToAnpd: body.reportedToAnpd,
        anpdReportDate: body.anpdReportDate ? new Date(body.anpdReportDate) : null,
      },
    });

    return NextResponse.json(incident);
  } catch (error) {
    console.error("Erro ao atualizar incidente:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar incidente" },
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

    await prisma.incident.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir incidente:", error);
    return NextResponse.json(
      { error: "Erro ao excluir incidente" },
      { status: 500 }
    );
  }
}
