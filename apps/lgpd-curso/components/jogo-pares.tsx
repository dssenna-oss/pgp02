"use client";

// 🔗 Ligue os Pares — 3 baralhos sequenciais. Toca um da esquerda, um da
// direita: certo trava verde; errado conta e libera. Sem servidor.

import { useState } from "react";
import { ArrowRight, RotateCcw, Trophy } from "lucide-react";
import { BARALHOS } from "@/lib/jogos";

export function JogoPares() {
  const [baralhoIdx, setBaralhoIdx] = useState(0);
  const [feitos, setFeitos] = useState<Set<string>>(new Set());
  const [selEsq, setSelEsq] = useState<string | null>(null);
  const [erros, setErros] = useState(0);
  const [errosTotais, setErrosTotais] = useState(0);
  const [notaAtual, setNotaAtual] = useState<string | null>(null);
  const [errou, setErrou] = useState(false);
  const [fim, setFim] = useState(false);

  const baralho = BARALHOS[baralhoIdx];
  const completo = feitos.size === baralho.pares.length;

  function parPorId(id: string) {
    return baralho.pares.find((p) => p.id === id)!;
  }

  function tocarEsq(id: string) {
    if (feitos.has(id)) return;
    setSelEsq(id === selEsq ? null : id);
    setErrou(false);
  }

  function tocarDir(id: string) {
    if (!selEsq || feitos.has(id)) return;
    if (id === selEsq) {
      // par certo (mesmo id nos dois lados)
      setFeitos((prev) => new Set(prev).add(id));
      setNotaAtual(parPorId(id).nota);
      setSelEsq(null);
      setErrou(false);
    } else {
      setErros((e) => e + 1);
      setErrosTotais((e) => e + 1);
      setErrou(true);
      setNotaAtual(null);
      setSelEsq(null);
    }
  }

  function proximoBaralho() {
    if (baralhoIdx < BARALHOS.length - 1) {
      setBaralhoIdx(baralhoIdx + 1);
      setFeitos(new Set());
      setSelEsq(null);
      setErros(0);
      setNotaAtual(null);
      setErrou(false);
    } else {
      setFim(true);
    }
  }

  function reiniciar() {
    setBaralhoIdx(0);
    setFeitos(new Set());
    setSelEsq(null);
    setErros(0);
    setErrosTotais(0);
    setNotaAtual(null);
    setErrou(false);
    setFim(false);
  }

  if (fim) {
    const totalPares = BARALHOS.reduce((s, b) => s + b.pares.length, 0);
    return (
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-center">
        <Trophy className="mx-auto h-10 w-10 text-amber-500" />
        <p className="mt-2 text-2xl font-bold text-gray-900">
          {totalPares} pares ligados · {errosTotais} erro{errosTotais === 1 ? "" : "s"}
        </p>
        <p className="mt-1 text-sm text-gray-700">
          {errosTotais === 0
            ? "Gabaritou os fundamentos — bases legais, categorias e papéis na ponta dos dedos! 🎯"
            : errosTotais <= 4
              ? "Fundamentos sólidos! Os tropeços viraram aprendizado — as notas 💡 explicaram cada par."
              : "Bom treino! Jogue de novo: na segunda rodada os pares grudam."}
        </p>
        <button
          type="button"
          onClick={reiniciar}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" /> Jogar de novo
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-gray-500">
        <span>
          Baralho {baralhoIdx + 1} de {BARALHOS.length}: <strong>{baralho.titulo}</strong>
        </span>
        <span>
          {feitos.size}/{baralho.pares.length} · {erros} erro{erros === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mb-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-900">
        {baralho.instrucao} Toque um cartão de cada coluna pra formar o par.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {/* Coluna esquerda */}
        <div className="space-y-2">
          {baralho.ordemEsq.map((id) => {
            const p = parPorId(id);
            const feito = feitos.has(id);
            const sel = selEsq === id;
            return (
              <button
                key={id}
                type="button"
                disabled={feito}
                onClick={() => tocarEsq(id)}
                className={`w-full rounded-xl border p-3 text-left text-[13px] leading-snug transition min-h-[56px] ${
                  feito
                    ? "border-green-300 bg-green-50 text-green-900"
                    : sel
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-400"
                      : "border-gray-200 bg-white text-gray-800 hover:border-indigo-300"
                }`}
              >
                {feito && "✓ "}
                {p.esquerda}
              </button>
            );
          })}
        </div>
        {/* Coluna direita */}
        <div className="space-y-2">
          {baralho.ordemDir.map((id) => {
            const p = parPorId(id);
            const feito = feitos.has(id);
            return (
              <button
                key={id}
                type="button"
                disabled={feito || !selEsq}
                onClick={() => tocarDir(id)}
                className={`w-full rounded-xl border p-3 text-left text-[13px] leading-snug transition min-h-[56px] ${
                  feito
                    ? "border-green-300 bg-green-50 text-green-900"
                    : selEsq
                      ? "border-gray-200 bg-white text-gray-800 hover:border-indigo-300"
                      : "border-gray-100 bg-gray-50 text-gray-400"
                }`}
              >
                {feito && "✓ "}
                {p.direita}
              </button>
            );
          })}
        </div>
      </div>

      {errou && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          ✗ Não é esse o par — tente de novo.
        </p>
      )}
      {notaAtual && !errou && (
        <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
          💡 {notaAtual}
        </p>
      )}

      {completo && (
        <button
          type="button"
          onClick={proximoBaralho}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700"
        >
          {baralhoIdx < BARALHOS.length - 1 ? "Próximo baralho" : "Ver resultado"}
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
