// Helper client-side: detecta o objeto especial retornado por
// `checkGapConcluido()` no servidor e dispara o Dialog global em vez de
// continuar o fluxo normal.
//
// Padrão de uso em qualquer client component que chama uma server action:
//
//   const res = await savePlanoAcao({...});
//   if (handlePhaseSkipResult(res)) return; // dialog disparado, aborta fluxo
//   // ... continua sucesso (toast.success, fecha modal, etc)

import type { PhaseSkipResult } from "@/lib/phase-guard";

export const PHASE_SKIP_FLAG = "__phaseSkipBlocked";
export const PHASE_SKIP_EVENT = "curso:phase-skip-attempt";

/**
 * Se o retorno de uma action é o PhaseSkipResult, dispara o evento que abre
 * o Dialog global e retorna `true`. Senão retorna `false` (segue fluxo normal).
 * Funciona como TypeScript type guard — após `if (handlePhaseSkipResult(res)) return`,
 * o tipo de `res` perde a variante PhaseSkipResult.
 */
export function handlePhaseSkipResult<T>(res: T | PhaseSkipResult): res is PhaseSkipResult {
  if (!res || typeof res !== "object") return false;
  if ((res as any)[PHASE_SKIP_FLAG] !== true) return false;
  try {
    window.dispatchEvent(new CustomEvent(PHASE_SKIP_EVENT));
  } catch {}
  return true;
}

/**
 * @deprecated Em produção Next.js sanitiza mensagens de erro de server actions,
 * então o prefixo PHASE_SKIP_M3 não chega ao client. Use handlePhaseSkipResult
 * com o RETORNO da action em vez de checar no catch. Esta função é mantida
 * temporariamente como noop pra não quebrar callers antigos.
 */
export function handlePhaseSkip(_err: unknown): boolean {
  return false;
}
