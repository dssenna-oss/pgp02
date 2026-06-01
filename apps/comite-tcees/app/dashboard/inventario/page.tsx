import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { InventarioClient, type InventarioDTO } from "@/components/inventario-client";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const processos = await prisma.dataInventory.findMany({ orderBy: { ordem: "asc" } });

  const dtos: InventarioDTO[] = processos.map((p) => ({
    id: p.id,
    nome: p.nome,
    unidadeGestora: p.unidadeGestora,
    hipoteseMacro: p.hipoteseMacro,
    finalidade: p.finalidade,
    baseLegal: p.baseLegal,
    tiposDados: p.tiposDados,
    dadosSensiveis: p.dadosSensiveis,
    retencao: p.retencao,
    compartilhamento: p.compartilhamento,
    medidasSeguranca: p.medidasSeguranca,
    prioritario: p.prioritario,
    status: p.status,
    observacoes: p.observacoes,
    categoriasTitulares: p.categoriasTitulares,
    fonteDados: p.fonteDados,
    destinatariosInternos: p.destinatariosInternos,
    transfInternacional: p.transfInternacional,
    criterioDescarte: p.criterioDescarte,
  }));

  return (
    <>
      <PageHeader
        emoji="🗂️"
        title="Inventário de Dados Pessoais"
        lead="Fase 3 do PGP — mapeamento das atividades de tratamento de dados pessoais do TCEES. Os 12 processos prioritários já estão registrados; adicione e edite pelo botão ao lado."
      />
      <InventarioClient processos={dtos} />
    </>
  );
}
