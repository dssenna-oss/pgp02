/**
 * Aplica os FieldHelp gerados (scripts/_help-output-sec*.json) no schema
 * (lib/inventario-form-schema.ts), aplicando 3 ajustes automáticos:
 *
 *  1. Remove "modelo-pgp" da lista feedsInto (mini-app descritivo, não
 *     consome respostas).
 *  2. Cap em 5 chips por pergunta (slice 0..5 — modelo coloca os mais
 *     relevantes primeiro).
 *  3. Rebaixa criticidade "alta" → "media" pra fields da lista
 *     LOWER_TO_MEDIA (decisão UX — não inflar o selo "alta").
 *
 * Idempotente: pula fields que já têm `help` no schema.
 *
 * Uso:
 *   npx tsx scripts/apply-help-to-schema.ts
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

const SCHEMA_PATH = path.join(
  __dirname,
  "..",
  "lib",
  "inventario-form-schema.ts"
);
const SECTIONS = ["sec3", "sec4", "sec5", "sec6", "sec7"];

// Ajustes
const REMOVE_FROM_FEEDS = new Set(["modelo-pgp"]);
const MAX_FEEDS = 5;
const LOWER_TO_MEDIA = new Set([
  // Sec 2 — já aplicado à mão, mas se rodar de novo afeta nada
  "process_volume",
  // Sec 3
  "data_official_ids",
  // Sec 5
  "collect_source",
  // Sec 6
  "share_subject_aware",
  "share_medium",
  "share_security",
  // Sec 7
  "store_format",
  "store_local_backup",
]);

interface RawHelp {
  why: string;
  lgpd?: { artigo: string; resumo: string };
  feedsInto: string[];
  criticidade?: "alta" | "media";
  exemplos?: string[];
}

function adjustHelp(fieldId: string, h: RawHelp): RawHelp {
  let feeds = (h.feedsInto || []).filter((id) => !REMOVE_FROM_FEEDS.has(id));
  feeds = feeds.slice(0, MAX_FEEDS);
  if (feeds.length === 0) feeds = ["inventario"];

  const criticidade = LOWER_TO_MEDIA.has(fieldId) ? "media" : h.criticidade;

  const out: RawHelp = { why: h.why, feedsInto: feeds };
  if (h.lgpd) out.lgpd = h.lgpd;
  if (criticidade) out.criticidade = criticidade;
  if (h.exemplos && h.exemplos.length > 0) out.exemplos = h.exemplos;
  return out;
}

/** Formata um RawHelp como literal TypeScript com indentação à mão. */
function helpToTs(h: RawHelp, indent: string): string {
  const inner = indent + "  ";
  const lines: string[] = [];
  lines.push(`${indent}help: {`);
  lines.push(`${inner}why: ${JSON.stringify(h.why)},`);
  if (h.lgpd) {
    lines.push(`${inner}lgpd: {`);
    lines.push(`${inner}  artigo: ${JSON.stringify(h.lgpd.artigo)},`);
    lines.push(`${inner}  resumo: ${JSON.stringify(h.lgpd.resumo)},`);
    lines.push(`${inner}},`);
  }
  lines.push(`${inner}feedsInto: ${JSON.stringify(h.feedsInto)},`);
  if (h.criticidade) {
    lines.push(`${inner}criticidade: ${JSON.stringify(h.criticidade)},`);
  }
  if (h.exemplos && h.exemplos.length > 0) {
    lines.push(`${inner}exemplos: [`);
    for (const ex of h.exemplos) {
      lines.push(`${inner}  ${JSON.stringify(ex)},`);
    }
    lines.push(`${inner}],`);
  }
  lines.push(`${indent}},`);
  return lines.join("\n");
}

/**
 * Localiza o field pelo `id: "X",` e injeta o block `help: {...}` antes
 * do `\n      },` que fecha o field (indentação 6 = nível de FormField
 * dentro do array `fields`). Retorna schema inalterado se já tem help.
 */
function injectHelp(
  schema: string,
  fieldId: string,
  helpTs: string
): { result: string; status: "applied" | "already-has-help" | "not-found" } {
  const idMarker = `id: "${fieldId}",`;
  const idPos = schema.indexOf(idMarker);
  if (idPos < 0) return { result: schema, status: "not-found" };

  // Procura próximo "\n      }," (6 spaces) após o id — fechamento do field
  const closePos = schema.indexOf("\n      },", idPos);
  if (closePos < 0) return { result: schema, status: "not-found" };

  const fieldText = schema.slice(idPos, closePos);
  if (fieldText.includes("help: {")) {
    return { result: schema, status: "already-has-help" };
  }

  const newSchema =
    schema.slice(0, closePos) + "\n" + helpTs + schema.slice(closePos);
  return { result: newSchema, status: "applied" };
}

function main() {
  let schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  const tally = { applied: 0, skipped: 0, notFound: 0 };

  for (const sec of SECTIONS) {
    const file = path.join(__dirname, `_help-output-${sec}.json`);
    if (!fs.existsSync(file)) {
      console.warn(`⚠️  ${sec}: arquivo ${file} não existe, pulando`);
      continue;
    }
    const helpData = JSON.parse(fs.readFileSync(file, "utf-8")) as Record<
      string,
      RawHelp
    >;
    console.log(`\n📋 ${sec} — ${Object.keys(helpData).length} entrada(s)`);

    for (const [fieldId, rawHelp] of Object.entries(helpData)) {
      const adjusted = adjustHelp(fieldId, rawHelp);
      const helpTs = helpToTs(adjusted, "        ");
      const r = injectHelp(schema, fieldId, helpTs);
      schema = r.result;
      if (r.status === "applied") {
        tally.applied++;
        console.log(`  ✓ ${fieldId}`);
      } else if (r.status === "already-has-help") {
        tally.skipped++;
        console.log(`  ⊙ ${fieldId} (já tem help)`);
      } else {
        tally.notFound++;
        console.log(`  ✗ ${fieldId} (não encontrado)`);
      }
    }
  }

  fs.writeFileSync(SCHEMA_PATH, schema, "utf-8");
  console.log(
    `\n💾 Salvo. ${tally.applied} aplicados · ${tally.skipped} pulados · ${tally.notFound} não-encontrados`
  );
}

main();
