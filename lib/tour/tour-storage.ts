/**
 * Helpers de persistência local do tour (Checkpoint 20 — Fatia 2).
 *
 * Estado armazenado em `localStorage` por roteiro:
 *   pgp:tour-state:<scriptId> = { completedAt: ISO | null, skippedAt: ISO | null }
 *
 * Regra de auto-disparo: o tour só abre sozinho se NEM `completedAt` NEM
 * `skippedAt` estiverem preenchidos. "Pular tour" e "Esc" gravam `skippedAt`
 * (continua reabrível pelo botão flutuante, mas não auto-abre mais).
 *
 * Fatia 3 vai sincronizar isso com `users.tourCompletedAt` no banco pra DPO
 * acompanhar adoção. Por ora é só local.
 */

export interface TourLocalState {
  completedAt: string | null;
  skippedAt: string | null;
}

const KEY_PREFIX = "pgp:tour-state:";

function key(scriptId: string): string {
  return `${KEY_PREFIX}${scriptId}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadTourState(scriptId: string): TourLocalState {
  if (!isBrowser()) return { completedAt: null, skippedAt: null };
  try {
    const raw = window.localStorage.getItem(key(scriptId));
    if (!raw) return { completedAt: null, skippedAt: null };
    const parsed = JSON.parse(raw) as Partial<TourLocalState>;
    return {
      completedAt: parsed.completedAt ?? null,
      skippedAt: parsed.skippedAt ?? null,
    };
  } catch {
    return { completedAt: null, skippedAt: null };
  }
}

function saveTourState(scriptId: string, state: TourLocalState): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key(scriptId), JSON.stringify(state));
  } catch {
    // localStorage cheio / desabilitado — silencioso, não vale a pena alarmar.
  }
}

export function markTourCompleted(scriptId: string): void {
  const cur = loadTourState(scriptId);
  saveTourState(scriptId, { ...cur, completedAt: new Date().toISOString() });
}

export function markTourSkipped(scriptId: string): void {
  const cur = loadTourState(scriptId);
  // Não sobrescreve completedAt — se já completou e depois reabriu e pulou,
  // mantém a marca de conclusão.
  if (cur.completedAt) return;
  saveTourState(scriptId, { ...cur, skippedAt: new Date().toISOString() });
}

export function resetTourState(scriptId: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key(scriptId));
  } catch {
    // silencioso
  }
}

export function shouldAutoStart(scriptId: string): boolean {
  const s = loadTourState(scriptId);
  return !s.completedAt && !s.skippedAt;
}

export function hasEverInteracted(scriptId: string): boolean {
  const s = loadTourState(scriptId);
  return !!(s.completedAt || s.skippedAt);
}
