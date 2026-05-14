"use client";

import { useEffect, useState } from "react";

/**
 * Hook que sincroniza um state com o `location.hash` da URL.
 *
 * Permite que a sidebar (com sub-itens em árvore) navegue pra estados
 * internos de um mini-app via `<href>#<valor>`. Quando o hash bate com
 * algum dos `validValues`, o state vira esse valor; caso contrário,
 * permanece o `defaultValue`.
 *
 * Reage a mudanças via `hashchange` event — útil quando user clica num
 * sub-item enquanto já está na página (sem reload).
 *
 * Uso típico em mini-apps com tabs:
 *   const [tab, setTab] = useHashSyncedState(
 *     ["abertas", "concluidas", "cronograma"] as const,
 *     "abertas"
 *   );
 *
 * @param validValues lista (readonly) dos valores válidos pra estado
 * @param defaultValue valor inicial se hash for inválido/ausente
 */
export function useHashSyncedState<T extends string>(
  validValues: readonly T[],
  defaultValue: T,
): [T, (value: T) => void] {
  const [value, _setValue] = useState<T>(defaultValue);

  useEffect(() => {
    const syncFromHash = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.replace(/^#/, "");
      if (validValues.includes(hash as T)) {
        _setValue(hash as T);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wrapper que também atualiza o hash da URL (sem disparar reload).
  // Útil pra que cliques nos elementos visuais (tabs, filter pills)
  // mantenham a URL atualizada — assim deep-link funciona após F5.
  const setValue = (newValue: T) => {
    _setValue(newValue);
    if (typeof window !== "undefined") {
      const newHash = `#${newValue}`;
      if (window.location.hash !== newHash) {
        // replaceState evita poluir history com cada troca de tab
        window.history.replaceState(
          window.history.state,
          "",
          `${window.location.pathname}${window.location.search}${newHash}`,
        );
      }
    }
  };

  return [value, setValue];
}
