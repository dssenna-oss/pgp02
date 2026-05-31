/**
 * Helpers de cláusulas de operadores (Fase 6) — versão mono do app do Comitê.
 * Só o necessário pro gerador de cláusulas (Checkpoint 14 do app principal):
 * tipos de cláusula + label. Sem modelo Operator (mono não tem Terceiros).
 */

export const RECOMMENDED_CLAUSE = {
  ROBUSTA: "ROBUSTA",
  SIMPLES: "SIMPLES",
  CC: "CC",
  CLIENTE_OPERADOR: "CLIENTE_OPERADOR",
  MINUTA: "MINUTA",
} as const;
export type RecommendedClause = (typeof RECOMMENDED_CLAUSE)[keyof typeof RECOMMENDED_CLAUSE];

export function recommendedClauseLabel(r: string | null | undefined): string {
  switch (r) {
    case "ROBUSTA":          return "Cláusula Controlador × Operador (robusta)";
    case "SIMPLES":          return "Cláusula Controlador × Operador (simples)";
    case "CC":               return "Cláusula Controlador × Controlador";
    case "CLIENTE_OPERADOR": return "Cláusula Operador (Cliente) × Controlador";
    case "MINUTA":           return "Minuta de cláusula padrão";
    default:                 return "—";
  }
}
