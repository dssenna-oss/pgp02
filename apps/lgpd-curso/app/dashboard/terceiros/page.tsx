import { PageHeader } from "@/components/page-header";
import { TerceirosList } from "./terceiros-list";
import { listOperadores } from "./actions";

export const dynamic = "force-dynamic";

export default async function TerceirosPage() {
  const operadores = await listOperadores();
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        missao="Missão 4a · Terceiros"
        titulo="Gestão de Terceiros (Operadores)"
        descricao="Pré-requisito do Aviso de Privacidade. Liste os operadores contratados e marque quais já têm cláusulas LGPD (Art. 39) nos contratos."
      />
      <TerceirosList items={operadores as any} />
    </div>
  );
}
