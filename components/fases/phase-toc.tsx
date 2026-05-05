"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Índice (TOC) lateral sticky pra navegação rápida entre as PhaseSections
 * (CP19 Fatia 5). Aparece só em desktop (lg+) ao lado direito do main.
 *
 * Auto-detecta as seções pelo atributo `data-phase-section-id` e usa
 * IntersectionObserver pra destacar a seção visível no viewport.
 */

interface TOCItem {
  id: string;
  title: string;
  icon: string;
}

const DEFAULT_ITEMS: TOCItem[] = [
  { id: "descricao", title: "Descrição", icon: "📄" },
  { id: "consideracoes", title: "Considerações", icon: "💭" },
  { id: "checklist", title: "Checklist", icon: "✅" },
  { id: "documentacao", title: "Documentação", icon: "📂" },
];

export default function PhaseTOC({
  phase,
  items = DEFAULT_ITEMS,
}: {
  phase: string;
  items?: TOCItem[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = items
      .map((it) => document.querySelector(`[data-phase-section-id="${it.id}"]`))
      .filter((el): el is Element => el != null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pega a 1ª seção visível na metade superior do viewport
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = (visible[0].target as HTMLElement).getAttribute("data-phase-section-id");
          if (id) setActiveId(id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  function scrollTo(id: string) {
    const el = document.querySelector(`[data-phase-section-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  }

  return (
    <nav
      aria-label="Índice da fase"
      className="hidden xl:block sticky top-4 self-start space-y-1 text-sm w-48 shrink-0"
    >
      <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold px-3 mb-2">
        Nesta página
      </p>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => scrollTo(it.id)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 text-left border-l-2 transition-colors",
            activeId === it.id
              ? "border-blue-500 text-blue-700 dark:text-blue-300 font-medium bg-blue-50/40 dark:bg-blue-950/20"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700",
          )}
        >
          <span className="shrink-0 text-xs">{it.icon}</span>
          <span className="truncate">{it.title}</span>
        </button>
      ))}
      <div className="border-t dark:border-gray-700 my-3 mx-3"></div>
      <p className="text-[10px] text-gray-500 px-3">
        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px]">E</kbd> expandir{" "}
        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] ml-1">C</kbd> recolher
      </p>
    </nav>
  );
}
