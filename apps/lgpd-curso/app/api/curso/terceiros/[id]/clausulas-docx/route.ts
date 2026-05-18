// GET /api/curso/terceiros/[id]/clausulas-docx
// Gera o DOCX do Aditamento de Tratamento de Dados Pessoais para o operador,
// incluindo apenas as cláusulas que o DPO selecionou.
//
// Tipo do documento:
//   - ADITIVO_NECESSARIO / RENOVACAO_ADITIVAR  → "ADITAMENTO"
//   - CONTRATO_NOVO_CLAUSULAS / _ALTO_RISCO    → "ANEXO" (contrato novo)

import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } from "docx";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { CATALOGO_CLAUSULAS, tituloDocumentoPorTipo } from "@/lib/clausulas-lgpd";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function P(text: string, opts: { bold?: boolean; align?: any; size?: number; spacingBefore?: number; spacingAfter?: number } = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold: opts.bold, size: opts.size })],
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { before: opts.spacingBefore ?? 80, after: opts.spacingAfter ?? 120, line: 300 },
  });
}

function H(text: string, level: 1 | 2 = 1) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: level === 1 ? 28 : 24, color: "1F3864" })],
    heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 120 },
  });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId } = await requireCompany();

    const [company, op] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true, cnpj: true },
      }),
      prisma.operator.findFirst({
        where: { id: params.id, companyId },
        include: { contracts: true },
      }),
    ]);

    if (!company) {
      return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });
    }
    if (!op) {
      return NextResponse.json({ error: "Operador não encontrado" }, { status: 404 });
    }

    const contract = op.contracts[0];
    if (!contract) {
      return NextResponse.json({ error: "Operador sem contrato cadastrado" }, { status: 400 });
    }

    const idsSelecionados: string[] = (contract.clausulasSelecionadas as any) || [];
    if (idsSelecionados.length === 0) {
      return NextResponse.json({ error: "Selecione pelo menos uma cláusula antes de gerar o documento." }, { status: 400 });
    }

    const clausulas = CATALOGO_CLAUSULAS.filter((c) => idsSelecionados.includes(c.id));
    const wrapper = tituloDocumentoPorTipo(contract.tipoOperacao);

    const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    const paragrafos: Paragraph[] = [
      // Cabeçalho
      new Paragraph({
        children: [new TextRun({ text: wrapper.cabecalho, bold: true, size: 32, color: "1F3864" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 360 },
      }),
      // Preâmbulo + qualificação das partes
      P(wrapper.preambulo),
      P(""),
      H("Qualificação das Partes", 2),
      P(
        `Pelo presente instrumento, ${company.name || "[CONTRATANTE]"}, ` +
        `pessoa jurídica de direito público interno, inscrita no CNPJ sob o nº [.], ` +
        `aqui representada na forma de seus atos institucionais (doravante "CONTRATANTE"), ` +
        `e, de outro lado, ${op.nome}, inscrita no CNPJ sob o nº ${op.cnpj || "[.]"}, ` +
        `aqui representada na forma de seus atos societários (doravante "CONTRATADO"),`
      ),
      P(
        'Sendo a CONTRATANTE e o CONTRATADO conjuntamente denominados "Partes", ou "Parte" quando consideradas isoladamente,'
      ),
      P("CONSIDERANDO QUE:", { bold: true, spacingBefore: 200 }),
      P(
        `(a) As Partes celebraram o contrato nº ${contract.numero || "[NÚMERO]"}, ` +
        `cujo objeto é: ${contract.objeto || "[OBJETO]"};`
      ),
      P(
        wrapper.isAditamento
          ? "(b) As Partes concordaram em celebrar o presente Aditamento, com o propósito de complementar o Contrato, " +
            "a fim de reger os termos e condições aplicáveis para o Tratamento de Dados Pessoais conforme a LGPD;"
          : "(b) As Partes desejam estabelecer expressamente as obrigações relativas ao Tratamento de Dados Pessoais " +
            "que serão executadas no âmbito do Contrato, em conformidade com a LGPD;"
      ),
      P("Resolvem as Partes celebrar o presente instrumento, que será regido nos termos abaixo:", { spacingBefore: 120 }),

      // Cláusulas selecionadas
      new Paragraph({ children: [new PageBreak()] }),
      H("Cláusulas de Proteção de Dados Pessoais", 1),
    ];

    let i = 1;
    for (const cl of clausulas) {
      paragrafos.push(H(`${i}. ${cl.titulo}`, 2));
      // Quebra o texto por parágrafos (\n\n) pra ficar legível no Word
      const blocos = cl.textoCompleto.split("\n\n");
      for (const bloco of blocos) {
        paragrafos.push(P(bloco));
      }
      i++;
    }

    // Disposições finais
    paragrafos.push(H("Disposições Finais", 2));
    paragrafos.push(P(
      "As Partes concordam que as condições previstas neste instrumento, mediante sua assinatura, serão " +
      "automaticamente consideradas parte integrante e indissociável do Contrato, para todos os fins."
    ));
    paragrafos.push(P(
      "Na hipótese de conflito ou ambiguidade entre os termos e condições deste instrumento e o Contrato " +
      "ou outros anexos, especificamente no que se refere a atividades de Tratamento de Dados Pessoais, " +
      "prevalecerão os termos e condições aqui estabelecidos."
    ));

    // Assinaturas
    paragrafos.push(new Paragraph({ children: [new PageBreak()] }));
    paragrafos.push(P(`Vegas, ${hoje}.`, { align: AlignmentType.RIGHT, spacingBefore: 480 }));
    paragrafos.push(P(""));
    paragrafos.push(P(""));
    paragrafos.push(P("____________________________________________", { align: AlignmentType.CENTER, spacingBefore: 240 }));
    paragrafos.push(P(`${company.name || "CONTRATANTE"}`, { align: AlignmentType.CENTER, bold: true }));
    paragrafos.push(P("CONTRATANTE", { align: AlignmentType.CENTER }));
    paragrafos.push(P(""));
    paragrafos.push(P("____________________________________________", { align: AlignmentType.CENTER, spacingBefore: 240 }));
    paragrafos.push(P(`${op.nome}`, { align: AlignmentType.CENTER, bold: true }));
    paragrafos.push(P("CONTRATADO", { align: AlignmentType.CENTER }));
    paragrafos.push(P(""));
    paragrafos.push(P("Testemunhas:", { spacingBefore: 240 }));
    paragrafos.push(P("1. _____________________________________  CPF: _________________"));
    paragrafos.push(P("2. _____________________________________  CPF: _________________"));

    const doc = new Document({
      creator: company.name || "PGP Treinamento",
      title: `${wrapper.cabecalho} — ${op.nome}`,
      sections: [
        {
          properties: {},
          children: paragrafos,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    const filename = `${wrapper.isAditamento ? "Aditamento" : "Anexo_LGPD"}_${op.nome.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40)}.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    console.error("[clausulas-docx] erro:", e);
    return NextResponse.json({ error: e.message || "Erro ao gerar DOCX" }, { status: 500 });
  }
}
