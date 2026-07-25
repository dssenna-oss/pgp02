// 🔗 Ligue os Pares — página pública do jogo (embutível).

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JogoPares } from "@/components/jogo-pares";

export default function ParesPage() {
  return (
    <div className="pagina-embed min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/jogos" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Todos os jogos
        </Link>
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">🔗 Ligue os Pares</h1>
          <p className="mt-2 text-gray-600 leading-relaxed">
            Três baralhos de fundamentos: cenário ↔ base legal, dado ↔
            categoria e quem é quem na LGPD. Cada par certo trava — e ensina.
          </p>
        </header>
        <JogoPares />
        <footer className="mt-8 text-center text-[11px] text-gray-400">
          Jogo de simulação — nenhum dado é coletado ou armazenado.
        </footer>
      </div>
    </div>
  );
}
