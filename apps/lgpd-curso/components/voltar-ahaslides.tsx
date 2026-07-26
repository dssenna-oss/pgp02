"use client";

// Barra fixa "Voltar à apresentação" — fecha o ciclo AhaSlides ↔ app.
// Ativada quando a página pública é aberta com ?voltar=<url do AhaSlides>;
// o destino fica em sessionStorage, então a barra PERSISTE enquanto o
// participante navega entre Saiba mais, atividades e jogos (mesma aba).
// Segurança: só aceita https em ahaslides.com (nada de open redirect).

import { useEffect, useState } from "react";

const CHAVE = "voltar-apresentacao";

// Apresentação da turma ATUAL: a barra aparece SEMPRE nas páginas públicas,
// mesmo pra quem digitou a URL curta na mão (sem ?voltar=). O parâmetro,
// quando presente, tem prioridade — e serve pra apontar outra apresentação.
// ⚠️ Trocar a cada turma (ou esvaziar "" pra barra só aparecer com ?voltar=).
const APRESENTACAO_PADRAO = "https://ahaslides.com/CVHY9";

function urlPermitida(valor: string): string | null {
  try {
    const u = new URL(valor);
    const host = u.hostname.toLowerCase();
    const ok =
      u.protocol === "https:" &&
      (host === "ahaslides.com" || host.endsWith(".ahaslides.com"));
    return ok ? u.toString() : null;
  } catch {
    return null;
  }
}

export function VoltarAhaSlides() {
  const [destino, setDestino] = useState<string | null>(null);

  useEffect(() => {
    try {
      const param = new URLSearchParams(window.location.search).get("voltar");
      const daUrl = param ? urlPermitida(param) : null;
      if (daUrl) sessionStorage.setItem(CHAVE, daUrl);
      const salvo =
        daUrl ??
        urlPermitida(sessionStorage.getItem(CHAVE) ?? "") ??
        urlPermitida(APRESENTACAO_PADRAO);
      if (salvo) setDestino(salvo);
    } catch {
      /* sessionStorage indisponível — segue sem a barra */
    }
  }, []);

  if (!destino) return null;

  return (
    <>
      {/* espaçador pra barra não cobrir o rodapé da página */}
      <div className="h-14" aria-hidden />
      <a
        href={destino}
        className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-[0_-2px_10px_rgba(0,0,0,0.15)] active:bg-indigo-700"
      >
        ⬅️ Voltar à apresentação
      </a>
    </>
  );
}
