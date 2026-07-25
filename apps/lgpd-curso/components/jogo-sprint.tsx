"use client";

// ⚡ Sprint 60 segundos — sensível ou comum, contra o relógio.
// Timer client-side (só roda após interação — sem problema de hidratação).

import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Trophy, Zap } from "lucide-react";
import { SPRINT_ITENS, SPRINT_SEGUNDOS, type ItemSprint } from "@/lib/jogos";

type Registro = { item: ItemSprint; certo: boolean };

export function JogoSprint() {
  const [fase, setFase] = useState<"pronto" | "jogando" | "fim">("pronto");
  const [idx, setIdx] = useState(0);
  const [restante, setRestante] = useState(SPRINT_SEGUNDOS);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [flash, setFlash] = useState<"certo" | "errado" | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const item = SPRINT_ITENS[idx];

  useEffect(() => {
    if (fase !== "jogando") return;
    timerRef.current = setInterval(() => {
      setRestante((r) => {
        if (r <= 1) {
          setFase("fim");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fase]);

  function comecar() {
    setFase("jogando");
    setIdx(0);
    setRestante(SPRINT_SEGUNDOS);
    setRegistros([]);
    setFlash(null);
  }

  function responder(resp: "S" | "C") {
    if (fase !== "jogando" || !item) return;
    const certo = item.resposta === resp;
    setRegistros((r) => [...r, { item, certo }]);
    setFlash(certo ? "certo" : "errado");
    setTimeout(() => setFlash(null), 250);
    if (idx < SPRINT_ITENS.length - 1) setIdx(idx + 1);
    else setFase("fim");
  }

  const acertos = registros.filter((r) => r.certo).length;
  const erros = registros.filter((r) => !r.certo);

  // ---------------------------------------------------------------- TELAS
  if (fase === "pronto") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <Zap className="mx-auto h-10 w-10 text-amber-500" />
        <h2 className="mt-2 text-xl font-bold text-gray-900">
          {SPRINT_ITENS.length} dados · {SPRINT_SEGUNDOS} segundos
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Vai aparecer um dado por vez: toque <strong>SENSÍVEL</strong> ou{" "}
          <strong>COMUM</strong> o mais rápido que conseguir. Errou? Segue o
          jogo — as explicações vêm no final.
        </p>
        <button
          type="button"
          onClick={comecar}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-lg font-bold text-white hover:bg-indigo-700"
        >
          <Play className="h-5 w-5" /> Começar!
        </button>
      </div>
    );
  }

  if (fase === "fim") {
    const respondidos = registros.length;
    return (
      <div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-center">
          <Trophy className="mx-auto h-10 w-10 text-amber-500" />
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {acertos} de {respondidos} em {SPRINT_SEGUNDOS - restante}s
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {respondidos === SPRINT_ITENS.length && acertos === respondidos
              ? "Gabaritou o baralho inteiro — reflexo de DPO! ⚡"
              : acertos >= Math.ceil(respondidos * 0.8)
                ? "Reflexo afiado! Confira abaixo os que escaparam."
                : "Bom aquecimento — o rol do art. 5º, II gruda com mais uma rodada."}
          </p>
        </div>

        {erros.length > 0 && (
          <>
            <h2 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Onde escorregou
            </h2>
            <ol className="space-y-2">
              {erros.map((r, i) => (
                <li key={i} className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm">
                  <p className="font-semibold text-gray-900">
                    {r.item.texto} → {r.item.resposta === "S" ? "SENSÍVEL" : "COMUM"}
                  </p>
                  <p className="mt-0.5 text-gray-700">{r.item.nota}</p>
                </li>
              ))}
            </ol>
          </>
        )}

        <button
          type="button"
          onClick={comecar}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" /> Mais uma rodada
        </button>
      </div>
    );
  }

  // jogando
  const pct = (restante / SPRINT_SEGUNDOS) * 100;
  return (
    <div>
      {/* Timer */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3">
        <div className="flex items-center justify-between text-xs font-medium text-gray-600">
          <span>
            ⚡ Item {idx + 1} de {SPRINT_ITENS.length} · {acertos} certo{acertos === 1 ? "" : "s"}
          </span>
          <span className={restante <= 10 ? "font-bold text-rose-600" : ""}>{restante}s</span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${restante <= 10 ? "bg-rose-500" : "bg-amber-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Item */}
      <div
        className={`rounded-2xl border-2 p-8 text-center transition-colors ${
          flash === "certo"
            ? "border-green-400 bg-green-50"
            : flash === "errado"
              ? "border-rose-400 bg-rose-50"
              : "border-gray-200 bg-white"
        }`}
      >
        <p className="text-2xl font-bold text-gray-900">{item.texto}</p>
      </div>

      {/* Botões */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => responder("S")}
          className="rounded-2xl bg-rose-600 px-4 py-5 text-lg font-bold text-white active:scale-95 hover:bg-rose-700"
        >
          🔴 SENSÍVEL
        </button>
        <button
          type="button"
          onClick={() => responder("C")}
          className="rounded-2xl bg-indigo-600 px-4 py-5 text-lg font-bold text-white active:scale-95 hover:bg-indigo-700"
        >
          🔵 COMUM
        </button>
      </div>
    </div>
  );
}
