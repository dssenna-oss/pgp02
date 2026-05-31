import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { calcularTcuDiagnostico } from "@/lib/tcu-diagnostico";
import { AutoavaliacaoClient } from "@/components/autoavaliacao-client";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AutoavaliacaoPage() {
  const diag = await calcularTcuDiagnostico();
  return (
    <>
      <Link href="/dashboard/incidentes" className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-brand-600 mb-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Monitoramento
      </Link>
      <PageHeader
        emoji="🧭"
        title="Autoavaliação de Adequação à LGPD (TCU)"
        lead="Fase 7 — diagnóstico no padrão do TCU (Acórdão 1.384/2022): 9 dimensões, 42 controles. Muitas respostas já vêm preenchidas pelo que o app tem; o Comitê confirma o resto. Compara com a média das 382 organizações federais."
      />
      <AutoavaliacaoClient diag={diag} />
    </>
  );
}
