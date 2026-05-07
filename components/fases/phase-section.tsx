"use client";

import { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePhaseSectionState } from "@/lib/phase-ui-state";

/**
 * Wrapper accordion reusável pra envolver as 4 grandes seções de cada Fase
 * (Descrição · Considerações · Checklist · Documentação).
 *
 * Reduz verticalidade ao permitir colapsar conteúdo extenso.
 * Estado persistido por (phase, section) em localStorage.
 *
 * O componente filho pode optar por não ter Card próprio (passar `noCard`
 * pros 3 managers existentes) — assim evita "double card".
 */
interface PhaseSectionProps {
  phase: string;
  section: string;
  title: string;
  /** Emoji ou string curta exibida antes do título */
  icon?: string;
  /** Linha auxiliar embaixo do título */
  subtitle?: string;
  /** Estado inicial (sobrescrito por localStorage se existir) */
  defaultOpen?: boolean;
  /** Slot pra header secundário à direita do chevron (badges, contador, etc.) */
  headerExtra?: ReactNode;
  /** Estilo "destaque" — borda à esquerda colorida (informa criticidade) */
  accent?: "blue" | "amber" | "emerald" | "violet" | "red" | "none";
  children: ReactNode;
}

const ACCENT_CLASSES: Record<NonNullable<PhaseSectionProps["accent"]>, string> = {
  blue: "border-l-4 border-l-blue-500",
  amber: "border-l-4 border-l-amber-500",
  emerald: "border-l-4 border-l-emerald-500",
  violet: "border-l-4 border-l-violet-500",
  red: "border-l-4 border-l-red-500",
  none: "",
};

export default function PhaseSection({
  phase,
  section,
  title,
  icon,
  subtitle,
  defaultOpen = false,
  headerExtra,
  accent = "none",
  children,
}: PhaseSectionProps) {
  const [open, setOpen] = usePhaseSectionState(phase, section, defaultOpen);

  return (
    <section
      id={section}
      data-phase-section-id={section}
      className={cn(
        "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden scroll-mt-4",
        ACCENT_CLASSES[accent],
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {icon && <span className="shrink-0">{icon}</span>}
            <span className="break-words">{title}</span>
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 ml-3 shrink-0">
          {headerExtra}
          <ChevronDown
            className={cn(
              "h-5 w-5 text-gray-400 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </div>
      </button>
      {/* Animação smooth via grid-rows trick (sem max-height fixo) */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1">{children}</div>
        </div>
      </div>
    </section>
  );
}
