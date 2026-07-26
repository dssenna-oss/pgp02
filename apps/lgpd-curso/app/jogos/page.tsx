// 🎮 Jogos da LGPD — hub PÚBLICO/standalone (sem login, sem turma, sem banco).
// Mesmo contrato do /montador: embutível em apresentação, um link por slide.

import Link from "next/link";
import { Gamepad2, ChevronRight } from "lucide-react";
import { JOGOS } from "@/lib/jogos";

export default function JogosHubPage() {
  return (
    <div className="pagina-embed min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/jogos-capas/hub.webp"
          alt=""
          className="mb-5 h-36 w-full rounded-2xl border border-indigo-100 object-cover"
        />

        <header className="mb-6">
          <div className="flex items-center gap-2.5">
            <Gamepad2 className="h-7 w-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Jogos da LGPD</h1>
          </div>
          <p className="mt-2 text-gray-600 leading-relaxed">
            Cinco jogos rápidos pra treinar a LGPD de verdade: viva uma crise,
            atenda um titular bravo, cace vazamentos, ligue os conceitos e corra
            contra o relógio. Direto do celular, no seu ritmo.
          </p>
        </header>

        <ul className="space-y-3">
          {JOGOS.map((j) => (
            <li key={j.id}>
              <Link
                href={`/jogos/${j.id}`}
                className="block overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-indigo-300 hover:shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/jogos-capas/${j.id}.webp`} alt="" className="h-24 w-full object-cover" />
                <div className="flex items-center gap-3 p-4">
                  <span className="text-2xl leading-none">{j.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="flex flex-wrap items-center gap-2 font-semibold text-gray-900">
                      {j.titulo}
                      <span className="inline-flex shrink-0 items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        {j.fase}
                      </span>
                    </h2>
                    <p className="text-sm text-gray-500">{j.subtitulo}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          📄 Quer montar os documentos da LGPD decidindo cláusula por cláusula?
          Visite o <Link href="/montador" className="font-semibold text-indigo-700 hover:underline">Monte seu documento</Link>.
        </p>

        <footer className="mt-8 text-center text-[11px] text-gray-400">
          Jogos de simulação — nenhum dado é coletado ou armazenado.
        </footer>
      </div>
    </div>
  );
}
