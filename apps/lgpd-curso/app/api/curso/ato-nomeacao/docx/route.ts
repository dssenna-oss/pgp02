// GET /api/curso/ato-nomeacao/docx
// Gera o Ato de Nomeação formal do Encarregado pelo Tratamento de Dados
// Pessoais (Art. 41 LGPD). Estilo de portaria/ato administrativo formal,
// pronto pra impressão e assinatura da autoridade máxima do órgão.
//
// Requer DPO cadastrado (Nome + E-mail + Telefone). Justificativa entra
// no corpo se preenchida; senão usa texto institucional padrão.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureColunaDpoJustificativa } from "@/lib/coluna-dpo-justificativa";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  const companyId = session?.user?.companyId;
  if (!companyId) {
    return NextResponse.json({ error: "Sem empresa associada" }, { status: 403 });
  }

  await ensureColunaDpoJustificativa();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      name: true,
      cnpj: true,
      cidade: true,
      orgao: true,
      dpoName: true,
      dpoEmail: true,
      dpoTelefone: true,
      dpoEndereco: true,
      dpoJustificativaEscolha: true,
    },
  });
  if (!company) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }
  if (!company.dpoName || !company.dpoEmail || !company.dpoTelefone) {
    return NextResponse.json(
      { error: "Cadastre Nome, E-mail e Telefone do Encarregado antes de gerar o Ato." },
      { status: 400 },
    );
  }

  const cidade = company.cidade || "Vegas";
  const hoje = new Date();
  const dataPorExtenso = hoje.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const ano = hoje.getFullYear();
  const numeroPortaria = `${String(hoje.getMonth() + 1).padStart(2, "0")}/${ano}`;

  // Cabeçalho de tratamento varia conforme órgão
  const autoridade =
    company.orgao === "CM"
      ? `O(A) PRESIDENTE DA CÂMARA MUNICIPAL DE ${cidade.toUpperCase()}`
      : `O(A) PREFEITO(A) MUNICIPAL DE ${cidade.toUpperCase()}`;

  // Texto institucional padrão pra justificativa se o grupo não preencheu
  const justificativaTexto = company.dpoJustificativaEscolha?.trim()
    ? company.dpoJustificativaEscolha.trim()
    : "Servidor(a) com perfil técnico-jurídico compatível, autonomia funcional e acesso direto à alta administração, atendendo às recomendações da Autoridade Nacional de Proteção de Dados — ANPD (Resolução CD/ANPD nº 18/2024) para a designação do Encarregado em órgãos da Administração Pública.";

  // Helpers de parágrafo
  const p = (texto: string, opts: { bold?: boolean; align?: typeof AlignmentType[keyof typeof AlignmentType]; size?: number; spacingAfter?: number; italics?: boolean } = {}) =>
    new Paragraph({
      alignment: opts.align,
      spacing: { after: opts.spacingAfter ?? 200 },
      children: [
        new TextRun({
          text: texto,
          bold: opts.bold,
          italics: opts.italics,
          size: opts.size ?? 22, // 11pt
        }),
      ],
    });

  const children: Paragraph[] = [
    // Título
    p(`ATO DE DESIGNAÇÃO Nº ${numeroPortaria}`, { bold: true, align: AlignmentType.CENTER, size: 28, spacingAfter: 100 }),
    p(`(Designação do Encarregado pelo Tratamento de Dados Pessoais)`, { align: AlignmentType.CENTER, italics: true, size: 22, spacingAfter: 400 }),

    // Ementa
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 4000 },
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Designa o(a) Encarregado(a) pelo Tratamento de Dados Pessoais (DPO) de ${company.name}, em cumprimento ao art. 41 da Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD).`,
          italics: true,
          size: 22,
        }),
      ],
    }),

    // Considerandos
    p(`${autoridade}, no uso de suas atribuições legais e regimentais,`, { spacingAfter: 200 }),
    p("CONSIDERANDO que a Lei nº 13.709, de 14 de agosto de 2018 (Lei Geral de Proteção de Dados Pessoais — LGPD), em seu art. 41, determina ao controlador a indicação de Encarregado pelo Tratamento de Dados Pessoais;", { align: AlignmentType.JUSTIFIED, spacingAfter: 200 }),
    p("CONSIDERANDO o disposto na Resolução CD/ANPD nº 18, de 16 de julho de 2024, que regulamenta a atuação do Encarregado pelo Tratamento de Dados Pessoais no âmbito de aplicação da LGPD;", { align: AlignmentType.JUSTIFIED, spacingAfter: 200 }),
    p(`CONSIDERANDO a necessidade de estabelecer canal formal de comunicação com a Autoridade Nacional de Proteção de Dados — ANPD e com os titulares de dados pessoais tratados no âmbito de ${company.name};`, { align: AlignmentType.JUSTIFIED, spacingAfter: 400 }),

    // Resolve
    p("RESOLVE:", { bold: true, align: AlignmentType.CENTER, spacingAfter: 300 }),

    // Art. 1
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "Art. 1º ", bold: true, size: 22 }),
        new TextRun({
          text: `Designar ${company.dpoName} como Encarregado(a) pelo Tratamento de Dados Pessoais de ${company.name}, nos termos do art. 41 da Lei nº 13.709/2018 — LGPD.`,
          size: 22,
        }),
      ],
    }),

    // Parágrafo único Art. 1 — contatos
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "Parágrafo único. ", bold: true, italics: true, size: 22 }),
        new TextRun({
          text: `O canal de comunicação com o(a) Encarregado(a) ora designado(a), para efeito do art. 41, §2º da LGPD, fica estabelecido pelos seguintes meios: e-mail ${company.dpoEmail}, telefone ${company.dpoTelefone}${company.dpoEndereco ? `, com atendimento presencial em ${company.dpoEndereco}` : ""}.`,
          italics: true,
          size: 22,
        }),
      ],
    }),

    // Art. 2 - justificativa da escolha
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "Art. 2º ", bold: true, size: 22 }),
        new TextRun({
          text: `A escolha do(a) Encarregado(a) ora designado(a) considerou os seguintes fundamentos: ${justificativaTexto}`,
          size: 22,
        }),
      ],
    }),

    // Art. 3 - atribuições
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "Art. 3º ", bold: true, size: 22 }),
        new TextRun({
          text: "Compete ao(à) Encarregado(a) designado(a), conforme art. 41, §2º da LGPD:",
          size: 22,
        }),
      ],
    }),
    p("I — aceitar reclamações e comunicações dos titulares, prestar esclarecimentos e adotar providências;", { align: AlignmentType.JUSTIFIED, spacingAfter: 100 }),
    p("II — receber comunicações da Autoridade Nacional de Proteção de Dados — ANPD e adotar providências;", { align: AlignmentType.JUSTIFIED, spacingAfter: 100 }),
    p("III — orientar os funcionários e contratados quanto às práticas a serem tomadas em relação à proteção de dados pessoais;", { align: AlignmentType.JUSTIFIED, spacingAfter: 100 }),
    p("IV — executar as demais atribuições determinadas pelo controlador ou estabelecidas em normas complementares.", { align: AlignmentType.JUSTIFIED, spacingAfter: 300 }),

    // Art. 4 - vigência
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600 },
      children: [
        new TextRun({ text: "Art. 4º ", bold: true, size: 22 }),
        new TextRun({
          text: "Este ato entra em vigor na data de sua publicação, revogadas as disposições em contrário.",
          size: 22,
        }),
      ],
    }),

    // Local e data
    p(`${cidade}, ${dataPorExtenso}.`, { align: AlignmentType.RIGHT, spacingAfter: 800 }),

    // Assinatura
    p("_______________________________________", { align: AlignmentType.CENTER, spacingAfter: 100 }),
    p(autoridade.replace("O(A) ", "").replace(/MUNICIPAL DE .*/i, "Municipal"), {
      align: AlignmentType.CENTER,
      bold: true,
      spacingAfter: 50,
    }),
    p("(Autoridade máxima do órgão)", { align: AlignmentType.CENTER, italics: true, size: 18, spacingAfter: 600 }),

    // Ciência do designado
    p("CIENTE E DE ACORDO:", { bold: true, spacingAfter: 600 }),
    p("_______________________________________", { spacingAfter: 100 }),
    p(company.dpoName, { bold: true, spacingAfter: 50 }),
    p("Encarregado(a) pelo Tratamento de Dados Pessoais", { italics: true, size: 18 }),
  ];

  const doc = new Document({
    creator: "PGP Treinamento — Curso prático de LGPD",
    title: `Ato de Designação ${numeroPortaria} — Encarregado(a) de Dados Pessoais`,
    description: `Ato formal de designação do Encarregado de ${company.name}`,
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
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
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
  const nomeArquivo = `Ato_Designacao_Encarregado_${company.name.replace(/[^a-zA-Z0-9]+/g, "_")}.docx`;
  return new NextResponse(ab, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
