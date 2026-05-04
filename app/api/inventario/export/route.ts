export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import {
  buildInventarioExportXLSX,
  suggestInventarioFilename,
  type InventarioExportProcess,
} from "@/lib/inventario-export";

/**
 * GET /api/inventario/export
 *
 * Exporta XLSX consolidado do Inventário (Checkpoint 8) com 3 abas
 * replicando o template oficial LGPD PRO:
 *   - INVENTÁRIO (84 colunas, 1 linha por processo APROVADO)
 *   - RISCOS (1 linha por ProcessRisk identificado)
 *   - TAB. VISÃO DE RISCOS (contagens por tipo × severidade)
 *
 * Acesso: apenas DPO. Só processos APROVADOS são incluídos.
 */
export async function GET(_request: NextRequest) {
  try {
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
        { status: 404 },
      );
    }
    if (!isDPO(user.role)) {
      return NextResponse.json(
        { error: "Apenas DPO pode exportar o Inventário" },
        { status: 403 },
      );
    }

    const [company, inventories] = await Promise.all([
      prisma.company.findUnique({
        where: { id: user.companyId },
        select: { companyName: true },
      }),
      prisma.dataInventory.findMany({
        where: { companyId: user.companyId, status: "APROVADO" },
        include: {
          createdBy: { select: { name: true, email: true } },
          processRisks: {
            select: {
              riskCode: true,
              status: true,
              description: true,
              severityLevel: true,
              mitigationPlan: true,
            },
          },
        },
        orderBy: { reviewedAt: "desc" },
      }),
    ]);

    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 },
      );
    }

    const processes: InventarioExportProcess[] = inventories.map((inv) => ({
      id: inv.id,
      serviceName: inv.serviceName,
      setor: inv.setor,
      dataCategory: inv.dataCategory,
      personalData: inv.personalData,
      legalBasis: inv.legalBasis,
      legalBasisSensitive: inv.legalBasisSensitive,
      legalBasisComments: inv.legalBasisComments,
      previsaoLegal: inv.previsaoLegal,
      purpose: inv.purpose,
      dataSubjects: inv.dataSubjects,
      retention: inv.retention,
      storage: inv.storage,
      sharing: inv.sharing,
      security: inv.security,
      formAnswers: inv.formAnswers as any,
      createdBy: inv.createdBy,
      reviewedAt: inv.reviewedAt,
      risks: inv.processRisks,
    }));

    const buf = buildInventarioExportXLSX({
      companyName: company.companyName,
      processes,
    });
    const filename = suggestInventarioFilename(company.companyName);

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[/api/inventario/export] erro:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 },
    );
  }
}
