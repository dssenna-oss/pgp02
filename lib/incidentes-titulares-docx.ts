/**
 * Builder DOCX da carta de comunicação aos titulares (Checkpoint 16 / D).
 *
 * Base legal: Art. 48 §1º LGPD — quando o incidente "possa acarretar
 * risco ou dano relevante aos titulares", o controlador também
 * comunica os afetados (não só a ANPD).
 *
 * Estrutura inspirada na Cartilha ANPD "Comunicação de Incidente":
 *   1. Identificação do controlador
 *   2. O que aconteceu (linguagem clara, sem jargão)
 *   3. Quais dados foram afetados
 *   4. Riscos potenciais
 *   5. Medidas tomadas pra proteger
 *   6. Direitos do titular (Art. 18 LGPD) + canais
 *   7. Contato do encarregado
 *
 * Diferente do ofício à ANPD (que é técnico-formal), a carta aos
 * titulares deve ser **acessível** — destinatário leigo. Mesmo formato
 * DOCX pra DPO ajustar no Word.
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

import { type IncidentDTO } from "@/lib/incidentes-helpers";

export interface IncidentSubjectsDocxInput {
  /** Razão social do controlador */
  companyName: string;
  /** CNPJ */
  companyCnpj: string | null;
  /** Endereço */
  companyAddress: string | null;
  /** Encarregado (DPO) */
  dpoName: string | null;
  /** E-mail do DPO */
  dpoEmail: string | null;
  /** Telefone do DPO */
  dpoPhone: string | null;
  /** Incidente já com derivados */
  incident: IncidentDTO;
  /** Quando geramos */
  generatedAt: Date;
}

export async function buildIncidentSubjectsDocx(
  input: IncidentSubjectsDocxInput
): Promise<Buffer> {
  const i = input.incident;
  const children: any[] = [];

  // --------- Cabeçalho institucional ---------
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: input.companyName,
          bold: true,
          size: 24,
        }),
      ],
    })
  );
  if (input.companyCnpj) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: `CNPJ ${input.companyCnpj}`,
            italics: true,
            color: "555555",
            size: 18,
          }),
        ],
      })
    );
  }

  // --------- Título ---------
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: "COMUNICADO IMPORTANTE",
          bold: true,
          size: 30,
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
          text: "Notificação de Incidente Envolvendo Seus Dados Pessoais",
          bold: true,
          size: 22,
        }),
      ],
    })
  );

  // --------- Saudação ---------
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: "Prezado(a) titular,",
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: "Em cumprimento ao art. 48 da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados), informamos que houve um incidente envolvendo dados pessoais sob nossa guarda, e seus dados podem ter sido afetados. A transparência nessa comunicação faz parte do nosso compromisso com a proteção da sua privacidade.",
          size: 22,
        }),
      ],
    })
  );

  // --------- 1. O que aconteceu ---------
  pushHeading(children, "1. O Que Aconteceu");
  pushParagraph(children, i.description);
  if (i.occurredAt) {
    pushKV(
      children,
      "Data aproximada do incidente",
      formatDateLong(i.occurredAt)
    );
  }
  pushKV(
    children,
    "Data em que tivemos ciência",
    formatDateLong(i.detectedAt)
  );

  // --------- 2. Dados afetados ---------
  pushHeading(children, "2. Quais Dados Pessoais Foram Afetados");
  pushParagraph(
    children,
    i.affectedDataTypes ??
      "Estamos em fase de apuração para confirmar exatamente quais dados foram impactados. Atualizaremos esta comunicação assim que tivermos mais detalhes."
  );
  if (i.hasSensitiveData) {
    children.push(
      new Paragraph({
        spacing: { before: 100, after: 200 },
        children: [
          new TextRun({
            text: "⚠ Importante: ",
            bold: true,
            size: 22,
            color: "B45309",
          }),
          new TextRun({
            text: "este incidente envolveu dados pessoais sensíveis (Art. 11 da LGPD).",
            size: 22,
          }),
        ],
      })
    );
  }

  // --------- 3. Riscos ---------
  pushHeading(children, "3. Possíveis Riscos para Você");
  pushParagraph(
    children,
    i.riskAssessment ??
      "Estamos avaliando os riscos efetivos. Como medida preventiva, recomendamos atenção redobrada com tentativas de fraude, contatos suspeitos e mensagens não solicitadas que façam referência aos seus dados pessoais."
  );

  // --------- 4. Medidas tomadas ---------
  pushHeading(children, "4. Medidas Que Já Tomamos");
  if (i.containmentMeasures) {
    pushSubheading(children, "Para conter o incidente");
    pushParagraph(children, i.containmentMeasures);
  }
  if (i.correctiveMeasures) {
    pushSubheading(children, "Para evitar que se repita");
    pushParagraph(children, i.correctiveMeasures);
  }
  if (!i.containmentMeasures && !i.correctiveMeasures) {
    pushParagraph(
      children,
      "Nossa equipe de segurança já iniciou a investigação e a aplicação de medidas de contenção. Detalharemos as ações específicas em comunicação posterior."
    );
  }
  if (i.anpdNotifiedAt) {
    children.push(
      new Paragraph({
        spacing: { before: 100, after: 200 },
        children: [
          new TextRun({
            text: "✓ ",
            bold: true,
            color: "059669",
            size: 22,
          }),
          new TextRun({
            text: `A Autoridade Nacional de Proteção de Dados (ANPD) foi formalmente comunicada em ${formatDateLong(
              i.anpdNotifiedAt
            )}.`,
            size: 22,
          }),
        ],
      })
    );
  }

  // --------- 5. Direitos do titular ---------
  pushHeading(children, "5. Seus Direitos como Titular");
  pushParagraph(
    children,
    "A LGPD (art. 18) garante a você uma série de direitos sobre seus dados pessoais. Em relação a este incidente, você pode:"
  );
  pushBullet(children, "Solicitar confirmação da existência de tratamento dos seus dados");
  pushBullet(children, "Acessar os dados que temos sobre você");
  pushBullet(children, "Solicitar a correção de dados incompletos, inexatos ou desatualizados");
  pushBullet(children, "Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários");
  pushBullet(children, "Revogar consentimento e solicitar a eliminação dos dados tratados com base nele");
  pushBullet(children, "Solicitar informação sobre com quem compartilhamos seus dados");
  pushBullet(children, "Apresentar reclamação à ANPD (https://www.gov.br/anpd)");

  // --------- 6. Contato ---------
  pushHeading(children, "6. Como Falar Conosco");
  pushParagraph(
    children,
    "Se você tiver dúvidas, quiser saber mais detalhes sobre como o incidente afetou os seus dados especificamente, ou desejar exercer algum dos seus direitos como titular, entre em contato com nosso Encarregado pela Proteção de Dados (DPO):"
  );
  pushKV(children, "Encarregado", input.dpoName ?? "[Nome do Encarregado]");
  pushKV(children, "E-mail", input.dpoEmail ?? "[E-mail do DPO]");
  if (input.dpoPhone) {
    pushKV(children, "Telefone", input.dpoPhone);
  }

  // --------- Fecho ---------
  children.push(
    new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: "Pedimos desculpas pelo ocorrido e reafirmamos nosso compromisso com a proteção dos seus dados pessoais e com a transparência nas nossas operações.",
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "Atenciosamente,", size: 22 }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 100, after: 200 },
      children: [
        new TextRun({
          text: `${formatCity(input.companyAddress)} ${formatDateLong(input.generatedAt)}.`,
          italics: true,
          size: 20,
          color: "555555",
        }),
      ],
    })
  );

  // Linha de assinatura
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 100 },
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
          text: "Encarregado pelo Tratamento de Dados Pessoais (DPO)",
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
        new TextRun({ text: input.companyName, size: 20 }),
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
          size: 16,
          color: "888888",
        }),
      ],
    })
  );

  const doc = new Document({
    creator: "PGP — LGPD",
    title: `Carta aos titulares — ${i.title}`,
    description:
      "Comunicação de incidente de segurança envolvendo dados pessoais aos titulares (Art. 48 §1º LGPD)",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
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
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 24,
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
        new TextRun({ text, bold: true, size: 22, color: "333333" }),
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

function pushParagraph(children: any[], text: string): void {
  const blocks = text.split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split(/\n/);
    const runs: TextRun[] = [];
    lines.forEach((line, idx) => {
      if (idx > 0) runs.push(new TextRun({ break: 1 }));
      runs.push(new TextRun({ text: line, size: 22 }));
    });
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: runs,
      })
    );
  }
}

function pushBullet(children: any[], text: string): void {
  children.push(
    new Paragraph({
      bullet: { level: 0 },
      spacing: { after: 80 },
      children: [new TextRun({ text, size: 22 })],
    })
  );
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

function formatDateLong(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCity(address: string | null): string {
  if (!address) return "";
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "";
  const last = parts[parts.length - 1] ?? "";
  if (/\d{5}/.test(last) || /^[A-Z]{2}$/i.test(last)) {
    return parts.length >= 2 ? `${parts[parts.length - 2]},` : "";
  }
  return `${last},`;
}
