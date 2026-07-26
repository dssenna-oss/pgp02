// Página de UM modelo do Pacote — visão compartilhada entre o contexto
// PÚBLICO (/modelos/<slug>, QR da apresentação, com barra Voltar) e o
// DASHBOARD (/dashboard/modelos/<slug>, celular logado / hrefAluno do telão).
// Server component; interação (copiar) fica no CopiarBtn (client).

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ModeloPacote } from "@/lib/modelos-pacote";
import { VoltarAhaSlides } from "@/components/voltar-ahaslides";
import { MdModelo, mdParaTextoPuro } from "./md-modelo";
import { CopiarBtn } from "./copiar-btn";

export function ModeloView({
  modelo,
  base,
}: {
  modelo: ModeloPacote;
  base: "/modelos" | "/dashboard/modelos";
}) {
  const publico = base === "/modelos";
  const numeroFmt = String(modelo.numero).padStart(2, "0");

  return (
    <div className={publico ? "pagina-embed min-h-screen bg-gray-50 px-4 py-5" : "px-1 py-1"}>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={base}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900"
          >
            <ArrowLeft className="h-4 w-4" /> Todos os modelos
          </Link>
          <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-700">
            {modelo.fase}
          </span>
        </div>

        <header className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
            Modelo {numeroFmt} · Grupo {modelo.grupo} — {modelo.grupoNome}
          </p>
          <h1 className="mt-1 text-xl font-bold leading-snug text-gray-900 md:text-2xl">
            {modelo.titulo}
          </h1>
        </header>

        {/* Quando usar */}
        <section className="mt-4 rounded-2xl border-l-4 border-l-sky-400 border border-sky-200 bg-sky-50 p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-sky-800">ℹ️ Quando usar</h2>
          <div className="mt-1.5 text-sm leading-relaxed text-gray-800">
            <MdModelo md={modelo.quandoUsar} />
          </div>
        </section>

        {/* Template */}
        <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-600">
              📄 O modelo (edite por cima)
            </h2>
            <CopiarBtn texto={mdParaTextoPuro(modelo.template)} rotulo="Copiar modelo" />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Os campos <span className="rounded bg-amber-100 px-1 font-medium text-amber-900">[ENTRE COLCHETES]</span> são
            o que você troca pelos dados da sua instituição.
          </p>
          <div className="mt-3 border-t border-gray-100 pt-3">
            <MdModelo md={modelo.template} />
          </div>
        </section>

        {/* Exemplo preenchido */}
        <details className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-emerald-800">
            💡 Exemplo preenchido — veja como fica
          </summary>
          <div className="border-t border-emerald-100 px-4 py-3">
            <MdModelo md={modelo.exemplo} />
          </div>
        </details>

        {/* Versão comentada (Kit de Minutas) */}
        {modelo.minuta && (
          <details className="mt-4 rounded-2xl border border-amber-300 bg-amber-50/70">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-amber-900">
              📝 Versão comentada — Kit de Minutas do facilitador
            </summary>
            <div className="border-t border-amber-200 px-4 py-3">
              <p className="text-sm font-bold text-gray-900">{modelo.minuta.titulo}</p>
              <p className="mt-0.5 text-xs italic text-gray-600">{modelo.minuta.natureza}</p>
              <p className="mt-0.5 text-[11px] text-gray-400">{modelo.minuta.origem}</p>
              <div className="mt-3">
                <MdModelo md={modelo.minuta.md} />
              </div>
              <div className="mt-3">
                <CopiarBtn texto={mdParaTextoPuro(modelo.minuta.md)} rotulo="Copiar minuta" />
              </div>
            </div>
          </details>
        )}

        {/* Rodapé: pacote oficial + pratique */}
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
          <p>
            📦 Pra editar no computador: este é o <strong>Modelo {numeroFmt}</strong> do Pacote
            oficial —{" "}
            <a href="/pacote-modelos-pgp.docx" className="font-semibold text-teal-800 underline">
              Word
            </a>{" "}
            ·{" "}
            <a
              href="/pacote-modelos-pgp.pdf"
              target="_blank"
              rel="noopener"
              className="font-semibold text-teal-800 underline"
            >
              PDF
            </a>
          </p>
          {modelo.montadorDocId && (
            <p className="mt-2 border-t border-gray-100 pt-2">
              ✍️ Quer treinar as decisões deste documento?{" "}
              <a
                href={`/montador/${modelo.montadorDocId}`}
                className="font-semibold text-teal-800 underline"
              >
                Pratique no montador
              </a>{" "}
              ·{" "}
              <a
                href={`/montador/${modelo.montadorDocId}/saiba-mais`}
                className="font-semibold text-teal-800 underline"
              >
                📖 Saiba mais
              </a>
            </p>
          )}
        </section>

        <footer className="mt-6 text-center text-[11px] text-gray-400">
          Modelo didático do curso — adapte ao contexto e às normas da sua instituição.
        </footer>
      </div>
      {publico && <VoltarAhaSlides />}
    </div>
  );
}
