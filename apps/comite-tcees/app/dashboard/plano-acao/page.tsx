import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PlanoAcaoClient, type AcaoDTO, type EntregaCalDTO } from "@/components/plano-acao-client";
import { dataBR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlanoAcaoPage() {
  const [acoes, entregas] = await Promise.all([
    prisma.actionPlan.findMany({ orderBy: [{ status: "asc" }, { prazo: "asc" }, { ordem: "asc" }] }),
    prisma.entrega.findMany({ where: { prazoData: { not: null } }, orderBy: { prazoData: "asc" } }),
  ]);

  const acoesDto: AcaoDTO[] = acoes.map((a) => ({
    id: a.id, acao: a.acao, descricao: a.descricao, origem: a.origem,
    responsavel: a.responsavel,
    prazoISO: a.prazo ? new Date(a.prazo).toISOString().slice(0, 10) : null,
    prazoBR: a.prazo ? dataBR(a.prazo) : null,
    prioridade: a.prioridade, status: a.status,
  }));

  const entregasDto: EntregaCalDTO[] = entregas.map((e) => ({
    titulo: e.titulo, prazoBR: dataBR(e.prazoData!), eixoCodigo: e.eixoCodigo, status: e.status,
  }));

  return (
    <>
      <PageHeader
        emoji="🗂️"
        title="Plano de Ação e Adequação"
        lead="Fase 5 do PGP — consolida as lacunas do GAP Analysis e as recomendações de Riscos em ações, cruzando com o calendário de entregas do Plano de Trabalho."
      />
      <PlanoAcaoClient acoes={acoesDto} entregas={entregasDto} />
    </>
  );
}
