// Formato 4 (ordenar as seções) — versão LOGADA (Modo Cards).

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getMontadorDoc } from "@/lib/montador-docs";
import { MontadorAtividade } from "@/components/montador-atividade";

export const dynamic = "force-dynamic";

export default function OrdemDashboardPage({ params }: { params: { docId: string } }) {
  const doc = getMontadorDoc(params.docId);
  if (!doc || !doc.disponivel || !doc.ordenar) notFound();
  return (
    <div className="max-w-3xl mx-auto p-6">
      <AdminPreviewBanner />
      <Link
        href="/dashboard/montador"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Todos os documentos
      </Link>
      <MontadorAtividade doc={doc} atividade="ordem" base="/dashboard/montador" />
    </div>
  );
}
