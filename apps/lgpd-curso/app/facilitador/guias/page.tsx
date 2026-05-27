import Link from "next/link";
import { BookOpen, ChevronRight, Projector } from "lucide-react";
import { GUIAS } from "@/lib/guias-apoio";

export default function GuiasIndexPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-1 text-xs uppercase tracking-wide text-gray-500 font-semibold">
        Facilitador · Apoio
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Guias de apoio</h1>
      <p className="text-sm text-gray-600 mt-1 mb-5">
        Telas pensadas pra projetar na sala. Quando um grupo travar numa missão, abra o guia
        correspondente e projete — ele explica campo a campo como preencher, sem entregar a
        resposta pronta. Assim você ajuda todos os grupos de uma vez, sem ir de mesa em mesa.
        Cada guia tem um botão <span className="inline-flex items-center gap-1 font-medium text-gray-700"><Projector className="h-3.5 w-3.5" />Modo projeção</span> que amplia o texto.
      </p>
      <div className="space-y-2">
        {GUIAS.map((g) => (
          <Link
            key={g.slug}
            href={`/facilitador/guias/${g.slug}`}
            className="flex items-center gap-3 rounded-lg border bg-white p-4 hover:bg-gray-50 transition-colors"
          >
            <BookOpen className="h-5 w-5 text-brand-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900">{g.titulo}</div>
              <div className="text-xs text-gray-500">
                {g.missao} · {g.fase}
              </div>
              <div className="text-sm text-gray-600 mt-0.5">{g.resumo}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
