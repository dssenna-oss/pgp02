"use client";

/**
 * TourSpotlight — overlay que escurece a tela em volta do elemento alvo.
 *
 * Estratégia: aplica `box-shadow: 0 0 0 9999px rgba(...)` no próprio elemento
 * destacado (via classe injetada). Isso pinta o exterior dele de preto-fumê
 * e cria automaticamente o "buraco" do spotlight sem precisar de SVG mask.
 *
 * Também desenha uma setinha SVG pulsante apontando do painel lateral
 * (à direita) pro elemento.
 */

import { useEffect, useState } from "react";

interface TourSpotlightProps {
  targetSelector?: string;
}

export default function TourSpotlight({ targetSelector }: TourSpotlightProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Aplica/remove classes no elemento alvo + recalcula posição da setinha.
  useEffect(() => {
    if (!targetSelector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(targetSelector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }

    el.classList.add("pgp-tour-spotlit");
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    const updateRect = () => {
      const r = el.getBoundingClientRect();
      setRect(r);
    };
    updateRect();

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    const interval = setInterval(updateRect, 250); // captura sidebar mobile etc.

    return () => {
      el.classList.remove("pgp-tour-spotlit");
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      clearInterval(interval);
    };
  }, [targetSelector]);

  // Sem target: overlay leve cobrindo a tela toda (passo de boas-vindas).
  if (!targetSelector) {
    return (
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        style={{ zIndex: 50, pointerEvents: "none" }}
        aria-hidden
      />
    );
  }

  // Com target: setinha SVG apontando do painel pra ele. O escurecimento
  // do exterior é feito via box-shadow inset injetado pela classe `.pgp-tour-spotlit`
  // (definida em globals.css).
  return (
    <>
      {rect && (
        <svg
          className="fixed pointer-events-none"
          style={{
            zIndex: 58,
            top: rect.top + rect.height / 2 - 20,
            left: rect.right + 8,
            width: 80,
            height: 40,
          }}
          aria-hidden
        >
          <defs>
            <marker
              id="pgp-tour-arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#a78bfa" />
            </marker>
          </defs>
          <path
            d="M 70 20 Q 35 20 10 20"
            stroke="#a78bfa"
            strokeWidth="2.5"
            fill="none"
            strokeDasharray="4 3"
            markerEnd="url(#pgp-tour-arrowhead)"
            className="pgp-tour-arrow-pulse"
          />
        </svg>
      )}
    </>
  );
}
