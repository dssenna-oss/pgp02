// GET /api/curso/carta-alta-gestao/docx
// Gera DOCX formal da Carta para a Alta Gestão da company autenticada.
// Só funciona se a carta estiver FINALIZADA (cartaAltaGestao.finalizadaEm != null).
// Usa docx-js (já instalado no projeto).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureColunasFasePreliminar } from "@/lib/coluna-fase-preliminar";
import type { CartaAltaGestaoSalva } from "@/lib/carta-alta-gestao";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
} from "docx";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  const companyId = session?.user?.companyId;
  if (!companyId) {
    return NextResponse.json({ error: "Sem empresa associada" }, { status: 403 });
  }

  await ensureColunasFasePreliminar();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, cidade: true, cartaAltaGestao: true },
  });
  if (!company) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }
  const carta = company.cartaAltaGestao as CartaAltaGestaoSalva | null;
  if (!carta || !carta.finalizadaEm) {
    return NextResponse.json(
      { error: "Carta não finalizada — finalize antes de baixar." },
      { status: 400 },
    );
  }

  const dataLocal = new Date(carta.finalizadaEm).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Helpers de parágrafo
  const p = (texto: string, opts: { bold?: boolean; align?: typeof AlignmentType[keyof typeof AlignmentType]; size?: number; spacingAfter?: number } = {}) =>
    new Paragraph({
      alignment: opts.align,
      spacing: { after: opts.spacingAfter ?? 200 },
      children: [
        new TextRun({
          text: texto,
          bold: opts.bold,
          size: opts.size ?? 22, // 11pt
        }),
      ],
    });

  // Divide textos com \n em múltiplos parágrafos
  const paragrafos = (texto: string, opts: Parameters<typeof p>[1] = {}) =>
    texto
      .split(/\n\n+/)
      .map((bloco) => p(bloco.trim(), opts));

  const children: Paragraph[] = [
    // Cabeçalho
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `${company.cidade || "Vegas"}, ${dataLocal}.`,
          italics: true,
          size: 22,
        }),
      ],
    }),
    // Destinatário
    p(carta.destinatario, { bold: true, spacingAfter: 400 }),
    // Assunto
    p("Assunto: Solicitação de apoio institucional para implementação do Programa de Governança em Privacidade (PGP) — adequação à LGPD.", {
      bold: true,
      spacingAfter: 400,
    }),
    // Saudação
    p("Cumprimentando-o(a) cordialmente,", { spacingAfter: 300 }),
    // Corpo — justificativa
    ...paragrafos(carta.justificativa),
    // Riscos
    new Paragraph({
      spacing: { before: 200, after: 150 },
      children: [new TextRun({ text: "Dos riscos institucionais do não-cumprimento:", bold: true, size: 22 })],
    }),
    ...paragrafos(carta.riscosNaoFazer),
    // Pedido
    new Paragraph({
      spacing: { before: 200, after: 150 },
      children: [new TextRun({ text: "Do que se solicita:", bold: true, size: 22 })],
    }),
    ...paragrafos(carta.pedido),
    // Assinatura
    new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: "" })] }),
    ...paragrafos(carta.assinatura, { align: AlignmentType.LEFT }),
  ];

  const doc = new Document({
    creator: "PGP Treinamento — Curso prático de LGPD",
    title: "Carta para a Alta Gestão",
    description: `Carta de solicitação institucional gerada por ${company.name}`,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { orientation: "portrait" },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 polegada
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
  const nomeArquivo = `Carta_Alta_Gestao_${company.name.replace(/[^a-zA-Z0-9]+/g, "_")}.docx`;
  return new NextResponse(ab, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
