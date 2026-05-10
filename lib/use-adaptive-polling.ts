"use client";

/**
 * Hook de polling adaptativo (2026-05-11).
 *
 * Em vez de chamar `fetch` num intervalo fixo (que gasta bateria em
 * mobile e desperdiça largura de banda quando a aba está escondida),
 * esse hook ajusta o ritmo do polling conforme o estado da página:
 *
 *   - aba VISÍVEL e focada     → poll a cada `activeMs` (rápido)
 *   - aba VISÍVEL mas sem foco → poll a cada `inactiveMs` (médio)
 *   - aba ESCONDIDA            → pausa (zero requests)
 *   - volta da pausa           → refetch imediato + retoma intervalo
 *
 * Substitui `setInterval(fetchFn, 30000)` em telas que precisam de
 * "near-real-time" sem depender de WebSocket/Pusher (que não funcionam
 * bem em Vercel serverless sem pub/sub externo).
 *
 * Uso típico:
 *
 *   useAdaptivePolling(refresh, {
 *     activeMs: 5_000,
 *     inactiveMs: 30_000,
 *     refetchOnFocus: true,
 *   });
 */

import { useEffect, useRef } from "react";

export interface AdaptivePollingOptions {
  /**
   * Intervalo (ms) quando a aba está visível e focada. Default 5000.
   * Use valores menores (3-5s) pra simular "real-time"; maiores (10s+)
   * pra reduzir custo no servidor.
   */
  activeMs?: number;
  /**
   * Intervalo (ms) quando a aba está visível mas sem foco (ex: outra
   * janela em cima). Default 30000.
   */
  inactiveMs?: number;
  /**
   * Refetch imediato quando a aba volta a ficar visível ou ganha foco.
   * Default true (UX clara: user vê dados frescos sem esperar tick).
   */
  refetchOnFocus?: boolean;
  /**
   * Liga/desliga o hook. Útil pra desabilitar polling quando dialog
   * está aberto, por exemplo. Default true.
   */
  enabled?: boolean;
}

export function useAdaptivePolling(
  fn: () => void | Promise<void>,
  opts: AdaptivePollingOptions = {},
): void {
  const {
    activeMs = 5_000,
    inactiveMs = 30_000,
    refetchOnFocus = true,
    enabled = true,
  } = opts;

  // Mantém ref pra última versão da função sem rearmar o effect
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const computeDelay = (): number | null => {
      if (document.hidden) return null; // pausa
      // document.hasFocus() ainda funciona — sem ele, considera "ativo"
      // (compatibilidade com browsers que não exponham foco).
      const hasFocus =
        typeof document.hasFocus === "function" ? document.hasFocus() : true;
      return hasFocus ? activeMs : inactiveMs;
    };

    const tick = async () => {
      if (cancelled) return;
      try {
        await fnRef.current();
      } catch {
        // erros são responsabilidade do caller — silencia aqui
      }
      schedule();
    };

    const schedule = () => {
      if (cancelled) return;
      const delay = computeDelay();
      if (delay === null) return; // pausa — espera visibility/focus events
      timer = setTimeout(tick, delay);
    };

    const cancel = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const handleVisibility = () => {
      cancel();
      if (!document.hidden && refetchOnFocus) {
        // saiu da pausa → refetch imediato
        void tick();
      } else {
        schedule();
      }
    };

    const handleFocus = () => {
      cancel();
      if (refetchOnFocus) void tick();
      else schedule();
    };

    const handleBlur = () => {
      cancel();
      schedule();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // primeiro agendamento (sem refetch — quem chamou o hook já fez
    // o fetch inicial no mount próprio dele)
    schedule();

    return () => {
      cancelled = true;
      cancel();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [activeMs, inactiveMs, refetchOnFocus, enabled]);
}
