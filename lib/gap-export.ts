/**
 * Gera o XLSX de exportação do GAP Analysis (decisão 10b).
 *
 * Estratégia: carrega o **template oficial** em branco
 * (`scripts/_gap-modelo-em-branco.xlsx`) e sobrescreve apenas as
 * células dinâmicas:
 *   - Aba "Perfil da Organização" — D6 = nome da org
 *   - Aba "Controles" colunas H-K (Cenário/Mapeamento/Aderência/Ponto de
 *     Melhoria) das linhas 7-128
 *
 * O template tem 143 fórmulas na aba "Analítico" que referenciam
 * `Controles!J` (a coluna Aderência). Ao sobrescrevermos essas células,
 * as fórmulas continuam apontando pra valores válidos e o Excel
 * recalcula automaticamente quando abre o arquivo. Isso preserva todo
 * o painel analítico do template original sem precisarmos reproduzí-lo
 * em código.
 *
 * Os textos do template usam labels ricos com acento/maiúsculas
 * ("Aderente", "Parcialmente Aderente", "Não Aderente"). Essa file faz
 * a tradução das chaves enum (`PARCIAL`, `NAO_ADERENTE`, etc.) pros
 * labels do template — caso contrário as fórmulas COUNTIF não encaixam.
 */

import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { GAP_CONTROLS } from "@/lib/gap-catalog";
import type { GapAnswerDTO } from "@/lib/gap-helpers";

// Caminho absoluto do template (lido do FS no server)
const TEMPLATE_PATH = path.resolve(
  process.cwd(),
  "scripts/_gap-modelo-em-branco.xlsx",
);

// ---------- Tradução enum → labels do template ----------

function aderenciaLabel(v: string | null): string {
  switch (v) {
    case "ADERENTE":
      return "Aderente";
    case "PARCIAL":
      return "Parcialmente Aderente";
    case "NAO_ADERENTE":
      return "Não Aderente";
    case "NA":
      return "N/A";
    default:
      return "";
  }
}

function mapeamentoLabel(v: string | null): string {
  switch (v) {
    case "NAO_INICIADO":
      return "Não iniciado";
    case "EM_ANDAMENTO":
      return "Em andamento";
    case "FINALIZADO":
      return "Finalizado";
    default:
      return "";
  }
}

// ---------- Tipos do input ----------

export interface GapExportInput {
  /** Nome da organização (vai pra célula D6 do Perfil). */
  companyName: string;
  /** Respostas (formato DTO já serializado). */
  answers: ReadonlyArray<{
    controlCode: string;
    cenarioAtual: string | null;
    mapeamento: string | null;
    aderencia: string | null;
    pontoMelhoria: string | null;
  }>;
  /** Rótulo opcional pra subtítulo (usado quando export é de snapshot). */
  snapshotLabel?: string;
}

// ---------- Geração ----------

/**
 * Devolve um Buffer do XLSX pronto pra streaming (response.body).
 *
 * Lê o template do FS a cada chamada (síncrono — arquivo pequeno, ~80 KB).
 * Não cacheamos em memória pra evitar drift caso o template seja
 * substituído em runtime.
 */
export function buildGapExportXLSX(input: GapExportInput): Buffer {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(
      `Template GAP não encontrado: ${TEMPLATE_PATH}. ` +
        "Confira que scripts/_gap-modelo-em-branco.xlsx existe no repo.",
    );
  }

  // Lemos via fs.readFileSync + XLSX.read em vez de XLSX.readFile pra
  // evitar problemas com o resolvedor de FS interno da SheetJS dentro do
  // bundle do Next.js (em alguns runtimes ele falha com "Cannot access
  // file" mesmo quando o arquivo existe).
  const tplBuffer = fs.readFileSync(TEMPLATE_PATH);
  const wb = XLSX.read(tplBuffer, {
    type: "buffer",
    cellFormula: true,
    cellStyles: true,
  });

  // ---------- Aba "Perfil da Organização" ----------
  const perfil = wb.Sheets["Perfil da Organização"];
  if (perfil) {
    setCell(perfil, "D6", input.companyName);
    if (input.snapshotLabel) {
      // Anota o snapshot na própria aba pra rastreabilidade
      setCell(
        perfil,
        "D20",
        `Snapshot: ${input.snapshotLabel} — exportado em ${new Date().toLocaleString("pt-BR")}`,
      );
    } else {
      setCell(
        perfil,
        "D20",
        `Estado atual exportado em ${new Date().toLocaleString("pt-BR")}`,
      );
    }
  }

  // ---------- Aba "Controles" ----------
  const ctrl = wb.Sheets["Controles"];
  if (!ctrl) {
    throw new Error("Aba 'Controles' não encontrada no template.");
  }

  // Lookup rápido das respostas por code
  const answersByCode = new Map(input.answers.map((a) => [a.controlCode, a]));

  // Cada controle do catálogo tem `excelRow` (1-based) — usar ele pra
  // garantir que escrevemos na mesma linha do template original.
  for (const ctrlDef of GAP_CONTROLS) {
    const ans = answersByCode.get(ctrlDef.code);
    if (!ans) continue;

    const r = ctrlDef.excelRow - 1; // XLSX usa 0-based
    // Coluna H (idx 7) = Cenário Atual
    if (ans.cenarioAtual) setCell(ctrl, addr(r, 7), ans.cenarioAtual);
    // Coluna I (idx 8) = Mapeamento
    const mapLabel = mapeamentoLabel(ans.mapeamento);
    if (mapLabel) setCell(ctrl, addr(r, 8), mapLabel);
    // Coluna J (idx 9) = Aderência (campo das fórmulas COUNTIF do Analítico)
    const adeLabel = aderenciaLabel(ans.aderencia);
    if (adeLabel) setCell(ctrl, addr(r, 9), adeLabel);
    // Coluna K (idx 10) = Ponto de Melhoria
    if (ans.pontoMelhoria) setCell(ctrl, addr(r, 10), ans.pontoMelhoria);
  }

  // ---------- Serializa ----------
  const buf = XLSX.write(wb, {
    type: "buffer",
    bookType: "xlsx",
    cellStyles: true,
  });
  return buf as Buffer;
}

// ---------- Helpers ----------

function addr(r: number, c: number): string {
  return XLSX.utils.encode_cell({ r, c });
}

/**
 * Sobrescreve uma célula preservando seu estilo (se existir). Cria a
 * célula se ainda não existir.
 */
function setCell(
  sheet: XLSX.WorkSheet,
  address: string,
  value: string | number,
): void {
  const existing = sheet[address];
  const cell: XLSX.CellObject =
    typeof value === "number"
      ? { t: "n", v: value }
      : { t: "s", v: String(value) };
  if (existing?.s) cell.s = existing.s;
  sheet[address] = cell;
}

/** Sugere um nome de arquivo amigável pra download. */
export function suggestFilename(input: {
  companyName: string;
  snapshotLabel?: string;
}): string {
  const safe = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60);

  const date = new Date().toISOString().slice(0, 10);
  const orgPart = safe(input.companyName) || "Organizacao";
  const labelPart = input.snapshotLabel
    ? `_${safe(input.snapshotLabel)}`
    : "_atual";
  return `GAP_${orgPart}${labelPart}_${date}.xlsx`;
}
