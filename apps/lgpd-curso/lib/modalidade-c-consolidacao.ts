// Modalidade C — Onda 3: Relatório de Consolidação (zero digitação).
//
// Documento que o facilitador gera no ENCERRAMENTO do curso, por turma. Junta
// automaticamente o resultado agregado das atividades de celular (Onda 2) — sem
// ninguém digitar nada — e fecha com um guia do que levar/preencher nos
// documentos da família (Caderno/Resumo/Cartilha/Pacote/Planilha).
//
// Captura SÓ as micro-decisões do celular (priorização, classificação, GAP,
// ordenação RIPD/Política, balanceamento). O que foi montado nos cards físicos
// fica com o grupo — este relatório é a "memória digital" da turma.
//
// Reusa o padrão docx-js (cores índigo da Modalidade C, igual modalidade-c-docx).

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
  ATIVIDADES_C,
  type AtividadeC,
  type AgregadoAtividade,
} from "./atividades-c";

const COR_TITULO = "4338CA";
const COR_ACCENT = "6366F1";
const COR_CARD_HEADER = "EEF2FF";

// ── Helpers ──────────────────────────────────────────────────────────────────
function p(
  texto: string,
  opts: {
    bold?: boolean;
    italics?: boolean;
    size?: number;
    color?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spacingAfter?: number;
  } = {},
): Paragraph {
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.spacingAfter ?? 120 },
    children: [
      new TextRun({
        text: texto,
        bold: opts.bold,
        italics: opts.italics,
        size: opts.size ?? 22,
        color: opts.color,
      }),
    ],
  });
}
function h1(texto: string, pageBreak = true): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    pageBreakBefore: pageBreak,
    children: [new TextRun({ text: texto, bold: true, size: 32, color: COR_TITULO })],
  });
}
function h2(texto: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: texto, bold: true, size: 24, color: COR_ACCENT })],
  });
}
function bordaFina() {
  const l = { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" };
  return {
    top: l,
    bottom: l,
    left: l,
    right: l,
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
  };
}
function docBase(title: string, children: (Paragraph | Table)[]): Document {
  return new Document({
    creator: "PGP Treinamento — Curso prático de LGPD",
    title,
    description: "Relatório de Consolidação da Modalidade C (híbrida) do curso de LGPD.",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
        heading1: {
          run: { font: "Calibri", size: 32, bold: true, color: COR_TITULO },
          paragraph: { spacing: { before: 360, after: 200 } },
        },
        heading2: {
          run: { font: "Calibri", size: 24, bold: true, color: COR_ACCENT },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } },
        },
        children,
      },
    ],
  });
}

// Célula de cabeçalho de tabela (fundo índigo, texto branco)
function th(texto: string, widthPct: number): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: COR_TITULO },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: texto, bold: true, color: "FFFFFF", size: 20 })] })],
  });
}
function td(texto: string, opts: { bold?: boolean; color?: string; fill?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}): TableCell {
  return new TableCell({
    shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ alignment: opts.align, children: [new TextRun({ text: texto, bold: opts.bold, color: opts.color, size: 20 })] })],
  });
}

// Faixa/destaque de score grande
function destaque(texto: string, fill: string, cor: string): Paragraph {
  return new Paragraph({
    shading: { type: ShadingType.CLEAR, fill },
    spacing: { before: 120, after: 200 },
    children: [new TextRun({ text: texto, bold: true, size: 26, color: cor })],
  });
}

function semRespostas(): Paragraph {
  return new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: "F1F5F9" },
    spacing: { before: 80, after: 200 },
    children: [
      new TextRun({
        text: "Nenhum participante respondeu esta atividade no celular. Sem dados para consolidar.",
        italics: true,
        size: 20,
        color: "64748B",
      }),
    ],
  });
}

// fill de cor de faixa (Alta/Média/Baixa) — mapeia a cor textual da engine
function fillFaixa(cor: string): { fill: string; texto: string } {
  if (cor === "red") return { fill: "FEE2E2", texto: "991B1B" };
  if (cor === "amber") return { fill: "FEF9C3", texto: "92400E" };
  return { fill: "DCFCE7", texto: "166534" };
}

// ── Seções por tipo de atividade ─────────────────────────────────────────────

function secaoEscala(at: Extract<AtividadeC, { tipo: "opcoes" }>, ag: AgregadoAtividade): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  if (at.contexto) out.push(p(at.contexto, { italics: true, color: "475569" }));
  if (ag.respondentes === 0) {
    out.push(semRespostas());
    return out;
  }
  const faixa = ag.faixaMedia ? fillFaixa(ag.faixaMedia.cor) : { fill: "EEF2FF", texto: COR_TITULO };
  out.push(
    destaque(
      `Score médio da turma: ${ag.scoreMedio ?? 0} de ${ag.scoreMax ?? 18}  ·  ${ag.faixaMedia?.label ?? "—"}`,
      faixa.fill,
      faixa.texto,
    ),
  );
  out.push(p(`${ag.respondentes} participante(s) responderam.`, { size: 20, color: "64748B" }));
  out.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: bordaFina(),
      rows: [
        new TableRow({ children: [th("Critério", 72), th("Média (1–3)", 28)] }),
        ...(ag.itens ?? []).map(
          (item) =>
            new TableRow({
              children: [td(item.enunciado), td(String(item.mediaPontos ?? "—"), { bold: true, align: AlignmentType.CENTER })],
            }),
        ),
      ],
    }),
  );
  out.push(
    p("Leitura: quanto mais alto o score, mais o processo deve ser priorizado no diagnóstico (Res. CD/ANPD nº 2/2022).", {
      italics: true,
      size: 20,
      spacingAfter: 80,
    }),
  );
  return out;
}

function secaoGabarito(at: Extract<AtividadeC, { tipo: "opcoes" }>, ag: AgregadoAtividade): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  if (ag.respondentes === 0) {
    out.push(semRespostas());
    return out;
  }
  out.push(destaque(`Acerto médio da turma: ${ag.acertoMedio ?? 0}%`, "DCFCE7", "166534"));
  out.push(p(`${ag.respondentes} participante(s) responderam.`, { size: 20, color: "64748B" }));
  out.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: bordaFina(),
      rows: [
        new TableRow({ children: [th("Situação", 50), th("% acerto", 16), th("Resposta correta", 34)] }),
        ...at.itens.map((item) => {
          const res = (ag.itens ?? []).find((i) => i.itemId === item.id);
          const correta = item.opcoes.find((o) => o.correta)?.rotulo ?? "—";
          const perc = res?.percAcerto ?? 0;
          const fill = perc >= 70 ? "DCFCE7" : perc >= 40 ? "FEF9C3" : "FEE2E2";
          return new TableRow({
            children: [
              td(item.enunciado),
              td(`${perc}%`, { bold: true, align: AlignmentType.CENTER, fill }),
              td(correta, { color: "166534" }),
            ],
          });
        }),
      ],
    }),
  );
  out.push(
    p("Itens com baixo acerto sinalizam pontos a reforçar no Aviso de Privacidade e nas capacitações.", {
      italics: true,
      size: 20,
      spacingAfter: 80,
    }),
  );
  return out;
}

function secaoVoto(at: Extract<AtividadeC, { tipo: "opcoes" }>, ag: AgregadoAtividade): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  if (ag.respondentes === 0) {
    out.push(semRespostas());
    return out;
  }
  out.push(p(`${ag.respondentes} participante(s) avaliaram a situação do órgão.`, { size: 20, color: "64748B" }));
  const pct = (item: ReturnType<() => any>, opId: string) =>
    item?.distribuicao?.find((d: any) => d.opcaoId === opId)?.perc ?? 0;
  const lacunas: string[] = [];
  out.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: bordaFina(),
      rows: [
        new TableRow({
          children: [th("Controle", 52), th("✅ Aderente", 16), th("🟡 Parcial", 16), th("🔴 Não", 16)],
        }),
        ...at.itens.map((item) => {
          const res = (ag.itens ?? []).find((i) => i.itemId === item.id);
          const pNao = pct(res, "nao");
          const pParcial = pct(res, "parcial");
          if (pNao >= 40 || pParcial + pNao >= 60) lacunas.push(item.enunciado);
          return new TableRow({
            children: [
              td(item.enunciado),
              td(`${pct(res, "aderente")}%`, { align: AlignmentType.CENTER }),
              td(`${pParcial}%`, { align: AlignmentType.CENTER }),
              td(`${pNao}%`, { align: AlignmentType.CENTER, bold: pNao >= 40, fill: pNao >= 40 ? "FEE2E2" : undefined }),
            ],
          });
        }),
      ],
    }),
  );
  if (lacunas.length > 0) {
    out.push(h2("Lacunas a virar ações na Fase 5 (Plano de Ação)"));
    for (const l of lacunas) out.push(p(`• ${l}`, { color: "991B1B", spacingAfter: 60 }));
  } else {
    out.push(
      p("A turma avaliou que os controles estão majoritariamente aderentes — manter o monitoramento.", {
        italics: true,
        size: 20,
        spacingAfter: 80,
      }),
    );
  }
  return out;
}

function secaoBalanceamento(_at: Extract<AtividadeC, { tipo: "opcoes" }>, ag: AgregadoAtividade): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  if (ag.respondentes === 0) {
    out.push(semRespostas());
    return out;
  }
  const b = ag.balanceamento;
  out.push(
    destaque(
      `${b?.percAprovado ?? 0}% concluíram "pode usar o legítimo interesse"  ·  ${b?.aprovados ?? 0} de ${ag.respondentes}`,
      "F3E8FF",
      "6B21A8",
    ),
  );
  out.push(
    p(
      "Lembrete: no setor público o legítimo interesse é EXCEPCIONAL (Art. 7º IX). O teste de balanceamento só é aprovado quando TODAS as 4 etapas são 'Sim'.",
      { italics: true, size: 20, spacingAfter: 80 },
    ),
  );
  return out;
}

function secaoOrdenar(at: Extract<AtividadeC, { tipo: "ordenar" }>, ag: AgregadoAtividade): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  if (at.contexto) out.push(p(at.contexto, { italics: true, color: "475569" }));
  if (ag.respondentes === 0) {
    out.push(semRespostas());
    return out;
  }
  out.push(
    destaque(`${ag.ordenar?.percExato ?? 0}% dos participantes acertaram a ordem completa`, "EEF2FF", COR_TITULO),
  );
  out.push(p(`${ag.respondentes} participante(s) responderam.`, { size: 20, color: "64748B" }));
  out.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: bordaFina(),
      rows: [
        new TableRow({ children: [th("#", 8), th("Ordem correta", 76), th("% acerto", 16)] }),
        ...(ag.ordenar?.porPosicao ?? []).map((pos) => {
          const perc = pos.percCorreto;
          const fill = perc >= 70 ? "DCFCE7" : perc >= 40 ? "FEF9C3" : "FEE2E2";
          return new TableRow({
            children: [
              td(String(pos.posicao), { bold: true, align: AlignmentType.CENTER }),
              td(pos.rotuloCorreto),
              td(`${perc}%`, { align: AlignmentType.CENTER, fill }),
            ],
          });
        }),
      ],
    }),
  );
  return out;
}

function secaoAtividade(at: AtividadeC, ag: AgregadoAtividade | undefined): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1(`${at.emoji} ${at.titulo}`));
  out.push(p(at.fase, { bold: true, color: COR_ACCENT, spacingAfter: 80 }));

  const agg = ag ?? { atividadeId: at.id, titulo: at.titulo, tipo: at.tipo, respondentes: 0 };

  if (at.tipo === "ordenar") return [...out, ...secaoOrdenar(at, agg)];
  if (at.modo === "escala") return [...out, ...secaoEscala(at, agg)];
  if (at.modo === "gabarito") return [...out, ...secaoGabarito(at, agg)];
  if (at.modo === "balanceamento") return [...out, ...secaoBalanceamento(at, agg)];
  return [...out, ...secaoVoto(at, agg)];
}

// ── Guia de encerramento: o que levar / preencher na família ─────────────────
const DOCS_FAMILIA: [string, string, string][] = [
  ["📚 Caderno do Curso", "Memória completa (~60-80 pg) das 8 etapas", "Baixar no card do grupo no Painel do Facilitador (botão Caderno)."],
  ["📋 Resumo Executivo", "Relatório de ~12 pg para a Alta Gestão", "Baixar no card do grupo (botão Resumo)."],
  ["📄 Cartilha / Pacote", "Material institucional de referência", "Entregar impresso ou em PDF no encerramento."],
  ["📊 Planilha (XLSX)", "Inventário / Plano de Ação para preencher na Instituição", "Exportar do app principal PGP após o curso."],
];

function guiaEncerramento(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1("O que levar e preencher na Instituição"));
  out.push(
    p(
      "Este relatório registra as DECISÕES de celular da turma. O trabalho montado nos cards físicos e o detalhamento real ficam para a Instituição concluir, usando os documentos da família abaixo:",
      { spacingAfter: 160 },
    ),
  );
  out.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: bordaFina(),
      rows: [
        new TableRow({ children: [th("Documento", 28), th("O que é", 38), th("Como obter", 34)] }),
        ...DOCS_FAMILIA.map(
          ([nome, oque, como]) =>
            new TableRow({
              children: [td(nome, { bold: true, color: COR_TITULO, fill: COR_CARD_HEADER }), td(oque), td(como)],
            }),
        ),
      ],
    }),
  );
  out.push(h2("Próximos passos sugeridos"));
  out.push(p("1. Transcrever para o app principal (PGP) o que a turma priorizou e classificou no celular.", { spacingAfter: 60 }));
  out.push(p("2. Abrir uma ação no Plano (Fase 5) para cada lacuna de aderência apontada no GAP acima.", { spacingAfter: 60 }));
  out.push(p("3. Usar a ordem correta do RIPD e da Política (acima) ao montar os documentos reais na Fase 6.", { spacingAfter: 60 }));
  out.push(p("4. Reforçar nos treinamentos os pontos de classificação com menor acerto da turma.", { spacingAfter: 60 }));
  return out;
}

// ── Documento ─────────────────────────────────────────────────────────────────
export type DadosConsolidacao = {
  turma: { nome: string; cidade: string };
  agregados: Record<string, AgregadoAtividade>;
};

export function gerarRelatorioConsolidacao(dados: DadosConsolidacao): Document {
  const { turma, agregados } = dados;
  const children: (Paragraph | Table)[] = [];

  // Capa
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2200, after: 200 }, children: [new TextRun({ text: "RELATÓRIO DE CONSOLIDAÇÃO", bold: true, size: 46, color: COR_TITULO })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: "Curso prático de LGPD — Modalidade C (híbrida)", italics: true, size: 28, color: "475569" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: `${turma.nome} · ${turma.cidade}`, size: 24, color: "334155" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1000 }, children: [new TextRun({ text: `Gerado em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`, size: 22, color: "64748B" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PGP Treinamento", italics: true, size: 18, color: "94A3B8" })] }),
  );

  // Introdução
  children.push(h1("Sobre este relatório"));
  children.push(
    p(
      "Consolidação automática das atividades de celular (Modalidade C, Onda 2) realizadas pela turma. Mostra o resultado coletivo de cada micro-decisão — sem nenhuma digitação manual. As atividades sem resposta aparecem assinaladas.",
    ),
  );

  // Uma seção por atividade do catálogo
  for (const at of ATIVIDADES_C) {
    children.push(...secaoAtividade(at, agregados[at.id]));
  }

  // Guia de encerramento
  children.push(...guiaEncerramento());

  return docBase(`Relatório de Consolidação — ${turma.nome}`, children);
}
