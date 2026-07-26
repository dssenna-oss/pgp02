"use client";

// Moldura dos módulos do mini app "A LGPD, artigo por artigo".
// Os módulos são HTML standalone em public/estrutura-lgpd/ e abrem num iframe
// de MESMA ORIGEM em dois contextos:
//   modo "publico"   → /lgpd/<slug> (sem login; QR da apresentação) — barra
//                      "⬅️ Voltar à apresentação" + faixa fina de volta ao hub.
//   modo "dashboard" → /dashboard/lgpd/<slug> (celular do participante LOGADO;
//                      é o hrefAluno do Telão Comandado) — moldura do app.
//
// Links cruzados: os arquivos trazem a trilha "Art. 1–11 ✓ …" com <a> pra
// /lgpd/<slug> (reescritos na integração). Sem ajuste, o clique navegaria o
// IFRAME (moldura dentro de moldura). Como é mesma origem, ao carregar a gente
// entra no documento e (a) força target="_top" e (b) no dashboard remapeia
// /lgpd/ → /dashboard/lgpd/ pra continuar dentro do app.

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { VoltarAhaSlides } from "@/components/voltar-ahaslides";
import type { ModuloEstrutura } from "@/lib/estrutura-lgpd";

export function ModuloLgpdFrame({
  modulo,
  modo,
}: {
  modulo: ModuloEstrutura;
  modo: "publico" | "dashboard";
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Devolve quantos links ajustou. 0 = a trilha ainda não existe no documento.
  function ajustarLinks(): number {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return 0;
      const alvos = doc.querySelectorAll<HTMLAnchorElement>('a[href^="/lgpd/"]');
      alvos.forEach((a) => {
        if (modo === "dashboard") {
          a.setAttribute(
            "href",
            (a.getAttribute("href") ?? "").replace(/^\/lgpd\//, "/dashboard/lgpd/"),
          );
        }
        a.setAttribute("target", "_top");
      });
      return alvos.length;
    } catch {
      /* mesma origem — não deve falhar; se falhar, os links seguem no iframe */
      return 0;
    }
  }

  // O standalone DESEMPACOTA o conteúdo via JS depois do load do iframe — a
  // trilha de links não existe de cara. E o iframe (que já vem no HTML do
  // servidor) costuma terminar de carregar ANTES da hidratação do React, então
  // o onLoad nem chega a disparar. Estratégia: tentar em intervalos curtos a
  // partir do MOUNT (e de novo num eventual onLoad), até achar a trilha ou
  // desistir em ~8s (o Histórico não tem trilha, por exemplo).
  function iniciarTentativas() {
    if (timerRef.current) clearInterval(timerRef.current);
    let tentativas = 0;
    if (ajustarLinks() > 0) return;
    timerRef.current = setInterval(() => {
      tentativas += 1;
      if (ajustarLinks() > 0 || tentativas >= 20) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 400);
  }

  useEffect(() => {
    iniciarTentativas();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (modo === "dashboard") {
    return (
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:text-indigo-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="mt-2 text-lg font-bold text-gray-900">
          📖 LGPD — {modulo.intervalo === "Histórico" || modulo.intervalo === "Simulado"
            ? modulo.titulo
            : `${modulo.intervalo}: ${modulo.titulo}`}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Mesmo material que está no telão. Role para ler no seu celular.
        </p>
        <iframe
          ref={iframeRef}
          onLoad={iniciarTentativas}
          src={modulo.arquivo}
          title={`LGPD — ${modulo.intervalo}`}
          className="mt-3 h-[78dvh] w-full rounded-lg border border-gray-200 bg-white"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="pagina-embed flex h-[100dvh] flex-col bg-gray-50">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2">
        <Link
          href="/lgpd"
          className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">Todos os módulos</span>
        </Link>
        <span className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
          {modulo.intervalo}
        </span>
      </header>
      <iframe
        ref={iframeRef}
        onLoad={iniciarTentativas}
        src={modulo.arquivo}
        title={`LGPD — ${modulo.intervalo} · ${modulo.titulo}`}
        className="w-full flex-1 border-0 bg-white"
        allowFullScreen
      />
      <VoltarAhaSlides />
    </div>
  );
}
