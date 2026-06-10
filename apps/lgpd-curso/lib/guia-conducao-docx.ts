// Guia de Condução (DOCX, 1-2 páginas) — cola pra o facilitador imprimir e
// levar. Espelha o Painel de Condução: setup, os 16 momentos com dispositivo
// (você × alunos), comandos do telão e pontos de atenção.
//
// Monta E empacota DENTRO do realm da lib (devolve Buffer) — evita a pegadinha
// de dupla-instância do docx. O script só escreve o Buffer.

import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
} from "docx";
import { ROTEIRO_CONDUCAO, type MomentoConducao, type DispositivoVoce, type DispositivoAluno } from "./conducao-mapa";

const NAVY = "1F3A5F";
const LARANJA = "E07B39";
const CINZA = "555555";
const CINZA_CLARO = "EEF1F5";

function txt(s: string, o: { bold?: boolean; size?: number; color?: string; italics?: boolean } = {}) {
  return new TextRun({ text: s, bold: o.bold, size: o.size ?? 18, color: o.color, italics: o.italics });
}
function par(children: TextRun[], o: { after?: number; before?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  return new Paragraph({ children, spacing: { after: o.after ?? 80, before: o.before ?? 0 }, alignment: o.align });
}
function titulo(s: string) {
  return new Paragraph({
    children: [txt(s, { bold: true, size: 26, color: NAVY })],
    spacing: { before: 180, after: 90 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LARANJA, space: 2 } },
  });
}
function bullet(s: string, bold?: string) {
  const runs = bold ? [txt(bold + " ", { bold: true, color: NAVY }), txt(s)] : [txt(s)];
  return new Paragraph({ children: runs, bullet: { level: 0 }, spacing: { after: 40 } });
}

const ROT_VOCE: Record<DispositivoVoce, string> = { celular: "📱 celular", notebook: "🖥️ notebook", sala: "🗣️ sala" };
const ROT_ALUNO: Record<DispositivoAluno, string> = { celular: "📱 celular", impresso: "🃏 impresso", discussao: "💬 discussão" };

function telaoResumo(m: MomentoConducao): string {
  const parts: string[] = [];
  for (const a of m.acoes) {
    if (a.kind === "telao-quiz") parts.push("Quiz (QR)");
    else if (a.kind === "telao-quiz-resultado") parts.push("Resultado");
    else if (a.kind === "telao-termometro") parts.push("Termômetro");
    else if (a.kind === "telao-placar") parts.push("Placar/pódio");
    else if (a.kind === "telao-atividade") parts.push(a.label.replace(/^Abrir\s+/, ""));
    else if (a.kind === "disparar-dsr") parts.push("⚡ DSR surpresa");
    else if (a.kind === "disparar-incidente") parts.push("⚠️ Incidente 72h");
    else if (a.kind === "fechamento") parts.push("Relatório · Certificados");
  }
  if (m.numero === 4) return "Hist./Estrut. (notebook) · 📋 Desafios";
  return parts.length ? parts.join(" · ") : "—";
}

function cell(children: Paragraph[], opts: { width: number; fill?: string } = { width: 20 }) {
  return new TableCell({
    width: { size: opts.width, type: WidthType.PERCENTAGE },
    shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill, color: "auto" } : undefined,
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children,
  });
}
function cellTxt(s: string, opts: { width: number; bold?: boolean; color?: string; fill?: string; size?: number } = { width: 20 }) {
  return cell([par([txt(s, { bold: opts.bold, color: opts.color, size: opts.size ?? 16 })], { after: 0 })], { width: opts.width, fill: opts.fill });
}

function linhaMomento(m: MomentoConducao, faixa: boolean) {
  const fill = faixa ? CINZA_CLARO : undefined;
  const voce = m.voceUsa.map((t) => ROT_VOCE[t]).join(" · ") || "—";
  const aluno = m.alunoUsa.map((t) => ROT_ALUNO[t]).join(" · ") || "—";
  return new TableRow({
    children: [
      cellTxt(String(m.numero), { width: 5, bold: true, color: NAVY, fill }),
      cell([
        par([txt(m.titulo, { bold: true, size: 16 })], { after: 0 }),
        par([txt(`${m.duracao} · ${m.meio}`, { size: 13, color: CINZA, italics: true })], { after: 0 }),
      ], { width: 33, fill }),
      cellTxt(voce, { width: 21, fill, size: 15 }),
      cellTxt(aluno, { width: 21, fill, size: 15 }),
      cellTxt(telaoResumo(m), { width: 20, fill, size: 15, color: LARANJA }),
    ],
  });
}

function tabelaMomentos() {
  const head = new TableRow({
    tableHeader: true,
    children: [
      cellTxt("#", { width: 5, bold: true, color: "FFFFFF", fill: NAVY }),
      cellTxt("Momento", { width: 33, bold: true, color: "FFFFFF", fill: NAVY }),
      cellTxt("VOCÊ usa", { width: 21, bold: true, color: "FFFFFF", fill: NAVY }),
      cellTxt("ALUNOS usam", { width: 21, bold: true, color: "FFFFFF", fill: NAVY }),
      cellTxt("No telão", { width: 20, bold: true, color: "FFFFFF", fill: NAVY }),
    ],
  });
  const linhas = ROTEIRO_CONDUCAO.map((m, i) => linhaMomento(m, i % 2 === 1));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
    },
    rows: [head, ...linhas],
  });
}

function tabelaCheatsheet() {
  const linhas: [string, string][] = [
    ["⏳ Tela de espera", "Card do Telão → Espera"],
    ["📱 QR do Quiz", "Card do Telão → Quiz"],
    ["📊 Resultado do Quiz", "Card do Telão → Resultado"],
    ["🌡️ Termômetro", "Card do Telão → Termômetro"],
    ["🏆 Placar / pódio", "Card do Telão → Placar"],
    ["📋 Atividade / Desafio 1-65", "Card do Telão → Atividade ao vivo → escolher"],
    ["📑 Histórico / Estrutura (slides)", "Abrir DIRETO no notebook (Slides das fases)"],
    ["🆘 Telão travou / sem sinal no celular", "No notebook: tecla C → controle local"],
  ];
  const rows = linhas.map(([q, onde], i) => new TableRow({
    children: [
      cellTxt(q, { width: 42, bold: true, fill: i % 2 ? CINZA_CLARO : undefined, size: 16 }),
      cellTxt(onde, { width: 58, fill: i % 2 ? CINZA_CLARO : undefined, size: 16, color: CINZA }),
    ],
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
    },
    rows,
  });
}

export async function gerarGuiaConducaoBuffer(): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 560, bottom: 560, left: 620, right: 620 } } },
      children: [
        par([txt("🧭 Guia de Condução — Curso LGPD (Modalidade C)", { bold: true, size: 30, color: NAVY })], { after: 20, align: AlignmentType.CENTER }),
        par([txt("Painel de Condução · 16 momentos · 2 dias · você comanda pelo celular, o telão obedece", { size: 16, color: CINZA, italics: true })], { after: 120, align: AlignmentType.CENTER }),

        titulo("0 · Antes dos alunos chegarem"),
        bullet("ligue notebook + celular. No Painel (celular), card “Telão do notebook” → Copiar link → abra no notebook + Modo Projeção.", "Sincronize:"),
        bullet("deixe o telão na Tela de espera.", "Telão:"),
        bullet("ligue o Modo Cards (botão no topo do Painel) — ativa o banner “Siga o telão” na home do aluno.", "Modo Cards:"),
        bullet("separe os crachás e distribua no Momento 1 (formação de grupos).", "Crachás:"),

        titulo("Legenda dos chips de dispositivo"),
        par([
          txt("VOCÊ: ", { bold: true, color: NAVY }),
          txt("📱 celular (comanda no Painel)   🖥️ notebook (abre direto)   🗣️ sala (oral).    "),
          txt("ALUNOS: ", { bold: true, color: NAVY }),
          txt("📱 celular deles   🃏 material impresso   💬 discussão."),
        ], { after: 120 }),

        titulo("1 · Os 16 momentos"),
        tabelaMomentos(),

        titulo("3 · Cheat-sheet — o que mostrar no telão"),
        tabelaCheatsheet(),

        titulo("2 · Pontos de atenção"),
        bullet("Histórico/Estrutura abrem no notebook; Desafios e atividades vão pelo telão (atalho “Atividade ao vivo”). É o modelo híbrido.", "Slides:"),
        bullet("não pule os momentos 5–7 (Preliminar, Fase 1, Fase 2) achando que “os slides cobriram” — são fases distintas.", "Sequência:"),
        bullet("o quiz abre pelo QR do telão (anônimo); o crachá é só login. São QRs diferentes.", "Quiz × crachá:"),

        par([txt("Curso LGPD · Modalidade C · gerado a partir do Painel de Condução", { size: 13, color: CINZA, italics: true })], { before: 160, align: AlignmentType.CENTER }),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}
