// "Saiba mais" — versão LOGADA (Modo Cards). A teoria antes da prática.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getMontadorDoc } from "@/lib/montador-docs";
import { getSaibaMais } from "@/lib/montador-saiba-mais";
import { SaibaMaisView } from "@/components/saiba-mais-view";
import { FaseChip } from "@/components/montador-atividade";

export const dynamic = "force-dynamic";

export default function SaibaMaisDashboardPage({ params }: { params: { docId: string } }) {
  const doc = getMontadorDoc(params.docId);
  if (!doc || !doc.disponivel || !getSaibaMais(params.docId)) notFound();
  return (
    <div className="max-w-3xl mx-auto p-6">
      <AdminPreviewBanner />
      <Link
        href="/dashboard/montador"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Todos os documentos
      </Link>
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">📖 Saiba mais</p>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold text-gray-900">
          {doc.emoji} {doc.titulo} <FaseChip fase={doc.fase} />
        </h1>
        <p className="mt-1 text-sm text-gray-500">{doc.subtitulo}</p>
      </header>
      <SaibaMaisView doc={doc} base="/dashboard/montador" />
    </div>
  );
}
