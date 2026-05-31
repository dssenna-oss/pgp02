import { NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
} from "docx";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { calcularIndicadoresAuto } from "@/lib/indicadores-auto";

export const maxDuration = 60;

const STATUS_LABEL: Record<string, string> = {
  CONCLUIDO: "Concluído",
  EM_ANDAMENTO: "Em andamento",
  A_INICIAR: "A iniciar",
  ATRASADO: "Atrasado",
  CRITICO: "Crítico",
  EM_RISCO: "Em risco",
};

function cell(text: string, opts: { bold?: boolean; width?: number } = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold: opts.bold, size: 18 })] })],
  });
}

function tabela(header: string[], rows: string[][], widths: number[]) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [
      new TableRow({
        tableHeader: true,
        children: header.map((h, i) => cell(h, { bold: true, width: widths[i] })),
      }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, { width: widths[i] })) })),
    ],
  });
}

function h(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });
}

function p(text: string) {
  return new Paragraph({ children: [new TextRun({ text, size: 20 })], spacing: { after: 80 } });
}

export async function GET() {
  try {
    await requireSession();
  } catch (e: any) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [comite, eixos, entregas, marcos, indicadores, auto] = await Promise.all([
    prisma.comite.findFirst(),
    prisma.eixo.findMany({ orderBy: { ordem: "asc" } }),
    prisma.entrega.findMany({ orderBy: { ordem: "asc" } }),
    prisma.marco.findMany({ orderBy: { ordem: "asc" } }),
    prisma.indicador.findMany({ orderBy: { ordem: "asc" } }),
    calcularIndicadoresAuto(),
  ]);

  const total = entregas.length;
  const concl = entregas.filter((e) => e.status === "CONCLUIDO").length;
  const exec = total ? Math.round((concl / total) * 100) : 0;

  const children: Paragraph[] | any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: comite?.instituicao ?? "TCEES", bold: true, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: comite?.nomeComite ?? "Comitê Executivo de Proteção de Dados Pessoais", size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({ text: `RELATÓRIO ANUAL DE RESULTADOS — Biênio ${comite?.bienio ?? "2026-2027"}`, bold: true, size: 26 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: "Em atendimento ao art. 4º, § 3º, da Portaria Normativa TCEES nº 22, de 27 de março de 2026.",
          italics: true,
          size: 18,
        }),
      ],
    }),

    h("1. Sumário executivo", HeadingLevel.HEADING_1),
    p(`Execução geral do Plano de Trabalho: ${exec}% (${concl} de ${total} entregas concluídas).`),
    p(`Marco-mãe do biênio: ${comite?.marcoMae ?? "PGP consolidado"} — prazo ${comite?.marcoMaePrazo ? new Date(comite.marcoMaePrazo).toLocaleDateString("pt-BR") : "31/12/2026"}.`),

    h("2. Marcos críticos do biênio", HeadingLevel.HEADING_1),
    tabela(
      ["Data", "Entrega", "Eixo(s)", "Status"],
      marcos.map((m) => [
        new Date(m.data).toLocaleDateString("pt-BR"),
        m.descricao,
        m.eixoCodigos,
        STATUS_LABEL[m.status] ?? m.status,
      ]),
      [14, 56, 12, 18],
    ),

    h("3. Andamento das entregas por eixo", HeadingLevel.HEADING_1),
  ];

  for (const eixo of eixos) {
    const doEixo = entregas.filter((e) => e.eixoCodigo === eixo.codigo);
    const ok = doEixo.filter((e) => e.status === "CONCLUIDO").length;
    children.push(h(`Eixo ${eixo.codigo} — ${eixo.nome} (${ok}/${doEixo.length} concluídas)`, HeadingLevel.HEADING_2));
    children.push(
      tabela(
        ["Entrega", "Responsável", "Prazo", "Status"],
        doEixo.map((e) => [e.titulo, e.responsavel ?? "—", e.prazoTexto ?? "—", STATUS_LABEL[e.status] ?? e.status]),
        [46, 28, 12, 14],
      ),
    );
  }

  children.push(h("4. Quadro de indicadores de monitoramento", HeadingLevel.HEADING_1));
  children.push(
    p(
      "Valores marcados com (auto) são apurados automaticamente a partir das ferramentas das Fases do PGP; os demais são informados pelo Comitê.",
    ),
  );
  children.push(
    tabela(
      ["Cód.", "Indicador", "Meta 2026", "Meta 2027", "Atual"],
      indicadores.map((i) => {
        const a = auto[i.codigo];
        const atual = a ? `${a.valor} (auto)` : i.valorAtual ?? "—";
        return [i.codigo, i.descricao, i.meta2026 ?? "—", i.meta2027 ?? "—", atual];
      }),
      [8, 50, 16, 16, 10],
    ),
  );

  children.push(h("5. Encerramento", HeadingLevel.HEADING_1));
  children.push(
    p(
      "Relatório gerado automaticamente pelo painel do Comitê a partir dos dados de execução do Plano de Trabalho. Documento de apoio à prestação de contas anual à SEGOV.",
    ),
  );

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="Relatorio_Anual_Comite_LGPD_TCEES.docx"',
    },
  });
}
