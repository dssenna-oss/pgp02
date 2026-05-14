/**
 * Lê `scripts/_gap-modelo-em-branco.xlsx` (aba "Controles") e gera
 * `lib/gap-catalog.ts` com os 119 controles digitalizados — agrupados
 * por domínio, com tipo de instrução normalizado e parentCode pros
 * filhos (checkbox items + condicionais).
 *
 * Roda offline com `npx tsx scripts/generate-gap-catalog.ts`. Não precisa
 * de banco de dados nem variáveis de ambiente.
 *
 * Sempre que o template oficial do XLSX for atualizado, basta rodar de
 * novo — o `lib/gap-catalog.ts` é regenerado por completo.
 */

import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const XLSX_PATH = path.resolve("scripts/_gap-modelo-em-branco.xlsx");
const OUT_PATH = path.resolve("lib/gap-catalog.ts");

// ---------- Tipos ----------

type GapInstructionType =
  | "DESCREVER"
  | "SN"
  | "CHECKBOX_ITEM"
  | "CONDICIONAL";

interface GapControlRaw {
  excelRow: number;
  num: number | null;
  domain: string | null;
  instructionRaw: string | null;
  question: string;
  article: string | null;
  chapter: string | null;
}

interface GapControl {
  code: string;
  excelRow: number;
  number: number | null;
  domainCode: string;
  domain: string;
  instruction: GapInstructionType;
  instructionRaw: string;
  question: string;
  article: string | null;
  chapter: string | null;
  parentCode: string | null;
}

interface GapDomain {
  code: string;
  name: string;
  controls: GapControl[];
}

// ---------- Helpers ----------

const slug = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const cleanText = (v: unknown): string =>
  v == null ? "" : String(v).replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();

const normInstruction = (raw: string | null): GapInstructionType | null => {
  if (!raw) return null;
  const t = cleanText(raw).toLowerCase();
  if (t === "descrever") return "DESCREVER";
  if (t === "s/n") return "SN";
  // No XLSX, "Checkbox" aparece na coluna Instruções da 1ª linha do
  // grupo de itens marcáveis, mas essa linha JÁ é o 1º item — não é
  // uma "pergunta-pai checkbox" separada. Tratamos como CHECKBOX_ITEM
  // pendurado na pergunta numerada anterior.
  if (t === "checkbox") return "CHECKBOX_ITEM";
  if (t.startsWith("se a pergunta") || t.startsWith("se a resposta"))
    return "CONDICIONAL";
  return null;
};

const pad3 = (n: number): string => n.toString().padStart(3, "0");

// ---------- Leitura ----------

if (!fs.existsSync(XLSX_PATH)) {
  console.error(`✗ XLSX não encontrado: ${XLSX_PATH}`);
  process.exit(1);
}

const wb = XLSX.readFile(XLSX_PATH, { cellStyles: false, cellFormula: false });
const ctrl = wb.Sheets["Controles"];
if (!ctrl) {
  console.error("✗ Aba 'Controles' não encontrada");
  process.exit(1);
}

const range = XLSX.utils.decode_range(ctrl["!ref"]!);
const get = (r: number, c: number): unknown =>
  ctrl[XLSX.utils.encode_cell({ r, c })]?.v ?? null;

// Cabeçalho fica em L5 (idx 4); dados começam em L7 (idx 6).
// Colunas: B=num(1), C=dom(2), D=ins(3), E=quest(4), F=art(5), G=cap(6)

const raw: GapControlRaw[] = [];
for (let r = 6; r <= range.e.r; r++) {
  const num = get(r, 1);
  const dom = get(r, 2);
  const ins = get(r, 3);
  const quest = get(r, 4);
  const art = get(r, 5);
  const cap = get(r, 6);
  if (!num && !ins && !quest) continue;
  raw.push({
    excelRow: r + 1,
    num: typeof num === "number" ? num : num ? Number(num) : null,
    domain: dom ? cleanText(dom) : null,
    instructionRaw: ins ? cleanText(ins) : null,
    question: cleanText(quest),
    article: art ? cleanText(art) : null,
    chapter: cap ? cleanText(cap) : null,
  });
}

console.log(`Linhas com conteúdo na aba Controles: ${raw.length}`);

// ---------- Resolução de Domínio + Pai ----------

// Estratégia:
// - Linha COM número e COM domínio: é PERGUNTA-PAI numerada. Vira o
//   "domínio corrente" e também o "pai corrente" (pra condicionais).
// - Linha SEM número e COM instrução normalizável (Checkbox/Condicional/
//   Descrever/SN): herda domínio do pai numerado mais recente. Se for
//   Checkbox, vira o "checkbox-pai corrente" (pros próximos itens).
// - Linha SEM número e SEM instrução: é CHECKBOX_ITEM, herda domínio do
//   pai numerado e parent = checkbox-pai corrente.

let currentDomain: string | null = null;
let currentNumberedCode: string | null = null;

const controls: GapControl[] = [];
let codeSeq = 0;

for (const r of raw) {
  codeSeq += 1;
  const code = pad3(codeSeq);

  // Domínio efetivo
  let domain = r.domain;
  if (r.num && r.domain) {
    currentDomain = r.domain;
    currentNumberedCode = code;
  } else if (!domain && currentDomain) {
    domain = currentDomain;
  }

  if (!domain) {
    // Caso patológico: linha numerada órfã sem domínio (existe 1 caso no
    // template). Cai no domínio anterior se houver.
    domain = currentDomain ?? "Sem domínio";
  }

  // Tipo de instrução: se não normalizar (vazio), assume continuação de
  // CHECKBOX_ITEM da linha imediatamente anterior.
  const instruction: GapInstructionType =
    normInstruction(r.instructionRaw) ?? "CHECKBOX_ITEM";

  // Parent: raiz é a pergunta numerada com domínio próprio. Tudo o mais
  // (filhos condicionais, itens de checkbox, S/N de sub-pergunta) pendura
  // no controle numerado mais recente.
  const isRoot = !!(r.num && r.domain);
  const parentCode = isRoot ? null : currentNumberedCode;

  controls.push({
    code,
    excelRow: r.excelRow,
    number: r.num,
    domainCode: slug(domain),
    domain,
    instruction,
    instructionRaw: r.instructionRaw ?? "",
    question: r.question,
    article: r.article,
    chapter: r.chapter,
    parentCode: parentCode === code ? null : parentCode,
  });
}

console.log(`Total de controles digitalizados: ${controls.length}`);

// Distribuição por tipo
const dist = new Map<GapInstructionType, number>();
for (const c of controls) {
  dist.set(c.instruction, (dist.get(c.instruction) ?? 0) + 1);
}
console.log("Distribuição por tipo:");
for (const [k, v] of dist.entries()) console.log(`  ${k}: ${v}`);

// ---------- Agrupamento por domínio ----------

const byDomain = new Map<string, GapDomain>();
for (const c of controls) {
  if (!byDomain.has(c.domainCode)) {
    byDomain.set(c.domainCode, {
      code: c.domainCode,
      name: c.domain,
      controls: [],
    });
  }
  byDomain.get(c.domainCode)!.controls.push(c);
}
console.log(`Domínios: ${byDomain.size}`);

// ---------- Emitir TypeScript ----------

const header = `/**
 * GAP Analysis (Checkpoint 9) — Catálogo dos 119 controles do template
 * oficial "Matriz de Controles e Avaliação de Gaps" (LGPD PRO / Denise).
 *
 * ⚠ Arquivo GERADO. Não editar à mão. Pra atualizar:
 *   1. Substituir \`scripts/_gap-modelo-em-branco.xlsx\` pela nova versão
 *   2. Rodar: npx tsx scripts/generate-gap-catalog.ts
 *
 * Origem: aba "Controles" do XLSX. Cada \`GapControl\` representa 1 LINHA
 * marcável (incluindo sub-perguntas condicionais e itens individuais
 * de checkbox — todas podem receber resposta no template).
 */

export type GapInstructionType =
  | "DESCREVER"
  | "SN"
  | "CHECKBOX_ITEM"
  | "CONDICIONAL";

export interface GapControl {
  /** Código estável "001"–"${pad3(controls.length)}" (ordem de aparição no XLSX). */
  code: string;
  /** Linha original no XLSX (pra debug/auditoria). */
  excelRow: number;
  /** Número que aparece na coluna "Controle" (1–36) ou null pra filhos. */
  number: number | null;
  /** Slug do domínio (chave do agrupamento). */
  domainCode: string;
  /** Nome completo do domínio (texto do XLSX). */
  domain: string;
  /** Tipo normalizado da instrução. */
  instruction: GapInstructionType;
  /** Texto literal da coluna "Instruções" (pra UI mostrar contexto). */
  instructionRaw: string;
  /** Texto da pergunta / item. */
  question: string;
  /** Texto do artigo de lei correspondente (coluna F). */
  article: string | null;
  /** Capítulo da LGPD (coluna G). */
  chapter: string | null;
  /** Código do controle pai (pra checkbox items e condicionais). */
  parentCode: string | null;
}

export interface GapDomain {
  code: string;
  name: string;
  controls: GapControl[];
}

/** Total de controles no catálogo (= total de linhas marcáveis no XLSX). */
export const GAP_TOTAL = ${controls.length} as const;

/** Lista plana de todos os controles, na ordem do XLSX. */
export const GAP_CONTROLS: GapControl[] = ${JSON.stringify(controls, null, 2)};

/** Domínios na ordem em que aparecem no XLSX, com seus controles. */
export const GAP_DOMAINS: GapDomain[] = ${JSON.stringify([...byDomain.values()], null, 2)};

const _byCode = new Map<string, GapControl>(GAP_CONTROLS.map((c) => [c.code, c]));

/** Lookup O(1) por código. */
export function getControlByCode(code: string): GapControl | undefined {
  return _byCode.get(code);
}
`;

fs.writeFileSync(OUT_PATH, header, "utf8");
console.log(`\n✓ Gerado: ${OUT_PATH}`);
console.log(`  ${controls.length} controles em ${byDomain.size} domínios`);
