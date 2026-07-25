// ⚡ Sprint 60 segundos — página pública do jogo (embutível).

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JogoSprint } from "@/components/jogo-sprint";

export default function SprintPage() {
  return (
    <div className="pagina-embed min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/jogos" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Todos os jogos
        </Link>
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">⚡ Sprint 60 segundos</h1>
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
