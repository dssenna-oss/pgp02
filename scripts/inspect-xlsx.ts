/**
 * Inspeciona um arquivo .xlsx — lista sheets, headers e algumas linhas
 * de exemplo. Uso: npx tsx scripts/inspect-xlsx.ts "<caminho>"
 */
import fs from "fs";
import * as XLSX from "xlsx";

const arg = process.argv[2];
if (!arg) {
  console.error("Uso: npx tsx scripts/inspect-xlsx.ts <caminho-do-xlsx>");
  process.exit(1);
}

const buf = fs.readFileSync(arg);
const wb = XLSX.read(buf, { type: "buffer", cellDates: true });

console.log(`📊 ${arg}`);
console.log(`   ${wb.SheetNames.length} aba(s): ${wb.SheetNames.join(", ")}\n`);

for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
  const rowCount = range.e.r - range.s.r + 1;
  const colCount = range.e.c - range.s.c + 1;
  console.log(`========== ABA: "${name}" ==========`);
  console.log(`   ${rowCount} linhas × ${colCount} colunas (range: ${sheet["!ref"]})`);

  // Detecta merges
  const merges = sheet["!merges"] || [];
  if (merges.length > 0) {
    console.log(`   ${merges.length} célula(s) mescladas`);
  }

  // Pega as primeiras linhas como AOA
  const aoa = XLSX.utils.sheet_to_json<any[]>(sheet, {
    header: 1,
    raw: false,
    defval: null,
  });

  // Mostra até 8 primeiras linhas
  const sample = aoa.slice(0, 8);
  console.log(`\n   Primeiras linhas:`);
  for (let i = 0; i < sample.length; i++) {
    const row = sample[i];
    const cells = (row as any[]).slice(0, 12).map((c) => {
      if (c === null || c === undefined) return "—";
      const s = String(c);
      return s.length > 40 ? s.slice(0, 40) + "…" : s;
    });
    console.log(`   ${String(i + 1).padStart(3, " ")}: ${cells.join(" | ")}`);
  }

  // Tenta detectar dropdowns (validations) na sheet
  const validations: any = (sheet as any)["!dataValidations"];
  if (validations) {
    console.log(`\n   Validações de dados (dropdowns): ${JSON.stringify(validations).slice(0, 200)}…`);
  }

  console.log("");
}
