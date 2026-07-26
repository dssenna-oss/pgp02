// Montador Guiado de Documentos — hub (celular de cada participante).
// Diferente das "Atividades ao vivo" (grupo decide, DPO registra), aqui é
// INDIVIDUAL: cada participante monta o próprio documento no próprio celular.
// Nada é gravado no banco — o valor é a simulação + o placar pedagógico.

import Link from "next/link";
import { ArrowLeft, FileStack, BookOpen } from "lucide-react";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { MONTADOR_DOCS } from "@/lib/montador-docs";
import { getSaibaMais } from "@/lib/montador-saiba-mais";
import { atividadesDoDoc, hrefAtividade, CapaDoc, FaseChip } from "@/components/montador-atividade";

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

      {(() => {
        const docs = MONTADOR_DOCS.filter((d) => d.disponivel);
        const secoes = [
          { titulo: "🎯 Práticas das Fases 3 e 4", itens: docs.filter((d) => d.grupo === "praticas") },
          { titulo: "📄 Documentos da LGPD", itens: docs.filter((d) => d.grupo !== "praticas") },
        ];
        return secoes.map((s) => (
          <div key={s.titulo}>
            <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-gray-500 first:mt-0">
              {s.titulo}
            </h2>
            <ul className="space-y-4">
              {s.itens.map((d) => (
                <li key={d.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4">
                  <CapaDoc docId={d.id} className="mb-3 h-24 w-full rounded-lg object-cover" />
                  <div className="flex items-center gap-3">
                    <span className="text-2xl leading-none">{d.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="flex flex-wrap items-center gap-2 font-semibold text-gray-900">
                        {d.titulo} <FaseChip fase={d.fase} />
                      </h3>
                      <p className="text-sm text-gray-500">{d.subtitulo}</p>
                    </div>
                  </div>
                  {getSaibaMais(d.id) && (
                    <Link
                      href={`/dashboard/montador/${d.id}/saiba-mais`}
                      className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      <BookOpen className="h-4 w-4" /> Saiba mais — comece por aqui
                    </Link>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {atividadesDoDoc(d).map((a) => (
                      <Link
                        key={a.slug || "montar"}
                        href={hrefAtividade("/dashboard/montador", d.id, a.slug)}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        {a.emoji} {a.rotulo}
                      </Link>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ));
      })()}

      <p className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
        💡 Aqui você <strong>treina as decisões</strong>. A versão editável de
        cada documento, pronta pra preencher na sua instituição, está no{" "}
        <strong>Pacote de Modelos</strong> (Conteúdos Didáticos).
      </p>
    </div>
  );
}
