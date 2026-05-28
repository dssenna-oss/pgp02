import { PageHeader } from "@/components/page-header";
import { BaseLegalCard } from "@/components/base-legal-card";
import { RiscoList } from "./risco-list";
import { listRiscos, listInventoriesForSelect } from "./actions";
import { getSession } from "@/lib/auth-server";
import { turmaEmModoCards } from "@/lib/curso-permissoes";
import { ModoCardsBanner } from "@/components/modo-cards-banner";
import { FaseReadOnlyWrapper } from "@/components/fase-readonly-wrapper";

export const dynamic = "force-dynamic";

export default async function RiscosPage() {
  const session = await getSession();
  const modoCards = await turmaEmModoCards(session?.user?.companyId);
  const [riscos, inventories] = await Promise.all([listRiscos(), listInventoriesForSelect()]);
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        missao="Missão 2 · Riscos"
        titulo="Análise de Riscos"
        descricao="Identifique 2-3 riscos por processo. Posicione cada um na matriz 3×3 Probabilidade × Impacto. Pense no cidadão — não no Tribunal."
      />
      <BaseLegalCard faseKey="fase-5" />
      {modoCards && <ModoCardsBanner />}
      <FaseReadOnlyWrapper podeEditar={!modoCards}>
        <RiscoList riscos={riscos as any} inventories={inventories} />
      </FaseReadOnlyWrapper>
    </div>
  );
}
