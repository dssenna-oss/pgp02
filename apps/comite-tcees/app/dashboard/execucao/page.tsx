import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ExecucaoClient, type InstrumentoDTO } from "@/components/execucao-client";
import { dataBR } from "@/lib/utils";
import { policyTypeForInstrumento } from "@/lib/policy-mono";

export const dynamic = "force-dynamic";

export default async function ExecucaoPage() {
  const [instrumentos, policies] = await Promise.all([
    prisma.instrumento.findMany({ orderBy: { ordem: "asc" } }),
    prisma.policy.findMany({ where: { instrumentoId: { not: null } }, select: { id: true, instrumentoId: true } }),
  ]);
  const policyPorInstrumento = new Map(policies.map((p) => [p.instrumentoId as string, p.id]));

  const dtos: InstrumentoDTO[] = instrumentos.map((i) => ({
    id: i.id, nome: i.nome, grupo: i.grupo, tipo: i.tipo, baseLegal: i.baseLegal,
    obrigatorio: i.obrigatorio, status: i.status, responsavel: i.responsavel,
    prazoISO: i.prazo ? new Date(i.prazo).toISOString().slice(0, 10) : null,
    prazoBR: i.prazo ? dataBR(i.prazo) : null,
    conteudoUrl: i.conteudoUrl, descricao: i.descricao,
    policyEditavel: policyTypeForInstrumento(i.nome) !== null,
    policyId: policyPorInstrumento.get(i.id) ?? null,
  }));

  return (
    <>
      <PageHeader
        emoji="🗂️"
        title="Execução — Central de Instrumentos"
        lead="Fase 6 do PGP — produção e acompanhamento dos documentos da jornada LGPD, agrupados em Documentos Públicos, Instrumentos Internos e Operadores & Direitos do Titular."
      />
      <ExecucaoClient instrumentos={dtos} />
    </>
  );
}
