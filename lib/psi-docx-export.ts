/**
 * Builder DOCX da PSI (Checkpoint 26).
 *
 * Gera o documento institucional formal da Política de Segurança da
 * Informação. Estrutura:
 *
 *   - Capa: título + identificação institucional + versão + status + data
 *   - Cabeçalho: vigência, aplicabilidade, frequência de revisão
 *   - 7 seções com headings H1 + textos + tabela de controles aplicados
 *   - Rodapé institucional
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx";

import type { PsiData } from "./psi-helpers";
import { PSI_SECTION_LABELS } from "./psi-helpers";
import { TEXTAREA_FIELDS, CONTROL_LABELS } from "./psi-diff";

export interface PsiDocxInput {
  companyName: string;
  psiTitle: string;
  status: string;
  publishedVersionNum: number | null;
  publishedAt: string | null;
  approvedByName: string | null;
  generatedAt: Date;
  data: PsiData;
}

function paragraphText(text: string, opts?: { bold?: boolean; size?: number; align?: typeof AlignmentType[keyof typeof AlignmentType] }) {
  return new Paragraph({
    alignment: opts?.align,
    spacing: { after: 120 },
    children: [new TextRun({ text, bold: opts?.bold, size: opts?.size })],
  });
}

function heading1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28 })],
  });
}

function heading3(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22 })],
  });
}

/** Tabela 2 colunas com controles aplicados. */
function controlsTable(controles: Record<string, boolean>, sectionKey: string): Table {
  const labels = CONTROL_LABELS[sectionKey] ?? {};
  const rows = Object.keys(labels).map((key) => {
    const checked = Boolean(controles?.[key]);
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 80, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, color: "auto", fill: checked ? "ECFDF5" : "FEF3C7" },
          children: [paragraphText(labels[key])],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, color: "auto", fill: checked ? "ECFDF5" : "FEF3C7" },
          children: [paragraphText(checked ? "✓ Aplicado" : "✗ Pendente", { bold: true })],
        }),
      ],
    });
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

export async function buildPsiDocx(input: PsiDocxInput): Promise<Buffer> {
  const children: any[] = [];

  // Capa
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 200 },
      children: [new TextRun({ text: "POLÍTICA DE SEGURANÇA DA INFORMAÇÃO", bold: true, size: 32 })],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: input.psiTitle, size: 26 })],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: input.companyName, size: 22 })],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: input.publishedVersionNum
            ? `Versão ${input.publishedVersionNum} · ${input.status}`
            : `Status: ${input.status}`,
          italics: true,
          size: 20,
        }),
      ],
    })
  );
  if (input.publishedAt) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: `Publicada em ${new Date(input.publishedAt).toLocaleDateString("pt-BR")}${
              input.approvedByName ? ` por ${input.approvedByName}` : ""
            }`,
            size: 18,
          }),
        ],
      })
    );
  }
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: `Documento gerado em ${input.generatedAt.toLocaleString("pt-BR")}`,
          size: 16,
          italics: true,
        }),
      ],
    })
  );

  // Cabeçalho institucional
  children.push(heading1("Cabeçalho"));
  if (input.data.header.vigencia) {
    children.push(heading3("Vigência"));
    children.push(paragraphText(input.data.header.vigencia));
  }
  if (input.data.header.aplicabilidade) {
    children.push(heading3("Aplicabilidade"));
    children.push(paragraphText(input.data.header.aplicabilidade));
  }
  if (input.data.header.frequenciaRevisao) {
    children.push(heading3("Frequência de revisão"));
    children.push(paragraphText(input.data.header.frequenciaRevisao));
  }

  // 7 seções
  for (let i = 0; i < PSI_SECTION_LABELS.length; i++) {
    const meta = PSI_SECTION_LABELS[i];
    children.push(heading1(`${i + 1}. ${meta.label}`));

    // Textos
    for (const f of TEXTAREA_FIELDS[meta.key] ?? []) {
      const val = String((input.data as any)[meta.key]?.[f.key] ?? "").trim();
      if (val) {
        children.push(heading3(f.label));
        // Quebra em parágrafos por linha
        for (const line of val.split(/\n+/).filter(Boolean)) {
          children.push(paragraphText(line));
        }
      }
    }

    // Controles aplicáveis
    const controles = (input.data as any)[meta.key]?.controles ?? {};
    children.push(heading3("Controles aplicados"));
    children.push(controlsTable(controles, meta.key));
  }

  // Rodapé
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 100 },
      children: [
        new TextRun({
          text: "Documento gerado pelo Programa de Governança em Privacidade (PGP) — LGPD Art. 50 + ISO/IEC 27001/27002 + NIST CSF",
          italics: true,
          size: 16,
        }),
      ],
    })
  );

  const doc = new Document({
    creator: "PGP — LGPD",
    title: input.psiTitle,
    description: "Política de Segurança da Informação",
    sections: [{ properties: {}, children }],
  });

  return await Packer.toBuffer(doc);
}
