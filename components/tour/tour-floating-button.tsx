"use client";

/**
 * TourFloatingButton — botão violeta no canto inferior direito que abre
 * o tour mestre. Some quando o tour está aberto pra não conflitar com
 * o painel lateral.
 *
 * Label dinâmico:
 *  - 1ª vez: "Fazer tour guiado"
 *  - Depois (já completou ou já pulou): "Refazer tour"
 */

import { useEffect, useState } from "react";
import { useTour } from "./tour-provider";
import { hasEverInteracted } from "@/lib/tour/tour-storage";

export default function TourFloatingButton() {
  const { isOpen, start } = useTour();
  const [interacted, setInteracted] = useState(false);

  // Re-checa o storage sempre que o tour fecha (pode ter sido marcado como
  // concluído ou pulado durante a sessão atual).
  useEffect(() => {
    if (!isOpen) {
      setInteracted(hasEverInteracted("master"));
    }
  }, [isOpen]);

  if (isOpen) return null;

  return (
    <button
      onClick={() => start("master")}
      aria-label={interacted ? "Refazer tour guiado do PGP" : "Fazer tour guiado do PGP"}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-white shadow-lg shadow-violet-500/30 hover:-translate-y-0.5 hover:shadow-violet-500/40 transition-all"
      style={{
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      }}
    >
      <span aria-hidden>{interacted ? "🔁" : "🎙️"}</span>
      <span>{interacted ? "Refazer tour" : "Fazer tour guiado"}</span>
    </button>
  );
}
