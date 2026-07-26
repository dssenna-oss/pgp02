// 📦 Pacote de Modelos — hub PÚBLICO do mini app (QR nos slides).
// Mesmo contrato dos hubs /lgpd, /jogos e /montador: sem login, sem banco,
// embutível na apresentação, barra "⬅️ Voltar à apresentação" no rodapé.
// Conteúdo = os 21 modelos do Pacote oficial (lib/modelos-pacote.ts), com a
// "Versão comentada" do Kit de Minutas nos que têm par.

import type { Metadata } from "next";
import { ListaModelos } from "@/components/modelos/lista-modelos";
import { VoltarAhaSlides } from "@/components/voltar-ahaslides";

export const metadata: Metadata = {
  title: "Pacote de Modelos do PGP — 21 modelos prontos pra adaptar",
  description:
    "Ato de designação, portaria do comitê, aviso de privacidade, PRI, RIPD e as fichas das 7 Fases — em linguagem simples, com exemplo preenchido.",
};

export default function HubModelosPage() {
  return (
    <div className="pagina-embed min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
            Biblioteca do PGP
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">📦 Pacote de Modelos</h1>
          <p className="mt-2 leading-relaxed text-gray-600">
            Os <strong>21 modelos</strong> do curso, prontos pra adaptar: toque num modelo pra ler
            no celular, <strong>copiar o texto</strong> e ver o exemplo preenchido. Os marcados com{" "}
            <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-700">
              📝 COMENTADA
            </span>{" "}
            trazem também a minuta comentada do facilitador.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Pra editar no computador, baixe o Pacote oficial:{" "}
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
        </header>

        <ListaModelos base="/modelos" />

        <footer className="mt-6 text-center text-[11px] text-gray-400">
          Modelos didáticos do curso prático de LGPD — adapte ao contexto e às normas da sua
          instituição.
        </footer>
      </div>
      <VoltarAhaSlides />
    </div>
  );
}
