// Modalidade C — engine de geração dos 3 documentos imprimíveis (Onda 1):
//   1. Roteiro do Facilitador (15 momentos, 2 dias)
//   2. Kit de Cards (decks por fase + fichas de encaminhamento + crachás) — cortável
//   3. Colas de Referência (bases legais, matriz P×I, priorização) — pra mesa
//
// Reusa o padrão docx-js do projeto (Caderno/Cartilha/Pacote).

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
import {
  CRACHAS,
  FICHAS_ENCAMINHAMENTO,
  DECKS,
  CARD_DSR_SURPRESA,
  CARD_INCIDENTE_SURPRESA,
  COLA_BASES_LEGAIS,
  COLA_MATRIZ_PXI,
  COLA_PRIORIZACAO,
  ROTEIRO,
  NOTA_DESIGN,
  GUIA_DECISAO,
  type Card,
} from "./modalidade-c-conteudo";

// Cor da Modalidade C: índigo/violeta (distingue das 5 peças anteriores)
const COR_TITULO = "4338CA";
const COR_ACCENT = "6366F1";
const COR_CARD_BORDA = "4338CA";
const COR_CARD_HEADER = "EEF2FF";

// ── Helpers ──────────────────────────────────────────────────────────────────
function p(texto: string, opts: { bold?: boolean; italics?: boolean; size?: number; color?: string; align?: typeof AlignmentType[keyof typeof AlignmentType]; spacingAfter?: number } = {}): Paragraph {
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
function h2(texto: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text: texto, bold: true, size: 26, color: COR_ACCENT })],
  });
}
function bordaFina(color = "FFCBD5E1") {
  const l = { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" };
  return { top: l, bottom: l, left: l, right: l, insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" }, insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" } };
}

function docBase(title: string, children: (Paragraph | Table)[], orientation: "portrait" | "landscape" = "portrait"): Document {
  return new Document({
    creator: "PGP Treinamento — Curso prático de LGPD",
    title,
    description: "Material da Modalidade C (híbrida) do curso de LGPD.",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
        heading1: { run: { font: "Calibri", size: 34, bold: true, color: COR_TITULO }, paragraph: { spacing: { before: 360, after: 200 } } },
        heading2: { run: { font: "Calibri", size: 26, bold: true, color: COR_ACCENT }, paragraph: { spacing: { before: 280, after: 140 } } },
      },
    },
    sections: [{ properties: { page: { size: { orientation }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } }, children }],
  });
}

// Célula-card cortável (título + conteúdo, borda grossa índigo)
function cardCell(card: Card, widthPct: number): TableCell {
  const linhasConteudo = card.conteudo.split("\n");
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 12, color: COR_CARD_BORDA },
      bottom: { style: BorderStyle.SINGLE, size: 12, color: COR_CARD_BORDA },
      left: { style: BorderStyle.SINGLE, size: 12, color: COR_CARD_BORDA },
      right: { style: BorderStyle.SINGLE, size: 12, color: COR_CARD_BORDA },
    },
    children: [
      new Paragraph({
        shading: { type: ShadingType.CLEAR, fill: COR_CARD_HEADER },
        spacing: { after: 80 },
        children: [new TextRun({ text: card.titulo, bold: true, size: 22, color: COR_TITULO })],
      }),
      ...linhasConteudo.map((l) => new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: l, size: 20 })] })),
    ],
  });
}

// Monta uma grade de cards 2-por-linha
function gradeCards(cards: Card[]): Table[] {
  const tabelas: Table[] = [];
  for (let i = 0; i < cards.length; i += 2) {
    const par = cards.slice(i, i + 2);
    const cells = par.map((c) => cardCell(c, 50));
    // se ímpar, preenche com célula vazia
    if (cells.length === 1) {
      cells.push(new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } }, children: [new Paragraph("")] }));
    }
    tabelas.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: cells })],
      }),
    );
    // espaçador entre linhas de cards
    tabelas.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [new TableCell({ borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } }, children: [new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "", size: 8 })] })] })] })] }));
  }
  return tabelas;
}

// =============================================================================
// 1. ROTEIRO DO FACILITADOR
// =============================================================================
export function gerarRoteiroFacilitadorC(): Document {
  const children: (Paragraph | Table)[] = [];
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2400, after: 200 }, children: [new TextRun({ text: "ROTEIRO DO FACILITADOR", bold: true, size: 48, color: COR_TITULO })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: "Curso prático de LGPD — Modalidade C (híbrida)", italics: true, size: 28, color: "475569" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1200 }, children: [new TextRun({ text: "Telão + Cards físicos + Celular leve · 2 dias", size: 22, color: "64748B" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PGP Treinamento", italics: true, size: 18, color: "94A3B8" })] }),
  );

  children.push(h1("Sobre a Modalidade C"));
  children.push(p(NOTA_DESIGN));
  children.push(h2("Regra de reposição (importante)"));
  children.push(p("As atividades são autocontidas por fase. Se um participante faltar (ou trocar entre os dias), outra pessoa do grupo assume a ficha/papel — nada trava. O material físico do dia 1 fica com o grupo e serve de referência no dia 2 mesmo com nova composição."));
  children.push(h2("Legenda de meios"));
  children.push(p("📺 Telão (você apresenta) · 🃏 Cards físicos (grupo monta) · 📱 Celular (micro-decisão) · presencial (discussão)."));

  // Dia 1
  children.push(h1("Dia 1 (8:30 – 17:30)"));
  for (const m of ROTEIRO.filter((x) => x.dia === 1)) {
    children.push(...momentoRoteiro(m));
  }
  // Dia 2
  children.push(h1("Dia 2 (8:30 – 12:30)"));
  for (const m of ROTEIRO.filter((x) => x.dia === 2)) {
    children.push(...momentoRoteiro(m));
  }

  children.push(h1("Materiais a imprimir/preparar"));
  children.push(p("• Crachás dos 5 papéis (1 jogo por grupo) — ver Kit de Cards", { spacingAfter: 60 }));
  children.push(p("• Fichas de encaminhamento (vários jogos) — ver Kit de Cards", { spacingAfter: 60 }));
  children.push(p("• Decks de cards das Fases 1, 2, 3, 4, 5, 7 (1 jogo por grupo) — ver Kit de Cards", { spacingAfter: 60 }));
  children.push(p("• Cards-surpresa (DSR e Incidente) — 1 por grupo, entregar no momento certo", { spacingAfter: 60 }));
  children.push(p("• Colas de referência (Bases Legais, Matriz P×I, Priorização) — ver documento de Colas", { spacingAfter: 60 }));
  children.push(p("• Plaquinhas coloridas por grupo (pra sinalizar fase concluída) — providenciar", { spacingAfter: 60 }));
  children.push(p("• Tabuleiro da matriz P×I (A3) — opcional, pra posicionar os cards de risco", { spacingAfter: 60 }));
  children.push(p("• Os 5 documentos institucionais (Caderno/Resumo/Cartilha/Pacote/Planilha) — baixar do app e entregar no encerramento", { spacingAfter: 60 }));

  return docBase("Roteiro do Facilitador — Modalidade C", children);
}

function momentoRoteiro(m: typeof ROTEIRO[number]): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h2(`${m.numero}. ${m.titulo}  ·  ${m.duracao}  ·  ${m.meio}`));
  out.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: bordaFina(),
      rows: [
        linhaRoteiro("Você (facilitador) faz", m.oQueFacilitadorFaz),
        linhaRoteiro("Participantes fazem", m.oQueParticipantesFazem),
        linhaRoteiro("Material", m.material),
      ],
    }),
  );
  return out;
}
function linhaRoteiro(rotulo: string, valor: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({ width: { size: 26, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: "F1F5F9" }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: rotulo, bold: true, size: 20 })] })] }),
      new TableCell({ width: { size: 74, type: WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: valor, size: 20 })] })] }),
    ],
  });
}

// =============================================================================
// 1b. GUIA DE DECISÃO RÁPIDA — qual modalidade usar (decisão na sala)
// =============================================================================
export function gerarGuiaDecisao(): Document {
  const children: (Paragraph | Table)[] = [];
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2000, after: 200 }, children: [new TextRun({ text: "GUIA DE DECISÃO RÁPIDA", bold: true, size: 44, color: COR_TITULO })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: "Qual modalidade usar? (decisão NA SALA, em 15 min)", italics: true, size: 26, color: "475569" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 800 }, children: [new TextRun({ text: "Curso prático de LGPD — Modalidades A · B · C", size: 22, color: "64748B" })] }),
  );

  children.push(h1("Princípio", false));
  children.push(
    new Paragraph({
      shading: { type: ShadingType.CLEAR, fill: "EEF2FF" },
      spacing: { before: 120, after: 240 },
      children: [new TextRun({ text: GUIA_DECISAO.principio, size: 22, color: COR_TITULO })],
    }),
  );

  children.push(h2(GUIA_DECISAO.checklist.titulo));
  for (const passo of GUIA_DECISAO.checklist.passos) children.push(p(passo, { spacingAfter: 100 }));

  children.push(h2("Cenários → modalidade"));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: bordaFina(),
      rows: [
        new TableRow({
          children: [
            new TableCell({ width: { size: 55, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: COR_TITULO }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "O que a sala oferece", bold: true, color: "FFFFFF", size: 20 })] })] }),
            new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: COR_TITULO }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Modalidade", bold: true, color: "FFFFFF", size: 20 })] })] }),
          ],
        }),
        ...GUIA_DECISAO.cenarios.map(([cond, mod]) =>
          new TableRow({
            children: [
              new TableCell({ margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: cond, size: 20 })] })] }),
              new TableCell({ margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: mod, bold: true, size: 20, color: COR_ACCENT })] })] }),
            ],
          }),
        ),
      ],
    }),
  );

  children.push(h2("O que NÃO fazer"));
  for (const item of GUIA_DECISAO.naoFaca) children.push(p(`✗ ${item}`, { spacingAfter: 100, color: "991B1B" }));

  children.push(h2("Regra de ouro"));
  children.push(
    new Paragraph({
      shading: { type: ShadingType.CLEAR, fill: "FEF3C7" },
      spacing: { before: 120, after: 240 },
      children: [new TextRun({ text: GUIA_DECISAO.regraOuro, size: 22, color: "92400E", bold: true })],
    }),
  );

  return docBase("Guia de Decisão Rápida — Modalidade", children);
}

// =============================================================================
// 2. KIT DE CARDS (cortável)
// =============================================================================
export function gerarKitCards(): Document {
  const children: (Paragraph | Table)[] = [];
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2400, after: 200 }, children: [new TextRun({ text: "KIT DE CARDS", bold: true, size: 48, color: COR_TITULO })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: "Modalidade C — material físico pra recortar", italics: true, size: 28, color: "475569" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1200 }, children: [new TextRun({ text: "Imprima 1 jogo por grupo. Recorte pelas bordas índigo.", size: 22, color: "64748B" })] }),
  );

  // Crachás
  children.push(h1("Crachás de papel (1 jogo por grupo)"));
  children.push(p("Cada participante do grupo recebe um crachá. Se faltar gente, outro assume a ficha do papel ausente.", { italics: true }));
  const crachaCards: Card[] = CRACHAS.map((c) => ({ titulo: `${c.emoji} ${c.papel}`, conteudo: `${c.responsabilidade}\n\nNo grupo: ${c.noGrupo}` }));
  for (const t of gradeCards(crachaCards)) children.push(t);

  // Fichas de encaminhamento
  children.push(h1("Fichas de encaminhamento (vários jogos por grupo)"));
  children.push(p("Estas fichas circulam fisicamente entre os papéis. O movimento delas É a dinâmica de governança do PGP.", { italics: true }));
  const fichaCards: Card[] = FICHAS_ENCAMINHAMENTO.map((f) => ({
    titulo: `${f.emoji} ${f.titulo}`,
    conteudo: `De: ${f.de}  →  Para: ${f.para}\n${f.campos.join("\n")}\n\n(${f.explicacao})`,
  }));
  for (const t of gradeCards(fichaCards)) children.push(t);

  // Decks por fase
  for (const deck of DECKS) {
    children.push(h1(`${deck.fase}`));
    children.push(p(`Atividade: ${deck.atividade}`, { bold: true, color: COR_ACCENT }));
    children.push(p(deck.instrucao, { italics: true, spacingAfter: 160 }));
    for (const t of gradeCards(deck.cards)) children.push(t);
  }

  // Cards-surpresa
  children.push(h1("Cards-surpresa (entregar no momento certo)"));
  children.push(p("Não distribua antes! O facilitador entrega no momento indicado no roteiro.", { italics: true }));
  for (const t of gradeCards([CARD_DSR_SURPRESA, CARD_INCIDENTE_SURPRESA])) children.push(t);

  return docBase("Kit de Cards — Modalidade C", children);
}

// =============================================================================
// 3. COLAS DE REFERÊNCIA (pra mesa)
// =============================================================================
export function gerarColasReferencia(): Document {
  const children: (Paragraph | Table)[] = [];
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2400, after: 200 }, children: [new TextRun({ text: "COLAS DE REFERÊNCIA", bold: true, size: 48, color: COR_TITULO })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1200 }, children: [new TextRun({ text: "Modalidade C — deixe na mesa de cada grupo durante as atividades", italics: true, size: 24, color: "475569" })] }),
  );

  // Bases legais
  children.push(h1(COLA_BASES_LEGAIS.titulo));
  for (const l of COLA_BASES_LEGAIS.linhas) children.push(p(l, { spacingAfter: 80 }));

  // Matriz P×I
  children.push(h1(COLA_MATRIZ_PXI.titulo));
  children.push(p(COLA_MATRIZ_PXI.legenda, { italics: true, spacingAfter: 160 }));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: bordaFina(),
      rows: COLA_MATRIZ_PXI.matriz.map((linha, ri) =>
        new TableRow({
          children: linha.map((cel, ci) => {
            const isHeader = ri === 0 || ci === 0;
            let fill = "FFFFFF";
            if (isHeader) fill = "EEF2FF";
            else if (cel === "ALTO") fill = "FEE2E2";
            else if (cel === "MÉDIO") fill = "FEF9C3";
            else if (cel === "BAIXO") fill = "DCFCE7";
            return new TableCell({
              shading: { type: ShadingType.CLEAR, fill },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: cel, bold: isHeader || ["ALTO", "MÉDIO", "BAIXO"].includes(cel), size: 20 })] })],
            });
          }),
        }),
      ),
    }),
  );

  // Priorização
  children.push(h1(COLA_PRIORIZACAO.titulo));
  for (const l of COLA_PRIORIZACAO.linhas) children.push(p(l, { spacingAfter: 80 }));

  return docBase("Colas de Referência — Modalidade C", children);
}
