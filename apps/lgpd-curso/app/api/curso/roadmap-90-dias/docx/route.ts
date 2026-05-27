// GET /api/curso/roadmap-90-dias/docx
// Gera DOCX do Roadmap de 90 dias automaticamente baseado nos 2 processos
// pré-cadastrados do órgão do grupo. Sem input — pronto pra apresentar à
// Alta Gestão como anexo da Carta da Fase Preliminar.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { gerarRoadmap90Dias } from "@/lib/roadmap-gerador";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} from "docx";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  const companyId = session?.user?.companyId;
  if (!companyId) {
    return NextResponse.json({ error: "Sem empresa associada" }, { status: 403 });
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, cidade: true, orgao: true },
  });
  if (!company) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }
  const orgao: "PM" | "CM" = company.orgao === "CM" ? "CM" : "PM";
  const marcos = gerarRoadmap90Dias(orgao);

  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Helpers
  const p = (texto: string, opts: { bold?: boolean; align?: typeof AlignmentType[keyof typeof AlignmentType]; size?: number; spacingAfter?: number; italics?: boolean } = {}) =>
    new Paragraph({
      alignment: opts.align,
      spacing: { after: opts.spacingAfter ?? 150 },
      children: [
        new TextRun({
          text: texto,
          bold: opts.bold,
          italics: opts.italics,
          size: opts.size ?? 22,
        }),
      ],
    });

  const cell = (texto: string, opts: { bold?: boolean; align?: typeof AlignmentType[keyof typeof AlignmentType]; fill?: string; color?: string; widthPct?: number } = {}) =>
    new TableCell({
      width: opts.widthPct ? { size: opts.widthPct * 50, type: WidthType.DXA } : undefined,
      shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [
        new Paragraph({
          alignment: opts.align,
          children: [new TextRun({ text: texto, bold: opts.bold, color: opts.color, size: 20 })],
        }),
      ],
    });

  // Tabela com 13 marcos: Sem | Fase | Atividades | Entrega
  // Header com fundo escuro + texto branco (fill em cell + color em TextRun)
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cell("Sem.",             { bold: true, align: AlignmentType.CENTER, fill: "1E293B", color: "FFFFFF", widthPct: 6 }),
      cell("Fase",             { bold: true, align: AlignmentType.CENTER, fill: "1E293B", color: "FFFFFF", widthPct: 12 }),
      cell("Atividades-chave", { bold: true, fill: "1E293B", color: "FFFFFF", widthPct: 52 }),
      cell("Entrega prevista", { bold: true, fill: "1E293B", color: "FFFFFF", widthPct: 30 }),
    ],
  });

  const linhasMarcos = marcos.map((m, i) => {
    const fill = i % 2 === 0 ? undefined : "F8FAFC";
    const atividades = m.detalhes.map((d) => `• ${d}`).join("\n");
    return new TableRow({
      children: [
        cell(String(m.semana), { align: AlignmentType.CENTER, bold: true, fill }),
        cell(m.fase, { align: AlignmentType.CENTER, fill }),
        new TableCell({
          shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          children: [
            new Paragraph({
              spacing: { after: 60 },
              children: [new TextRun({ text: m.titulo, bold: true, size: 20 })],
            }),
            ...atividades.split("\n").map((linha) => new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: linha, size: 18 })],
            })),
          ],
        }),
        cell(m.entrega, { fill }),
      ],
    });
  });

  const tabela = new Table({
    rows: [headerRow, ...linhasMarcos],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
    },
  });

  const children: (Paragraph | Table)[] = [
    p("ROADMAP DE 90 DIAS", { bold: true, align: AlignmentType.CENTER, size: 32, spacingAfter: 100 }),
    p("Cronograma de implementação do Programa de Governança em Privacidade (PGP)", {
      align: AlignmentType.CENTER,
      italics: true,
      size: 22,
      spacingAfter: 400,
    }),
    p(`Instituição: ${company.name}`, { bold: true, spacingAfter: 60 }),
    p(`Cidade: ${company.cidade || "Vegas"}`, { spacingAfter: 60 }),
    p(`Documento elaborado em: ${hoje}`, { spacingAfter: 400 }),
    p(
      "Este cronograma distribui as 7 Fases do Programa de Governança em Privacidade (PGP) ao longo de 13 semanas, com marcos semanais específicos e entregas verificáveis. Foi gerado automaticamente a partir dos processos críticos identificados na Fase 2.",
      { italics: true, spacingAfter: 300 },
    ),
    tabela,
    p("", { spacingAfter: 400 }),
    p(
      "Observação: este roadmap é um modelo de referência. Cada Instituição deve ajustar prazos conforme sua capacidade operacional, sazonalidade orçamentária e prioridades institucionais.",
      { italics: true, size: 18, spacingAfter: 600 },
    ),
    p("_______________________________________", { align: AlignmentType.CENTER, spacingAfter: 50 }),
    p("Encarregado(a) pelo Tratamento de Dados Pessoais", { align: AlignmentType.CENTER, italics: true, size: 18 }),
  ];

  const doc = new Document({
    creator: "PGP Treinamento — Curso prático de LGPD",
    title: "Roadmap de 90 dias — Implementação do PGP",
    description: `Cronograma de 90 dias pra ${company.name}`,
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
            size: { orientation: "landscape" }, // paisagem pra acomodar tabela ampla
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
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
  const nomeArquivo = `Roadmap_90_Dias_${company.name.replace(/[^a-zA-Z0-9]+/g, "_")}.docx`;
  return new NextResponse(ab, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
