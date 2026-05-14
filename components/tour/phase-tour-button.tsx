"use client";

/**
 * PhaseTourButton — botão pequeno "Tour desta fase" que aparece no
 * PhaseToolbar de cada página de fase. Dispara o roteiro daquela fase.
 *
 * Convenção de mapeamento: o `phase` prop usado no PhaseToolbar (e em
 * todos os componentes de fase do CP19) é exatamente o `TourScriptId`
 * — então passa direto sem tradução.
 *
 * Label muda dinamicamente: 1ª vez "Tour desta fase", depois "Refazer".
 */

import { useEffect, useState } from "react";
import { Mic } from "lucide-react";
import { useTour } from "./tour-provider";
import type { TourScriptId } from "@/lib/tour/tour-types";
import { hasEverInteracted } from "@/lib/tour/tour-storage";

const ALLOWED: ReadonlyArray<TourScriptId> = [
  "entendendo-pgp",
  "fase-preliminar",
  "fase-1",
  "fase-2",
  "fase-3",
  "fase-4",
  "fase-5",
  "fase-6",
  "fase-7",
];

export default function PhaseTourButton({ phase }: { phase: string }) {
  const { start, isOpen } = useTour();
  const [interacted, setInteracted] = useState(false);

  const scriptId = (ALLOWED as readonly string[]).includes(phase)
    ? (phase as TourScriptId)
    : null;

  useEffect(() => {
    if (!isOpen && scriptId) {
      setInteracted(hasEverInteracted(scriptId));
    }
  }, [isOpen, scriptId]);

  if (!scriptId) return null;

  return (
    <button
      type="button"
      onClick={() => start(scriptId)}
      title={interacted ? "Refazer tour desta fase" : "Fazer tour guiado desta fase"}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950/60 transition-colors"
    >
      <Mic className="h-3.5 w-3.5" />
      {interacted ? "Refazer tour" : "Tour desta fase"}
    </button>
  );
}
