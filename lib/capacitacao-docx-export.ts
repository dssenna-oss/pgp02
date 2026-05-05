/**
 * Builder DOCX consolidado de evidências de capacitação (Checkpoint 18).
 *
 * Gera relatório institucional listando todos os eventos REALIZADOS no
 * período, agrupados por eixo, com referência às evidências anexadas.
 * Pra apresentar em fiscalização da ANPD como prova documental do
 * programa de capacitação (Art. 52§1º VIII — atenuante de dosimetria).
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";

import {
  EIXO_LABELS,
  EIXO_DESCRIPTIONS,
  AUDIENCE_LABELS,
  TYPE_LABELS,
  ALL_EIXOS,
  type CapacitacaoEixo,
  type CapacitacaoEventoDTO,
} from "@/lib/capacitacao-helpers";

export interface CapacitacaoDocxInput {
  companyName: string;
  companyCnpj: string | null;
  dpoName: string | null;
  dpoEmail: string | null;
  events: CapacitacaoEventoDTO[];
  generatedAt: Date;
}

function fmtDateBR(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export async function buildCapacitacaoDocx(input: CapacitacaoDocxInput): Promise<Buffer> {
  const realizados = input.events.filter((e) => e.status === "REALIZADO");
  const planejados = input.events.filter((e) => e.status === "PLANEJADO");

  const children: Array<Paragraph> = [];

  // ===== Cabeçalho =====
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: input.companyName, bold: true, size: 28 })],
    }),
  );
  if (input.companyCnpj) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: `CNPJ ${input.companyCnpj}`, size: 20 })],
      }),
    );
  }

  // Título do documento
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: "Relatório Consolidado de Capacitação LGPD",
          bold: true,
          size: 28,
        }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Emitido em ${input.generatedAt.toLocaleDateString("pt-BR")}`,
          italics: true,
          size: 20,
        }),
      ],
    }),
  );

  // ===== Sumário executivo =====
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: "1. Sumário Executivo", bold: true })],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "Total de eventos cadastrados: ", bold: true }),
        new TextRun({ text: String(input.events.length) }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "Eventos realizados: ", bold: true }),
        new TextRun({ text: String(realizados.length) }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "Eventos planejados: ", bold: true }),
        new TextRun({ text: String(planejados.length) }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "Eventos com evidência anexada: ", bold: true }),
        new TextRun({
          text: String(realizados.filter((e) => e.evidenceUrl).length),
        }),
      ],
    }),
  );

  // Cobertura por eixo
  const eixosCovered = new Set(realizados.map((e) => e.eixo));
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "Eixos cobertos com evento realizado: ", bold: true }),
        new TextRun({ text: `${eixosCovered.size} de 5` }),
      ],
    }),
  );

  // ===== Eventos por Eixo =====
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 100 },
      children: [
        new TextRun({ text: "2. Eventos por Eixo de Atuação", bold: true }),
      ],
    }),
  );

  for (const eixo of ALL_EIXOS) {
    const eventosEixo = input.events.filter((e) => e.eixo === eixo);
    if (eventosEixo.length === 0) continue;

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: `2.${ALL_EIXOS.indexOf(eixo as CapacitacaoEixo) + 1}. ${EIXO_LABELS[eixo as CapacitacaoEixo]}`,
            bold: true,
          }),
        ],
      }),
    );
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: EIXO_DESCRIPTIONS[eixo as CapacitacaoEixo],
            italics: true,
            size: 20,
          }),
        ],
      }),
    );

    for (const ev of eventosEixo) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 50 },
          children: [
            new TextRun({ text: `• ${ev.title}`, bold: true }),
          ],
        }),
      );
      const meta = [
        `Tipo: ${TYPE_LABELS[ev.type]}`,
        `Público: ${AUDIENCE_LABELS[ev.audience]}`,
        `Status: ${ev.statusLabel}`,
      ];
      if (ev.scheduledAt) meta.push(`Planejado: ${fmtDateBR(ev.scheduledAt)}`);
      if (ev.completedAt) meta.push(`Realizado: ${fmtDateBR(ev.completedAt)}`);
      if (ev.attendeesCount != null) meta.push(`Participantes: ${ev.attendeesCount}`);
      if (ev.operator) meta.push(`Terceiro: ${ev.operator.name}`);
      if (ev.incident) meta.push(`Incidente: ${ev.incident.title}`);
      children.push(
        new Paragraph({
          indent: { left: 360 },
          spacing: { after: 50 },
          children: [new TextRun({ text: meta.join(" · "), size: 18 })],
        }),
      );
      if (ev.description) {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { after: 50 },
            children: [new TextRun({ text: ev.description, size: 18 })],
          }),
        );
      }
      if (ev.evidenceUrl) {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: `📎 Evidência anexada${ev.evidenceFileName ? `: ${ev.evidenceFileName}` : ""}`,
                size: 18,
                italics: true,
              }),
            ],
          }),
        );
      }
    }
  }

  // ===== Base Legal =====
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 100 },
      children: [new TextRun({ text: "3. Base Legal", bold: true })],
    }),
  );
  const baseLegais = [
    "Art. 41 §2º I — Papel do Encarregado de orientar funcionários e contratados sobre proteção de dados pessoais.",
    "Art. 50 — Implementação de programa de governança em privacidade com boas práticas e disseminação do conhecimento.",
    "Art. 6º VIII — Princípio da Prevenção: medidas que evitem a ocorrência de danos.",
    "Art. 52 §1º VIII — Adoção de política de boas práticas e governança como atenuante na dosimetria de sanções.",
  ];
  for (const bl of baseLegais) {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: `• ${bl}`, size: 20 })],
      }),
    );
  }

  // ===== Assinatura =====
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 600, after: 100 },
      children: [
        new TextRun({ text: "4. Encarregado pelo Tratamento de Dados", bold: true }),
      ],
    }),
  );
  if (input.dpoName) {
    children.push(
      new Paragraph({
        spacing: { after: 50 },
        children: [
          new TextRun({ text: "Nome: ", bold: true }),
          new TextRun({ text: input.dpoName }),
        ],
      }),
    );
  }
  if (input.dpoEmail) {
    children.push(
      new Paragraph({
        spacing: { after: 50 },
        children: [
          new TextRun({ text: "E-mail: ", bold: true }),
          new TextRun({ text: input.dpoEmail }),
        ],
      }),
    );
  }
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: `Documento gerado automaticamente pelo PGP — ${input.generatedAt.toLocaleString("pt-BR")}`,
          italics: true,
          size: 18,
        }),
      ],
    }),
  );

  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}
