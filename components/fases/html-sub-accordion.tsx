"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Renderiza HTML longo de uma seção de fase quebrando em sub-accordions
 * por `<h4>` (CP19 — Fatia 2). Reduz a verticalidade dentro de uma
 * `<PhaseSection>` já aberta, especialmente útil em "Considerações".
 *
 * Heurística:
 *   - Conteúdo antes do 1º <h4> é a "intro" (sempre visível).
 *   - Cada <h4> vira título de um sub-accordion.
 *   - Conteúdo do <h4> é tudo entre ele e o próximo <h4>.
 *   - <h5> aninhados são preservados como markup interno (resolvidos
 *     com CSS — `<details>` nativos não funcionam dentro de innerHTML).
 *
 * Se houver < 2 <h4>, devolve o HTML original sem modificação (não vale
 * a pena dividir um conteúdo que já é único).
 */

interface H4Section {
  title: string;
  /** HTML interno (depois do h4 e antes do próximo h4) */
  content: string;
}

interface ParsedHtml {
  intro: string; // HTML antes do 1º h4 (pode ser vazio)
  sections: H4Section[];
}

/** Parseia o HTML em intro + array de seções por h4. */
function parseH4Sections(html: string): ParsedHtml {
  // SSR-safe — DOMParser só existe no client
  if (typeof window === "undefined") {
    return { intro: html, sections: [] };
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return { intro: html, sections: [] };

  let intro = "";
  const sections: H4Section[] = [];
  let current: H4Section | null = null;

  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "H4") {
      if (current) sections.push(current);
      current = {
        title: (node as Element).textContent?.trim() ?? "",
        content: "",
      };
      continue;
    }
    const html = node.nodeType === Node.ELEMENT_NODE
      ? (node as Element).outerHTML
      : node.textContent ?? "";
    if (current) {
      current.content += html;
    } else {
      intro += html;
    }
  }
  if (current) sections.push(current);
  return { intro, sections };
}

interface Props {
  html: string;
  /** Estado inicial dos sub-accordions (default: todos fechados) */
  defaultAllOpen?: boolean;
}

export default function HtmlSubAccordion({ html, defaultAllOpen = false }: Props) {
  const [parsed, setParsed] = useState<ParsedHtml | null>(null);
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());

  // Parseia no client (DOMParser indisponível em SSR)
  useEffect(() => {
    const result = parseH4Sections(html);
    setParsed(result);
    if (defaultAllOpen) {
      setOpenSet(new Set(result.sections.map((_, i) => i)));
    }
  }, [html, defaultAllOpen]);

  // Render placeholder em SSR / 1ª render
  if (!parsed) {
    return (
      <div
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // Sem h4 ou só 1 — não vale a pena dividir
  if (parsed.sections.length < 2) {
    return (
      <div
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  function toggle(idx: number) {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }
  function expandAll() {
    setOpenSet(new Set(parsed!.sections.map((_, i) => i)));
  }
  function collapseAll() {
    setOpenSet(new Set());
  }

  const allOpen = openSet.size === parsed.sections.length;

  return (
    <div className="space-y-3">
      {/* Intro (antes do 1º h4) */}
      {parsed.intro.trim() && (
        <div
          className="prose dark:prose-invert max-w-none prose-sm"
          dangerouslySetInnerHTML={{ __html: parsed.intro }}
        />
      )}

      {/* Mini-toolbar pra recolher/expandir todos os sub-accordions */}
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={allOpen ? collapseAll : expandAll}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {allOpen ? "Recolher todos os tópicos" : `Expandir todos (${parsed.sections.length} tópicos)`}
        </button>
        <span className="text-gray-400">·</span>
        <span className="text-gray-500 dark:text-gray-400">
          {openSet.size} de {parsed.sections.length} expandido(s)
        </span>
      </div>

      {/* Sub-accordions por h4 */}
      <div className="space-y-2">
        {parsed.sections.map((sec, idx) => (
          <SubAccordionItem
            key={idx}
            title={sec.title}
            content={sec.content}
            open={openSet.has(idx)}
            onToggle={() => toggle(idx)}
            colorIndex={idx}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Sub-accordion individual
// ============================================================

const ACCENT_COLORS = [
  { border: "border-blue-200 dark:border-blue-900/40", bullet: "text-blue-600" },
  { border: "border-emerald-200 dark:border-emerald-900/40", bullet: "text-emerald-600" },
  { border: "border-amber-200 dark:border-amber-900/40", bullet: "text-amber-600" },
  { border: "border-violet-200 dark:border-violet-900/40", bullet: "text-violet-600" },
  { border: "border-pink-200 dark:border-pink-900/40", bullet: "text-pink-600" },
  { border: "border-cyan-200 dark:border-cyan-900/40", bullet: "text-cyan-600" },
];

function SubAccordionItem({
  title,
  content,
  open,
  onToggle,
  colorIndex,
}: {
  title: string;
  content: string;
  open: boolean;
  onToggle: () => void;
  colorIndex: number;
}) {
  const accent = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length];

  return (
    <div className={cn("border rounded-md overflow-hidden", accent.border)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className={cn("text-xs", accent.bullet)}>●</span>
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div
            className="px-4 pb-3 pt-1 prose dark:prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  );
}
