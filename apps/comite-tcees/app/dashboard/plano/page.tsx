import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PlanoBoard } from "@/components/plano-board";
import { AlinhamentoEstrategico } from "@/components/alinhamento-estrategico";
import { ferramentaDaEntrega } from "@/lib/entrega-ferramenta";

export const dynamic = "force-dynamic";

export default async function PlanoPage() {
  const entregas = await prisma.entrega.findMany({ orderBy: { ordem: "asc" } });
  return (
    <>
      <PageHeader
        emoji="🗓️"
        title="Plano de Trabalho"
        lead="Cronograma do biênio em 8 trimestres × 5 eixos."
        editHint="Adicione e edite entregas pelo botão ao lado — mudar o status atualiza o painel."
      />
      <AlinhamentoEstrategico />
      <PlanoBoard
        entregas={entregas.map((e) => ({
          id: e.id,
          titulo: e.titulo,
          descricao: e.descricao,
          eixoCodigo: e.eixoCodigo,
          trimestre: e.trimestre,
          responsavel: e.responsavel,
          prazoTexto: e.prazoTexto,
          prazoISO: e.prazoData ? new Date(e.prazoData).toISOString().slice(0, 10) : null,
          status: e.status,
          custo: e.custo,
          ferramenta: ferramentaDaEntrega(e.titulo),
        }))}
      />
    </>
  );
}
