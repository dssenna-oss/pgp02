export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadCapacitacaoAuth,
  canManageCapacitacao,
  toCapacitacaoDTO,
  CAPACITACAO_FULL_INCLUDE,
} from "@/lib/capacitacao-helpers";
import { buildCapacitacaoDocx } from "@/lib/capacitacao-docx-export";

/**
 * GET /api/capacitacao/export-evidencia
 *
 * Gera DOCX consolidado com TODAS as capacitações da empresa, agrupadas
 * por eixo, com referência às evidências anexadas. Pra apresentar em
 * fiscalização da ANPD (Art. 52§1º VIII — atenuante de dosimetria).
 *
 * Acesso: DPO-only.
 */
export async function GET() {
  const r = await loadCapacitacaoAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  if (!canManageCapacitacao(user.role)) {
    return NextResponse.json(
      { error: "Apenas DPOs podem exportar relatório consolidado" },
      { status: 403 },
    );
  }

  const [events, company] = await Promise.all([
    prisma.capacitacaoEvento.findMany({
      where: { companyId: user.companyId },
      include: CAPACITACAO_FULL_INCLUDE,
      orderBy: [{ eixo: "asc" }, { scheduledAt: "asc" }, { createdAt: "asc" }],
    }),
    prisma.company.findUnique({
      where: { id: user.companyId },
      select: {
        companyName: true,
        cnpj: true,
        dpoName: true,
        dpoEmail: true,
      },
    }),
  ]);

  if (!company) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }

  const buffer = await buildCapacitacaoDocx({
    companyName: company.companyName,
    companyCnpj: company.cnpj,
    dpoName: company.dpoName,
    dpoEmail: company.dpoEmail,
    events: events.map(toCapacitacaoDTO),
    generatedAt: new Date(),
  });

  const fileName = `Capacitacao_LGPD_${company.companyName.replace(/[^\w]+/g, "_").slice(0, 60)}_${new Date().toISOString().slice(0, 10)}.docx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
