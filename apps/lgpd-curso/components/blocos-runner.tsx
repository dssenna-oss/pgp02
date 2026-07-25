"use client";

// Formato 2 — Montar por blocos (quebra-cabeça de cláusulas).
// Banco de cláusulas com intrusas: toca pra selecionar as que ENTRAM no
// documento; a correção pontua inclusões certas, intrusas aceitas e
// cláusulas necessárias esquecidas. Sem servidor, sem banco.

import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, RotateCcw, ClipboardCheck } from "lucide-react";
import type { MontadorDoc } from "@/lib/montador-docs";

export function BlocosRunner({ doc }: { doc: MontadorDoc }) {
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [conferido, setConferido] = useState(false);

  if (!doc.blocos) return null; // formato não disponível neste documento
  const cartas = doc.blocos.cartas;

  function alternar(id: string) {
    if (conferido) return;
    setSelecionadas((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function reiniciar() {
    setSelecionadas(new Set());
    setConferido(false);
  }

  const acertos = cartas.filter(
    (c) => (c.pertence && selecionadas.has(c.id)) || (!c.pertence && !selecionadas.has(c.id)),
  ).length;

  return (
    <div>
      <p className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
        {doc.blocos.instrucao}
      </p>

      <ul className="space-y-3">
        {cartas.map((c) => {
          const sel = selecionadas.has(c.id);
          let cls = "w-full rounded-xl border p-4 text-left text-sm transition";
          let icone: React.ReactNode = null;
          let extra: React.ReactNode = null;

          if (!conferido) {
            cls += sel
              ? " border-indigo-500 bg-indigo-50 text-indigo-900"
              : " border-gray-200 bg-white text-gray-800 hover:border-indigo-300";
          } else if (c.pertence && sel) {
            cls += " border-green-400 bg-green-50 text-green-900";
            icone = <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />;
            extra = <Explica rotulo="Entrou, e devia entrar." c={c} />;
          } else if (c.pertence && !sel) {
            cls += " border-amber-400 bg-amber-50 text-amber-900";
            icone = <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />;
            extra = <Explica rotulo="Faltou! Esta cláusula era necessária." c={c} />;
          } else if (!c.pertence && sel) {
            cls += " border-rose-400 bg-rose-50 text-rose-900";
            icone = <XCircle className="h-5 w-5 shrink-0 text-rose-600" />;
            extra = <Explica rotulo="Intrusa — não devia entrar." c={c} />;
          } else {
            cls += " border-green-200 bg-white text-gray-500";
            icone = <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />;
            extra = <Explica rotulo="Bem deixada de fora." c={c} />;
          }

          return (
            <li key={c.id}>
              <button type="button" onClick={() => alternar(c.id)} disabled={conferido} className={cls}>
                <span className="flex items-start gap-2">
                  {conferido ? (
                    icone
                  ) : (
                    <span
                      className={`mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 ${
                        sel ? "border-indigo-500 bg-indigo-500" : "border-gray-300 bg-white"
                      }`}
                      aria-hidden
                    >
                      {sel && <span className="block text-center text-xs leading-4 text-white">✓</span>}
                    </span>
                  )}
                  <span>
                    <span className="font-medium">{c.texto}</span>
                    {extra}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {conferido && (
        <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {acertos} de {cartas.length} decisões corretas
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {acertos === cartas.length
              ? "Documento enxuto e completo — nenhuma intrusa passou! 🎯"
              : "Reveja acima: âmbar = faltou · vermelho = intrusa aceita."}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {!conferido ? (
          <button
            type="button"
            onClick={() => setConferido(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            <ClipboardCheck className="h-5 w-5" /> Conferir
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

function Explica({ rotulo, c }: { rotulo: string; c: { porque: string; artigo?: string } }) {
  return (
    <span className="mt-1.5 block text-[13px] font-normal">
      <strong>{rotulo}</strong> {c.porque}
      {c.artigo && <span className="mt-0.5 block text-xs opacity-70">📖 {c.artigo}</span>}
    </span>
  );
}
