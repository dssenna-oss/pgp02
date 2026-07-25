"use client";

// Formato 5 — Matriz 3×3 (Análise de Riscos).
// Um cenário por vez: o participante TOCA a célula Probabilidade × Impacto.
// Severidade calculada com a MESMA régua do app (P×I: ≥6 ALTO · ≥3 MÉDIO ·
// senão BAIXO). Células sempre tingidas pela zona de severidade — o mapa de
// calor É parte do aprendizado. Sem servidor, sem banco.

import { useState } from "react";
import { ArrowRight, CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";
import type { MontadorDoc } from "@/lib/montador-docs";
import { severidadeMatriz } from "@/lib/montador-docs";

const ROTULO_P = ["Baixa", "Média", "Alta"]; // índice 0..2 → valor 1..3
const ROTULO_I = ["Baixo", "Médio", "Alto"];
const ROTULO_SEV = { ALTO: "ALTO", MEDIO: "MÉDIO", BAIXO: "BAIXO" } as const;

function corCelula(p: number, i: number, extra = ""): string {
  const sev = severidadeMatriz(p, i);
  const base =
    sev === "ALTO"
      ? "bg-rose-100 border-rose-200 text-rose-900"
      : sev === "MEDIO"
        ? "bg-amber-100 border-amber-200 text-amber-900"
        : "bg-green-100 border-green-200 text-green-900";
  return `${base} ${extra}`;
}

export function MatrizRunner({ doc }: { doc: MontadorDoc }) {
  const dados = doc.matriz;
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, { p: number; i: number }>>({});
  const [finalizado, setFinalizado] = useState(false);
  if (!dados) return null;

  const cenarios = dados.cenarios;
  const total = cenarios.length;
  const cen = cenarios[passo];
  const resposta = cen ? respostas[cen.id] : undefined;
  const jaRespondeu = !!resposta;

  function tocar(p: number, i: number) {
    if (!cen || jaRespondeu) return;
    setRespostas((prev) => ({ ...prev, [cen.id]: { p, i } }));
  }

  function avancar() {
    if (passo < total - 1) setPasso(passo + 1);
    else setFinalizado(true);
  }

  function reiniciar() {
    setPasso(0);
    setRespostas({});
    setFinalizado(false);
  }

  const exatas = cenarios.filter(
    (c) => respostas[c.id] && respostas[c.id].p === c.prob && respostas[c.id].i === c.impacto,
  ).length;
  const naBanda = cenarios.filter((c) => {
    const r = respostas[c.id];
    return r && severidadeMatriz(r.p, r.i) === severidadeMatriz(c.prob, c.impacto);
  }).length;

  // ---------------------------------------------------------------- PLACAR
  if (finalizado) {
    const perfeito = exatas === total;
    return (
      <div>
        <div
          className={`rounded-2xl border p-5 text-center ${
            perfeito ? "border-amber-300 bg-amber-50" : "border-indigo-200 bg-indigo-50"
          }`}
        >
          <Trophy className={`mx-auto h-10 w-10 ${perfeito ? "text-amber-500" : "text-indigo-500"}`} />
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {exatas} de {total} na célula exata
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {naBanda} de {total} acertaram a severidade.{" "}
            {perfeito ? "Leitura de risco calibrada! 🎯" : "Reveja os cenários abaixo."}
          </p>
        </div>

        <ol className="mt-6 space-y-3">
          {cenarios.map((c) => {
            const r = respostas[c.id]!;
            const exata = r.p === c.prob && r.i === c.impacto;
            const banda = severidadeMatriz(r.p, r.i) === severidadeMatriz(c.prob, c.impacto);
            return (
              <li
                key={c.id}
                className={`rounded-xl border p-4 ${
                  exata ? "border-green-200 bg-green-50" : banda ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"
                }`}
              >
                <div className="flex items-start gap-2">
                  {exata ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  ) : (
                    <XCircle className={`mt-0.5 h-5 w-5 shrink-0 ${banda ? "text-amber-600" : "text-rose-600"}`} />
                  )}
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-gray-900">{c.texto}</p>
                    <p className="mt-1 text-gray-700">
                      Gabarito: P {ROTULO_P[c.prob - 1]} × I {ROTULO_I[c.impacto - 1]} ={" "}
                      <strong>{ROTULO_SEV[severidadeMatriz(c.prob, c.impacto)]}</strong>
                      {!exata && (
                        <>
                          {" "}
                          · você marcou P {ROTULO_P[r.p - 1]} × I {ROTULO_I[r.i - 1]}
                          {banda && " (severidade certa!)"}
                        </>
                      )}
                    </p>
                    <p className="mt-1 text-gray-700">{c.porque}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={reiniciar}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" /> Refazer
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------- JOGO
  return (
    <div>
      <p className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
        {dados.instrucao}
      </p>

      <div className="mb-3 flex items-center justify-between text-xs font-medium text-gray-500">
        <span>
          Cenário {passo + 1} de {total}
        </span>
        <span>
          {exatas} exata{exatas === 1 ? "" : "s"} até aqui
        </span>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="rounded-lg border-l-4 border-l-indigo-300 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800">
          {cen.texto}
        </p>

        {/* Matriz: linhas = Probabilidade (Alta em cima) · colunas = Impacto */}
        <div className="mt-4">
          <div className="mb-1 grid grid-cols-[3.4rem_1fr_1fr_1fr] gap-1 text-center text-[11px] font-medium text-gray-500">
            <span />
            {ROTULO_I.map((r) => (
              <span key={r}>{r}</span>
            ))}
          </div>
          {[3, 2, 1].map((p) => (
            <div key={p} className="mb-1 grid grid-cols-[3.4rem_1fr_1fr_1fr] gap-1">
              <span className="flex items-center justify-end pr-1 text-[11px] font-medium text-gray-500">
                {ROTULO_P[p - 1]}
              </span>
              {[1, 2, 3].map((i) => {
                const escolhida = resposta && resposta.p === p && resposta.i === i;
                const ehGabarito = jaRespondeu && cen.prob === p && cen.impacto === i;
                let extra = "";
                if (ehGabarito) extra = "ring-2 ring-green-600 font-bold";
                else if (escolhida) extra = "ring-2 ring-rose-500";
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={jaRespondeu}
                    onClick={() => tocar(p, i)}
                    className={corCelula(
                      p,
                      i,
                      `min-h-[3.2rem] rounded-lg border text-xs font-medium transition ${extra} ${
                        jaRespondeu ? "" : "hover:ring-2 hover:ring-indigo-400 active:scale-95"
                      }`,
                    )}
                    aria-label={`Probabilidade ${ROTULO_P[p - 1]} × Impacto ${ROTULO_I[i - 1]}`}
                  >
                    {jaRespondeu ? (ehGabarito ? "✓" : escolhida ? "✗" : p * i) : p * i}
                  </button>
                );
              })}
            </div>
          ))}
          <p className="mt-1 text-center text-[11px] text-gray-400">
            ← Probabilidade · Impacto ↑ · número = P×I
          </p>
        </div>

        {/* Feedback do cenário */}
        {jaRespondeu && (
          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm">
            {(() => {
              const exata = resposta!.p === cen.prob && resposta!.i === cen.impacto;
              const banda =
                severidadeMatriz(resposta!.p, resposta!.i) === severidadeMatriz(cen.prob, cen.impacto);
              return (
                <>
                  <p className={`font-semibold ${exata ? "text-green-700" : banda ? "text-amber-700" : "text-rose-700"}`}>
                    {exata
                      ? "✅ Célula exata!"
                      : banda
                        ? "🟡 Severidade certa, célula vizinha."
                        : "❌ Fora da zona."}
                  </p>
                  <p className="mt-1 text-gray-700">
                    Gabarito: <strong>P {ROTULO_P[cen.prob - 1]} × I {ROTULO_I[cen.impacto - 1]}</strong> ={" "}
                    <strong>{ROTULO_SEV[severidadeMatriz(cen.prob, cen.impacto)]}</strong> (
                    {cen.prob}×{cen.impacto}={cen.prob * cen.impacto}). {cen.porque}
                  </p>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          disabled={!jaRespondeu}
          onClick={avancar}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {passo < total - 1 ? "Próximo cenário" : "Ver resultado"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
