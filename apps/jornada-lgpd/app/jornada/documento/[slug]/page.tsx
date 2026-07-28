// Página de um documento da Jornada (E2): perguntas específicas → prévia
// PREENCHIDA com o Perfil + respostas → Baixar em Word → marcar como pronto.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireInstituicao } from "@/lib/auth-server";
import { getModeloPacote } from "@/lib/modelos-pacote";
import { getConfigDoc } from "@/lib/documentos-config";
import { montarDocumentoPreenchido } from "@/lib/preencher";
import { MdModelo, mdParaTextoPuro } from "@/components/modelos/md-modelo";
import { CopiarBtn } from "@/components/modelos/copiar-btn";
import { salvarRespostas, definirStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function DocumentoPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { ok?: string; pronto?: string };
}) {
  const { instituicaoId } = await requireInstituicao();
  const modelo = getModeloPacote(params.slug);
  if (!modelo) notFound();

  const inst = await prisma.instituicao.findUnique({ where: { id: instituicaoId } });
  if (!inst) return <p className="text-sm text-rose-700">Instituição não encontrada.</p>;

  const registro = await prisma.documentoResposta.findUnique({
    where: { instituicaoId_numeroModelo: { instituicaoId, numeroModelo: modelo.numero } },
  });
  const respostas = (registro?.respostas ?? {}) as Record<string, string>;
  const status = registro?.status ?? "rascunho";

  const config = getConfigDoc(modelo.numero);
  const { md, totalCampos, preenchidos } = montarDocumentoPreenchido(modelo, inst, respostas);
  const numeroFmt = String(modelo.numero).padStart(2, "0");
  const faltam = totalCampos - preenchidos;

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

      {searchParams.ok && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          ✅ Respostas salvas — a prévia abaixo já está atualizada.
        </p>
      )}
      {searchParams.pronto && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          ✅ Documento marcado como pronto — a trilha reflete isso.
        </p>
      )}

      {/* Perguntas específicas */}
      {config && config.perguntas.length > 0 ? (
        <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-600">
            ✍️ Perguntas deste documento
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            O que o Perfil não cobre. Salve — a prévia atualiza na hora.
          </p>
          <form action={salvarRespostas} className="mt-3 space-y-3">
            <input type="hidden" name="slug" value={modelo.slug} />
            {config.perguntas.map((p) => (
              <label key={p.id} className="block">
                <span className="text-xs font-semibold text-gray-700">{p.label}</span>
                {p.dica && <span className="block text-[11px] text-gray-400">{p.dica}</span>}
                {p.tipo === "textarea" ? (
                  <textarea
                    name={p.id}
                    defaultValue={respostas[p.id] ?? ""}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm"
                  />
                ) : (
                  <input
                    name={p.id}
                    defaultValue={respostas[p.id] ?? ""}
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm"
                  />
                )}
              </label>
            ))}
            <button
              type="submit"
              className="rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-teal-800"
            >
              Salvar respostas
            </button>
          </form>
        </section>
      ) : !config ? (
        <p className="mt-4 rounded-xl border-l-4 border-l-amber-400 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ⚙️ As perguntas específicas deste documento chegam na próxima etapa da construção — o
          seu Perfil já preenche o que dá, e o Word já sai abaixo.
        </p>
      ) : null}

      {/* Prévia preenchida */}
      <section className="mt-4 rounded-2xl border border-teal-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-teal-800">
            📄 Seu documento (prévia preenchida)
          </h2>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${
              faltam === 0
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {preenchidos}/{totalCampos} CAMPOS
          </span>
        </div>
        {faltam > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            O que ficou <span className="rounded bg-amber-100 px-1 font-medium text-amber-900">[EM ÂMBAR]</span>{" "}
            ainda precisa da sua mão — complete o Perfil ou as perguntas acima; no Word esses
            campos saem em vermelho.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2 border-b border-gray-100 pb-3">
          <a
            href={`/api/documento/${modelo.slug}/docx`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800"
          >
            <FileDown className="h-4 w-4" /> Baixar em Word
          </a>
          <CopiarBtn texto={mdParaTextoPuro(md)} rotulo="Copiar texto" />
          <form action={definirStatus}>
            <input type="hidden" name="slug" value={modelo.slug} />
            <input type="hidden" name="status" value={status === "pronto" ? "rascunho" : "pronto"} />
            <button
              type="submit"
              className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                status === "pronto"
                  ? "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                  : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              {status === "pronto" ? "↩ Voltar pra rascunho" : "✅ Marcar como pronto"}
            </button>
          </form>
        </div>
        <div className="mt-3">
          <MdModelo md={md} />
        </div>
      </section>

      {/* Referências */}
      <details className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60">
        <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-emerald-800">
          💡 Exemplo preenchido do curso — veja como fica
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
