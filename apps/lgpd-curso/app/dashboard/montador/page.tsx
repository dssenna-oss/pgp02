// Montador Guiado de Documentos — hub (celular de cada participante).
// Diferente das "Atividades ao vivo" (grupo decide, DPO registra), aqui é
// INDIVIDUAL: cada participante monta o próprio documento no próprio celular.
// Nada é gravado no banco — o valor é a simulação + o placar pedagógico.

import Link from "next/link";
import { ArrowLeft, FileStack, ChevronRight } from "lucide-react";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { MONTADOR_DOCS } from "@/lib/montador-docs";

export const dynamic = "force-dynamic";

export default function MontadorHubPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <AdminPreviewBanner />

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <header className="mb-6">
        <div className="flex items-center gap-2.5">
          <FileStack className="h-7 w-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Monte seu documento</h1>
        </div>
        <p className="mt-2 text-gray-600 leading-relaxed">
          Simule a criação dos documentos da LGPD decidindo as cláusulas
          importantes — cada escolha certa monta um documento melhor. É
          individual: cada um faz no próprio celular, no seu ritmo.
        </p>
      </header>

      <ul className="space-y-3">
        {MONTADOR_DOCS.map((d) => (
          <li key={d.id}>
            {d.disponivel ? (
              <Link
                href={`/dashboard/montador/${d.id}`}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition"
              >
                <span className="text-2xl leading-none">{d.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900">{d.titulo}</h2>
                  <p className="text-sm text-gray-500">{d.subtitulo}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 opacity-70">
                <span className="text-2xl leading-none grayscale">{d.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-600">{d.titulo}</h2>
                  <p className="text-sm text-gray-400">{d.subtitulo}</p>
                </div>
                <span className="shrink-0 rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-500">
                  em breve
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
        💡 Aqui você <strong>treina as decisões</strong>. A versão editável de
        cada documento, pronta pra preencher na sua instituição, está no{" "}
        <strong>Pacote de Modelos</strong> (Conteúdos Didáticos).
      </p>
    </div>
  );
}
