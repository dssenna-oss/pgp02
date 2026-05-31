import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { MembrosClient, type MembroDTO } from "@/components/membros-client";

export const dynamic = "force-dynamic";

export default async function MembrosPage() {
  const membros = await prisma.membro.findMany({ orderBy: { ordem: "asc" } });

  const dtos: MembroDTO[] = membros.map((m) => ({
    id: m.id,
    nome: m.nome,
    funcao: m.funcao,
    cargo: m.cargo,
    unidade: m.unidade,
    matricula: m.matricula,
    inciso: m.inciso,
    email: m.email,
  }));

  return (
    <>
      <PageHeader
        emoji="👥"
        title="Membros do Comitê"
        lead="Composição e papéis. Adicione e edite integrantes pelo botão ao lado."
      />
      <MembrosClient membros={dtos} />
    </>
  );
}
