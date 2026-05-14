/**
 * Estado de UI das Fases — controla quais sanfonas (PhaseSection) estão
 * abertas/recolhidas, persistido em localStorage por (phase, section).
 *
 * Pra reduzir a verticalidade de páginas longas (CP19 — refino UX Fases).
 * O user lembra a preferência por fase: ex. fica recolhido em "Considerações"
 * mas aberto em "Descrição".
 *
 * Eventos globais permitem que botões "Recolher tudo" / "Expandir tudo" da
 * toolbar de uma fase atinjam todas as PhaseSections simultaneamente.
 */

"use client";

import { useEffect, useState } from "react";

const STORAGE_PREFIX = "pgp:phase-ui:";
const EVENT_NAME = "pgp:phase-ui-bulk";

export type BulkAction = "expand" | "collapse";

interface BulkEventDetail {
  phase: string;
  action: BulkAction;
}

function storageKey(phase: string, section: string): string {
  return `${STORAGE_PREFIX}${phase}:${section}`;
}

/**
 * Hook que mantém o estado open/closed de uma seção específica,
 * persistido em localStorage e reativo ao evento bulk.
 */
export function usePhaseSectionState(
  phase: string,
  section: string,
  defaultOpen: boolean,
): [boolean, (open: boolean) => void] {
  const [open, setOpenState] = useState<boolean>(defaultOpen);

  // Carrega estado persistido na 1ª render no client (evita SSR mismatch)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const persisted = localStorage.getItem(storageKey(phase, section));
    if (persisted === "true") setOpenState(true);
    else if (persisted === "false") setOpenState(false);
  }, [phase, section]);

  // Listener pro evento bulk (Recolher/Expandir tudo)
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onBulk(e: Event) {
      const ce = e as CustomEvent<BulkEventDetail>;
      if (!ce.detail || ce.detail.phase !== phase) return;
      const next = ce.detail.action === "expand";
      setOpenState(next);
      try {
        localStorage.setItem(storageKey(phase, section), String(next));
      } catch {
        // localStorage pode estar bloqueado (modo privado)
      }
    }
    window.addEventListener(EVENT_NAME, onBulk);
    return () => window.removeEventListener(EVENT_NAME, onBulk);
  }, [phase, section]);

  function setOpen(next: boolean) {
    setOpenState(next);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey(phase, section), String(next));
      } catch {
        // silencioso
      }
    }
  }

  return [open, setOpen];
}

/**
 * Dispara expand/collapse em massa pra todas as PhaseSections de uma fase.
 * Chamado pelos botões da toolbar e pelos atalhos E/C.
 */
export function bulkPhaseSections(phase: string, action: BulkAction): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<BulkEventDetail>(EVENT_NAME, {
      detail: { phase, action },
    }),
  );
}
