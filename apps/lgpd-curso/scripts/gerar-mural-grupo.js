// Gera o Mural A3 paisagem do grupo (Modalidade A).
// Estrutura pra grupo de 10: 5 ativos com login + 5 observadores anotando no mural A3.
//
// Uso (do diretório apps/lgpd-curso):
//   node scripts/gerar-mural-grupo.js
// Salva em:
//   E:\_________PGP\Jogo Vegas Modalidade A - Eletronico\Mural_A3_Grupo_Modalidade_A.docx

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, PageOrientation,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  PageBreak,
} = require("docx");

const OUT_DIR = "E:\\_________PGP\\Jogo Vegas Modalidade A - Eletronico";
const OUT_FILE = path.join(OUT_DIR, "Mural_A3_Grupo_Modalidade_A.docx");

// A3 paisagem em DXA: 16838 × 11906
const PAGE_W = 16838;
const PAGE_H = 11906;
const MARGIN = 720; // 0.5"
const CONTENT_W = PAGE_W - MARGIN * 2;

const border = { style: BorderStyle.SINGLE, size: 6, color: "555555" };
const borderBold = { style: BorderStyle.SINGLE, size: 12, color: "1F3864" };
const borders = { top: border, bottom: border, left: border, right: border };
const bordersBold = { top: borderBold, bottom: borderBold, left: borderBold, right: borderBold };
const cellMargins = { top: 100, bottom: 100, left: 160, right: 160 };

function cellPlain(text, width, opts = {}) {
  const runs = Array.isArray(text)
    ? text.map((t) => (t instanceof TextRun ? t : new TextRun(String(t))))
    : [new TextRun({ text: String(text), bold: opts.bold || false, size: opts.size || 22 })];
  return new TableCell({
    borders: opts.bold ? bordersBold : borders,
    margins: cellMargins,
    width: { size: width, type: WidthType.DXA },
    shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({
      children: runs,
      alignment: opts.align || AlignmentType.LEFT,
      spacing: { before: 40, after: 40 },
    })],
  });
}

function tableRow(cells) {
  return new TableRow({ children: cells });
}

function papelCell(papel, descricao, cor, width) {
  return new TableCell({
    borders,
    margins: cellMargins,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: cor, type: ShadingType.CLEAR },
    children: [
      new Paragraph({
        children: [new TextRun({ text: papel, bold: true, size: 24, color: "FFFFFF" })],
        spacing: { before: 40, after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Nome: ____________________", size: 18, color: "FFFFFF" })],
        spacing: { before: 0, after: 40 },
      }),
      new Paragraph({
        children: [new TextRun({ text: descricao, size: 16, color: "F5F5F5" })],
        spacing: { before: 0, after: 40 },
      }),
    ],
  });
}

function observadorCell(funcao, width) {
  return new TableCell({
    borders,
    margins: cellMargins,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
    children: [
      new Paragraph({
        children: [new TextRun({ text: `Observador — ${funcao}`, bold: true, size: 20, color: "374151" })],
        spacing: { before: 40, after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Nome: ____________________", size: 16 })],
        spacing: { before: 0, after: 40 },
      }),
    ],
  });
}

function decisaoCell(titulo, prompt, width, altura = 8) {
  const linhasVazias = Array(altura).fill(null).map(() =>
    new Paragraph({
      children: [new TextRun({ text: "_______________________________________________________________________", size: 18, color: "AAAAAA" })],
      spacing: { before: 80, after: 0 },
    })
  );
  return new TableCell({
    borders,
    margins: cellMargins,
    width: { size: width, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [new TextRun({ text: titulo, bold: true, size: 24, color: "1F3864" })],
        spacing: { before: 40, after: 40 },
      }),
      new Paragraph({
        children: [new TextRun({ text: prompt, italics: true, size: 18, color: "555555" })],
        spacing: { before: 0, after: 80 },
      }),
      ...linhasVazias,
    ],
  });
}

// ============================================================
// Gera 2 versões: Mural PM + Mural CM
// ============================================================

function buildMural(orgao) {
  const isPm = orgao === "PM";
  const titulo = isPm
    ? "MURAL DO GRUPO — Prefeitura Municipal de Vegas"
    : "MURAL DO GRUPO — Câmara Municipal de Vegas";
  const corHeader = isPm ? "047857" : "1D4ED8";

  // 5 papéis ativos
  const ativos = isPm
    ? [
        { papel: "DPO / Encarregado(a)",     cor: "7C3AED", desc: "Conduz M0 · aprova Inventário · publica Aviso · gera Comunicação ANPD" },
        { papel: "Sec. de Saúde",            cor: "10B981", desc: "Dono(a) do Posto Dr. Joaquim Bento" },
        { papel: "RH / Gestão de Pessoas",   cor: "F59E0B", desc: "Dono(a) dos Estagiários" },
        { papel: "TI / Tecnologia",          cor: "3B82F6", desc: "Avalia Segurança · controle de acesso · medidas técnicas" },
        { papel: "Comunicação / Procuradoria", cor: "EC4899", desc: "Apoia DPO no Aviso e na Comunicação ANPD" },
      ]
    : [
        { papel: "DPO / Encarregado(a)",     cor: "7C3AED", desc: "Idem PM" },
        { papel: "Cerimonial / Plenário",    cor: "F59E0B", desc: "Dono(a) da Tribuna Livre" },
        { papel: "Ouvidoria",                cor: "10B981", desc: "Dono(a) da Ouvidoria Municipal" },
        { papel: "TI / Tecnologia",          cor: "3B82F6", desc: "Idem PM" },
        { papel: "Procuradoria / Jurídico",  cor: "EC4899", desc: "Apoia DPO em redação formal" },
      ];

  // 5 observadores
  const observadores = [
    "Cronometrista — acompanha o relógio das missões",
    "Repórter de campo — escreve decisões no mural",
    "Leitor de briefing — lê em voz alta nas trocas de missão",
    "Caçador de pegadinhas — relê briefings procurando armadilhas",
    "Mediador — facilita discussão, garante que todas as vozes falem",
  ];

  const children = [
    // Título grande
    new Paragraph({
      children: [new TextRun({ text: titulo, bold: true, size: 42, color: "FFFFFF" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 120 },
      shading: { type: ShadingType.CLEAR, fill: corHeader, color: "auto" },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Nome do grupo: __________________________________   ·   Data: ___ / ___ / 2026", size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 240 },
    }),

    // Tabela: 5 papéis ativos (1 linha × 5 colunas)
    new Paragraph({
      children: [new TextRun({ text: "OS 5 PAPÉIS ATIVOS DO GRUPO (cada um com login no app)", bold: true, size: 22, color: "1F3864" })],
      spacing: { before: 120, after: 80 },
    }),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: Array(5).fill(Math.floor(CONTENT_W / 5)),
      rows: [
        tableRow(ativos.map((a) => papelCell(a.papel, a.desc, a.cor, Math.floor(CONTENT_W / 5)))),
      ],
    }),

    // Tabela: 5 observadores
    new Paragraph({
      children: [new TextRun({ text: "OS 5 OBSERVADORES (sem login — trabalham neste mural)", bold: true, size: 22, color: "1F3864" })],
      spacing: { before: 200, after: 80 },
    }),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: Array(5).fill(Math.floor(CONTENT_W / 5)),
      rows: [
        tableRow(observadores.map((o) => observadorCell(o, Math.floor(CONTENT_W / 5)))),
      ],
    }),

    // Quadros de decisões críticas — 4 (2x2)
    new Paragraph({
      children: [new TextRun({ text: "QUADROS DE DECISÕES CRÍTICAS — anotem aqui o 'como' por trás do 'o quê' digitado no app", bold: true, size: 22, color: "1F3864" })],
      spacing: { before: 240, after: 80 },
    }),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [Math.floor(CONTENT_W / 2), Math.floor(CONTENT_W / 2)],
      rows: [
        tableRow([
          decisaoCell("M1 · Inventário",
            "Qual processo escolheram detalhar primeiro? Por quê? Quais dados sensíveis encontraram?",
            Math.floor(CONTENT_W / 2)),
          decisaoCell("M2 · Análise de Riscos",
            "Quais 3 riscos mais graves vocês identificaram? Onde eles estão na matriz P×I?",
            Math.floor(CONTENT_W / 2)),
        ]),
        tableRow([
          decisaoCell("M3 · GAP Analysis",
            "Que controles vocês classificaram como NÃO ADERENTE? Qual seria o plano de ação?",
            Math.floor(CONTENT_W / 2)),
          decisaoCell("M5 · Incidente",
            "Severidade definida? Tempo entre detecção e Comunicação ANPD? O que faltaria pra resposta perfeita?",
            Math.floor(CONTENT_W / 2)),
        ]),
      ],
    }),

    // Rodapé
    new Paragraph({
      children: [new TextRun({ text: "💡 Lembre-se: errar é o objetivo, não o pecado. Anotem dúvidas e descobertas pra discutir no debrief final.", italics: true, size: 20, color: "666666" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 0 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "PGP Treinamento — Modalidade A   ·   lgpd-curso.vercel.app", size: 16, color: "999999" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 0 },
    }),
  ];

  return children;
}

const allChildren = [
  ...buildMural("PM"),
  new Paragraph({ children: [new PageBreak()] }),
  ...buildMural("CM"),
];

const doc = new Document({
  creator: "PGP Treinamento — Modalidade A",
  title: "Mural A3 do Grupo",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
  },
  sections: [{
    properties: {
      page: {
        size: {
          width: PAGE_H,  // docx-js swap: pass portrait dimensions
          height: PAGE_W,
          orientation: PageOrientation.LANDSCAPE,
        },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
      },
    },
    children: allChildren,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUT_FILE, buffer);
  console.log(`✓ Mural gerado: ${OUT_FILE}`);
  console.log(`  Tamanho: ${(buffer.length / 1024).toFixed(1)} KB`);
  console.log(`  Contém: 1 página PM + 1 página CM (A3 paisagem)`);
}).catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
