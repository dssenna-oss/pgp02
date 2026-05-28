// GET /api/curso/pacote-modelos/docx
//
// Gera o Pacote de Modelos do PGP — DOCX único com 20 templates editáveis
// pra implementação da LGPD em Instituições Públicas. Diferente da Cartilha
// (que é guia descritivo), os modelos têm placeholders [NOME DA INSTITUIÇÃO]
// destacados em vermelho + caixa amarela "Exemplo preenchido" ao lado.
//
// Aberto a qualquer autenticado (facilitador OU participante) — pra o
// participante levar pra Instituição depois do curso.
//
// Personalização opcional: ?instituicao=X pra ser exibida na capa.

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-server";
import { Document, Packer } from "docx";
import { gerarPacoteModelos, type PacoteOpts } from "@/lib/pacote-modelos";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    await requireSession();
  } catch (e: any) {
    return new NextResponse(e.message, { status: 403 });
  }

  const instituicao = req.nextUrl.searchParams.get("instituicao") || undefined;
  const opts: PacoteOpts = { nomeInstituicao: instituicao };
  const children = gerarPacoteModelos(opts);

  const doc = new Document({
    creator: "PGP Treinamento — Curso prático de LGPD",
    title: instituicao
      ? `Pacote de Modelos do PGP — ${instituicao}`
      : "Pacote de Modelos do PGP — Templates pra Instituições Públicas",
    description:
      "20 templates editáveis pra implementação da LGPD em Instituições Públicas — Programa de Governança em Privacidade.",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
        heading1: {
          run: { font: "Calibri", size: 36, bold: true, color: "0F766E" },
          paragraph: { spacing: { before: 480, after: 240 } },
        },
        heading2: {
          run: { font: "Calibri", size: 26, bold: true, color: "0D9488" },
          paragraph: { spacing: { before: 280, after: 140 } },
        },
        heading3: {
          run: { font: "Calibri", size: 22, bold: true, color: "0F172A" },
          paragraph: { spacing: { before: 200, after: 100 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { orientation: "portrait" },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const ab = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
  const slugInst = instituicao
    ? instituicao.replace(/[^a-zA-Z0-9]+/g, "_")
    : "Generico";
  const nomeArquivo = `Pacote_Modelos_PGP_${slugInst}.docx`;
  return new NextResponse(ab, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
