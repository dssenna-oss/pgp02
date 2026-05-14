"use client";

/**
 * TourFloatingButton — botão violeta no canto inferior esquerdo que abre
 * o tour mestre. Some quando o tour está aberto pra não conflitar com
 * o painel lateral.
 *
 * Label dinâmico:
 *  - 1ª vez: "Fazer tour guiado"
 *  - Depois (já completou ou já pulou): "Refazer tour"
 *
 * 2026-05-10 (Sugestão C): esconde em /dashboard pra não duplicar com
 * TourHeaderButton que agora vive no header da página principal. Demais
 * telas (Fases, Inventário, Plano, etc.) continuam tendo o flutuante.
 *
 * 2026-05-11 (refino UX mobile): em telas pequenas vira FAB redondo
 * só com ícone (44×44), tem `bottom-20` pra deixar espaço pro footer
 * típico de mobile e respeita `env(safe-area-inset-bottom)` pra iOS
 * com notch. Em desktop (≥sm) volta ao pill com label.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTour } from "./tour-provider";
import { hasEverInteracted } from "@/lib/tour/tour-storage";
import { Mic, RotateCcw } from "lucide-react";

export default function TourFloatingButton() {
  const { isOpen, start } = useTour();
  const pathname = usePathname();
  const [interacted, setInteracted] = useState(false);

  // Re-checa o storage sempre que o tour fecha (pode ter sido marcado como
  // concluído ou pulado durante a sessão atual).
  useEffect(() => {
    if (!isOpen) {
      setInteracted(hasEverInteracted("master"));
    }
  }, [isOpen]);

  if (isOpen) return null;
  // Esconde no /dashboard porque lá o TourHeaderButton já cobre.
  if (pathname === "/dashboard") return null;

  const fullLabel = interacted ? "Refazer tour" : "Fazer tour guiado";
  const ariaLabel = interacted
    ? "Refazer tour guiado do PGP"
    : "Fazer tour guiado do PGP";
  const Icon = interacted ? RotateCcw : Mic;

  return (
    <button
      onClick={() => start("master")}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="fixed left-4 sm:left-6 lg:left-72 z-40 flex items-center justify-center gap-2 rounded-full font-medium text-white shadow-lg shadow-violet-500/30 hover:-translate-y-0.5 hover:shadow-violet-500/40 transition-all
        h-12 w-12 sm:h-auto sm:w-auto sm:px-5 sm:py-3 text-sm
        bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] sm:bottom-6"
      style={{
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      }}
    >
      <Icon className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden />
      {/* Label só em ≥sm — em mobile o botão é circular ícone-só. */}
      <span className="hidden sm:inline">{fullLabel}</span>
    </button>
  );
}
