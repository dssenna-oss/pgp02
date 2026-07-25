// "Saiba mais" — a teoria do documento, antes da prática.
// Server component (conteúdo estático). Fecha com "Agora pratique →" levando
// às atividades daquele documento.

import Link from "next/link";
import { BookOpen, Wrench, AlertTriangle, Scale, Target, ArrowRight } from "lucide-react";
import type { MontadorDoc } from "@/lib/montador-docs";
import { modeloPronto } from "@/lib/montador-docs";
import { getSaibaMais, MODELO_NO_PACOTE } from "@/lib/montador-saiba-mais";
import { atividadesDoDoc, hrefAtividade } from "@/components/montador-atividade";
import { ModeloProntoBox } from "@/components/modelo-pronto-box";

export function SaibaMaisView({ doc, base }: { doc: MontadorDoc; base: string }) {
  const sm = getSaibaMais(doc.id);
  if (!sm) return null;
  const atividades = atividadesDoDoc(doc);

  return (
    <div className="space-y-5">
      {/* 1 · O que é */}
      <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-indigo-700">
          <BookOpen className="h-4 w-4" /> O que é
        </h2>
        <p className="mt-2 leading-relaxed text-gray-800">{sm.oQueE}</p>
      </section>

      {/* 2 · Quando e quem usa */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600">
          <Target className="h-4 w-4 text-indigo-500" /> Quando e quem usa
        </h2>
        <p className="mt-2 leading-relaxed text-gray-700">{sm.quandoQuem}</p>
      </section>

      {/* 3 · Como construir */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600">
          <Wrench className="h-4 w-4 text-indigo-500" /> Como construir
        </h2>
        <ol className="mt-3 space-y-2.5">
          {sm.comoConstruir.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-gray-700">
                <strong className="text-gray-900">{p.titulo}.</strong> {p.texto}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 4 · Erros que derrubam */}
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-rose-700">
          <AlertTriangle className="h-4 w-4" /> Erros que derrubam
        </h2>
        <ul className="mt-3 space-y-2">
          {sm.errosComuns.map((e, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-gray-800">
              <span className="shrink-0 text-rose-500">✗</span>
              <span>{e}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 5 · Base legal */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600">
          <Scale className="h-4 w-4 text-indigo-500" /> Base legal
        </h2>
        <ul className="mt-3 space-y-2">
          {sm.baseLegal.map((b, i) => (
            <li key={i} className="text-sm leading-relaxed text-gray-700">
              <span className="mr-1.5 inline-block rounded-md bg-indigo-100 px-1.5 py-0.5 text-xs font-semibold text-indigo-800">
                {b.ref}
              </span>
              {b.oque}
            </li>
          ))}
        </ul>
      </section>

      {sm.dica && (
        <p className="rounded-xl border-l-4 border-l-amber-400 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          💡 {sm.dica}
        </p>
      )}

      {/* 6 · Modelo pronto (gabarito) + Pacote oficial */}
      <ModeloProntoBox md={modeloPronto(doc)} modeloNoPacote={MODELO_NO_PACOTE[doc.id]} />

      {/* Agora pratique → */}
      {atividades.length > 0 && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-indigo-700">
            Agora pratique
          </h2>
          <p className="mt-1 text-sm text-gray-700">
            Leu a teoria? Coloque em prática — as ciladas acima aparecem nas atividades.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {atividades.map((a) => (
              <Link
                key={a.slug || "montar"}
                href={hrefAtividade(base, doc.id, a.slug)}
                className="flex items-center justify-between gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-sm font-medium text-indigo-800 transition hover:border-indigo-400 hover:bg-indigo-100"
              >
                <span>{a.emoji} {a.rotulo}</span>
                <ArrowRight className="h-4 w-4 shrink-0 opacity-60" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
