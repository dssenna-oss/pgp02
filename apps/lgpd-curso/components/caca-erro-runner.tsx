"use client";

// Formato 3 — Caça ao erro.
// Documento "pronto" com erros plantados: toca nas seções suspeitas (🚩) e
// confere. Correção separa: achados, erros que escaparam e alarmes falsos.
// Sem servidor, sem banco.

import { useState } from "react";
import { CheckCircle2, XCircle, Flag, RotateCcw, SearchCheck } from "lucide-react";
import type { MontadorDoc } from "@/lib/montador-docs";

export function CacaErroRunner({ doc }: { doc: MontadorDoc }) {
  const [marcadas, setMarcadas] = useState<Set<number>>(new Set());
  const [conferido, setConferido] = useState(false);

  if (!doc.cacaErro) return null; // formato não disponível neste documento
  const { contexto, instrucao } = doc.cacaErro;
  const secoes = doc.cacaErro.secoes;
  const totalErros = secoes.filter((s) => s.erro).length;

  function alternar(numero: number) {
    if (conferido) return;
    setMarcadas((prev) => {
      const novo = new Set(prev);
      if (novo.has(numero)) novo.delete(numero);
      else novo.add(numero);
      return novo;
    });
  }

  function reiniciar() {
    setMarcadas(new Set());
    setConferido(false);
  }

  const achados = secoes.filter((s) => s.erro && marcadas.has(s.numero)).length;
  const alarmesFalsos = secoes.filter((s) => !s.erro && marcadas.has(s.numero)).length;

  return (
    <div>
      <p className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {contexto}
      </p>
      <p className="mb-4 text-sm text-gray-600">{instrucao}</p>

      <ol className="space-y-3">
        {secoes.map((s) => {
          const marcada = marcadas.has(s.numero);
          let cls = "w-full rounded-xl border p-4 text-left transition";
          let selo: React.ReactNode = null;
          let extra: React.ReactNode = null;

          if (!conferido) {
            cls += marcada
              ? " border-rose-400 bg-rose-50"
              : " border-gray-200 bg-white hover:border-rose-200";
          } else if (s.erro && marcada) {
            cls += " border-green-400 bg-green-50";
            selo = <Selo cor="text-green-700" icone={<CheckCircle2 className="h-4 w-4" />} txt="Erro encontrado!" />;
            extra = <Nota texto={s.erro.porque} artigo={s.erro.artigo} />;
          } else if (s.erro && !marcada) {
            cls += " border-rose-400 bg-rose-50";
            selo = <Selo cor="text-rose-700" icone={<XCircle className="h-4 w-4" />} txt="Este erro escapou…" />;
            extra = <Nota texto={s.erro.porque} artigo={s.erro.artigo} />;
          } else if (!s.erro && marcada) {
            cls += " border-amber-400 bg-amber-50";
            selo = <Selo cor="text-amber-700" icone={<Flag className="h-4 w-4" />} txt="Alarme falso — esta está certa." />;
            extra = s.notaLimpa ? <Nota texto={s.notaLimpa} /> : null;
          } else {
            cls += " border-gray-200 bg-white";
            selo = <Selo cor="text-gray-400" icone={<CheckCircle2 className="h-4 w-4" />} txt="Certa." />;
          }

          return (
            <li key={s.numero}>
              <button type="button" onClick={() => alternar(s.numero)} disabled={conferido} className={cls}>
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">
                      {s.numero}. {s.titulo}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-gray-700">{s.texto}</span>
                    {conferido && (
                      <span className="mt-2 block">
                        {selo}
                        {extra}
                      </span>
                    )}
                  </span>
                  {!conferido && (
                    <span
                      className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${
                        marcada ? "border-rose-400 bg-rose-100 text-rose-700" : "border-gray-300 text-gray-400"
                      }`}
                    >
                      {marcada ? "🚩 suspeita" : "marcar"}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {conferido && (
        <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-center">
          <p className="text-2xl font-bold text-gray-900">
            Você achou {achados} de {totalErros} erros
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {alarmesFalsos > 0 && `${alarmesFalsos} alarme(s) falso(s). `}
            {achados === totalErros && alarmesFalsos === 0
              ? "Faro de DPO — caça perfeita! 🕵️"
              : "As explicações estão em cada seção acima."}
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
            <SearchCheck className="h-5 w-5" /> Conferir ({marcadas.size} marcada{marcadas.size === 1 ? "" : "s"})
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

function Selo({ cor, icone, txt }: { cor: string; icone: React.ReactNode; txt: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${cor}`}>
      {icone} {txt}
    </span>
  );
}

function Nota({ texto, artigo }: { texto: string; artigo?: string }) {
  return (
    <span className="mt-1 block text-[13px] text-gray-700">
      {texto}
      {artigo && <span className="mt-0.5 block text-xs text-gray-500">📖 {artigo}</span>}
    </span>
  );
}
