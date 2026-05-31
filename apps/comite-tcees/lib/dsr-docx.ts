/**
 * Geração do DOCX de resposta institucional ao titular.
 *
 * Composição do documento (1 página A4 típica):
 *   1. Cabeçalho institucional (nome + CNPJ)
 *   2. Identificação do pedido (protocolo, datas, titular)
 *   3. Direitos solicitados (tabela)
 *   4. Decisão e fundamentação
 *   5. Resposta textual ao titular
 *   6. Providências adotadas (opcional, interno)
 *   7. Linha de assinatura do Encarregado
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  Footer,
  Header,
  LevelFormat,
} from "docx";
import {
  DSR_RIGHTS,
  DSR_TITULAR_CATEGORY_LABELS,
  DSR_RESPONSE_CHANNEL_LABELS,
  DSR_DECISION_LABELS,
  DSR_STATUS_LABELS,
  type DsrRightCode,
  type DsrTitularCategory,
  type DsrResponseChannel,
  type DsrDecision,
  type DsrStatus,
} from "@/lib/dsr-helpers";

const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const cellBorders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 100, bottom: 100, left: 140, right: 140 };

function p(text: string | TextRun[], opts: Partial<{ bold: boolean; align: typeof AlignmentType[keyof typeof AlignmentType] }> = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 300 },
    alignment: opts.align,
    children:
      typeof text === "string"
        ? [new TextRun({ text, font: "Calibri", size: 22, bold: opts.bold })]
        : text,
  });
}
function h1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, font: "Calibri", size: 28, color: "1F3864" })],
  });
}
function h2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 120 },
    children: [new TextRun({ text, bold: true, font: "Calibri", size: 24, color: "2E74B5" })],
  });
}
function fillLine(label: string, qtdUnderscores = 60) {
  return new Paragraph({
    spacing: { after: 200, line: 300 },
    children: [
      new TextRun({ text: label + " ", font: "Calibri", size: 22 }),
      new TextRun({ text: "_".repeat(qtdUnderscores), font: "Calibri", size: 22, color: "808080" }),
    ],
  });
}
function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "BFBFBF", space: 1 } },
    children: [new TextRun({ text: "" })],
  });
}
function tableCell(
  text: string,
  opts: { bold?: boolean; fill?: string; width: number; align?: typeof AlignmentType[keyof typeof AlignmentType]; color?: string } = { width: 3120 },
) {
  return new TableCell({
    borders: cellBorders,
    margins: cellMargins,
    width: { size: opts.width, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
    children: [
      new Paragraph({
        alignment: opts.align,
        children: [new TextRun({ text, bold: opts.bold, font: "Calibri", size: 19, color: opts.color })],
      }),
    ],
  });
}

// ---------- Dados de entrada ----------
export type DsrDocxInput = {
  // Org
  orgName: string;
  orgCnpj?: string | null;
  orgAddress?: string | null;
  // DPO
  dpoName?: string | null;
  dpoEmail?: string | null;
  dpoPhone?: string | null;
  // DSR
  protocolNumber: string;
  createdAt: Date;
  dueDate: Date;
  status: DsrStatus;
  // Titular
  titularName: string;
  titularCpf: string;
  titularEmail: string;
  titularCategory: string;
  // Pedido
  requestedRights: string[];
  detailedRequest: string;
  responseChannel: string;
  responseChannelOther?: string | null;
  // Resposta
  decision: DsrDecision | null;
  responseText: string | null;
  responseActions: string | null;
  responseDate: Date | null;
  responseChannelUsed: string | null;
  respondedByName?: string | null;
};

// ---------- Geração ----------
export async function generateDsrResponseDocx(input: DsrDocxInput): Promise<Buffer> {
  const fmtDate = (d: Date | null) => (d ? d.toLocaleDateString("pt-BR") : "—");

  const direitosTabela = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [840, 4320, 4200],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          tableCell("Item", { bold: true, fill: "1F3864", width: 840, color: "FFFFFF", align: AlignmentType.CENTER }),
          tableCell("Direito do titular", { bold: true, fill: "1F3864", width: 4320, color: "FFFFFF" }),
          tableCell("Fundamento legal", { bold: true, fill: "1F3864", width: 4200, color: "FFFFFF", align: AlignmentType.CENTER }),
        ],
      }),
      ...input.requestedRights.map((code, idx) => {
        const r = DSR_RIGHTS[code as DsrRightCode];
        const fill = idx % 2 === 0 ? "F7F7F7" : "FFFFFF";
        return new TableRow({
          children: [
            tableCell(code, { fill, width: 840, align: AlignmentType.CENTER, bold: true }),
            tableCell(r?.label || code, { fill, width: 4320 }),
            tableCell(r?.legal ? `${r.legal}, LGPD` : "—", { fill, width: 4200, align: AlignmentType.CENTER }),
          ],
        });
      }),
    ],
  });

  const dadosTabela = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3120, 6240],
    rows: [
      ["Protocolo", input.protocolNumber],
      ["Recebido em", fmtDate(input.createdAt)],
      ["Prazo legal (15 dias)", fmtDate(input.dueDate)],
      ["Status atual", DSR_STATUS_LABELS[input.status] || input.status],
      ["Titular", input.titularName],
      ["CPF", input.titularCpf],
      ["E-mail", input.titularEmail],
      [
        "Categoria",
        DSR_TITULAR_CATEGORY_LABELS[input.titularCategory as DsrTitularCategory] ||
          input.titularCategory,
      ],
      [
        "Canal preferido",
        input.responseChannel === "outro"
          ? input.responseChannelOther || "Outro"
          : DSR_RESPONSE_CHANNEL_LABELS[input.responseChannel as DsrResponseChannel] ||
            input.responseChannel,
      ],
    ].map(([label, value]) =>
      new TableRow({
        children: [
          tableCell(label, { bold: true, fill: "F2F2F2", width: 3120 }),
          tableCell(value, { fill: "FFFFFF", width: 6240 }),
        ],
      }),
    ),
  });

  const doc = new Document({
    creator: input.orgName,
    title: `Resposta — Requisição ${input.protocolNumber}`,
    description: `Resposta institucional à requisição de direitos do titular ${input.protocolNumber}`,
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Resposta institucional · Protocolo ${input.protocolNumber}`,
                    font: "Calibri",
                    size: 17,
                    color: "808080",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${input.orgName}${input.orgCnpj ? ` · CNPJ ${input.orgCnpj}` : ""} · Página `,
                    font: "Calibri",
                    size: 17,
                    color: "808080",
                  }),
                  new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 17, color: "808080" }),
                  new TextRun({ text: " de ", font: "Calibri", size: 17, color: "808080" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Calibri", size: 17, color: "808080" }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Capa
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: "Resposta à Requisição de Direitos do Titular",
                bold: true,
                font: "Calibri",
                size: 30,
                color: "1F3864",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: "Lei Geral de Proteção de Dados Pessoais — Lei nº 13.709/2018",
                font: "Calibri",
                size: 21,
                color: "595959",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({ text: input.orgName, bold: true, font: "Calibri", size: 22, color: "1F3864" }),
            ],
          }),
          input.orgCnpj || input.orgAddress
            ? new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 320 },
                children: [
                  new TextRun({
                    text: [input.orgCnpj ? `CNPJ ${input.orgCnpj}` : null, input.orgAddress]
                      .filter(Boolean)
                      .join(" · "),
                    font: "Calibri",
                    size: 20,
                    color: "404040",
                  }),
                ],
              })
            : new Paragraph({ spacing: { after: 320 }, children: [new TextRun({ text: "" })] }),

          divider(),

          // Seção 1 — Identificação
          h1("1. Identificação"),
          dadosTabela,
          p(""),

          // Seção 2 — Direitos solicitados
          h1("2. Direitos solicitados pelo titular"),
          direitosTabela,
          p(""),

          // Seção 3 — Detalhamento do pedido
          h1("3. Detalhamento do pedido"),
          new Paragraph({
            spacing: { after: 160, line: 300 },
            border: {
              left: { style: BorderStyle.SINGLE, size: 18, color: "94A3B8", space: 12 },
            },
            indent: { left: 360 },
            children: [
              new TextRun({
                text: input.detailedRequest,
                font: "Calibri",
                size: 22,
                italics: true,
                color: "404040",
              }),
            ],
          }),

          divider(),

          // Seção 4 — Decisão
          h1("4. Decisão da instituição"),
          input.decision
            ? p([
                new TextRun({ text: "Decisão: ", bold: true, font: "Calibri", size: 22 }),
                new TextRun({
                  text: DSR_DECISION_LABELS[input.decision] || input.decision,
                  font: "Calibri",
                  size: 22,
                  color: "1F3864",
                  bold: true,
                }),
              ])
            : p([
                new TextRun({
                  text: "⚠ Decisão ainda não registrada.",
                  font: "Calibri",
                  size: 22,
                  color: "C00000",
                  italics: true,
                }),
              ]),

          h2("Resposta ao titular"),
          input.responseText
            ? p(input.responseText)
            : p([
                new TextRun({
                  text: "⚠ Texto da resposta ainda não preenchido.",
                  font: "Calibri",
                  size: 22,
                  color: "C00000",
                  italics: true,
                }),
              ]),

          ...(input.responseActions
            ? [
                h2("Providências adotadas (uso interno)"),
                p(input.responseActions),
              ]
            : []),

          divider(),

          // Seção 5 — Informações finais
          h1("5. Informações finais"),
          p([
            new TextRun({ text: "Data da resposta: ", bold: true, font: "Calibri", size: 22 }),
            new TextRun({ text: fmtDate(input.responseDate), font: "Calibri", size: 22 }),
          ]),
          p([
            new TextRun({ text: "Canal de resposta utilizado: ", bold: true, font: "Calibri", size: 22 }),
            new TextRun({
              text: input.responseChannelUsed
                ? DSR_RESPONSE_CHANNEL_LABELS[input.responseChannelUsed as DsrResponseChannel] ||
                  input.responseChannelUsed
                : "—",
              font: "Calibri",
              size: 22,
            }),
          ]),

          p(""),
          p([
            new TextRun({ text: "Encarregado pelo Tratamento de Dados Pessoais (DPO)", bold: true, font: "Calibri", size: 22 }),
          ]),
          input.dpoName ? p(`Nome: ${input.dpoName}`) : p(""),
          input.dpoEmail ? p(`E-mail: ${input.dpoEmail}`) : p(""),
          input.dpoPhone ? p(`Telefone: ${input.dpoPhone}`) : p(""),

          p(""),
          p(""),
          fillLine("Local e data: ", 50),
          p(""),
          p("Assinatura do Encarregado (DPO):"),
          new Paragraph({
            spacing: { before: 240, after: 240 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "404040", space: 1 } },
            children: [
              new TextRun({
                text: input.respondedByName || input.dpoName || "",
                font: "Calibri",
                size: 22,
              }),
            ],
          }),

          divider(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120 },
            children: [
              new TextRun({
                text:
                  "Caso entenda que esta resposta foi insuficiente ou contrária à LGPD, o titular pode encaminhar reclamação à Autoridade Nacional de Proteção de Dados — ANPD (https://www.gov.br/anpd) — art. 18, §1º LGPD.",
                font: "Calibri",
                size: 18,
                color: "595959",
                italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
