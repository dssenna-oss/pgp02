import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { marked } from "marked";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

marked.setOptions({ gfm: true, breaks: false });

async function getPolicy(slug: string) {
  return prisma.policy.findFirst({
    where: { slug, status: "PUBLICADA" },
    select: {
      title: true,
      publishedContent: true,
      publishedAt: true,
      currentVersion: true,
    },
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const policy = await getPolicy(params.slug);
  return { title: policy ? `${policy.title} — TCE-ES` : "Documento não encontrado" };
}

export default async function PublicPolicyPage({ params }: { params: { slug: string } }) {
  const [policy, comite] = await Promise.all([
    getPolicy(params.slug),
    prisma.comite.findFirst({ select: { instituicao: true, sigla: true } }),
  ]);
  if (!policy || !policy.publishedContent) notFound();

  const html = marked.parse(policy.publishedContent) as string;
  const inst = comite?.instituicao || "Tribunal de Contas do Estado do Espírito Santo";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-[#1e3a5f] text-white">
        <div className="max-w-3xl mx-auto px-5 py-5">
          <div className="text-[12px] uppercase tracking-wide opacity-80">{inst}</div>
          <h1 className="text-xl font-bold mt-1">{policy.title}</h1>
          <div className="text-[12px] opacity-80 mt-2">
            {policy.publishedAt && <>Publicado em {new Date(policy.publishedAt).toLocaleDateString("pt-BR")} · </>}
            Versão {policy.currentVersion}
          </div>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-5 py-8">
        <div
          className="prose prose-slate max-w-none bg-white rounded-xl border p-6 sm:p-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <p className="text-center text-[12px] text-slate-400 mt-6">
          Documento oficial do {comite?.sigla || "TCE-ES"} · Comitê Executivo de Proteção de Dados Pessoais
        </p>
      </article>
    </main>
  );
}
