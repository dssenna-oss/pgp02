// Helper client-side: detecta erros vindos do `ensureGapConcluido()` no servidor
// e dispara o Dialog global em vez de exibir toast.error genérico.
//
// Uso típico em qualquer client component que chama uma server action:
//
//   try {
//     await savePlanoAcao({...});
//   } catch (e: any) {
//     if (handlePhaseSkip(e)) return; // exibiu o Dialog
//     toast.error(e.message);         // erro genérico, mostra toast normal
//   }

export const PHASE_SKIP_PREFIX = "PHASE_SKIP_M3:";
export const PHASE_SKIP_EVENT = "curso:phase-skip-attempt";

/**
 * Se o erro for um PHASE_SKIP, dispara o evento que abre o Dialog global
 * e retorna `true` (sinaliza que já foi tratado).
 * Caso contrário, retorna `false` — o caller deve tratar normalmente.
 */
export function handlePhaseSkip(err: unknown): boolean {
  if (!err) return false;
  const msg = (err as any).message || String(err);
  if (typeof msg !== "string" || !msg.startsWith(PHASE_SKIP_PREFIX)) return false;
  try {
    window.dispatchEvent(new CustomEvent(PHASE_SKIP_EVENT));
  } catch {}
  return true;
}
