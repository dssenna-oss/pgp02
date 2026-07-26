// ⚡ Sprint 60 segundos — página pública do jogo (embutível).

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JogoSprint } from "@/components/jogo-sprint";
import { getJogo } from "@/lib/jogos";

export default function SprintPage() {
  const jogo = getJogo("sprint")!;
  return (
    <div className="pagina-embed min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/jogos" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Todos os jogos
        </Link>
        <header className="mb-5">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-gray-900">
            ⚡ Sprint 60 segundos
            <span className="inline-flex shrink-0 items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              {jogo.fase}
            </span>
          </h1>
          <p className="mt-2 text-gray-600 leading-relaxed">
            Sensível ou comum? 15 dados, 60 segundos, dois botões. O rol do
            art. 5º, II nunca mais sai da sua cabeça.
          </p>
        </header>
        <JogoSprint />
        <footer className="mt-8 text-center text-[11px] text-gray-400">
          Jogo de simulação — nenhum dado é coletado ou armazenado.
        </footer>
      </div>
    </div>
  );
}
