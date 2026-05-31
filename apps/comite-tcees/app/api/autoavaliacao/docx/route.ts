import { NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
} from "docx";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { calcularTcuDiagnostico } from "@/lib/tcu-diagnostico";
import { RESPOSTA_LABEL } from "@/lib/tcu-catalog";

export const maxDuration = 60;

const fmt = (n: number) => n.toFixed(2).replace(".", ",");

function cell(text: string, opts: { bold?: boolean; width?: number; align?: "center" } = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    children: [new Paragraph({
      alignment: opts.align === "center" ? AlignmentType.CENTER : undefined,
      children: [new TextRun({ text, bold: opts.bold, size: 18 })],
    })],
  });
}
function tabela(header: string[], rows: string[][], widths: number[]) {
  const b = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b },
    rows: [
      new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, { bold: true, width: widths[i] })) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, { width: widths[i], align: i > 0 && i >= header.length - 2 ? "center" : undefined })) })),
    ],
  });
}
const h = (t: string, l: (typeof HeadingLevel)[keyof typeof HeadingLevel]) => new Paragraph({ text: t, heading: l, spacing: { before: 240, after: 120 } });
const p = (t: string) => new Paragraph({ children: [new TextRun({ text: t, size: 20 })], spacing: { after: 80 } });

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [diag, comite] = await Promise.all([
    calcularTcuDiagnostico(),
    prisma.comite.findFirst(),
  ]);

  const notaTxt = (q: { resposta: string | null; nota: number | null }) =>
    q.resposta == null ? "— (pendente)" : q.resposta === "NA" ? "Não se aplica" : fmt(q.nota ?? 0);

  const children: any[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: comite?.instituicao ?? "TCE-ES", bold: true, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: comite?.nomeComite ?? "Comitê Executivo de Proteção de Dados Pessoais", size: 22 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "RELATÓRIO DE AUTOAVALIAÇÃO DE ADEQUAÇÃO À LGPD", bold: true, size: 26 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: "Metodologia do TCU — Acórdão 1.384/2022-Plenário (9 dimensões · 42 controles)", italics: true, size: 18 })] }),

    h("1. Sumário", HeadingLevel.HEADING_1),
    p(`Indicador de adequação à LGPD: ${fmt(diag.indicador)} (de 1,00) — nível "${diag.nivel.label}".`),
    p(`Média nacional do conjunto das 382 organizações federais avaliadas pelo TCU: ${fmt(diag.mediaGeral)}. A organização está ${diag.indicador >= diag.mediaGeral ? "ACIMA" : "ABAIXO"} da média nacional.`),
    p(`Controles respondidos: ${diag.respondidas} de ${diag.totalQuestoes} (sendo ${diag.autoCount} preenchidos automaticamente a partir das ferramentas do próprio painel). Pontuação: Sim = 1; Parcialmente = 0,5; Não = 0.`),
    p('Níveis: Inexpressivo (≤ 0,15); Inicial (≤ 0,5); Intermediário (≤ 0,8); Aprimorado (> 0,8).'),

    h("2. Resumo por dimensão", HeadingLevel.HEADING_1),
    tabela(
      ["Dimensão", "Organização", "Média nacional"],
      [
        ...diag.dimensoes.map((d) => [d.nome, fmt(d.valor), fmt(d.media)]),
        ["INDICADOR DE ADEQUAÇÃO À LGPD", fmt(diag.indicador), fmt(diag.mediaGeral)],
      ],
      [60, 20, 20],
    ),

    h("3. Detalhamento por dimensão", HeadingLevel.HEADING_1),
  ];

  for (const d of diag.dimensoes) {
    children.push(h(`${d.nome} — ${fmt(d.valor)} (média nacional ${fmt(d.media)})`, HeadingLevel.HEADING_2));
    children.push(
      tabela(
        ["Cód.", "Controle", "Resposta", "Nota", "Média"],
        d.questoes.map((q) => [
          q.code, q.texto,
          q.resposta == null ? "Pendente" : RESPOSTA_LABEL[q.resposta],
          notaTxt(q), fmt(q.media),
        ]),
        [8, 56, 16, 10, 10],
      ),
    );
  }

  children.push(h("4. Encerramento", HeadingLevel.HEADING_1));
  children.push(p("Relatório gerado automaticamente pelo painel do Comitê, com base na metodologia de autoavaliação de controles do TCU. Documento de apoio à prestação de contas e ao monitoramento contínuo da adequação à LGPD; recomenda-se sua divulgação no portal institucional, em atenção ao princípio da transparência."));

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="Autoavaliacao_LGPD_TCU_Comite_TCEES.docx"',
    },
  });
}
