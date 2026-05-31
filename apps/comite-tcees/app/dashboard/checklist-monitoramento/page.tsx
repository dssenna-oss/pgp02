import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ChecklistMonitoramentoClient } from "@/components/checklist-monitoramento-client";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChecklistMonitoramentoPage() {
  const marcados = await prisma.monitoringCheck.findMany({ select: { itemId: true } });
  const feitos = marcados.map((m) => m.itemId);

  return (
    <>
      <Link href="/dashboard/incidentes" className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-brand-600 mb-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Monitoramento
      </Link>
      <PageHeader
        emoji="✅"
        title="Checklist de Monitoramento Contínuo"
        lead="Fase 7 — o que o Comitê deve fazer de forma contínua após a adequação: KPIs, auditorias, gestão de incidentes, revisão de documentos, acompanhamento legislativo, fornecedores, melhoria contínua e prestação de contas."
      />
      <ChecklistMonitoramentoClient feitos={feitos} />
    </>
  );
}
