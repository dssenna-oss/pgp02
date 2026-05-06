"use client";

import { useEffect } from "react";
import { ChevronsDown, ChevronsUp, Keyboard } from "lucide-react";
import { bulkPhaseSections } from "@/lib/phase-ui-state";
import PhaseTourButton from "@/components/tour/phase-tour-button";
import PhaseReaderMode from "./phase-reader-mode";

/**
 * Toolbar das páginas de Fase (CP19 — refino UX) — botões de Recolher tudo
 * / Expandir tudo + atalhos de teclado E/C.
 *
 * Stick no topo do main content abaixo do hero da fase.
 */
export default function PhaseToolbar({ phase }: { phase: string }) {
  // Atalhos de teclado: E expande tudo, C recolhe tudo (só quando foco não
  // está em input/textarea pra não interferir na digitação).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "e" || e.key === "E") bulkPhaseSections(phase, "expand");
      else if (e.key === "c" || e.key === "C") bulkPhaseSections(phase, "collapse");
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => bulkPhaseSections(phase, "expand")}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-colors"
        title="Expandir todas as seções (E)"
      >
        <ChevronsDown className="h-3.5 w-3.5" />
        Expandir tudo
      </button>
      <button
        type="button"
        onClick={() => bulkPhaseSections(phase, "collapse")}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Recolher todas as seções (C)"
      >
        <ChevronsUp className="h-3.5 w-3.5" />
        Recolher tudo
      </button>
      <PhaseTourButton phase={phase} />
      <PhaseReaderMode phase={phase} />
      <span
        className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 text-[10px] text-gray-500 dark:text-gray-400 ml-auto"
        title="Atalhos disponíveis"
      >
        <Keyboard className="h-3 w-3" />
        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">E</kbd>
        expandir ·
        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">C</kbd>
        recolher
      </span>
    </div>
  );
}
