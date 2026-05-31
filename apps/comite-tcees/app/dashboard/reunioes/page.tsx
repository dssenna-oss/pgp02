import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ReunioesClient, type ReuniaoDTO } from "@/components/reunioes-client";
import { dataBR } from "@/lib/utils";

export const dynamic = "force-dynamic";

function iso(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

export default async function ReunioesPage() {
  const reunioes = await prisma.reuniao.findMany({ orderBy: { data: "desc" } });

  const dtos: ReuniaoDTO[] = reunioes.map((r) => ({
    id: r.id,
    titulo: r.titulo,
    dataISO: iso(r.data),
    dataBR: dataBR(r.data),
    hora: r.hora,
    local: r.local,
    pauta: r.pauta,
    decisoes: r.decisoes,
    presentes: r.presentes,
    totalConvocados: r.totalConvocados,
    status: r.status,
    pautaAprovada: r.pautaAprovada,
    ataRegistrada: r.ataRegistrada,
    ataUrl: r.ataUrl,
  }));

  return (
    <>
      <PageHeader
        emoji="📝"
        title="Reuniões & Atas"
        lead="Histórico das reuniões do colegiado — pauta, participantes, decisões e ata. Agende e edite reuniões pelo botão ao lado."
      />
      <ReunioesClient reunioes={dtos} />
    </>
  );
}
