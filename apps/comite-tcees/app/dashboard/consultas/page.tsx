import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ConsultasClient, type ConsultaDTO } from "@/components/consultas-client";
import { dataBR } from "@/lib/utils";

export const dynamic = "force-dynamic";

function iso(d: Date | null): string | null {
  return d ? new Date(d).toISOString().slice(0, 10) : null;
}

export default async function ConsultasPage() {
  const consultas = await prisma.consultaPrevia.findMany({ orderBy: { ordem: "asc" } });

  const dtos: ConsultaDTO[] = consultas.map((c) => ({
    id: c.id,
    titulo: c.titulo,
    area: c.area,
    descricao: c.descricao,
    parecerCju: c.parecerCju,
    status: c.status,
    abertaISO: iso(c.abertaEm),
    respondidaISO: iso(c.respondidaEm),
    abertaBR: c.abertaEm ? dataBR(c.abertaEm) : null,
    respondidaBR: c.respondidaEm ? dataBR(c.respondidaEm) : null,
  }));

  return (
    <>
      <PageHeader
        emoji="⚖️"
        title="Consulta prévia ao Comitê"
        lead="Registro das decisões que envolvem dados pessoais submetidas ao Comitê."
        editHint="Adicione e edite consultas pelo botão ao lado."
      />
      <ConsultasClient consultas={dtos} />
    </>
  );
}
