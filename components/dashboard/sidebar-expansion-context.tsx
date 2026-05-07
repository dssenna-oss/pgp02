"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Context global que controla qual item da sidebar está com sub-itens
 * expandidos. Usa o modelo "acordeão" — só 1 item expandido por vez.
 *
 * Dois consumidores:
 *   - `SidebarNavItem`: lê/escreve `expandedHref` pra mostrar/esconder
 *     a árvore de sub-itens
 *   - `PhaseTOC` (lateral direita): lê `hasExpansion` pra se auto-esconder
 *     quando a sidebar está mostrando sub-itens (evita redundância — Fatia 4)
 *
 * Persiste em localStorage pra lembrar entre navegações/recargas.
 */
interface SidebarExpansionContextValue {
  expandedHref: string | null;
  setExpandedHref: (href: string | null) => void;
  /** Atalho `expandedHref !== null` — usado pra esconder o TOC lateral. */
  hasExpansion: boolean;
}

const SidebarExpansionContext = createContext<SidebarExpansionContextValue>({
  expandedHref: null,
  setExpandedHref: () => {},
  hasExpansion: false,
});

const STORAGE_KEY = "sidebar-expanded-href";

export function SidebarExpansionProvider({ children }: { children: ReactNode }) {
  const [expandedHref, _setExpandedHref] = useState<string | null>(null);

  // Restaura estado persistido só client-side (evita mismatch SSR).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) _setExpandedHref(saved);
    } catch {
      // localStorage indisponível (modo privado em alguns browsers) — segue sem
    }
  }, []);

  const setExpandedHref = (href: string | null) => {
    _setExpandedHref(href);
    try {
      if (href) {
        localStorage.setItem(STORAGE_KEY, href);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  };

  return (
    <SidebarExpansionContext.Provider
      value={{
        expandedHref,
        setExpandedHref,
        hasExpansion: expandedHref !== null,
      }}
    >
      {children}
    </SidebarExpansionContext.Provider>
  );
}

export function useSidebarExpansion() {
  return useContext(SidebarExpansionContext);
}
