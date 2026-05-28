import { PageHeader } from "@/components/page-header";
import { BaseLegalCard } from "@/components/base-legal-card";
import { InventarioList } from "./inventario-list";
import { listInventarioWithUsers } from "./actions";
import { getSession } from "@/lib/auth-server";
import { turmaEmModoCards } from "@/lib/curso-permissoes";
import { ModoCardsBanner } from "@/components/modo-cards-banner";
import { FaseReadOnlyWrapper } from "@/components/fase-readonly-wrapper";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const session = await getSession();
  const modoCards = await turmaEmModoCards(session?.user?.companyId);
  const items = await listInventarioWithUsers();

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        missao="Missão 1 · Inventário"
        titulo="Inventário de Dados Pessoais"
        descricao="Cada Contribuidor preenche o processo que conhece (Saúde → Posto · RH → Estagiários). Depois SUBMETE ao DPO, que aprova ou devolve com motivo. Esta é a dinâmica real fora do curso."
      />
      <BaseLegalCard faseKey="inventario" />
      {modoCards && <ModoCardsBanner />}
      <FaseReadOnlyWrapper podeEditar={!modoCards}>
        <InventarioList items={items as any} />
      </FaseReadOnlyWrapper>
    </div>
  );
}
