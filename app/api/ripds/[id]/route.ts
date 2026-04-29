
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

    const ripd = await prisma.rIPD.update({
      where: { id: params.id },
      data: {
        processName: body.processName,
        processDescription: body.processDescription,
        dataTypes: body.dataTypes,
        dataSubjects: body.dataSubjects,
        purpose: body.purpose,
        legalBasis: body.legalBasis,
        necessityAssessment: body.necessityAssessment,
        proportionalityAssessment: body.proportionalityAssessment,
        riskIdentification: body.riskIdentification,
        riskMitigation: body.riskMitigation,
        safeguards: body.safeguards,
        consultationDetails: body.consultationDetails || "",
        monitoring: body.monitoring,
      },
    });

    return NextResponse.json(ripd);
  } catch (error) {
    console.error("Erro ao atualizar RIPD:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar RIPD" },
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

    await prisma.rIPD.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir RIPD:", error);
    return NextResponse.json(
      { error: "Erro ao excluir RIPD" },
      { status: 500 }
    );
  }
}
