// Gera o .docx de um documento preenchido (markdown simples → Word).
// Entende as mesmas marcas do renderer de tela: ## / ### / - lista /
// | tabela | / **negrito** / [PLACEHOLDER] (vira VERMELHO no Word, como no
// Pacote oficial — sinaliza "falta completar").

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const COR_TITULO = "0F766E"; // teal — identidade do Pacote/Jornada
const COR_PLACEHOLDER = "DC2626"; // vermelho — campos ainda em aberto

// Inline: **negrito** e [PLACEHOLDER] viram runs próprios.
function runs(texto: string, base?: { bold?: boolean; size?: number }): TextRun[] {
  const out: TextRun[] = [];
  texto.split(/(\*\*[^*]+\*\*)/g).forEach((peda) => {
    const ehNegrito = peda.startsWith("**") && peda.endsWith("**");
    const conteudo = ehNegrito ? peda.slice(2, -2) : peda;
    conteudo.split(/(\[[^\]\n]+\])/g).forEach((parte) => {
      if (!parte) return;
      const ehPlaceholder = parte.startsWith("[") && parte.endsWith("]");
      out.push(
        new TextRun({
          text: parte,
          bold: base?.bold || ehNegrito || ehPlaceholder,
          size: base?.size ?? 22,
          color: ehPlaceholder ? COR_PLACEHOLDER : undefined,
        }),
      );
    });
  });
  return out;
}

function tabela(linhas: string[]): Table {
  const rows = linhas.map(
    (l) =>
      new TableRow({
        children: l
          .replace(/^\|\s?/, "")
          .replace(/\s?\|$/, "")
          .split(/\s\|\s/)
          .map(
            (cel) =>
              new TableCell({
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
                children: [new Paragraph({ children: runs(cel.trim()) })],
              }),
          ),
      }),
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
    },
    rows,
  });
}

export async function gerarDocxDocumento(opts: {
  tituloModelo: string;
  numeroModelo: number;
  instituicaoNome: string;
  mdPreenchido: string;
}): Promise<Buffer> {
  const filhos: (Paragraph | Table)[] = [];

  filhos.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: opts.tituloModelo, bold: true, size: 34, color: COR_TITULO }),
      ],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `${opts.instituicaoNome} · Modelo ${String(opts.numeroModelo).padStart(2, "0")} do Pacote do PGP · gerado pela Jornada LGPD (Clube do Servidor)`,
          italics: true,
          size: 18,
          color: "64748B",
        }),
      ],
    }),
  );

  let bufferTabela: string[] = [];
  const descarrega = () => {
    if (bufferTabela.length) {
      filhos.push(tabela(bufferTabela));
      filhos.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
      bufferTabela = [];
    }
  };

  for (const linhaBruta of opts.mdPreenchido.split("\n")) {
    const linha = linhaBruta.trim();
    if (linha.startsWith("|")) {
      bufferTabela.push(linha);
      continue;
    }
    descarrega();
    if (!linha) continue;
    if (linha.startsWith("## ")) {
      filhos.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: linha.slice(3), bold: true, size: 26, color: COR_TITULO })],
        }),
      );
      continue;
    }
    if (linha.startsWith("### ")) {
      filhos.push(
        new Paragraph({
          spacing: { before: 160, after: 80 },
          children: [new TextRun({ text: linha.slice(4), bold: true, size: 23 })],
        }),
      );
      continue;
    }
    if (linha.startsWith("- ")) {
      filhos.push(
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: 360 },
          children: [new TextRun({ text: "• ", size: 22 }), ...runs(linha.slice(2))],
        }),
      );
      continue;
    }
    filhos.push(
      new Paragraph({
        spacing: { after: 100 },
        alignment: AlignmentType.JUSTIFIED,
        children: runs(linha),
      }),
    );
  }
  descarrega();

  const doc = new Document({ sections: [{ children: filhos }] });
  return Packer.toBuffer(doc);
}
