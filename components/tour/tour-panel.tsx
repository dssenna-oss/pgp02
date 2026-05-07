"use client";

/**
 * TourPanel — painel lateral fixo com player de áudio + transcrição + nav.
 *
 * Sincronização da transcrição: enquanto o áudio toca, calculamos a palavra
 * "atual" pela razão `currentTime / duration`. Implementação simples e
 * suficiente pro nível de qualidade que precisamos (não é karaokê
 * frame-accurate; é uma indicação visual do progresso).
 */

import { useEffect, useMemo, useState } from "react";
import { useTour } from "./tour-provider";
import type { TourStep } from "@/lib/tour/tour-types";

interface TourPanelProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TourPanel({ step, stepIndex, totalSteps }: TourPanelProps) {
  const { isPlaying, togglePlay, next, prev, end, audioRef } = useTour();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Quebra a transcrição em palavras pra destacar a atual conforme o áudio toca.
  const words = useMemo(() => step.text.split(/(\s+)/), [step.text]);
  const wordIndices = useMemo(
    () => words.map((w, i) => ({ word: w, isWord: !/^\s+$/.test(w), i })),
    [words]
  );
  const totalWords = wordIndices.filter((w) => w.isWord).length;
  const currentWordIdx =
    duration > 0 && totalWords > 0
      ? Math.min(totalWords - 1, Math.floor((currentTime / duration) * totalWords))
      : -1;

  // Acompanha o tempo do áudio.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
    };
  }, [audioRef, step.id]);

  // Reset do tempo ao trocar de passo.
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [step.id]);

  const isLastStep = stepIndex === totalSteps - 1;
  let runningWordCount = -1;

  return (
    <div
      role="dialog"
      aria-label={`Tour PGP — ${step.title}`}
      className="fixed top-6 right-6 w-[380px] max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-900/40"
      style={{
        zIndex: 60,
        background:
          "linear-gradient(160deg, #faf5ff 0%, #f3e8ff 100%)",
        color: "#1e1b4b",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-purple-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-sm">
            🎙️
          </div>
          <div>
            <div className="text-sm font-semibold text-purple-900">Tour PGP</div>
            <div className="text-xs text-purple-600">com narração</div>
          </div>
        </div>
        <button
          onClick={end}
          aria-label="Fechar tour"
          className="text-purple-500 hover:text-purple-900 hover:bg-purple-100 rounded-full w-7 h-7 flex items-center justify-center text-xl leading-none transition-colors"
        >
          ×
        </button>
      </div>

      {/* Progresso */}
      <div className="px-5 py-3 border-b border-purple-200">
        <div className="flex items-center justify-between text-xs text-purple-700 mb-1.5">
          <span>
            Passo {stepIndex + 1} de {totalSteps}
          </span>
          <span className="truncate ml-2 max-w-[200px] text-right">{step.title}</span>
        </div>
        <div className="h-1.5 bg-purple-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-violet-700 transition-all"
            style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Título do passo */}
      <div className="px-5 pt-4">
        <div className="text-lg font-semibold text-purple-950">{step.title}</div>
      </div>

      {/* Transcrição */}
      <div className="px-5 py-3 flex-1 overflow-y-auto">
        <div className="text-sm leading-relaxed text-slate-700">
          {wordIndices.map(({ word, isWord }, i) => {
            if (isWord) {
              runningWordCount += 1;
              const cls =
                runningWordCount === currentWordIdx
                  ? "pgp-tour-word active"
                  : runningWordCount < currentWordIdx
                  ? "pgp-tour-word spoken"
                  : "pgp-tour-word";
              return (
                <span key={i} className={cls}>
                  {word}
                </span>
              );
            }
            return <span key={i}>{word}</span>;
          })}
        </div>
      </div>

      {/* Player */}
      <div className="px-5 py-4 border-t border-purple-200 bg-white/50">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pausar narração" : "Tocar narração"}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-white text-lg shadow-md hover:shadow-lg hover:scale-105 transition"
          >
            <span aria-hidden>{isPlaying ? "❚❚" : "▶"}</span>
          </button>

          {/* Onda animada */}
          <div
            className="flex items-center gap-1 h-8 flex-1"
            style={{ opacity: isPlaying ? 1 : 0.35 }}
            aria-hidden
          >
            {[60, 80, 100, 70, 90, 50, 75, 95, 65, 85].map((h, i) => (
              <div
                key={i}
                className="pgp-tour-wave-bar w-1 bg-gradient-to-t from-purple-500 to-violet-500 rounded-full"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          <span className="text-xs text-purple-700 tabular-nums">
            {formatTime(currentTime)}
          </span>
        </div>

        {/* Botões de navegação */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={prev}
            disabled={stepIndex === 0}
            className="px-3 py-1.5 rounded-lg text-xs text-purple-700 hover:bg-purple-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <button
            onClick={end}
            className="px-3 py-1.5 rounded-lg text-xs text-purple-700 hover:bg-purple-100 transition"
          >
            Pular tour
          </button>
          <button
            onClick={next}
            className="px-4 py-1.5 rounded-lg text-xs bg-gradient-to-r from-purple-500 to-violet-700 text-white font-medium hover:opacity-90 shadow-sm transition"
          >
            {isLastStep ? "Concluir ✓" : "Próximo →"}
          </button>
        </div>

        {/* Hint atalhos */}
        <div className="text-[11px] text-purple-600 mt-3 text-center">
          Atalhos:{" "}
          <kbd className="px-1.5 py-0.5 bg-white/70 border border-purple-200 rounded">Espaço</kbd> play/pause ·{" "}
          <kbd className="px-1.5 py-0.5 bg-white/70 border border-purple-200 rounded">→</kbd> próximo ·{" "}
          <kbd className="px-1.5 py-0.5 bg-white/70 border border-purple-200 rounded">Esc</kbd> sair
        </div>
      </div>
    </div>
  );
}
