
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

    const ripds = await prisma.rIPD.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(ripds);
  } catch (error) {
    console.error("Erro ao buscar RIPDs:", error);
    return NextResponse.json(
      { error: "Erro ao buscar RIPDs" },
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

    const ripd = await prisma.rIPD.create({
      data: {
        companyId: user.companyId,
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

    return NextResponse.json(ripd, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar RIPD:", error);
    return NextResponse.json(
      { error: "Erro ao criar RIPD" },
      { status: 500 }
    );
  }
}
