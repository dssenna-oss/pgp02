"use client";

import { useEffect, useState } from "react";

/**
 * Barra fina de progresso de leitura no topo da página (CP19 Fatia 5).
 * Mostra quanto da página já foi rolada — útil em conteúdos extensos
 * pra dar referência visual de progresso.
 */
export default function PhaseReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    function onScroll() {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setPct(height > 0 ? (winScroll / height) * 100 : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-blue-500 to-violet-500 transition-[width] duration-100 ease-out z-[60] pointer-events-none"
      style={{ width: `${pct}%` }}
      aria-hidden="true"
    />
  );
}
