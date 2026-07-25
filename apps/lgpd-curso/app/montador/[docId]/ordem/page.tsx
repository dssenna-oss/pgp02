// Formato 4 (ordenar as seções) — PÚBLICO/standalone, embutível em apresentação.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMontadorDoc } from "@/lib/montador-docs";
import { MontadorAtividade } from "@/components/montador-atividade";

export default function OrdemPublicoPage({ params }: { params: { docId: string } }) {
  const doc = getMontadorDoc(params.docId);
  if (!doc || !doc.disponivel || !doc.ordenar) notFound();
  return (
    <div className="pagina-embed min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/montador"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Todos os documentos
        </Link>
        <MontadorAtividade doc={doc} atividade="ordem" base="/montador" />
        <footer className="mt-8 text-center text-[11px] text-gray-400">
          Atividade de simulação — nenhum dado é coletado ou armazenado.
        </footer>
      </div>
    </div>
  );
}
