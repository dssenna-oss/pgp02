/**
 * Engine pura de diff entre 2 estados do GAP (polimento C1).
 *
 * Compara 2 listas de respostas (snapshot A vs snapshot B, ou snapshot
 * vs estado atual) e devolve:
 *   - Score de cada lado + delta
 *   - Lista de mudanças com classificação (IMPROVED / WORSENED /
 *     CHANGED / NEW / REMOVED)
 *   - Contadores agregados pra UI
 *
 * Função pura: caller passa as 2 listas já carregadas. Sem chamadas
 * a banco aqui.
 */

import { GAP_CONTROLS } from "@/lib/gap-catalog";

// ============================================================
// Tipos
// ============================================================

export interface CompareAnswer {
  controlCode: string;
  cenarioAtual: string | null;
  mapeamento: string | null;
  aderencia: string | null;
  pontoMelhoria: string | null;
}

export type DiffChangeType =
  | "NEW"        // existia em B mas não em A (resposta criada na 2ª versão)
  | "REMOVED"    // existia em A mas não em B (resposta removida)
  | "IMPROVED"   // aderência melhorou (ex: NAO_ADERENTE → PARCIAL)
  | "WORSENED"   // aderência piorou (ex: ADERENTE → NAO_ADERENTE)
  | "CHANGED";   // texto/mapeamento mudou mas aderência igual

export interface DiffChange {
  controlCode: string;
  /** Número humano do controle (1-36) ou null pra filhos. */
  controlNumber: number | null;
  /** Domínio (puxado do catálogo). */
  domain: string;
  /** Pergunta (puxada do catálogo). */
  question: string;
  type: DiffChangeType;
  from: CompareAnswer | null;
  to: CompareAnswer | null;
}

export interface DiffCounts {
  improved: number;
  worsened: number;
  changed: number;
  added: number;
  removed: number;
  unchanged: number;
}

export interface GapDiff {
  scoreA: number | null;
  scoreB: number | null;
  /** Delta absoluto (B - A), null se algum dos lados é null. */
  scoreDelta: number | null;
  changes: DiffChange[];
  counts: DiffCounts;
  /** Total de controles respondidos em A. */
  answeredA: number;
  /** Total de controles respondidos em B. */
  answeredB: number;
}

// ============================================================
// Helpers
// ============================================================

function aderenciaScore(v: string | null): number | null {
  if (v === "ADERENTE") return 100;
  if (v === "PARCIAL") return 50;
  if (v === "NAO_ADERENTE") return 0;
  // NA e null não pesam (excluídos do score)
  return null;
}

/** Score 0-100 do GAP (mesma fórmula do Diagnóstico). */
function computeScore(answers: ReadonlyArray<CompareAnswer>): number | null {
  const respondidos = answers.filter(
    (a) => a.aderencia && a.aderencia !== "NA",
  );
  if (respondidos.length === 0) return null;
  const sum = respondidos.reduce((acc, a) => {
    if (a.aderencia === "ADERENTE") return acc + 1;
    if (a.aderencia === "PARCIAL") return acc + 0.5;
    return acc;
  }, 0);
  return Math.round((sum / respondidos.length) * 100);
}

function answerHasContent(a: CompareAnswer): boolean {
  return !!(a.cenarioAtual || a.mapeamento || a.aderencia || a.pontoMelhoria);
}

function compareOne(
  a: CompareAnswer | undefined,
  b: CompareAnswer | undefined,
): DiffChangeType | null {
  const aHas = a && answerHasContent(a);
  const bHas = b && answerHasContent(b);
  if (!aHas && !bHas) return null;
  if (!aHas && bHas) return "NEW";
  if (aHas && !bHas) return "REMOVED";

  // Ambos têm conteúdo — compara aderência (sinal mais forte)
  const wA = aderenciaScore(a!.aderencia);
  const wB = aderenciaScore(b!.aderencia);
  if (wA != null && wB != null && wA !== wB) {
    return wB > wA ? "IMPROVED" : "WORSENED";
  }
  // Aderência igual (ou um/ambos null/NA) — compara mapeamento + textos
  const sameMap = a!.mapeamento === b!.mapeamento;
  const sameCenario = (a!.cenarioAtual ?? "") === (b!.cenarioAtual ?? "");
  const samePM = (a!.pontoMelhoria ?? "") === (b!.pontoMelhoria ?? "");
  const sameAde = a!.aderencia === b!.aderencia;
  if (sameMap && sameCenario && samePM && sameAde) return null;
  return "CHANGED";
}

// ============================================================
// Função pública
// ============================================================

export function buildGapDiff(
  listA: ReadonlyArray<CompareAnswer>,
  listB: ReadonlyArray<CompareAnswer>,
): GapDiff {
  const mapA = new Map(listA.map((a) => [a.controlCode, a]));
  const mapB = new Map(listB.map((a) => [a.controlCode, a]));

  const changes: DiffChange[] = [];
  const counts: DiffCounts = {
    improved: 0,
    worsened: 0,
    changed: 0,
    added: 0,
    removed: 0,
    unchanged: 0,
  };

  for (const ctrl of GAP_CONTROLS) {
    const a = mapA.get(ctrl.code);
    const b = mapB.get(ctrl.code);
    const type = compareOne(a, b);
    if (!type) {
      // Conta inalterado só se pelo menos um lado tiver conteúdo
      if ((a && answerHasContent(a)) || (b && answerHasContent(b))) {
        counts.unchanged += 1;
      }
      continue;
    }
    changes.push({
      controlCode: ctrl.code,
      controlNumber: ctrl.number,
      domain: ctrl.domain,
      question: ctrl.question,
      type,
      from: a ?? null,
      to: b ?? null,
    });
    if (type === "IMPROVED") counts.improved += 1;
    else if (type === "WORSENED") counts.worsened += 1;
    else if (type === "CHANGED") counts.changed += 1;
    else if (type === "NEW") counts.added += 1;
    else if (type === "REMOVED") counts.removed += 1;
  }

  // Ordenação: mudanças mais "ruidosas" primeiro pra direção
  // (WORSENED → REMOVED → IMPROVED → NEW → CHANGED), e dentro de cada
  // tipo por código pra ficar estável.
  const typeOrder: Record<DiffChangeType, number> = {
    WORSENED: 0,
    REMOVED: 1,
    IMPROVED: 2,
    NEW: 3,
    CHANGED: 4,
  };
  changes.sort((x, y) => {
    const dt = typeOrder[x.type] - typeOrder[y.type];
    if (dt !== 0) return dt;
    return x.controlCode.localeCompare(y.controlCode);
  });

  const scoreA = computeScore(listA);
  const scoreB = computeScore(listB);
  const scoreDelta =
    scoreA != null && scoreB != null ? scoreB - scoreA : null;

  return {
    scoreA,
    scoreB,
    scoreDelta,
    changes,
    counts,
    answeredA: listA.filter(answerHasContent).length,
    answeredB: listB.filter(answerHasContent).length,
  };
}

// ============================================================
// Helpers de UI
// ============================================================

export function changeTypeLabel(t: DiffChangeType): string {
  switch (t) {
    case "IMPROVED": return "Melhorou";
    case "WORSENED": return "Piorou";
    case "CHANGED":  return "Editado";
    case "NEW":      return "Adicionado";
    case "REMOVED":  return "Removido";
  }
}

export function changeTypeBadgeClass(t: DiffChangeType): string {
  switch (t) {
    case "IMPROVED":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    case "WORSENED":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
    case "CHANGED":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "NEW":
      return "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800";
    case "REMOVED":
      return "bg-gray-200 text-gray-800 border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600";
  }
}
