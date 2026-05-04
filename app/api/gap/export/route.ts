export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadGapDPO } from "@/lib/gap-helpers";
import { buildGapExportXLSX, suggestFilename } from "@/lib/gap-export";

/**
 * GET /api/gap/export
 *
 * Devolve o XLSX do GAP no estado ATUAL (todas as respostas vivas) —
 * decisão 10b. O arquivo é baseado no template oficial em branco
 * (`scripts/_gap-modelo-em-branco.xlsx`) com as colunas H-K da aba
 * Controles preenchidas + nome da org no Perfil.
 *
 * Acesso: apenas DPO.
 */
export async function GET(_request: NextRequest) {
  try {
    const r = await loadGapDPO();
    if ("error" in r) return r.error;
    const { user } = r;

    const [company, answers] = await Promise.all([
      prisma.company.findUnique({
        where: { id: user.companyId },
        select: { companyName: true },
      }),
      prisma.gapAnswer.findMany({
        where: { companyId: user.companyId },
        select: {
          controlCode: true,
          cenarioAtual: true,
          mapeamento: true,
          aderencia: true,
          pontoMelhoria: true,
        },
      }),
    ]);

    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 },
      );
    }

    const buf = buildGapExportXLSX({
      companyName: company.companyName,
      answers,
    });
    const filename = suggestFilename({ companyName: company.companyName });

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
    console.error("[/api/gap/export] erro:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 },
    );
  }
}
