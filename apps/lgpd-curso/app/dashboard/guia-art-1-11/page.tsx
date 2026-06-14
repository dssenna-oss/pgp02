// Guia LGPD — Artigos 1 a 11, versão pro CELULAR do participante.
//
// O Guia é uma página HTML estática (public/estrutura-lgpd/artigos-1-11.html)
// projetada no telão (conteudo:guia-art-1-11 → hrefTelao). Aberta direto no
// celular ela vira beco sem saída: é estática, sem barra do app nem faixa
// "No telão agora" → o participante não tem como voltar pro fluxo. Esta página
// embute o HTML num iframe DENTRO do app (mantendo a faixa do telão e um botão
// "voltar"), então em Modalidade C o celular espelha pra cá quando o
// facilitador projeta o Guia e segue sozinho quando ele avança pro Desafio.
//
// hrefAluno do id "guia-art-1-11" aponta pra cá (lib/conteudos-telao.ts).

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function GuiaArt1a11Page() {
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:text-indigo-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar à atividade
      </Link>
      <h1 className="mt-2 text-lg font-bold text-gray-900">
        📘 Guia LGPD — Artigos 1 a 11
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Mesmo material que está no telão. Role para ler no seu celular.
      </p>
      <iframe
        src="/estrutura-lgpd/artigos-1-11.html"
        title="Guia LGPD — Artigos 1 a 11"
        className="mt-3 w-full h-[78dvh] rounded-lg border border-gray-200 bg-white"
      />
    </div>
  );
}
