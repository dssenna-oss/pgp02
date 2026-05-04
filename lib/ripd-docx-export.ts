/**
 * Builder DOCX do RIPD (Checkpoint 13 / F4).
 *
 * Diferente do exporter de Políticas (que parseia markdown), o RIPD
 * é estruturado em 8 seções/campos no JSON `data`. Geramos DOCX
 * percorrendo essas seções e renderizando:
 *   - Capa: título + identificação institucional + versão + data
 *   - Por seção: heading H1 + intro + cada campo (H3 label + texto)
 *   - Listas (riscos / controles / ações): tabelas
 *   - Rodapé: gerado pelo PGP em {data}
 *
 * Foco: documento limpo e profissional, pronto pra DPO ajustar no
 * Word se quiser.
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
  PageBreak,
  BorderStyle,
} from "docx";

import type { RipdData } from "@/lib/ripd-helpers";
import { RIPD_SECTIONS, getFieldValue } from "@/components/ripd/ripd-section-fields";

export interface RipdDocxInput {
  companyName: string;
  ripdTitle: string;
  /** Nome do processo do Inventário origem (se vinculado). */
  inventoryName: string | null;
  /** "RASCUNHO" | "EM_REVISAO" | "APROVADO" | "ARQUIVADO". */
  status: string;
  /** Versão publicada. Null se ainda não foi aprovado. */
  publishedVersionNum: number | null;
  /** Data de publicação (ISO) ou null. */
  publishedAt: string | null;
  /** Data atual (gerado em). */
  generatedAt: Date;
  /** Conteúdo das 8 seções. */
  data: RipdData;
}

export async function buildRipdDocx(input: RipdDocxInput): Promise<Buffer> {
  const children: any[] = [];

  // --------- Capa ---------
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 300 },
      children: [
        new TextRun({
          text: "RELATÓRIO DE IMPACTO À PROTEÇÃO DE DADOS PESSOAIS",
          bold: true,
          size: 32,
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: "(RIPD)",
          bold: true,
          size: 28,
          color: "555555",
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: input.ripdTitle,
          bold: true,
          size: 24,
        }),
      ],
    })
  );

  if (input.inventoryName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
        children: [
          new TextRun({
            text: `Processo: ${input.inventoryName}`,
            italics: true,
            size: 20,
            color: "666666",
          }),
        ],
      })
    );
  }

  // Bloco de metadata
  children.push(
    metaParagraph("Organização", input.companyName),
    metaParagraph(
      "Versão",
      input.publishedVersionNum != null
        ? `v${input.publishedVersionNum}${input.publishedAt ? ` (publicada em ${formatDate(input.publishedAt)})` : ""}`
        : "Rascunho (não publicada)"
    ),
    metaParagraph("Status", statusLabel(input.status)),
    metaParagraph("Documento gerado em", formatDateTime(input.generatedAt))
  );

  children.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // --------- Seções ---------
  for (const sec of RIPD_SECTIONS) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
            text: `${sec.number}. ${sec.title}`,
            bold: true,
            size: 28,
            color: "1F4E79",
          }),
        ],
      })
    );

    if (sec.intro) {
      children.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: sec.intro,
              italics: true,
              color: "666666",
              size: 20,
            }),
          ],
        })
      );
    }

    // Listas anexas (Seção 6 ou 7)
    if (sec.hasList === "risks") {
      children.push(...renderRisksTable(input.data.s6.risks));
    } else if (sec.hasList === "existingControls") {
      children.push(...renderControlsTable(input.data.s7.existingControls));
      children.push(...renderActionsTable(input.data.s7.plannedActions));
    }

    // Campos do schema declarativo
    for (const field of sec.fields) {
      const value = getFieldValue(input.data, field.path);
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 80 },
          children: [
            new TextRun({
              text: field.label,
              bold: true,
              size: 22,
              color: "333333",
            }),
          ],
        })
      );
      // Quebra de linhas: cada \n vira parágrafo separado
      const lines = value.trim() ? value.split(/\r?\n/) : ["—"];
      for (const line of lines) {
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: line || " ",
                size: 22,
                color: line.trim() ? undefined : "999999",
              }),
            ],
          })
        );
      }
    }
  }

  // --------- Rodapé ---------
  children.push(
    new Paragraph({
      spacing: { before: 600 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Documento gerado automaticamente pelo PGP em ${formatDateTime(input.generatedAt)} — ${input.companyName}`,
          italics: true,
          size: 18,
          color: "888888",
        }),
      ],
    })
  );

  const doc = new Document({
    creator: "PGP — Programa de Governança em Privacidade",
    title: input.ripdTitle,
    description: "Relatório de Impacto à Proteção de Dados Pessoais (LGPD)",
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// ============================================================
// Helpers
// ============================================================

function metaParagraph(label: string, value: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22 }),
      new TextRun({ text: value, size: 22 }),
    ],
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(d: Date): string {
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(s: string): string {
  switch (s) {
    case "RASCUNHO":   return "Rascunho";
    case "EM_REVISAO": return "Em revisão";
    case "APROVADO":   return "Aprovado";
    case "ARQUIVADO":  return "Arquivado";
    default:           return s;
  }
}

// ============================================================
// Tabelas das listas
// ============================================================

function renderRisksTable(
  risks: RipdData["s6"]["risks"]
): Paragraph[] | (Paragraph | Table)[] {
  if (risks.length === 0) {
    return [
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: "Nenhum risco identificado pra este processo.",
            italics: true,
            color: "888888",
            size: 22,
          }),
        ],
      }),
    ];
  }
  const headerCells = ["Código", "Risco", "Severidade", "Status", "Descrição"];
  const rows: TableRow[] = [];
  rows.push(
    new TableRow({
      tableHeader: true,
      children: headerCells.map((h) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true, size: 20 })],
            }),
          ],
        })
      ),
    })
  );
  for (const r of risks) {
    rows.push(
      new TableRow({
        children: [
          textCell(r.code, { bold: true }),
          textCell(r.label),
          textCell(r.severityLevel || "—"),
          textCell(r.status),
          textCell(r.description || "—"),
        ],
      })
    );
  }
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    }),
    new Paragraph({ children: [new TextRun({ text: " " })] }),
  ];
}

function renderControlsTable(
  controls: RipdData["s7"]["existingControls"]
): (Paragraph | Table)[] {
  const heading = new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [
      new TextRun({
        text: `Controles aderentes do GAP (${controls.length})`,
        bold: true,
        size: 22,
        color: "333333",
      }),
    ],
  });
  if (controls.length === 0) {
    return [
      heading,
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: "Nenhum controle marcado como aderente no GAP Analysis.",
            italics: true,
            color: "888888",
            size: 22,
          }),
        ],
      }),
    ];
  }
  const rows: TableRow[] = [];
  rows.push(
    new TableRow({
      tableHeader: true,
      children: ["Código", "Controle", "Cenário atual"].map((h) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true, size: 20 })],
            }),
          ],
        })
      ),
    })
  );
  for (const c of controls) {
    rows.push(
      new TableRow({
        children: [
          textCell(c.code, { bold: true }),
          textCell(c.label),
          textCell(c.cenarioAtual || "—"),
        ],
      })
    );
  }
  return [
    heading,
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
    new Paragraph({ children: [new TextRun({ text: " " })] }),
  ];
}

function renderActionsTable(
  actions: RipdData["s7"]["plannedActions"]
): (Paragraph | Table)[] {
  const heading = new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text: `Ações planejadas no Plano de Ação (${actions.length})`,
        bold: true,
        size: 22,
        color: "333333",
      }),
    ],
  });
  if (actions.length === 0) {
    return [
      heading,
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: "Nenhuma ação aberta ligada a este processo no Plano de Ação.",
            italics: true,
            color: "888888",
            size: 22,
          }),
        ],
      }),
    ];
  }
  const rows: TableRow[] = [];
  rows.push(
    new TableRow({
      tableHeader: true,
      children: ["Ação", "Status", "Prioridade", "Prazo"].map((h) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true, size: 20 })],
            }),
          ],
        })
      ),
    })
  );
  for (const a of actions) {
    rows.push(
      new TableRow({
        children: [
          textCell(a.title),
          textCell(a.status),
          textCell(a.priority),
          textCell(a.dueDate ? formatDate(a.dueDate) : "—"),
        ],
      })
    );
  }
  return [
    heading,
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
    new Paragraph({ children: [new TextRun({ text: " " })] }),
  ];
}

function textCell(text: string, opts?: { bold?: boolean }): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 20, bold: opts?.bold })],
      }),
    ],
  });
}
