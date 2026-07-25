"use client";

// 🚒 Dia D — simulador de incidente. Cenas com decisões; cada escolha queima
// horas do prazo da ANPD (72h úteis da ciência). Sem servidor, sem banco.

import { useState } from "react";
import { ArrowRight, Clock, RotateCcw, Trophy } from "lucide-react";
import { DIA_D_CENAS, DIA_D_PRAZO_HORAS, type OpcaoCena } from "@/lib/jogos";

export function JogoDiaD() {
  const [idx, setIdx] = useState(0);
  const [horas, setHoras] = useState(0);
  const [pontos, setPontos] = useState(0);
  const [escolha, setEscolha] = useState<OpcaoCena | null>(null);
  const [historico, setHistorico] = useState<{ momento: string; rotulo: string; pontos: number }[]>([]);
  const [fim, setFim] = useState(false);

  const cena = DIA_D_CENAS[idx];
  const total = DIA_D_CENAS.length;
  const pctPrazo = Math.min(100, Math.round((horas / DIA_D_PRAZO_HORAS) * 100));
  const estourou = horas > DIA_D_PRAZO_HORAS;

  function escolher(op: OpcaoCena) {
    if (escolha) return;
    setEscolha(op);
    setHoras((h) => h + op.horas);
    setPontos((p) => p + op.pontos);
    setHistorico((h) => [...h, { momento: cena.momento, rotulo: op.rotulo, pontos: op.pontos }]);
  }

  function avancar() {
    setEscolha(null);
    if (idx < total - 1) setIdx(idx + 1);
    else setFim(true);
  }

  function reiniciar() {
    setIdx(0);
    setHoras(0);
    setPontos(0);
    setEscolha(null);
    setHistorico([]);
    setFim(false);
  }

  const maxPontos = total * 2;

  // ---------------------------------------------------------------- FINAL
  if (fim) {
    const titulo = estourou
      ? "⏰ O prazo estourou…"
      : pontos >= 12
        ? "🏆 DPO de crise!"
        : pontos >= 8
          ? "🛟 Sobreviveu — com arranhões"
          : "🚨 A ANPD chegou primeiro";
    const texto = estourou
      ? "A comunicação saiu fora das 72h úteis — o que era incidente virou infração com agravante. Repare no histórico ONDE o relógio queimou."
      : pontos >= 12
        ? "Comunicação no prazo, evidências preservadas, titulares protegidos e causa-raiz eliminada. É exatamente assim que um PRI vira realidade."
        : pontos >= 8
          ? "O essencial saiu, mas algumas escolhas custaram caro. Veja no histórico quais decisões você trocaria."
          : "Entre negações e adiamentos, a resposta veio tarde e incompleta. A boa notícia: aqui é simulação — na vida real, o PRI existe pra isso.";
    return (
      <div>
        <div className={`rounded-2xl border p-5 text-center ${estourou || pontos < 8 ? "border-rose-300 bg-rose-50" : "border-amber-300 bg-amber-50"}`}>
          <Trophy className="mx-auto h-10 w-10 text-amber-500" />
          <p className="mt-2 text-2xl font-bold text-gray-900">{titulo}</p>
          <p className="mt-1 text-sm text-gray-700">
            {pontos} de {maxPontos} pontos · relógio: {horas}h de {DIA_D_PRAZO_HORAS}h úteis
            {estourou ? " (ESTOURADO)" : ""}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{texto}</p>
        </div>

        <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Sua linha do tempo
        </h2>
        <ol className="space-y-2">
          {historico.map((h, i) => (
            <li
              key={i}
              className={`rounded-xl border p-3 text-sm ${
                h.pontos === 2
                  ? "border-green-200 bg-green-50"
                  : h.pontos === 1
                    ? "border-amber-200 bg-amber-50"
                    : "border-rose-200 bg-rose-50"
              }`}
            >
              <span className="font-semibold text-gray-900">{h.momento}:</span>{" "}
              <span className="text-gray-700">{h.rotulo}</span>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={reiniciar}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" /> Jogar de novo
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------- CENA
  return (
    <div>
      {/* Relógio da ANPD */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3">
        <div className="flex items-center justify-between text-xs font-medium text-gray-600">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Relógio da ANPD (72h úteis da ciência)
          </span>
          <span className={estourou ? "font-bold text-rose-600" : ""}>
            {horas}h consumidas{estourou ? " — ESTOUROU!" : ""}
          </span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${pctPrazo > 80 ? "bg-rose-500" : pctPrazo > 50 ? "bg-amber-400" : "bg-green-500"}`}
            style={{ width: `${pctPrazo}%` }}
          />
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs font-medium text-gray-500">
        <span>Decisão {idx + 1} de {total}</span>
        <span>{pontos} ponto{pontos === 1 ? "" : "s"}</span>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{cena.momento}</p>
        <p className="mt-2 rounded-lg border-l-4 border-l-indigo-300 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800">
          {cena.texto}
        </p>

        <div className="mt-4 space-y-3">
          {cena.opcoes.map((op) => {
            const sel = escolha?.id === op.id;
            let cls = "w-full rounded-xl border p-4 text-left text-sm transition min-h-[52px]";
            if (!escolha) cls += " border-gray-200 bg-white text-gray-800 hover:border-indigo-300 active:bg-indigo-50";
            else if (sel && op.pontos === 2) cls += " border-green-400 bg-green-50 text-green-900";
            else if (sel && op.pontos === 1) cls += " border-amber-400 bg-amber-50 text-amber-900";
            else if (sel) cls += " border-rose-400 bg-rose-50 text-rose-900";
            else cls += " border-gray-200 bg-white text-gray-400";
            return (
              <button key={op.id} type="button" disabled={!!escolha} onClick={() => escolher(op)} className={cls}>
                <span className="font-medium">{op.rotulo}</span>
                {sel && (
                  <span className="mt-2 block text-[13px] font-normal">
                    {op.reacao}
                    <span className="mt-1 block text-xs opacity-70">⏱ +{op.horas}h no relógio</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          disabled={!escolha}
          onClick={avancar}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {idx < total - 1 ? "Continuar" : "Ver o desfecho"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
