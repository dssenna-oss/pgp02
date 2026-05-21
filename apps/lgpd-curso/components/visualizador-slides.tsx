"use client";

// Visualizador de slides das fases iniciais (Preliminar / 1 / 2).
// Mostra as lâminas do PowerPoint do facilitador: deslizável, com miniaturas
// e "Modo projeção" (lâmina ocupa a tela, navegável por teclado) pra usar na
// aula direto do app.

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Projector, X, Mic2 } from "lucide-react";
import { slidesDaFase, type FaseSlides } from "@/lib/slides-fases";

export function VisualizadorSlides({ fase }: { fase: FaseSlides }) {
  const slides = slidesDaFase(fase);
  const total = slides.length;
  const [i, setI] = useState(0);
  const [projecao, setProjecao] = useState(false);

  const ir = (n: number) => setI(Math.max(0, Math.min(total - 1, n)));

  // Navegação por teclado no modo projeção (setas + Esc).
  useEffect(() => {
    if (!projecao) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown") setI((p) => Math.min(total - 1, p + 1));
      else if (e.key === "ArrowLeft" || e.key === "PageUp") setI((p) => Math.max(0, p - 1));
      else if (e.key === "Escape") setProjecao(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [projecao, total]);

  // ───────── Modo projeção: lâmina ocupa a tela ─────────
  if (projecao) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
        <div className="flex items-center justify-between px-4 py-2 text-gray-300">
          <span className="text-sm font-medium">
            {fase.emoji} {fase.titulo} · {i + 1}/{total}
          </span>
          <button
            onClick={() => setProjecao(false)}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-800"
          >
            <X className="h-4 w-4" /> Sair da projeção
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center gap-3 px-3 pb-4">
          <button
            onClick={() => ir(i - 1)}
            disabled={i === 0}
            aria-label="Slide anterior"
            className="shrink-0 rounded-full bg-gray-800 p-3 text-white hover:bg-gray-700 disabled:opacity-30"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slides[i]}
            alt={`${fase.titulo} — slide ${i + 1}`}
            className="max-h-full max-w-full rounded-lg shadow-2xl"
          />
          <button
            onClick={() => ir(i + 1)}
            disabled={i === total - 1}
            aria-label="Próximo slide"
            className="shrink-0 rounded-full bg-gray-800 p-3 text-white hover:bg-gray-700 disabled:opacity-30"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </div>
      </div>
    );
  }

  // ───────── Página normal ─────────
  return (
    <div>
      {/* Cabeçalho da fase */}
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <Mic2 className="h-3 w-3" /> Apresentado pelo facilitador
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-gray-900">
            {fase.emoji} {fase.titulo}
          </h1>
          <p className="text-sm text-gray-500">{fase.subtitulo}</p>
        </div>
        <button
          onClick={() => setProjecao(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Projector className="h-4 w-4" /> Modo projeção
        </button>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-gray-600">{fase.intro}</p>

      {/* Visualizador */}
      <div className="rounded-xl border bg-white p-3 shadow-sm">
        <div className="relative overflow-hidden rounded-lg bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slides[i]}
            alt={`${fase.titulo} — slide ${i + 1}`}
            className="block w-full"
          />
          <button
            onClick={() => ir(i - 1)}
            disabled={i === 0}
            aria-label="Slide anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 disabled:opacity-0"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => ir(i + 1)}
            disabled={i === total - 1}
            aria-label="Próximo slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 disabled:opacity-0"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            onClick={() => ir(i - 1)}
            disabled={i === 0}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </button>
          <span className="text-sm font-semibold text-gray-500">
            Slide {i + 1} de {total}
          </span>
          <button
            onClick={() => ir(i + 1)}
            disabled={i === total - 1}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            Próximo <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Miniaturas */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {slides.map((s, idx) => (
          <button
            key={s}
            onClick={() => setI(idx)}
            aria-label={`Ir para o slide ${idx + 1}`}
            className={`shrink-0 overflow-hidden rounded border-2 transition-colors ${
              idx === i ? "border-brand-500" : "border-transparent hover:border-gray-300"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s} alt={`Slide ${idx + 1}`} className="h-14 w-24 bg-white object-contain" />
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs text-gray-400">
        No celular, toque numa miniatura ou use as setas; dê zoom de pinça pra ler os detalhes. Na
        aula, o facilitador usa o <span className="font-medium">Modo projeção</span>.
      </p>
    </div>
  );
}
