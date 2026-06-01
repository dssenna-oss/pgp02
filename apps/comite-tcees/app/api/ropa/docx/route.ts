import { NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
} from "docx";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { riscoMaximo, completudeAtividade, type RopaAtividade } from "@/lib/ropa";

export const maxDuration = 60;

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };

function linha(label: string, valor: string | null) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 32, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9" },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18 })] })],
      }),
      new TableCell({
        width: { size: 68, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: valor && valor.trim() ? valor : "—", size: 18 })] })],
      }),
    ],
  });
}

function tabelaAtividade(a: RopaAtividade) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [
      linha("Unidade gestora", a.unidadeGestora),
      linha("Finalidade", a.finalidade),
      linha("Base legal", a.baseLegal),
      linha("Categorias de titulares", a.categoriasTitulares),
      linha("Dados pessoais tratados", a.tiposDados),
      linha("Dados sensíveis (art. 11)", a.dadosSensiveis ? "Sim" : "Não"),
      linha("Fonte dos dados", a.fonteDados),
      linha("Compartilhamento externo", a.compartilhamento),
      linha("Destinatários internos", a.destinatariosInternos),
      linha("Transferência internacional", a.transfInternacional || "Não há"),
      linha("Prazo de retenção", a.retencao),
      linha("Critério de descarte", a.criterioDescarte),
      linha("Medidas de segurança", a.medidasSeguranca),
      linha("Nível de risco / RIPD", a.riscoMax === "ALTO" ? "ALTO — RIPD exigido" : a.riscoMax ? a.riscoMax.toLowerCase() : "não avaliado"),
    ],
  });
}

export async function GET() {
  await requireSession();

  const [processos, comite, encarregado] = await Promise.all([
    prisma.dataInventory.findMany({
      orderBy: { ordem: "asc" },
      include: { riscos: { select: { probabilidade: true, impacto: true } } },
    }),
    prisma.comite.findFirst(),
    prisma.membro.findFirst({ where: { funcao: { contains: "Encarregado" } }, orderBy: { ordem: "asc" }, select: { nome: true, email: true } }),
  ]);

  const atividades: RopaAtividade[] = processos.map((p) => ({
    id: p.id, nome: p.nome, unidadeGestora: p.unidadeGestora, finalidade: p.finalidade,
    baseLegal: p.baseLegal, tiposDados: p.tiposDados, dadosSensiveis: p.dadosSensiveis,
    categoriasTitulares: p.categoriasTitulares, fonteDados: p.fonteDados, compartilhamento: p.compartilhamento,
    destinatariosInternos: p.destinatariosInternos, transfInternacional: p.transfInternacional,
    retencao: p.retencao, criterioDescarte: p.criterioDescarte, medidasSeguranca: p.medidasSeguranca,
    riscoMax: riscoMaximo(p.riscos),
  }));

  const completas = atividades.filter((a) => completudeAtividade(a).completa).length;

  const body: (Paragraph | Table)[] = [];

  // Título
  body.push(new Paragraph({ text: "Registro das Operações de Tratamento (ROPA)", heading: HeadingLevel.TITLE }));
  body.push(new Paragraph({ children: [new TextRun({ text: "Art. 37 da LGPD — formato do template ANPD", italics: true, size: 20, color: "666666" })] }));
  body.push(new Paragraph({ text: "" }));

  // Cabeçalho organizacional
  body.push(new Paragraph({ text: "1. Dados do controlador", heading: HeadingLevel.HEADING_1 }));
  body.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [
      linha("Controlador", comite?.instituicao ?? "—"),
      linha("CNPJ", comite?.cnpj ?? "—"),
      linha("Sede", comite?.sede ?? "—"),
      linha("Encarregado (DPO)", encarregado?.nome ?? "—"),
      linha("Contato do Encarregado", encarregado?.email ?? comite?.canalEncarregado ?? "—"),
      linha("Atividades registradas", `${atividades.length} (${completas} com registro completo)`),
    ],
  }));
  body.push(new Paragraph({ text: "" }));

  // Uma seção por atividade
  body.push(new Paragraph({ text: "2. Atividades de tratamento", heading: HeadingLevel.HEADING_1 }));
  atividades.forEach((a, i) => {
    body.push(new Paragraph({ text: `2.${i + 1}. ${a.nome}`, heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
    body.push(tabelaAtividade(a));
  });

  if (atividades.length === 0) {
    body.push(new Paragraph({ children: [new TextRun({ text: "Nenhuma atividade de tratamento registrada.", italics: true })] }));
  }

  const doc = new Document({ sections: [{ children: body }] });
  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="ROPA_TCEES_Art37.docx"`,
    },
  });
}
