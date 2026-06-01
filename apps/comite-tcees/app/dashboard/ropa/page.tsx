import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { riscoMaximo, type RopaAtividade, type RopaCabecalho } from "@/lib/ropa";
import { RopaClient } from "@/components/ropa-client";

export const dynamic = "force-dynamic";

export default async function RopaPage() {
  const [processos, comite, encarregado] = await Promise.all([
    prisma.dataInventory.findMany({
      orderBy: { ordem: "asc" },
      include: { riscos: { select: { probabilidade: true, impacto: true } } },
    }),
    prisma.comite.findFirst(),
    prisma.membro.findFirst({
      where: { funcao: { contains: "Encarregado" } },
      orderBy: { ordem: "asc" },
      select: { nome: true, email: true },
    }),
  ]);

  const atividades: RopaAtividade[] = processos.map((p) => ({
    id: p.id,
    nome: p.nome,
    unidadeGestora: p.unidadeGestora,
    finalidade: p.finalidade,
    baseLegal: p.baseLegal,
    tiposDados: p.tiposDados,
    dadosSensiveis: p.dadosSensiveis,
    categoriasTitulares: p.categoriasTitulares,
    fonteDados: p.fonteDados,
    compartilhamento: p.compartilhamento,
    destinatariosInternos: p.destinatariosInternos,
    transfInternacional: p.transfInternacional,
    retencao: p.retencao,
    criterioDescarte: p.criterioDescarte,
    medidasSeguranca: p.medidasSeguranca,
    riscoMax: riscoMaximo(p.riscos),
  }));

  const cabecalho: RopaCabecalho = {
    controlador: comite?.instituicao || "Tribunal de Contas do Estado do Espírito Santo — TCEES",
    cnpj: comite?.cnpj || "—",
    sede: comite?.sede || "—",
    encarregadoNome: encarregado?.nome || "—",
    encarregadoContato: encarregado?.email || comite?.canalEncarregado || "—",
  };

  return (
    <>
      <PageHeader
        emoji="📑"
        title="ROPA — Registro das Operações de Tratamento"
        lead="Fase 3 · Art. 37 da LGPD. Registro formal das atividades de tratamento, no formato do template ANPD. Lê as atividades do Inventário e os riscos avaliados — é o documento que a ANPD pode solicitar e o insumo para os RIPDs."
      />
      <RopaClient atividades={atividades} cabecalho={cabecalho} />
    </>
  );
}
