// Shim mínimo pro módulo `diff` (jsdiff) usado em:
//   - lib/ripd-diff.ts (Checkpoint 13)
//   - app/api/politicas/[id]/diff/route.ts (Checkpoint 12)
//
// Cobrimos só as funções que usamos. Se precisar mais no futuro,
// estender este arquivo.

declare module "diff" {
  export interface Change {
    value: string;
    added?: boolean;
    removed?: boolean;
    count?: number;
  }

  export function diffWords(oldStr: string, newStr: string): Change[];
  export function diffLines(oldStr: string, newStr: string): Change[];
  export function diffChars(oldStr: string, newStr: string): Change[];
}
