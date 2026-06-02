import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { tipoArtigo } from "@/lib/articles";

export const dynamic = "force-dynamic";

marked.setOptions({ gfm: true, breaks: false });

/** Página PÚBLICA de uma notícia/artigo (sem login). Só exibe se PUBLICADO. */
export default async function NoticiaPublicaPage({ params }: { params: { id: string } }) {
  const a = await prisma.article.findUnique({ where: { id: params.id } }).catch(() => null);
  if (!a || a.status !== "PUBLICADO") notFound();

  const html = marked.parse(a.conteudo || "") as string;
  const ti = tipoArtigo(a.tipo);
  const dataBR = a.publicadoEm ? new Date(a.publicadoEm).toLocaleDateString("pt-BR") : null;
  const temPdf = a.anexoTipo === "PDF" && !!a.anexoUrl;
  const temLink = a.anexoTipo === "URL" && !!a.anexoUrl;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-tcees text-white">
        <div className="max-w-3xl mx-auto px-5 py-4">
          <div className="text-[15px] font-extrabold">🏛️ Comitê LGPD · TCE-ES</div>
          <div className="text-[12px] text-blue-50/90">Comitê Executivo de Proteção de Dados Pessoais</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8">
        <article className="bg-white border rounded-xl overflow-hidden">
          {a.capaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.capaUrl} alt="" className="w-full h-56 object-cover bg-slate-100" />
          )}
          <div className="p-6">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-brand-700 bg-brand-50 rounded-full px-2.5 py-1">
              {ti.emoji} {ti.label}
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-3 leading-tight">{a.titulo}</h1>
            <div className="text-[12.5px] text-gray-400 mt-1.5">
              {a.autor ? `${a.autor} · ` : ""}{dataBR ?? ""}
            </div>
            {a.resumo && <p className="text-[15px] text-gray-600 mt-3 leading-relaxed">{a.resumo}</p>}

            {a.conteudo.trim() && (
              <article
                className="prose prose-sm sm:prose max-w-none mt-5 prose-headings:text-gray-900 prose-a:text-brand-700"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}

            {temPdf && (
              <div className="mt-6">
                <a
                  href={a.anexoUrl!}
                  download={a.anexoNome ?? "documento.pdf"}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-brand-700 hover:text-brand-800 mb-2"
                >
                  ⬇ Baixar {a.anexoNome ?? "documento PDF"}
                </a>
                <iframe src={a.anexoUrl!} title={a.anexoNome ?? "PDF"} className="w-full h-[70vh] border rounded-md bg-slate-100" />
              </div>
            )}

            {temLink && (
              <a
                href={a.anexoUrl!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700 mt-6"
              >
                ↗ {a.anexoNome?.trim() || "Acessar link"}
              </a>
            )}
          </div>
        </article>

        <p className="text-center text-[12px] text-gray-400 mt-6">
          Tribunal de Contas do Estado do Espírito Santo · Comitê Executivo de Proteção de Dados Pessoais
        </p>
      </main>
    </div>
  );
}
