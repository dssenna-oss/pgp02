/**
 * Gerador do índice de conteúdo das Fases (CP25 — busca textual).
 *
 * Lê os 9 arquivos `components/fases/fase-*-content.tsx` (e o
 * `fase-preliminar-content.tsx` / `fase-0-content.tsx`), extrai o texto
 * estático que está hardcoded dentro de `defaultContent={`…`}` e nas
 * arrays `checklistSections = [...]`, e gera `lib/phase-content-index.ts`.
 *
 * O índice resultante é consumido por `lib/phase-search.ts` pra buscar
 * texto que NÃO veio do banco (admin não personalizou).
 *
 * Re-rode quando alterar conteúdo hardcoded em qualquer fase:
 *   npx ts-node scripts/generate-phase-content-index.ts
 */

import * as fs from "fs";
import * as path from "path";

interface PhaseSource {
  /** ID da fase (ex.: "fase-3", "preliminar", "entendendo-pgp") */
  id: string;
  /** Caminho relativo ao repo do arquivo .tsx */
  file: string;
}

const SOURCES: ReadonlyArray<PhaseSource> = [
  { id: "entendendo-pgp", file: "components/fases/fase-0-content.tsx" },
  { id: "preliminar", file: "components/fases/fase-preliminar-content.tsx" },
  { id: "fase-1", file: "components/fases/fase-1-content.tsx" },
  { id: "fase-2", file: "components/fases/fase-2-content.tsx" },
  { id: "fase-3", file: "components/fases/fase-3-content.tsx" },
  { id: "fase-4", file: "components/fases/fase-4-content.tsx" },
  { id: "fase-5", file: "components/fases/fase-5-content.tsx" },
  { id: "fase-6", file: "components/fases/fase-6-content.tsx" },
  { id: "fase-7", file: "components/fases/fase-7-content.tsx" },
];

/**
 * Extrai TODOS os blocos `defaultContent={`…`}` (template literals) do
 * arquivo. Concatena em uma única string com separadores `\n\n`.
 */
function extractDefaultContent(source: string): string {
  const blocks: string[] = [];
  // Busca `defaultContent={`...`}` — template literal entre backticks
  const re = /defaultContent=\{`([\s\S]*?)`\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    blocks.push(m[1]);
  }
  return blocks.join("\n\n").trim();
}

/**
 * Extrai todos os `label: "..."` das arrays `checklistSections`.
 * Busca também os `title: "..."` dos blocos de seção pra contexto.
 */
function extractChecklist(source: string): string {
  // Localiza o trecho `checklistSections = [` até o `];` terminador
  const startIdx = source.indexOf("checklistSections = [");
  if (startIdx < 0) return "";
  // Encontra o fechamento `];` (assumindo bem balanceado)
  let depth = 0;
  let endIdx = -1;
  for (let i = startIdx; i < source.length; i++) {
    const c = source[i];
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  if (endIdx < 0) return "";
  const block = source.slice(startIdx, endIdx + 1);
  // Pega títulos e labels
  const labels: string[] = [];
  const titleRe = /title:\s*"([^"]+)"/g;
  const labelRe = /label:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = titleRe.exec(block)) !== null) labels.push("# " + m[1]);
  while ((m = labelRe.exec(block)) !== null) labels.push(m[1]);
  return labels.join("\n");
}

interface IndexEntry {
  description: string;
  checklist: string;
}

function buildIndex(): Record<string, IndexEntry> {
  const repoRoot = process.cwd();
  const out: Record<string, IndexEntry> = {};
  for (const src of SOURCES) {
    const fullPath = path.join(repoRoot, src.file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  Pulando ${src.id} — arquivo não existe: ${src.file}`);
      continue;
    }
    const raw = fs.readFileSync(fullPath, "utf8");
    out[src.id] = {
      description: extractDefaultContent(raw),
      checklist: extractChecklist(raw),
    };
    console.log(
      `✅ ${src.id.padEnd(18)} description=${out[src.id].description.length} chars · checklist=${out[src.id].checklist.length} chars`,
    );
  }
  return out;
}

function generateModule(index: Record<string, IndexEntry>): string {
  const lines: string[] = [
    "/**",
    " * Índice de conteúdo das Fases — GERADO por",
    " * `scripts/generate-phase-content-index.ts`.",
    " *",
    " * NÃO EDITE À MÃO. Pra atualizar, rode:",
    " *   npx ts-node scripts/generate-phase-content-index.ts",
    " *",
    " * Consumido por `lib/phase-search.ts` (CP25 — busca textual).",
    " */",
    "",
    "export interface PhaseContentIndexEntry {",
    "  /** HTML/texto da Descrição padrão (defaultContent) */",
    "  description: string;",
    "  /** Texto plano das seções e itens do Checklist */",
    "  checklist: string;",
    "}",
    "",
    "export const PHASE_CONTENT_INDEX: Record<string, PhaseContentIndexEntry> = {",
  ];
  for (const [id, entry] of Object.entries(index)) {
    lines.push(`  ${JSON.stringify(id)}: {`);
    lines.push(`    description: ${JSON.stringify(entry.description)},`);
    lines.push(`    checklist: ${JSON.stringify(entry.checklist)},`);
    lines.push("  },");
  }
  lines.push("};");
  lines.push("");
  return lines.join("\n");
}

function main() {
  console.log("📚 Extraindo conteúdo hardcoded das Fases…\n");
  const index = buildIndex();
  const module = generateModule(index);
  const outPath = path.resolve(process.cwd(), "lib", "phase-content-index.ts");
  fs.writeFileSync(outPath, module, "utf8");
  console.log(`\n✅ Gerado: ${outPath}`);
  console.log(`   Total: ${Object.keys(index).length} fases.`);
}

main();
