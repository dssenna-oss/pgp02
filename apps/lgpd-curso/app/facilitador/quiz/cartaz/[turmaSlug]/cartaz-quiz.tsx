"use client";

// Tela cheia pro facilitador projetar / imprimir.
// O ideal é: F11 pra fullscreen no projetor, ou Ctrl+P pra imprimir A4 paisagem.

import { useEffect, useState } from "react";
import { Printer, X, Maximize2 } from "lucide-react";

type Turma = {
  nome: string;
  cidade: string;
  slug: string;
  status: string;
};

function qrSrc(data: string, size = 500): string {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=${size}x${size}&margin=2`;
}

export function CartazQuiz({ turma }: { turma: Turma }) {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    // Esconde o footer global do RootLayout enquanto o cartaz estiver aberto
    const footer = document.querySelector("body > footer");
    if (footer instanceof HTMLElement) footer.style.display = "none";
    return () => {
      if (footer instanceof HTMLElement) footer.style.display = "";
    };
  }, []);

  const quizUrl = `${origin}/quiz/${turma.slug}`;

  function imprimir() {
    window.print();
  }

  function fullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function fechar() {
    window.close();
  }

  return (
    <>
      {/* Barra de ações — escondida na impressão e em modo fullscreen */}
      <div className="fixed top-3 right-3 z-50 flex gap-2 print:hidden">
        <button
          type="button"
          onClick={fullscreen}
          className="inline-flex items-center gap-1.5 rounded-md border bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white shadow-sm backdrop-blur"
          title="Tela cheia (F11)"
        >
          <Maximize2 className="h-4 w-4" /> Tela cheia
        </button>
        <button
          type="button"
          onClick={imprimir}
          className="inline-flex items-center gap-1.5 rounded-md border bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white shadow-sm backdrop-blur"
          title="Imprimir A4"
        >
          <Printer className="h-4 w-4" /> Imprimir
        </button>
        <button
          type="button"
          onClick={fechar}
          className="inline-flex items-center gap-1.5 rounded-md border bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white shadow-sm backdrop-blur"
          title="Fechar"
        >
          <X className="h-4 w-4" /> Fechar
        </button>
      </div>

      {/* Cartaz */}
      <div className="cartaz-quiz min-h-screen w-full overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white print:bg-white print:text-gray-900">
        {/* Padrão decorativo (escondido na impressão pra economizar tinta) */}
        <svg
          className="absolute inset-0 h-full w-full opacity-10 print:hidden"
          viewBox="0 0 800 400"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <pattern id="cartaz-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cartaz-grid)" />
        </svg>

        <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-8 py-8 print:px-6 print:py-6">
          {/* Topo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center gap-3">
              {/* Escudo+cadeado em SVG */}
              <svg
                className="h-14 w-14 print:h-12 print:w-12 print:text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 2 L4 5 V12 C 4 16.5 7 20 12 22 C 17 20 20 16.5 20 12 V5 Z" />
                <rect x="9" y="11" width="6" height="5" rx="0.5" />
                <path d="M10 11 V9 a2 2 0 0 1 4 0 V11" />
              </svg>
              <div className="text-left">
                <div className="text-[11px] sm:text-sm font-semibold uppercase tracking-[0.2em] opacity-80 print:text-gray-500">
                  Diagnóstico Inicial
                </div>
                <div className="text-2xl sm:text-4xl font-bold leading-tight">Quiz LGPD</div>
              </div>
            </div>
            <div className="mt-3 text-base sm:text-lg font-medium opacity-90 print:text-gray-700">
              Turma: <span className="font-bold">{turma.nome}</span> · {turma.cidade}
            </div>
          </div>

          {/* Núcleo: instrução + QR + URL */}
          <div className="my-6 flex flex-1 flex-col items-center justify-center gap-5 print:my-3 print:gap-3">
            <div className="text-center text-lg sm:text-xl font-semibold print:text-base print:text-gray-800">
              📱 Aponte a câmera do celular pro QR pra começar
            </div>

            {/* QR Code grande */}
            <div className="rounded-2xl bg-white p-5 shadow-2xl ring-4 ring-white/30 print:ring-2 print:ring-gray-300 print:shadow-none">
              <img
                src={qrSrc(quizUrl, 500)}
                alt="QR Code do Quiz LGPD"
                className="h-[280px] w-[280px] sm:h-[360px] sm:w-[360px] print:h-[260px] print:w-[260px] block"
              />
            </div>

            {/* URL como fallback */}
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-wider opacity-75 print:text-gray-500">
                Ou abra direto no navegador
              </div>
              <div className="mt-1 inline-block rounded-lg bg-white/15 px-4 py-2 font-mono text-sm sm:text-base font-bold ring-1 ring-white/30 print:bg-white print:text-gray-900 print:ring-gray-300">
                {quizUrl || "carregando…"}
              </div>
            </div>
          </div>

          {/* Rodapé com chips das categorias + instruções */}
          <div className="space-y-3">
            <div className="text-center text-xs sm:text-sm font-medium opacity-90 print:text-gray-700">
              30 perguntas · 7-10 minutos · 100% anônimo
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-[11px] sm:text-xs font-medium">
              <span className="rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/25 print:bg-gray-100 print:text-gray-700 print:ring-gray-300">
                📚 Princípios da LGPD
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/25 print:bg-gray-100 print:text-gray-700 print:ring-gray-300">
                ⚖️ Bases Legais
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/25 print:bg-gray-100 print:text-gray-700 print:ring-gray-300">
                👥 Personagens
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/25 print:bg-gray-100 print:text-gray-700 print:ring-gray-300">
                🛡️ Direitos do Titular
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/25 print:bg-gray-100 print:text-gray-700 print:ring-gray-300">
                🚩 Fases do PGP
              </span>
            </div>
            <div className="text-center text-[10px] sm:text-xs opacity-60 print:text-gray-400">
              LGPD-Friendly · Curso 2026 · Resultado individual e agregado da turma na tela do facilitador
            </div>
          </div>
        </div>
      </div>

      {/* CSS de impressão pra economizar tinta e ajustar layout A4 paisagem */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          html, body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          /* Esconde o banner amarelo de treinamento durante impressão */
          body > div.bg-yellow-400,
          body > .training-banner {
            display: none !important;
          }
          .cartaz-quiz {
            min-height: auto !important;
            background: white !important;
          }
        }
      `}</style>
    </>
  );
}
