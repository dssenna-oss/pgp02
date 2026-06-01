import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { NoticiasClient, type ArticleDTO } from "@/components/noticias-client";

export const dynamic = "force-dynamic";

export default async function NoticiasPage() {
  const artigos = await prisma.article.findMany({
    orderBy: [{ status: "asc" }, { publicadoEm: "desc" }, { updatedAt: "desc" }],
  });

  const dtos: ArticleDTO[] = artigos.map((a) => ({
    id: a.id,
    titulo: a.titulo,
    tipo: a.tipo,
    resumo: a.resumo,
    conteudo: a.conteudo,
    capaUrl: a.capaUrl,
    anexoTipo: a.anexoTipo,
    anexoUrl: a.anexoUrl,
    anexoNome: a.anexoNome,
    autor: a.autor,
    status: a.status,
    publicadoEmBR: a.publicadoEm ? new Date(a.publicadoEm).toLocaleDateString("pt-BR") : null,
  }));

  return (
    <>
      <PageHeader
        emoji="📣"
        title="Notícias & Artigos"
        lead="Comunicação do Comitê — divulgue ações, materiais educativos de proteção de dados e artigos. Conteúdo visível aos membros do Comitê."
      />
      <NoticiasClient artigos={dtos} />
    </>
  );
}
