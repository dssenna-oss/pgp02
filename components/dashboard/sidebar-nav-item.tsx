"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
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
  const { expandedHref, setExpandedHref } = useSidebarExpansion();
  const isExpanded = subItems != null && expandedHref === href;

  // Auto-expand quando navega pra essa rota (acordeão fecha as outras).
  useEffect(() => {
    if (isActive && subItems && expandedHref !== href) {
      setExpandedHref(href);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, href]);

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

      {/* Sub-itens (visíveis quando expandido). */}
      {isExpanded && (
        <div
          className={cn(
            "ml-7 mt-0.5 mb-1 pl-2 space-y-0.5",
            "border-l border-gray-300 dark:border-gray-600",
          )}
        >
          {subItems.map((sub: SidebarSubItem) => (
            <a
              key={sub.hash}
              href={`${href}#${sub.hash}`}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded text-xs",
                "text-gray-600 dark:text-gray-400",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "hover:text-blue-600 dark:hover:text-blue-400",
                "transition-colors",
              )}
            >
              {sub.icon && <span className="flex-shrink-0">{sub.icon}</span>}
              <span className="truncate">{sub.label}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
