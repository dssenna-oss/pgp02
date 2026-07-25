// "Saiba mais" — PÚBLICO/standalone (embutível). A teoria antes da prática.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMontadorDoc } from "@/lib/montador-docs";
import { getSaibaMais } from "@/lib/montador-saiba-mais";
import { SaibaMaisView } from "@/components/saiba-mais-view";

export default function SaibaMaisPublicoPage({ params }: { params: { docId: string } }) {
  const doc = getMontadorDoc(params.docId);
  if (!doc || !doc.disponivel || !getSaibaMais(params.docId)) notFound();
  return (
    <div className="pagina-embed min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/montador"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Todos os documentos
        </Link>
        <header className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">📖 Saiba mais</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            {doc.emoji} {doc.titulo}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{doc.subtitulo}</p>
        </header>
        <SaibaMaisView doc={doc} base="/montador" />
        <footer className="mt-8 text-center text-[11px] text-gray-400">
          Conteúdo educativo — nenhum dado é coletado ou armazenado.
        </footer>
      </div>
    </div>
  );
}
