"use client";

// Lista os módulos da "Estrutura da LGPD" (apresentações HTML standalone).
// Cada card abre o HTML em tela cheia dentro do app (iframe), com botão pra
// abrir em nova aba. O iframe só carrega quando o participante abre o módulo.

import { useState, useEffect } from "react";
import { BookOpen, ExternalLink, X, ArrowRight } from "lucide-react";
import type { ModuloEstrutura } from "@/lib/estrutura-lgpd";

export function EstruturaModulos({ modulos }: { modulos: ModuloEstrutura[] }) {
  const [aberto, setAberto] = useState<ModuloEstrutura | null>(null);

  // Trava o scroll do fundo e habilita Esc pra fechar enquanto aberto.
  useEffect(() => {
    if (!aberto) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(null);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [aberto]);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {modulos.map((m) => (
          <button
            key={m.slug}
            onClick={() => setAberto(m)}
            className="group flex flex-col rounded-xl border border-l-4 border-l-brand-500 bg-white p-4 text-left shadow-sm transition-colors hover:bg-brand-50/50"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 shrink-0 text-brand-600" />
              <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">
                {m.intervalo}
              </span>
            </div>
            <h3 className="mt-2 text-sm font-bold text-gray-900">{m.titulo}</h3>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-gray-600">{m.descricao}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 group-hover:text-brand-800">
              Abrir <ArrowRight className="h-3 w-3" />
            </span>
          </button>
        ))}
      </div>

      {aberto && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
          <div className="flex items-center justify-between gap-2 px-4 py-2 text-gray-200">
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {aberto.intervalo} · {aberto.titulo}
              </span>
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={aberto.arquivo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-800"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Nova aba
              </a>
              <button
                onClick={() => setAberto(null)}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-800"
              >
                <X className="h-4 w-4" /> Fechar
              </button>
            </div>
          </div>
          <iframe
            src={aberto.arquivo}
            title={`${aberto.intervalo} — ${aberto.titulo}`}
            className="w-full flex-1 border-0 bg-white"
            allowFullScreen
          />
        </div>
      )}
    </>
  );
}
