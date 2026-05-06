export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadCyberAuth,
  cyberAnswerToDTO,
  computeCyberScore,
} from "@/lib/cyber-helpers";
import { buildCyberXlsx } from "@/lib/cyber-xlsx-export";

/**
 * GET /api/cyber/export — devolve XLSX da Maturidade Cibernética.
 *
 * (Pra DOCX seguir o mesmo padrão de RIPD/LIA — não implementado nesta
 * fatia. XLSX cobre o caso institucional principal: enviar pra TI ou
 * auditoria com 80 controles tabelados.)
 */
export async function GET(_request: NextRequest) {
  const r = await loadCyberAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const [answers, company] = await Promise.all([
    prisma.cyberAnswer.findMany({
      where: { companyId: user.companyId },
      include: {
        delegatedTo: { select: { id: true, name: true, email: true } },
        answeredBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { controlCode: "asc" },
    }),
    prisma.company.findUnique({
      where: { id: user.companyId },
      select: { companyName: true },
    }),
  ]);

  const dtos = answers.map(cyberAnswerToDTO);
  const score = computeCyberScore(answers);

  const buffer = buildCyberXlsx({
    companyName: company?.companyName ?? "Organização",
    generatedAt: new Date(),
    answers: dtos,
    score,
  });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="MaturidadeCyber_NIST_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      "Content-Length": String(buffer.length),
    },
  });
}
