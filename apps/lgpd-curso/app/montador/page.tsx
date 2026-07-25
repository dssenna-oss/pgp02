// Montador Guiado — hub PÚBLICO/standalone (sem login, sem turma).
// Feito pra ser embutido (iframe) em apresentação online ou aberto por link/QR
// no celular do participante. Nada persiste no banco.
// A classe `pagina-embed` esconde o banner de treinamento e o rodapé globais
// (regra em globals.css) — dentro de um slide, cada pixel conta.

import Link from "next/link";
import { FileStack } from "lucide-react";
import { MONTADOR_DOCS } from "@/lib/montador-docs";
import { ATIVIDADES_DOC, hrefAtividade } from "@/components/montador-atividade";

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

        <ul className="space-y-4">
          {MONTADOR_DOCS.filter((d) => d.disponivel).map((d) => (
            <li key={d.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none">{d.emoji}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-gray-900">{d.titulo}</h2>
                  <p className="text-sm text-gray-500">{d.subtitulo}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {ATIVIDADES_DOC.map((a) => (
                  <Link
                    key={a.slug || "montar"}
                    href={hrefAtividade("/montador", d.id, a.slug)}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {a.emoji} {a.rotulo}
                  </Link>
                ))}
              </div>
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
