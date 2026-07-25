// 💬 Chat do Titular — página pública do jogo (embutível).

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JogoChatTitular } from "@/components/jogo-chat-titular";

export default function ChatTitularPage() {
  return (
    <div className="pagina-embed min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/jogos" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Todos os jogos
        </Link>
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">💬 Chat do Titular</h1>
          <p className="mt-2 text-gray-600 leading-relaxed">
            A Dona Marta chegou FERVENDO no chat da prefeitura. Escolha cada
            resposta e veja a temperatura da conversa — atender titular é
            técnica E jeito.
          </p>
        </header>
        <JogoChatTitular />
        <footer className="mt-8 text-center text-[11px] text-gray-400">
          Jogo de simulação — nenhum dado é coletado ou armazenado.
        </footer>
      </div>
    </div>
  );
}
