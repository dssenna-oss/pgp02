// 📜 "A LGPD, artigo por artigo" — hub PÚBLICO do mini app (QR nos slides).
// Mesmo contrato dos hubs /jogos e /montador: sem login, sem banco, embutível
// na apresentação, barra "⬅️ Voltar à apresentação" no rodapé. Os módulos são
// as apresentações HTML standalone de public/estrutura-lgpd/ (versões novas,
// com trilha de progresso própria), abertos via /lgpd/<slug>.

import Link from "next/link";
import type { Metadata } from "next";
import { MODULOS_LGPD } from "@/lib/estrutura-lgpd";
import { VoltarAhaSlides } from "@/components/voltar-ahaslides";

export const metadata: Metadata = {
  title: "A LGPD, artigo por artigo — curso prático de LGPD",
  description:
    "Do histórico ao simulado: a Lei 13.709/2018 apresentada em 8 módulos, em linguagem simples.",
};

function chipDoModulo(slug: string, intervalo: string) {
  if (slug === "historico") {
    return (
      <>
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-indigo-700">
          HISTÓRICO
        </span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-amber-700">
          NOVO
        </span>
      </>
    );
  }
  if (slug === "simulado-15-questoes") {
    return (
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-emerald-700">
        🏁 SIMULADO
      </span>
    );
  }
  return (
    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-indigo-700">
      {intervalo.toUpperCase()}
    </span>
  );
}

export default function HubLgpdPage() {
  return (
    <div className="pagina-embed min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Fundamentos da LGPD
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            📜 A LGPD, artigo por artigo
          </h1>
          <p className="mt-2 leading-relaxed text-gray-600">
            Do histórico ao simulado, em <strong>8 paradas</strong>. Toque numa
            etapa — dentro de cada módulo, a trilha mostra por onde você já
            passou. Dá pra ler agora ou voltar depois, no seu ritmo.
          </p>
        </header>

        <ol className="space-y-2.5">
          {MODULOS_LGPD.map((m, i) => (
            <li key={m.slug}>
              <Link
                href={`/lgpd/${m.slug}`}
                className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-extrabold text-white">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {chipDoModulo(m.slug, m.intervalo)}
                  </span>
                  <span className="mt-1 block text-sm font-bold leading-snug text-gray-900">
                    {m.titulo}
                  </span>
                </span>
                <span className="shrink-0 text-lg text-gray-300 transition group-hover:text-indigo-500">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <footer className="mt-6 text-center text-[11px] text-gray-400">
          Material didático em linguagem simples — o texto oficial é a Lei nº
          13.709/2018 (LGPD).
        </footer>
      </div>
      <VoltarAhaSlides />
    </div>
  );
}
