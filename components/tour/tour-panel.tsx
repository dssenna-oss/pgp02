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
      className="fixed top-6 right-6 w-[380px] max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-violet-500/20"
      style={{
        zIndex: 60,
        background: "linear-gradient(160deg, #1e1b4b 0%, #0f172a 100%)",
        color: "#e0e7ff",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-sm">
            🎙️
          </div>
          <div>
            <div className="text-sm font-semibold">Tour PGP</div>
            <div className="text-xs text-indigo-300">com narração</div>
          </div>
        </div>
        <button
          onClick={end}
          aria-label="Fechar tour"
          className="text-indigo-300 hover:text-white text-xl leading-none px-1"
        >
          ×
        </button>
      </div>

      {/* Progresso */}
      <div className="px-5 py-3 border-b border-white/10">
        <div className="flex items-center justify-between text-xs text-indigo-300 mb-1.5">
          <span>
            Passo {stepIndex + 1} de {totalSteps}
          </span>
          <span className="truncate ml-2 max-w-[200px] text-right">{step.title}</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-all"
            style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Título do passo */}
      <div className="px-5 pt-4">
        <div className="text-lg font-semibold text-white">{step.title}</div>
      </div>

      {/* Transcrição */}
      <div className="px-5 py-3 flex-1 overflow-y-auto">
        <div className="text-sm leading-relaxed text-indigo-100">
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
      <div className="px-5 py-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pausar narração" : "Tocar narração"}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-lg shadow-lg hover:scale-105 transition"
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
                className="pgp-tour-wave-bar w-1 bg-gradient-to-t from-indigo-500 to-violet-400 rounded-full"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          <span className="text-xs text-indigo-300 tabular-nums">
            {formatTime(currentTime)}
          </span>
        </div>

        {/* Botões de navegação */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={prev}
            disabled={stepIndex === 0}
            className="px-3 py-1.5 rounded-lg text-xs text-indigo-300 hover:bg-white/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <button
            onClick={end}
            className="px-3 py-1.5 rounded-lg text-xs text-indigo-300 hover:bg-white/10 transition"
          >
            Pular tour
          </button>
          <button
            onClick={next}
            className="px-4 py-1.5 rounded-lg text-xs bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-medium hover:opacity-90 transition"
          >
            {isLastStep ? "Concluir ✓" : "Próximo →"}
          </button>
        </div>

        {/* Hint atalhos */}
        <div className="text-[11px] text-indigo-400/70 mt-3 text-center">
          Atalhos:{" "}
          <kbd className="px-1.5 py-0.5 bg-white/5 rounded">Espaço</kbd> play/pause ·{" "}
          <kbd className="px-1.5 py-0.5 bg-white/5 rounded">→</kbd> próximo ·{" "}
          <kbd className="px-1.5 py-0.5 bg-white/5 rounded">Esc</kbd> sair
        </div>
      </div>
    </div>
  );
}
