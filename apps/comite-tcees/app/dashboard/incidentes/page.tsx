import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { IncidentesClient, type IncidenteDTO } from "@/components/incidentes-client";

export const dynamic = "force-dynamic";

const dtLocal = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 16) : null);

export default async function IncidentesPage() {
  const incidentes = await prisma.incident.findMany({ orderBy: [{ status: "asc" }, { ordem: "desc" }] });

  const dtos: IncidenteDTO[] = incidentes.map((i) => ({
    id: i.id, titulo: i.titulo, descricao: i.descricao, severidade: i.severidade, status: i.status,
    ocorridoISO: dtLocal(i.ocorridoEm), detectadoISO: dtLocal(i.detectadoEm),
    comunicadoAnpd: i.comunicadoAnpd, comunicadoTitular: i.comunicadoTitular,
    naturezaDados: i.naturezaDados, medidasMitigacao: i.medidasMitigacao,
  }));

  return (
    <>
      <PageHeader
        emoji="📡"
        title="Monitoramento — Incidentes de Segurança"
        lead="Fase 7 do PGP — registro e resposta a incidentes com o prazo de 72h para comunicação à ANPD (Res. CD/ANPD 15/2024), além do acompanhamento de KPIs, maturidade e auditoria."
      />
      <IncidentesClient incidentes={dtos} />
    </>
  );
}
