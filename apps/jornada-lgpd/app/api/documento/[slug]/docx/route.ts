// GET /api/documento/<slug>/docx — baixa o documento PREENCHIDO em Word.
// Usa o mesmo motor da pré-visualização (perfil + respostas salvas); campos
// em aberto saem [ENTRE COLCHETES] em vermelho no arquivo.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInstituicao } from "@/lib/auth-server";
import { getModeloPacote } from "@/lib/modelos-pacote";
import { montarDocumentoPreenchido } from "@/lib/preencher";
import { gerarDocxDocumento } from "@/lib/docx-documento";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  let instituicaoId: string;
  try {
    ({ instituicaoId } = await requireInstituicao());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }

  const modelo = getModeloPacote(params.slug);
  if (!modelo) return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });

  const inst = await prisma.instituicao.findUnique({ where: { id: instituicaoId } });
  if (!inst) return NextResponse.json({ error: "Instituição não encontrada" }, { status: 404 });

  const registro = await prisma.documentoResposta.findUnique({
    where: { instituicaoId_numeroModelo: { instituicaoId, numeroModelo: modelo.numero } },
  });
  const respostas = (registro?.respostas ?? {}) as Record<string, string>;

  const { md } = montarDocumentoPreenchido(modelo, inst, respostas);
  const buffer = await gerarDocxDocumento({
    tituloModelo: modelo.titulo,
    numeroModelo: modelo.numero,
    instituicaoNome: inst.nome,
    mdPreenchido: md,
  });

  const nomeArquivo = `Modelo-${String(modelo.numero).padStart(2, "0")}-${modelo.slug}.docx`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
