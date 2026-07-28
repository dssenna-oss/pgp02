// GET /api/pacote/zip — baixa TODOS os 21 documentos preenchidos num ZIP.
// Cada arquivo usa o estado atual (perfil + respostas salvas); campos em
// aberto saem [ENTRE COLCHETES] em vermelho, como no download individual.

import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { requireInstituicao } from "@/lib/auth-server";
import { MODELOS_PACOTE } from "@/lib/modelos-pacote";
import { montarDocumentoPreenchido } from "@/lib/preencher";
import { gerarDocxDocumento } from "@/lib/docx-documento";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // 21 documentos num request só

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET(_req: NextRequest) {
  let instituicaoId: string;
  try {
    ({ instituicaoId } = await requireInstituicao());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }

  const inst = await prisma.instituicao.findUnique({ where: { id: instituicaoId } });
  if (!inst) return NextResponse.json({ error: "Instituição não encontrada" }, { status: 404 });

  const registros = await prisma.documentoResposta.findMany({
    where: { instituicaoId },
    select: { numeroModelo: true, respostas: true },
  });
  const respostasPorModelo = new Map(
    registros.map((r) => [r.numeroModelo, r.respostas as Record<string, string>]),
  );

  const zip = new JSZip();
  for (const modelo of MODELOS_PACOTE) {
    const { md } = montarDocumentoPreenchido(
      modelo,
      inst,
      respostasPorModelo.get(modelo.numero) ?? {},
    );
    const buffer = await gerarDocxDocumento({
      tituloModelo: modelo.titulo,
      numeroModelo: modelo.numero,
      instituicaoNome: inst.nome,
      mdPreenchido: md,
    });
    zip.file(
      `Modelo-${String(modelo.numero).padStart(2, "0")}-${modelo.slug}.docx`,
      buffer,
    );
  }

  const conteudo = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return new NextResponse(new Uint8Array(conteudo), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="Jornada-LGPD-${slugify(inst.nome)}.zip"`,
    },
  });
}
