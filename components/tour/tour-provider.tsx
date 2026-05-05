"use client";

/**
 * TourProvider — contexto + state machine do tour de onboarding.
 *
 * Responsabilidades:
 *  - Manter estado (isOpen, currentIndex, isPlaying).
 *  - Filtrar passos cujo `targetSelector` não existe na DOM (papel sem
 *    permissão pra ver a tela).
 *  - Expor API: `start()`, `end()`, `next()`, `prev()`, `togglePlay()`.
 *  - Renderizar Spotlight + Panel quando `isOpen === true`.
 *
 * Atalhos de teclado (quando o tour está aberto):
 *  - Espaço → play/pause
 *  - →      → próximo passo
 *  - ←      → passo anterior
 *  - Esc    → fecha o tour
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { TourScriptId, TourState, TourStep } from "@/lib/tour/tour-types";
import { MASTER_TOUR } from "@/lib/tour/master-script";
import {
  markTourCompleted,
  markTourSkipped,
  shouldAutoStart,
} from "@/lib/tour/tour-storage";
import TourSpotlight from "./tour-spotlight";
import TourPanel from "./tour-panel";

interface TourContextValue extends TourState {
  start: (scriptId?: TourScriptId) => void;
  end: () => void;
  next: () => void;
  prev: () => void;
  togglePlay: () => void;
  /** Ref do <audio> usado pelo painel pra sincronizar a transcrição. */
  audioRef: React.RefObject<HTMLAudioElement>;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour deve ser usado dentro de <TourProvider>");
  return ctx;
}

interface TourProviderProps {
  children: React.ReactNode;
}

export default function TourProvider({ children }: TourProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scriptId, setScriptId] = useState<TourScriptId | null>(null);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Filtra passos cujo target não existe (DPO-only ausente, etc.).
  const filterAvailableSteps = useCallback((source: TourStep[]): TourStep[] => {
    if (typeof document === "undefined") return source;
    return source.filter((step) => {
      if (!step.targetSelector) return true;
      return !!document.querySelector(step.targetSelector);
    });
  }, []);

  const start = useCallback(
    (id: TourScriptId = "master") => {
      // Por enquanto só temos o roteiro mestre. Futuro: por fase + por papel.
      const source = id === "master" ? MASTER_TOUR : MASTER_TOUR;
      const available = filterAvailableSteps(source);
      if (available.length === 0) return;
      setScriptId(id);
      setSteps(available);
      setCurrentIndex(0);
      setIsOpen(true);
      setIsPlaying(false);
    },
    [filterAvailableSteps]
  );

  const end = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Encerramento manual (Pular tour / Esc / ×) → marca como skipped.
    // Se já houver `completedAt` em local storage, `markTourSkipped` é
    // no-op — a conclusão vence a desistência.
    if (scriptId) markTourSkipped(scriptId);
    setIsOpen(false);
    setIsPlaying(false);
    setCurrentIndex(0);
  }, [scriptId]);

  const next = useCallback(() => {
    setCurrentIndex((idx) => {
      if (idx >= steps.length - 1) {
        // Último passo → marcar como concluído + encerrar.
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        if (scriptId) markTourCompleted(scriptId);
        setIsOpen(false);
        setIsPlaying(false);
        return 0;
      }
      return idx + 1;
    });
  }, [steps.length, scriptId]);

  const prev = useCallback(() => {
    setCurrentIndex((idx) => Math.max(0, idx - 1));
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().catch(() => {
        // Áudio inexistente (404) ou navegador bloqueou autoplay — tudo bem,
        // a transcrição segue legível. Apenas atualiza o estado.
        setIsPlaying(false);
      });
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  // Auto-disparo do tour mestre na 1ª visita (sem registro em localStorage).
  // Aguarda a sidebar estar montada na DOM antes de abrir, pra que o passo 2
  // já consiga aplicar spotlight sem race. Tenta por até 5s; se a sidebar
  // não aparecer (ex.: viewport mobile com sidebar fechada), desiste em
  // silêncio e usuário pode disparar pelo botão flutuante.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!shouldAutoStart("master")) return;
    let attempts = 0;
    let cancelled = false;
    const tryStart = () => {
      if (cancelled) return;
      const sidebarReady = !!document.querySelector('[data-tour-id="sidebar"]');
      if (sidebarReady) {
        start("master");
      } else if (attempts < 20) {
        attempts += 1;
        setTimeout(tryStart, 250);
      }
    };
    const initial = setTimeout(tryStart, 800);
    return () => {
      cancelled = true;
      clearTimeout(initial);
    };
    // Roda só uma vez no mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atalhos globais quando o tour está aberto.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.code === "Escape") {
        e.preventDefault();
        end();
      } else if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, end, togglePlay, next, prev]);

  // Quando o passo muda, recarrega o áudio e tenta tocar.
  useEffect(() => {
    if (!isOpen) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.load();
    void audio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      // Sem áudio disponível (404) ou autoplay bloqueado: usuário usa o botão Play.
      setIsPlaying(false);
    });
  }, [currentIndex, isOpen]);

  const value = useMemo<TourContextValue>(
    () => ({
      isOpen,
      scriptId,
      steps,
      currentIndex,
      isPlaying,
      start,
      end,
      next,
      prev,
      togglePlay,
      audioRef,
    }),
    [isOpen, scriptId, steps, currentIndex, isPlaying, start, end, next, prev, togglePlay]
  );

  const currentStep = steps[currentIndex];

  return (
    <TourContext.Provider value={value}>
      {children}
      {isOpen && currentStep && (
        <>
          <TourSpotlight targetSelector={currentStep.targetSelector} />
          <TourPanel
            step={currentStep}
            stepIndex={currentIndex}
            totalSteps={steps.length}
          />
          <audio
            ref={audioRef}
            src={currentStep.audioSrc}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            preload="auto"
          />
        </>
      )}
    </TourContext.Provider>
  );
}
