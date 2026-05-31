import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { DsrAdminClient, type DsrDTO } from "@/components/dsr-admin-client";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DsrPage() {
  const pedidos = await prisma.dataSubjectRequest.findMany({ orderBy: { receivedAt: "desc" } });

  const dtos: DsrDTO[] = pedidos.map((p) => ({
    id: p.id,
    protocolNumber: p.protocolNumber,
    origin: p.origin,
    titularName: p.titularName,
    titularCategory: p.titularCategory,
    requestedRights: p.requestedRights,
    detailedRequest: p.detailedRequest,
    receivedISO: p.receivedAt.toISOString().slice(0, 10),
    dueISO: p.dueDate.toISOString(),
    status: p.status,
    decision: p.decision,
    responseText: p.responseText,
  }));

  return (
    <>
      <Link href="/dashboard/execucao" className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-brand-600 mb-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Central de Instrumentos
      </Link>
      <PageHeader
        emoji="🙋"
        title="Direitos do Titular (DSR)"
        lead="Fase 6 — painel interno do Encarregado. O pedido entra pelo rito oficial (Ouvidoria → Acesso Identificado/NCD → e-tcees); aqui você controla o prazo legal de 15 dias, registra a resposta e gera o DOCX."
        action={
          <Link href="/direitos-titulares" target="_blank" className="inline-flex items-center gap-1.5 text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-3 py-2 hover:bg-gray-50">
            <ExternalLink className="w-4 h-4" /> Página de orientação ao titular
          </Link>
        }
      />
      <DsrAdminClient pedidos={dtos} />
    </>
  );
}
