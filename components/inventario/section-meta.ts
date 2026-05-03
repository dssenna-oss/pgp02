/**
 * Metadata visual por seção do wizard de Inventário — ícone + cores
 * (texto, fundo, borda). Compartilhado entre o header da seção
 * (section-step), a tela de revisão (inventario-wizard) e o TOC lateral.
 *
 * Manter consistência visual entre wizard, revisão e impressão.
 */

import type { LucideIcon } from "lucide-react";
import {
  User as UserIcon,
  FileText,
  Database,
  Activity,
  Inbox,
  Share2,
  Server,
} from "lucide-react";

export interface SectionMeta {
  Icon: LucideIcon;
  /** Classe Tailwind de cor de texto/ícone (com dark variant). */
  color: string;
  /** Classe Tailwind de cor de fundo claro (com dark variant). */
  bg: string;
  /** Classe Tailwind de cor de borda (sólida — usar com border-l-4 etc.). */
  border: string;
}

export const SECTION_META: Record<string, SectionMeta> = {
  sec1: {
    Icon: UserIcon,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-500",
  },
  sec2: {
    Icon: FileText,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    border: "border-indigo-500",
  },
  sec3: {
    Icon: Database,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-500",
  },
  sec4: {
    Icon: Activity,
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-950/30",
    border: "border-pink-500",
  },
  sec5: {
    Icon: Inbox,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/30",
    border: "border-teal-500",
  },
  sec6: {
    Icon: Share2,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    border: "border-cyan-500",
  },
  sec7: {
    Icon: Server,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-500",
  },
};

/** Fallback seguro se o id não bater (não deveria acontecer). */
export function getSectionMeta(sectionId: string): SectionMeta {
  return SECTION_META[sectionId] ?? SECTION_META.sec1;
}
