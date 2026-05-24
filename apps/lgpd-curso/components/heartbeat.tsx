"use client";

// Componente invisível plugado no AuthedLayout. Em todas as rotas autenticadas
// (dashboard + facilitador + admin), dispara POST /api/curso/heartbeat a cada
// 30 segundos pra atualizar `lastSeenAt` do usuário no banco. O Painel do
// Facilitador usa essa info pra mostrar quais papéis de cada grupo estão
// com sessão ativa em tempo real.
//
// Tolerante a falha: se o fetch der erro (rede caiu, sessão expirou), o
// próximo tick tenta de novo. Nunca quebra a UX.

import { useEffect } from "react";
import { useSession } from "next-auth/react";

const HEARTBEAT_MS = 30_000;

export function Heartbeat() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelado = false;
    const tick = async () => {
      try {
        await fetch("/api/curso/heartbeat", { method: "POST", cache: "no-store" });
      } catch {
        // Silencioso — heartbeat não deve poluir console pra falha de rede transitória.
      }
    };

    // 1º tick imediato pra registrar presença assim que entra
    tick();
    const id = setInterval(() => { if (!cancelado) tick(); }, HEARTBEAT_MS);

    return () => { cancelado = true; clearInterval(id); };
  }, [status]);

  return null;
}
