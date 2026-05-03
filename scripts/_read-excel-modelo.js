// Lê o Excel modelo e devolve TODAS as linhas (raw) por aba.
const XLSX = require("xlsx");

const file = process.argv[2];
if (!file) {
  console.error("Uso: node _read-excel-modelo.js <arquivo.xlsx>");
  process.exit(1);
}

const wb = XLSX.readFile(file, { cellStyles: false, cellFormula: false });
const out = { sheets: {} };

for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const ref = ws["!ref"];
  const range = XLSX.utils.decode_range(ref);
  const rowsCount = range.e.r - range.s.r + 1;
  const cols = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const colLetter = XLSX.utils.encode_col(c);
    const cells = [];
    for (let r = range.s.r; r <= range.e.r; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      cells.push(cell?.v ?? null);
    }
    cols.push({ letter: colLetter, idx: c + 1, cells });
  }
  out.sheets[sheetName] = { ref, rows: rowsCount, columns: cols.length, cols };
}
console.log(JSON.stringify(out, null, 2));
