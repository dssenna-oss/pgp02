// Miolo compartilhado das atividades do montador (formatos 2, 3 e 4).
// Server component fino: cabeçalho + runner certo + navegação entre as
// atividades do documento. Usado pelos 2 contextos (público e dashboard).

import Link from "next/link";
import type { MontadorDoc, FormatoAtividade } from "@/lib/montador-docs";
import { formatosDoDoc } from "@/lib/montador-docs";
import { BlocosRunner } from "@/components/blocos-runner";
import { CacaErroRunner } from "@/components/caca-erro-runner";
import { OrdenarRunner } from "@/components/ordenar-runner";
import { MatrizRunner } from "@/components/matriz-runner";

export type AtividadeSlug = FormatoAtividade;

export const ATIVIDADES_DOC: { slug: AtividadeSlug; emoji: string; rotulo: string }[] = [
  { slug: "", emoji: "🧭", rotulo: "Montar decidindo" },
  { slug: "blocos", emoji: "🧩", rotulo: "Montar por blocos" },
  { slug: "erros", emoji: "🔍", rotulo: "Caça ao erro" },
  { slug: "ordem", emoji: "🔢", rotulo: "Ordenar as seções" },
  { slug: "matriz", emoji: "🎲", rotulo: "Matriz de risco" },
];

export function hrefAtividade(base: string, docId: string, slug: AtividadeSlug): string {
  return `${base}/${docId}${slug ? `/${slug}` : ""}`;
}

// Atividades que ESTE documento oferece (formatos são opcionais por doc).
export function atividadesDoDoc(doc: MontadorDoc) {
  const disponiveis = new Set(formatosDoDoc(doc));
  return ATIVIDADES_DOC.filter((a) => disponiveis.has(a.slug));
}

// Chips de navegação pras demais atividades do mesmo documento.
export function AtividadesDocLinks({
  base,
  doc,
  atual,
}: {
  base: string;
  doc: MontadorDoc;
  atual: AtividadeSlug;
}) {
  const outras = atividadesDoDoc(doc).filter((a) => a.slug !== atual);
  if (outras.length === 0) return null;
  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Outras atividades deste documento
      </p>
      <div className="flex flex-wrap gap-2">
        {outras.map((a) => (
          <Link
            key={a.slug || "montar"}
            href={hrefAtividade(base, doc.id, a.slug)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            {a.emoji} {a.rotulo}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Capa do documento (imagens em public/montador-capas/<docId>.webp).
export function CapaDoc({ docId, className }: { docId: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/montador-capas/${docId}.webp`}
      alt=""
      className={className ?? "mb-4 h-28 w-full rounded-xl border border-indigo-100 object-cover"}
    />
  );
}

// Cabeçalho + runner do formato pedido + navegação.
export function MontadorAtividade({
  doc,
  atividade,
  base,
}: {
  doc: MontadorDoc;
  atividade: Exclude<AtividadeSlug, "">;
  base: string;
}) {
  const meta = ATIVIDADES_DOC.find((a) => a.slug === atividade)!;
  return (
    <>
      <CapaDoc docId={doc.id} />
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          {doc.emoji} {doc.titulo}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          {meta.emoji} {meta.rotulo}
        </h1>
      </header>

      {atividade === "blocos" && <BlocosRunner doc={doc} />}
      {atividade === "erros" && <CacaErroRunner doc={doc} />}
      {atividade === "ordem" && <OrdenarRunner doc={doc} />}
      {atividade === "matriz" && <MatrizRunner doc={doc} />}

      <AtividadesDocLinks base={base} doc={doc} atual={atividade} />
    </>
  );
}
