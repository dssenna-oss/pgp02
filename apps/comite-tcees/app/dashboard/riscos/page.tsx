import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { RiscosClient, type ProcessoComRiscos } from "@/components/riscos-client";

export const dynamic = "force-dynamic";

export default async function RiscosPage() {
  const processos = await prisma.dataInventory.findMany({
    orderBy: { ordem: "asc" },
    include: { riscos: { orderBy: { ordem: "asc" } } },
  });

  const dtos: ProcessoComRiscos[] = processos.map((p) => ({
    id: p.id,
    nome: p.nome,
    prioritario: p.prioritario,
    dadosSensiveis: p.dadosSensiveis,
    riscos: p.riscos.map((r) => ({
      id: r.id,
      inventoryId: r.inventoryId,
      descricao: r.descricao,
      probabilidade: r.probabilidade,
      impacto: r.impacto,
      recomendacao: r.recomendacao,
      status: r.status,
    })),
  }));

  return (
    <>
      <PageHeader
        emoji="⚠️"
        title="Análise de Riscos"
        lead="Fase 3 do PGP — avaliação de Probabilidade × Impacto por processo do Inventário, com matriz 3×3 e radar consolidado."
      />
      <RiscosClient processos={dtos} />
    </>
  );
}
