"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SIDEBAR_SUB_ITEMS,
  type SidebarSubItem,
} from "@/lib/sidebar-sub-items";
import { useSidebarExpansion } from "./sidebar-expansion-context";

/**
 * Item da sidebar que pode ter sub-itens em árvore.
 *
 * Comportamento:
 *   - Se o `href` tem entrada em SIDEBAR_SUB_ITEMS, renderiza com chevron
 *     e árvore expansível
 *   - Click no item-pai: navega + expande sub-itens (auto-expand via
 *     useEffect quando `isActive` fica true)
 *   - Click no chevron: toggle só, sem navegar
 *   - Click em sub-item: scroll suave pra âncora `<href>#<hash>`
 *   - Acordeão: só 1 item expandido por vez (controlado pelo context)
 *   - Mobile: usa o mesmo callback `onNavigate` pra fechar drawer
 *
 * Se o href não tem sub-itens, renderiza igual a um Link comum (preserva
 * o comportamento original da sidebar).
 */
interface SidebarNavItemProps {
  href: string;
  isActive: boolean;
  className: string;
  children: ReactNode;
  /** Callback chamado após click — usado pelo mobile pra fechar o drawer. */
  onNavigate?: () => void;
  /** Hooks pra atributos de tour (data-tour-id). */
  tourId?: string;
}

export default function SidebarNavItem({
  href,
  isActive,
  className,
  children,
  onNavigate,
  tourId,
}: SidebarNavItemProps) {
  const subItems = SIDEBAR_SUB_ITEMS[href];
  const { expandedHref, setExpandedHref, hydrated } = useSidebarExpansion();
  const isExpanded = subItems != null && expandedHref === href;
  const [activeHash, setActiveHash] = useState<string | null>(null);

  // Auto-expand quando navega pra essa rota (acordeão fecha as outras).
  // Espera `hydrated=true` antes de disparar — senão o provider lê o
  // localStorage depois e sobrescreve esse setExpandedHref, mantendo a
  // árvore expandida na fase ANTERIOR ao invés da atual.
  //
  // Edge case fechado na Fatia 5: se o item ativo NÃO tem sub-itens
  // (ex.: Tarefas, Bases Legais), fecha o acordeão pra não deixar
  // outra fase aparentemente "expandida" enquanto navegamos longe.
  useEffect(() => {
    if (!hydrated) return;
    if (isActive) {
      if (subItems) {
        if (expandedHref !== href) setExpandedHref(href);
      } else if (expandedHref !== null) {
        // Item ativo sem sub-itens — fecha o acordeão.
        setExpandedHref(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, href, hydrated]);

  // Highlight do sub-item ativo (Fatia 5). Usa duas estratégias:
  //
  // 1. Fases: IntersectionObserver detecta qual seção da página está
  //    visível e marca o sub-item correspondente. Reage a scroll manual.
  //
  // 2. Mini-apps com tabs (Plano de Ação, Capacitação): hashes são
  //    valores de state (ex.: "cronograma", "PILULAS"), não IDs no DOM.
  //    Pra esses, o highlight vem do `location.hash` direto — atualiza
  //    quando user clica num sub-item ou troca tab pelo widget interno
  //    (que dispara replaceState via useHashSyncedState).
  //
  // Só observa quando expandido — não gasta cycles em sidebars recolhidas.
  useEffect(() => {
    if (!isExpanded || !subItems) {
      setActiveHash(null);
      return;
    }
    const elements = subItems
      .map((s) => document.getElementById(s.hash))
      .filter((el): el is HTMLElement => el != null);

    if (elements.length > 0) {
      // Estratégia 1 — IntersectionObserver (fases)
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) {
            setActiveHash(visible[0].target.id);
          }
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
      );
      elements.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }

    // Estratégia 2 — location.hash (mini-apps com tabs)
    const syncFromHash = () => {
      if (typeof window === "undefined") return;
      const h = window.location.hash.replace(/^#/, "");
      setActiveHash(h || null);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [isExpanded, subItems]);

  // Sem sub-itens — renderiza como link comum (preserva visual original).
  if (!subItems) {
    return (
      <Link
        href={href}
        data-tour-id={tourId}
        className={className}
        onClick={onNavigate}
      >
        {children}
      </Link>
    );
  }

  return (
    <div>
      {/* Linha do item-pai: Link ocupa todo o espaço, chevron como botão
          separado pra evitar conflito de tap (sub-acordeão sem navegar). */}
      <div className="relative">
        <Link
          href={href}
          data-tour-id={tourId}
          className={cn(className, "pr-10")}
          onClick={() => {
            // Garante expansão mesmo se a navegação demorar (auto-expand
            // do useEffect só dispara depois do isActive virar true)
            setExpandedHref(href);
            onNavigate?.();
          }}
        >
          {children}
        </Link>
        <button
          type="button"
          aria-label={isExpanded ? "Recolher seções" : "Expandir seções"}
          aria-expanded={isExpanded}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpandedHref(isExpanded ? null : href);
          }}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2",
            "p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700",
            "text-gray-500 dark:text-gray-400",
            "transition-transform duration-200",
          )}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Sub-itens (visíveis quando expandido).
          Animação grid-template-rows: container externo anima de 0fr → 1fr;
          interno tem overflow-hidden. Trick CSS-only sem JS de altura. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
        aria-hidden={!isExpanded}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "ml-7 mt-0.5 mb-1 pl-2 space-y-0.5",
              "border-l border-gray-300 dark:border-gray-600",
            )}
          >
            {subItems.map((sub: SidebarSubItem) => {
              const isSubActive = activeHash === sub.hash;
              return (
                <a
                  key={sub.hash}
                  href={`${href}#${sub.hash}`}
                  onClick={onNavigate}
                  aria-current={isSubActive ? "true" : undefined}
                  tabIndex={isExpanded ? 0 : -1}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1 rounded text-xs",
                    "transition-colors",
                    isSubActive
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400",
                  )}
                >
                  {sub.icon && <span className="flex-shrink-0">{sub.icon}</span>}
                  <span className="truncate">{sub.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
