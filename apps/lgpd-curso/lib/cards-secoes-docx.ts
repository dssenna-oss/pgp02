// Kit de Cards das 7 Seções da LGPD (jogo de memorização) — imprimível/cortável.
//
// Complementa a atividade digital "secoes-lgpd" (lib/atividades-c.ts): o grupo
// recebe os 7 cards físicos, ordena-os na mesa (do Art. 1º ao 65) e confirma a
// ordem no celular; o telão mostra quantos grupos acertaram a sequência.
//
// Reusa o padrão docx-js do projeto (cor índigo da Modalidade C). Cada card tem
// header colorido por seção, faixa de artigos, artigos-chave e dica de memória.

import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} from "docx";

// Cor base (índigo da Modalidade C — alinha com as outras peças do facilitador)
const COR_TITULO = "4338CA";
const COR_ACCENT = "6366F1";

// -----------------------------------------------------------------------------
// CONTEÚDO — as 7 seções (a ordem do array = ordem correta da lei)
// -----------------------------------------------------------------------------
type Secao = {
  numero: number;
  emoji: string;
  titulo: string;
  faixa: string;
  trata: string;
  corHeader: string; // hex sem '#'
  artigos: string[];
  dica: string;
};

const SECOES: Secao[] = [
  {
    numero: 1,
    emoji: "🗺️",
    titulo: "O Território e as Regras do Jogo",
    faixa: "Arts. 1º a 6º",
    trata: "Onde a lei se aplica, por que ela existe e o vocabulário básico.",
    corHeader: "1E3A5F",
    artigos: [
      "Art. 1º — Objeto e âmbito de aplicação",
      "Art. 2º — Fundamentos da proteção de dados",
      "Art. 5º — Definições (dado pessoal, sensível, titular)",
      "Art. 6º — Princípios (finalidade, necessidade...)",
    ],
    dica: "É o mapa: antes de jogar, conheça o terreno e as palavras.",
  },
  {
    numero: 2,
    emoji: "🔑",
    titulo: "O Pedágio e as Chaves de Acesso",
    faixa: "Arts. 7º a 16",
    trata: "Quando é permitido tratar dados — as 'chaves' que liberam o uso.",
    corHeader: "166534",
    artigos: [
      "Art. 7º — As 10 bases legais (dados comuns)",
      "Art. 11 — Dados sensíveis (chaves especiais)",
      "Art. 14 — Dados de crianças e adolescentes",
      "Arts. 15-16 — Término do tratamento",
    ],
    dica: "Sem uma chave (base legal) válida, o pedágio não abre.",
  },
  {
    numero: 3,
    emoji: "🦸",
    titulo: "O Herói da História",
    faixa: "Arts. 17 a 22",
    trata: "O titular dos dados e os direitos que ele pode exercer.",
    corHeader: "9A3412",
    artigos: [
      "Art. 17 — O titular é o dono dos seus dados",
      "Art. 18 — Os 9 direitos (acesso, correção...)",
      "Art. 20 — Revisão de decisões automatizadas",
      "Art. 21 — Dados não usados contra o titular",
    ],
    dica: "A pessoa (o herói) está no centro: a lei protege ela.",
  },
  {
    numero: 4,
    emoji: "🏛️",
    titulo: "A Casa de Vidro",
    faixa: "Arts. 23 a 32",
    trata: "Como o Poder Público trata dados — com transparência total.",
    corHeader: "581C87",
    artigos: [
      "Art. 23 — Tratamento pelo Poder Público",
      "Art. 26 — Uso compartilhado de dados",
      "Art. 27 — Comunicação a entes privados",
      "Art. 32 — ANPD e segurança no setor público",
    ],
    dica: "Órgão público é casa de vidro: todos podem ver como age.",
  },
  {
    numero: 5,
    emoji: "🛂",
    titulo: "O Passaporte e a Linha de Produção",
    faixa: "Arts. 33 a 40",
    trata: "Dados que cruzam fronteiras e quem é quem na 'fábrica' de dados.",
    corHeader: "9F1239",
    artigos: [
      "Art. 33 — Transferência internacional de dados",
      "Art. 37 — Registro das operações (ROPA)",
      "Art. 38 — Relatório de Impacto (RIPD)",
      "Art. 39 — Operador segue o controlador",
    ],
    dica: "Passaporte = sair do país; linha de produção = quem opera os dados.",
  },
  {
    numero: 6,
    emoji: "🏰",
    titulo: "O Quartel de Segurança",
    faixa: "Arts. 41 a 51",
    trata: "Quem comanda a proteção, como blindar os dados e boas práticas.",
    corHeader: "78350F",
    artigos: [
      "Art. 41 — Encarregado (DPO), o comandante",
      "Arts. 42-45 — Responsabilidade e ressarcimento",
      "Art. 46 — Segurança e sigilo dos dados",
      "Arts. 48 e 50 — Incidentes e boas práticas",
    ],
    dica: "O quartel defende a fortaleza: DPO no comando, muros (segurança).",
  },
  {
    numero: 7,
    emoji: "⚖️",
    titulo: "O Juízo Final",
    faixa: "Arts. 52 a 65",
    trata: "O que acontece quem descumpre: fiscalização, multas e o fecho da lei.",
    corHeader: "1E1B4B",
    artigos: [
      "Art. 52 — Sanções (multa até 2% / R$ 50 mi)",
      "Art. 55-A — ANPD (Autoridade Nacional)",
      "Art. 58-B — Conselho Nacional (CNPD)",
      "Art. 65 — Vigência da lei",
    ],
    dica: "No fim, vem o julgamento: quem errou responde.",
  },
];

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------
function p(
  texto: string,
  opts: { bold?: boolean; italics?: boolean; size?: number; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacingAfter?: number } = {},
): Paragraph {
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.spacingAfter ?? 120 },
    children: [new TextRun({ text: texto, bold: opts.bold, italics: opts.italics, size: opts.size ?? 22, color: opts.color })],
  });
}
function h1(texto: string, pageBreak = true): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    pageBreakBefore: pageBreak,
    children: [new TextRun({ text: texto, bold: true, size: 34, color: COR_TITULO })],
  });
}
function semBorda() {
  const n = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: n, bottom: n, left: n, right: n };
}

function docBase(title: string, children: (Paragraph | Table)[]): Document {
  return new Document({
    creator: "PGP Treinamento — Curso prático de LGPD",
    title,
    description: "Kit de Cards das 7 Seções da LGPD (jogo de memorização).",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
        heading1: { run: { font: "Calibri", size: 34, bold: true, color: COR_TITULO }, paragraph: { spacing: { before: 360, after: 200 } } },
      },
    },
    sections: [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children }],
  });
}

// Um card cortável (header colorido por seção + corpo branco)
function cardSecaoCell(s: Secao): TableCell {
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 14, color: s.corHeader },
      bottom: { style: BorderStyle.SINGLE, size: 14, color: s.corHeader },
      left: { style: BorderStyle.SINGLE, size: 14, color: s.corHeader },
      right: { style: BorderStyle.SINGLE, size: 14, color: s.corHeader },
    },
    children: [
      // Header colorido: emoji + "SEÇÃO N"
      new Paragraph({
        shading: { type: ShadingType.CLEAR, fill: s.corHeader },
        spacing: { before: 120, after: 60 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `${s.emoji}   SEÇÃO ${s.numero}`, bold: true, size: 30, color: "FFFFFF" })],
      }),
      // Faixa de artigos (chip)
      new Paragraph({
        shading: { type: ShadingType.CLEAR, fill: s.corHeader },
        spacing: { after: 120 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: s.faixa, bold: true, size: 22, color: "FFFFFF" })],
      }),
      // Título da metáfora
      new Paragraph({
        spacing: { before: 80, after: 60 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: s.titulo, bold: true, size: 24, color: s.corHeader })],
      }),
      // O que trata
      new Paragraph({
        spacing: { after: 120 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: s.trata, italics: true, size: 18, color: "475569" })],
      }),
      // Artigos-chave
      ...s.artigos.map(
        (a) =>
          new Paragraph({
            spacing: { after: 40 },
            indent: { left: 140 },
            children: [new TextRun({ text: `▸ ${a}`, size: 18, color: "1E293B" })],
          }),
      ),
      // Dica de memorização
      new Paragraph({
        shading: { type: ShadingType.CLEAR, fill: "F1F5F9" },
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: `💡 ${s.dica}`, size: 17, color: "334155" })],
      }),
    ],
  });
}

// Grade 2 cards por linha (espaçador entre linhas)
function gradeSecoes(secoes: Secao[]): Table[] {
  const tabelas: Table[] = [];
  for (let i = 0; i < secoes.length; i += 2) {
    const par = secoes.slice(i, i + 2);
    const cells = par.map((s) => cardSecaoCell(s));
    if (cells.length === 1) {
      cells.push(new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: semBorda(), children: [new Paragraph("")] }));
    }
    tabelas.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: cells })],
      }),
    );
    // espaçador entre linhas
    tabelas.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: [new TableCell({ borders: semBorda(), children: [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "", size: 10 })] })] })] })],
      }),
    );
  }
  return tabelas;
}

// =============================================================================
// DOCUMENTO
// =============================================================================
export function gerarCardsSecoesLGPD(): Document {
  const children: (Paragraph | Table)[] = [];

  // Capa
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2200, after: 200 }, children: [new TextRun({ text: "AS 7 SEÇÕES DA LGPD", bold: true, size: 48, color: COR_TITULO })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: "Kit de Cards — jogo de memorização da estrutura da lei", italics: true, size: 28, color: "475569" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1200 }, children: [new TextRun({ text: "Os 65 artigos em 7 blocos temáticos · A Jornada da LGPD", size: 22, color: "64748B" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PGP Treinamento", italics: true, size: 18, color: "94A3B8" })] }),
  );

  // Como usar
  children.push(h1("Como usar (facilitador)"));
  children.push(p("1. Imprima 1 jogo (7 cards) por grupo e recorte pelas bordas coloridas.", { spacingAfter: 80 }));
  children.push(p("2. Embaralhe os 7 cards e entregue a cada grupo.", { spacingAfter: 80 }));
  children.push(p("3. O grupo debate e ordena os cards na mesa, do Art. 1º ao 65 (Seção 1 → 7).", { spacingAfter: 80 }));
  children.push(p("4. Cada grupo confirma a ordem no celular: menu Atividades ao vivo → \"Ordene as 7 seções da LGPD\".", { spacingAfter: 80 }));
  children.push(p("5. Você projeta o telão (cartaz) e mostra quantos grupos acertaram a sequência exata e cada posição.", { spacingAfter: 80 }));
  children.push(p("6. Debrief: qual seção gerou mais dúvida? Por quê? Reforce a lógica da jornada.", { spacingAfter: 80 }));
  children.push(
    new Paragraph({
      shading: { type: ShadingType.CLEAR, fill: "EEF2FF" },
      spacing: { before: 160, after: 160 },
      children: [new TextRun({ text: "Gabarito (ordem correta): 1·Território → 2·Pedágio → 3·Herói → 4·Casa de Vidro → 5·Passaporte → 6·Quartel → 7·Juízo Final.", bold: true, size: 20, color: COR_TITULO })],
    }),
  );
  children.push(p("Dica: a numeração 1 a 7 aparece nos cards. Para um desafio maior, cubra o número com fita antes de entregar.", { italics: true, color: "64748B" }));

  // Os cards
  children.push(h1("Cards para recortar (1 jogo por grupo)"));
  children.push(p("Recorte pelas bordas coloridas. Cada cor é uma seção.", { italics: true, color: "64748B", spacingAfter: 200 }));
  for (const t of gradeSecoes(SECOES)) children.push(t);

  return docBase("As 7 Seções da LGPD — Kit de Cards", children);
}
