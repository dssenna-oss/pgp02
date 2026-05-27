// GET /api/curso/gabarito-pegadinhas/docx?turmaSlug=X
//
// Gabarito do Debrief — DOCX de apoio pro facilitador conduzir a discussão
// das 10 pegadinhas plantadas no curso:
//   - 4 pegadinhas nos processos (2 da PM + 2 da CM)
//   - 6 erros plantados no Aviso de Privacidade auto-preenchido
//
// Cada pegadinha vem com: trecho original · por que é pegadinha · artigo LGPD
// · dica de condução · QUAIS grupos da turma detectaram (do quiz Caça às
// Pegadinhas + dos reports no Aviso).
//
// Admin-only.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { ensureColunaOlhoClinico } from "@/lib/coluna-olho-clinico";
import { PEGADINHAS_PROCESSOS } from "@/lib/processos-pegadinhas";
import { CATALOGO_ERROS_PLANTADOS, detectarErroPorPalavraChave } from "@/lib/aviso-erros-plantados";
import {
  Document,
  Packer,
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

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return new NextResponse(e.message, { status: 403 });
  }

  const turmaSlug = req.nextUrl.searchParams.get("turmaSlug");
  if (!turmaSlug) {
    return NextResponse.json({ error: "turmaSlug obrigatório" }, { status: 400 });
  }

  await ensureColunaOlhoClinico();

  const turma = await prisma.cursoTurma.findFirst({
    where: { slug: turmaSlug },
    include: {
      grupos: {
        orderBy: [{ orgao: "asc" }, { numero: "asc" }],
        include: {
          company: {
            select: {
              id: true,
              name: true,
              olhoClinicoQuiz: true,
              policies: { where: { slug: "aviso-privacidade" }, select: { errosReportados: true } },
            },
          },
        },
      },
    },
  });

  if (!turma) {
    return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
  }

  // ─── Agrega detecções ────────────────────────────────────────────────────
  // Pegadinhas dos processos: detectaram via quiz (detectou === "SIM")
  const detectaramPorPegadinha = new Map<string, Array<{ numero: number; orgao: string; observacao?: string }>>();

  for (const g of turma.grupos) {
    const quiz = g.company.olhoClinicoQuiz as any;
    const respostas: any[] = Array.isArray(quiz?.respostas) ? quiz.respostas : [];
    for (const r of respostas) {
      if (r.detectou !== "SIM") continue;
      const arr = detectaramPorPegadinha.get(r.pegadinhaId) || [];
      arr.push({ numero: g.numero, orgao: g.orgao, observacao: r.observacao });
      detectaramPorPegadinha.set(r.pegadinhaId, arr);
    }

    // Reports do Aviso (texto livre) — usa heurística pra atribuir a um dos
    // 6 erros plantados. Esse caminho legado convive com o quiz novo.
    const errosReportados = g.company.policies[0]?.errosReportados;
    const reports: any[] = Array.isArray(errosReportados) ? errosReportados : [];
    for (const rep of reports) {
      const id = detectarErroPorPalavraChave(String(rep?.descricao || ""));
      if (!id) continue;
      const arr = detectaramPorPegadinha.get(id) || [];
      // Evita duplicar se o mesmo grupo já apareceu pelo quiz
      if (!arr.some((x) => x.numero === g.numero && x.orgao === g.orgao)) {
        arr.push({ numero: g.numero, orgao: g.orgao, observacao: String(rep?.descricao || "") });
      }
      detectaramPorPegadinha.set(id, arr);
    }
  }

  // ─── Helpers DOCX ────────────────────────────────────────────────────────
  const COR_TITULO = "92400E";
  const COR_ACCENT = "B45309";

  function h1(texto: string, pageBreak = true): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 200 },
      pageBreakBefore: pageBreak,
      children: [new TextRun({ text: texto, bold: true, size: 36, color: COR_TITULO })],
    });
  }
  function h2(texto: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: texto, bold: true, size: 26, color: COR_ACCENT })],
    });
  }
  function p(texto: string, opts: { bold?: boolean; italics?: boolean; size?: number; color?: string; align?: typeof AlignmentType[keyof typeof AlignmentType] } = {}): Paragraph {
    return new Paragraph({
      alignment: opts.align,
      spacing: { after: 140 },
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
  function blockquote(texto: string): Paragraph {
    return new Paragraph({
      shading: { type: ShadingType.CLEAR, fill: "FEF3C7" },
      spacing: { before: 80, after: 80 },
      indent: { left: 300, right: 300 },
      children: [new TextRun({ text: texto, italics: true, size: 22, color: "78350F" })],
    });
  }
  function tabelaCampos(linhas: Array<[string, string]>): Table {
    return new Table({
      rows: linhas.map(
        ([rotulo, valor]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 28, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: "F1F5F9" },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: rotulo, bold: true, size: 20 })] })],
              }),
              new TableCell({
                width: { size: 72, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: valor || "—", size: 20 })] })],
              }),
            ],
          }),
      ),
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      },
    });
  }

  function rotuloGrupo(g: { numero: number; orgao: string }): string {
    return `G${g.numero}·${g.orgao}`;
  }

  // ─── Monta o documento ───────────────────────────────────────────────────
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const children: (Paragraph | Table)[] = [];

  // Capa
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 3200, after: 240 },
      children: [
        new TextRun({ text: "GABARITO DO DEBRIEF", bold: true, size: 48, color: COR_TITULO }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({ text: "Caça às Pegadinhas — apoio à condução presencial", italics: true, size: 28, color: "475569" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: `Turma: ${turma.nome}`, bold: true, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
      children: [new TextRun({ text: `${turma.cidade} · ${hoje}`, size: 22, color: "475569" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Documento de uso interno do facilitador — não distribuir aos participantes antes do debrief",
          italics: true,
          size: 18,
          color: "94A3B8",
        }),
      ],
    }),
  );

  // Como usar
  children.push(h1("Como usar este gabarito"));
  children.push(
    p(
      "Este documento sintetiza, em 10 fichas, as pegadinhas plantadas no curso. Use durante o debrief pra confirmar quais grupos identificaram cada uma e conduzir a discussão pedagógica. Cada ficha traz:",
    ),
  );
  children.push(p("• Trecho exato apresentado no briefing/Aviso"));
  children.push(p("• Por que é pegadinha (descrição pedagógica)"));
  children.push(p("• Artigo da LGPD aplicável"));
  children.push(p("• Dica de condução"));
  children.push(p("• Quais grupos detectaram (resultado do Caça às Pegadinhas + reports no Aviso)"));

  // ─── Pegadinhas dos processos ────────────────────────────────────────────
  children.push(h1("Parte 1 — Pegadinhas nos processos"));
  children.push(
    p(
      "Cada órgão tem 2 pegadinhas — uma em cada processo pré-cadastrado. PM e CM são apresentados em sequência.",
      { italics: true },
    ),
  );

  for (const peg of PEGADINHAS_PROCESSOS) {
    children.push(h2(`${peg.orgao === "PM" ? "🛕 Prefeitura" : "🏛 Câmara"} — ${peg.rotuloCurto}`));
    children.push(p("Trecho do briefing:", { bold: true, color: COR_ACCENT }));
    children.push(blockquote(peg.trechoBriefing));
    children.push(p("Por que é pegadinha:", { bold: true, color: COR_ACCENT }));
    children.push(p(peg.porqueEpegadinha));
    children.push(
      tabelaCampos([
        ["Artigo LGPD", peg.artigoLgpd],
        ["Dica de condução", peg.dicaDoFacilitador],
        [
          "Grupos que detectaram",
          formatarDetectados(detectaramPorPegadinha.get(peg.id) || [], peg.orgao),
        ],
      ]),
    );
  }

  // ─── Erros plantados no Aviso ────────────────────────────────────────────
  children.push(h1("Parte 2 — Erros plantados no Aviso de Privacidade"));
  children.push(
    p(
      "6 erros injetados pelo Auto-preencher do Aviso (Missão 4b). Todos os grupos veem os mesmos 6. Grupos podem detectar via Caça às Pegadinhas (Encerramento) OU via botão 'Sinalizar erro' no próprio Aviso (texto livre).",
      { italics: true },
    ),
  );

  for (const erro of CATALOGO_ERROS_PLANTADOS) {
    children.push(h2(erro.rotulo));
    children.push(p(`Onde aparece: ${erro.secao}`, { italics: true, color: "64748B" }));
    children.push(p("Por que é pegadinha:", { bold: true, color: COR_ACCENT }));
    children.push(p(erro.descricaoPedagogica));
    children.push(
      tabelaCampos([
        ["Artigo LGPD", erro.artigoLgpd],
        ["Dica de condução", erro.dicaDoFacilitador],
        [
          "Grupos que detectaram",
          formatarDetectados(detectaramPorPegadinha.get(erro.id) || [], null),
        ],
      ]),
    );
  }

  // ─── Resumo da turma ─────────────────────────────────────────────────────
  children.push(h1("Resumo da turma"));
  children.push(
    p(
      "Quadro consolidado dos resultados do Caça às Pegadinhas — útil pra premiação do 'Olho Clínico' no encerramento.",
    ),
  );

  const linhasResumo: Array<[string, string]> = [];
  for (const g of turma.grupos) {
    const quiz = g.company.olhoClinicoQuiz as any;
    const finalizado = !!quiz?.finalizadoEm;
    const score = typeof quiz?.score === "number" ? quiz.score : 0;
    const total = typeof quiz?.total === "number" ? quiz.total : 8;
    linhasResumo.push([
      `${rotuloGrupo({ numero: g.numero, orgao: g.orgao })} · ${g.company.name}`,
      finalizado ? `${score}/${total} ${score === total ? "🏆 Olho Total" : ""}` : "Não finalizou o quiz",
    ]);
  }
  if (linhasResumo.length > 0) {
    children.push(tabelaCampos(linhasResumo));
  } else {
    children.push(p("Sem grupos cadastrados nesta turma.", { italics: true }));
  }

  function formatarDetectados(detectados: Array<{ numero: number; orgao: string; observacao?: string }>, orgaoFiltro: string | null): string {
    // Pegadinhas de processo são específicas do órgão — filtra
    const filtrados = orgaoFiltro
      ? detectados.filter((d) => d.orgao === orgaoFiltro)
      : detectados;
    if (filtrados.length === 0) return "Nenhum grupo detectou";
    return filtrados.map((d) => rotuloGrupo(d)).join(" · ");
  }

  // ─── Document ────────────────────────────────────────────────────────────
  const doc = new Document({
    creator: "PGP Treinamento — Curso prático de LGPD",
    title: `Gabarito do Debrief — ${turma.nome}`,
    description: `Apoio à condução das pegadinhas plantadas — turma ${turma.nome}`,
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
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
  const slug = turma.nome.replace(/[^a-zA-Z0-9]+/g, "_");
  const nomeArquivo = `Gabarito_Debrief_Pegadinhas_${slug}.docx`;
  return new NextResponse(ab, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
