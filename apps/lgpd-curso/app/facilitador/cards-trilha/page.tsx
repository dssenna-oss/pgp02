import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

export const dynamic = "force-dynamic";

// Cards imprimíveis dos Desafios LGPD (Trilha do Conhecimento). 1 imagem por
// faixa de artigos, em public/cards-trilha/. Página só do facilitador (rota
// /facilitador → ADMIN no middleware): ele imprime e distribui antes do curso.
// Pra trocar um card: substituir o arquivo em public/cards-trilha/.
const CARDS = [
  { faixa: "Artigos 1º a 11", sub: "Disposições preliminares e bases legais", img: "/cards-trilha/art-1-11.png" },
  { faixa: "Artigos 12 a 20", sub: "Anonimização, crianças e direitos do titular", img: "/cards-trilha/art-12-20.png" },
  { faixa: "Artigos 21 a 30", sub: "Tratamento de dados pelo Poder Público", img: "/cards-trilha/art-21-30.png" },
  { faixa: "Artigos 31 a 40", sub: "Transferência internacional e agentes de tratamento", img: "/cards-trilha/art-31-40.png" },
  { faixa: "Artigos 41 a 50", sub: "Encarregado, responsabilidade e segurança", img: "/cards-trilha/art-41-50.png" },
  { faixa: "Artigos 51 a 65", sub: "Fiscalização, sanções e ANPD", img: "/cards-trilha/art-51-65.png" },
];

export default function CardsTrilhaPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <Link
        href="/facilitador"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
      </Link>

      <header className="mb-5">
        <div className="flex items-center gap-2.5">
          <Printer className="h-7 w-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Cards da Trilha (imprimir)</h1>
        </div>
        <p className="mt-2 leading-relaxed text-gray-600">
          Os 6 cards dos <strong>Desafios LGPD (artigos 1 a 65)</strong>. Cada painel descreve um
          artigo <em>sem dizer o número</em> — o grupo descobre e responde no celular em{" "}
          <strong>Atividades ao vivo → Desafio da faixa</strong>; o telão mostra os acertos ao vivo.
        </p>
        <div className="mt-3 rounded-lg border-l-4 border-l-amber-400 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          🖨️ Imprima em <strong>paisagem</strong>, <strong>1 jogo por grupo</strong>. Toque num card pra abrir em tamanho cheio e mandar imprimir.
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <a
            key={c.img}
            href={c.img}
            target="_blank"
            rel="noreferrer"
            className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.img}
              alt={`Card do Desafio LGPD — ${c.faixa}`}
              loading="lazy"
              className="w-full border-b border-gray-100"
            />
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <div className="font-bold text-gray-900">{c.faixa}</div>
                <div className="truncate text-xs text-gray-500">{c.sub}</div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-700 group-hover:text-indigo-800">
                <Printer className="h-3.5 w-3.5" /> Abrir / imprimir
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
