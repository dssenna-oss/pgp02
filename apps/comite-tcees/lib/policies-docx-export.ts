/**
 * Builder DOCX das políticas (Checkpoint 12 / E4).
 *
 * Converte o markdown de uma `Policy` em arquivo Word (.docx) usando
 * `docx-js`. Não é um conversor markdown→docx completo — suporta o
 * subset que os templates seed usam:
 *   - Headings (#, ##, ###, ####)
 *   - Parágrafos
 *   - Bullet lists (- ou *)
 *   - Numbered lists (1. 2. 3.)
 *   - Bold (**texto**), italic (*texto*), code (`texto`)
 *   - Linhas horizontais (---)
 *   - Tabelas markdown (| col | col |)
 *   - Blockquotes (> texto)
 *
 * Foco em fidelidade visual razoável, não em parsing perfeito. Para
 * casos extremos, o DPO edita o DOCX no Word depois.
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
  BorderStyle,
  ShadingType,
  LevelFormat,
} from "docx";

export interface DocxExportInput {
  companyName: string;
  policyTitle: string;
  policyTypeLabel: string;
  publishedAt: string | null;
  version: number;
  /** Markdown content (currentContent ou publishedContent). */
  content: string;
}

// ============================================================
// Inline parser — converte 1 linha com formatação inline em TextRuns
// ============================================================

function parseInline(text: string): TextRun[] {
  // Token order: bold (**) → italic (*) → code (`)
  // Simples regex-based; ordem importa
  const runs: TextRun[] = [];

  // Strip espaços leading/trailing pra evitar runs vazios
  const remaining = text;

  // Vamos partir o texto por marcadores. Algoritmo greedy:
  let buf = "";
  let i = 0;
  const flush = (extra?: { bold?: boolean; italic?: boolean; code?: boolean }) => {
    if (buf.length > 0) {
      runs.push(
        new TextRun({
          text: buf,
          bold: extra?.bold,
          italics: extra?.italic,
          font: extra?.code ? "Consolas" : undefined,
        }),
      );
      buf = "";
    }
  };

  while (i < remaining.length) {
    // Bold **texto**
    if (remaining[i] === "*" && remaining[i + 1] === "*") {
      const close = remaining.indexOf("**", i + 2);
      if (close > i + 2) {
        flush();
        runs.push(new TextRun({ text: remaining.slice(i + 2, close), bold: true }));
        i = close + 2;
        continue;
      }
    }
    // Italic *texto*
    if (remaining[i] === "*" && remaining[i + 1] !== "*") {
      const close = remaining.indexOf("*", i + 1);
      if (close > i + 1 && remaining[close + 1] !== "*") {
        flush();
        runs.push(new TextRun({ text: remaining.slice(i + 1, close), italics: true }));
        i = close + 1;
        continue;
      }
    }
    // Code `texto`
    if (remaining[i] === "`") {
      const close = remaining.indexOf("`", i + 1);
      if (close > i + 1) {
        flush();
        runs.push(new TextRun({
          text: remaining.slice(i + 1, close),
          font: "Consolas",
          color: "555555",
        }));
        i = close + 1;
        continue;
      }
    }
    // Link [texto](url) — vira só "texto (url)"
    if (remaining[i] === "[") {
      const closeBracket = remaining.indexOf("]", i + 1);
      if (closeBracket > i && remaining[closeBracket + 1] === "(") {
        const closeParen = remaining.indexOf(")", closeBracket + 2);
        if (closeParen > closeBracket) {
          flush();
          const linkText = remaining.slice(i + 1, closeBracket);
          const url = remaining.slice(closeBracket + 2, closeParen);
          runs.push(
            new TextRun({ text: linkText, color: "2563EB", underline: {} }),
          );
          if (url !== linkText) {
            runs.push(new TextRun({ text: ` (${url})`, color: "555555", size: 18 }));
          }
          i = closeParen + 1;
          continue;
        }
      }
    }
    buf += remaining[i];
    i++;
  }
  flush();
  return runs.length > 0 ? runs : [new TextRun({ text: text })];
}

// ============================================================
// Block parser — quebra markdown em "blocks" (heading, list, table, etc.)
// ============================================================

type Block =
  | { kind: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "ulist"; items: string[] }
  | { kind: "olist"; items: string[] }
  | { kind: "table"; rows: string[][] }
  | { kind: "hr" }
  | { kind: "quote"; text: string }
  | { kind: "blank" };

function parseBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Linha em branco
    if (!line.trim()) {
      blocks.push({ kind: "blank" });
      i++;
      continue;
    }

    // HR
    if (/^---+\s*$/.test(line.trim())) {
      blocks.push({ kind: "hr" });
      i++;
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = Math.min(h[1].length, 4) as 1 | 2 | 3 | 4;
      blocks.push({ kind: "heading", level, text: h[2].trim() });
      i++;
      continue;
    }

    // Blockquote (1 linha por agora — multi-linha é overkill)
    if (line.startsWith("> ")) {
      blocks.push({ kind: "quote", text: line.slice(2) });
      i++;
      continue;
    }

    // Tabela markdown (| col | col |)
    if (line.startsWith("|") && line.endsWith("|") && i + 1 < lines.length) {
      const next = lines[i + 1];
      // Linha 2 deve ser o separador (|----|----|)
      if (/^\|[\s\-:|]+\|$/.test(next.trim())) {
        const rows: string[][] = [];
        const splitRow = (r: string) =>
          r.slice(1, -1).split("|").map((c) => c.trim());
        rows.push(splitRow(line)); // header
        i += 2; // pula header + separator
        while (i < lines.length && lines[i].startsWith("|") && lines[i].endsWith("|")) {
          rows.push(splitRow(lines[i]));
          i++;
        }
        blocks.push({ kind: "table", rows });
        continue;
      }
    }

    // Lista bullet (- ou *)
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ulist", items });
      continue;
    }

    // Lista numerada (1. 2.)
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ kind: "olist", items });
      continue;
    }

    // Parágrafo (acumula linhas até linha em branco)
    let para = line;
    i++;
    while (i < lines.length && lines[i].trim() && !/^([#*\-\d>|`])/.test(lines[i])) {
      para += " " + lines[i].trim();
      i++;
    }
    blocks.push({ kind: "paragraph", text: para });
  }

  return blocks;
}

// ============================================================
// Renderer — Block[] → docx-js elements
// ============================================================

function renderBlocks(blocks: Block[]): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];

  for (const b of blocks) {
    switch (b.kind) {
      case "blank":
        // skip — espaçamento entre parágrafos já é controlado pelos estilos
        break;

      case "hr":
        out.push(
          new Paragraph({
            border: {
              bottom: { color: "999999", space: 1, style: BorderStyle.SINGLE, size: 6 },
            },
            spacing: { after: 200 },
          }),
        );
        break;

      case "heading": {
        const level = (
          {
            1: HeadingLevel.HEADING_1,
            2: HeadingLevel.HEADING_2,
            3: HeadingLevel.HEADING_3,
            4: HeadingLevel.HEADING_4,
          } as const
        )[b.level];
        out.push(
          new Paragraph({
            heading: level,
            children: parseInline(b.text),
            spacing: { before: 240, after: 120 },
          }),
        );
        break;
      }

      case "paragraph":
        out.push(
          new Paragraph({
            children: parseInline(b.text),
            spacing: { after: 120 },
          }),
        );
        break;

      case "quote":
        out.push(
          new Paragraph({
            children: parseInline(b.text),
            indent: { left: 720 },
            border: {
              left: { color: "999999", space: 8, style: BorderStyle.SINGLE, size: 12 },
            },
            spacing: { after: 120 },
          }),
        );
        break;

      case "ulist":
        for (const it of b.items) {
          out.push(
            new Paragraph({
              children: parseInline(it),
              numbering: { reference: "bullets", level: 0 },
            }),
          );
        }
        break;

      case "olist":
        for (const it of b.items) {
          out.push(
            new Paragraph({
              children: parseInline(it),
              numbering: { reference: "numbers", level: 0 },
            }),
          );
        }
        break;

      case "table": {
        if (b.rows.length === 0) break;
        const colCount = b.rows[0].length;
        // Largura total = 9000 DXA (~6.25") — divide igual entre colunas
        const colWidth = Math.floor(9000 / colCount);
        const border = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
        const borders = { top: border, bottom: border, left: border, right: border };
        const tableRows = b.rows.map((row, idx) => {
          const isHeader = idx === 0;
          return new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  borders,
                  width: { size: colWidth, type: WidthType.DXA },
                  shading: isHeader
                    ? { fill: "F3F4F6", type: ShadingType.CLEAR, color: "auto" }
                    : undefined,
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: parseInline(cell).map(
                        (r) => new TextRun({ ...(r as any).options, bold: isHeader || (r as any).options?.bold }),
                      ),
                    }),
                  ],
                }),
            ),
          });
        });
        out.push(
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            columnWidths: new Array(colCount).fill(colWidth),
            rows: tableRows,
          }),
        );
        // Espaço depois da tabela
        out.push(new Paragraph({ spacing: { after: 120 } }));
        break;
      }
    }
  }

  return out;
}

// ============================================================
// Builder principal
// ============================================================

export async function buildPolicyDocx(input: DocxExportInput): Promise<Buffer> {
  const blocks = parseBlocks(input.content);
  const body = renderBlocks(blocks);

  // Cabeçalho do documento
  const header: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: input.policyTypeLabel.toUpperCase(),
          bold: true,
          size: 18,
          color: "2563EB",
        }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: input.policyTitle, bold: true, size: 36 })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: input.publishedAt
            ? `${input.companyName} · Versão ${input.version} · Publicada em ${new Date(input.publishedAt).toLocaleDateString("pt-BR")}`
            : `${input.companyName} · Rascunho · Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
          size: 18,
          color: "555555",
        }),
      ],
      spacing: { after: 240 },
      border: {
        bottom: { color: "999999", space: 6, style: BorderStyle.SINGLE, size: 6 },
      },
    }),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } }, // 11pt
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, color: "111827" },
          paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 26, bold: true, color: "111827" },
          paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 22, bold: true, color: "111827" },
          paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 },
        },
        {
          id: "Heading4",
          name: "Heading 4",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 20, bold: true, color: "374151" },
          paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 3 },
        },
      ],
    },
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
        {
          reference: "numbers",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
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
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [...header, ...body],
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  return buf;
}

// ============================================================
// Filename helper
// ============================================================

export function suggestPolicyFilename(
  policyTitle: string,
  companyName: string,
  ext: "docx" | "pdf",
): string {
  const safe = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60);
  const date = new Date().toISOString().slice(0, 10);
  return `${safe(policyTitle)}_${safe(companyName)}_${date}.${ext}`;
}
