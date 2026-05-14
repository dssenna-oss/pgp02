/**
 * Export DOCX da resposta institucional à Requisição de Direitos do Titular.
 *
 * GET /api/direitos-titulares/[id]/export-docx
 *   - DPO-only
 *   - Retorna application/vnd.openxmlformats-officedocument.wordprocessingml.document
 *   - Filename: "Resposta_<protocolo>.docx"
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { generateDsrResponseDocx } from "@/lib/dsr-docx";
import type { DsrStatus, DsrDecision } from "@/lib/data-subject-requests";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true, role: true },
    });
    if (!user?.companyId) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 },
      );
    }
    if (!isDPO(user.role)) {
      return NextResponse.json(
        { error: "Acesso restrito ao Encarregado e equipe (DPO)" },
        { status: 403 },
      );
    }

    const dsr = await prisma.dataSubjectRequest.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            companyName: true,
            tradeName: true,
            cnpj: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            dpoName: true,
            dpoEmail: true,
            dpoPhone: true,
          },
        },
        respondedByUser: { select: { name: true, email: true } },
      },
    });

    if (!dsr || dsr.companyId !== user.companyId) {
      return NextResponse.json(
        { error: "Requisição não encontrada" },
        { status: 404 },
      );
    }

    const company = dsr.company;
    const orgName = company.tradeName || company.companyName;
    const fullAddress = [
      company.address,
      company.city ? `${company.city}/${company.state || ""}` : null,
      company.zipCode ? `CEP ${company.zipCode}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const buffer = await generateDsrResponseDocx({
      orgName,
      orgCnpj: company.cnpj,
      orgAddress: fullAddress || null,
      dpoName: company.dpoName,
      dpoEmail: company.dpoEmail,
      dpoPhone: company.dpoPhone,
      protocolNumber: dsr.protocolNumber,
      createdAt: dsr.createdAt,
      dueDate: dsr.dueDate,
      status: dsr.status as DsrStatus,
      titularName: dsr.titularName,
      titularCpf: dsr.titularCpf,
      titularEmail: dsr.titularEmail,
      titularCategory: dsr.titularCategory,
      requestedRights: dsr.requestedRights,
      detailedRequest: dsr.detailedRequest,
      responseChannel: dsr.responseChannel,
      responseChannelOther: dsr.responseChannelOther,
      decision: (dsr.decision as DsrDecision | null) || null,
      responseText: dsr.responseText,
      responseActions: dsr.responseActions,
      responseDate: dsr.responseDate,
      responseChannelUsed: dsr.responseChannelUsed,
      respondedByName: dsr.respondedByUser?.name,
    });

    const filename = `Resposta_${dsr.protocolNumber}.docx`;
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar DOCX da resposta:", error);
    return NextResponse.json(
      { error: "Erro ao gerar arquivo DOCX" },
      { status: 500 },
    );
  }
}
