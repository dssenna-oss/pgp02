// Montador Guiado — hub PÚBLICO/standalone (sem login, sem turma).
// Feito pra ser embutido (iframe) em apresentação online ou aberto por link/QR
// no celular do participante. Nada persiste no banco.
// A classe `pagina-embed` esconde o banner de treinamento e o rodapé globais
// (regra em globals.css) — dentro de um slide, cada pixel conta.

import Link from "next/link";
import { FileStack, ChevronRight } from "lucide-react";
import { MONTADOR_DOCS } from "@/lib/montador-docs";

export default function MontadorPublicoHubPage() {
  return (
    <div className="pagina-embed min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <div className="flex items-center gap-2.5">
            <FileStack className="h-7 w-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Monte seu documento</h1>
          </div>
          <p className="mt-2 text-gray-600 leading-relaxed">
            Simule a criação dos documentos da LGPD decidindo as cláusulas
            importantes — cada escolha certa monta um documento melhor. Faça no
            seu ritmo, direto do celular.
          </p>
        </header>

        <ul className="space-y-3">
          {MONTADOR_DOCS.filter((d) => d.disponivel).map((d) => (
            <li key={d.id}>
              <Link
                href={`/montador/${d.id}`}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition"
              >
                <span className="text-2xl leading-none">{d.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900">{d.titulo}</h2>
                  <p className="text-sm text-gray-500">{d.subtitulo}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
              </Link>
            </li>
          ))}
        </ul>

        <footer className="mt-8 text-center text-[11px] text-gray-400">
          Atividade de simulação — nenhum dado é coletado ou armazenado.
        </footer>
      </div>
    </div>
  );
}
