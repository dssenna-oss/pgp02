/**
 * Extrai cabeçalhos completos das abas operacionais (linha 4) +
 * algumas linhas de exemplo, ignorando colunas vazias.
 */
import fs from "fs";
import * as XLSX from "xlsx";

const arg = process.argv[2];
const buf = fs.readFileSync(arg);
const wb = XLSX.read(buf, { type: "buffer", cellDates: true });

const SHEETS = ["Mapa de Processos", "Mapa de Fornecedores", "Risk Management", "Plano de Ação"];
const HEADER_ROWS: Record<string, number> = {
  "Mapa de Processos": 4,
  "Mapa de Fornecedores": 4,
  "Risk Management": 3,
  "Plano de Ação": 3,
};

for (const name of SHEETS) {
  const sheet = wb.Sheets[name];
  if (!sheet) continue;
  const aoa = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false, defval: null });
  const headerRowIdx = (HEADER_ROWS[name] ?? 4) - 1;
  const headers = aoa[headerRowIdx] || [];
  const subHeaders = aoa[headerRowIdx + 1] || []; // 2ª linha de cabeçalho (ex: SIM/NÃO)

  console.log(`\n========== ${name} ==========`);
  for (let i = 0; i < headers.length; i++) {
    if (headers[i]) {
      const sub = subHeaders[i] && subHeaders[i] !== headers[i] ? ` [${subHeaders[i]}]` : "";
      console.log(`   col ${i + 1}: ${String(headers[i]).slice(0, 80).replace(/\n/g, " ")}${sub}`);
    }
  }

  // 2 linhas de exemplo (fora do cabeçalho)
  const sampleStart = headerRowIdx + 2;
  console.log(`\n   Exemplos:`);
  for (let r = sampleStart; r < Math.min(sampleStart + 2, aoa.length); r++) {
    const row = aoa[r] || [];
    const filled = row
      .map((c, i) => {
        if (!c || !headers[i]) return null;
        return `${headers[i]}: ${String(c).slice(0, 60).replace(/\n/g, " ")}`;
      })
      .filter(Boolean);
    console.log(`     [${filled.length} campos preenchidos]`);
    for (const f of filled.slice(0, 6)) console.log(`        ${f}`);
  }
}
