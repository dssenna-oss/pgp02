import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ClausulasClient } from "@/components/clausulas-client";
import { tceesPlaceholders } from "@/lib/policy-mono";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClausulasPage() {
  const ph = await tceesPlaceholders();
  const company = {
    companyName: ph.companyName,
    cnpj: ph.cnpj ?? "",
    address: ph.address ?? "",
    dpoName: ph.dpoName ?? "",
    dpoEmail: ph.dpoEmail ?? "",
    dpoPhone: ph.dpoPhone ?? "",
  };

  return (
    <>
      <Link href="/dashboard/execucao" className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-brand-600 mb-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Central de Instrumentos
      </Link>
      <PageHeader
        emoji="📝"
        title="Cláusulas para Operadores"
        lead="Fase 6 — gera as cláusulas-padrão LGPD (art. 39) prontas para incluir em contrato ou termo aditivo. Escolha o modelo, preencha os dados do terceiro e baixe em Word."
      />
      <ClausulasClient company={company} />
    </>
  );
}
