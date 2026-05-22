"use client";

// Card de uma biblioteca de flipbooks (publicações folheáveis externas, ex.:
// Heyzine). Mostra um card na página; ao abrir, exibe o flipbook em tela
// cheia dentro do app — o iframe só carrega quando o participante abre.

import { useState, useEffect } from "react";
import { BookOpen, ExternalLink, X } from "lucide-react";

export function BibliotecaFlipbook({
  titulo,
  descricao,
  url,
}: {
  titulo: string;
  descricao: string;
  url: string;
}) {
  const [aberto, setAberto] = useState(false);

  // Trava o scroll do fundo e habilita Esc pra fechar enquanto aberto.
  useEffect(() => {
    if (!aberto) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [aberto]);

  return (
    <>
      <div className="rounded-xl border border-l-4 border-l-brand-500 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-3xl">
            📚
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-900">{titulo}</h2>
            <p className="mt-1 text-sm text-gray-600">{descricao}</p>
            <button
              onClick={() => setAberto(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <BookOpen className="h-4 w-4" /> Abrir biblioteca
            </button>
          </div>
        </div>
      </div>

      {aberto && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
          <div className="flex items-center justify-between gap-2 px-4 py-2 text-gray-200">
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="truncate">{titulo}</span>
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-800"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Nova aba
              </a>
              <button
                onClick={() => setAberto(false)}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-800"
              >
                <X className="h-4 w-4" /> Fechar
              </button>
            </div>
          </div>
          <iframe
            src={url}
            title={titulo}
            className="w-full flex-1 border-0 bg-white"
            allowFullScreen
            allow="clipboard-write"
          />
        </div>
      )}
    </>
  );
}
