"use client";

/**
 * Deep-link de busca nas Fases (CP25).
 *
 * Ouve `?q=<termo>&section=<id>` na URL. Quando ambos estão presentes
 * E a página atual é uma página de fase:
 *   1. Aguarda o elemento `[data-phase-section-id="<id>"]` aparecer
 *   2. Faz scroll suave até ele
 *   3. Aguarda o conteúdo carregar (managers que fazem fetch async)
 *   4. Best-effort: envolve as ocorrências do termo em `<mark>` por ~4s
 *      (pode piscar se o React re-renderizar o conteúdo via
 *      dangerouslySetInnerHTML — não bloqueante)
 *   5. Limpa params da URL pra não re-disparar em refresh
 *
 * O snippet com o termo destacado em amarelo já apareceu no modal de
 * busca antes de o user clicar — então mesmo que o highlight in-page
 * não persista, o user já sabe o que está procurando.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const PHASE_PATHS = new Set([
  "/dashboard/entendendo-pgp",
  "/dashboard/fase-preliminar",
  "/dashboard/fase-1",
  "/dashboard/fase-2",
  "/dashboard/fase-3",
  "/dashboard/fase-4",
  "/dashboard/fase-5",
  "/dashboard/fase-6",
  "/dashboard/fase-7",
]);

const HIGHLIGHT_CLASS = "pgp-search-deep-highlight";
const HIGHLIGHT_DURATION_MS = 4000;
const POLL_TIMEOUT_MS = 8000;
const POLL_INTERVAL_MS = 120;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Envolve cada ocorrência de `query` em `<mark class="pgp-search-deep-highlight">`. */
function highlightTextInElement(root: Element, query: string): void {
  if (!query) return;
  const re = new RegExp(escapeRegex(query), "gi");

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (tag === "script" || tag === "style") return NodeFilter.FILTER_REJECT;
      if (parent.classList.contains(HIGHLIGHT_CLASS)) return NodeFilter.FILTER_REJECT;
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const targets: Text[] = [];
  let cur = walker.nextNode() as Text | null;
  while (cur) {
    if (re.test(cur.textContent ?? "")) targets.push(cur);
    re.lastIndex = 0;
    cur = walker.nextNode() as Text | null;
  }

  for (const textNode of targets) {
    const txt = textNode.textContent ?? "";
    const fragment = document.createDocumentFragment();
    let lastIdx = 0;
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(txt)) !== null) {
      if (m.index > lastIdx) {
        fragment.appendChild(document.createTextNode(txt.slice(lastIdx, m.index)));
      }
      const mark = document.createElement("mark");
      mark.className = HIGHLIGHT_CLASS;
      mark.textContent = m[0];
      fragment.appendChild(mark);
      lastIdx = m.index + m[0].length;
      if (m[0].length === 0) re.lastIndex++;
    }
    if (lastIdx < txt.length) {
      fragment.appendChild(document.createTextNode(txt.slice(lastIdx)));
    }
    textNode.parentNode?.replaceChild(fragment, textNode);
  }
}

function unwrapAllHighlights(root: Element): void {
  const marks = Array.from(root.querySelectorAll(`.${HIGHLIGHT_CLASS}`)) as HTMLElement[];
  for (const m of marks) {
    const parent = m.parentNode;
    if (!parent) continue;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
    parent.normalize();
  }
}

export default function PhaseSearchDeepLink() {
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    if (!pathname || !PHASE_PATHS.has(pathname)) return;
    const qRaw = params?.get("q");
    const sectionRaw = params?.get("section");
    if (!qRaw || !sectionRaw) return;
    const q: string = qRaw;
    const section: string = sectionRaw;

    let aborted = false;
    let acted = false;
    const start = Date.now();
    const normQ = q.toLowerCase();

    function tryAct() {
      if (aborted || acted) return;
      const el = document.querySelector(`[data-phase-section-id="${section}"]`);
      const elapsed = Date.now() - start;
      if (!el) {
        if (elapsed < POLL_TIMEOUT_MS) window.setTimeout(tryAct, POLL_INTERVAL_MS);
        return;
      }

      // Espera o conteúdo da seção carregar (managers async)
      const hasText = (el.textContent ?? "").toLowerCase().includes(normQ);
      if (!hasText) {
        if (elapsed < POLL_TIMEOUT_MS) window.setTimeout(tryAct, POLL_INTERVAL_MS);
        return;
      }

      acted = true;

      // Scroll
      el.scrollIntoView({ behavior: "smooth", block: "start" });

      // Limpa params da URL via history nativo (não causa re-render do React)
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("q");
        url.searchParams.delete("section");
        window.history.replaceState(null, "", url.pathname + (url.search || ""));
      } catch {
        // ignora
      }

      // Best-effort: aplica + reaplica via observer pra sobreviver re-renders
      // do React (HtmlSubAccordion → setParsed → dangerouslySetInnerHTML).
      let stopped = false;
      let pending = false;
      const reapply = () => {
        if (stopped || !el) return;
        if (el.querySelectorAll(`.${HIGHLIGHT_CLASS}`).length > 0) return;
        highlightTextInElement(el, q);
      };
      const schedule = () => {
        if (pending || stopped) return;
        pending = true;
        window.requestAnimationFrame(() => {
          pending = false;
          reapply();
        });
      };
      reapply();
      let observer: MutationObserver | null = null;
      try {
        observer = new MutationObserver(schedule);
        observer.observe(el, { childList: true, subtree: true, characterData: true });
      } catch {
        // observer não disponível — segue
      }
      window.setTimeout(() => {
        stopped = true;
        observer?.disconnect();
        unwrapAllHighlights(el);
      }, HIGHLIGHT_DURATION_MS);
    }

    tryAct();

    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, params]);

  return null;
}
