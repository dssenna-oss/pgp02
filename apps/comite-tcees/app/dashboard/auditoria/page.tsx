import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { AuditoriaClient, type AuditoriaDTO } from "@/components/auditoria-client";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditoriaPage() {
  const auditorias = await prisma.auditoria.findMany({
    orderBy: [{ dataPrevista: "asc" }, { createdAt: "asc" }],
    include: { achados: { orderBy: { ordem: "asc" } } },
  });

  const dtos: AuditoriaDTO[] = auditorias.map((a) => ({
    id: a.id, titulo: a.titulo, escopo: a.escopo, responsavel: a.responsavel,
    dataPrevistaISO: a.dataPrevista ? a.dataPrevista.toISOString().slice(0, 10) : null,
    dataRealizadaISO: a.dataRealizada ? a.dataRealizada.toISOString().slice(0, 10) : null,
    status: a.status, observacoes: a.observacoes,
    achados: a.achados.map((f) => ({
      id: f.id, auditoriaId: f.auditoriaId, descricao: f.descricao, severidade: f.severidade,
      naoConformidade: f.naoConformidade, recomendacao: f.recomendacao, planoAcao: f.planoAcao,
      prazoISO: f.prazo ? f.prazo.toISOString().slice(0, 10) : null, status: f.status,
    })),
  }));

  return (
    <>
      <Link href="/dashboard/incidentes" className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-brand-600 mb-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Monitoramento
      </Link>
      <PageHeader
        emoji="🔍"
        title="Auditoria Interna do PGP"
        lead="Fase 7 — planeje e registre as auditorias internas de proteção de dados: escopo, cronograma, achados (não conformidades) com severidade, recomendação e plano de ação."
      />
      <AuditoriaClient auditorias={dtos} />
    </>
  );
}
