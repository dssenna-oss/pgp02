import { PageHeader } from "@/components/page-header";
import { InventarioList } from "./inventario-list";
import { listInventarioWithUsers } from "./actions";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const items = await listInventarioWithUsers();

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        missao="Missão 1 · Inventário"
        titulo="Inventário de Dados Pessoais"
        descricao="Cada Contribuidor preenche o processo que conhece (Saúde → Posto · RH → Estagiários). Depois SUBMETE ao DPO, que aprova ou devolve com motivo. Esta é a dinâmica real fora do curso."
      />
      <InventarioList items={items as any} />
    </div>
  );
}
