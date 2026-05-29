import { Globe, Flag, Landmark, History } from "lucide-react";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import {
  MARCOS_MUNDO,
  MARCOS_BRASIL,
  MARCOS_COMPLEMENTARES,
  type MarcoHistorico,
} from "@/lib/historico-lgpd";

export const dynamic = "force-dynamic";

function LinhaDoTempo({
  marcos,
  cor,
}: {
  marcos: MarcoHistorico[];
  cor: { linha: string; ponto: string; destaque: string };
}) {
  return (
    <ol className="relative ml-3 pl-6">
      <span className={`absolute left-0 top-0 h-full w-0.5 -translate-x-[1px] ${cor.linha}`} />
      {marcos.map((m, idx) => (
        <li key={`${m.ano}-${idx}`} className="relative mb-5 last:mb-0">
          <span
            className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
              m.destaque ? cor.destaque : cor.ponto
            }`}
          />
          <div
            className={`rounded-lg border bg-white p-4 shadow-sm ${
              m.destaque ? "border-l-4 border-l-amber-400" : ""
            }`}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-base font-extrabold text-gray-900">{m.ano}</span>
              <span className="text-sm font-bold text-gray-800">{m.titulo}</span>
              {m.local && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
                  {m.local}
                </span>
              )}
              {m.destaque && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
                  ⭐ marco central
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{m.descricao}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function HistoricoLgpdPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <History className="h-3.5 w-3.5" /> Slides das fases
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Histórico da LGPD</h1>
      <p className="mt-1 max-w-3xl text-sm text-gray-600">
        Antes de mergulhar na lei, vale entender de onde ela veio. A ideia de proteger dados
        pessoais não nasceu no Brasil nem em 2018 — é uma construção de décadas, no mundo todo.
        Este é o caminho até a LGPD, em linguagem simples.
      </p>

      <div className="mt-4">
        <AdminPreviewBanner />
      </div>

      {/* Mundo */}
      <section className="mt-7">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
          <Globe className="h-5 w-5 text-sky-600" /> No mundo: como a privacidade virou direito
        </h2>
        <LinhaDoTempo
          marcos={MARCOS_MUNDO}
          cor={{ linha: "bg-sky-200", ponto: "bg-sky-500", destaque: "bg-amber-400" }}
        />
      </section>

      {/* Brasil — principal */}
      <section className="mt-9">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
          <Flag className="h-5 w-5 text-emerald-600" /> No Brasil: o caminho até a LGPD
        </h2>
        <LinhaDoTempo
          marcos={MARCOS_BRASIL}
          cor={{ linha: "bg-emerald-200", ponto: "bg-emerald-500", destaque: "bg-amber-400" }}
        />
      </section>

      {/* Complementares — setor público */}
      <section className="mt-9">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-gray-900">
          <Landmark className="h-5 w-5 text-indigo-600" /> Leis que conversam com a LGPD
        </h2>
        <p className="mb-3 max-w-3xl text-sm text-gray-600">
          Especialmente importantes pra quem trabalha no serviço público — a LGPD não vive sozinha.
        </p>
        <LinhaDoTempo
          marcos={MARCOS_COMPLEMENTARES}
          cor={{ linha: "bg-indigo-200", ponto: "bg-indigo-500", destaque: "bg-amber-400" }}
        />
      </section>

      <div className="mt-9 rounded-xl border-l-4 border-l-brand-500 bg-brand-50 p-5">
        <h3 className="text-sm font-bold text-brand-800">Em uma frase</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-700">
          A LGPD não caiu do céu: ela é o ponto de chegada de décadas de evolução — da Declaração
          dos Direitos Humanos (1948) ao GDPR europeu (2018), e da nossa Constituição (1988) até a
          proteção de dados virar direito fundamental (2022). Agora que você sabe de onde ela vem,
          fica muito mais fácil entender o que ela pede.
        </p>
      </div>
    </div>
  );
}
