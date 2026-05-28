// GET /api/curso/planilha-pgp/xlsx
//
// Gera a Planilha do PGP — workbook Excel (.xlsx) com 13 abas interdependentes
// pra implementação da LGPD em Instituições Públicas. O participante preenche
// dados reais e a planilha calcula scores + conecta dados entre abas.
//
// 5ª peça da família institucional (após Caderno, Resumo, Cartilha, Pacote).
// Aberto a qualquer autenticado (facilitador OU participante) — pra levar
// pra Instituição. Personalização opcional: ?instituicao=X pré-preenche o Cadastro.

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-server";
import { gerarPlanilhaPGP } from "@/lib/planilha-pgp";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  try {
    await requireSession();
  } catch (e: any) {
    return new NextResponse(e.message, { status: 403 });
  }

  const instituicao = req.nextUrl.searchParams.get("instituicao") || undefined;
  const buffer = await gerarPlanilhaPGP({ nomeInstituicao: instituicao });

  const ab = buffer as ArrayBuffer;
  const slugInst = instituicao
    ? instituicao.replace(/[^a-zA-Z0-9]+/g, "_")
    : "Generica";
  const nomeArquivo = `Planilha_PGP_${slugInst}.xlsx`;
  return new NextResponse(ab, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
