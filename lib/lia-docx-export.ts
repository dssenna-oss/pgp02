/**
 * Builder DOCX da LIA (Checkpoint 21).
 *
 * Gera o documento institucional pra apresentar à ANPD ou guardar no
 * arquivo do programa. Estrutura:
 *
 *   - Capa: título + identificação institucional + processo (se houver) +
 *     versão + status + data de geração
 *   - Box de bloqueio (se aplicável): destaca que a LIA aponta dados
 *     sensíveis ou crianças/adolescentes — Art. 7º IX vetado
 *   - Para cada etapa (1/2/3): heading H1 + subtítulo + cada pergunta
 *     (label H3 + resposta) + tabela compacta pros checkbox-groups
 *   - Decisão final destacada (Etapa 3) — caixa colorida
 *   - Rodapé: gerado pelo PGP
 *
 * Estrutura paralela ao `ripd-docx-export.ts` mas mais enxuta porque a
 * LIA não tem listas dinâmicas (só perguntas).
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
  ShadingType,
} from "docx";

import type { LiaData } from "./lia-helpers";
import { liaIsBlocked } from "./lia-helpers";
import { LIA_TEMPLATE, type LiaQuestion } from "./lia-templates";

export interface LiaDocxInput {
  companyName: string;
  liaTitle: string;
  /** Nome do processo do Inventário origem (se vinculado). */
  inventoryName: string | null;
  /** "RASCUNHO" | "EM_REVISAO" | "APROVADO" | "ARQUIVADO". */
  status: string;
  /** Versão publicada. Null se ainda não foi aprovada. */
  publishedVersionNum: number | null;
  /** Data de publicação (ISO) ou null. */
  publishedAt: string | null;
  /** Aprovador (nome). Pode ser null. */
  approvedByName: string | null;
  /** Data atual (gerado em). */
  generatedAt: Date;
  /** Conteúdo das 3 etapas. */
  data: LiaData;
}

export async function buildLiaDocx(input: LiaDocxInput): Promise<Buffer> {
  const children: any[] = [];
  const blocked = liaIsBlocked(input.data);

  // --------- Capa ---------
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 200 },
      children: [
        new TextRun({
          text: "AVALIAÇÃO DE LEGÍTIMO INTERESSE",
          bold: true,
          size: 32,
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "(LIA)", bold: true, size: 28, color: "555555" }),
      ],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: "Art. 10 §3º · Art. 7º IX da Lei nº 13.709/2018 (LGPD)",
          italics: true,
          size: 20,
          color: "666666",
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: input.liaTitle, bold: true, size: 24 })],
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

  children.push(
    metaParagraph("Organização", input.companyName),
    metaParagraph(
      "Versão",
      input.publishedVersionNum != null
        ? `v${input.publishedVersionNum}${
            input.publishedAt ? ` (publicada em ${formatDate(input.publishedAt)})` : ""
          }`
        : "Não publicada"
    ),
    metaParagraph("Status", statusLabel(input.status)),
    metaParagraph("Aprovador", input.approvedByName ?? "—"),
    metaParagraph("Documento gerado em", formatDateTime(input.generatedAt))
  );

  // Aviso de bloqueio (se aplicável) — destacado em vermelho na capa
  if (blocked) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: " " })] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 100 },
        shading: { type: ShadingType.SOLID, color: "FEE2E2", fill: "FEE2E2" },
        children: [
          new TextRun({
            text: "⚠️ ALERTA: ESTA AVALIAÇÃO INDICA BLOQUEIO ESTRUTURAL",
            bold: true,
            size: 22,
            color: "991B1B",
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        shading: { type: ShadingType.SOLID, color: "FEE2E2", fill: "FEE2E2" },
        children: [
          new TextRun({
            text:
              "O tratamento envolve dados sensíveis (Art. 11 LGPD) ou de crianças/adolescentes (Art. 14). Legítimo interesse não se aplica — a base legal precisa ser revisada antes de prosseguir.",
            size: 20,
            color: "991B1B",
          }),
        ],
      })
    );
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // --------- Etapas ---------
  for (let i = 0; i < LIA_TEMPLATE.length; i++) {
    const sec = LIA_TEMPLATE[i];
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
            text: `Etapa ${i + 1}: ${sec.title}`,
            bold: true,
            size: 28,
            color: "1F4E79",
          }),
        ],
      })
    );
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: sec.subtitle,
            italics: true,
            color: "666666",
            size: 20,
          }),
        ],
      })
    );

    for (const q of sec.questions) {
      children.push(...renderQuestion(input.data, q));
    }
  }

  // --------- Decisão final destacada ---------
  const decisao = input.data.s3.decisaoFinal;
  if (decisao) {
    const isYes = decisao === "prevalece";
    children.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        alignment: AlignmentType.CENTER,
        shading: {
          type: ShadingType.SOLID,
          color: isYes ? "DCFCE7" : "FEE2E2",
          fill: isYes ? "DCFCE7" : "FEE2E2",
        },
        children: [
          new TextRun({
            text: isYes
              ? "✓ DECISÃO: O LEGÍTIMO INTERESSE PREVALECE"
              : "✕ DECISÃO: O LEGÍTIMO INTERESSE NÃO PREVALECE",
            bold: true,
            size: 24,
            color: isYes ? "166534" : "991B1B",
          }),
        ],
      })
    );
  }

  // --------- Rodapé ---------
  children.push(
    new Paragraph({
      spacing: { before: 600 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Documento gerado automaticamente pelo PGP em ${formatDateTime(
            input.generatedAt
          )} — ${input.companyName}`,
          italics: true,
          size: 18,
          color: "888888",
        }),
      ],
    })
  );

  const doc = new Document({
    creator: "PGP — Programa de Governança em Privacidade",
    title: input.liaTitle,
    description: "Avaliação de Legítimo Interesse (Art. 10 §3º LGPD)",
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}

// ============================================================
// Renderização por tipo de pergunta
// ============================================================

function renderQuestion(data: LiaData, q: LiaQuestion): any[] {
  const out: any[] = [];
  out.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 240, after: 80 },
      children: [
        new TextRun({
          text: stripBlockingEmoji(q.label),
          bold: true,
          size: 22,
          color: q.blocking ? "991B1B" : "333333",
        }),
      ],
    })
  );

  const val = getValue(data, q.path);
  if (q.type === "textarea") {
    const text = typeof val === "string" ? val.trim() : "";
    if (!text) {
      out.push(emptyAnswer());
    } else {
      for (const line of text.split(/\r?\n/)) {
        out.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: line || " ",
                size: 22,
              }),
            ],
          })
        );
      }
    }
  } else if (q.type === "radio") {
    if (val == null || val === "") {
      out.push(emptyAnswer());
    } else {
      const opt = q.options?.find((o) => o.value === String(val));
      const label = opt ? opt.label : String(val);
      const tone = opt?.tone;
      out.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: `→ ${label}`,
              size: 22,
              bold: true,
              color:
                tone === "danger"
                  ? "991B1B"
                  : tone === "warning"
                  ? "92400E"
                  : tone === "ok"
                  ? "166534"
                  : undefined,
            }),
          ],
        })
      );
    }
  } else if (q.type === "checkbox-group") {
    if (!val || typeof val !== "object") {
      out.push(emptyAnswer("(nenhum marcado)"));
    } else {
      const obj = val as Record<string, boolean>;
      const rows: TableRow[] = q.checkboxes!.map(
        (cb) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 8, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: obj[cb.key] ? "✓" : "○",
                        size: 22,
                        bold: obj[cb.key],
                        color: obj[cb.key] ? "166534" : "999999",
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 92, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cb.label,
                        size: 22,
                        color: obj[cb.key] ? "333333" : "888888",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
      );
      out.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows,
        })
      );
      out.push(new Paragraph({ children: [new TextRun({ text: " " })] }));
    }
  }
  return out;
}

function emptyAnswer(text = "—"): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text, size: 22, italics: true, color: "999999" }),
    ],
  });
}

/** Remove o emoji 🚨 do label porque ele faz mais sentido na UI que no DOCX. */
function stripBlockingEmoji(label: string): string {
  return label.replace(/^🚨\s*/, "");
}

// ============================================================
// Helpers compartilhados
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
    case "APROVADO":   return "Aprovada";
    case "ARQUIVADO":  return "Arquivada";
    default:           return s;
  }
}

function getValue(data: LiaData, path: string): unknown {
  const parts = path.split(".");
  let cur: any = data;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
