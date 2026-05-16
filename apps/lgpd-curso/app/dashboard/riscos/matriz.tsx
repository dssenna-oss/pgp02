// Matriz visual 3×3 P × I

type Risco = {
  id: string;
  riscoTitulo: string;
  severityLevel: string | null;
};

function parseLevel(severityLevel: string | null) {
  if (!severityLevel) return { p: null, i: null, s: null };
  const parts = Object.fromEntries(severityLevel.split(";").map((kv) => kv.split(":")));
  return { p: parts.P, i: parts.I, s: parts.S };
}

const CELL_BG: Record<string, string> = {
  "B-B": "bg-emerald-100",
  "B-M": "bg-emerald-100",
  "B-A": "bg-amber-100",
  "M-B": "bg-emerald-100",
  "M-M": "bg-amber-100",
  "M-A": "bg-red-100",
  "A-B": "bg-amber-100",
  "A-M": "bg-red-100",
  "A-A": "bg-red-200",
};

export function MatrizRiscos({ riscos }: { riscos: Risco[] }) {
  // Agrupa riscos por célula P-I
  const cells: Record<string, Risco[]> = {};
  for (const r of riscos) {
    const { p, i } = parseLevel(r.severityLevel);
    if (!p || !i) continue;
    const key = `${p}-${i}`;
    if (!cells[key]) cells[key] = [];
    cells[key].push(r);
  }

  const probs = ["A", "M", "B"] as const; // alta no topo
  const impactos = ["B", "M", "A"] as const;

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3">Matriz 3×3 Probabilidade × Impacto</h3>
      <div className="grid grid-cols-[40px_1fr_1fr_1fr] gap-1 text-xs">
        {probs.map((p) => (
          <>
            <div key={`label-${p}`} className="flex items-center justify-center font-semibold text-gray-600">
              {p === "A" ? "Alta" : p === "M" ? "Média" : "Baixa"}
            </div>
            {impactos.map((i) => {
              const key = `${p}-${i}`;
              const list = cells[key] || [];
              return (
                <div key={`${p}-${i}`} className={`min-h-[80px] p-2 rounded ${CELL_BG[key] || "bg-gray-50"}`}>
                  <div className="text-[10px] text-gray-600 mb-1 font-medium">P:{p} · I:{i}</div>
                  {list.map((r) => (
                    <div key={r.id} className="text-[11px] bg-white/70 rounded px-1.5 py-0.5 mb-1 leading-tight">
                      {r.riscoTitulo}
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        ))}
        <div></div>
        {impactos.map((i) => (
          <div key={`limpacto-${i}`} className="text-center font-semibold text-gray-600 mt-1">
            {i === "B" ? "Baixo" : i === "M" ? "Médio" : "Alto"}
          </div>
        ))}
      </div>
      <div className="mt-3 text-[10px] text-gray-500 flex items-center justify-between">
        <span>← Impacto →</span>
        <span>↑ Probabilidade ↑</span>
      </div>
    </div>
  );
}
