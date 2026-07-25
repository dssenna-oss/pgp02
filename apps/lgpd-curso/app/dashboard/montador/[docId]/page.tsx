// Montador Guiado — tela de UM documento (server component fino).
// Carrega o doc do catálogo e delega ao runner client. Sem banco.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getMontadorDoc } from "@/lib/montador-docs";
import { MontadorRunner } from "@/components/montador-runner";

export const dynamic = "force-dynamic";

export default function MontadorDocPage({ params }: { params: { docId: string } }) {
  const doc = getMontadorDoc(params.docId);
  if (!doc || !doc.disponivel) notFound();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <AdminPreviewBanner />

      <Link
        href="/dashboard/montador"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Todos os documentos
      </Link>

      <header className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">
          {doc.emoji} {doc.titulo}
        </h1>
        <p className="mt-2 text-gray-600 leading-relaxed">{doc.intro}</p>
      </header>

      <MontadorRunner doc={doc} />
    </div>
  );
}
