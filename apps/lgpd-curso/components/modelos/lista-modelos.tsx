// Lista do hub do Pacote de Modelos — os 21 em 3 grupos, na ordem oficial.
// Compartilhada entre o hub público (/modelos) e o do dashboard.

import Link from "next/link";
import { GRUPOS_PACOTE, MODELOS_PACOTE } from "@/lib/modelos-pacote";

export function ListaModelos({ base }: { base: "/modelos" | "/dashboard/modelos" }) {
  return (
    <div className="space-y-6">
      {GRUPOS_PACOTE.map((g) => (
        <section key={g.numero}>
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-teal-800">
            <span>{g.emoji}</span> Grupo {g.numero} — {g.nome}
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{g.resumo}</p>
          <ol className="mt-2.5 space-y-2">
            {MODELOS_PACOTE.filter((m) => m.grupo === g.numero).map((m) => (
              <li key={m.slug}>
                <Link
                  href={`${base}/${m.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-teal-300 hover:shadow-md"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-[11px] font-extrabold text-white">
                    {String(m.numero).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-teal-700">
                        {m.fase.toUpperCase()}
                      </span>
                      {m.minuta && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-amber-700">
                          📝 COMENTADA
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-sm font-bold leading-snug text-gray-900">
                      {m.titulo}
                    </span>
                  </span>
                  <span className="shrink-0 text-lg text-gray-300 transition group-hover:text-teal-600">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
