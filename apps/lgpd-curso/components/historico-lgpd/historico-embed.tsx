"use client";

// Embute a apresentação "Histórico da LGPD" (HTML standalone do Claude Design)
// servida de public/historico-lgpd/. Mostra inline em altura cheia, com botões
// de "Tela cheia" e "Nova aba". A apresentação é autossuficiente (sem CDN).

import { useState, useEffect } from "react";
import { Maximize2, ExternalLink, X } from "lucide-react";

const ARQUIVO = "/historico-lgpd/historico.html";
const TITULO = "Histórico da LGPD";

export function HistoricoEmbed() {
  const [cheia, setCheia] = useState(false);

  // Trava o scroll do fundo e habilita Esc pra sair da tela cheia.
  useEffect(() => {
    if (!cheia) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCheia(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [cheia]);

  return (
    <>
      <div className="mb-2 flex items-center justify-end gap-2">
        <button
          onClick={() => setCheia(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Maximize2 className="h-3.5 w-3.5" /> Tela cheia
        </button>
        <a
          href={ARQUIVO}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Nova aba
        </a>
      </div>

      <iframe
        src={ARQUIVO}
        title={TITULO}
        className="h-[calc(100vh-7rem)] min-h-[720px] w-full rounded-lg border border-gray-200 bg-white shadow-sm"
        allowFullScreen
      />

      {cheia && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
          <div className="flex items-center justify-between gap-2 px-4 py-2 text-gray-200">
            <span className="truncate text-sm font-medium">{TITULO}</span>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={ARQUIVO}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-800"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Nova aba
              </a>
              <button
                onClick={() => setCheia(false)}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-800"
              >
                <X className="h-4 w-4" /> Fechar
              </button>
            </div>
          </div>
          <iframe
            src={ARQUIVO}
            title={TITULO}
            className="w-full flex-1 border-0 bg-white"
            allowFullScreen
          />
        </div>
      )}
    </>
  );
}
