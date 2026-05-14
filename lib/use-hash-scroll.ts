/**
 * Hook que reage ao `window.location.hash` e:
 *
 *   1. Acha o elemento alvo (via `data-phase-section-id="<hash>"` ou
 *      `id="<hash>"`).
 *   2. Se for accordion fechado, abre (clica no botão com
 *      `aria-expanded="false"`) e aguarda a animação.
 *   3. Faz scroll suave pra ele.
 *
 * Resolve bug onde clicar num sub-item da sidebar (ex: "Coloque em
 * prática") não scrollava na 1ª vez se o user já estava na rota — o
 * navegador só atualiza o hash via History API e o Next.js 13+ não
 * dispara scroll automático.
 */
"use client";

import { useEffect } from "react";

const MAX_ATTEMPTS = 20; // ~2s no total
const RETRY_INTERVAL_MS = 100;

export function useHashScroll(): void {
  useEffect(() => {
    function scrollToCurrentHash() {
      const raw = window.location.hash.replace(/^#/, "");
      if (!raw) return;
      const hash = decodeURIComponent(raw);

      // Pode ser que a seção ainda não esteja no DOM (hidratação tardia,
      // mini-app só renderiza condicional, etc). Polling curto.
      let attempts = 0;
      const tryFind = () => {
        const el =
          document.querySelector<HTMLElement>(
            `[data-phase-section-id="${CSS.escape(hash)}"]`,
          ) ?? document.getElementById(hash);
        if (el) {
          // Accordion fechado? abre antes de scrollar.
          const closedBtn = el.querySelector<HTMLButtonElement>(
            'button[aria-expanded="false"]',
          );
          if (closedBtn) {
            closedBtn.click();
            // Aguarda animação de expansão (~250ms é confortável).
            window.setTimeout(() => {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 250);
          } else {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          return;
        }
        attempts++;
        if (attempts < MAX_ATTEMPTS) {
          window.setTimeout(tryFind, RETRY_INTERVAL_MS);
        }
      };
      tryFind();
    }

    // 1) Roda no mount — captura caso a página tenha sido aberta com hash
    //    já na URL (ex: link compartilhado).
    scrollToCurrentHash();

    // 2) Reage a mudanças de hash em tempo de vida — captura cliques em
    //    `<a href="#x">` quando o user já está na mesma rota.
    window.addEventListener("hashchange", scrollToCurrentHash);
    return () => window.removeEventListener("hashchange", scrollToCurrentHash);
  }, []);
}
