import { PageHeader } from "@/components/page-header";
import { BaseLegalCard } from "@/components/base-legal-card";
import { RiscoList } from "./risco-list";
import { listRiscos, listInventoriesForSelect } from "./actions";

export const dynamic = "force-dynamic";

export default async function RiscosPage() {
  const [riscos, inventories] = await Promise.all([listRiscos(), listInventoriesForSelect()]);
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        missao="Missão 2 · Riscos"
        titulo="Análise de Riscos"
        descricao="Identifique 2-3 riscos por processo. Posicione cada um na matriz 3×3 Probabilidade × Impacto. Pense no cidadão — não no Tribunal."
      />
      <BaseLegalCard faseKey="fase-5" />
      <RiscoList riscos={riscos as any} inventories={inventories} />
    </div>
  );
}
