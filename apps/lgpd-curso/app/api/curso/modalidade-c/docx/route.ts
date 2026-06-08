// GET /api/curso/modalidade-c/docx?doc=roteiro|cards|colas
//
// Gera os 3 documentos imprimíveis da Modalidade C (híbrida) — Onda 1:
//   roteiro — Roteiro do Facilitador (15 momentos, 2 dias)
//   cards   — Kit de Cards (decks por fase + fichas de encaminhamento + crachás), cortável
//   colas   — Colas de Referência (bases legais, matriz P×I, priorização) pra mesa
//
// Admin-only (material de preparação do facilitador).

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { Packer } from "docx";
import {
  gerarRoteiroFacilitadorC,
  gerarKitCards,
  gerarColasReferencia,
  gerarGuiaDecisao,
} from "@/lib/modalidade-c-docx";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return new NextResponse(e.message, { status: 403 });
  }

  const doc = req.nextUrl.searchParams.get("doc");
  let documento;
  let nomeArquivo;
  if (doc === "cards") {
    documento = gerarKitCards();
    nomeArquivo = "Modalidade_C_Kit_de_Cards.docx";
  } else if (doc === "colas") {
    documento = gerarColasReferencia();
    nomeArquivo = "Modalidade_C_Colas_de_Referencia.docx";
  } else if (doc === "guia") {
    documento = gerarGuiaDecisao();
    nomeArquivo = "Guia_de_Decisao_de_Modalidade.docx";
  } else {
    // default: roteiro
    documento = gerarRoteiroFacilitadorC();
    nomeArquivo = "Modalidade_C_Roteiro_do_Facilitador.docx";
  }

  const buffer = await Packer.toBuffer(documento);
  const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  return new NextResponse(ab, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
