/**
 * Builder DOCX da comunicação à ANPD (Checkpoint 16 / C).
 *
 * Estrutura conforme Resolução CD/ANPD nº 15/2024 — Art. 5º (conteúdo
 * mínimo da comunicação) + Art. 48 LGPD:
 *
 *   1. Identificação do controlador (razão social, CNPJ, endereço, encarregado)
 *   2. Descrição do incidente (data, narrativa, causa raiz)
 *   3. Categoria de dados afetados (incluindo se houve dados sensíveis)
 *   4. Categorias e número aproximado de titulares afetados
 *   5. Medidas técnicas e de segurança que estavam em vigor
 *   6. Riscos relacionados ao incidente
 *   7. Medidas adotadas e a adotar (contenção + corretivas)
 *   8. Justificativa de eventual demora (se >72h)
 *
 * Foco: ofício formal, pronto pra DPO ajustar no Word e protocolar.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";

import {
  incidentTypeLabel,
  severityLabel,
  type IncidentDTO,
} from "@/lib/incidentes-helpers";

export interface IncidentAnpdDocxInput {
  /** Razão social do controlador (Company.companyName) */
  companyName: string;
  /** CNPJ do controlador */
  companyCnpj: string | null;
  /** Endereço comercial */
  companyAddress: string | null;
  /** Nome do encarregado (DPO) */
  dpoName: string | null;
  /** E-mail do encarregado */
  dpoEmail: string | null;
  /** Telefone do encarregado */
  dpoPhone: string | null;
  /** Incidente completo (DTO já com derivados) */
  incident: IncidentDTO;
  /** Data atual (gerado em) */
  generatedAt: Date;
}

export async function buildIncidentAnpdDocx(
  input: IncidentAnpdDocxInput
): Promise<Buffer> {
  const i = input.incident;
  const children: any[] = [];

  // --------- Cabeçalho ---------
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: "COMUNICAÇÃO DE INCIDENTE DE SEGURANÇA",
          bold: true,
          size: 30,
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: "ENVOLVENDO DADOS PESSOAIS",
          bold: true,
          size: 26,
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: "À Autoridade Nacional de Proteção de Dados (ANPD)",
          italics: true,
          color: "555555",
          size: 22,
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
          text: "(Art. 48 da Lei nº 13.709/2018 — LGPD; Resolução CD/ANPD nº 15/2024)",
          italics: true,
          color: "666666",
          size: 18,
        }),
      ],
    })
  );

  // --------- Identificação do controlador ---------
  pushHeading(children, "1. Identificação do Controlador");
  pushKV(children, "Razão Social", input.companyName);
  pushKV(children, "CNPJ", input.companyCnpj ?? "[a preencher]");
  pushKV(children, "Endereço", input.companyAddress ?? "[a preencher]");
  pushKV(
    children,
    "Encarregado (DPO)",
    input.dpoName ?? "[a preencher]"
  );
  pushKV(children, "E-mail do Encarregado", input.dpoEmail ?? "[a preencher]");
  pushKV(children, "Telefone do Encarregado", input.dpoPhone ?? "[a preencher]");

  // --------- Descrição do incidente ---------
  pushHeading(children, "2. Descrição do Incidente");
  pushKV(children, "Título", i.title);
  pushKV(children, "Tipo", incidentTypeLabel(i.incidentType));
  pushKV(children, "Severidade avaliada", severityLabel(i.severity));
  if (i.occurredAt) {
    pushKV(children, "Data/hora aproximada do incidente", formatDateTime(i.occurredAt));
  }
  pushKV(children, "Data/hora da ciência pelo controlador", formatDateTime(i.detectedAt));
  if (i.anpdDeadline?.expired) {
    pushKV(
      children,
      "Comunicação realizada após o prazo de 3 dias úteis",
      `Sim — ${i.anpdDeadline.label}. Justificativa apresentada na seção 8.`
    );
  }
  pushParagraph(children, i.description, { italics: false });

  if (i.rootCause) {
    pushSubheading(children, "Causa raiz identificada");
    pushParagraph(children, i.rootCause);
  }
  if (i.attackVector) {
    pushKV(children, "Vetor de origem", i.attackVector);
  }

  // --------- Categoria de dados afetados ---------
  pushHeading(children, "3. Categorias de Dados Pessoais Afetados");
  pushParagraph(
    children,
    i.affectedDataTypes ?? "Categorias de dados afetados ainda em apuração."
  );
  pushKV(
    children,
    "Houve dados pessoais sensíveis (Art. 11 LGPD)?",
    i.hasSensitiveData ? "Sim" : "Não"
  );

  // --------- Titulares afetados ---------
  pushHeading(children, "4. Categorias e Número de Titulares Afetados");
  if (i.affectedSubjectsCategories) {
    pushSubheading(children, "Categorias de titulares");
    pushParagraph(children, i.affectedSubjectsCategories);
  }
  pushKV(
    children,
    "Número aproximado de titulares afetados",
    i.affectedSubjectsCount != null
      ? new Intl.NumberFormat("pt-BR").format(i.affectedSubjectsCount)
      : "Em apuração"
  );

  // --------- Medidas de segurança que estavam em vigor ---------
  pushHeading(children, "5. Medidas Técnicas e de Segurança em Vigor");
  pushParagraph(
    children,
    i.securityMeasuresInPlace ??
      "Medidas técnicas e administrativas que estavam em vigor antes do incidente — a detalhar."
  );
  if (i.affectedSystems) {
    pushSubheading(children, "Sistemas e ativos afetados");
    pushParagraph(children, i.affectedSystems);
  }
  if (i.affectedOperators) {
    pushSubheading(children, "Operadores/terceiros envolvidos");
    pushParagraph(children, i.affectedOperators);
  }

  // --------- Riscos ---------
  pushHeading(children, "6. Riscos Relacionados ao Incidente");
  pushParagraph(
    children,
    i.riskAssessment ??
      "Avaliação de risco aos titulares — a detalhar conforme apuração."
  );

  // --------- Medidas adotadas e a adotar ---------
  pushHeading(children, "7. Medidas Adotadas e a Adotar");
  pushSubheading(children, "Medidas de contenção (curto prazo)");
  pushParagraph(
    children,
    i.containmentMeasures ?? "Medidas de contenção em apuração."
  );
  pushSubheading(children, "Medidas corretivas e preventivas (médio/longo prazo)");
  pushParagraph(
    children,
    i.correctiveMeasures ?? "Medidas corretivas a serem implementadas."
  );

  // --------- Justificativa de demora (se aplicável) ---------
  if (i.delayJustification || i.anpdDeadline?.expired) {
    pushHeading(
      children,
      "8. Justificativa de Demora na Comunicação"
    );
    pushParagraph(
      children,
      i.delayJustification ??
        "Justificativa pendente de redação pelo encarregado."
    );
  }

  // --------- Encerramento + assinatura ---------
  children.push(
    new Paragraph({
      spacing: { before: 800, after: 100 },
      children: [
        new TextRun({
          text: "Coloco-me à disposição da Autoridade Nacional de Proteção de Dados para esclarecimentos adicionais.",
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 400, after: 100 },
      children: [
        new TextRun({
          text: `${formatCity(input.companyAddress)} ${formatDateLong(input.generatedAt)}.`,
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 100 },
      border: {
        top: { color: "000000", size: 6, style: BorderStyle.SINGLE, space: 1 },
      },
      children: [],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
      children: [
        new TextRun({
          text: input.dpoName ?? "[Nome do Encarregado]",
          bold: true,
          size: 22,
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
      children: [
        new TextRun({
          text: "Encarregado pelo Tratamento de Dados Pessoais",
          italics: true,
          size: 20,
          color: "555555",
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: input.companyName,
          size: 20,
        }),
      ],
    })
  );

  // --------- Rodapé ---------
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [
        new TextRun({
          text: `Documento gerado pelo PGP em ${formatDateTime(input.generatedAt)}`,
          italics: true,
          size: 18,
          color: "888888",
        }),
      ],
    })
  );

  const doc = new Document({
    creator: "PGP — LGPD",
    title: `Comunicação de Incidente — ${i.title}`,
    description:
      "Comunicação de incidente de segurança envolvendo dados pessoais à ANPD",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [{ children }],
  });

  return await Packer.toBuffer(doc);
}

// ============================================================
// Helpers de paragrafo
// ============================================================

function pushHeading(children: any[], text: string): void {
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 26,
          color: "1F4E79",
        }),
      ],
    })
  );
}

function pushSubheading(children: any[], text: string): void {
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 22,
          color: "333333",
        }),
      ],
    })
  );
}

function pushKV(children: any[], label: string, value: string): void {
  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: 22 }),
        new TextRun({ text: value, size: 22 }),
      ],
    })
  );
}

function pushParagraph(
  children: any[],
  text: string,
  opts: { italics?: boolean } = {}
): void {
  // Quebra parágrafos por linhas em branco; mantém quebras simples como break.
  const blocks = text.split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split(/\n/);
    const runs: TextRun[] = [];
    lines.forEach((line, idx) => {
      if (idx > 0) {
        runs.push(new TextRun({ break: 1 }));
      }
      runs.push(
        new TextRun({
          text: line,
          italics: opts.italics ?? false,
          size: 22,
        })
      );
    });
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: runs,
      })
    );
  }
}

// ============================================================
// Formatters
// ============================================================

function formatDateTime(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLong(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Tenta extrair a cidade do endereço pra colocar no fecho ("Cidade, dd de
 * mês de aaaa"). Se não rolar, deixa só a data.
 */
function formatCity(address: string | null): string {
  if (!address) return "";
  // Heurística simples — pega o último item antes do CEP/UF
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "";
  // Pega o penúltimo se houver UF/CEP no último
  const last = parts[parts.length - 1] ?? "";
  if (/\d{5}/.test(last) || /^[A-Z]{2}$/i.test(last)) {
    return parts.length >= 2 ? `${parts[parts.length - 2]},` : "";
  }
  return `${last},`;
}
