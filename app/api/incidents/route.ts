
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

    const incidents = await prisma.incident.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error("Erro ao buscar incidentes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar incidentes" },
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

    const incident = await prisma.incident.create({
      data: {
        companyId: user.companyId,
        title: body.title,
        description: body.description,
        incidentType: body.incidentType,
        severity: body.severity,
        affectedData: body.affectedData,
        affectedSubjects: body.affectedSubjects ? parseInt(body.affectedSubjects) : null,
        cause: body.cause || "",
        detectionDate: new Date(body.detectionDate),
        reportDate: body.reportDate ? new Date(body.reportDate) : new Date(),
        containmentActions: body.containmentActions || "",
        correctiveActions: body.correctiveActions || "",
        preventiveActions: body.preventiveActions || "",
        status: body.status || "Aberto",
        reportedToAnpd: body.reportedToAnpd || false,
        anpdReportDate: body.anpdReportDate ? new Date(body.anpdReportDate) : null,
      },
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar incidente:", error);
    return NextResponse.json(
      { error: "Erro ao criar incidente" },
      { status: 500 }
    );
  }
}
