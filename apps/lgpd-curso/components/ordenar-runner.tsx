"use client";

// Formato 4 — Ordenar as seções.
// Setas ↑↓ (padrão mobile do curso, igual às Atividades ao vivo). A ordem
// correta é a ordem do array `itens` do catálogo; a exibição inicial usa a
// permutação fixa `ordemInicial` (nada de Math.random → sem mismatch de
// hidratação). Sem servidor, sem banco.

import { useState } from "react";
import { ArrowUp, ArrowDown, CheckCircle2, XCircle, RotateCcw, ListChecks } from "lucide-react";
import type { MontadorDoc } from "@/lib/montador-docs";

export function OrdenarRunner({ doc }: { doc: MontadorDoc }) {
  // Hooks primeiro (regra do React); doc sem o formato não renderiza.
  const dados = doc.ordenar;
  const [ordem, setOrdem] = useState<string[]>(dados ? dados.ordemInicial : []);
  const [conferido, setConferido] = useState(false);
  if (!dados) return null;
  const { itens, ordemInicial, logica, instrucao } = dados;

  const ordemCorreta = itens.map((i) => i.id);

  function mover(idx: number, dir: -1 | 1) {
    if (conferido) return;
    const alvo = idx + dir;
    if (alvo < 0 || alvo >= ordem.length) return;
    const novo = [...ordem];
    [novo[idx], novo[alvo]] = [novo[alvo], novo[idx]];
    setOrdem(novo);
  }

  function reiniciar() {
    setOrdem(ordemInicial);
    setConferido(false);
  }

  const posicoesCertas = ordem.filter((id, idx) => ordemCorreta[idx] === id).length;
  const perfeito = posicoesCertas === itens.length;

  return (
    <div>
      <p className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
        {instrucao}
      </p>

      <ol className="space-y-2">
        {ordem.map((id, idx) => {
          const item = itens.find((i) => i.id === id)!;
          const certa = ordemCorreta[idx] === id;
          const posicaoCorreta = ordemCorreta.indexOf(id) + 1;
          return (
            <li
              key={id}
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                !conferido
                  ? "border-gray-200 bg-white"
                  : certa
                    ? "border-green-300 bg-green-50"
                    : "border-rose-300 bg-rose-50"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                  !conferido ? "bg-indigo-600" : certa ? "bg-green-600" : "bg-rose-500"
                }`}
              >
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{item.rotulo}</p>
                {item.detalhe && <p className="text-sm text-gray-500">{item.detalhe}</p>}
                {conferido && !certa && (
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-rose-700">
                    <XCircle className="h-3.5 w-3.5" /> posição certa: {posicaoCorreta}ª
                  </p>
                )}
                {conferido && certa && (
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> no lugar
                  </p>
                )}
              </div>
              {!conferido && (
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => mover(idx, -1)}
                    className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Mover para cima"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === ordem.length - 1}
                    onClick={() => mover(idx, 1)}
                    className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Mover para baixo"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {conferido && (
        <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <p className="text-center text-2xl font-bold text-gray-900">
            {perfeito ? "Ordem exata! 🎯" : `${posicoesCertas} de ${itens.length} posições certas`}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">💡 {logica}</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {!conferido ? (
          <button
            type="button"
            onClick={() => setConferido(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            <ListChecks className="h-5 w-5" /> Conferir ordem
          </button>
        ) : (
          <button
            type="button"
            onClick={reiniciar}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" /> Refazer
          </button>
        )}
      </div>
    </div>
  );
}
