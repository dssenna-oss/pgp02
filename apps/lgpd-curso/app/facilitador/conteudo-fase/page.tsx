import Link from "next/link";
import { BookOpen, ChevronRight, Projector, Flag } from "lucide-react";
import { CONTEUDO_FASES, temConteudo } from "@/lib/conteudo-fases";

export default function ConteudoFasesIndexPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-1 text-xs uppercase tracking-wide text-gray-500 font-semibold">
        Facilitador · Conteúdo institucional
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Conteúdo das Fases</h1>
      <p className="text-sm text-gray-600 mt-1 mb-5">
        Conteúdo institucional adaptado do app principal{" "}
        <span className="font-mono text-gray-700">lgpd-pgp.vercel.app</span>. Cada fase é projetável
        antes da missão correspondente — Descrição da Fase, Como Proceder, Checklist de
        Implementação e Coloque em Prática. Cada página tem um botão{" "}
        <span className="inline-flex items-center gap-1 font-medium text-gray-700">
          <Projector className="h-3.5 w-3.5" />
          Modo projeção
        </span>{" "}
        que amplia o texto pra leitura à distância.
      </p>
      <div className="space-y-2">
        {CONTEUDO_FASES.map((f) => {
          const pronto = temConteudo(f);
          return (
            <Link
              key={f.slug}
              href={`/facilitador/conteudo-fase/${f.slug}`}
              className={`flex items-center gap-3 rounded-lg border p-4 transition-colors ${
                pronto ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100 opacity-75"
              }`}
            >
              <Flag className={`h-5 w-5 shrink-0 ${pronto ? "text-brand-600" : "text-gray-400"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-gray-900">{f.titulo}</div>
                  {!pronto && (
                    <span className="text-[10px] uppercase tracking-wide bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                      Em breve
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{f.missao}</div>
                <div className="text-sm text-gray-600 mt-0.5">{f.subtitulo}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
