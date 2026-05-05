"use client";

/**
 * TourFloatingButton — botão violeta no canto inferior direito que abre
 * o tour mestre. Some quando o tour está aberto pra não conflitar com
 * o painel lateral.
 */

import { useTour } from "./tour-provider";

export default function TourFloatingButton() {
  const { isOpen, start } = useTour();

  if (isOpen) return null;

  return (
    <button
      onClick={() => start("master")}
      aria-label="Fazer tour guiado do PGP"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-white shadow-lg shadow-violet-500/30 hover:-translate-y-0.5 hover:shadow-violet-500/40 transition-all"
      style={{
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      }}
    >
      <span aria-hidden>🎙️</span>
      <span>Fazer tour guiado</span>
    </button>
  );
}
