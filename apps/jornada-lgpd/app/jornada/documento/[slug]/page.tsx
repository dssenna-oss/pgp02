// Página de um documento da Jornada — na E1 mostra o modelo na íntegra
// (quando usar · template · exemplo · minuta comentada) com copiar; o
// preenchimento automático com o Perfil chega na Etapa 2.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireInstituicao } from "@/lib/auth-server";
import { getModeloPacote } from "@/lib/modelos-pacote";
import { MdModelo, mdParaTextoPuro } from "@/components/modelos/md-modelo";
import { CopiarBtn } from "@/components/modelos/copiar-btn";

export const dynamic = "force-dynamic";

export default async function DocumentoPage({ params }: { params: { slug: string } }) {
  await requireInstituicao();
  const modelo = getModeloPacote(params.slug);
  if (!modelo) notFound();
  const numeroFmt = String(modelo.numero).padStart(2, "0");

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/jornada"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900"
        >
          <ArrowLeft className="h-4 w-4" /> Trilha
        </Link>
        <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-700">
          {modelo.fase}
        </span>
      </div>

      <header className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
          Modelo {numeroFmt} · {modelo.grupoNome}
        </p>
        <h1 className="mt-1 text-xl font-bold leading-snug text-gray-900">{modelo.titulo}</h1>
      </header>

      <p className="mt-3 rounded-xl border-l-4 border-l-amber-400 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        ⚙️ <strong>Em construção:</strong> em breve este documento sairá <strong>preenchido
        automaticamente</strong> com os dados do seu Perfil — e você baixará direto em Word. Por
        enquanto, use o modelo abaixo com o botão copiar.
      </p>

      <section className="mt-4 rounded-2xl border-l-4 border-l-sky-400 border border-sky-200 bg-sky-50 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-sky-800">ℹ️ Quando usar</h2>
        <div className="mt-1.5">
          <MdModelo md={modelo.quandoUsar} />
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-600">
            📄 O modelo (edite por cima)
          </h2>
          <CopiarBtn texto={mdParaTextoPuro(modelo.template)} rotulo="Copiar modelo" />
        </div>
        <div className="mt-3 border-t border-gray-100 pt-3">
          <MdModelo md={modelo.template} />
        </div>
      </section>

      <details className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60">
        <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-emerald-800">
          💡 Exemplo preenchido — veja como fica
        </summary>
        <div className="border-t border-emerald-100 px-4 py-3">
          <MdModelo md={modelo.exemplo} />
        </div>
      </details>

      {modelo.minuta && (
        <details className="mt-4 rounded-2xl border border-amber-300 bg-amber-50/70">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-amber-900">
            📝 Versão comentada — Kit de Minutas
          </summary>
          <div className="border-t border-amber-200 px-4 py-3">
            <p className="text-sm font-bold text-gray-900">{modelo.minuta.titulo}</p>
            <p className="mt-0.5 text-xs italic text-gray-600">{modelo.minuta.natureza}</p>
            <div className="mt-3">
              <MdModelo md={modelo.minuta.md} />
            </div>
            <div className="mt-3">
              <CopiarBtn texto={mdParaTextoPuro(modelo.minuta.md)} rotulo="Copiar minuta" />
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
