"use client";

/**
 * Modal Spotlight (Ctrl+K) pra buscar texto nas Fases (CP25).
 *
 * Atalhos:
 *  - Ctrl+K / Cmd+K — abre o modal
 *  - Esc — fecha
 *  - ↑/↓ — navega entre resultados
 *  - Enter — abre o resultado selecionado
 *
 * Eventos globais consumidos:
 *  - "pgp:open-phase-search" — abre via clique no botão da sidebar
 *
 * Ao clicar num resultado, navega pra `<phaseHref>?q=&section=` —
 * o `PhaseSearchDeepLink` na página da fase faz expandir + scroll + highlight.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, FileText } from "lucide-react";
import type { PhaseSearchHit, PhaseSearchResults } from "@/lib/phase-search";

const OPEN_EVENT = "pgp:open-phase-search";

export default function PhaseSearchModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PhaseSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Lista linear de hits pra navegação por teclado
  const flatHits: Array<{ hit: PhaseSearchHit; phaseHref: string }> = [];
  if (results) {
    for (const group of results.byPhase) {
      for (const hit of group.hits) {
        flatHits.push({ hit, phaseHref: group.phaseHref });
      }
    }
  }

  // Atalho global Ctrl+K / Cmd+K + evento de abertura via botão
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
      const cmdK = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k";
      if (cmdK) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpenEvent);
    };
  }, []);

  // Foca o input quando abre, reseta state quando fecha
  useEffect(() => {
    if (open) {
      // delay pra esperar render
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced fetch
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/phase-search?q=${encodeURIComponent(trimmed)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) {
          setResults(null);
          setLoading(false);
          return;
        }
        const data = (await res.json()) as PhaseSearchResults;
        setResults(data);
        setSelectedIndex(0);
        setLoading(false);
      } catch (err) {
        if ((err as any)?.name !== "AbortError") {
          setResults(null);
          setLoading(false);
        }
      }
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  const goTo = useCallback(
    (hit: PhaseSearchHit, phaseHref: string) => {
      const params = new URLSearchParams({ q: hit.snippet.substring(hit.matchStart, hit.matchStart + hit.matchLength), section: hit.section });
      // Pré-marca a section como aberta no localStorage pra abrir já no 1º render
      try {
        if (hit.section === "descricao" || hit.section === "checklist" || hit.section === "documentacao") {
          localStorage.setItem(`pgp:phase-ui:${hit.phase}:${hit.section}`, "true");
        }
      } catch {
        // localStorage bloqueado — segue o jogo
      }
      router.push(`${phaseHref}?${params.toString()}`);
      setOpen(false);
    },
    [router],
  );

  // Navegação por teclado
  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, Math.max(0, flatHits.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = flatHits[selectedIndex];
      if (sel) goTo(sel.hit, sel.phaseHref);
    }
  }

  if (!open) return null;

  let cursor = 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 bg-black/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Buscar nas Fases (descrição, considerações, checklist, documentação)…"
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-500 bg-gray-50 dark:bg-gray-800">
            Esc
          </kbd>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
          {!query.trim() && (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              Digite ao menos 2 caracteres pra buscar nas 9 fases.
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px]">
                <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">↑↓</kbd>
                navegar
                <kbd className="ml-2 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">↵</kbd>
                abrir
              </div>
            </div>
          )}
          {query.trim().length >= 2 && !loading && results && results.totalHits === 0 && (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Nenhum resultado encontrado pra <strong className="text-gray-700 dark:text-gray-300">"{query.trim()}"</strong>.
            </div>
          )}
          {results && results.totalHits > 0 && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <div className="px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                {results.totalHits} {results.totalHits === 1 ? "resultado" : "resultados"} em {results.byPhase.length} {results.byPhase.length === 1 ? "fase" : "fases"}
              </div>
              {results.byPhase.map((group) => (
                <div key={group.phase}>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/30 sticky top-0">
                    {group.phaseLabel}
                    <span className="ml-2 text-[10px] font-normal text-gray-500">
                      {group.hits.length} {group.hits.length === 1 ? "trecho" : "trechos"}
                    </span>
                  </div>
                  {group.hits.map((hit) => {
                    const myIndex = cursor++;
                    const isSelected = myIndex === selectedIndex;
                    return (
                      <button
                        key={`${hit.phase}-${hit.section}-${myIndex}`}
                        type="button"
                        onClick={() => goTo(hit, group.phaseHref)}
                        onMouseEnter={() => setSelectedIndex(myIndex)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/30"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-base shrink-0 leading-none mt-0.5">{hit.sectionIcon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{hit.sectionLabel}</span>
                              {hit.contextLabel && (
                                <>
                                  <span className="text-gray-300">·</span>
                                  <span className="truncate inline-flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {hit.contextLabel}
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">
                              <SnippetWithHighlight
                                snippet={hit.snippet}
                                start={hit.matchStart}
                                length={hit.matchLength}
                              />
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SnippetWithHighlight({ snippet, start, length }: { snippet: string; start: number; length: number }) {
  if (start < 0 || length <= 0 || start + length > snippet.length) {
    return <>{snippet}</>;
  }
  return (
    <>
      {snippet.slice(0, start)}
      <mark className="bg-amber-200 dark:bg-amber-700/60 text-gray-900 dark:text-white rounded px-0.5">
        {snippet.slice(start, start + length)}
      </mark>
      {snippet.slice(start + length)}
    </>
  );
}
