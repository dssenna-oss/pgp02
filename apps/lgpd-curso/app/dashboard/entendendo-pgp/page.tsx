import Link from "next/link";
import { Mic2, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

// Infográfico "Guia Prático do PGP" (NotebookLM) — substitui o conteúdo
// textual antigo (amber box + base legal + tópicos), que agora vive todo na
// imagem. Estático em public/. Pra atualizar: trocar o arquivo.
const IMG = "/entendendo-pgp-guia-pgp.png";

export default function EntendendoPgpPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard"
        className="esconder-em-projecao mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar pra Início
      </Link>

      <header className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700">
          <Mic2 className="h-3.5 w-3.5" />
          Apresentado pelo facilitador
        </div>
        <h1 className="text-2xl font-bold tracking-tight">📚 Entendendo o PGP</h1>
        <p className="mt-1 text-sm text-gray-500">
          Conceitos e fundamentos do Programa de Governança em Privacidade
        </p>
      </header>

      {/* Infográfico — toque pra abrir em tela cheia (denso; no celular dá
          pra dar zoom na aba nova). */}
      <a href={IMG} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMG}
          alt="Guia Prático do Programa de Governança em Privacidade (PGP) — infográfico com as 8 etapas, base legal e riscos de não implementar"
          className="h-auto w-full rounded-lg border border-gray-200 shadow-sm"
        />
      </a>
      <p className="esconder-em-projecao mt-2 text-center text-xs text-gray-400">
        Toque na imagem pra abrir em tela cheia.
      </p>
    </div>
  );
}
