import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { DocumentosClient, type DocumentoDTO } from "@/components/documentos-client";

export const dynamic = "force-dynamic";

export default async function DocumentosPage() {
  const docs = await prisma.documento.findMany({ orderBy: { ordem: "asc" } });

  const dtos: DocumentoDTO[] = docs.map((d) => ({
    id: d.id,
    nome: d.nome,
    tipo: d.tipo,
    versao: d.versao,
    status: d.status,
    atualizadoEm: d.atualizadoEm,
    arquivoUrl: d.arquivoUrl,
  }));

  return (
    <>
      <PageHeader
        emoji="📁"
        title="Documentos do Comitê"
        lead="Repositório com versão e status de homologação. Adicione e edite documentos pelo botão ao lado."
      />
      <DocumentosClient documentos={dtos} />
    </>
  );
}
