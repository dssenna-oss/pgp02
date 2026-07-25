// Montador Guiado — hub PÚBLICO/standalone (sem login, sem turma).
// Feito pra ser embutido (iframe) em apresentação online ou aberto por link/QR
// no celular do participante. Nada persiste no banco.
// A classe `pagina-embed` esconde o banner de treinamento e o rodapé globais
// (regra em globals.css) — dentro de um slide, cada pixel conta.

import Link from "next/link";
import { FileStack, BookOpen } from "lucide-react";
import { MONTADOR_DOCS, type MontadorDoc } from "@/lib/montador-docs";
import { getSaibaMais } from "@/lib/montador-saiba-mais";
import { atividadesDoDoc, hrefAtividade, CapaDoc } from "@/components/montador-atividade";

function CardDoc({ d, base }: { d: MontadorDoc; base: string }) {
  return (
    <li className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4">
      <CapaDoc docId={d.id} className="mb-3 h-24 w-full rounded-lg object-cover" />
      <div className="flex items-center gap-3">
        <span className="text-2xl leading-none">{d.emoji}</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-gray-900">{d.titulo}</h2>
          <p className="text-sm text-gray-500">{d.subtitulo}</p>
        </div>
      </div>
      {getSaibaMais(d.id) && (
        <Link
          href={`${base}/${d.id}/saiba-mais`}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
        >
          <BookOpen className="h-4 w-4" /> Saiba mais — comece por aqui
        </Link>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        {atividadesDoDoc(d).map((a) => (
          <Link
            key={a.slug || "montar"}
            href={hrefAtividade(base, d.id, a.slug)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          >
            {a.emoji} {a.rotulo}
          </Link>
        ))}
      </div>
    </li>
  );
}

export default function MontadorPublicoHubPage() {
  const docs = MONTADOR_DOCS.filter((d) => d.disponivel);
  const documentos = docs.filter((d) => d.grupo !== "praticas");
  const praticas = docs.filter((d) => d.grupo === "praticas");
  return (
    <div className="pagina-embed min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <CapaDoc docId="hub" className="mb-5 h-36 w-full rounded-2xl border border-indigo-100 object-cover" />

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

        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          🎯 Práticas das Fases 3 e 4
        </h2>
        <ul className="space-y-4">
          {praticas.map((d) => (
            <CardDoc key={d.id} d={d} base="/montador" />
          ))}
        </ul>

        <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-gray-500">
          📄 Documentos da LGPD
        </h2>
        <ul className="space-y-4">
          {documentos.map((d) => (
            <CardDoc key={d.id} d={d} base="/montador" />
          ))}
        </ul>

        <p className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          🎮 Quer treinar jogando? Visite os{" "}
          <Link href="/jogos" className="font-semibold text-indigo-700 hover:underline">
            Jogos da LGPD
          </Link>{" "}
          — crise com relógio, chat do titular, detetive e mais.
        </p>

        <footer className="mt-8 text-center text-[11px] text-gray-400">
          Atividade de simulação — nenhum dado é coletado ou armazenado.
        </footer>
      </div>
    </div>
  );
}
